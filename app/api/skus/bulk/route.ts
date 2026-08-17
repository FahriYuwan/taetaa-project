import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SKUType } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'No data' }, { status: 400 });

    const lines = text.trim().split('\n');
    const skusToCreate = [];

    for (const line of lines) {
      const [code, name, type, price] = line.split('\t');
      if (!code || !name || !type) continue;

      skusToCreate.push({
        code: code.trim(),
        name: name.trim(),
        type: type.trim().toUpperCase() as SKUType,
        sellingPrice: price ? parseFloat(price.replace(/[^0-9.]/g, '')) : null,
      });
    }

    if (skusToCreate.length === 0) {
      return NextResponse.json({ error: 'No valid SKUs found' }, { status: 400 });
    }

    // Using transaction to ensure all or none
    const result = await prisma.sKU.createMany({
      data: skusToCreate,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} SKU berhasil diimpor`
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Failed to bulk import SKUs' }, { status: 500 });
  }
}
