'use client';

import { useState, useEffect } from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { TimeSeriesChart } from '@/components/dashboard/TimeSeriesChart';
import { InventoryDonutChart } from '@/components/dashboard/InventoryDonutChart';
import { MarketplaceBarChart } from '@/components/dashboard/MarketplaceBarChart';
import { Top10SKUsTable } from '@/components/dashboard/Top10SKUsTable';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';

interface DashboardData {
  kpi: {
    totalGross: number;
    totalFee: number;
    netRevenue: number;
    totalHPP: number;
    grossProfit: number;
    totalExpenses: number;
    totalBreakage: number;
    returnLoss: number;
    totalOtherLosses: number;
    netProfit: number;
    profitMargin: number;
    totalOrders: number;
    totalQtySold: number;
    avgOrderValue: number;
    inventoryRaw: number;
    inventoryProduct: number;
    inventoryPackage: number;
    totalPurchaseAmount: number;
  };
  timeSeriesData: Array<{
    date: string;
    revenue: number;
    hpp: number;
    profit: number;
  }>;
  marketplaceData: Array<{
    name: string;
    revenue: number;
  }>;
  top10SKUs: Array<{
    skuCode: string;
    quantity: number;
    revenue: number;
    profit: number;
  }>;
  inventoryDonutData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export default function DashboardPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);

  // Initialize with today and 30 days ago
  const [toDate, setToDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() - 30);
    return today.toISOString().split('T')[0];
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/dashboard?from=${fromDate}&to=${toDate}`
      );
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Gagal memuat data dashboard',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fromDate, toDate]);

  return (
    <div
      className="flex-1 flex flex-col min-h-0 overflow-y-auto"
      style={{ backgroundColor: colors.neutral.bg }}
    >
      {/* Header with date filters */}
      <div
        style={{
          backgroundColor: colors.neutral.bg,
          borderBottom: `1px solid ${colors.neutral.border}`,
          padding: 'clamp(16px, 4vw, 24px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: colors.neutral.textMuted,
              marginBottom: '8px',
            }}
          >
            TAETAA COMPANY SISTEM
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: colors.neutral.textStrong,
              marginBottom: '4px',
            }}
          >
            Dashboard Utama
          </div>
          <div
            style={{
              fontSize: '14px',
              color: colors.neutral.textMuted,
            }}
          >
            Ringkasan pendapatan bersih, HPP, dan nilai inventory
          </div>
        </div>

        {/* Right side: Date filters and seed button */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          {/* From Date */}
          <div>
            <label
              style={{
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: colors.neutral.textMuted,
                display: 'block',
                marginBottom: '6px',
              }}
            >
              DARI
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                padding: '8px 12px',
                border: `1px solid ${colors.neutral.border}`,
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* To Date */}
          <div>
            <label
              style={{
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: colors.neutral.textMuted,
                display: 'block',
                marginBottom: '6px',
              }}
            >
              SAMPAI
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                padding: '8px 12px',
                border: `1px solid ${colors.neutral.border}`,
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          backgroundColor: colors.neutral.bg,
          padding: 'clamp(16px, 4vw, 24px)',
        }}
      >
        {loading && !data ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px',
              color: colors.neutral.textMuted,
            }}
          >
            Loading dashboard data...
          </div>
        ) : data ? (
          <>
            {/* KPI Cards Row 1 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <KPICard
                label="TOTAL OMSET"
                value={`Rp ${data.kpi.netRevenue.toLocaleString('id-ID')}`}
                valueColor={colors.brand[500]}
                description={`Gross: Rp ${data.kpi.totalGross.toLocaleString('id-ID')} · Fee: Rp ${data.kpi.totalFee.toLocaleString('id-ID')}`}
              />
              <KPICard
                label="TOTAL HPP (COGS)"
                value={`Rp ${data.kpi.totalHPP.toLocaleString('id-ID')}`}
                valueColor={colors.semantic.orange}
                description={`Qty terjual: ${data.kpi.totalQtySold.toLocaleString('id-ID')} pcs`}
              />
              <KPICard
                label="LABA BERSIH"
                value={`Rp ${data.kpi.netProfit.toLocaleString('id-ID')}`}
                valueColor={data.kpi.netProfit >= 0 ? colors.semantic.green : colors.semantic.red}
                description={
                  data.kpi.totalOtherLosses > 0
                    ? `Laba Penjualan: Rp ${data.kpi.grossProfit.toLocaleString('id-ID')} · Beban/Rugi: Rp ${data.kpi.totalOtherLosses.toLocaleString('id-ID')}`
                    : `${data.kpi.profitMargin}% margin laba bersih`
                }
              />
              <KPICard
                label="TOTAL ORDER"
                value={`${data.kpi.totalOrders}`}
                valueColor={colors.neutral.textStrong}
                description={`Avg: Rp ${data.kpi.avgOrderValue.toLocaleString('id-ID')} / order`}
              />
            </div>

            {/* KPI Cards Row 2 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <KPICard
                label="TOTAL HARGA BARANG [RAW]"
                value={`Rp ${data.kpi.inventoryRaw.toLocaleString('id-ID')}`}
                valueColor={colors.neutral.textStrong}
                description="—"
              />
              <KPICard
                label="TOTAL HARGA BARANG [PRODUCT]"
                value={`Rp ${data.kpi.inventoryProduct.toLocaleString('id-ID')}`}
                valueColor={colors.neutral.textStrong}
                description="—"
              />
              <KPICard
                label="TOTAL HARGA BARANG [PACKAGE]"
                value={`Rp ${data.kpi.inventoryPackage.toLocaleString('id-ID')}`}
                valueColor={colors.neutral.textStrong}
                description="—"
              />
              <KPICard
                label="Total Pembelian Barang [RAW]"
                value={`Rp ${data.kpi.totalPurchaseAmount.toLocaleString('id-ID')}`}
                valueColor={colors.neutral.textStrong}
                description="Periode dipilih"
              />
            </div>

            {/* Charts Row 1: Time Series + Inventory Donut */}
            <div
              style={{
              display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <TimeSeriesChart data={data.timeSeriesData} />
              <InventoryDonutChart data={data.inventoryDonutData} />
            </div>

            {/* Charts Row 2: Marketplace + Top 10 */}
            <div
              style={{
              display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              <MarketplaceBarChart data={data.marketplaceData} />
              <Top10SKUsTable data={data.top10SKUs} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
