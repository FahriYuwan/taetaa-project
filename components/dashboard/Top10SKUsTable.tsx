import { colors } from '@/lib/theme';

export interface Top10SKU {
  skuCode: string;
  quantity: number;
  revenue: number;
  profit: number;
  margin?: number;
}

interface Top10SKUsTableProps {
  data: Top10SKU[];
  onResetRange?: () => void;
}

export function Top10SKUsTable({ data, onResetRange }: Top10SKUsTableProps) {
  const maxProfit = Math.max(...data.map((d) => d.profit), 1);

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
            PROFITABILITAS SKU
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: colors.neutral.textStrong,
            }}
          >
            Top 10 SKU Paling Menguntungkan
          </div>
        </div>
        {data.length > 0 && (
          <span
            style={{
              fontSize: '12px',
              color: '#4B5563',
              backgroundColor: '#F3F4F6',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: '600',
            }}
          >
            {data.length} SKU Aktif
          </span>
        )}
      </div>

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
            SKU
          </div>
          <div style={{ fontWeight: '700', color: colors.neutral.textStrong }}>
            Belum ada data penjualan SKU
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', maxWidth: '320px' }}>
            Tabel peringkat laba produk akan tampil saat ada data transaksi pada rentang filter tanggal terpilih.
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
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.neutral.border}` }}>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#4B5563',
                  }}
                >
                  SKU & KONTRIBUSI
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#4B5563',
                  }}
                >
                  QTY
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#4B5563',
                  }}
                >
                  OMSET
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#4B5563',
                  }}
                >
                  LABA BERSIH
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#4B5563',
                  }}
                >
                  MARGIN LABA
                </th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((item, index) => {
                const margin =
                  item.margin ??
                  (item.revenue > 0 ? Math.round((item.profit / item.revenue) * 100) : 0);
                const unitProfit = item.quantity > 0 ? Math.round(item.profit / item.quantity) : 0;
                const profitPct = Math.max(5, Math.round((item.profit / maxProfit) * 100));

                return (
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
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: index < 3 ? colors.brand[600] : '#6B7280',
                            width: '20px',
                          }}
                        >
                          #{index + 1}
                        </span>
                        <div>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: colors.neutral.textStrong,
                            }}
                          >
                            {item.skuCode}
                          </div>
                          <div
                            style={{
                              width: '100px',
                              height: '4px',
                              backgroundColor: '#F3F4F6',
                              borderRadius: '2px',
                              marginTop: '4px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${profitPct}%`,
                                height: '100%',
                                backgroundColor: '#059669',
                                borderRadius: '2px',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: colors.neutral.textStrong,
                      }}
                    >
                      {item.quantity.toLocaleString('id-ID')}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: colors.brand[600],
                      }}
                    >
                      Rp {item.revenue.toLocaleString('id-ID')}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: item.profit >= 0 ? '#047857' : '#DC2626',
                        }}
                      >
                        Rp {item.profit.toLocaleString('id-ID')}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        Rp {unitProfit.toLocaleString('id-ID')}/pcs
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor:
                            margin >= 50
                              ? '#ECFDF5'
                              : margin >= 20
                              ? '#FFFBEB'
                              : '#FEF2F2',
                          color:
                            margin >= 50
                              ? '#065F46'
                              : margin >= 20
                              ? '#92400E'
                              : '#991B1B',
                        }}
                      >
                        {margin}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
