import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType, Channel } from '@prisma/client';

// POST /api/sales/scan
// Used by logistics team with barcode scanner
// Body: { channel: string, orderId: string, items: [{ skuCode: string, qty: number }] }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { channel, orderId, resi, items } = body;

    const resiNum = (resi || orderId || '').trim();

    if (!channel || !resiNum || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'channel, nomor resi, dan items wajib diisi' }, { status: 400 });
    }

    const channelUpper = channel.toUpperCase() as Channel;
    const validChannels = ['SHOPEE', 'TIKTOK', 'TOKOPEDIA', 'OFFLINE', 'AFFILIATE'];
    if (!validChannels.includes(channelUpper)) {
      return NextResponse.json({ error: `Channel tidak valid. Pilih: ${validChannels.join(', ')}` }, { status: 400 });
    }

    // Check if this resi already exists for the same channel
    const existingOrder = await prisma.sale.findFirst({
      where: {
        channel: channelUpper,
        OR: [
          { resi: resiNum },
          { orderId: resiNum },
        ],
      },
    });
    if (existingOrder) {
      return NextResponse.json(
        { error: `Nomor resi ${resiNum} sudah pernah discan untuk ${channel}` },
        { status: 409 }
      );
    }

    const results = await prisma.$transaction(async (tx) => {
      const createdSales = [];

      for (const item of items) {
        const { skuCode, qty } = item;
        if (!skuCode || !qty || qty <= 0) continue;

        const sku = await tx.sKU.findUnique({ where: { code: skuCode.trim().toUpperCase() } });
        if (!sku) continue;

        // Check stock availability
        const costHistory = await tx.sKUCostHistory.findUnique({ where: { skuId: sku.id } });
        if (!costHistory || costHistory.stock < qty) {
          throw new Error(`Stok ${sku.code} tidak cukup (tersedia: ${costHistory?.stock ?? 0})`);
        }

        const hppPerUnit = costHistory.avgCost ?? sku.hppPrice ?? 0;
        const hppTotal = qty * hppPerUnit;

        // Create sale record (no price data yet - will be filled by finance via bulk paste)
        const sale = await tx.sale.create({
          data: {
            date: new Date(),
            skuId: sku.id,
            qty,
            unitPrice: 0,
            total: 0,
            channel: channelUpper,
            orderId: null, // Diisi oleh finance (Order Code marketplace)
            resi: resiNum, // Nomor resi pengiriman fisik hasil scan logistik
            fee: 0,
            netRevenue: 0,
            hpp: hppTotal,
            totalHpp: hppTotal,
            status: 'DITERIMA' as any,
            scannedByLogistic: true,
            financeMatched: false,
          },
        });

        // Create inventory movement
        await tx.inventory.create({
          data: {
            date: new Date(),
            skuId: sku.id,
            movement: -qty,
            type: MovementType.SALE,
            reference: sale.id,
          },
        });

        // Decrement stock
        await tx.sKUCostHistory.update({
          where: { skuId: sku.id },
          data: { stock: { decrement: qty } },
        });

        createdSales.push({ ...sale, skuCode: sku.code, skuName: sku.name });
      }

      return createdSales;
    });

    return NextResponse.json(
      {
        success: true,
        count: results.length,
        message: `${results.length} item berhasil discan untuk resi ${orderId}`,
        data: results,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Scan sale error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan hasil scan' }, { status: 500 });
  }
}
