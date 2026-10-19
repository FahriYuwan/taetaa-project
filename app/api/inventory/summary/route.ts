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
    const [
      skus,
      costHistories,
      allBomComponents,
      productionOutputs,
      kemasanItems,
      kemasanPurchases,
      kemasanProductionInputs,
    ] = await Promise.all([
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
      prisma.masterItemKemasan.findMany({
        orderBy: { code: 'asc' },
      }),
      prisma.purchase.findMany({
        where: {
          kemasanId: { not: null },
          date: { lte: to },
        },
        select: {
          kemasanId: true,
          qty: true,
          date: true,
        },
      }),
      prisma.productionKemasanInput.findMany({
        where: {
          production: {
            date: { lte: to },
          },
        },
        select: {
          kemasanId: true,
          qtyUsed: true,
          production: {
            select: {
              date: true,
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
    const skuResult = skus.map((sku) => {
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
        type: sku.type as any,
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

    // 3. Aggregate movements per MasterItemKemasan
    const kemasanPurchasesMap = new Map<string, Array<{ qty: number; date: Date }>>();
    for (const p of kemasanPurchases) {
      if (!p.kemasanId) continue;
      const list = kemasanPurchasesMap.get(p.kemasanId) || [];
      list.push({ qty: p.qty, date: p.date });
      kemasanPurchasesMap.set(p.kemasanId, list);
    }

    const kemasanProductionMap = new Map<string, Array<{ qtyUsed: number; date: Date }>>();
    for (const pki of kemasanProductionInputs) {
      if (!pki.kemasanId || !pki.production?.date) continue;
      const list = kemasanProductionMap.get(pki.kemasanId) || [];
      list.push({ qtyUsed: pki.qtyUsed, date: pki.production.date });
      kemasanProductionMap.set(pki.kemasanId, list);
    }

    const kemasanResult = kemasanItems.map((k) => {
      const purchases = kemasanPurchasesMap.get(k.id) || [];
      const prodInputs = kemasanProductionMap.get(k.id) || [];

      let masukBeli = 0;
      purchases.forEach((p) => {
        const d = new Date(p.date);
        if (d >= from && d <= to) {
          masukBeli += p.qty;
        }
      });

      let keluarProduksi = 0;
      prodInputs.forEach((pi) => {
        const d = new Date(pi.date);
        if (d >= from && d <= to) {
          keluarProduksi += pi.qtyUsed;
        }
      });

      const stockAkhir = k.stock;
      const stockAwal = Math.max(0, stockAkhir - masukBeli + keluarProduksi);
      const nilaiStock = stockAkhir * k.avgCost;

      return {
        id: k.id,
        code: k.code,
        name: k.name,
        type: 'KEMASAN' as const,
        stockAwal,
        masukBeli,
        masukProduksi: 0,
        keluarProduksi,
        keluarJual: 0,
        keluarBreakage: 0,
        keluarAffiliate: 0,
        stockAkhir,
        stockMin: k.stockMin ?? 0,
        avgCost: k.avgCost,
        nilaiStock,
        rawBreakdown: null,
      };
    });

    const combinedResult = [...skuResult, ...kemasanResult];

    // 4. Calculate KPIs
    const kpi = {
      totalValue: 0,
      raw: { value: 0, count: 0 },
      product: { value: 0, count: 0 },
      package: { value: 0, count: 0 },
      kemasan: { value: 0, count: 0 },
    };

    combinedResult.forEach((item) => {
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
      } else if (item.type === 'KEMASAN') {
        kpi.kemasan.value += item.nilaiStock;
        kpi.kemasan.count++;
      }
    });

    return NextResponse.json({ kpi, items: combinedResult });
  } catch (error) {
    console.error('Inventory dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory summary' }, { status: 500 });
  }
}
