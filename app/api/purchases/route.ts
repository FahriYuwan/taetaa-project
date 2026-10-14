import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';
import { validateBody, createPurchaseSchema } from '@/lib/validations';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: any = {};
    if (from || to) {
      where.date = {};
      if (from) {
        where.date.gte = new Date(from);
      }
      if (to) {
        const toDateObj = new Date(to);
        toDateObj.setHours(23, 59, 59, 999);
        where.date.lte = toDateObj;
      }
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: { 
        sku: true,
        kemasan: true,
      },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(purchases);
  } catch (error: any) {
    console.error('Error in GET /api/purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases', details: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = validateBody(createPurchaseSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, details: validation.issues }, { status: 400 });
    }

    const { date, skuId, kemasanId, qty, unitPrice, supplier, notes } = validation.data;

    const total = qty * unitPrice;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the purchase record
      const purchase = await tx.purchase.create({
        data: {
          date: new Date(date),
          skuId: skuId || null,
          kemasanId: kemasanId || null,
          qty,
          unitPrice,
          total,
          supplier,
          notes,
        },
        include: {
          sku: true,
          kemasan: true,
        },
      });

      if (kemasanId) {
        // 2. Handle Kemasan: update stock and recalculate Weighted Average HPP (avgCost)
        const kemasan = await tx.masterItemKemasan.findUnique({
          where: { id: kemasanId },
        });

        if (kemasan) {
          const oldStock = Math.max(0, kemasan.stock);
          const oldAvgCost = kemasan.avgCost || 0;
          const newStock = kemasan.stock + qty;
          const newAvgCost = ((oldStock * oldAvgCost) + (qty * unitPrice)) / (oldStock + qty);

          await tx.masterItemKemasan.update({
            where: { id: kemasanId },
            data: {
              stock: newStock,
              avgCost: newAvgCost,
            },
          });
        }
      } else if (skuId) {
        // 2. Add to Inventory Movement for SKU
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
      }

      return purchase;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Purchase creation error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan data Pembelian' }, { status: 500 });
  }
}
