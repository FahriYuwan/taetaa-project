import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const where = category ? { category: category as any } : {};
    const items = await prisma.masterItemKemasan.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch kemasan items' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, name, category, stock, avgCost } = body;

    const item = await prisma.masterItemKemasan.create({
      data: {
        code,
        name,
        category,
        stock: stock || 0,
        avgCost: avgCost || 0,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Item code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
