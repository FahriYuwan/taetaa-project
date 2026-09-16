import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { ExpenseCategory } from '@prisma/client';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { date, category, recipient, amount, notes } = body;

    const parsedAmount = parseFloat(amount);
    if (!date || !category || !recipient || isNaN(parsedAmount)) {
      return NextResponse.json(
        { error: 'Field date, category, recipient, dan amount wajib diisi!' },
        { status: 400 }
      );
    }

    const updated = await prisma.otherExpense.update({
      where: { id },
      data: {
        date: new Date(date),
        category: category as ExpenseCategory,
        recipient,
        amount: parsedAmount,
        notes: notes || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Expense update error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui pengeluaran' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.otherExpense.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Pengeluaran berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Expense delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus pengeluaran' },
      { status: 500 }
    );
  }
}
