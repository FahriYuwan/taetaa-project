import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType, Channel } from '@prisma/client';
import { resolveSaleHpp, resolveSaleProfit } from '@/lib/finance';
import { validateBody, createSaleSchema } from '@/lib/validations';


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');

    const where: any = {};
    if (channel && channel !== 'all') {
      where.channel = channel as Channel;
    }
    if (status && status !== 'all') {
      where.status = status;

    }
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.date.lte = toDate;
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        sku: {
          select: {
            id: true,
            code: true,
            name: true,
            hppPrice: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { orderId: 'asc' }],
    });

    const costHistories = await prisma.sKUCostHistory.findMany();
    const costMap = new Map(costHistories.map((ch) => [ch.skuId, ch.avgCost]));

    const formatted = sales.map((sale) => {
      const unitPrice = sale.unitPrice || 0;
      const qty = sale.qty || 0;
      const total = sale.total || qty * unitPrice;
      const fee = sale.fee || 0;
      const netRevenue =
        sale.netRevenue !== undefined && sale.netRevenue !== null && sale.netRevenue !== 0
          ? sale.netRevenue
          : total - fee;

      // HPP & Laba: unified resolution from lib/finance
      const avgCost = costMap.get(sale.skuId) ?? sale.sku?.hppPrice ?? 0;
      const totalHpp = resolveSaleHpp(sale, avgCost);
      const hpp = sale.hpp > 0 ? sale.hpp : (qty > 0 ? totalHpp / qty : totalHpp);
      const laba = resolveSaleProfit(sale, netRevenue, totalHpp);

      return {
        ...sale,
        total,
        netRevenue,
        avgCost,
        hpp,
        totalHpp,
        laba,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = validateBody(createSaleSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, details: validation.issues }, { status: 400 });
    }

    const {
      date,
      skuId,
      qty,
      unitPrice,
      channel,
      orderId,
      resi,
      fee,
      notes,
      voucher,
      discount,
      platformFee,
      shippingFee,
    } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify stock availability
      const costHistory = await tx.sKUCostHistory.findUnique({
        where: { skuId },
      });

      if (!costHistory || costHistory.stock < qty) {
        throw new Error(`Stok tidak cukup (Tersedia: ${costHistory?.stock || 0})`);
      }

      // 2. Calculate financial values
      const price = unitPrice || 0;
      const total = qty * price;
      const totalFee = fee || 0;
      const voucherAmt = voucher || 0;
      const discountAmt = discount || 0;
      const platformFeeAmt = platformFee || 0;
      const shippingFeeAmt = shippingFee || 0;
      const netRevenue = total - voucherAmt - discountAmt - platformFeeAmt - shippingFeeAmt - totalFee;
      const hppPerUnit = costHistory.avgCost;
      const hppTotal = qty * hppPerUnit;
      const laba = netRevenue - hppTotal;

      // 3. Create Sale record
      const sale = await tx.sale.create({
        data: {
          date: new Date(date),
          skuId,
          qty,
          unitPrice: price,
          total,
          channel: channel as Channel,
          orderId,
          fee: totalFee,
          netRevenue,
          voucher: voucherAmt,
          discount: discountAmt,
          platformFee: platformFeeAmt,
          shippingFee: shippingFeeAmt,
          omset: netRevenue,
          hpp: hppTotal,
          totalHpp: hppTotal,
          laba,
          notes,
          status: 'TERKIRIM' as any,

          scannedByLogistic: false,
          financeMatched: true,
        },
      });

      // 4. Create Inventory Movement
      await tx.inventory.create({
        data: {
          date: new Date(date),
          skuId,
          movement: -qty,
          type: MovementType.SALE,
          reference: sale.id,
        },
      });

      // 5. Update Stock
      await tx.sKUCostHistory.update({
        where: { skuId },
        data: {
          stock: { decrement: qty },
        },
      });

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Sale creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record sale' }, { status: 500 });
  }
}
