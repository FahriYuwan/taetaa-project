import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { code, name, category, stock, avgCost, stockMin, isPeriodic, lastOpname } = body;

    const item = await prisma.masterItemKemasan.update({
      where: { id },
      data: {
        code,
        name,
        category,
        ...(stock !== undefined ? { stock: parseFloat(stock) || 0 } : {}),
        ...(avgCost !== undefined ? { avgCost: parseFloat(avgCost) || 0 } : {}),
        ...(stockMin !== undefined ? { stockMin: stockMin !== null && stockMin !== '' ? parseFloat(stockMin) : 0 } : {}),
        ...(isPeriodic !== undefined ? { isPeriodic: Boolean(isPeriodic) } : {}),
        ...(lastOpname !== undefined ? { lastOpname: lastOpname ? new Date(lastOpname) : null } : {}),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.masterItemKemasan.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
