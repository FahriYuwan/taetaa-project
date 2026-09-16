import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';

// GET /api/inventory/opname/[id] — detail opname session with items + SKU info
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const opname = await prisma.stockOpname.findUnique({
      where: { id },
      include: {
        items: {
          include: { sku: { select: { code: true, name: true, type: true } } },
          orderBy: { sku: { code: 'asc' } },
        },
      },
    });
    if (!opname) {
      return NextResponse.json({ error: 'Opname not found' }, { status: 404 });
    }
    return NextResponse.json(opname);
  } catch (error) {
    console.error('Failed to fetch opname detail:', error);
    return NextResponse.json({ error: 'Failed to fetch opname detail' }, { status: 500 });
  }
}

// PATCH /api/inventory/opname/[id] — post the opname (DRAFT/REVIEW → POSTED)
// Atomically: creates Inventory ADJUSTMENT movements + updates SKUCostHistory + marks POSTED
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const opname = await prisma.stockOpname.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!opname) {
      return NextResponse.json({ error: 'Opname not found' }, { status: 404 });
    }

    if (opname.status === 'POSTED') {
      return NextResponse.json(
        { error: 'Opname ini sudah diposting dan tidak dapat diposting ulang.' },
        { status: 409 }
      );
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Process only checked items with non-zero diff
      for (const item of opname.items) {
        if (!item.checked || item.diff === 0) continue;

        // Create inventory movement (ADJUSTMENT)
        await tx.inventory.create({
          data: {
            date: now,
            skuId: item.skuId,
            movement: item.diff,
            type: MovementType.ADJUSTMENT,
            reference: opname.id,
          },
        });

        // Update or create SKUCostHistory stock
        const costHistory = await tx.sKUCostHistory.findUnique({
          where: { skuId: item.skuId },
        });
        if (costHistory) {
          await tx.sKUCostHistory.update({
            where: { skuId: item.skuId },
            data: { stock: { increment: item.diff } },
          });
        } else {
          await tx.sKUCostHistory.create({
            data: { skuId: item.skuId, stock: item.diff, avgCost: 0 },
          });
        }
      }

      // Mark opname as POSTED
      const posted = await tx.stockOpname.update({
        where: { id },
        data: { status: 'POSTED', updatedAt: now },
      });

      return posted;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to post opname:', error);
    return NextResponse.json({ error: error.message || 'Failed to post opname' }, { status: 500 });
  }
}

// PUT /api/inventory/opname/[id] — update draft opname (forbidden if POSTED)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { notes, items } = body;

    const existing = await prisma.stockOpname.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Opname tidak ditemukan' }, { status: 404 });
    }

    if (existing.status === 'POSTED') {
      return NextResponse.json(
        { error: 'Stock Opname yang sudah POSTED tidak boleh diedit. Jika diperlukan koreksi, buat transaksi opname baru.' },
        { status: 403 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Data items tidak valid' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const opname = await tx.stockOpname.update({
        where: { id },
        data: {
          notes: notes !== undefined ? notes : existing.notes,
          updatedAt: new Date(),
        },
      });

      await tx.stockOpnameItem.deleteMany({ where: { opnameId: id } });

      for (const item of items) {
        await tx.stockOpnameItem.create({
          data: {
            opnameId: id,
            skuId: item.skuId,
            systemStock: item.systemStock,
            physicalStock: item.physicalStock,
            diff: item.diff,
            checked: item.checked ?? false,
            notes: item.notes || '',
          },
        });
      }

      return opname;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to update opname draft:', error);
    return NextResponse.json({ error: error.message || 'Failed to update opname draft' }, { status: 500 });
  }
}

// DELETE /api/inventory/opname/[id] — delete draft opname (forbidden if POSTED)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.stockOpname.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Opname tidak ditemukan' }, { status: 404 });
    }

    if (existing.status === 'POSTED') {
      return NextResponse.json(
        { error: 'Stock Opname yang sudah POSTED tidak boleh dihapus. Riwayat transaksi inventaris terkunci untuk audit trail.' },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.stockOpnameItem.deleteMany({ where: { opnameId: id } });
      await tx.stockOpname.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: 'Draft Stock Opname berhasil dihapus.' });
  } catch (error: any) {
    console.error('Failed to delete opname draft:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete opname draft' }, { status: 500 });
  }
}