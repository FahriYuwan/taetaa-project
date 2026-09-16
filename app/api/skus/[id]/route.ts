import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sku = await prisma.sKU.findUnique({
      where: { id },
      include: {
        bomComponents: {
          include: { 
            childSku: true,
            childKemasan: true
          },
        },
      },
    });

    if (!sku) {
      return NextResponse.json(
        { error: 'SKU not found' },
        { status: 404 }
      );
    }

    // Fetch current stock and avg cost
    const costHistory = await prisma.sKUCostHistory.findUnique({
      where: { skuId: id }
    });

    return NextResponse.json({
      ...sku,
      stock: costHistory?.stock || 0,
      avgCost: costHistory?.avgCost || 0
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch SKU' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      code,
      name,
      type,
      productSize,
      hppPrice,
      sellingPrice,
      stockMin,
      bomComponents,
    } = body;

    // Normalize stockMin: allow null, empty string, or numeric value
    let normalizedStockMin: number | null | undefined = undefined;
    if (stockMin !== undefined) {
      if (stockMin === null || stockMin === '') {
        normalizedStockMin = null;
      } else {
        const parsed = parseFloat(stockMin);
        normalizedStockMin = isNaN(parsed) ? null : parsed;
      }
    }

    const sku = await prisma.$transaction(async (tx) => {
      const updatedSku = await tx.sKU.update({
        where: { id },
        data: {
          code,
          name,
          type,
          productSize: productSize || 0,
          hppPrice: hppPrice || 0,
          sellingPrice: type === 'PACKAGE' ? sellingPrice : null,
          ...(normalizedStockMin !== undefined ? { stockMin: normalizedStockMin } : {}),
        },
      });

      // Update BOM: delete existing and recreate
      if (type !== 'RAW') {
        await tx.bOMComponent.deleteMany({
          where: { parentId: id },
        });

        if (bomComponents && bomComponents.length > 0) {
          await tx.bOMComponent.createMany({
            data: bomComponents.map((comp: any) => ({
              parentId: id,
              childSkuId: comp.category === 'RAW' ? comp.childId : null,
              childKemasanId: comp.category !== 'RAW' ? comp.childId : null,
              category: comp.category,
              quantity: comp.quantity,
              consumptionType: comp.consumptionType || 'AUTOMATIC',
            })),
          });
        }
      } else {
        // If type changed to RAW, delete any existing BOM
        await tx.bOMComponent.deleteMany({
          where: { parentId: id },
        });
      }

      return updatedSku;
    });

    return NextResponse.json(sku);
  } catch (error: any) {
    console.error('PUT /api/skus/[id] error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'SKU not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update SKU' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.sKU.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'SKU not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete SKU' },
      { status: 500 }
    );
  }
}
