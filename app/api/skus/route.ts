import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SKUType } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const where = type && type !== 'all' ? { type: type as SKUType } : {};
    const skus = await prisma.sKU.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        bomComponents: {
          include: { 
            childSku: true,
            childKemasan: true
          },
        },
        inventory: true,
      },
    });

    const costHistories = await prisma.sKUCostHistory.findMany();
    const costMap = new Map(costHistories.map(ch => [ch.skuId, ch]));

    const result = skus.map(sku => {
      const invStock = sku.inventory.reduce((sum, inv) => sum + inv.movement, 0);
      const ch = costMap.get(sku.id);
      const stock = ch !== undefined ? ch.stock : invStock;
      const { inventory, ...rest } = sku;
      return {
        ...rest,
        stock,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch SKUs' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, name, type, sellingPrice, bomComponents } = body;

    if (!code || !name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let stockMin: number | null = null;
    if (body.stockMin !== undefined && body.stockMin !== null && body.stockMin !== '') {
      stockMin = parseFloat(body.stockMin);
      if (isNaN(stockMin)) stockMin = null;
    }

    const sku = await prisma.$transaction(async (tx) => {
      const newSku = await tx.sKU.create({
        data: {
          code,
          name,
          type: type as SKUType,
          productSize: body.productSize || 0,
          hppPrice: body.hppPrice || 0,
          sellingPrice: type === 'PACKAGE' ? sellingPrice : null,
          stockMin,
        },
      });

      if (type !== 'RAW' && bomComponents && bomComponents.length > 0) {
        await tx.bOMComponent.createMany({
          data: bomComponents.map((comp: any) => ({
            parentId: newSku.id,
            childSkuId: comp.category === 'RAW' ? comp.childId : null,
            childKemasanId: comp.category !== 'RAW' ? comp.childId : null,
            category: comp.category,
            quantity: comp.quantity,
            consumptionType: comp.consumptionType || 'AUTOMATIC',
          })),
        });
      }

      return newSku;
    });

    return NextResponse.json(sku, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'SKU code already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create SKU' },
      { status: 500 }
    );
  }
}
