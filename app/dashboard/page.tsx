'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { TimeSeriesChart } from '@/components/dashboard/TimeSeriesChart';
import { InventoryDonutChart } from '@/components/dashboard/InventoryDonutChart';
import { MarketplaceBarChart } from '@/components/dashboard/MarketplaceBarChart';
import { Top10SKUsTable } from '@/components/dashboard/Top10SKUsTable';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';

interface DashboardData {
  kpi: {
    netRevenue: number;
    totalHPP: number;
    netProfit: number;
    profitMargin: number;
    totalOrders: number;
    avgOrderValue: number;
    inventoryRaw: number;
    inventoryWip: number;
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

  const handleSeedData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/seed-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to seed data');
      showToast({
        type: 'success',
        message: 'Data contoh berhasil ditambahkan',
      });
      await fetchDashboardData();
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Gagal menambahkan data contoh',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header with date filters */}
      <div
        style={{
          backgroundColor: colors.neutral.bg,
          borderBottom: `1px solid ${colors.neutral.border}`,
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '24px',
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
            gap: '16px',
            alignItems: 'flex-end',
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

          {/* Seed Data Button */}
          <Button
            variant="secondary"
            onClick={handleSeedData}
            disabled={loading}
            style={{ minWidth: '140px' }}
          >
            Seed Contoh
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          backgroundColor: colors.neutral.bg,
          padding: '24px',
          overflowY: 'auto',
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
                label="PENDAPATAN BERSIH"
                value={`Rp ${data.kpi.netRevenue.toLocaleString('id-ID')}`}
                valueColor={colors.brand[500]}
                description={`Gross: Rp ${(data.kpi.netRevenue + data.kpi.totalHPP).toLocaleString('id-ID')} · Fee: Rp ${(data.kpi.netRevenue + data.kpi.totalHPP - data.kpi.netRevenue).toLocaleString('id-ID')}`}
              />
              <KPICard
                label="TOTAL HPP (COGS)"
                value={`Rp ${data.kpi.totalHPP.toLocaleString('id-ID')}`}
                valueColor={colors.semantic.orange}
                description={`Qty terjual: ${data.timeSeriesData.reduce((sum, d) => sum + (d.revenue ? 1 : 0), 0)}`}
              />
              <KPICard
                label="LABA BERSIH"
                value={`Rp ${data.kpi.netProfit.toLocaleString('id-ID')}`}
                valueColor={data.kpi.netProfit >= 0 ? colors.semantic.green : colors.semantic.red}
                description={`${data.kpi.profitMargin}% margin`}
              />
              <KPICard
                label="TOTAL ORDER"
                value={`${data.kpi.totalOrders}`}
                valueColor={colors.neutral.textStrong}
                description={`Avg: Rp ${data.kpi.avgOrderValue.toLocaleString('id-ID')}`}
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
                label="NILAI INVENTORY RAW"
                value={`Rp ${data.kpi.inventoryRaw.toLocaleString('id-ID')}`}
                valueColor={colors.neutral.textStrong}
                description="—"
              />
              <KPICard
                label="NILAI INVENTORY WIP"
                value={`Rp ${data.kpi.inventoryWip.toLocaleString('id-ID')}`}
                valueColor={colors.neutral.textStrong}
                description="—"
              />
              <KPICard
                label="NILAI INVENTORY PACKAGE"
                value={`Rp ${data.kpi.inventoryPackage.toLocaleString('id-ID')}`}
                valueColor={colors.neutral.textStrong}
                description="—"
              />
              <KPICard
                label="TOTAL PEMBELIAN RAW"
                value={`Rp ${data.kpi.totalPurchaseAmount.toLocaleString('id-ID')}`}
                valueColor={colors.neutral.textStrong}
                description="Periode dipilih"
              />
            </div>

            {/* Charts Row 1: Time Series + Inventory Donut */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
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
                gridTemplateColumns: '1fr 1fr',
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
