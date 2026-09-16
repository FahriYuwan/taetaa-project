import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType, SKUType, AffiliateActivityType } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    const where: any = {};
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) {
        where.date.gte = new Date(fromDate);
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        where.date.lte = to;
      }
    }

    const activities = await prisma.affiliateActivity.findMany({
      where,
      include: {
        sku: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Fetch cost history for all SKUs
    const costHistories = await prisma.sKUCostHistory.findMany();
    const costMap = new Map(costHistories.map(ch => [ch.skuId, ch.avgCost]));

    let totalAffiliateHPP = 0;
    let totalAffiliateShipping = 0;
    let totalAffiliateBiaya = 0;
    let totalAffiliateQty = 0;
    let countAffiliate = 0;

    let totalNonAffiliateHPP = 0;
    let totalNonAffiliateShipping = 0;
    let totalNonAffiliateBiaya = 0;
    let totalNonAffiliateQty = 0;
    let countNonAffiliate = 0;

    const formatted = activities.map((item) => {
      const hppUnit = costMap.get(item.skuId) || 0;
      const hppTerpakai = hppUnit * item.qty;
      const shippingCost = item.shippingCost || 0;
      const totalBiaya = hppTerpakai + shippingCost;

      if (item.activityType === AffiliateActivityType.AFFILIATE) {
        countAffiliate++;
        totalAffiliateQty += item.qty;
        totalAffiliateHPP += hppTerpakai;
        totalAffiliateShipping += shippingCost;
        totalAffiliateBiaya += totalBiaya;
      } else {
        countNonAffiliate++;
        totalNonAffiliateQty += item.qty;
        totalNonAffiliateHPP += hppTerpakai;
        totalNonAffiliateShipping += shippingCost;
        totalNonAffiliateBiaya += totalBiaya;
      }

      return {
        ...item,
        hppUnit,
        hppTerpakai,
        totalBiaya,
      };
    });

    const summary = {
      affiliate: {
        count: countAffiliate,
        qty: totalAffiliateQty,
        hpp: totalAffiliateHPP,
        shipping: totalAffiliateShipping,
        totalBiaya: totalAffiliateBiaya,
      },
      nonAffiliate: {
        count: countNonAffiliate,
        qty: totalNonAffiliateQty,
        hpp: totalNonAffiliateHPP,
        shipping: totalNonAffiliateShipping,
        totalBiaya: totalNonAffiliateBiaya,
      },
      total: {
        count: countAffiliate + countNonAffiliate,
        qty: totalAffiliateQty + totalNonAffiliateQty,
        hpp: totalAffiliateHPP + totalNonAffiliateHPP,
        shipping: totalAffiliateShipping + totalNonAffiliateShipping,
        totalBiaya: totalAffiliateBiaya + totalNonAffiliateBiaya,
      },
    };

    return NextResponse.json({ summary, items: formatted });
  } catch (error) {
    console.error('Failed to fetch affiliate activities:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data aktivitas affiliate' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      date,
      activityType = 'AFFILIATE',
      accountUsername,
      realName,
      skuId,
      qty,
      courier,
      shippingCost = 0,
      marketplace,
      followers,
      affiliateData,
      notes,
    } = body;

    if (!date || !skuId || !qty || qty <= 0) {
      return NextResponse.json(
        { error: 'Tanggal, SKU, dan Qty wajib diisi dan valid' },
        { status: 400 }
      );
    }

    // Validate SKU exists
    const sku = await prisma.sKU.findUnique({
      where: { id: skuId },
    });

    if (!sku) {
      return NextResponse.json({ error: 'SKU tidak ditemukan' }, { status: 404 });
    }

    const activityDate = new Date(date);
    const parsedQty = parseFloat(qty);
    const parsedShipping = parseFloat(shippingCost || 0);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Affiliate Activity
      const activity = await tx.affiliateActivity.create({
        data: {
          date: activityDate,
          activityType: activityType === 'NON_AFFILIATE' ? AffiliateActivityType.NON_AFFILIATE : AffiliateActivityType.AFFILIATE,
          accountUsername: activityType === 'NON_AFFILIATE' ? (accountUsername || null) : accountUsername,
          realName: realName || null,
          skuId,
          qty: parsedQty,
          courier: courier || null,
          shippingCost: parsedShipping,
          marketplace: marketplace || null,
          followers: followers || null,
          affiliateData: affiliateData || null,
          notes: notes || null,
        },
        include: {
          sku: true,
        },
      });

      // 2. Create Inventory Mutation
      await tx.inventory.create({
        data: {
          date: activityDate,
          skuId,
          movement: -parsedQty,
          type: MovementType.AFFILIATE_SEEDING,
          reference: activity.id,
        },
      });

      // 3. Decrement SKU Cost History Stock
      const costHistory = await tx.sKUCostHistory.findUnique({
        where: { skuId },
      });

      if (costHistory) {
        await tx.sKUCostHistory.update({
          where: { skuId },
          data: {
            stock: { decrement: parsedQty },
          },
        });
      } else {
        await tx.sKUCostHistory.create({
          data: {
            skuId,
            stock: -parsedQty,
            avgCost: sku.hppPrice || 0,
          },
        });
      }

      return activity;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create affiliate activity:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mencatat aktivitas affiliate' },
      { status: 500 }
    );
  }
}
