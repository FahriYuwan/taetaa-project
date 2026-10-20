import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SKUType } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const code = searchParams.get('code');

    const where: any = {};
    if (type && type !== 'all') where.type = type as SKUType;
    if (code) where.code = code.toUpperCase();

    const skus = await prisma.sKU.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        bomComponents: {
          include: { 
            childSku: {
              select: {
                id: true,
                code: true,
                name: true,
                productSize: true,
                hppPrice: true,
              },
            },
            childKemasan: {
              select: {
                id: true,
                code: true,
                name: true,
                avgCost: true,
              },
            },
          },
        },
      },
    });

    const costHistories = await prisma.sKUCostHistory.findMany({
      select: {
        skuId: true,
        avgCost: true,
        stock: true,
      },
    });
    const costMap = new Map(costHistories.map(ch => [ch.skuId, ch]));

    const result = skus.map(sku => {
      const ch = costMap.get(sku.id);
      const stock = ch !== undefined ? ch.stock : 0;
      const avgCost = ch?.avgCost ?? sku.hppPrice ?? 0;

      // Enrich BOM components with real-time costs for validation
      const enrichedBom = sku.bomComponents?.map(comp => {
        let unitCost = 0;
        let childName = '';
        let childCode = '';
        let childProductSize = 0;

        if (comp.category === 'RAW' && comp.childSku) {
          const childCh = costMap.get(comp.childSkuId!);
          unitCost = childCh?.avgCost ?? comp.childSku.hppPrice ?? 0;
          childName = comp.childSku.name;
          childCode = comp.childSku.code;
          childProductSize = comp.childSku.productSize || 0;
        } else if (comp.childKemasan) {
          unitCost = comp.childKemasan.avgCost ?? 0;
          childName = comp.childKemasan.name;
          childCode = comp.childKemasan.code;
        }

        const totalCost = comp.quantity * unitCost;

        return {
          ...comp,
          unitCost,
          totalCost,
          childName,
          childCode,
          childProductSize,
        };
      }) || [];

      const rawCost = sku.type === 'RAW'
        ? (avgCost || 0)
        : enrichedBom
            .filter(c => c.category === 'RAW')
            .reduce((sum, c) => sum + c.totalCost, 0);

      const packagingCost = enrichedBom
        .filter(c => c.category !== 'RAW')
        .reduce((sum, c) => sum + c.totalCost, 0);

      const estimatedBomHpp = rawCost + packagingCost;

      return {
        ...sku,
        unit: sku.unit || 'ml',
        stock,
        avgCost,
        rawCost,
        packagingCost,
        estimatedBomHpp,
        bomComponents: enrichedBom,
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
          unit: body.unit || 'ml',
          hppPrice: body.hppPrice || 0,
          sellingPrice: sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== '' ? parseFloat(sellingPrice) : null,
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
