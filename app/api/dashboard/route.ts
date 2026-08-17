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

    // Get all sales within date range
    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },
      },
      include: {
        sku: true,
      },
    });

    // Get all purchases within date range
    const purchases = await prisma.purchase.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },
      },
      include: {
        sku: true,
      },
    });

    // Get current inventory snapshot
    const inventory = await prisma.inventory.findMany({
      include: {
        sku: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate KPIs from sales
    const totalGross = sales.reduce((sum: number, sale) => sum + (sale.total || 0), 0);
    const totalFee = sales.reduce((sum: number, sale) => sum + (sale.fee || 0), 0);
    const netRevenue = totalGross - totalFee;

    // Simple HPP calculation (qty * estimated unit cost)
    // In a real system, this would use weighted average from purchase history
    const totalHPP = sales.reduce((sum: number, sale) => {
      const estimatedUnitCost = 12000; // placeholder
      const hpp = sale.qty * estimatedUnitCost;
      return sum + hpp;
    }, 0);

    const netProfit = netRevenue - totalHPP;
    const profitMargin =
      netRevenue > 0 ? Math.round((netProfit / netRevenue) * 100) : 0;
    const totalOrders = sales.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(netRevenue / totalOrders) : 0;

    // Inventory values by type (aggregate by SKU type and latest movement)
    const skuInventories = new Map<string, { quantity: number; sku: any }>();
    inventory.forEach((inv) => {
      if (!skuInventories.has(inv.skuId)) {
        skuInventories.set(inv.skuId, { quantity: 0, sku: inv.sku });
      }
      const entry = skuInventories.get(inv.skuId)!;
      entry.quantity += inv.movement;
    });

    const inventoryByType: Record<string, number> = {};
    skuInventories.forEach(({ quantity, sku }) => {
      const type = sku.type;
      const estimatedUnitCost = 15000; // placeholder
      const value = Math.max(0, quantity) * estimatedUnitCost;
      if (!inventoryByType[type]) inventoryByType[type] = 0;
      inventoryByType[type] += value;
    });

    const totalPurchaseAmount = purchases.reduce(
      (sum: number, purchase) => sum + (purchase.total || 0),
      0
    );

    // Time series data (daily aggregation)
    const dateMap = new Map<string, any>();
    sales.forEach((sale) => {
      const dateStr = sale.date.toISOString().split('T')[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {
          date: dateStr,
          revenue: 0,
          hpp: 0,
          profit: 0,
        });
      }
      const entry = dateMap.get(dateStr)!;
      const saleRevenue = sale.total - (sale.fee || 0);
      const estimatedHPP = sale.qty * 12000;
      entry.revenue += saleRevenue;
      entry.hpp += estimatedHPP;
      entry.profit = entry.revenue - entry.hpp;
    });

    const timeSeriesData = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Marketplace breakdown
    const marketplaceMap = new Map<string, number>();
    sales.forEach((sale) => {
      const channel = sale.channel || 'OFFLINE';
      const revenue = sale.total - (sale.fee || 0);
      marketplaceMap.set(channel, (marketplaceMap.get(channel) || 0) + revenue);
    });

    const marketplaceData = Array.from(marketplaceMap.entries()).map(
      ([name, revenue]) => ({ name, revenue })
    );

    // Top 10 SKUs by profit
    const skuProfitMap = new Map<string, any>();
    sales.forEach((sale) => {
      const skuCode = sale.sku?.code || 'Unknown';
      const saleRevenue = sale.total - (sale.fee || 0);
      const estimatedHPP = sale.qty * 12000;
      const saleProfit = saleRevenue - estimatedHPP;

      if (!skuProfitMap.has(skuCode)) {
        skuProfitMap.set(skuCode, {
          skuCode,
          quantity: 0,
          revenue: 0,
          profit: 0,
        });
      }
      const entry = skuProfitMap.get(skuCode)!;
      entry.quantity += sale.qty;
      entry.revenue += saleRevenue;
      entry.profit += saleProfit;
    });

    const top10SKUs = Array.from(skuProfitMap.values())
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

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
        name: 'WIP',
        value: inventoryByType['WIP'] || 0,
        color: '#F97316', // semantic.orange
      },
    ];

    return Response.json({
      kpi: {
        netRevenue,
        totalHPP,
        netProfit,
        profitMargin,
        totalOrders,
        avgOrderValue,
        inventoryRaw: inventoryByType['RAW'] || 0,
        inventoryWip: inventoryByType['WIP'] || 0,
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
