'use client';

import { useState, useEffect } from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { TimeSeriesChart } from '@/components/dashboard/TimeSeriesChart';
import { InventoryDonutChart } from '@/components/dashboard/InventoryDonutChart';
import { MarketplaceBarChart } from '@/components/dashboard/MarketplaceBarChart';
import { Top10SKUsTable } from '@/components/dashboard/Top10SKUsTable';
import { ExecutiveFinancialSummary } from '@/components/dashboard/ExecutiveFinancialSummary';
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
    gross?: number;
    fee?: number;
    hpp?: number;
    profit?: number;
    orders?: number;
    qty?: number;
    profitMargin?: number;
  }>;
  top10SKUs: Array<{
    skuCode: string;
    quantity: number;
    revenue: number;
    profit: number;
    margin?: number;
  }>;
  inventoryDonutData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  availableDateRange?: {
    minDate: string | null;
    maxDate: string | null;
    totalSales: number;
  };
  costBreakdown?: {
    grossRevenue: number;
    platformFee: number;
    netRevenue: number;
    cogs: number;
    operatingExpenses: number;
    breakageLoss: number;
    returnLoss: number;
    totalOtherLosses: number;
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
  };
}

export default function DashboardPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

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
      const result: DashboardData = await response.json();
      setData(result);

      // Auto-adapt on first load if default range has 0 data but database has recorded sales
      if (!initialCheckDone) {
        setInitialCheckDone(true);
        if (
          result.timeSeriesData.length === 0 &&
          result.availableDateRange &&
          result.availableDateRange.totalSales > 0 &&
          result.availableDateRange.minDate &&
          result.availableDateRange.maxDate
        ) {
          setFromDate(result.availableDateRange.minDate);
          setToDate(result.availableDateRange.maxDate);
          showToast({
            type: 'info',
            message: `Menampilkan periode data penjualan aktif (${result.availableDateRange.minDate} s.d. ${result.availableDateRange.maxDate})`,
          });
        }
      }
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

  const handleResetToAvailable = () => {
    if (data?.availableDateRange?.minDate && data?.availableDateRange?.maxDate) {
      setFromDate(data.availableDateRange.minDate);
      setToDate(data.availableDateRange.maxDate);
    }
  };

  const applyPreset = (preset: 'all' | '30d' | '7d' | 'month') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      if (data?.availableDateRange?.minDate && data?.availableDateRange?.maxDate) {
        setFromDate(data.availableDateRange.minDate);
        setToDate(data.availableDateRange.maxDate);
      } else {
        const past = new Date();
        past.setFullYear(past.getFullYear() - 1);
        setFromDate(past.toISOString().split('T')[0]);
        setToDate(todayStr);
      }
    } else if (preset === '7d') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setFromDate(past.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (preset === '30d') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setFromDate(past.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(todayStr);
    }
  };

  const hasZeroSalesInPeriod = data && data.timeSeriesData.length === 0;
  const hasAvailableSalesElsewhere =
    data &&
    data.availableDateRange &&
    data.availableDateRange.totalSales > 0 &&
    data.availableDateRange.minDate &&
    data.availableDateRange.maxDate;

  return (
    <div
      className="flex-1 flex flex-col min-h-0 overflow-y-auto"
      style={{ backgroundColor: colors.neutral.bg }}
    >
      {/* Header with date filters and quick presets */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: `1px solid ${colors.neutral.border}`,
          padding: 'clamp(16px, 4vw, 24px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#4B5563',
              marginBottom: '6px',
            }}
          >
            TAETAA COMPANY SISTEM
          </div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: '800',
              color: colors.neutral.textStrong,
              marginBottom: '4px',
            }}
          >
            Dashboard Utama
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#4B5563',
            }}
          >
            Ringkasan omset, Total HPP, struktur beban penjualan, dan valuasi inventory
          </div>
        </div>

        {/* Right side: Date filters & Quick Presets */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'flex-end',
          }}
        >
          {/* Quick presets pills */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '11px', color: colors.neutral.textMuted, fontWeight: '600', marginRight: '4px' }}>
              PRESET:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('all')}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#F9FAFB',
                color: colors.brand[600],
                cursor: 'pointer',
              }}
            >
              Semua Data Tersedia
            </button>
            <button
              type="button"
              onClick={() => applyPreset('month')}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#F9FAFB',
                color: colors.neutral.textStrong,
                cursor: 'pointer',
              }}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => applyPreset('30d')}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#F9FAFB',
                color: colors.neutral.textStrong,
                cursor: 'pointer',
              }}
            >
              30 Hari
            </button>
            <button
              type="button"
              onClick={() => applyPreset('7d')}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#F9FAFB',
                color: colors.neutral.textStrong,
                cursor: 'pointer',
              }}
            >
              7 Hari
            </button>
          </div>

          {/* Date inputs */}
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
                  marginBottom: '4px',
                }}
              >
                DARI
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  padding: '7px 12px',
                  border: `1px solid ${colors.neutral.border}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  backgroundColor: '#FFFFFF',
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
                  marginBottom: '4px',
                }}
              >
                SAMPAI
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  padding: '7px 12px',
                  border: `1px solid ${colors.neutral.border}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  backgroundColor: '#FFFFFF',
                }}
              />
            </div>
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
        {/* Smart Data Range Alert if filtered range is empty but data exists elsewhere */}
        {hasZeroSalesInPeriod && hasAvailableSalesElsewhere && (
          <div
            style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#DBEAFE',
                  color: colors.brand[700],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '14px',
                  flexShrink: 0,
                }}
              >
                INFO
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: colors.brand[700] }}>
                  Tidak ada transaksi pada rentang filter saat ini ({fromDate} s.d. {toDate})
                </div>
                <div style={{ fontSize: '13px', color: '#1E40AF', marginTop: '2px' }}>
                  Ditemukan <strong>{data?.availableDateRange?.totalSales} transaksi</strong> tercatat pada sistem dalam periode{' '}
                  <strong>{data?.availableDateRange?.minDate}</strong> s.d.{' '}
                  <strong>{data?.availableDateRange?.maxDate}</strong>.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetToAvailable}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                backgroundColor: colors.brand[600],
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
              }}
            >
              Tampilkan Periode Data Ini
            </button>
          </div>
        )}

        {loading && !data ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px',
              color: colors.neutral.textMuted,
            }}
          >
            Memuat data dashboard...
          </div>
        ) : data ? (
          <>
            {/* KPI Cards Row 1: Core Financial Performance */}
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
                description={`Harga Jual: Rp ${data.kpi.totalGross.toLocaleString('id-ID')} · Biaya Platform: Rp ${data.kpi.totalFee.toLocaleString('id-ID')}`}
              />
              <KPICard
                label="TOTAL HPP"
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
                    ? `Laba Penjualan: Rp ${data.kpi.grossProfit.toLocaleString('id-ID')} · Beban/Kerugian: Rp ${data.kpi.totalOtherLosses.toLocaleString('id-ID')}`
                    : `${data.kpi.profitMargin}% margin laba bersih`
                }
              />
              <KPICard
                label="TOTAL PESANAN"
                value={`${data.kpi.totalOrders}`}
                valueColor={colors.neutral.textStrong}
                description={`Rata-rata: Rp ${data.kpi.avgOrderValue.toLocaleString('id-ID')} / pesanan`}
              />
            </div>

            {/* KPI Cards Row 2: Inventory & Working Capital */}
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
                description="Bahan baku mentah (bibit parfum & cairan)"
              />
              <KPICard
                label="NILAI INVENTORY PRODUCT"
                value={`Rp ${data.kpi.inventoryProduct.toLocaleString('id-ID')}`}
                valueColor={colors.neutral.textStrong}
                description="Produk olahan setengah jadi (bulk literan)"
              />
              <KPICard
                label="NILAI INVENTORY PACKAGE"
                value={`Rp ${data.kpi.inventoryPackage.toLocaleString('id-ID')}`}
                valueColor={colors.neutral.textStrong}
                description="Produk kemasan jadi siap jual di rak"
              />
              <KPICard
                label="PEMBELIAN BAHAN BAKU"
                value={`Rp ${data.kpi.totalPurchaseAmount.toLocaleString('id-ID')}`}
                valueColor={colors.neutral.textStrong}
                description="Total pembelian RAW periode ini"
              />
            </div>

            {/* Executive Cost & Margin Waterfall for CEO & Finance */}
            {data.costBreakdown && (
              <ExecutiveFinancialSummary data={data.costBreakdown} />
            )}

            {/* Charts Row 1: Time Series + Inventory Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6 items-stretch">
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                <TimeSeriesChart
                  data={data.timeSeriesData}
                  onResetRange={handleResetToAvailable}
                />
              </div>
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
                <InventoryDonutChart data={data.inventoryDonutData} />
              </div>
            </div>

            {/* Charts Row 2: Marketplace Profitability + Top 10 SKUs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-6 flex flex-col">
                <MarketplaceBarChart
                  data={data.marketplaceData}
                  onResetRange={handleResetToAvailable}
                />
              </div>
              <div className="lg:col-span-6 flex flex-col">
                <Top10SKUsTable
                  data={data.top10SKUs}
                  onResetRange={handleResetToAvailable}
                />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
