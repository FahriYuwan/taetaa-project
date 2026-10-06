import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!fromDate || !toDate) {
      return Response.json({ error: 'Missing date range' }, { status: 400 });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    // Fetch data in parallel for performance
    const [sales, purchases, inventory, costHistories, expenses, breakages] = await Promise.all([
      prisma.sale.findMany({
        where: {
          date: {
            gte: from,
            lte: to,
          },
        },
        include: {
          sku: true,
        },
      }),
      prisma.purchase.findMany({
        where: {
          date: {
            gte: from,
            lte: to,
          },
        },
        include: {
          sku: true,
        },
      }),
      prisma.inventory.findMany({
        include: {
          sku: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sKUCostHistory.findMany(),
      prisma.otherExpense.findMany({
        where: {
          date: {
            gte: from,
            lte: to,
          },
        },
      }),
      prisma.breakage.findMany({
        where: {
          date: {
            gte: from,
            lte: to,
          },
        },
      }),
    ]);

    const costMap = new Map(costHistories.map((ch) => [ch.skuId, ch.avgCost]));

    // Sales Aggregations
    let totalGross = 0;
    let totalFee = 0;
    let netRevenue = 0;
    let totalHPP = 0;
    let totalQtySold = 0;
    let returnLoss = 0;
    const uniqueOrders = new Set<string>();

    const dateMap = new Map<string, { date: string; revenue: number; hpp: number; profit: number }>();
    const marketplaceMap = new Map<string, number>();
    const skuProfitMap = new Map<string, { skuCode: string; quantity: number; revenue: number; profit: number }>();

    sales.forEach((sale) => {
      const fee = sale.fee || ((sale.platformFee || 0) + (sale.shippingFee || 0));
      const avgCost = costMap.get(sale.skuId) ?? sale.sku?.hppPrice ?? 0;

      // Handle Cancelled orders
      if (sale.status === 'DIBATALKAN') {
        // Order batal: Tidak ada omset & HPP karena pesanan dibatalkan sebelum terselesaikan
        // Biaya non-refundable (jika ada pinalti/fee) diperhitungkan sebagai rugi
        if (fee > 0) returnLoss += fee;
        return;
      }

      // Handle Returned orders
      if (sale.status === 'DIRETURN') {
        // Order direturn: Produk dikembalikan ke gudang (stok direstore, HPP bersih = 0)
        // Pembeli direfund sehingga omset = 0.
        // Biaya ongkir retur / fee marketplace yang tidak dapat dikembalikan diperhitungkan sebagai kerugian retur
        const lossFromFee = fee > 0 ? fee : (sale.shippingFee || 0);
        if (sale.omset < 0) {
          returnLoss += Math.abs(sale.omset);
        } else {
          returnLoss += lossFromFee;
        }
        return;
      }

      // Order TERKIRIM
      const gross = sale.total || (sale.qty * (sale.unitPrice || 0));
      const saleNetRevenue =
        sale.omset > 0
          ? sale.omset
          : (sale.netRevenue > 0
              ? sale.netRevenue
              : gross - (sale.voucher || 0) - (sale.discount || 0) - fee);

      const saleHpp =
        sale.totalHpp > 0
          ? sale.totalHpp
          : (sale.hpp > 0
              ? sale.hpp
              : sale.qty * avgCost);

      const saleProfit =
        sale.laba !== 0 && sale.laba !== undefined && sale.laba !== null
          ? sale.laba
          : saleNetRevenue - saleHpp;

      totalGross += gross;
      totalFee += fee;
      netRevenue += saleNetRevenue;
      totalHPP += saleHpp;
      totalQtySold += sale.qty;

      // Unique order based on resi (or orderId fallback)
      const orderKey = sale.resi?.trim() || sale.orderId?.trim() || sale.id;
      uniqueOrders.add(orderKey);

      // Time series data (daily aggregation)
      const dateStr = sale.date.toISOString().split('T')[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {
          date: dateStr,
          revenue: 0,
          hpp: 0,
          profit: 0,
        });
      }
      const timeEntry = dateMap.get(dateStr)!;
      timeEntry.revenue += saleNetRevenue;
      timeEntry.hpp += saleHpp;
      timeEntry.profit += saleProfit;

      // Marketplace breakdown
      const channel = sale.channel || 'OFFLINE';
      marketplaceMap.set(channel, (marketplaceMap.get(channel) || 0) + saleNetRevenue);

      // Top 10 SKUs by profit
      const skuCode = sale.sku?.code || 'Unknown';
      if (!skuProfitMap.has(skuCode)) {
        skuProfitMap.set(skuCode, {
          skuCode,
          quantity: 0,
          revenue: 0,
          profit: 0,
        });
      }
      const skuEntry = skuProfitMap.get(skuCode)!;
      skuEntry.quantity += sale.qty;
      skuEntry.revenue += saleNetRevenue;
      skuEntry.profit += saleProfit;
    });

    const timeSeriesData = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const marketplaceData = Array.from(marketplaceMap.entries()).map(
      ([name, revenue]) => ({ name, revenue })
    );

    const top10SKUs = Array.from(skuProfitMap.values())
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    // Other Expenses & Breakages
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalBreakage = breakages.reduce((sum, brk) => sum + (brk.total || 0), 0);
    const totalOtherLosses = totalExpenses + totalBreakage + returnLoss;

    // Financial KPI Summary
    const grossProfit = netRevenue - totalHPP;
    const netProfit = grossProfit - totalOtherLosses;
    const profitMargin =
      netRevenue > 0 ? Math.round((netProfit / netRevenue) * 100) : 0;
    const totalOrders = uniqueOrders.size;
    const avgOrderValue = totalOrders > 0 ? Math.round(netRevenue / totalOrders) : 0;

    // Current Inventory values by type
    const skuInventories = new Map<string, { quantity: number; sku: any }>();
    inventory.forEach((inv) => {
      if (!skuInventories.has(inv.skuId)) {
        skuInventories.set(inv.skuId, { quantity: 0, sku: inv.sku });
      }
      const entry = skuInventories.get(inv.skuId)!;
      entry.quantity += inv.movement;
    });

    const inventoryByType: Record<string, number> = {
      RAW: 0,
      PRODUCT: 0,
      PACKAGE: 0,
    };

    skuInventories.forEach(({ quantity, sku }) => {
      const type = sku?.type;
      const avgCost = costMap.get(sku?.id) ?? sku?.hppPrice ?? 0;
      const value = Math.max(0, quantity) * avgCost;
      if (type && inventoryByType[type] !== undefined) {
        inventoryByType[type] += value;
      }
    });

    // Total Purchases within date range (RAW)
    const totalPurchaseAmount = purchases
      .filter((p) => !p.sku || p.sku.type === 'RAW')
      .reduce((sum: number, purchase) => sum + (purchase.total || 0), 0);

    // Inventory donut data
    const inventoryDonutData = [
      {
        name: 'PACKAGE',
        value: inventoryByType['PACKAGE'] || 0,
        color: '#1E88E5', // brand-500
      },
      {
        name: 'RAW',
        value: inventoryByType['RAW'] || 0,
        color: '#4FC3F7', // brand-400
      },
      {
        name: 'PRODUCT',
        value: inventoryByType['PRODUCT'] || 0,
        color: '#F97316', // semantic.orange
      },
    ];

    return Response.json({
      kpi: {
        totalGross,
        totalFee,
        netRevenue,
        totalHPP,
        grossProfit,
        totalExpenses,
        totalBreakage,
        returnLoss,
        totalOtherLosses,
        netProfit,
        profitMargin,
        totalOrders,
        totalQtySold,
        avgOrderValue,
        inventoryRaw: inventoryByType['RAW'] || 0,
        inventoryProduct: inventoryByType['PRODUCT'] || 0,
        inventoryPackage: inventoryByType['PACKAGE'] || 0,
        totalPurchaseAmount,
      },
      timeSeriesData,
      marketplaceData,
      top10SKUs,
      inventoryDonutData,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return Response.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
