import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET: list all SKUs with current system stock (for building a new opname form)
export async function GET() {
  try {
    const skus = await prisma.sKU.findMany({
      include: { inventory: true },
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

// POST: save opname as DRAFT — does NOT touch inventory/stock
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { notes, items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items data' }, { status: 400 });
    }

    // Generate opname number: OPN-YYYYMMDD-NNN
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await prisma.stockOpname.count({
      where: {
        createdAt: {
          gte: new Date(today.toISOString().slice(0, 10)),
        },
      },
    });
    const opnameNumber = `OPN-${dateStr}-${String(countToday + 1).padStart(3, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      const opname = await tx.stockOpname.create({
        data: {
          opnameNumber,
          date: today,
          notes: notes || '',
          status: 'DRAFT',
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
            checked: item.checked ?? false,
            notes: item.notes || '',
          },
        });
      }

      return opname;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Failed to save stock opname draft:', error);
    return NextResponse.json({ error: error.message || 'Failed to save stock opname draft' }, { status: 500 });
  }
}

