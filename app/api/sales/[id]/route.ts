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
      const isReturn = (s?: string) => s === 'RETURN' || s === 'DIRETURN';
      const isNonReturn = (s?: string) => s === 'DITERIMA' || s === 'TERKIRIM' || s === 'HILANG';

      // Handle status change to RETURN
      if (isReturn(body.status) && !isReturn(sale.status)) {
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

        // Create a structured Return record
        await tx.return.create({
          data: {
            date: new Date(),
            saleId: sale.id,
            qty: sale.qty,
            reason: body.notes || 'Retur pesanan marketplace',
          },
        });
      }

      // Handle reverting from RETURN to non-return (DITERIMA / HILANG / TERKIRIM)
      if (isReturn(sale.status) && isNonReturn(body.status)) {
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

        // Remove the Return record
        await tx.return.deleteMany({
          where: { saleId: sale.id },
        });
      }

      // Build update data
      const updateData: Record<string, unknown> = {};
      if (body.status !== undefined) updateData.status = body.status;
      if (body.orderId !== undefined) updateData.orderId = body.orderId;
      if (body.resi !== undefined) updateData.resi = body.resi;
      if (body.notes !== undefined) updateData.notes = body.notes;
      if (body.unitPrice !== undefined) updateData.unitPrice = body.unitPrice;
      if (body.voucher !== undefined) updateData.voucher = body.voucher;
      if (body.discount !== undefined) updateData.discount = body.discount;
      if (body.platformFee !== undefined) updateData.platformFee = body.platformFee;
      if (body.shippingFee !== undefined) updateData.shippingFee = body.shippingFee;
      if (body.hpp !== undefined) updateData.hpp = body.hpp;
      if (body.totalHpp !== undefined) updateData.totalHpp = body.totalHpp;
      if (body.fee !== undefined) updateData.fee = body.fee;
      if (body.total !== undefined) updateData.total = body.total;

      const effectivePlatformFee = body.platformFee !== undefined ? body.platformFee : (sale.platformFee || 0);
      const effectiveShippingFee = body.shippingFee !== undefined ? body.shippingFee : (sale.shippingFee || 0);
      const effectiveTotalHpp = body.totalHpp !== undefined && body.totalHpp > 0
        ? body.totalHpp
        : (sale.totalHpp > 0 ? sale.totalHpp : (sale.hpp > 0 ? sale.hpp : (sale.qty * (sale.sku?.hppPrice || 0))));

      if (body.status === 'HILANG') {
        // Hilang: Omset = 0, Laba = -(HPP + ongkir + platform fee)
        const currentOmset = body.omset !== undefined ? body.omset : 0;
        updateData.omset = currentOmset;
        updateData.netRevenue = currentOmset;
        updateData.laba = body.laba !== undefined
          ? body.laba
          : currentOmset - (effectiveTotalHpp + effectiveShippingFee + effectivePlatformFee);
      } else if (isReturn(body.status)) {
        // Return: Omset = 0, Laba = -(ongkir + platform fee) karena barang di-restock ke gudang
        const currentOmset = body.omset !== undefined ? body.omset : 0;
        updateData.omset = currentOmset;
        updateData.netRevenue = currentOmset;
        updateData.laba = body.laba !== undefined
          ? body.laba
          : currentOmset - (effectiveShippingFee + effectivePlatformFee);
      } else if (body.status === 'DITERIMA' || body.status === 'TERKIRIM') {
        if (body.omset !== undefined) updateData.omset = body.omset;
        if (body.netRevenue !== undefined) updateData.netRevenue = body.netRevenue;
        if (body.laba !== undefined) {
          updateData.laba = body.laba;
        } else if (isReturn(sale.status) || sale.status === 'HILANG') {
          // Reverting from HILANG or RETURN: restore normal omset and laba
          const unitPrice = body.unitPrice !== undefined ? body.unitPrice : (sale.unitPrice || 0);
          const gross = body.total !== undefined ? body.total : (sale.total || sale.qty * unitPrice);
          const voucher = body.voucher !== undefined ? body.voucher : (sale.voucher || 0);
          const discount = body.discount !== undefined ? body.discount : (sale.discount || 0);
          const fee = (effectivePlatformFee + effectiveShippingFee) || sale.fee || 0;
          const normalOmset = gross - voucher - discount - fee;
          updateData.omset = normalOmset > 0 ? normalOmset : gross;
          updateData.netRevenue = updateData.omset;
          updateData.laba = (updateData.omset as number) - effectiveTotalHpp;
        }
      } else {
        if (body.omset !== undefined) updateData.omset = body.omset;
        if (body.netRevenue !== undefined) updateData.netRevenue = body.netRevenue;
        if (body.laba !== undefined) updateData.laba = body.laba;
      }

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
