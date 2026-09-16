import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const activity = await prisma.affiliateActivity.findUnique({
      where: { id },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Aktivitas tidak ditemukan' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated inventory movement
      await tx.inventory.deleteMany({
        where: {
          reference: id,
          type: MovementType.AFFILIATE_SEEDING,
        },
      });

      // 2. Restore stock in SKUCostHistory
      const costHistory = await tx.sKUCostHistory.findUnique({
        where: { skuId: activity.skuId },
      });

      if (costHistory) {
        await tx.sKUCostHistory.update({
          where: { skuId: activity.skuId },
          data: {
            stock: { increment: activity.qty },
          },
        });
      }

      // 3. Delete the activity
      await tx.affiliateActivity.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Aktivitas berhasil dihapus' });
  } catch (error: any) {
    console.error('Failed to delete affiliate activity:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus aktivitas affiliate' },
      { status: 500 }
    );
  }
}
