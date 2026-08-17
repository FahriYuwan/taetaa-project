'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { colors } from '@/lib/theme';

interface InventoryChartData {
  name: string;
  value: number;
  color: string;
}

interface InventoryDonutChartProps {
  data: InventoryChartData[];
}

export function InventoryDonutChart({ data }: InventoryDonutChartProps) {
  const chartColors = data.map((item) => item.color);

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
        ALOKASI NILAI
      </div>
      <div
        style={{
          fontSize: '16px',
          fontWeight: '700',
          color: colors.neutral.textStrong,
          marginBottom: '16px',
        }}
      >
        Inventory
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
          Belum ada data inventory
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {chartColors.map((color, index) => (
                <Cell key={`cell-${index}`} fill={color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `Rp ${(value as number).toLocaleString('id-ID')}`}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => {
                const item = data.find((d) => d.name === value);
                return item
                  ? `${item.name} - Rp ${item.value.toLocaleString('id-ID')}`
                  : value;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
