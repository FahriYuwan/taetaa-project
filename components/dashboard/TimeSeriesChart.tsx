'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { colors } from '@/lib/theme';

export interface TimeSeriesDataPoint {
  date: string;
  revenue: number;
  hpp: number;
  profit: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  onResetRange?: () => void;
}

export function TimeSeriesChart({ data, onResetRange }: TimeSeriesChartProps) {
  const [viewMode, setViewMode] = useState<'nominal' | 'margin'>('nominal');
  const [visibleLines, setVisibleLines] = useState({
    revenue: true,
    hpp: true,
    profit: true,
  });

  const totalRevenue = data.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const totalHPP = data.reduce((sum, d) => sum + (d.hpp || 0), 0);
  const totalProfit = data.reduce((sum, d) => sum + (d.profit || 0), 0);
  const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  const chartData = data.map((d) => {
    const margin = d.revenue > 0 ? Math.round((d.profit / d.revenue) * 100) : 0;
    return {
      ...d,
      margin,
      formattedDate: formatDateShort(d.date),
    };
  });

  function formatDateShort(dateStr: string) {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const day = parseInt(parts[2], 10);
        const month = months[parseInt(parts[1], 10) - 1] || parts[1];
        return `${day} ${month}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  function formatRupiahShort(value: number) {
    if (Math.abs(value) >= 1_000_000_000) {
      return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000_000) {
      return `Rp ${(value / 1_000_000).toFixed(1)}Jt`;
    }
    if (Math.abs(value) >= 1_000) {
      return `Rp ${(value / 1_000).toFixed(0)}rb`;
    }
    return `Rp ${value}`;
  }

  const toggleLine = (key: 'revenue' | 'hpp' | 'profit') => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      style={{
        backgroundColor: colors.neutral.card,
        border: `1px solid ${colors.neutral.border}`,
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header section with view toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
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
              marginBottom: '4px',
            }}
          >
            TREN PENJUALAN
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: colors.neutral.textStrong,
            }}
          >
            Omset, Total HPP, dan Laba Bersih
          </div>
        </div>

        {/* View toggle pills with accessible tap target */}
        <div
          role="tablist"
          aria-label="Mode Tampilan Grafik"
          style={{
            display: 'flex',
            backgroundColor: '#F3F4F6',
            padding: '3px',
            borderRadius: '8px',
            gap: '2px',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'nominal'}
            onClick={() => setViewMode('nominal')}
            style={{
              padding: '6px 14px',
              minHeight: '34px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'nominal' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'nominal' ? colors.brand[600] : '#4B5563',
              boxShadow: viewMode === 'nominal' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Nominal (Rp)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'margin'}
            onClick={() => setViewMode('margin')}
            style={{
              padding: '6px 14px',
              minHeight: '34px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'margin' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'margin' ? '#047857' : '#4B5563',
              boxShadow: viewMode === 'margin' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Margin Laba (%)
          </button>
        </div>
      </div>

      {/* Stats summary strip */}
      {data.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            marginBottom: '18px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: '600' }}>Total Omset</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: colors.brand[600], marginTop: '2px' }}>
              Rp {totalRevenue.toLocaleString('id-ID')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: '600' }}>Total HPP</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: colors.semantic.orange, marginTop: '2px' }}>
              Rp {totalHPP.toLocaleString('id-ID')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: '600' }}>Laba Bersih</div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color: totalProfit >= 0 ? '#047857' : '#DC2626',
                marginTop: '2px',
              }}
            >
              Rp {totalProfit.toLocaleString('id-ID')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: '600' }}>Rata-rata Margin Laba</div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color: avgMargin >= 20 ? '#047857' : avgMargin >= 0 ? '#C2410C' : '#DC2626',
                marginTop: '2px',
              }}
            >
              {avgMargin}%
            </div>
          </div>
        </div>
      )}

      {/* Metric filter toggles (Nominal mode only) */}
      {viewMode === 'nominal' && data.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '12px',
            fontSize: '12px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: '#4B5563', fontWeight: '600' }}>Tampilkan garis:</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={visibleLines.revenue}
              onChange={() => toggleLine('revenue')}
              style={{ accentColor: colors.brand[500], width: '15px', height: '15px', cursor: 'pointer' }}
            />
            <span style={{ color: colors.brand[600], fontWeight: '600' }}>Omset</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={visibleLines.hpp}
              onChange={() => toggleLine('hpp')}
              style={{ accentColor: colors.semantic.orange, width: '15px', height: '15px', cursor: 'pointer' }}
            />
            <span style={{ color: colors.semantic.orange, fontWeight: '600' }}>Total HPP</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={visibleLines.profit}
              onChange={() => toggleLine('profit')}
              style={{ accentColor: colors.semantic.green, width: '15px', height: '15px', cursor: 'pointer' }}
            />
            <span style={{ color: '#047857', fontWeight: '600' }}>Laba Bersih</span>
          </label>
        </div>
      )}

      {/* Chart Canvas or Clean Empty State without cartoon emojis */}
      {data.length === 0 ? (
        <div
          style={{
            flex: 1,
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${colors.neutral.border}`,
            borderRadius: '8px',
            backgroundColor: '#FBFBFC',
            padding: '24px',
            textAlign: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#EFF6FF',
              color: colors.brand[600],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '13px',
            }}
          >
            LINE
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: colors.neutral.textStrong }}>
            Belum ada data transaksi pada rentang filter ini
          </div>
          <p style={{ fontSize: '12px', color: '#6B7280', maxWidth: '360px', margin: 0 }}>
            Tidak ada penjualan yang tercatat pada rentang tanggal terpilih. Silakan ubah tanggal atau gunakan preset di atas.
          </p>
          {onResetRange && (
            <button
              type="button"
              onClick={onResetRange}
              style={{
                marginTop: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: colors.brand[500],
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Tampilkan Semua Periode Tersedia
            </button>
          )}
        </div>
      ) : viewMode === 'nominal' ? (
        <div style={{ flex: 1, minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.brand[500]} stopOpacity={0.16} />
                  <stop offset="95%" stopColor={colors.brand[500]} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorHpp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.semantic.orange} stopOpacity={0.14} />
                  <stop offset="95%" stopColor={colors.semantic.orange} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.semantic.green} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={colors.semantic.green} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="formattedDate"
                stroke="#6B7280"
                style={{ fontSize: '11px', fontWeight: '500' }}
                tickLine={false}
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '11px', fontWeight: '500' }}
                tickFormatter={formatRupiahShort}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  padding: '10px 14px',
                  fontSize: '12px',
                }}
                formatter={(value, name) => {
                  const label =
                    name === 'revenue' ? 'Omset' : name === 'hpp' ? 'Total HPP' : 'Laba Bersih';
                  return [`Rp ${(value as number).toLocaleString('id-ID')}`, label];
                }}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  return item ? `Tanggal: ${item.date} (${item.formattedDate}) · Margin Laba: ${item.margin}%` : `${label}`;
                }}
              />
              {visibleLines.revenue && (
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={colors.brand[500]}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="revenue"
                  dot={{ r: 3, fill: colors.brand[500] }}
                  activeDot={{ r: 5 }}
                />
              )}
              {visibleLines.hpp && (
                <Area
                  type="monotone"
                  dataKey="hpp"
                  stroke={colors.semantic.orange}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorHpp)"
                  name="hpp"
                  dot={{ r: 3, fill: colors.semantic.orange }}
                  activeDot={{ r: 5 }}
                />
              )}
              {visibleLines.profit && (
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke={colors.semantic.green}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                  name="profit"
                  dot={{ r: 3, fill: colors.semantic.green }}
                  activeDot={{ r: 5 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="formattedDate"
                stroke="#6B7280"
                style={{ fontSize: '11px', fontWeight: '500' }}
                tickLine={false}
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '11px', fontWeight: '500' }}
                tickFormatter={(val) => `${val}%`}
                tickLine={false}
                axisLine={false}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  padding: '10px 14px',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value}%`, 'Profit Margin']}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  return item
                    ? `Tanggal: ${item.date} (Omset: Rp ${item.revenue.toLocaleString('id-ID')})`
                    : `${label}`;
                }}
              />
              <Line
                type="monotone"
                dataKey="margin"
                stroke={colors.semantic.green}
                strokeWidth={2.5}
                dot={{ r: 3, fill: colors.semantic.green }}
                activeDot={{ r: 5 }}
                name="Margin (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
