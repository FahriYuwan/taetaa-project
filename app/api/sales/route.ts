import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType, Channel } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel');

    const where: any = {};
    if (channel && channel !== 'all') {
      where.channel = channel as Channel;
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { sku: true },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, skuId, qty, unitPrice, channel, orderId, fee, notes } = body;

    if (!date || !skuId || !qty || !unitPrice || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify stock availability
      const costHistory = await tx.sKUCostHistory.findUnique({
        where: { skuId },
      });

      if (!costHistory || costHistory.stock < qty) {
        throw new Error(`Stok tidak cukup (Tersedia: ${costHistory?.stock || 0})`);
      }

      // 2. Calculate financial values
      const total = qty * unitPrice;
      const netRevenue = total - (fee || 0);
      const hppTotal = qty * costHistory.avgCost;
      // We don't store profit directly in the table as per schema,
      // but we store netRevenue and can derive profit: netRevenue - (qty * avgCost)
      // Actually, the schema doesn't have a profit field, so we'll calculate it in the frontend or derived here.
      // But we need to record the cost snapshot if we want accurate historical profit even if avgCost changes later.
      // The schema doesn't have a field for unit cost at time of sale.
      // Looking at the spec, "HPP = QTY x AVG COST SKU saat transaksi".
      // I should check if I should add a cost field to Sale table or just use current avgCost.
      // To be safe and accurate, a "costAtSale" field is best, but I will stick to schema and use calculated HPP.

      // 3. Create Sale record
      const sale = await tx.sale.create({
        data: {
          date: new Date(date),
          skuId,
          qty,
          unitPrice,
          total,
          channel: channel as Channel,
          orderId,
          fee: fee || 0,
          netRevenue,
          notes,
        },
      });

      // 4. Create Inventory Movement
      await tx.inventory.create({
        data: {
          date: new Date(date),
          skuId,
          movement: -qty,
          type: MovementType.SALE,
          reference: sale.id,
        },
      });

      // 5. Update Stock
      await tx.sKUCostHistory.update({
        where: { skuId },
        data: {
          stock: { decrement: qty },
        },
      });

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Sale creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record sale' }, { status: 500 });
  }
}
