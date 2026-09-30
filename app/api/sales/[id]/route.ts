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

// PATCH /api/sales/[id] - Update sale status or fields
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { sku: true },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Data penjualan tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Handle status change to DIRETURN
      if (body.status === 'DIRETURN' && sale.status !== 'DIRETURN') {
        // Restore stock when returning
        await tx.sKUCostHistory.update({
          where: { skuId: sale.skuId },
          data: { stock: { increment: sale.qty } },
        });

        // Create a RETURN inventory movement
        await tx.inventory.create({
          data: {
            date: new Date(),
            skuId: sale.skuId,
            movement: sale.qty,
            type: MovementType.RETURN,
            reference: sale.id,
          },
        });
      }

      // Handle reverting from DIRETURN to TERKIRIM
      if (sale.status === 'DIRETURN' && body.status === 'TERKIRIM') {
        // Re-deduct stock when reverting return
        await tx.sKUCostHistory.update({
          where: { skuId: sale.skuId },
          data: { stock: { decrement: sale.qty } },
        });

        // Remove the RETURN inventory movement
        await tx.inventory.deleteMany({
          where: {
            reference: sale.id,
            type: MovementType.RETURN,
          },
        });
      }

      // Build update data
      const updateData: any = {};
      if (body.status !== undefined) updateData.status = body.status;
      if (body.orderId !== undefined) updateData.orderId = body.orderId;
      if (body.resi !== undefined) updateData.resi = body.resi;
      if (body.notes !== undefined) updateData.notes = body.notes;
      if (body.unitPrice !== undefined) updateData.unitPrice = body.unitPrice;
      if (body.voucher !== undefined) updateData.voucher = body.voucher;
      if (body.discount !== undefined) updateData.discount = body.discount;
      if (body.platformFee !== undefined) updateData.platformFee = body.platformFee;
      if (body.shippingFee !== undefined) updateData.shippingFee = body.shippingFee;
      if (body.omset !== undefined) updateData.omset = body.omset;
      if (body.hpp !== undefined) updateData.hpp = body.hpp;
      if (body.totalHpp !== undefined) updateData.totalHpp = body.totalHpp;
      if (body.laba !== undefined) updateData.laba = body.laba;
      if (body.fee !== undefined) updateData.fee = body.fee;
      if (body.netRevenue !== undefined) updateData.netRevenue = body.netRevenue;
      if (body.total !== undefined) updateData.total = body.total;

      return tx.sale.update({
        where: { id },
        data: updateData,
        include: {
          sku: { select: { id: true, code: true, name: true, hppPrice: true } },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update sale:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengupdate data penjualan' },
      { status: 500 }
    );
  }
}

// GET /api/sales/[id] - Get single sale
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        sku: { select: { id: true, code: true, name: true, hppPrice: true } },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Data penjualan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal mengambil data penjualan' }, { status: 500 });
  }
}
