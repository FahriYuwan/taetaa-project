import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const purchases = await prisma.purchase.findMany({
      include: { sku: true },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(purchases);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, skuId, qty, unitPrice, supplier, notes } = body;

    if (!date || !skuId || !qty || !unitPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const total = qty * unitPrice;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the purchase record
      const purchase = await tx.purchase.create({
        data: {
          date: new Date(date),
          skuId,
          qty,
          unitPrice,
          total,
          supplier,
          notes,
        },
      });

      // 2. Add to Inventory Movement
      await tx.inventory.create({
        data: {
          date: new Date(date),
          skuId,
          movement: qty,
          type: MovementType.PURCHASE,
          reference: purchase.id,
        },
      });

      // 3. Update SKUCostHistory (Weighted Average HPP)
      // AVG COST baru = (Stok lama × AVG COST lama + Qty baru × Harga Satuan baru) / (Stok lama + Qty baru)
      const costHistory = await tx.sKUCostHistory.findUnique({
        where: { skuId },
      });

      if (costHistory) {
        const oldStock = costHistory.stock;
        const oldAvgCost = costHistory.avgCost;
        const newStock = oldStock + qty;

        // Handle case where stock might be 0 or negative
        const currentStockForAvg = Math.max(0, oldStock);
        const newAvgCost = ((currentStockForAvg * oldAvgCost) + (qty * unitPrice)) / (currentStockForAvg + qty);

        await tx.sKUCostHistory.update({
          where: { skuId },
          data: {
            stock: newStock,
            avgCost: newAvgCost,
          },
        });
      } else {
        // First time purchase for this SKU
        await tx.sKUCostHistory.create({
          data: {
            skuId,
            stock: qty,
            avgCost: unitPrice,
          },
        });
      }

      return purchase;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Purchase creation error:', error);
    return NextResponse.json({ error: 'Failed to record purchase' }, { status: 500 });
  }
}
