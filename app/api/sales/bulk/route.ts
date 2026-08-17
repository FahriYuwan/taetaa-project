import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType, Channel } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'No data' }, { status: 400 });

    const lines = text.trim().split('\n');
    let successCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const [dateStr, channelStr, orderId, skuCode, qtyStr, priceStr, feeStr, notes] = line.split('\t');
        if (!dateStr || !skuCode || !qtyStr || !priceStr) continue;

        const sku = await tx.sKU.findUnique({ where: { code: skuCode.trim() } });
        if (!sku) continue;

        const date = new Date(dateStr.trim());
        const qty = parseFloat(qtyStr.trim());
        const unitPrice = parseFloat(priceStr.trim().replace(/[^0-9.]/g, ''));
        const fee = feeStr ? parseFloat(feeStr.trim().replace(/[^0-9.]/g, '')) : 0;
        const total = qty * unitPrice;
        const netRevenue = total - fee;

        // Check stock
        const costHistory = await tx.sKUCostHistory.findUnique({ where: { skuId: sku.id } });
        if (!costHistory || costHistory.stock < qty) continue; // Skip if no stock

        // 1. Create Sale
        const sale = await tx.sale.create({
          data: {
            date,
            skuId: sku.id,
            qty,
            unitPrice,
            total,
            channel: channelStr.trim().toUpperCase() as Channel,
            orderId: orderId?.trim(),
            fee,
            netRevenue,
            notes: notes?.trim(),
          },
        });

        // 2. Add to Inventory
        await tx.inventory.create({
          data: {
            date,
            skuId: sku.id,
            movement: -qty,
            type: MovementType.SALE,
            reference: sale.id,
          },
        });

        // 3. Update Stock
        await tx.sKUCostHistory.update({
          where: { skuId: sku.id },
          data: { stock: { decrement: qty } },
        });

        successCount++;
      }
    });

    return NextResponse.json({ success: true, count: successCount, message: `${successCount} penjualan berhasil diimpor` });
  } catch (error: any) {
    console.error('Bulk sale import error:', error);
    return NextResponse.json({ error: 'Failed to bulk import sales' }, { status: 500 });
  }
}
