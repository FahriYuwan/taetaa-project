import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SKUType } from '@prisma/client';
import { parseRupiahNumber } from '@/lib/finance';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Data tidak boleh kosong' }, { status: 400 });
    }

    const lines = text.trim().split('\n');
    const skusToCreate = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Abaikan jika user menyertakan baris header
      if (line.toLowerCase().startsWith('kode') || line.toLowerCase().startsWith('code')) {
        continue;
      }

      const parts = line.split('\t').map((p) => p.trim());
      if (parts.length < 3) continue;

      const [code, name, typeStr] = parts;
      if (!code || !name || !typeStr) continue;

      const upperType = typeStr.toUpperCase();
      if (!['RAW', 'PRODUCT', 'PACKAGE'].includes(upperType)) continue;
      const type = upperType as SKUType;

      let productSize = 0;
      let hppPrice = 0;
      let sellingPrice: number | null = null;
      let stockMin: number | null = null;

      if (parts.length >= 7) {
        // Toleransi format lawas 7 kolom (menyertakan HARGA_HPP):
        // KODE [TAB] NAMA [TAB] TIPE [TAB] UKURAN_ML [TAB] HARGA_HPP [TAB] HARGA_JUAL [TAB] STOK_MIN
        if (parts[3]) {
          const parsedSize = parseFloat(parts[3].replace(/[^0-9.]/g, ''));
          productSize = isNaN(parsedSize) ? 0 : parsedSize;
        }
        if (parts[4]) {
          hppPrice = parseRupiahNumber(parts[4]);
        }
        if (parts[5]) {
          const parsedSell = parseRupiahNumber(parts[5]);
          sellingPrice = type === 'PACKAGE' ? parsedSell : null;
        }
        if (parts[6] !== undefined && parts[6] !== '') {
          const parsedStockMin = parseFloat(parts[6].replace(/[^0-9.]/g, ''));
          stockMin = isNaN(parsedStockMin) ? null : parsedStockMin;
        }
      } else if (parts.length === 6) {
        // Format standar baru 6 kolom (HPP dihilangkan karena dinamis dari COGS):
        // KODE [TAB] NAMA [TAB] TIPE [TAB] UKURAN_ML [TAB] HARGA_JUAL [TAB] STOK_MIN
        if (parts[3]) {
          const parsedSize = parseFloat(parts[3].replace(/[^0-9.]/g, ''));
          productSize = isNaN(parsedSize) ? 0 : parsedSize;
        }
        if (parts[4]) {
          const parsedSell = parseRupiahNumber(parts[4]);
          sellingPrice = type === 'PACKAGE' ? parsedSell : null;
        }
        if (parts[5] !== undefined && parts[5] !== '') {
          const parsedStockMin = parseFloat(parts[5].replace(/[^0-9.]/g, ''));
          stockMin = isNaN(parsedStockMin) ? null : parsedStockMin;
        }
      } else if (parts.length === 5) {
        // Format 5 kolom: KODE [TAB] NAMA [TAB] TIPE [TAB] UKURAN_ML [TAB] HARGA_JUAL
        if (parts[3]) {
          const parsedSize = parseFloat(parts[3].replace(/[^0-9.]/g, ''));
          productSize = isNaN(parsedSize) ? 0 : parsedSize;
        }
        if (parts[4]) {
          const parsedSell = parseRupiahNumber(parts[4]);
          sellingPrice = type === 'PACKAGE' ? parsedSell : null;
        }
      } else if (parts.length === 4) {
        // Toleransi 4 kolom: KODE [TAB] NAMA [TAB] TIPE [TAB] UKURAN_ML
        const parsedNum = parseRupiahNumber(parts[3]);
        if (type === 'PACKAGE' && parsedNum > 1000 && !parts[3].toLowerCase().includes('ml') && !parts[3].toLowerCase().includes('l')) {
          sellingPrice = parsedNum;
        } else {
          const parsedSize = parseFloat(parts[3].replace(/[^0-9.]/g, ''));
          productSize = isNaN(parsedSize) ? 0 : parsedSize;
        }
      }

      skusToCreate.push({
        code,
        name,
        type,
        productSize,
        hppPrice,
        sellingPrice,
        stockMin,
      });
    }

    if (skusToCreate.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada baris data SKU yang valid untuk diimpor. Pastikan format kolom sesuai.' },
        { status: 400 }
      );
    }

    const result = await prisma.sKU.createMany({
      data: skusToCreate,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} SKU berhasil diimpor (dari ${skusToCreate.length} baris yang diproses).`,
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Gagal mengimpor data SKU: ' + (error.message || 'Terjadi kesalahan sistem') },
      { status: 500 }
    );
  }
}
