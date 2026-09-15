import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';

export async function GET() {
  try {
    const skus = await prisma.sKU.findMany({
      include: {
        inventory: true,
      },
      orderBy: { code: 'asc' },
    });

    const data = skus.map(sku => {
      const systemStock = sku.inventory.reduce((sum, inv) => sum + inv.movement, 0);
      return {
        id: sku.id,
        code: sku.code,
        name: sku.name,
        type: sku.type,
        systemStock,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch skus for opname:', error);
    return NextResponse.json({ error: 'Failed to fetch skus for opname' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { notes, items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items data' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const opname = await tx.stockOpname.create({
        data: {
          date: new Date(),
          notes: notes || 'Sesi Stock Opname',
        },
      });

      for (const item of items) {
        await tx.stockOpnameItem.create({
          data: {
            opnameId: opname.id,
            skuId: item.skuId,
            systemStock: item.systemStock,
            physicalStock: item.physicalStock,
            diff: item.diff,
            checked: item.checked || false,
            notes: item.notes || '',
          },
        });

        if (item.checked && item.adjustStock && item.diff !== 0) {
          await tx.inventory.create({
            data: {
              date: new Date(),
              skuId: item.skuId,
              movement: item.diff,
              type: MovementType.ADJUSTMENT,
              reference: opname.id,
            },
          });

          const ch = await tx.sKUCostHistory.findUnique({
            where: { skuId: item.skuId },
          });
          if (ch) {
            await tx.sKUCostHistory.update({
              where: { skuId: item.skuId },
              data: { stock: { increment: item.diff } },
            });
          } else {
            await tx.sKUCostHistory.create({
              data: {
                skuId: item.skuId,
                stock: item.diff,
                avgCost: 0,
              },
            });
          }
        }
      }

      return opname;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Failed to save stock opname:', error);
    return NextResponse.json({ error: error.message || 'Failed to save stock opname' }, { status: 500 });
  }
}
