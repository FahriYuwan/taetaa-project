import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'No data' }, { status: 400 });

    const lines = text.trim().split('\n');

    const results = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const line of lines) {
        const [dateStr, skuCode, qtyStr, priceStr, supplier, notes] = line.split('\t');
        if (!dateStr || !skuCode || !qtyStr || !priceStr) continue;

        const sku = await tx.sKU.findUnique({ where: { code: skuCode.trim() } });
        if (!sku) continue;

        const date = new Date(dateStr.trim());
        const qty = parseFloat(qtyStr.trim());
        const unitPrice = parseFloat(priceStr.trim().replace(/[^0-9.]/g, ''));
        const total = qty * unitPrice;

        // 1. Create Purchase
        const purchase = await tx.purchase.create({
          data: {
            date,
            skuId: sku.id,
            qty,
            unitPrice,
            total,
            supplier: supplier?.trim(),
            notes: notes?.trim(),
          },
        });

        // 2. Add to Inventory
        await tx.inventory.create({
          data: {
            date,
            skuId: sku.id,
            movement: qty,
            type: MovementType.PURCHASE,
            reference: purchase.id,
          },
        });

        // 3. Update HPP (Simple loop for bulk, in production consider optimization)
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
        count++;
      }
      return count;
    });

    return NextResponse.json({ success: true, count: results, message: `${results} pembelian berhasil diimpor` });
  } catch (error: any) {
    console.error('Bulk purchase import error:', error);
    return NextResponse.json({ error: 'Failed to bulk import purchases' }, { status: 500 });
  }
}
