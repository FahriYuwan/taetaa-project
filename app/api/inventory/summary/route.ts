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

    // 1. Batch fetch all required data in parallel — eliminates N+1 queries completely
    const [skus, costHistories, allBomComponents, productionOutputs] = await Promise.all([
      prisma.sKU.findMany({
        include: {
          inventory: {
            where: {
              date: { lte: to },
            },
          },
        },
      }),
      prisma.sKUCostHistory.findMany(),
      prisma.bOMComponent.findMany({
        where: { childSkuId: { not: null } },
        include: {
          parent: {
            select: {
              id: true,
              code: true,
              name: true,
              productSize: true,
            },
          },
        },
      }),
      prisma.productionOutput.findMany({
        where: {
          production: {
            date: {
              gte: from,
              lte: to,
            },
          },
        },
        include: {
          production: {
            select: {
              outputQty: true,
            },
          },
        },
      }),
    ]);

    const costMap = new Map(costHistories.map((ch) => [ch.skuId, ch]));

    // Pre-aggregate production quantities by parent SKU
    const productionQtyByParentSku = new Map<string, number>();
    for (const po of productionOutputs) {
      const current = productionQtyByParentSku.get(po.skuId) || 0;
      productionQtyByParentSku.set(po.skuId, current + (po.production?.outputQty || 0));
    }

    // Pre-group BOM components by child SKU
    const bomByChildSku = new Map<string, typeof allBomComponents>();
    for (const bom of allBomComponents) {
      if (!bom.childSkuId) continue;
      const list = bomByChildSku.get(bom.childSkuId) || [];
      list.push(bom);
      bomByChildSku.set(bom.childSkuId, list);
    }

    // 2. Aggregate movements per SKU purely in memory
    const result = skus.map((sku) => {
      let stockAwal = 0;
      let masukBeli = 0;
      let masukProduksi = 0;
      let keluarProduksi = 0;
      let keluarJual = 0;
      let keluarBreakage = 0;
      let keluarAffiliate = 0;

      sku.inventory.forEach((inv) => {
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
          } else if (inv.type === MovementType.BREAKAGE) {
            keluarBreakage += Math.abs(inv.movement);
          } else if (inv.type === MovementType.AFFILIATE_SEEDING) {
            keluarAffiliate += Math.abs(inv.movement);
          }
        }
      });

      const stockAkhir =
        stockAwal + masukBeli + masukProduksi - keluarProduksi - keluarJual - keluarBreakage - keluarAffiliate;
      const costInfo = costMap.get(sku.id);
      const avgCost = costInfo?.avgCost || 0;
      const nilaiStock = stockAkhir * avgCost;

      // 2a. Calculate breakdown for RAW purely from in-memory maps
      let rawBreakdown: Array<{ parentCode: string; qtyProduced: number; totalUsage: number }> | null = null;
      if (sku.type === SKUType.RAW) {
        const uses = bomByChildSku.get(sku.id) || [];
        const usageList: Array<{ parentCode: string; qtyProduced: number; totalUsage: number }> = [];

        for (const use of uses) {
          const totalQty = productionQtyByParentSku.get(use.parentId) || 0;
          const totalUsageMl = totalQty * use.quantity; // use.quantity is ml needed per parent unit

          if (totalUsageMl > 0) {
            usageList.push({
              parentCode: use.parent.code,
              qtyProduced: totalQty,
              totalUsage: totalUsageMl,
            });
          }
        }
        rawBreakdown = usageList;
      }

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
        keluarBreakage,
        keluarAffiliate,
        stockAkhir,
        stockMin: sku.stockMin ?? 0,
        avgCost,
        nilaiStock,
        rawBreakdown,
      };
    });

    // 3. Calculate KPIs
    const kpi = {
      totalValue: 0,
      raw: { value: 0, count: 0 },
      product: { value: 0, count: 0 },
      package: { value: 0, count: 0 },
    };

    result.forEach((item) => {
      kpi.totalValue += item.nilaiStock;
      if (item.type === SKUType.RAW) {
        kpi.raw.value += item.nilaiStock;
        kpi.raw.count++;
      } else if (item.type === SKUType.PRODUCT) {
        kpi.product.value += item.nilaiStock;
        kpi.product.count++;
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
