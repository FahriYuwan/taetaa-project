import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';
import { parseRupiahNumber } from '@/lib/finance';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Data tidak boleh kosong' }, { status: 400 });
    }

    const lines = text.trim().split('\n');
    const errors: string[] = [];
    let skippedCount = 0;

    const results = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const cols = line.split('\t');
        if (cols.length < 4) {
          skippedCount++;
          continue;
        }

        const [dateStr, skuCode, qtyStr, priceStr, supplier, notes] = cols;
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
        const kemasan = !sku ? await tx.masterItemKemasan.findUnique({ where: { code: itemCode } }) : null;

        if (!sku && !kemasan) {
          errors.push(`Item "${itemCode}" tidak ditemukan di Master SKU maupun Master Kemasan`);
          skippedCount++;
          continue;
        }

        const parsedDate = new Date(dateStr.trim());
        const date = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        const cleanQty = parseFloat(qtyStr.trim().replace(',', '.'));
        const qty = isNaN(cleanQty) || cleanQty <= 0 ? 0 : cleanQty;
        const unitPrice = parseRupiahNumber(priceStr);

        if (qty <= 0 || unitPrice < 0) {
          errors.push(`Baris "${itemCode}": Qty (${qty}) atau Harga Satuan (${unitPrice}) tidak valid`);
          skippedCount++;
          continue;
        }

        const total = qty * unitPrice;

        // 1. Create Purchase
        const purchase = await tx.purchase.create({
          data: {
            date,
            skuId: sku ? sku.id : null,
            kemasanId: kemasan ? kemasan.id : null,
            qty,
            unitPrice,
            total,
            supplier: supplier?.trim() || null,
            notes: notes?.trim() || null,
          },
        });

        if (kemasan) {
          // Update Kemasan stock and weighted average HPP
          const oldStock = Math.max(0, kemasan.stock);
          const oldAvgCost = kemasan.avgCost || 0;
          const newStock = kemasan.stock + qty;
          const newAvgCost = ((oldStock * oldAvgCost) + (qty * unitPrice)) / (oldStock + qty);

          await tx.masterItemKemasan.update({
            where: { id: kemasan.id },
            data: { stock: newStock, avgCost: newAvgCost },
          });
        } else if (sku) {
          // 2. Add to Inventory for SKU
          await tx.inventory.create({
            data: {
              date,
              skuId: sku.id,
              movement: qty,
              type: MovementType.PURCHASE,
              reference: purchase.id,
            },
          });

          // 3. Update SKUCostHistory
          const costHistory = await tx.sKUCostHistory.findUnique({ where: { skuId: sku.id } });
          if (costHistory) {
            const oldStock = costHistory.stock;
            const oldAvgCost = costHistory.avgCost;
            const newStock = oldStock + qty;
            const currentStockForAvg = Math.max(0, oldStock);
            const newAvgCost = ((currentStockForAvg * oldAvgCost) + (qty * unitPrice)) / (currentStockForAvg + qty);

            await tx.sKUCostHistory.update({
              where: { skuId: sku.id },
              data: { stock: newStock, avgCost: newAvgCost },
            });
          } else {
            await tx.sKUCostHistory.create({
              data: { skuId: sku.id, stock: qty, avgCost: unitPrice },
            });
          }
        }
        count++;
      }
      return count;
    });

    const msg = [
      `${results} pembelian berhasil diimpor`,
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
    console.error('Bulk purchase import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to bulk import purchases' }, { status: 500 });
  }
}
