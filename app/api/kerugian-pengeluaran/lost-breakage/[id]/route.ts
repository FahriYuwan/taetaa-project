import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { MovementType, BreakageCategory } from '@prisma/client';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { date, skuId, qty, category, notes } = body;

    const parsedQty = parseFloat(qty);
    if (!date || !skuId || isNaN(parsedQty) || parsedQty <= 0 || !category) {
      return NextResponse.json(
        { error: 'Field date, skuId, qty (> 0), dan kategori wajib diisi!' },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Ambil data kerugian eksisting
      const existing = await tx.breakage.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Data kerugian tidak ditemukan');
      }

      // 2. REVERSAL STOK SEBELUMNYA:
      // Kembalikan stok lama ke SKUCostHistory (+existing.qty)
      const oldCostHistory = await tx.sKUCostHistory.findUnique({
        where: { skuId: existing.skuId },
      });
      if (oldCostHistory) {
        await tx.sKUCostHistory.update({
          where: { skuId: existing.skuId },
          data: {
            stock: { increment: existing.qty },
          },
        });
      }

      // Hapus pergerakan inventory lama untuk transaksi ini
      await tx.inventory.deleteMany({
        where: {
          reference: id,
          type: MovementType.BREAKAGE,
        },
      });

      // 3. TERAPKAN EFEK STOK BARU:
      // Ambil HPP SKU dari Cost History
      const costHistory = await tx.sKUCostHistory.findUnique({
        where: { skuId },
        select: { avgCost: true },
      });
      const finalUnitPrice = costHistory?.avgCost || 0;
      const total = parsedQty * finalUnitPrice;

      // Kurangi stok SKU baru di SKUCostHistory (-parsedQty)
      const newCostHistory = await tx.sKUCostHistory.findUnique({
        where: { skuId },
      });
      if (newCostHistory) {
        await tx.sKUCostHistory.update({
          where: { skuId },
          data: {
            stock: { decrement: parsedQty },
          },
        });
      }

      // Buat pergerakan inventory baru
      await tx.inventory.create({
        data: {
          date: new Date(date),
          skuId,
          movement: -parsedQty,
          type: MovementType.BREAKAGE,
          reference: id,
        },
      });

      // 4. Update data Breakage
      const breakage = await tx.breakage.update({
        where: { id },
        data: {
          date: new Date(date),
          skuId,
          qty: parsedQty,
          category: category as BreakageCategory,
          unitPrice: finalUnitPrice,
          total,
          notes: notes || 'Breakage',
        },
        include: {
          sku: {
            select: {
              code: true,
              name: true,
              hppPrice: true,
            },
          },
        },
      });

      return breakage;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Breakage update error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui data kerugian' },
      { status: error.message === 'Data kerugian tidak ditemukan' ? 404 : 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      // 1. Ambil data kerugian eksisting
      const existing = await tx.breakage.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Data kerugian tidak ditemukan');
      }

      // 2. REVERSAL STOK:
      // Kembalikan stok ke SKUCostHistory (+existing.qty)
      const costHistory = await tx.sKUCostHistory.findUnique({
        where: { skuId: existing.skuId },
      });
      if (costHistory) {
        await tx.sKUCostHistory.update({
          where: { skuId: existing.skuId },
          data: {
            stock: { increment: existing.qty },
          },
        });
      }

      // 3. Hapus pergerakan inventory terkait
      await tx.inventory.deleteMany({
        where: {
          reference: id,
          type: MovementType.BREAKAGE,
        },
      });

      // 4. Hapus record Breakage
      await tx.breakage.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Data kerugian berhasil dihapus dan efek stok telah dikembalikan.',
    });
  } catch (error: any) {
    console.error('Breakage delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus data kerugian' },
      { status: error.message === 'Data kerugian tidak ditemukan' ? 404 : 500 }
    );
  }
}
