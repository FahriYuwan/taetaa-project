'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { ExportCard } from '@/components/reports/ExportCard';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';

export default function LaporanExportPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  // Date filters
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });

  const reports = [
    {
      id: 'sales',
      title: 'Penjualan',
      category: 'BERDASARKAN PERIODE' as const,
      description: 'Semua transaksi penjualan marketplace + biaya & laba',
    },
    {
      id: 'purchases',
      title: 'Pembelian RAW',
      category: 'BERDASARKAN PERIODE' as const,
      description: 'Semua transaksi pembelian bahan baku',
    },
    {
      id: 'productions',
      title: 'Produksi (RAW→WIP)',
      category: 'BERDASARKAN PERIODE' as const,
      description: 'Riwayat konversi produksi & konsumsi BOM',
    },
    {
      id: 'inventory',
      title: 'Inventory',
      category: 'SNAPSHOT' as const,
      description: 'Snapshot stock saat ini per SKU (awal → akhir)',
    },
    {
      id: 'skus',
      title: 'Master SKU',
      category: 'SNAPSHOT' as const,
      description: 'Master data seluruh SKU + BOM',
    },
  ];

  async function handleDownload(type: string, title: string) {
    try {
      setLoading(type);
      const url = `/api/export?type=${type}&from=${fromDate}&to=${toDate}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Taetaa_${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showToast({
        type: 'success',
        message: `Laporan ${title} berhasil diunduh`,
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: `Gagal mengunduh laporan ${title}`,
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: colors.neutral.bg }}>
      {/* Header with Date Filters */}
      <div
        style={{
          padding: '24px',
          borderBottom: `1px solid ${colors.neutral.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
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
            Laporan & Export CSV
          </div>
          <div
            style={{
              fontSize: '14px',
              color: colors.neutral.textMuted,
            }}
          >
            Export data mentah untuk analisis lanjutan di Excel / Google Sheets.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
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
        </div>
      </div>

      {/* Grid of Cards */}
      <div
        style={{
          flex: 1,
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px',
          alignContent: 'start',
        }}
      >
        {reports.map((report) => (
          <ExportCard
            key={report.id}
            title={report.title}
            category={report.category}
            description={report.description}
            isLoading={loading === report.id}
            onDownload={() => handleDownload(report.id, report.title)}
          />
        ))}
      </div>
    </div>
  );
}
