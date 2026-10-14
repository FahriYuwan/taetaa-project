'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { Button } from '@/components/ui/Button';
import { AddPurchaseModal } from '@/components/modals/AddPurchaseModal';
import { BulkPurchaseModal } from '@/components/modals/BulkPurchaseModal';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import { DatePresetFilter } from '@/components/filters/DatePresetFilter';

function ClipboardIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function PlusIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function SearchIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

interface Purchase {
  id: string;
  date: string;
  skuId?: string | null;
  kemasanId?: string | null;
  sku?: {
    code: string;
    name: string;
  } | null;
  kemasan?: {
    code: string;
    name: string;
    category: string;
  } | null;
  qty: number;
  unitPrice: number;
  total: number;
  supplier: string | null;
  notes: string | null;
}

type CategoryFilter = 'all' | 'raw' | 'kemasan';
type KemasanSubCategory = 'all' | 'PACKING' | 'STIKER' | 'SAFETY' | 'DUS';
type SortOption = 'date-desc' | 'date-asc' | 'total-desc' | 'total-asc' | 'qty-desc';

export default function PembelianRawPage() {
  const { showToast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState<KemasanSubCategory>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Date filters (default empty to show all historical data)
  const [toDate, setToDate] = useState('');
  const [fromDate, setFromDate] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, [fromDate, toDate]);

  async function fetchPurchases() {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const query = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`/api/purchases${query}`);
      if (res.ok) {
        const data = await res.json();
        setPurchases(data);
      } else {
        throw new Error('Gagal memuat data dari server');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data pembelian');
      showToast({ message: 'Gagal memuat data pembelian', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Extract unique suppliers with their counts
  const supplierOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    purchases.forEach((p) => {
      const s = p.supplier?.trim();
      if (s) counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [purchases]);

  // Counts for main category tabs
  const rawCount = useMemo(() => purchases.filter((p) => !!p.skuId).length, [purchases]);
  const kemasanCount = useMemo(() => purchases.filter((p) => !!p.kemasanId).length, [purchases]);

  // Counts for kemasan subcategories
  const subCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { PACKING: 0, STIKER: 0, SAFETY: 0, DUS: 0 };
    purchases.forEach((p) => {
      if (p.kemasan?.category && counts[p.kemasan.category] !== undefined) {
        counts[p.kemasan.category]++;
      }
    });
    return counts;
  }, [purchases]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return purchases
      .filter((item) => {
        // Main category
        if (categoryFilter === 'raw' && !item.skuId) return false;
        if (categoryFilter === 'kemasan' && !item.kemasanId) return false;

        // Kemasan subcategory
        if (subCategoryFilter !== 'all') {
          if (!item.kemasanId || item.kemasan?.category !== subCategoryFilter) {
            return false;
          }
        }

        // Supplier filter
        if (selectedSupplier !== 'all') {
          if (item.supplier?.trim() !== selectedSupplier) return false;
        }

        // Search filter
        if (search.trim()) {
          const s = search.toLowerCase();
          const itemCode = item.sku?.code || item.kemasan?.code || '';
          const itemName = item.sku?.name || item.kemasan?.name || '';
          const supplier = item.supplier || '';
          const notes = item.notes || '';

          const matches =
            itemCode.toLowerCase().includes(s) ||
            itemName.toLowerCase().includes(s) ||
            supplier.toLowerCase().includes(s) ||
            notes.toLowerCase().includes(s);

          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date-asc':
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          case 'total-desc':
            return (b.total || 0) - (a.total || 0);
          case 'total-asc':
            return (a.total || 0) - (b.total || 0);
          case 'qty-desc':
            return b.qty - a.qty;
          case 'date-desc':
          default:
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      });
  }, [purchases, categoryFilter, subCategoryFilter, selectedSupplier, search, sortBy]);

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

      showToast({ message: 'Pembelian berhasil dicatat dan HPP telah diperbarui', type: 'success' });
      setShowAddModal(false);
      fetchPurchases();
    } catch (error: any) {
      throw error;
    }
  }

  // Active filter count check
  const hasActiveFilters =
    categoryFilter !== 'all' ||
    subCategoryFilter !== 'all' ||
    selectedSupplier !== 'all' ||
    search.trim() !== '' ||
    fromDate !== '' ||
    toDate !== '' ||
    sortBy !== 'date-desc';

  function resetAllFilters() {
    setCategoryFilter('all');
    setSubCategoryFilter('all');
    setSelectedSupplier('all');
    setSearch('');
    setFromDate('');
    setToDate('');
    setSortBy('date-desc');
  }



  const totalPembelian = filteredItems.reduce((sum, p) => sum + (p.total || 0), 0);
  const totalRaw = filteredItems.filter((p) => !!p.skuId).reduce((sum, p) => sum + (p.total || 0), 0);
  const totalKemasan = filteredItems.filter((p) => !!p.kemasanId).reduce((sum, p) => sum + (p.total || 0), 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Pembelian Bahan & Kemasan"
        subtitle="Catat pembelian bahan baku RAW dan kemasan. Stok bertambah dan HPP otomatis terhitung (Weighted Average)."
        actions={
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Date Filters */}
            <DatePresetFilter
              fromDate={fromDate}
              toDate={toDate}
              onDateChange={(from, to) => {
                setFromDate(from);
                setToDate(to);
              }}
            />

            {/* Action Buttons */}
            <Button variant="secondary" icon={<ClipboardIcon />} onClick={() => setShowBulkModal(true)}>
              Bulk Paste
            </Button>
            <Button variant="primary" icon={<PlusIcon />} onClick={() => setShowAddModal(true)}>
              Catat Pembelian
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-5 rounded-lg border bg-white shadow-sm"
            style={{ borderColor: colors.neutral.border }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Total Pembelian Terpilih</p>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold" style={{ color: colors.brand[500] }}>
                Rp {totalPembelian.toLocaleString('id-ID')}
              </p>
              <span className="text-xs text-gray-500 font-medium">{filteredItems.length} transaksi</span>
            </div>
          </div>
          <div
            className="p-5 rounded-lg border bg-white shadow-sm"
            style={{ borderColor: colors.neutral.border }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Bahan Baku (RAW)</p>
            <p className="text-2xl font-bold text-gray-800">
              Rp {totalRaw.toLocaleString('id-ID')}
            </p>
          </div>
          <div
            className="p-5 rounded-lg border bg-white shadow-sm"
            style={{ borderColor: colors.neutral.border }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Kemasan (Packing/Dus/Stiker)</p>
            <p className="text-2xl font-bold text-gray-800">
              Rp {totalKemasan.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Filter Toolbar Card */}
        <div className="bg-white border rounded-lg p-4 shadow-sm space-y-3" style={{ borderColor: colors.neutral.border }}>
          {/* Row 1: Primary Category Tabs & Search & Supplier */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all' as const, label: 'Semua', count: purchases.length },
                { id: 'raw' as const, label: 'Bahan Mentah (RAW)', count: rawCount },
                { id: 'kemasan' as const, label: 'Kemasan', count: kemasanCount },
              ].map((tab) => {
                const isActive = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCategoryFilter(tab.id);
                      if (tab.id === 'raw') setSubCategoryFilter('all');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-50 border text-gray-600 hover:bg-gray-100'
                    }`}
                    style={{ borderColor: isActive ? 'transparent' : colors.neutral.border }}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Controls: Search, Supplier, Sort */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search Box */}
              <div
                className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded border focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                style={{ borderColor: colors.neutral.border }}
              >
                <SearchIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Cari SKU / Supplier / Catatan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-xs text-gray-800 bg-transparent w-44 md:w-52 focus:outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="w-5 h-5 flex items-center justify-center text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                    title="Bersihkan Pencarian"
                    aria-label="Bersihkan Pencarian"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Supplier Filter Dropdown */}
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded border bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  style={{ borderColor: colors.neutral.border }}
                >
                  <option value="all">Semua Supplier ({supplierOptions.length})</option>
                  {supplierOptions.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-xs px-2.5 py-1.5 rounded border bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  style={{ borderColor: colors.neutral.border }}
                >
                  <option value="date-desc">Urut: Tanggal Terbaru</option>
                  <option value="date-asc">Urut: Tanggal Terlama</option>
                  <option value="total-desc">Urut: Nominal Tertinggi</option>
                  <option value="total-asc">Urut: Nominal Terendah</option>
                  <option value="qty-desc">Urut: Qty Terbanyak</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Subcategory Pills (PACKING, STIKER, SAFETY, DUS) */}
          {(categoryFilter === 'all' || categoryFilter === 'kemasan') && (
            <div className="pt-2 border-t flex items-center gap-2 flex-wrap text-xs" style={{ borderColor: colors.neutral.border }}>
              <span className="text-gray-500 font-medium text-[11px] uppercase tracking-wide">Kategori Kemasan:</span>
              {(['all', 'PACKING', 'STIKER', 'SAFETY', 'DUS'] as const).map((sub) => {
                const isActive = subCategoryFilter === sub;
                const count = sub === 'all' ? kemasanCount : (subCategoryCounts[sub] || 0);

                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubCategoryFilter(sub)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? 'bg-purple-100 text-purple-800 font-bold border border-purple-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                    }`}
                  >
                    <span>{sub === 'all' ? 'Semua Kemasan' : sub}</span>
                    <span className="text-[10px] text-gray-500 font-normal">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Filter Chips & Reset All Button */}
          {hasActiveFilters && (
            <div className="pt-2 border-t flex items-center justify-between gap-2 flex-wrap text-xs" style={{ borderColor: colors.neutral.border }}>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-gray-600 text-xs font-semibold">Filter Aktif:</span>
                {categoryFilter !== 'all' && (
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-medium border border-blue-200 flex items-center gap-1">
                    Kategori: {categoryFilter.toUpperCase()}
                    <button onClick={() => setCategoryFilter('all')} className="hover:text-blue-900 cursor-pointer">✕</button>
                  </span>
                )}
                {subCategoryFilter !== 'all' && (
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[11px] font-medium border border-purple-200 flex items-center gap-1">
                    Subkategori: {subCategoryFilter}
                    <button onClick={() => setSubCategoryFilter('all')} className="hover:text-purple-900 cursor-pointer">✕</button>
                  </span>
                )}
                {selectedSupplier !== 'all' && (
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200 flex items-center gap-1">
                    Supplier: {selectedSupplier}
                    <button onClick={() => setSelectedSupplier('all')} className="hover:text-emerald-900 cursor-pointer">✕</button>
                  </span>
                )}
                {(fromDate || toDate) && (
                  <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200 flex items-center gap-1">
                    Periode: {fromDate || '...'} s/d {toDate || '...'}
                    <button onClick={() => { setFromDate(''); setToDate(''); }} className="hover:text-amber-900 cursor-pointer">✕</button>
                  </span>
                )}
                {search && (
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium border border-gray-200 flex items-center gap-1">
                    "{search}"
                    <button onClick={() => setSearch('')} className="hover:text-gray-900 cursor-pointer">✕</button>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </div>
          )}
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
                <th className="px-6 py-4">TIPE</th>
                <th className="px-6 py-4">ITEM / PRODUK</th>
                <th className="px-6 py-4 text-right">QTY</th>
                <th className="px-6 py-4 text-right">HARGA SATUAN</th>
                <th className="px-6 py-4 text-right">TOTAL</th>
                <th className="px-6 py-4">SUPPLIER</th>
                <th className="px-6 py-4">CATATAN</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
              {error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm font-semibold text-rose-600 mb-2">{error}</p>
                    <button
                      type="button"
                      onClick={() => fetchPurchases()}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                    >
                      Muat Ulang
                    </button>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-600 font-medium">Memuat data pembelian...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <p className="text-gray-600 mb-2 font-medium">Tidak ada transaksi yang cocok dengan filter yang dipilih.</p>
                    {hasActiveFilters && (
                      <button
                        onClick={resetAllFilters}
                        className="text-blue-600 font-bold hover:underline text-xs cursor-pointer"
                      >
                        Reset semua filter untuk melihat data
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredItems.map((p) => {
                  const isKemasan = !!p.kemasanId;
                  const itemCode = isKemasan ? p.kemasan?.code : p.sku?.code;
                  const itemName = isKemasan ? p.kemasan?.name : p.sku?.name;
                  const categoryBadge = isKemasan ? p.kemasan?.category : 'RAW';

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                        {new Date(p.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isKemasan
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {categoryBadge}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{itemCode}</div>
                        <div className="text-xs text-gray-500">{itemName}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-800">
                        {p.qty.toLocaleString('id-ID')} {isKemasan ? 'pcs' : ''}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        Rp {p.unitPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        Rp {p.total.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{p.supplier || '-'}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs italic">{p.notes || '-'}</td>
                    </tr>
                  );
                })
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
