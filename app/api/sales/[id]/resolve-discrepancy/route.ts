import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';

// POST /api/sales/[id]/resolve-discrepancy
// Finance confirms a SELISIH_QTY record.
//
// Two resolution modes (ADR Decision 2 & 3):
//   mode: "accept_logistic"  — Keep warehouse qty as-is. Apply finance financial values.
//                              No stock movement needed (stock was already cut at scan time).
//   mode: "accept_finance"   — Finance qty is correct. Adjust stock to match finance qty.
//                              Creates a corrective inventory movement for the difference.
//
// Body: {
//   mode: "accept_logistic" | "accept_finance",
//   // Finance financial values to apply:
//   unitPrice?: number, voucher?: number, discount?: number,
//   platformFee?: number, shippingFee?: number,
//   omset?: number, hpp?: number, totalHpp?: number, laba?: number,
//   financeQty?: number,  // required when mode = "accept_finance"
//   notes?: string,
// }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { mode } = body;

    if (!mode || !['accept_logistic', 'accept_finance'].includes(mode)) {
      return NextResponse.json(
        { error: 'mode harus "accept_logistic" atau "accept_finance"' },
        { status: 400 }
      );
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { sku: { select: { id: true, code: true, name: true, hppPrice: true } } },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Data penjualan tidak ditemukan' }, { status: 404 });
    }

    if (!sale.hasDiscrepancy) {
      return NextResponse.json(
        { error: 'Record ini tidak berstatus discrepancy' },
        { status: 400 }
      );
    }

    const resolved = await prisma.$transaction(async (tx) => {
      if (mode === 'accept_logistic') {
        // ADR Decision 2: physical warehouse qty is the source of truth.
        // No stock movement needed — already cut at logistic scan time.
        // Just apply finance financial values and mark as reconciled.
        const effectiveQty = sale.qty;
        const unitPrice = body.unitPrice ?? sale.unitPrice;
        const voucher = body.voucher ?? sale.voucher;
        const discount = body.discount ?? sale.discount;
        const platformFee = body.platformFee ?? sale.platformFee;
        const shippingFee = body.shippingFee ?? sale.shippingFee;
        const fee = platformFee + shippingFee;
        const omset = body.omset > 0 ? body.omset : effectiveQty * unitPrice - voucher - discount - fee;
        const hpp = body.hpp ?? sale.hpp;
        const totalHpp = body.totalHpp > 0 ? body.totalHpp : effectiveQty * (hpp || sale.sku?.hppPrice || 0);
        const laba = body.laba !== undefined ? body.laba : omset - totalHpp;

        return tx.sale.update({
          where: { id },
          data: {
            unitPrice,
            total: effectiveQty * unitPrice,
            voucher,
            discount,
            platformFee,
            shippingFee,
            fee,
            omset,
            netRevenue: omset,
            hpp,
            totalHpp,
            laba,
            status: 'TERKIRIM',
            financeMatched: true,
            hasDiscrepancy: false,
            notes: body.notes ?? `✅ Discrepancy diselesaikan: Qty logistik (${effectiveQty}) diterima sebagai acuan fisik.`,
          },
          include: { sku: { select: { id: true, code: true, name: true } } },
        });
      }

      if (mode === 'accept_finance') {
        // Finance qty is the correct one.
        // We need to adjust stock: the difference between logistic qty and finance qty
        // must be corrected via an ADJUSTMENT inventory movement.
        const financeQty = body.financeQty;
        if (financeQty === undefined || financeQty === null || financeQty <= 0) {
          throw new Error('financeQty wajib diisi untuk mode accept_finance');
        }

        const logisticQty = sale.qty;
        const qtyDiff = financeQty - logisticQty; // positive = more than scanned, negative = less

        // Adjust stock in SKUCostHistory
        const costHistory = await tx.sKUCostHistory.findUnique({ where: { skuId: sale.skuId } });
        if (!costHistory) {
          throw new Error('Cost history tidak ditemukan untuk SKU ini');
        }

        // Check if adjustment would result in negative stock
        if (qtyDiff > 0 && costHistory.stock < qtyDiff) {
          throw new Error(
            `Stok tidak cukup untuk adjustment. Tersedia: ${costHistory.stock}, butuh tambahan: ${qtyDiff}`
          );
        }

        // Create corrective inventory movement for the qty difference
        if (qtyDiff !== 0) {
          await tx.inventory.create({
            data: {
              date: new Date(),
              skuId: sale.skuId,
              movement: -qtyDiff, // negative = additional deduction; positive = stock restoration
              type: MovementType.ADJUSTMENT,
              reference: `discrepancy-resolve:${sale.id}`,
            },
          });

          await tx.sKUCostHistory.update({
            where: { skuId: sale.skuId },
            data: { stock: { decrement: qtyDiff } },
          });
        }

        // Apply finance financial values using finance qty
        const unitPrice = body.unitPrice ?? sale.unitPrice;
        const voucher = body.voucher ?? sale.voucher;
        const discount = body.discount ?? sale.discount;
        const platformFee = body.platformFee ?? sale.platformFee;
        const shippingFee = body.shippingFee ?? sale.shippingFee;
        const fee = platformFee + shippingFee;
        const omset = body.omset > 0 ? body.omset : financeQty * unitPrice - voucher - discount - fee;
        const hpp = body.hpp ?? sale.hpp;
        const totalHpp = body.totalHpp > 0 ? body.totalHpp : financeQty * (hpp || sale.sku?.hppPrice || 0);
        const laba = body.laba !== undefined ? body.laba : omset - totalHpp;

        return tx.sale.update({
          where: { id },
          data: {
            qty: financeQty,
            unitPrice,
            total: financeQty * unitPrice,
            voucher,
            discount,
            platformFee,
            shippingFee,
            fee,
            omset,
            netRevenue: omset,
            hpp,
            totalHpp,
            laba,
            status: 'TERKIRIM',
            financeMatched: true,
            hasDiscrepancy: false,
            notes:
              body.notes ??
              `✅ Discrepancy diselesaikan: Qty diupdate dari ${logisticQty} (logistik) ke ${financeQty} (finance). Stok dikoreksi ${qtyDiff > 0 ? `-${qtyDiff}` : `+${Math.abs(qtyDiff)}`} unit.`,
          },
          include: { sku: { select: { id: true, code: true, name: true } } },
        });
      }

      throw new Error('Mode tidak valid');
    });

    return NextResponse.json({
      success: true,
      message:
        mode === 'accept_logistic'
          ? 'Discrepancy diselesaikan: qty logistik diterima sebagai acuan fisik.'
          : 'Discrepancy diselesaikan: qty finance diterapkan dan stok dikoreksi.',
      sale: resolved,
    });
  } catch (error: any) {
    console.error('Resolve discrepancy error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyelesaikan discrepancy' },
      { status: 500 }
    );
  }
}
