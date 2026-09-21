'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { Button } from '@/components/ui/Button';
import { AddSaleModal } from '@/components/modals/AddSaleModal';
import { BulkSaleModal } from '@/components/modals/BulkSaleModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import { FiTrash2, FiPlus, FiClipboard, FiSearch } from 'react-icons/fi';

interface Sale {
  id: string;
  date: string;
  channel: string;
  orderId: string | null;
  skuId: string;
  sku: {
    id?: string;
    code: string;
    name: string;
    hppPrice?: number;
  };
  qty: number;
  unitPrice: number;
  total: number;
  fee: number;
  netRevenue: number;
  notes: string | null;
  avgCost?: number;
  hpp?: number;
  laba?: number;
}

export default function PenjualanMarketplacePage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [channelFilter, setChannelFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSales();
  }, [channelFilter, fromDate, toDate]);

  async function fetchSales() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (channelFilter !== 'all') params.append('channel', channelFilter);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const queryString = params.toString();
      const url = `/api/sales${queryString ? `?${queryString}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      } else {
        showToast({ message: 'Gagal memuat data penjualan', type: 'error' });
      }
    } catch (error) {
      showToast({ message: 'Gagal memuat data penjualan', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSale(formData: any) {
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal mencatat penjualan');
      }

      showToast({ message: 'Penjualan berhasil dicatat & stok terpotong', type: 'success' });
      setShowAddModal(false);
      fetchSales();
    } catch (error: any) {
      throw error;
    }
  }

  async function handleDeleteSale() {
    if (!deletingSaleId) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/sales/${deletingSaleId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus penjualan');
      }

      showToast({ message: 'Penjualan dihapus & stok dikembalikan', type: 'success' });
      setDeletingSaleId(null);
      fetchSales();
    } catch (error: any) {
      showToast({ message: error.message || 'Gagal menghapus penjualan', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  }

  // Filter by search keyword (Order ID, SKU Code, SKU Name, Notes)
  const filteredSales = useMemo(() => {
    if (!search.trim()) return sales;
    const term = search.toLowerCase();
    return sales.filter(
      (s) =>
        s.orderId?.toLowerCase().includes(term) ||
        s.sku?.code?.toLowerCase().includes(term) ||
        s.sku?.name?.toLowerCase().includes(term) ||
        s.notes?.toLowerCase().includes(term)
    );
  }, [sales, search]);

  // Financial calculations and totals
  const totals = useMemo(() => {
    return filteredSales.reduce(
      (acc, s) => {
        const gross = s.total || s.qty * s.unitPrice;
        const fee = s.fee || 0;
        const netRev = s.netRevenue !== undefined && s.netRevenue !== null ? s.netRevenue : gross - fee;
        const unitCost = s.avgCost ?? s.sku?.hppPrice ?? 0;
        const hpp = s.hpp !== undefined && s.hpp !== null ? s.hpp : s.qty * unitCost;
        const laba = s.laba !== undefined && s.laba !== null ? s.laba : netRev - hpp;

        acc.qty += s.qty;
        acc.gross += gross;
        acc.fee += fee;
        acc.netRevenue += netRev;
        acc.hpp += hpp;
        acc.laba += laba;
        return acc;
      },
      { qty: 0, gross: 0, fee: 0, netRevenue: 0, hpp: 0, laba: 0 }
    );
  }, [filteredSales]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Penjualan Marketplace"
        subtitle="Catat transaksi penjualan beserta potongan biaya. Pendapatan bersih & laba dihitung otomatis."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Filters */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border" style={{ borderColor: colors.neutral.border }}>
              <span className="text-xs text-gray-500 font-medium">Periode:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs text-gray-700 focus:outline-none"
              />
              <span className="text-xs text-gray-400">s/d</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-xs text-gray-700 focus:outline-none"
              />
              {(fromDate || toDate) && (
                <button
                  onClick={() => { setFromDate(''); setToDate(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 ml-1"
                  title="Reset Tanggal"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Channel Filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-1.5 rounded border text-xs bg-white font-medium"
              style={{ borderColor: colors.neutral.border }}
            >
              <option value="all">Semua Channel</option>
              <option value="SHOPEE">Shopee</option>
              <option value="TIKTOK">TikTok Shop</option>
              <option value="OFFLINE">Offline</option>
              <option value="AFFILIATE">Affiliate</option>
            </select>

            {/* Action Buttons */}
            <Button variant="secondary" icon={<FiClipboard size={14} />} onClick={() => setShowBulkModal(true)}>
              Bulk Paste
            </Button>
            <Button variant="primary" icon={<FiPlus size={14} />} onClick={() => setShowAddModal(true)}>
              Catat Penjualan
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Search Bar & Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-72">
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Order ID, SKU, atau Nama..."
              className="w-full pl-9 pr-4 py-1.5 bg-white border rounded text-xs focus:outline-none"
              style={{ borderColor: colors.neutral.border }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Menampilkan <strong>{filteredSales.length}</strong> transaksi
          </div>
        </div>

        {/* Data Table */}
        <div
          className="rounded-lg border bg-white shadow-xs overflow-hidden"
          style={{ borderColor: colors.neutral.border }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[1250px]">
              <thead className="bg-gray-50 border-b text-[10px] font-bold uppercase tracking-wider text-gray-500" style={{ borderColor: colors.neutral.border }}>
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">TANGGAL</th>
                  <th className="px-4 py-3 whitespace-nowrap">MARKETPLACE</th>
                  <th className="px-4 py-3 whitespace-nowrap">ORDER ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">SKU PRODUK</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">QTY</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">HARGA</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">GROSS</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">BIAYA</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">NET REV</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">HPP</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">LABA</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-gray-400">
                      Memuat data penjualan...
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-16 text-center text-blue-500 font-medium">
                      Belum ada penjualan untuk kriteria ini.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s) => {
                    const gross = s.total || s.qty * s.unitPrice;
                    const fee = s.fee || 0;
                    const netRevenue = s.netRevenue !== undefined && s.netRevenue !== null ? s.netRevenue : gross - fee;
                    const unitCost = s.avgCost ?? s.sku?.hppPrice ?? 0;
                    const hpp = s.hpp !== undefined && s.hpp !== null ? s.hpp : s.qty * unitCost;
                    const laba = s.laba !== undefined && s.laba !== null ? s.laba : netRevenue - hpp;

                    return (
                      <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* 1. Tanggal */}
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-700">
                          {new Date(s.date).toLocaleDateString('id-ID')}
                        </td>

                        {/* 2. Marketplace */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              s.channel === 'SHOPEE'
                                ? 'bg-orange-50 text-orange-600 border border-orange-200'
                                : s.channel === 'TIKTOK'
                                ? 'bg-gray-100 text-gray-800 border border-gray-200'
                                : s.channel === 'OFFLINE'
                                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                : 'bg-purple-50 text-purple-600 border border-purple-200'
                            }`}
                          >
                            {s.channel}
                          </span>
                        </td>

                        {/* 3. Order ID */}
                        <td className="px-4 py-3 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                          {s.orderId || '—'}
                        </td>

                        {/* 4. SKU */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-bold text-gray-900 block">{s.sku.code}</span>
                          <span className="text-[11px] text-gray-500">{s.sku.name}</span>
                        </td>

                        {/* 5. Qty */}
                        <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                          {s.qty.toLocaleString('id-ID')}
                        </td>

                        {/* 6. Harga */}
                        <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                          Rp {s.unitPrice.toLocaleString('id-ID')}
                        </td>

                        {/* 7. Gross (Qty x Harga) */}
                        <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap font-medium">
                          Rp {gross.toLocaleString('id-ID')}
                        </td>

                        {/* 8. Biaya */}
                        <td className="px-4 py-3 text-right text-red-500 whitespace-nowrap">
                          {fee > 0 ? `- Rp ${fee.toLocaleString('id-ID')}` : 'Rp 0'}
                        </td>

                        {/* 9. Net Revenue (Gross - Biaya) */}
                        <td className="px-4 py-3 text-right font-bold whitespace-nowrap" style={{ color: colors.brand[500] }}>
                          Rp {netRevenue.toLocaleString('id-ID')}
                        </td>

                        {/* 10. HPP (Qty x Avg Cost) */}
                        <td className="px-4 py-3 text-right text-orange-600 font-medium whitespace-nowrap">
                          Rp {hpp.toLocaleString('id-ID')}
                        </td>

                        {/* 11. Laba (Net Revenue - HPP) */}
                        <td
                          className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                            laba >= 0 ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          Rp {laba.toLocaleString('id-ID')}
                        </td>

                        {/* 12. Aksi */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => setDeletingSaleId(s.id)}
                            className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                            title="Hapus Penjualan"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer with Totals */}
              {filteredSales.length > 0 && (
                <tfoot className="bg-gray-50/90 border-t-2 font-bold text-xs" style={{ borderColor: colors.neutral.border }}>
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-gray-800 uppercase tracking-wider">
                      TOTAL ({filteredSales.length} Transaksi)
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 whitespace-nowrap">
                      {totals.qty.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">—</td>
                    <td className="px-4 py-3 text-right text-gray-900 whitespace-nowrap">
                      Rp {totals.gross.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500 whitespace-nowrap">
                      - Rp {totals.fee.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap" style={{ color: colors.brand[500] }}>
                      Rp {totals.netRevenue.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600 whitespace-nowrap">
                      Rp {totals.hpp.toLocaleString('id-ID')}
                    </td>
                    <td
                      className={`px-4 py-3 text-right whitespace-nowrap ${
                        totals.laba >= 0 ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      Rp {totals.laba.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      <AddSaleModal
        isOpen={showAddModal}
        onSubmit={handleAddSale}
        onCancel={() => setShowAddModal(false)}
      />

      <BulkSaleModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => {
          setShowBulkModal(false);
          fetchSales();
        }}
      />

      <ConfirmDialog
        isOpen={!!deletingSaleId}
        title="Hapus Transaksi Penjualan"
        message="Yakin ingin menghapus transaksi penjualan ini? Mutasi keluar akan dibatalkan dan stok SKU akan dikembalikan ke inventori."
        confirmText={isDeleting ? 'Menghapus...' : 'Hapus & Kembalikan Stok'}
        cancelText="Batal"
        variant="danger"
        onConfirm={handleDeleteSale}
        onCancel={() => setDeletingSaleId(null)}
      />
    </div>
  );
}
