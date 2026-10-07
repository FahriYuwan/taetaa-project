'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { Button } from '@/components/ui/Button';
import { AddSaleModal } from '@/components/modals/AddSaleModal';
import { BulkSaleModal } from '@/components/modals/BulkSaleModal';
import { ScannerModal } from '@/components/modals/ScannerModal';
import { EditSaleFinancialModal } from '@/components/modals/EditSaleFinancialModal';
import { DiscrepancyModal } from '@/components/modals/DiscrepancyModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { SaleDetailDrawer } from '@/components/modals/SaleDetailDrawer';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import {
  FiTrash2,
  FiPlus,
  FiClipboard,
  FiSearch,
  FiBarChart,
  FiEdit2,
  FiCheck,
  FiX,
  FiMaximize2,
  FiAlertTriangle,
  FiEye,
} from 'react-icons/fi';

interface Sale {
  id: string;
  date: string;
  channel: string;
  orderId: string | null;
  resi: string | null;
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
  voucher: number;
  discount: number;
  platformFee: number;
  shippingFee: number;
  omset: number;
  hpp: number;
  totalHpp: number;
  laba: number;
  status: string;
  scannedByLogistic: boolean;
  financeMatched: boolean;
  notes: string | null;
  avgCost?: number;
}

interface OrderGroup {
  orderId: string | null;
  resi: string | null;
  channel: string;
  date: string;
  items: Sale[];
}

const CHANNEL_BADGE: Record<string, string> = {
  SHOPEE: 'bg-orange-50 text-orange-600 border-orange-200',
  TIKTOK: 'bg-gray-100 text-gray-800 border-gray-300',
  TOKOPEDIA: 'bg-green-50 text-green-700 border-green-200',
  OFFLINE: 'bg-blue-50 text-blue-600 border-blue-200',
  AFFILIATE: 'bg-purple-50 text-purple-600 border-purple-200',
};

const STATUS_BADGE: Record<string, string> = {
  TERKIRIM: 'bg-green-50 text-green-700 border-green-200',
  DIRETURN: 'bg-red-50 text-red-600 border-red-200',
  DIBATALKAN: 'bg-gray-100 text-gray-500 border-gray-200',
  SELISIH_QTY: 'bg-amber-50 text-amber-700 border-amber-300',
};

const STATUS_LABEL: Record<string, string> = {
  TERKIRIM: 'Terkirim',
  DIRETURN: 'Direturn',
  DIBATALKAN: 'Dibatalkan',
  SELISIH_QTY: '⚠️ Selisih Qty',
};

function formatRp(val: number) {
  return `Rp ${(val || 0).toLocaleString('id-ID')}`;
}

export default function PenjualanMarketplacePage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingFinancialSale, setEditingFinancialSale] = useState<Sale | null>(null);
  const [selectedSaleForDetail, setSelectedSaleForDetail] = useState<Sale | null>(null);
  // Status editing inline
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSales();
  }, [channelFilter, statusFilter, fromDate, toDate]);

  async function fetchSales() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (channelFilter !== 'all') params.append('channel', channelFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const url = `/api/sales${params.toString() ? `?${params}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      } else {
        showToast({ message: 'Gagal memuat data penjualan', type: 'error' });
      }
    } catch {
      showToast({ message: 'Gagal memuat data penjualan', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSale(formData: any) {
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
  }

  async function handleDeleteSale() {
    if (!deletingSaleId) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/sales/${deletingSaleId}`, { method: 'DELETE' });
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

  function startEditStatus(sale: Sale) {
    setEditingStatusId(sale.id);
    setEditingStatus(sale.status);
  }

  async function saveStatus(saleId: string) {
    setIsSavingStatus(true);
    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editingStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      showToast({
        message: `Status diubah menjadi ${STATUS_LABEL[editingStatus]}`,
        type: editingStatus === 'DIRETURN' ? 'error' : 'success',
      });
      setEditingStatusId(null);
      fetchSales();
    } catch (error: any) {
      showToast({ message: error.message || 'Gagal mengubah status', type: 'error' });
    } finally {
      setIsSavingStatus(false);
    }
  }

  useEffect(() => {
    if (selectedSaleForDetail) {
      const updated = sales.find((s) => s.id === selectedSaleForDetail.id);
      if (updated) setSelectedSaleForDetail(updated);
    }
  }, [sales]);

  const filteredSales = useMemo(() => {
    if (!search.trim()) return sales;
    const term = search.toLowerCase();
    return sales.filter(
      (s) =>
        s.orderId?.toLowerCase().includes(term) ||
        s.resi?.toLowerCase().includes(term) ||
        s.sku?.code?.toLowerCase().includes(term) ||
        s.sku?.name?.toLowerCase().includes(term) ||
        s.notes?.toLowerCase().includes(term)
    );
  }, [sales, search]);

  // Group by resi/orderId for display
  const orderGroups = useMemo<OrderGroup[]>(() => {
    const groups = new Map<string, OrderGroup>();

    for (const sale of filteredSales) {
      const key = sale.resi ?? sale.orderId ?? `no-resi-${sale.id}`;
      if (!groups.has(key)) {
        groups.set(key, {
          orderId: sale.orderId,
          resi: sale.resi,
          channel: sale.channel,
          date: sale.date,
          items: [],
        });
      }
      groups.get(key)!.items.push(sale);
    }

    return Array.from(groups.values());
  }, [filteredSales]);

  const totals = useMemo(() => {
    return filteredSales.reduce(
      (acc, s) => {
        acc.qty += s.qty || 0;
        acc.omset += s.omset || s.netRevenue || 0;
        acc.totalHpp += s.totalHpp || s.hpp || 0;
        acc.laba += s.laba || 0;
        return acc;
      },
      { qty: 0, omset: 0, totalHpp: 0, laba: 0 }
    );
  }, [filteredSales]);

  const unmatched = filteredSales.filter((s) => s.scannedByLogistic && !s.financeMatched).length;
  const discrepancyCount = sales.filter((s) => s.status === 'SELISIH_QTY').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Penjualan Marketplace"
        subtitle="Kelola penjualan dengan alur scan logistik & bulk paste finance"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Filters */}
            <div
              className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border"
              style={{ borderColor: colors.neutral.border }}
            >
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
              <option value="TOKOPEDIA">Tokopedia</option>
              <option value="OFFLINE">Offline</option>
              <option value="AFFILIATE">Affiliate</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded border text-xs bg-white font-medium"
              style={{ borderColor: colors.neutral.border }}
            >
              <option value="all">Semua Status</option>
              <option value="TERKIRIM">Terkirim</option>
              <option value="SELISIH_QTY">Selisih Qty</option>
              <option value="DIRETURN">Direturn</option>
              <option value="DIBATALKAN">Dibatalkan</option>
            </select>

            {/* Action Buttons */}
            <Button
              variant="secondary"
              icon={<FiMaximize2 size={15} />}
              onClick={() => setShowScannerModal(true)}
              className="border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 shadow-xs"
            >
              Scanner Logistik
            </Button>
            <Button
              variant="secondary"
              icon={<FiClipboard size={14} />}
              onClick={() => setShowBulkModal(true)}
            >
              Bulk Paste Finance
            </Button>
            <Button
              variant="primary"
              icon={<FiPlus size={14} />}
              onClick={() => setShowAddModal(true)}
            >
              Input Manual
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        {/* Alert: Discrepancy (SELISIH QTY) — highest priority */}
        {discrepancyCount > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-amber-50 border-amber-300 text-amber-800 text-sm">
            <div className="flex items-center gap-2">
              <FiAlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>{discrepancyCount} transaksi</strong> memiliki selisih qty antara logistik dan finance.
                Konfirmasi resolusi agar rekonsiliasi bisa diselesaikan.
              </span>
            </div>
            <button
              onClick={() => setShowDiscrepancyModal(true)}
              className="shrink-0 px-3 py-1.5 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
            >
              Resolusi Sekarang →
            </button>
          </div>
        )}

        {/* Alert: Unmatched scan data */}
        {unmatched > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-blue-50 border-blue-200 text-blue-800 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">🔍</span>
              <span>
                <strong>{unmatched} resi</strong> sudah discan logistik tapi belum ada data finance.
                Gunakan <strong>Bulk Paste Finance</strong> untuk mencocokkan data.
              </span>
            </div>
            <button
              onClick={() => setShowDiscrepancyModal(true)}
              className="shrink-0 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Lihat Detail →
            </button>
          </div>
        )}

        {/* Search & Count */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari resi, SKU, atau nama produk..."
              className="w-full pl-9 pr-4 py-1.5 bg-white border rounded text-xs focus:outline-none"
              style={{ borderColor: colors.neutral.border }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-2 text-xs text-gray-400 hover:text-gray-600">
                ✕
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            <strong>{orderGroups.length}</strong> resi &nbsp;·&nbsp; <strong>{filteredSales.length}</strong> item
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: colors.neutral.border }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[920px]">
              <thead
                className="bg-gray-50/80 border-b text-[10px] font-bold uppercase tracking-wider text-gray-500"
                style={{ borderColor: colors.neutral.border }}
              >
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">TANGGAL & CHANNEL</th>
                  <th className="px-4 py-3 whitespace-nowrap">NO. RESI / PESANAN</th>
                  <th className="px-4 py-3 whitespace-nowrap">PRODUK / SKU</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">QTY</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">OMSET (NET)</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">TOTAL HPP</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">LABA</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">STATUS</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                      Memuat data penjualan...
                    </td>
                  </tr>
                ) : orderGroups.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center text-blue-500 font-medium">
                      Belum ada penjualan untuk kriteria ini.
                    </td>
                  </tr>
                ) : (
                  orderGroups.map((group) =>
                    group.items.map((sale, itemIdx) => {
                      const isFirstInGroup = itemIdx === 0;
                      const rowCount = group.items.length;
                      const isUnmatched = sale.scannedByLogistic && !sale.financeMatched;
                      const isEditingStatus = editingStatusId === sale.id;

                      return (
                        <tr
                          key={sale.id}
                          className={`transition-colors ${
                            isUnmatched
                              ? 'bg-amber-50/40 hover:bg-amber-50/70'
                              : sale.status === 'DIRETURN'
                              ? 'bg-red-50/30 hover:bg-red-50/50'
                              : 'hover:bg-blue-50/20'
                          }`}
                        >
                          {/* Grouped: Tanggal & Channel */}
                          {isFirstInGroup ? (
                            <td
                              className="px-4 py-3 whitespace-nowrap align-top bg-white"
                              rowSpan={rowCount}
                            >
                              <div className="font-semibold text-gray-900">
                                {new Date(sale.date).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                              <div className="mt-1">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${CHANNEL_BADGE[sale.channel] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
                                >
                                  {sale.channel}
                                </span>
                              </div>
                            </td>
                          ) : null}

                          {/* Grouped: No. Resi & Pesanan */}
                          {isFirstInGroup ? (
                            <td className="px-4 py-3 align-top bg-white" rowSpan={rowCount}>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className="font-mono text-xs font-bold text-gray-900 max-w-[150px] truncate block"
                                    title={`No. Resi: ${sale.resi || sale.orderId || '—'}`}
                                  >
                                    {sale.resi || sale.orderId || '—'}
                                  </span>
                                  {isUnmatched && (
                                    <span
                                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0"
                                      title="Belum ada data finance"
                                    >
                                      BELUM COCOK
                                    </span>
                                  )}
                                  {sale.financeMatched && (
                                    <span className="text-green-600 text-[11px] font-bold" title="Data finance sudah dicocokkan">✓</span>
                                  )}
                                </div>
                                {sale.orderId && sale.resi && sale.orderId !== sale.resi && (
                                  <p
                                    className="text-[10px] text-gray-400 font-mono truncate max-w-[150px]"
                                    title={`No. Pesanan: ${sale.orderId}`}
                                  >
                                    Ord: {sale.orderId}
                                  </p>
                                )}
                              </div>
                            </td>
                          ) : null}

                          {/* Per-item: Produk / SKU */}
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-1.5">
                              {rowCount > 1 && (
                                <span className="text-gray-300 font-mono select-none">└</span>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button
                                    onClick={() => setSelectedSaleForDetail(sale)}
                                    className="font-bold text-gray-900 hover:text-blue-600 transition-colors text-left"
                                    title="Klik untuk lihat detail transaksi"
                                  >
                                    {sale.sku.code}
                                  </button>
                                  {sale.notes && sale.notes.includes('SELISIH') ? (
                                    <button
                                      onClick={() => setSelectedSaleForDetail(sale)}
                                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                                      title={sale.notes}
                                    >
                                      ⚠️ Selisih
                                    </button>
                                  ) : sale.notes ? (
                                    <span
                                      className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-600 border border-gray-200 truncate max-w-[130px] inline-block"
                                      title={sale.notes}
                                    >
                                      {sale.notes}
                                    </span>
                                  ) : null}
                                </div>
                                <span className="block text-[11px] text-gray-500 truncate max-w-[210px]" title={sale.sku.name}>
                                  {sale.sku.name}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* QTY */}
                          <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                            {sale.qty}
                          </td>

                          {/* OMSET (Net) */}
                          <td className="px-4 py-3 text-right font-bold whitespace-nowrap" style={{ color: colors.brand[500] }}>
                            {(sale.omset || sale.netRevenue) > 0
                              ? formatRp(sale.omset || sale.netRevenue)
                              : <span className="text-gray-300">—</span>}
                          </td>

                          {/* TOTAL HPP */}
                          <td className="px-4 py-3 text-right text-orange-600 font-medium whitespace-nowrap">
                            {sale.totalHpp > 0 ? formatRp(sale.totalHpp) : <span className="text-gray-300">—</span>}
                          </td>

                          {/* LABA */}
                          <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${(sale.laba || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {sale.laba !== 0 ? formatRp(sale.laba) : <span className="text-gray-300">—</span>}
                          </td>

                          {/* STATUS */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {isEditingStatus ? (
                              <div className="flex items-center gap-1 justify-center">
                                <select
                                  value={editingStatus}
                                  onChange={(e) => setEditingStatus(e.target.value)}
                                  className="text-xs px-2 py-1 border rounded"
                                  style={{ borderColor: colors.neutral.border }}
                                  disabled={isSavingStatus}
                                >
                                  <option value="TERKIRIM">Terkirim</option>
                                  <option value="DIRETURN">Direturn</option>
                                  <option value="DIBATALKAN">Dibatalkan</option>
                                </select>
                                <button
                                  onClick={() => saveStatus(sale.id)}
                                  disabled={isSavingStatus}
                                  className="text-green-600 hover:text-green-800 p-1 cursor-pointer"
                                  title="Simpan"
                                >
                                  <FiCheck size={13} />
                                </button>
                                <button
                                  onClick={() => setEditingStatusId(null)}
                                  disabled={isSavingStatus}
                                  className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                                  title="Batal"
                                >
                                  <FiX size={13} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditStatus(sale)}
                                className="inline-flex items-center gap-1 group cursor-pointer"
                                title="Klik untuk ubah status"
                              >
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[sale.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}
                                >
                                  {STATUS_LABEL[sale.status] ?? sale.status}
                                </span>
                                <FiEdit2 size={10} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                              </button>
                            )}
                          </td>

                          {/* AKSI */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedSaleForDetail(sale)}
                                className="px-2 py-1 rounded text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="Buka Detail Transaksi & Breakdown Finansial"
                              >
                                <FiEye size={12} />
                                <span>Detail</span>
                              </button>
                              <button
                                onClick={() => setEditingFinancialSale(sale)}
                                className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Edit Nilai Finansial (Harga, Voucher, Fee)"
                              >
                                <FiEdit2 size={13} />
                              </button>
                              <button
                                onClick={() => setDeletingSaleId(sale.id)}
                                className="text-gray-300 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                title="Hapus Penjualan"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )
                )}
              </tbody>

              {/* Totals Footer */}
              {filteredSales.length > 0 && (
                <tfoot
                  className="bg-gray-50/90 border-t-2 font-bold text-xs"
                  style={{ borderColor: colors.neutral.border }}
                >
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-gray-800 uppercase tracking-wider">
                      TOTAL ({orderGroups.length} Resi · {filteredSales.length} Item)
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">{totals.qty.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right" style={{ color: colors.brand[500] }}>
                      {formatRp(totals.omset)}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600">
                      {formatRp(totals.totalHpp)}
                    </td>
                    <td className={`px-4 py-3 text-right ${totals.laba >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatRp(totals.laba)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <SaleDetailDrawer
        isOpen={!!selectedSaleForDetail}
        sale={selectedSaleForDetail}
        onClose={() => setSelectedSaleForDetail(null)}
        onEditFinancial={(sale) => {
          setSelectedSaleForDetail(null);
          setEditingFinancialSale(sale);
        }}
        onEditStatus={(sale) => {
          setSelectedSaleForDetail(null);
          startEditStatus(sale);
        }}
        onResolveDiscrepancy={() => {
          setSelectedSaleForDetail(null);
          setShowDiscrepancyModal(true);
        }}
        onDelete={(saleId) => {
          setSelectedSaleForDetail(null);
          setDeletingSaleId(saleId);
        }}
      />

      <ScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onSuccess={() => {
          fetchSales();
        }}
      />

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

      <EditSaleFinancialModal
        isOpen={!!editingFinancialSale}
        sale={editingFinancialSale}
        onClose={() => setEditingFinancialSale(null)}
        onSuccess={fetchSales}
      />

      <DiscrepancyModal
        isOpen={showDiscrepancyModal}
        onClose={() => setShowDiscrepancyModal(false)}
        onResolved={fetchSales}
      />

      <ConfirmDialog
        isOpen={!!deletingSaleId}
        title="Hapus Transaksi Penjualan"
        message="Yakin ingin menghapus transaksi ini? Stok SKU akan dikembalikan ke inventori."
        confirmText={isDeleting ? 'Menghapus...' : 'Hapus & Kembalikan Stok'}
        cancelText="Batal"
        variant="danger"
        onConfirm={handleDeleteSale}
        onCancel={() => setDeletingSaleId(null)}
      />
    </div>
  );
}
