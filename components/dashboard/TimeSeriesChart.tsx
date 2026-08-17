'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { colors } from '@/lib/theme';

interface TimeSeriesDataPoint {
  date: string;
  revenue: number;
  hpp: number;
  profit: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  return (
    <div
      style={{
        backgroundColor: colors.neutral.card,
        border: `1px solid ${colors.neutral.border}`,
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
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
        TIME SERIES
      </div>
      <div
        style={{
          fontSize: '16px',
          fontWeight: '700',
          color: colors.neutral.textStrong,
          marginBottom: '16px',
        }}
      >
        Pendapatan vs HPP vs Laba
      </div>
      {data.length === 0 ? (
        <div
          style={{
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px dashed ${colors.neutral.border}`,
            borderRadius: '8px',
            color: colors.neutral.textMuted,
            fontSize: '14px',
          }}
        >
          Belum ada data penjualan
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral.border} />
            <XAxis
              dataKey="date"
              stroke={colors.neutral.textMuted}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke={colors.neutral.textMuted}
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(0)}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.neutral.card,
                border: `1px solid ${colors.neutral.border}`,
                borderRadius: '8px',
              }}
              formatter={(value) => `Rp ${(value as number).toLocaleString('id-ID')}`}
              labelFormatter={(label) => `${label}`}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={colors.brand[500]}
              name="Pendapatan"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="hpp"
              stroke={colors.semantic.orange}
              name="HPP"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke={colors.semantic.red}
              name="Laba"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
