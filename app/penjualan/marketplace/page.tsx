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
  FiPlus,
  FiClipboard,
  FiSearch,
  FiMaximize2,
  FiAlertTriangle,
  FiList,
  FiColumns,
} from 'react-icons/fi';
import {
  Sale,
  OrderGroup,
  MarketplaceTotals,
  STATUS_LABEL,
} from '@/components/penjualan/types';
import { MarketplaceCompactTable } from '@/components/penjualan/MarketplaceCompactTable';
import { MarketplaceDetailedTable } from '@/components/penjualan/MarketplaceDetailedTable';
import { DatePresetFilter } from '@/components/filters/DatePresetFilter';

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
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const { showToast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('marketplace_view_mode');
    if (saved === 'compact' || saved === 'detailed') {
      setViewMode(saved);
    }
  }, []);

  const handleViewModeChange = (mode: 'compact' | 'detailed') => {
    setViewMode(mode);
    localStorage.setItem('marketplace_view_mode', mode);
  };

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

  async function saveStatus(saleId: string, newStatus?: string) {
    const statusToSave = newStatus || editingStatus;
    setIsSavingStatus(true);
    setEditingStatusId(saleId);
    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusToSave }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      showToast({
        message: `Status diubah menjadi ${STATUS_LABEL[statusToSave] ?? statusToSave}`,
        type:
          statusToSave === 'RETURN' || statusToSave === 'DIRETURN'
            ? 'error'
            : statusToSave === 'HILANG'
            ? 'info'
            : 'success',
      });
      setEditingStatusId(null);
      fetchSales();
    } catch (error: any) {
      showToast({ message: error.message || 'Gagal mengubah status', type: 'error' });
    } finally {
      setIsSavingStatus(false);
      setEditingStatusId(null);
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

  // Reset to page 1 whenever filters or search change
  useEffect(() => {
    setPage(1);
  }, [channelFilter, statusFilter, fromDate, toDate, search]);

  // Paginated slices for buttery smooth DOM rendering
  const paginatedOrderGroups = useMemo(() => {
    if (pageSize === 'all') return orderGroups;
    const start = (page - 1) * pageSize;
    return orderGroups.slice(start, start + pageSize);
  }, [orderGroups, page, pageSize]);

  const paginatedSales = useMemo(() => {
    if (pageSize === 'all') return filteredSales;
    const start = (page - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, page, pageSize]);

  const totals = useMemo<MarketplaceTotals>(() => {
    return filteredSales.reduce(
      (acc, s) => {
        acc.qty += s.qty || 0;
        acc.voucher = (acc.voucher || 0) + (s.voucher || 0);
        acc.discount = (acc.discount || 0) + (s.discount || 0);
        acc.platformFee = (acc.platformFee || 0) + (s.platformFee || 0);
        acc.shippingFee = (acc.shippingFee || 0) + (s.shippingFee || 0);
        acc.omset += s.omset || s.netRevenue || 0;
        acc.totalHpp += s.totalHpp || s.hpp || 0;
        acc.laba += s.laba || 0;
        return acc;
      },
      {
        qty: 0,
        voucher: 0,
        discount: 0,
        platformFee: 0,
        shippingFee: 0,
        omset: 0,
        totalHpp: 0,
        laba: 0,
      }
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
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              icon={<FiMaximize2 size={15} />}
              onClick={() => setShowScannerModal(true)}
              className="border-blue-200 text-blue-700 bg-blue-50/60 hover:bg-blue-100 shadow-xs"
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
              className="shrink-0 px-3 py-1.5 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              Resolusi Sekarang
            </button>
          </div>
        )}

        {/* Alert: Unmatched scan data */}
        {unmatched > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-blue-50 border-blue-200 text-blue-800 text-sm">
            <div className="flex items-center gap-2">
              <FiSearch size={16} className="text-blue-600 shrink-0" />
              <span>
                <strong>{unmatched} resi</strong> sudah discan logistik tapi belum ada data finance.
                Gunakan <strong>Bulk Paste Finance</strong> untuk mencocokkan data.
              </span>
            </div>
            <button
              onClick={() => setShowDiscrepancyModal(true)}
              className="shrink-0 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              Lihat Detail
            </button>
          </div>
        )}

        {/* Dedicated Filter & Search Toolbar Card */}
        <div
          className="bg-white border rounded-xl p-4 shadow-xs space-y-3"
          style={{ borderColor: colors.neutral.border }}
        >
          {/* Row 1: Date Presets Filter & Channel / Status Selectors */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Date Preset Filter */}
            <DatePresetFilter
              fromDate={fromDate}
              toDate={toDate}
              onDateChange={(from, to) => {
                setFromDate(from);
                setToDate(to);
              }}
            />

            {/* Channel & Status Dropdowns */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-600 font-medium">Channel:</span>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border text-xs bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  style={{ borderColor: colors.neutral.border }}
                >
                  <option value="all">Semua Channel</option>
                  <option value="SHOPEE">Shopee</option>
                  <option value="TIKTOK">TikTok Shop</option>
                  <option value="TOKOPEDIA">Tokopedia</option>
                  <option value="OFFLINE">Offline</option>
                  <option value="AFFILIATE">Affiliate</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-600 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border text-xs bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  style={{ borderColor: colors.neutral.border }}
                >
                  <option value="all">Semua Status</option>
                  <option value="DITERIMA">Diterima</option>
                  <option value="HILANG">Hilang</option>
                  <option value="RETURN">Return</option>
                  <option value="SELISIH_QTY">Selisih Qty</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Search Box, Reset Button, View Mode Toggle & Count */}
          <div className="pt-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderColor: colors.neutral.border }}>
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari resi, SKU, atau nama produk..."
                className="w-full pl-9 pr-8 py-1.5 bg-gray-50 border rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                style={{ borderColor: colors.neutral.border }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                  title="Bersihkan Pencarian"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Controls: Reset Button, View Mode Toggle & Items Counter */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              {/* Reset Filter Button if any filter is active */}
              {(channelFilter !== 'all' || statusFilter !== 'all' || fromDate || toDate || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setChannelFilter('all');
                    setStatusFilter('all');
                    setFromDate('');
                    setToDate('');
                    setSearch('');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer py-1 px-2 rounded hover:bg-rose-50 transition-colors"
                >
                  Reset Filter
                </button>
              )}

              {/* View Mode Toggle (Ringkas vs Detail) */}
              <div
                className="flex items-center p-0.5 rounded-lg border bg-gray-50 gap-0.5"
                style={{ borderColor: colors.neutral.border }}
              >
                <button
                  type="button"
                  onClick={() => handleViewModeChange('compact')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    viewMode === 'compact'
                      ? 'bg-white text-blue-700 shadow-xs border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                  title="Tampilan Ringkas (per Resi)"
                >
                  <FiList size={14} className={viewMode === 'compact' ? 'text-blue-600' : 'text-gray-500'} />
                  <span>Ringkas</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('detailed')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    viewMode === 'detailed'
                      ? 'bg-white text-blue-700 shadow-xs border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                  title="Tampilan Detail (Semua Kolom Finansial)"
                >
                  <FiColumns size={14} className={viewMode === 'detailed' ? 'text-blue-600' : 'text-gray-500'} />
                  <span>Detail</span>
                </button>
              </div>

              {/* Item Counter Badge */}
              <div className="text-xs text-gray-500 font-medium whitespace-nowrap bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
                <strong className="text-gray-900">{orderGroups.length}</strong> resi &nbsp;·&nbsp; <strong className="text-gray-900">{filteredSales.length}</strong> item
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {viewMode === 'compact' ? (
          <MarketplaceCompactTable
            orderGroups={paginatedOrderGroups}
            totalOrderGroupsCount={orderGroups.length}
            filteredSalesCount={filteredSales.length}
            loading={loading}
            totals={totals}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            editingStatusId={editingStatusId}
            editingStatus={editingStatus}
            isSavingStatus={isSavingStatus}
            onStartEditStatus={startEditStatus}
            onSaveStatus={saveStatus}
            onCancelEditStatus={() => setEditingStatusId(null)}
            onChangeEditingStatus={setEditingStatus}
            onSelectSaleForDetail={setSelectedSaleForDetail}
            onEditFinancial={setEditingFinancialSale}
            onDeleteSale={setDeletingSaleId}
          />
        ) : (
          <MarketplaceDetailedTable
            sales={paginatedSales}
            totalSalesCount={filteredSales.length}
            loading={loading}
            totals={totals}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            editingStatusId={editingStatusId}
            editingStatus={editingStatus}
            isSavingStatus={isSavingStatus}
            onStartEditStatus={startEditStatus}
            onSaveStatus={saveStatus}
            onCancelEditStatus={() => setEditingStatusId(null)}
            onChangeEditingStatus={setEditingStatus}
            onSelectSaleForDetail={setSelectedSaleForDetail}
            onEditFinancial={setEditingFinancialSale}
            onDeleteSale={setDeletingSaleId}
          />
        )}
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
        onEditStatus={(sale, newStatus) => {
          if (newStatus) {
            saveStatus(sale.id, newStatus);
          }
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
