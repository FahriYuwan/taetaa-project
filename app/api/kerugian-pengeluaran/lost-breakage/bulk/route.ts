import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType, BreakageCategory } from '@prisma/client';
import { parseRupiahNumber } from '@/lib/finance';

function parseBreakageCategory(val?: string): BreakageCategory {
  if (!val) return BreakageCategory.RUSAK;
  const u = val.toUpperCase().trim().replace(/[-\s]/g, '_');
  if (u.includes('QC') || u.includes('GAGAL')) return BreakageCategory.GAGAL_QC;
  if (u.includes('HILANG') || u.includes('LOST')) return BreakageCategory.HILANG;
  if (u.includes('RUSAK') || u.includes('BROKEN') || u.includes('BREAK')) return BreakageCategory.RUSAK;
  if (u.includes('LAIN')) return BreakageCategory.LAINNYA;
  return BreakageCategory.LAINNYA;
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Data tidak boleh kosong' }, { status: 400 });
    }

    const lines = text.trim().split('\n');
    let skippedCount = 0;
    const errors: string[] = [];

    const results = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const cols = line.split('\t');
        if (cols.length < 3) {
          skippedCount++;
          continue;
        }

        const dateStr = cols[0];
        const skuCode = cols[1];
        const qtyStr = cols[2];

        const firstColUpper = dateStr?.trim().toUpperCase() || '';
        const secondColUpper = skuCode?.trim().toUpperCase() || '';

        // Abaikan baris header spreadsheet
        if (
          firstColUpper.startsWith('TANGGAL') ||
          firstColUpper.startsWith('DATE') ||
          firstColUpper.startsWith('NO') ||
          secondColUpper.startsWith('KODE') ||
          secondColUpper.startsWith('SKU')
        ) {
          continue;
        }

        const itemCode = skuCode?.trim();
        if (!itemCode) {
          skippedCount++;
          continue;
        }

        const sku = await tx.sKU.findUnique({ where: { code: itemCode } });
        if (!sku) {
          errors.push(`SKU "${itemCode}" tidak ditemukan di database`);
          skippedCount++;
          continue;
        }

        const parsedDate = new Date(dateStr.trim());
        const date = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        const cleanQty = parseFloat(qtyStr.trim().replace(',', '.'));
        const qty = isNaN(cleanQty) || cleanQty <= 0 ? 0 : cleanQty;

        if (qty <= 0) {
          errors.push(`SKU "${itemCode}": Qty kerugian (${qty}) tidak valid`);
          skippedCount++;
          continue;
        }

        let category: BreakageCategory = BreakageCategory.RUSAK;
        let unitPrice = 0;
        let notes = '';

        const costHistory = await tx.sKUCostHistory.findUnique({ where: { skuId: sku.id } });
        const currentAvgCost = costHistory?.avgCost ?? sku.hppPrice ?? 0;

        if (cols.length >= 6) {
          // Format 6 kolom: TANGGAL [TAB] KODE [TAB] QTY [TAB] KATEGORI [TAB] HARGA [TAB] CATATAN
          category = parseBreakageCategory(cols[3]);
          unitPrice = cols[4] ? parseRupiahNumber(cols[4]) : currentAvgCost;
          notes = cols[5]?.trim() || '';
        } else if (cols.length === 5) {
          // Format 5 kolom: bisa TANGGAL [TAB] KODE [TAB] QTY [TAB] KATEGORI [TAB] CATATAN
          // atau TANGGAL [TAB] KODE [TAB] QTY [TAB] HARGA [TAB] CATATAN
          const col3Trim = cols[3]?.trim() || '';
          const isNumericPrice = /^[0-9.,Rp\s]+$/.test(col3Trim) && !/[a-zA-Z]{3,}/.test(col3Trim);

          if (isNumericPrice) {
            unitPrice = parseRupiahNumber(col3Trim);
            category = BreakageCategory.RUSAK;
          } else {
            category = parseBreakageCategory(col3Trim);
            unitPrice = currentAvgCost;
          }
          notes = cols[4]?.trim() || '';
        } else if (cols.length === 4) {
          // Format 4 kolom: TANGGAL [TAB] KODE [TAB] QTY [TAB] CATATAN
          category = BreakageCategory.RUSAK;
          unitPrice = currentAvgCost;
          notes = cols[3]?.trim() || '';
        } else {
          category = BreakageCategory.RUSAK;
          unitPrice = currentAvgCost;
        }

        if (unitPrice <= 0) {
          unitPrice = currentAvgCost;
        }

        const total = qty * unitPrice;

        const breakage = await tx.breakage.create({
          data: {
            date,
            skuId: sku.id,
            qty,
            unitPrice,
            total,
            notes: notes || 'Bulk Import',
            category,
          },
        });

        await tx.inventory.create({
          data: {
            date,
            skuId: sku.id,
            movement: -qty,
            type: MovementType.BREAKAGE,
            reference: breakage.id,
          },
        });

        if (costHistory) {
          await tx.sKUCostHistory.update({
            where: { skuId: sku.id },
            data: { stock: { decrement: qty } },
          });
        }

        count++;
      }
      return count;
    });

    const msg = [
      `${results} data kerugian berhasil diimpor`,
      skippedCount > 0 ? `${skippedCount} baris dilewati` : '',
    ].filter(Boolean).join(', ');

    return NextResponse.json({
      success: true,
      count: results,
      skipped: skippedCount,
      errors,
      message: msg,
    });
  } catch (error: any) {
    console.error('Bulk breakage error:', error);
    return NextResponse.json({ error: error.message || 'Gagal impor data kerugian' }, { status: 500 });
  }
}