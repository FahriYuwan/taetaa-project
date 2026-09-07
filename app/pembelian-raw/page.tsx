'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/dashboard/KPICard';
import { AddPurchaseModal } from '@/components/modals/AddPurchaseModal';
import { BulkPurchaseModal } from '@/components/modals/BulkPurchaseModal';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';

interface Purchase {
  id: string;
  date: string;
  sku: {
    code: string;
    name: string;
  };
  qty: number;
  unitPrice: number;
  total: number;
  supplier: string | null;
  notes: string | null;
}

export default function PembelianRawPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [search, setSearch] = useState('');

  // Date filters
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchPurchases();
  }, [fromDate, toDate]);

  async function fetchPurchases() {
    try {
      setLoading(true);
      const res = await fetch(`/api/purchases?from=${fromDate}&to=${toDate}`);
      if (res.ok) {
        const data = await res.json();
        setPurchases(data);
      }
    } catch (error) {
      showToast({ message: 'Gagal memuat data pembelian', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = purchases?.filter(item => {
    const matchesSearch = item.sku.code.toLowerCase().includes(search.toLowerCase()) ||
                         item.sku.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  }) || [];

  async function handleAddPurchase(formData: any) {
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal mencatat pembelian');
      }

      showToast({ message: 'Pembelian berhasil dicatat', type: 'success' });
      setShowAddModal(false);
      fetchPurchases();
    } catch (error: any) {
      throw error;
    }
  }

  const totalPembelian = purchases.reduce((sum, p) => sum + (p.total || 0), 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Pembelian RAW"
        subtitle="Catat pembelian bahan baku. Sistem otomatis update HPP rata-rata (Weighted Average)."
        actions={
          <div className="flex flex-col items-end gap-4">
            <div className="flex gap-2">
              <Button variant="secondary" icon="📋" onClick={() => setShowBulkModal(true)}>
                Bulk Paste
              </Button>
              <Button variant="primary" icon="➕" onClick={() => setShowAddModal(true)}>
                Catat Pembelian
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Periode</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="px-2 py-1.5 border rounded text-xs bg-white"
                  />
                  <span className="text-gray-400">s/d</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-2 py-1.5 border rounded text-xs bg-white"
                  />
                </div>
              </div>
              
              <div className="space-y-1 border-l pl-4 ml-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Pencarian</label>
                <input
                  type="text"
                  placeholder="Cari SKU atau Nama..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block px-3 py-1.5 border rounded text-xs bg-white w-40"
                />
              </div>
            </div>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPI Summary */}
        <div
          className="p-5 rounded-lg border bg-white shadow-sm"
          style={{ borderColor: colors.neutral.border }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Total Pembelian</p>
          <p className="text-2xl font-bold" style={{ color: colors.brand[500] }}>
            Rp {totalPembelian.toLocaleString('id-ID')}
          </p>
        </div>

        {/* Table Container */}
        <div
          className="rounded-lg border bg-white overflow-hidden shadow-sm"
          style={{ borderColor: colors.neutral.border }}
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b" style={{ borderColor: colors.neutral.border }}>
              <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
                <th className="px-6 py-4">TANGGAL</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4 text-right">QTY</th>
                <th className="px-6 py-4 text-right">HARGA SATUAN</th>
                <th className="px-6 py-4 text-right">TOTAL</th>
                <th className="px-6 py-4">SUPPLIER</th>
                <th className="px-6 py-4">CATATAN</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">Loading data...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <p className="text-gray-400 mb-2">Belum ada pembelian.</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="text-blue-500 font-bold hover:underline"
                    >
                      Klik "Catat Pembelian"
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">{new Date(p.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{p.sku.code}</div>
                      <div className="text-[10px] text-gray-400">{p.sku.name}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{p.qty.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-right">Rp {p.unitPrice.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-right font-bold" style={{ color: colors.neutral.textStrong }}>
                      Rp {p.total.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{p.supplier || '—'}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs italic">{p.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddPurchaseModal
        isOpen={showAddModal}
        onSubmit={handleAddPurchase}
        onCancel={() => setShowAddModal(false)}
      />

      <BulkPurchaseModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => {
          setShowBulkModal(false);
          fetchPurchases();
        }}
      />
    </div>
  );
}
