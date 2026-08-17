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
          include: { child: true },
        },
      },
    });

    return NextResponse.json(skus);
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

    const sku = await prisma.$transaction(async (tx) => {
      const newSku = await tx.sKU.create({
        data: {
          code,
          name,
          type: type as SKUType,
          sellingPrice: type === 'PACKAGE' ? sellingPrice : null,
        },
      });

      if (type !== 'RAW' && bomComponents && bomComponents.length > 0) {
        await tx.bOMComponent.createMany({
          data: bomComponents.map((comp: any) => ({
            parentId: newSku.id,
            childId: comp.childId,
            quantity: comp.quantity,
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
