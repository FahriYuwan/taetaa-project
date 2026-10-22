import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { BOMCategory } from '@prisma/client';

function parseKemasanCategory(val?: string): BOMCategory {
  if (!val) return BOMCategory.PACKING;
  const u = val.toUpperCase().trim();
  if (u.includes('STIK') || u.includes('STICK')) return BOMCategory.STIKER;
  if (u.includes('SAFE') || u.includes('BUBBLE') || u.includes('LAKBAN')) return BOMCategory.SAFETY;
  if (u.includes('DUS') || u.includes('KARTON') || u.includes('BOX')) return BOMCategory.DUS;
  return BOMCategory.PACKING;
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Data tidak boleh kosong' }, { status: 400 });
    }

    const lines = text.trim().split('\n');
    let skippedCount = 0;
    const itemsToCreate = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const cols = line.split('\t').map((c) => c.trim());
      if (cols.length < 3) {
        skippedCount++;
        continue;
      }

      const [code, name, catStr, stockMinStr, periodicStr] = cols;
      const firstUpper = code.toUpperCase();
      const secondUpper = name.toUpperCase();

      if (
        firstUpper.startsWith('KODE') ||
        firstUpper.startsWith('CODE') ||
        firstUpper.startsWith('NO') ||
        secondUpper.startsWith('NAMA')
      ) {
        continue;
      }

      if (!code || !name) {
        skippedCount++;
        continue;
      }

      const category = parseKemasanCategory(catStr);
      let stockMin = 0;
      if (stockMinStr) {
        const parsed = parseFloat(stockMinStr.replace(/[^0-9.]/g, ''));
        stockMin = isNaN(parsed) ? 0 : parsed;
      }

      let isPeriodic = false;
      if (periodicStr) {
        const pUpper = periodicStr.toUpperCase();
        isPeriodic = pUpper === 'YA' || pUpper === 'TRUE' || pUpper === '1' || pUpper === 'YES';
      }

      itemsToCreate.push({
        code,
        name,
        category,
        stockMin,
        isPeriodic,
        stock: 0,
        avgCost: 0,
      });
    }

    if (itemsToCreate.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada baris data kemasan yang valid untuk diimpor. Format: KODE [TAB] NAMA [TAB] KATEGORI [TAB] STOK_MIN' },
        { status: 400 }
      );
    }

    const result = await prisma.masterItemKemasan.createMany({
      data: itemsToCreate,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      skipped: skippedCount,
      message: `${result.count} item kemasan berhasil diimpor (dari ${itemsToCreate.length} baris yang diproses).`,
    });
  } catch (error: any) {
    console.error('Bulk kemasan error:', error);
    return NextResponse.json({ error: error.message || 'Gagal impor data kemasan' }, { status: 500 });
  }
}
