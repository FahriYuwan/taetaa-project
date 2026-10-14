'use client';

import { colors } from '@/lib/theme';

export interface CostBreakdownData {
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
}

interface ExecutiveFinancialSummaryProps {
  data: CostBreakdownData;
}

export function ExecutiveFinancialSummary({ data }: ExecutiveFinancialSummaryProps) {
  const {
    grossRevenue,
    platformFee,
    netRevenue,
    cogs,
    totalOtherLosses,
    netProfit,
    grossMargin,
    netMargin,
  } = data;

  // Percentages based on Gross Revenue for waterfall comparison
  const baseRevenue = grossRevenue > 0 ? grossRevenue : 1;
  const feePct = Math.round((platformFee / baseRevenue) * 100);
  const cogsPct = Math.round((cogs / baseRevenue) * 100);
  const opexPct = Math.round((totalOtherLosses / baseRevenue) * 100);
  const profitPct = Math.round((netProfit / baseRevenue) * 100);

  return (
    <div
      style={{
        backgroundColor: colors.neutral.card,
        border: `1px solid ${colors.neutral.border}`,
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '24px',
      }}
    >
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
            STRUKTUR BIAYA & PROFITABILITAS
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: colors.neutral.textStrong,
            }}
          >
            Rincian Beban Penjualan dan Margin Laba
          </div>
        </div>

        {/* Margin Badge indicators */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              fontSize: '12px',
              fontWeight: '600',
              color: colors.brand[700],
            }}
          >
            Margin Kotor: <strong>{grossMargin}%</strong>
          </div>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: netMargin >= 0 ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${netMargin >= 0 ? '#A7F3D0' : '#FECACA'}`,
              fontSize: '12px',
              fontWeight: '600',
              color: netMargin >= 0 ? '#065F46' : '#991B1B',
            }}
          >
            Margin Laba Bersih: <strong>{netMargin}%</strong>
          </div>
        </div>
      </div>

      {/* Visual Revenue Absorption Progress Bar */}
      {grossRevenue > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#4B5563',
              marginBottom: '6px',
              fontWeight: '600',
            }}
          >
            <span>DISTRIBUSI HARGA JUAL KOTOR (100%)</span>
            <span>Rp {grossRevenue.toLocaleString('id-ID')}</span>
          </div>

          <div
            style={{
              height: '14px',
              borderRadius: '6px',
              backgroundColor: '#F3F4F6',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            {/* Fee */}
            <div
              style={{
                width: `${Math.min(100, Math.max(0, feePct))}%`,
                backgroundColor: '#475569',
              }}
              title={`Potongan Fee Marketplace: ${feePct}%`}
            />
            {/* COGS */}
            <div
              style={{
                width: `${Math.min(100, Math.max(0, cogsPct))}%`,
                backgroundColor: colors.semantic.orange,
              }}
              title={`HPP / COGS: ${cogsPct}%`}
            />
            {/* OPEX */}
            <div
              style={{
                width: `${Math.min(100, Math.max(0, opexPct))}%`,
                backgroundColor: '#DC2626',
              }}
              title={`Beban & Rugi: ${opexPct}%`}
            />
            {/* Net Profit */}
            {profitPct > 0 && (
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, profitPct))}%`,
                  backgroundColor: '#059669',
                }}
                title={`Laba Bersih: ${profitPct}%`}
              />
            )}
          </div>

          {/* Legend for the progress bar */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              marginTop: '8px',
              fontSize: '12px',
              color: '#4B5563',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#475569' }} />
              Fee Marketplace ({feePct}%)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: colors.semantic.orange }} />
              HPP Bahan & Kemasan ({cogsPct}%)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#DC2626' }} />
              Beban Operasional & Kerugian ({opexPct}%)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#059669' }} />
              Laba Bersih ({profitPct}%)
            </div>
          </div>
        </div>
      )}

      {/* 5-Step Waterfall Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Step 1: Gross */}
        <div
          style={{
            padding: '14px',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: '700', letterSpacing: '0.04em' }}>
            1. HARGA JUAL KOTOR
          </div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: colors.neutral.textStrong, marginTop: '4px' }}>
            Rp {grossRevenue.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
            Total nilai penjualan sebelum potongan
          </div>
        </div>

        {/* Step 2: Fees */}
        <div
          style={{
            padding: '14px',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: '700', letterSpacing: '0.04em' }}>
            2. POTONGAN MARKETPLACE
          </div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#475569', marginTop: '4px' }}>
            -Rp {platformFee.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
            Biaya admin platform & subsidi ongkir
          </div>
        </div>

        {/* Step 3: HPP */}
        <div
          style={{
            padding: '14px',
            backgroundColor: '#FFF7ED',
            borderRadius: '8px',
            border: '1px solid #FFEDD5',
          }}
        >
          <div style={{ fontSize: '11px', color: '#C2410C', fontWeight: '700', letterSpacing: '0.04em' }}>
            3. TOTAL HPP
          </div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: colors.semantic.orange, marginTop: '4px' }}>
            -Rp {cogs.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '12px', color: '#9A3412', marginTop: '2px' }}>
            Harga pokok modal bahan baku & kemasan
          </div>
        </div>

        {/* Step 4: OPEX & Losses */}
        <div
          style={{
            padding: '14px',
            backgroundColor: '#FEF2F2',
            borderRadius: '8px',
            border: '1px solid #FEE2E2',
          }}
        >
          <div style={{ fontSize: '11px', color: '#B91C1C', fontWeight: '700', letterSpacing: '0.04em' }}>
            4. BEBAN & KERUGIAN
          </div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#B91C1C', marginTop: '4px' }}>
            -Rp {totalOtherLosses.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '2px' }}>
            Operasional, barang pecah/rusak & retur
          </div>
        </div>

        {/* Step 5: Net Profit */}
        <div
          style={{
            padding: '14px',
            backgroundColor: netProfit >= 0 ? '#ECFDF5' : '#FEF2F2',
            borderRadius: '8px',
            border: `1px solid ${netProfit >= 0 ? '#A7F3D0' : '#FECACA'}`,
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: netProfit >= 0 ? '#065F46' : '#991B1B',
              fontWeight: '700',
              letterSpacing: '0.04em',
            }}
          >
            5. LABA BERSIH
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: '800',
              color: netProfit >= 0 ? '#047857' : '#DC2626',
              marginTop: '4px',
            }}
          >
            Rp {netProfit.toLocaleString('id-ID')}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: netProfit >= 0 ? '#047857' : '#991B1B',
              marginTop: '2px',
              fontWeight: '600',
            }}
          >
            {netMargin}% dari omset
          </div>
        </div>
      </div>
    </div>
  );
}
