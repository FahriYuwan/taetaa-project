import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType, Channel } from '@prisma/client';

function parseRp(val: string): number {
  if (!val) return 0;
  return parseFloat(val.trim().replace(/[^0-9.-]/g, '')) || 0;
}

function parseDate(val: string): Date {
  // Handle formats like "1-Agu", "2025-08-01", "8/1/2025"
  const str = val.trim();

  // ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return new Date(str);
  }

  // Indonesian short date: "1-Agu", "15-Sep", "1-Jan"
  const idMonths: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5,
    jul: 6, agu: 7, sep: 8, okt: 9, nov: 10, des: 11,
  };
  const idMatch = str.match(/^(\d+)-([A-Za-z]+)(?:-(\d+))?$/);
  if (idMatch) {
    const day = parseInt(idMatch[1]);
    const monthKey = idMatch[2].toLowerCase();
    const year = idMatch[3] ? parseInt(idMatch[3]) : new Date().getFullYear();
    const month = idMonths[monthKey];
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }

  // Try general parsing
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  return new Date();
}

// POST /api/sales/bulk
// Finance bulk paste - matches with existing logistic scan data or creates new records
// Format: NO\tORDER CODE\tDATE\tSKU CODE\tPRODUCT\tQTY\tPRICE\tVOUCHER\tDISCOUNT\tPLATFORM FEE\tSHIPPING FEE\tOMSET\tHPP\tTOTAL HPP\tLABA
export async function POST(req: Request) {
  try {
    const { text, channel } = await req.json();
    if (!text) return NextResponse.json({ error: 'No data' }, { status: 400 });

    const lines = text.trim().split('\n').filter((l: string) => l.trim());

    // Skip header row if present (check if first cell is "NO" or a number)
    const dataLines = lines.filter((line: string) => {
      const firstCell = line.split('\t')[0]?.trim().toUpperCase();
      return firstCell !== 'NO' && firstCell !== '' && !firstCell.startsWith('TOTAL');
    });

    let matchedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;
    let discrepancyCount = 0;
    const errors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const line of dataLines) {
        const cols = line.split('\t');
        // Mendukung Format 16 Kolom Baru:
        // NO | ORDER CODE | NO RESI | DATE | SKU CODE | PRODUCT | QTY | PRICE | VOUCHER | DISCOUNT | PLATFORM FEE | SHIPPING FEE | OMSET | HPP | TOTAL HPP | LABA
        // Serta mendukung fallback Format 15 Kolom Lama:
        // NO | ORDER CODE | DATE | SKU CODE | PRODUCT | QTY | PRICE | VOUCHER | DISCOUNT | PLATFORM FEE | SHIPPING FEE | OMSET | HPP | TOTAL HPP | LABA

        let orderCode = '';
        let resiStr = '';
        let dateStr = '';
        let skuCode = '';
        let _product = '';
        let qtyStr = '';
        let priceStr = '';
        let voucherStr = '';
        let discountStr = '';
        let platformFeeStr = '';
        let shippingFeeStr = '';
        let omsetStr = '';
        let hppStr = '';
        let totalHppStr = '';
        let labaStr = '';

        if (cols.length >= 16) {
          // Format 16 kolom baru
          [
            ,
            orderCode,
            resiStr,
            dateStr,
            skuCode,
            _product,
            qtyStr,
            priceStr,
            voucherStr,
            discountStr,
            platformFeeStr,
            shippingFeeStr,
            omsetStr,
            hppStr,
            totalHppStr,
            labaStr,
          ] = cols;
        } else {
          // Format 15 kolom lama
          [
            ,
            orderCode,
            dateStr,
            skuCode,
            _product,
            qtyStr,
            priceStr,
            voucherStr,
            discountStr,
            platformFeeStr,
            shippingFeeStr,
            omsetStr,
            hppStr,
            totalHppStr,
            labaStr,
          ] = cols;
          resiStr = orderCode; // Di format lama, resi sering diisikan di orderCode
        }

        if (!orderCode?.trim() && !resiStr?.trim()) {
          skippedCount++;
          continue;
        }
        if (!skuCode?.trim()) {
          skippedCount++;
          continue;
        }

        const orderIdClean = orderCode?.trim() || null;
        const resiClean = resiStr?.trim() || null;
        const skuCodeClean = skuCode.trim().toUpperCase();
        const qty = parseFloat(qtyStr?.trim() || '0') || 0;
        const unitPrice = parseRp(priceStr || '0');
        const voucher = parseRp(voucherStr || '0');
        const discount = parseRp(discountStr || '0');
        const platformFee = parseRp(platformFeeStr || '0');
        const shippingFee = parseRp(shippingFeeStr || '0');
        const omset = parseRp(omsetStr || '0');
        const hpp = parseRp(hppStr || '0');
        const totalHpp = parseRp(totalHppStr || '0');
        const laba = parseRp(labaStr || '0');
        const date = parseDate(dateStr || '');

        // Calculate derived values
        const total = qty * unitPrice;
        const totalFee = platformFee + shippingFee;
        const netRevenue = omset > 0 ? omset : total - voucher - discount - totalFee;

        // Find SKU
        const sku = await tx.sKU.findUnique({ where: { code: skuCodeClean } });
        if (!sku) {
          errors.push(`SKU "${skuCodeClean}" tidak ditemukan`);
          skippedCount++;
          continue;
        }

        // Try to match with existing logistic scan data
        // Prioritas matching: resi fisik logistik, atau fallback ke orderId
        const existingSale = await tx.sale.findFirst({
          where: {
            skuId: sku.id,
            scannedByLogistic: true,
            financeMatched: false,
            OR: [
              ...(resiClean ? [{ resi: resiClean }, { orderId: resiClean }] : []),
              ...(orderIdClean ? [{ orderId: orderIdClean }, { resi: orderIdClean }] : []),
            ],
          },
        });

        if (existingSale) {
          // MATCH: Update existing sale with finance data
          const hasQtyDiscrepancy = Math.abs(existingSale.qty - qty) > 0.001;

          if (hasQtyDiscrepancy) {
            // ADR Decision 2: qty mismatch → flag for human confirmation.
            // DO NOT set financeMatched=true. Store financial data as draft
            // but hold the record in SELISIH_QTY status.
            errors.push(
              `Resi ${resiClean || orderIdClean} (${skuCodeClean}): Selisih Qty — Logistik ${existingSale.qty} unit vs Finance ${qty} unit. Menunggu konfirmasi.`
            );
            discrepancyCount++;

            await tx.sale.update({
              where: { id: existingSale.id },
              data: {
                orderId: orderIdClean || existingSale.orderId,
                resi: resiClean || existingSale.resi,
                // Store incoming finance values as draft (using logistic qty for stock-safe fields)
                unitPrice,
                voucher,
                discount,
                platformFee,
                shippingFee,
                fee: platformFee + shippingFee,
                // Mark discrepancy — intentionally NOT setting financeMatched: true
                hasDiscrepancy: true,
                status: 'SELISIH_QTY',
                notes: `⚠️ SELISIH QTY: Logistik ${existingSale.qty} unit, Finance lapor ${qty} unit. Menunggu konfirmasi sebelum rekonsiliasi final.`,
              },
            });
          } else {
            // No discrepancy — safe to fully reconcile
            const effectiveQty = existingSale.qty; // physical warehouse qty is the source of truth
            const totalVal = effectiveQty * unitPrice;
            const netRev = omset > 0 ? omset : totalVal - voucher - discount - (platformFee + shippingFee);
            const effTotalHpp = totalHpp > 0 ? totalHpp : effectiveQty * (existingSale.hpp || sku.hppPrice || 0);
            const computedLaba = laba !== 0 ? laba : netRev - effTotalHpp;

            await tx.sale.update({
              where: { id: existingSale.id },
              data: {
                date,
                orderId: orderIdClean || existingSale.orderId,
                resi: resiClean || existingSale.resi,
                unitPrice,
                total: totalVal,
                voucher,
                discount,
                platformFee,
                shippingFee,
                fee: platformFee + shippingFee,
                omset: netRev,
                netRevenue: netRev,
                hpp: hpp > 0 ? hpp : existingSale.hpp,
                totalHpp: effTotalHpp,
                laba: computedLaba,
                financeMatched: true,
                hasDiscrepancy: false,
                notes: existingSale.notes,
              },
            });
            matchedCount++;
          }
        } else {
          // NO MATCH: Check if already fully entered (prevent duplicate)
          const duplicate = await tx.sale.findFirst({
            where: {
              skuId: sku.id,
              financeMatched: true,
              OR: [
                ...(resiClean ? [{ resi: resiClean }] : []),
                ...(orderIdClean ? [{ orderId: orderIdClean }] : []),
              ],
            },
          });
          if (duplicate) {
            skippedCount++;
            continue;
          }

          // Determine channel for new record
          let saleChannel: Channel = Channel.SHOPEE;
          if (channel) {
            saleChannel = channel.toUpperCase() as Channel;
          }

          // Check stock for new record
          const costHistory = await tx.sKUCostHistory.findUnique({ where: { skuId: sku.id } });
          if (!costHistory || costHistory.stock < qty) {
            errors.push(`Stok ${skuCodeClean} tidak cukup (tersedia: ${costHistory?.stock ?? 0}, diminta: ${qty})`);
            skippedCount++;
            continue;
          }

          const hppPerUnit = costHistory.avgCost ?? sku.hppPrice ?? 0;
          const computedHpp = hpp > 0 ? hpp : qty * hppPerUnit;
          const computedTotalHpp = totalHpp > 0 ? totalHpp : computedHpp;

          // Create new sale
          const sale = await tx.sale.create({
            data: {
              date,
              skuId: sku.id,
              qty,
              unitPrice,
              total,
              channel: saleChannel,
              orderId: orderIdClean,
              resi: resiClean,
              fee: totalFee,
              netRevenue,
              voucher,
              discount,
              platformFee,
              shippingFee,
              omset: netRevenue,
              hpp: computedHpp,
              totalHpp: computedTotalHpp,
              laba,
              status: 'TERKIRIM' as any,
              scannedByLogistic: false,
              financeMatched: true,
            },
          });

          // Inventory movement
          await tx.inventory.create({
            data: {
              date,
              skuId: sku.id,
              movement: -qty,
              type: MovementType.SALE,
              reference: sale.id,
            },
          });

          // Deduct stock
          await tx.sKUCostHistory.update({
            where: { skuId: sku.id },
            data: { stock: { decrement: qty } },
          });

          createdCount++;
        }
      }
    });

    const message = [
      matchedCount > 0 ? `${matchedCount} data dicocokkan dengan scan logistik` : '',
      createdCount > 0 ? `${createdCount} data baru dibuat` : '',
      discrepancyCount > 0 ? `${discrepancyCount} data ditandai SELISIH QTY (perlu konfirmasi)` : '',
      skippedCount > 0 ? `${skippedCount} baris dilewati` : '',
    ]
      .filter(Boolean)
      .join(', ');

    return NextResponse.json({
      success: true,
      matched: matchedCount,
      created: createdCount,
      discrepancies: discrepancyCount,
      skipped: skippedCount,
      errors,
      message: message || 'Tidak ada data yang diproses',
    });
  } catch (error: any) {
    console.error('Bulk sale import error:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengimpor data' }, { status: 500 });
  }
}
