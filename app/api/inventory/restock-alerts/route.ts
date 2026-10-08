import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Fetch all SKUs that have a stockMin set
    const skus = await prisma.sKU.findMany({
      where: {
        stockMin: { gt: 0 },
      },
      include: {
        inventory: true,
      },
    });

    const alerts: Array<{
      id: string;
      code: string;
      name: string;
      type: string;
      stockAkhir: number;
      stockMin: number;
      deficit: number;
    }> = [];

    for (const sku of skus) {
      const stockMin = sku.stockMin ?? 0;
      if (stockMin <= 0) continue;

      // Calculate current stock from all inventory movements
      let totalStock = 0;
      for (const inv of sku.inventory) {
        totalStock += inv.movement;
      }

      if (totalStock < stockMin) {
        alerts.push({
          id: sku.id,
          code: sku.code,
          name: sku.name,
          type: sku.type,
          stockAkhir: totalStock,
          stockMin,
          deficit: stockMin - totalStock,
        });
      }
    }

    // Sort by most critical first (lowest stock ratio = most urgent)
    alerts.sort((a, b) => {
      const ratioA = a.stockAkhir / a.stockMin;
      const ratioB = b.stockAkhir / b.stockMin;
      return ratioA - ratioB;
    });

    return NextResponse.json({ alerts, count: alerts.length });
  } catch (error) {
    console.error('Restock alerts error:', error);
    return NextResponse.json({ error: 'Failed to fetch restock alerts' }, { status: 500 });
  }
}
