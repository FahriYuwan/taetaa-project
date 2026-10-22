'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { ExportCard } from '@/components/reports/ExportCard';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import { FiDownloadCloud, FiCalendar } from 'react-icons/fi';

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
      title: 'Penjualan Marketplace',
      category: 'BERDASARKAN PERIODE' as const,
      description: 'Semua transaksi penjualan marketplace, status order, scan logistik, rekonsiliasi finance, total HPP, serta laba bersih.',
    },
    {
      id: 'purchases',
      title: 'Pembelian Bahan & Kemasan',
      category: 'BERDASARKAN PERIODE' as const,
      description: 'Histori transaksi pembelian bahan baku RAW dan kemasan (botol, stiker, dus) beserta harga perolehan supplier.',
    },
    {
      id: 'productions',
      title: 'Produksi & Konsumsi BOM',
      category: 'BERDASARKAN PERIODE' as const,
      description: 'Riwayat konversi produksi, output produk jadi, serta konsumsi bahan baku dan item kemasan yang terpakai.',
    },
    {
      id: 'inventory',
      title: 'Valuasi & Posisi Inventaris',
      category: 'SNAPSHOT' as const,
      description: 'Snapshot saldo stok fisik, status stok (Aman/Menipis/Habis), avg cost HPP, dan total nilai rupiah seluruh SKU & Kemasan.',
    },
    {
      id: 'skus',
      title: 'Master SKU & Komponen BOM',
      category: 'SNAPSHOT' as const,
      description: 'Master data seluruh produk RAW, PRODUCT, PACKAGE, harga acuan HPP, harga jual, dan rincian lengkap resep BOM.',
    },
    {
      id: 'kemasan',
      title: 'Master Item Kemasan',
      category: 'SNAPSHOT' as const,
      description: 'Daftar 44 item kemasan (Packing, Stiker, Safety, Dus), metode pemantauan (Harian/Periodik), stok min, dan avg cost.',
    },
    {
      id: 'opname',
      title: 'Rekonsiliasi Stock Opname',
      category: 'BERDASARKAN PERIODE' as const,
      description: 'Audit trail sesi stock opname (Draft, Review, Posted) beserta perbandingan stok sistem vs fisik dan catatan selisih.',
    },
    {
      id: 'breakage',
      title: 'Kerusakan & Kerugian Barang',
      category: 'BERDASARKAN PERIODE' as const,
      description: 'Catatan barang rusak, hilang, gagal QC, reject, beserta estimasi nilai kerugian finansial.',
    },
    {
      id: 'expenses',
      title: 'Beban Operasional Lainnya',
      category: 'BERDASARKAN PERIODE' as const,
      description: 'Rekapitulasi pengeluaran operasional di luar bahan baku (bonus, compliment, operasional, dsb).',
    },
    {
      id: 'affiliate',
      title: 'Aktivitas Afiliasi & Sampel',
      category: 'BERDASARKAN PERIODE' as const,
      description: 'Catatan pengiriman sampel creator/affiliate, biaya ongkir ekspedisi, marketplace, dan total HPP produk terpakai.',
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
        message: `Laporan ${title} berhasil diunduh dalam format Excel CSV (UTF-8)`,
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
      <PageHeader
        title="Laporan & Export CSV"
        subtitle="Export data transaksi dan inventaris dalam format CSV UTF-8 untuk spreadsheet."
        actions={
          <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-xs" style={{ borderColor: colors.neutral.border }}>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold uppercase">
              <FiCalendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Periode:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2.5 py-1 border rounded text-xs text-gray-700 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                style={{ borderColor: colors.neutral.border }}
              />
              <span className="text-gray-400 text-xs">s/d</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2.5 py-1 border rounded text-xs text-gray-700 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                style={{ borderColor: colors.neutral.border }}
              />
            </div>
          </div>
        }
      />

      {/* Grid of Cards */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
