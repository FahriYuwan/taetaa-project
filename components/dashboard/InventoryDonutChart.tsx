'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { colors } from '@/lib/theme';

export interface InventoryChartData {
  name: string;
  value: number;
  color: string;
}

interface InventoryDonutChartProps {
  data: InventoryChartData[];
}

export function InventoryDonutChart({ data }: InventoryDonutChartProps) {
  const chartColors = data.map((item) => item.color);
  const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0);

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

  const categoryLabels: Record<string, { label: string; desc: string }> = {
    PACKAGE: { label: 'Kemasan Jadi (PACKAGE)', desc: 'Produk kemasan siap jual di rak' },
    RAW: { label: 'Bahan Baku (RAW)', desc: 'Bahan mentah & bibit parfum' },
    PRODUCT: { label: 'Produk Olahan (PRODUCT)', desc: 'Cairan olahan bulk literan' },
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
      {/* Header aligned symmetrically */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
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
            VALUASI INVENTORY
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: colors.neutral.textStrong,
            }}
          >
            Alokasi Modal Inventory
          </div>
        </div>

        {totalValue > 0 && (
          <div
            style={{
              textAlign: 'right',
              backgroundColor: '#F8FAFC',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: '10px', color: '#4B5563', fontWeight: '700', textTransform: 'uppercase' }}>
              Valuasi Gudang
            </div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: colors.brand[600] }}>
              Rp {totalValue.toLocaleString('id-ID')}
            </div>
          </div>
        )}
      </div>

      {data.length === 0 || totalValue === 0 ? (
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
            padding: '24px',
            textAlign: 'center',
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
            PIE
          </div>
          <div style={{ fontWeight: '700', color: colors.neutral.textStrong }}>
            Belum ada data nilai inventory
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            Data valuasi stok akan tampil saat ada stok aktif di gudang.
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Centered Donut with Center Hole KPI Metric */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '210px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '6px 0',
            }}
          >
            <ResponsiveContainer width="100%" height={210}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive={true}
                >
                  {chartColors.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} stroke="#FFFFFF" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    padding: '8px 12px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => {
                    const num = value as number;
                    const pct = totalValue > 0 ? ((num / totalValue) * 100).toFixed(1) : '0';
                    return [`Rp ${num.toLocaleString('id-ID')} (${pct}%)`, 'Valuasi'];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Symmetrical Center KPI in Donut Hole */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#6B7280',
                  marginBottom: '2px',
                }}
              >
                TOTAL NILAI
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '800',
                  color: colors.neutral.textStrong,
                }}
              >
                {formatRupiahShort(totalValue)}
              </div>
            </div>
          </div>

          {/* Symmetrical breakdown rows */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '12px',
            }}
          >
            {data.map((item) => {
              const pct = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
              const meta = categoryLabels[item.name] || { label: item.name, desc: '' };

              return (
                <div
                  key={item.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #EDF2F7',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '3px',
                        backgroundColor: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: colors.neutral.textStrong,
                        }}
                      >
                        {meta.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        {meta.desc}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: colors.neutral.textStrong }}>
                      Rp {item.value.toLocaleString('id-ID')}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: '#EFF6FF',
                        color: colors.brand[600],
                        minWidth: '40px',
                        textAlign: 'center',
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
