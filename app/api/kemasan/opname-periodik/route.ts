import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const allItems = await prisma.masterItemKemasan.findMany({
      orderBy: { code: 'asc' },
    });
    const items = allItems.filter((i) => Boolean((i as any).isPeriodic));

    const now = new Date();
    const itemsWithStatus = items.map((item) => {
      let daysSinceLastOpname: number | null = null;
      if (item.lastOpname) {
        const diffMs = now.getTime() - new Date(item.lastOpname).getTime();
        daysSinceLastOpname = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      const needsOpname = daysSinceLastOpname === null || daysSinceLastOpname >= 7;

      return {
        ...item,
        daysSinceLastOpname,
        needsOpname,
      };
    });

    const needsOpnameCount = itemsWithStatus.filter((i) => i.needsOpname).length;

    return NextResponse.json({
      items: itemsWithStatus,
      totalPeriodic: items.length,
      needsOpnameCount,
    });
  } catch (error) {
    console.error('Failed to fetch periodic kemasan items:', error);
    return NextResponse.json({ error: 'Failed to fetch periodic kemasan items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { updates } = body as {
      updates: Array<{ id: string; physicalStock: number; notes?: string }>;
    };

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Data update opname tidak valid' }, { status: 400 });
    }

    const now = new Date();

    await prisma.$transaction(
      updates.map((u) =>
        prisma.masterItemKemasan.update({
          where: { id: u.id },
          data: {
            stock: Number(u.physicalStock) || 0,
            lastOpname: now,
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: updates.length });
  } catch (error) {
    console.error('Failed to submit periodic opname:', error);
    return NextResponse.json({ error: 'Gagal menyimpan opname periodik' }, { status: 500 });
  }
}
