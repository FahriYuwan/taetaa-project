'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { Button, Badge } from '@/components/ui/Button';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiFileText,
  FiEye,
  FiX,
  FiSave,
  FiSend,
  FiLayers,
  FiCheckSquare,
  FiSquare,
  FiRefreshCw,
  FiTrash2,
  FiPlay,
  FiPlusCircle,
  FiLock,
  FiInfo,
} from 'react-icons/fi';

interface OpnameItem {
  skuId: string;
  code: string;
  name: string;
  type: 'RAW' | 'PRODUCT' | 'PACKAGE';
  systemStock: number;
  physicalStock: number;
  diff: number;
  checked: boolean;
  notes: string;
}

interface HistoryItem {
  id: string;
  opnameNumber: string | null;
  date: string;
  notes: string;
  status: 'DRAFT' | 'REVIEW' | 'POSTED';
  itemCount: number;
  createdAt: string;
}

interface OpnameDetailItem {
  id: string;
  skuId: string;
  systemStock: number;
  physicalStock: number;
  diff: number;
  checked: boolean;
  notes: string | null;
  sku: {
    code: string;
    name: string;
    type: 'RAW' | 'PRODUCT' | 'PACKAGE';
  };
}

interface OpnameDetail {
  id: string;
  opnameNumber: string | null;
  date: string;
  notes: string;
  status: 'DRAFT' | 'REVIEW' | 'POSTED';
  createdAt: string;
  updatedAt: string;
  items: OpnameDetailItem[];
}

export default function StockOpnamePage() {
  const { showToast } = useToast();

  // Active Tab: 'new' | 'history'
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  // Form State
  const [items, setItems] = useState<OpnameItem[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [currentDraftNumber, setCurrentDraftNumber] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation Modal State (Posting)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDraftId, setPendingDraftId] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Delete Draft Confirmation Modal State
  const [draftToDelete, setDraftToDelete] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // History State
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [viewingDetail, setViewingDetail] = useState<OpnameDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchOpnameData();
    fetchHistory();
  }, []);

  async function fetchOpnameData() {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory/opname');
      if (res.ok) {
        const data = await res.json();
        const formatted: OpnameItem[] = data.map((sku: any) => ({
          skuId: sku.id,
          code: sku.code,
          name: sku.name,
          type: sku.type,
          systemStock: sku.systemStock,
          physicalStock: sku.systemStock,
          diff: 0,
          checked: false,
          notes: '',
        }));
        setItems(formatted);
        setCurrentDraftId(null);
        setCurrentDraftNumber(null);
        setGeneralNotes('');
      } else {
        showToast({ message: 'Gagal memuat data SKU untuk opname', type: 'error' });
      }
    } catch (error) {
      showToast({ message: 'Gagal memuat data SKU untuk opname', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory() {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/inventory/opname/history');
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch (error) {
      console.error('Failed to fetch opname history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function openDetailModal(id: string) {
    try {
      setLoadingDetail(true);
      const res = await fetch(`/api/inventory/opname/${id}`);
      if (res.ok) {
        const data = await res.json();
        setViewingDetail(data);
      } else {
        showToast({ message: 'Gagal memuat detail sesi opname', type: 'error' });
      }
    } catch (error) {
      showToast({ message: 'Gagal memuat detail sesi opname', type: 'error' });
    } finally {
      setLoadingDetail(false);
    }
  }

  // Load Draft to Resume & Edit
  async function handleResumeDraft(draft: HistoryItem) {
    try {
      setLoading(true);
      const res = await fetch(`/api/inventory/opname/${draft.id}`);
      if (!res.ok) {
        throw new Error('Gagal memuat detail draft opname');
      }
      const data: OpnameDetail = await res.json();

      if (data.status === 'POSTED') {
        showToast({
          message: 'Sesi ini sudah POSTED dan tidak dapat diedit kembali.',
          type: 'error',
        });
        return;
      }

      // Map loaded items
      const loadedItems: OpnameItem[] = data.items.map((item) => ({
        skuId: item.skuId,
        code: item.sku.code,
        name: item.sku.name,
        type: item.sku.type,
        systemStock: item.systemStock,
        physicalStock: item.physicalStock,
        diff: item.diff,
        checked: item.checked,
        notes: item.notes || '',
      }));

      setItems(loadedItems);
      setGeneralNotes(data.notes || '');
      setCurrentDraftId(data.id);
      setCurrentDraftNumber(data.opnameNumber);
      setActiveTab('new');

      showToast({
        message: `Melanjutkan draft ${data.opnameNumber || 'DRAFT'}`,
        type: 'info',
      });
    } catch (error: any) {
      showToast({ message: error.message || 'Gagal melanjutkan draft', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Delete Draft Handler (Confirmation Dialog executes this)
  async function handleConfirmDeleteDraft() {
    if (!draftToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/inventory/opname/${draftToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast({
          message: `Draft ${draftToDelete.opnameNumber || 'DRAFT'} berhasil dihapus. Stok tidak terpengaruh.`,
          type: 'success',
        });

        // If currently editing this draft, reset form to fresh state
        if (currentDraftId === draftToDelete.id) {
          await fetchOpnameData();
        }

        setDraftToDelete(null);
        await fetchHistory();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus draft opname');
      }
    } catch (error: any) {
      showToast({ message: error.message || 'Gagal menghapus draft', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  }

  // Start a brand new session (clear draft mode)
  function handleStartNewSession() {
    fetchOpnameData();
    showToast({ message: 'Memulai sesi Stock Opname baru', type: 'info' });
  }

  // Input Handlers
  function handlePhysicalStockChange(skuId: string, value: number) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.skuId === skuId) {
          const diff = Number((value - item.systemStock).toFixed(4));
          return { ...item, physicalStock: value, diff };
        }
        return item;
      })
    );
  }

  function handleItemToggleChecked(skuId: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.skuId === skuId) {
          return { ...item, checked: !item.checked };
        }
        return item;
      })
    );
  }

  function handleSelectAll(select: boolean) {
    const visibleSkuIds = new Set(filteredItems.map((i) => i.skuId));
    setItems((prev) =>
      prev.map((item) =>
        visibleSkuIds.has(item.skuId) ? { ...item, checked: select } : item
      )
    );
  }

  function handleItemNotesChange(skuId: string, text: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.skuId === skuId) {
          return { ...item, notes: text };
        }
        return item;
      })
    );
  }

  // Save / Update Draft Action (Does NOT alter stock)
  async function handleSaveDraft(silent = false): Promise<string | null> {
    const checkedItems = items.filter((item) => item.checked);
    if (checkedItems.length === 0) {
      showToast({
        message: 'Pilih minimal 1 item yang sudah dicek untuk disimpan sebagai draft',
        type: 'error',
      });
      return null;
    }

    setIsSubmitting(true);
    try {
      let res: Response;
      if (currentDraftId) {
        // Update existing draft
        res = await fetch(`/api/inventory/opname/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: generalNotes,
            items: items,
          }),
        });
      } else {
        // Create new draft
        res = await fetch('/api/inventory/opname', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: generalNotes,
            items: items,
          }),
        });
      }

      if (res.ok) {
        const data = await res.json();
        setCurrentDraftId(data.id);
        setCurrentDraftNumber(data.opnameNumber);
        if (!silent) {
          showToast({
            message: currentDraftId
              ? `Draft ${data.opnameNumber || ''} berhasil diperbarui`
              : `Draft opname berhasil disimpan (${data.opnameNumber || 'DRAFT'})`,
            type: 'success',
          });
        }
        fetchHistory();
        return data.id;
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan draft');
      }
    } catch (error: any) {
      showToast({ message: error.message || 'Gagal menyimpan draft', type: 'error' });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  // Open Review & Confirmation Modal
  async function handleReviewAndPosting() {
    const checkedItems = items.filter((item) => item.checked);
    if (checkedItems.length === 0) {
      showToast({
        message: 'Pilih minimal 1 item yang sudah dicek sebelum melakukan review & posting',
        type: 'error',
      });
      return;
    }

    // Save/Update draft first so database is in sync
    const draftId = await handleSaveDraft(true);
    if (!draftId) return;

    setPendingDraftId(draftId);
    setShowConfirmModal(true);
  }

  // Confirm Posting Execution (Atomic DB transaction: ADJUSTMENT movement + SKUCostHistory)
  async function handleConfirmPost(targetId?: string) {
    const idToPost = targetId || pendingDraftId;
    if (!idToPost) return;

    setIsPosting(true);
    try {
      const res = await fetch(`/api/inventory/opname/${idToPost}`, {
        method: 'PATCH',
      });

      if (res.ok) {
        showToast({
          message: 'Stock Opname berhasil diposting! Stok sistem telah disesuaikan secara permanen.',
          type: 'success',
        });
        setShowConfirmModal(false);
        setPendingDraftId(null);
        if (viewingDetail) {
          setViewingDetail(null);
        }
        // Reset form and reload fresh data & history
        await fetchOpnameData();
        await fetchHistory();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memposting stock opname');
      }
    } catch (error: any) {
      showToast({ message: error.message || 'Gagal memposting stock opname', type: 'error' });
    } finally {
      setIsPosting(false);
    }
  }

  // Calculations for Summary Bar
  const totalItems = items.length;
  const checkedItems = items.filter((i) => i.checked);
  const checkedCount = checkedItems.length;
  const matchCount = checkedItems.filter((i) => i.diff === 0).length;
  const diffCount = checkedItems.filter((i) => i.diff !== 0).length;
  const diffItems = checkedItems.filter((i) => i.diff !== 0);

  // Filtered Items for Display
  const filteredItems = items.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      searchQuery === '' ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const allVisibleChecked =
    filteredItems.length > 0 && filteredItems.every((i) => i.checked);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Rekonsiliasi Stock Opname"
        subtitle="Verifikasi stok sistem vs fisik secara real-time dan rekam sesi audit trail (Draft → Review → Posted)."
        actions={
          activeTab === 'new' ? (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                icon={<FiSave className="w-4 h-4" />}
                onClick={() => handleSaveDraft(false)}
                disabled={isSubmitting || loading || checkedCount === 0}
              >
                {isSubmitting
                  ? 'Menyimpan...'
                  : currentDraftId
                  ? `Simpan Perubahan Draft (${currentDraftNumber || 'DRAFT'})`
                  : 'Simpan Draft'}
              </Button>
              <Button
                variant="primary"
                icon={<FiSend className="w-4 h-4" />}
                onClick={handleReviewAndPosting}
                disabled={isSubmitting || loading || checkedCount === 0}
              >
                Review & Posting
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              icon={<FiRefreshCw className="w-4 h-4" />}
              onClick={fetchHistory}
              disabled={loadingHistory}
            >
              Segarkan
            </Button>
          )
        }
      />

      {/* Tabs Navigation */}
      <div className="bg-white border-b px-6 pt-3" style={{ borderColor: colors.neutral.border }}>
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('new')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'new'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FiLayers className="w-4 h-4" />
            Opname Baru
            {currentDraftNumber && (
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-blue-100 text-blue-700 font-bold">
                Mengedit: {currentDraftNumber}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              fetchHistory();
            }}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FiClock className="w-4 h-4" />
            Riwayat Opname ({historyList.length})
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Active Draft Banner */}
          {currentDraftId && (
            <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-md bg-blue-100 text-blue-700">
                  <FiFileText className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-sm font-bold text-blue-900">
                    Mode Melanjutkan Draft: {currentDraftNumber || 'DRAFT'}
                  </div>
                  <div className="text-xs text-blue-700">
                    Perubahan yang Anda simpan akan memperbarui sesi draft ini. Stok inventaris belum terpengaruh.
                  </div>
                </div>
              </div>
              <Button
                variant="secondary"
                icon={<FiPlusCircle className="w-3.5 h-3.5" />}
                onClick={handleStartNewSession}
              >
                Buat Sesi Baru
              </Button>
            </div>
          )}

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm" style={{ borderColor: colors.neutral.border }}>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Item SKU</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{totalItems}</div>
              <div className="text-xs text-gray-500 mt-0.5">Semua SKU aktif</div>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm" style={{ borderColor: colors.neutral.border }}>
              <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Sudah Dicek</div>
              <div className="text-2xl font-bold text-blue-700 mt-1">
                {checkedCount}
                <span className="text-sm font-normal text-gray-400 ml-1">/ {totalItems}</span>
              </div>
              <div className="text-xs text-blue-500 mt-0.5">
                {totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0}% terverifikasi
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm" style={{ borderColor: colors.neutral.border }}>
              <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Sesuai (Stok Cocok)</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{matchCount}</div>
              <div className="text-xs text-emerald-600 mt-0.5">Selisih = 0</div>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm" style={{ borderColor: colors.neutral.border }}>
              <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Ada Selisih</div>
              <div className="text-2xl font-bold text-amber-700 mt-1">{diffCount}</div>
              <div className="text-xs text-amber-600 mt-0.5">Perlu penyesuaian stok</div>
            </div>
          </div>

          {/* General Notes & Controls Bar */}
          <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between" style={{ borderColor: colors.neutral.border }}>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Catatan Sesi Rekonsiliasi (General Notes)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Contoh: Opname Akhir Bulan September oleh Tim Gudang"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                disabled={isSubmitting || loading}
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Filter Tipe
                </label>
                <select
                  className="px-3 py-2 border rounded-md text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Semua Tipe</option>
                  <option value="RAW">RAW (Bahan Baku)</option>
                  <option value="PRODUCT">PRODUCT (Barang Jadi)</option>
                  <option value="PACKAGE">PACKAGE (Kemasan)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Cari SKU / Nama
                </label>
                <input
                  type="text"
                  className="px-3 py-2 border rounded-md text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ketik kode/nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table Spreadsheet View */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: colors.neutral.border }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b" style={{ borderColor: colors.neutral.border }}>
                  <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <th className="px-4 py-3 text-center w-14">
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => handleSelectAll(!allVisibleChecked)}
                          className="text-gray-500 hover:text-blue-600 focus:outline-none"
                          title={allVisibleChecked ? 'Batalkan semua' : 'Pilih semua'}
                        >
                          {allVisibleChecked ? (
                            <FiCheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <FiSquare className="w-4 h-4" />
                          )}
                        </button>
                        <span className="text-[9px] mt-0.5">CEK</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 w-32">SKU CODE</th>
                    <th className="px-4 py-3">NAMA PRODUK</th>
                    <th className="px-4 py-3 text-center w-24">TIPE</th>
                    <th className="px-4 py-3 text-right w-32">STOK SISTEM</th>
                    <th className="px-4 py-3 text-center w-36">STOK FISIK</th>
                    <th className="px-4 py-3 text-right w-28">SELISIH</th>
                    <th className="px-4 py-3 min-w-[220px]">CATATAN PERBEDAAN / ALASAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <FiClock className="w-5 h-5 animate-spin text-blue-500" />
                          <span>Memuat data SKU...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center text-gray-400">
                        Tidak ada SKU yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const diffColor =
                        item.diff > 0
                          ? 'text-emerald-600 font-bold'
                          : item.diff < 0
                          ? 'text-rose-600 font-bold'
                          : 'text-gray-400 font-medium';

                      return (
                        <tr
                          key={item.skuId}
                          className="hover:bg-gray-50/50 transition-colors"
                          style={{
                            backgroundColor: item.checked ? 'rgba(59, 130, 246, 0.03)' : 'transparent',
                          }}
                        >
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              checked={item.checked}
                              onChange={() => handleItemToggleChecked(item.skuId)}
                              disabled={isSubmitting}
                            />
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-gray-800">{item.code}</td>
                          <td className="px-4 py-3 text-gray-700 font-medium truncate max-w-[220px]" title={item.name}>
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge type={item.type}>{item.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-600 bg-gray-50/40">
                            {item.systemStock.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <input
                              type="number"
                              step="0.01"
                              className="w-28 px-2 py-1.5 border rounded text-right text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              value={item.physicalStock}
                              onChange={(e) =>
                                handlePhysicalStockChange(item.skuId, parseFloat(e.target.value) || 0)
                              }
                              disabled={isSubmitting}
                            />
                          </td>
                          <td className={`px-4 py-3 text-right ${diffColor}`}>
                            {item.diff > 0
                              ? `+${item.diff.toLocaleString('id-ID')}`
                              : item.diff.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              className="w-full px-2.5 py-1.5 border rounded text-xs bg-white text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              placeholder={
                                item.diff !== 0
                                  ? 'Wajib/disarankan diisi alasan selisih...'
                                  : 'Catatan kondisi barang...'
                              }
                              value={item.notes}
                              onChange={(e) => handleItemNotesChange(item.skuId, e.target.value)}
                              disabled={isSubmitting}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: colors.neutral.border }}>
            <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: colors.neutral.border }}>
              <div>
                <h3 className="text-base font-bold text-gray-800">Riwayat Sesi Stock Opname</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Daftar transaksi audit trail stock opname. Sesi DRAFT dapat dilanjutkan atau dihapus; sesi POSTED terkunci permanen.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b" style={{ borderColor: colors.neutral.border }}>
                  <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <th className="px-6 py-3">NO. OPNAME</th>
                    <th className="px-6 py-3">TANGGAL & WAKTU</th>
                    <th className="px-6 py-3">CATATAN SESI</th>
                    <th className="px-6 py-3 text-center">TOTAL ITEM</th>
                    <th className="px-6 py-3 text-center">STATUS</th>
                    <th className="px-6 py-3 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <FiClock className="w-5 h-5 animate-spin text-blue-500" />
                          <span>Memuat riwayat opname...</span>
                        </div>
                      </td>
                    </tr>
                  ) : historyList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                        Belum ada riwayat stock opname.
                      </td>
                    </tr>
                  ) : (
                    historyList.map((row) => {
                      const isPosted = row.status === 'POSTED';
                      const isDraft = row.status === 'DRAFT' || row.status === 'REVIEW';

                      const statusBadge = isPosted ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <FiCheckCircle className="w-3 h-3 mr-1" />
                          POSTED
                        </span>
                      ) : row.status === 'REVIEW' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <FiClock className="w-3 h-3 mr-1" />
                          REVIEW
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          <FiFileText className="w-3 h-3 mr-1" />
                          DRAFT
                        </span>
                      );

                      return (
                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-gray-800">
                            {row.opnameNumber || <span className="text-gray-400 italic">DRAFT</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {new Date(row.createdAt || row.date).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-4 text-gray-700 max-w-xs truncate">
                            {row.notes || <span className="text-gray-400 italic">Tidak ada catatan</span>}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-gray-700">
                            {row.itemCount} SKU
                          </td>
                          <td className="px-6 py-4 text-center">
                            {statusBadge}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isDraft ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleResumeDraft(row)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                  title="Lanjutkan edit dan proses draft opname ini"
                                >
                                  <FiPlay className="w-3 h-3" />
                                  Lanjutkan
                                </button>
                                <button
                                  onClick={() => setDraftToDelete(row)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                                  title="Hapus draft opname ini"
                                >
                                  <FiTrash2 className="w-3 h-3" />
                                  Hapus
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() => openDetailModal(row.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                  title="Lihat detail audit trail opname yang sudah diposting"
                                >
                                  <FiEye className="w-3.5 h-3.5" />
                                  Detail
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Posting Opname) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                <FiAlertTriangle className="text-amber-500 w-5 h-5" />
                <span>Review & Konfirmasi Posting Opname</span>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-2.5">
                <FiAlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Perhatian: Penyesuaian Stok Permanen</div>
                  <div className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Setelah Anda menekan <strong>Konfirmasi & Posting</strong>, stok sistem akan disesuaikan langsung dengan stok fisik yang Anda input melalui transaksi mutasi <strong>ADJUSTMENT</strong>. Transaksi ini terkunci dan tidak dapat diedit atau dihapus.
                  </div>
                </div>
              </div>

              {/* Summary Discrepancies */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Item Dicek</div>
                  <div className="text-xl font-bold text-gray-800 mt-0.5">{checkedCount} SKU</div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase">Stok Sesuai</div>
                  <div className="text-xl font-bold text-emerald-700 mt-0.5">{matchCount} SKU</div>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <div className="text-[11px] font-bold text-rose-700 uppercase">Perlu Disesuaikan</div>
                  <div className="text-xl font-bold text-rose-700 mt-0.5">{diffCount} SKU</div>
                </div>
              </div>

              {/* Discrepancy Items Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                  Daftar SKU yang Mengalami Selisih Stok:
                </h4>

                {diffItems.length === 0 ? (
                  <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200 text-center text-sm text-emerald-800 font-medium">
                    ✓ Tidak ada selisih stok! Semua {checkedCount} item yang dicek memiliki stok fisik persis sama dengan stok sistem.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100 sticky top-0 border-b">
                        <tr className="text-left font-bold text-gray-600">
                          <th className="px-3 py-2">KODE SKU</th>
                          <th className="px-3 py-2">NAMA BARANG</th>
                          <th className="px-3 py-2 text-right">SISTEM</th>
                          <th className="px-3 py-2 text-right">FISIK</th>
                          <th className="px-3 py-2 text-right">SELISIH</th>
                          <th className="px-3 py-2">ALASAN / CATATAN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {diffItems.map((item) => (
                          <tr key={item.skuId} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-mono font-bold text-gray-800">{item.code}</td>
                            <td className="px-3 py-2 text-gray-700 truncate max-w-[160px]">{item.name}</td>
                            <td className="px-3 py-2 text-right text-gray-500">{item.systemStock}</td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">{item.physicalStock}</td>
                            <td className={`px-3 py-2 text-right font-bold ${item.diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {item.diff > 0 ? `+${item.diff}` : item.diff}
                            </td>
                            <td className="px-3 py-2 text-gray-600 italic">
                              {item.notes || <span className="text-gray-400">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={isPosting}
              >
                Batal & Periksa Kembali
              </Button>
              <Button
                variant="primary"
                onClick={() => handleConfirmPost()}
                disabled={isPosting}
                icon={isPosting ? <FiClock className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />}
              >
                {isPosting ? 'Memproses Posting...' : 'Konfirmasi & Posting'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Draft Confirmation Dialog */}
      {draftToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-base">
                <FiTrash2 className="w-5 h-5 text-rose-600" />
                <span>Konfirmasi Hapus Draft</span>
              </div>
              <button
                onClick={() => setDraftToDelete(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                Apakah Anda yakin ingin menghapus draft sesi{' '}
                <strong className="font-mono text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                  {draftToDelete.opnameNumber || 'DRAFT'}
                </strong>
                ?
              </p>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-800 font-semibold">
                  <FiInfo className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Informasi Audit:</span>
                </div>
                <div>• Draft ini belum pernah diposting ke sistem.</div>
                <div>• Menghapus draft ini <strong>tidak akan memengaruhi</strong> jumlah stok inventaris apapun.</div>
                <div>• Tindakan ini tidak dapat dibatalkan.</div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setDraftToDelete(null)}
                disabled={isDeleting}
              >
                Batal
              </Button>
              <button
                type="button"
                onClick={handleConfirmDeleteDraft}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded transition-colors"
              >
                {isDeleting ? <FiClock className="w-4 h-4 animate-spin" /> : <FiTrash2 className="w-4 h-4" />}
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Draft'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Detail Modal (Audit Trail View) */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-gray-900 text-lg">
                    Detail Sesi Opname: {viewingDetail.opnameNumber || 'DRAFT'}
                  </h3>
                  {viewingDetail.status === 'POSTED' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <FiLock className="w-3 h-3 mr-1" />
                      POSTED (Terkunci)
                    </span>
                  ) : viewingDetail.status === 'REVIEW' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      REVIEW
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
                      DRAFT
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Direkam pada:{' '}
                  {new Date(viewingDetail.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {viewingDetail.notes ? ` • Catatan: "${viewingDetail.notes}"` : ''}
                </p>
              </div>

              <button
                onClick={() => setViewingDetail(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Notice for POSTED Audit Trail */}
            {viewingDetail.status === 'POSTED' && (
              <div className="px-6 py-2.5 bg-emerald-50/80 border-b border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Sesi ini telah diposting ke kartu stok inventaris. Sesuai prinsip audit trail, transaksi POSTED bersifat permanen dan tidak dapat diedit atau dihapus. Jika diperlukan koreksi stok di masa depan, gunakan transaksi penyesuaian baru.
                </span>
              </div>
            )}

            {/* Table */}
            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <th className="px-4 py-2.5">SKU CODE</th>
                    <th className="px-4 py-2.5">NAMA PRODUK</th>
                    <th className="px-4 py-2.5 text-center">TIPE</th>
                    <th className="px-4 py-2.5 text-right">STOK SISTEM</th>
                    <th className="px-4 py-2.5 text-right">STOK FISIK</th>
                    <th className="px-4 py-2.5 text-right">SELISIH</th>
                    <th className="px-4 py-2.5">CATATAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {viewingDetail.items.map((item) => {
                    const diffColor =
                      item.diff > 0
                        ? 'text-emerald-600 font-bold'
                        : item.diff < 0
                        ? 'text-rose-600 font-bold'
                        : 'text-gray-400';

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 font-mono font-bold text-gray-800">{item.sku.code}</td>
                        <td className="px-4 py-2.5 text-gray-700">{item.sku.name}</td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge type={item.sku.type}>{item.sku.type}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 font-medium">
                          {item.systemStock.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-gray-800">
                          {item.physicalStock.toLocaleString('id-ID')}
                        </td>
                        <td className={`px-4 py-2.5 text-right ${diffColor}`}>
                          {item.diff > 0 ? `+${item.diff.toLocaleString('id-ID')}` : item.diff.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-600 italic">
                          {item.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Total item: <strong>{viewingDetail.items.length} SKU</strong>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setViewingDetail(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
