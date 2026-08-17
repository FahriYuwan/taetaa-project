import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType, SKUType } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!fromDate || !toDate) {
      return NextResponse.json({ error: 'Missing date range' }, { status: 400 });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    // 1. Fetch all SKUs and their cost history
    const skus = await prisma.sKU.findMany({
      include: {
        inventory: true, // We'll aggregate this in JS for flexibility
      },
    });

    const costHistories = await prisma.sKUCostHistory.findMany();
    const costMap = new Map(costHistories.map(ch => [ch.skuId, ch]));

    // 2. Aggregate movements per SKU
    const result = skus.map(sku => {
      let stockAwal = 0;
      let masukBeli = 0;
      let masukProduksi = 0;
      let keluarProduksi = 0;
      let keluarJual = 0;

      sku.inventory.forEach(inv => {
        const invDate = new Date(inv.date);
        if (invDate < from) {
          stockAwal += inv.movement;
        } else if (invDate <= to) {
          if (inv.type === MovementType.PURCHASE) {
            masukBeli += inv.movement;
          } else if (inv.type === MovementType.PRODUCTION) {
            if (inv.movement > 0) masukProduksi += inv.movement;
            else keluarProduksi += Math.abs(inv.movement);
          } else if (inv.type === MovementType.SALE) {
            keluarJual += Math.abs(inv.movement);
          }
          // Note: ADJUSTMENT, BREAKAGE, etc. are currently ignored in specific columns
          // as per spec 6.1, but they affect real stock.
          // However, for "Stock Akhir" as defined by spec formula:
        }
      });

      const stockAkhir = stockAwal + masukBeli + masukProduksi - keluarProduksi - keluarJual;
      const costInfo = costMap.get(sku.id);
      const avgCost = costInfo?.avgCost || 0;
      const nilaiStock = stockAkhir * avgCost;

      return {
        id: sku.id,
        code: sku.code,
        name: sku.name,
        type: sku.type,
        stockAwal,
        masukBeli,
        masukProduksi,
        keluarProduksi,
        keluarJual,
        stockAkhir,
        avgCost,
        nilaiStock
      };
    });

    // 3. Calculate KPIs
    const kpi = {
      totalValue: 0,
      raw: { value: 0, count: 0 },
      wip: { value: 0, count: 0 },
      package: { value: 0, count: 0 }
    };

    result.forEach(item => {
      kpi.totalValue += item.nilaiStock;
      if (item.type === SKUType.RAW) {
        kpi.raw.value += item.nilaiStock;
        kpi.raw.count++;
      } else if (item.type === SKUType.WIP) {
        kpi.wip.value += item.nilaiStock;
        kpi.wip.count++;
      } else if (item.type === SKUType.PACKAGE) {
        kpi.package.value += item.nilaiStock;
        kpi.package.count++;
      }
    });

    return NextResponse.json({ kpi, items: result });
  } catch (error) {
    console.error('Inventory dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory summary' }, { status: 500 });
  }
}
