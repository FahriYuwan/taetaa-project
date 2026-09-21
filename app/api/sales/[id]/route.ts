import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Data penjualan tidak ditemukan' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated inventory movement
      await tx.inventory.deleteMany({
        where: {
          reference: id,
          type: MovementType.SALE,
        },
      });

      // 2. Restore stock in SKUCostHistory
      const costHistory = await tx.sKUCostHistory.findUnique({
        where: { skuId: sale.skuId },
      });

      if (costHistory) {
        await tx.sKUCostHistory.update({
          where: { skuId: sale.skuId },
          data: {
            stock: { increment: sale.qty },
          },
        });
      }

      // 3. Delete the sale
      await tx.sale.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Penjualan berhasil dihapus dan stok dikembalikan' });
  } catch (error: any) {
    console.error('Failed to delete sale:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus data penjualan' },
      { status: 500 }
    );
  }
}
