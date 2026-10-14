'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { colors } from '@/lib/theme';

export interface MarketplaceChartData {
  name: string;
  revenue: number;
  gross?: number;
  fee?: number;
  hpp?: number;
  profit?: number;
  orders?: number;
  qty?: number;
  profitMargin?: number;
}

interface MarketplaceBarChartProps {
  data: MarketplaceChartData[];
  onResetRange?: () => void;
}

export function MarketplaceBarChart({ data, onResetRange }: MarketplaceBarChartProps) {
  const [viewMode, setViewMode] = useState<'compare' | 'revenue'>('compare');

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

  // Find top contributing channel by profit
  const topChannel = [...data].sort((a, b) => (b.profit || b.revenue) - (a.profit || a.revenue))[0];

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
      {/* Header with Title and Mode Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
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
            KOMPARASI MARKETPLACE
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: colors.neutral.textStrong,
            }}
          >
            Profitabilitas per Channel Penjualan
          </div>
        </div>

        {/* View Toggle */}
        <div
          role="tablist"
          aria-label="Mode Komparasi Channel"
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
            aria-selected={viewMode === 'compare'}
            onClick={() => setViewMode('compare')}
            style={{
              padding: '6px 14px',
              minHeight: '34px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'compare' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'compare' ? colors.brand[600] : '#4B5563',
              boxShadow: viewMode === 'compare' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Omset vs Laba
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'revenue'}
            onClick={() => setViewMode('revenue')}
            style={{
              padding: '6px 14px',
              minHeight: '34px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'revenue' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'revenue' ? colors.brand[600] : '#4B5563',
              boxShadow: viewMode === 'revenue' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Hanya Omset
          </button>
        </div>
      </div>

      {/* Clean Insight strip without cartoon emojis */}
      {topChannel && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#EFF6FF',
            borderRadius: '8px',
            border: '1px solid #BFDBFE',
            marginBottom: '16px',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: colors.brand[600],
                color: '#FFFFFF',
                letterSpacing: '0.04em',
              }}
            >
              UTAMA
            </span>
            <span style={{ color: colors.brand[700], fontWeight: '500' }}>
              Kontributor laba tertinggi: <strong>{topChannel.name}</strong>
              {topChannel.profit ? ` (Rp ${topChannel.profit.toLocaleString('id-ID')})` : ''}
            </span>
          </div>
          {topChannel.profitMargin !== undefined && (
            <span
              style={{
                backgroundColor: '#DBEAFE',
                color: colors.brand[700],
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '11px',
              }}
            >
              {topChannel.profitMargin}% Margin
            </span>
          )}
        </div>
      )}

      {/* Chart Canvas or Clean Empty State */}
      {data.length === 0 ? (
        <div
          style={{
            flex: 1,
            minHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${colors.neutral.border}`,
            borderRadius: '8px',
            backgroundColor: '#FBFBFC',
            color: '#4B5563',
            fontSize: '14px',
            gap: '8px',
            textAlign: 'center',
            padding: '24px',
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
            BAR
          </div>
          <div style={{ fontWeight: '700', color: colors.neutral.textStrong }}>
            Belum ada perbandingan data penjualan channel
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', maxWidth: '320px' }}>
            Data penjualan per channel akan muncul saat periode filter tanggal memiliki transaksi terverifikasi.
          </div>
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
              Lihat Data Tersedia
            </button>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: '280px' }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                style={{ fontSize: '12px', fontWeight: '600' }}
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
                  const label = name === 'revenue' ? 'Omset' : 'Laba Bersih';
                  return [`Rp ${(value as number).toLocaleString('id-ID')}`, label];
                }}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload as MarketplaceChartData | undefined;
                  if (!item) return label;
                  const marginText = item.profitMargin !== undefined ? ` · Margin: ${item.profitMargin}%` : '';
                  const feeText = item.fee ? ` (Biaya Platform: Rp ${item.fee.toLocaleString('id-ID')})` : '';
                  return `${label}${marginText}${feeText}`;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                formatter={(value) => (value === 'revenue' ? 'Omset' : 'Laba Bersih')}
              />
              <Bar
                dataKey="revenue"
                name="revenue"
                fill={colors.brand[500]}
                radius={[4, 4, 0, 0]}
                maxBarSize={44}
              />
              {viewMode === 'compare' && (
                <Bar
                  dataKey="profit"
                  name="profit"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
