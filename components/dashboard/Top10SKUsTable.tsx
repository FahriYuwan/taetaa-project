import { colors } from '@/lib/theme';

interface Top10SKU {
  skuCode: string;
  quantity: number;
  revenue: number;
  profit: number;
}

interface Top10SKUsTableProps {
  data: Top10SKU[];
}

export function Top10SKUsTable({ data }: Top10SKUsTableProps) {
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
        TOP 10
      </div>
      <div
        style={{
          fontSize: '16px',
          fontWeight: '700',
          color: colors.neutral.textStrong,
          marginBottom: '16px',
        }}
      >
        SKU Paling Menguntungkan
      </div>

      {data.length === 0 ? (
        <div
          style={{
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.neutral.textMuted,
            fontSize: '14px',
          }}
        >
          Belum ada data penjualan
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.neutral.border}` }}>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: colors.neutral.textMuted,
                  }}
                >
                  SKU
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: colors.neutral.textMuted,
                  }}
                >
                  QTY
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: colors.neutral.textMuted,
                  }}
                >
                  REVENUE
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: colors.neutral.textMuted,
                  }}
                >
                  LABA
                </th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((item, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: `1px solid ${colors.neutral.border}`,
                  }}
                >
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors.neutral.textStrong,
                    }}
                  >
                    {item.skuCode}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors.neutral.textStrong,
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors.brand[500],
                    }}
                  >
                    Rp {item.revenue.toLocaleString('id-ID')}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: item.profit >= 0 ? colors.semantic.green : colors.semantic.red,
                    }}
                  >
                    Rp {item.profit.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
