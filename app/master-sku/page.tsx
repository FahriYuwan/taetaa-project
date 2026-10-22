'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { Button, Badge } from '@/components/ui/Button';
import { AddEditSKUModal } from '@/components/modals/AddEditSKUModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { BOMDetailModal } from '@/components/modals/BOMDetailModal';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import { Pagination } from '@/components/ui/Pagination';

interface SKU {
  id: string;
  code: string;
  name: string;
  type: 'RAW' | 'PRODUCT' | 'PACKAGE';
  productSize?: number;
  unit?: string;
  hppPrice?: number;
  avgCost?: number;
  sellingPrice?: number;
  stock?: number;
  stockMin?: number | null;
  rawCost?: number;
  packagingCost?: number;
  estimatedBomHpp?: number;
  bomComponents?: any[];
}

export default function MasterSKUPage() {
  const [skus, setSkus] = useState<SKU[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingSku, setEditingSku] = useState<SKU | null>(null);
  const [viewingSku, setViewingSku] = useState<SKU | null>(null);
  const [deletingSkuId, setDeletingSkuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSkus();
  }, []);

  async function fetchSkus() {
    try {
      setLoading(true);
      const res = await fetch('/api/skus');
      if (res.ok) {
        const data = await res.json();
        setSkus(data);
      }
    } catch (error) {
      console.error('Failed to fetch SKUs:', error);
      showToast({ message: 'Gagal memuat data SKU', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSku(formData: any) {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/skus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal menambah SKU');
      }

      showToast({ message: 'SKU berhasil ditambahkan', type: 'success' });
      setShowAddModal(false);
      fetchSkus();
    } catch (error: any) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSku(formData: any) {
    if (!editingSku?.id) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/skus/${editingSku.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal mengubah SKU');
      }

      showToast({ message: 'SKU berhasil diperbarui', type: 'success' });
      setEditingSku(null);
      fetchSkus();
    } catch (error: any) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSku(skuId: string) {
    try {
      const res = await fetch(`/api/skus/${skuId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus SKU');
      
      showToast({ message: 'SKU berhasil dihapus', type: 'success' });
      setDeletingSkuId(null);
      fetchSkus();
    } catch (error: any) {
      showToast({ message: error.message || 'Gagal menghapus SKU', type: 'error' });
    }
  }

  const filteredSkus = skus.filter(sku => {
    const matchesFilter = filter === 'all' || sku.type === filter;
    const matchesSearch =
      sku.code.toLowerCase().includes(search.toLowerCase()) ||
      sku.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const paginatedSkus = pageSize === 'all'
    ? filteredSkus
    : filteredSkus.slice((page - 1) * pageSize, page * pageSize);

  const counts = {
    all: skus.length,
    RAW: skus.filter(s => s.type === 'RAW').length,
    PRODUCT: skus.filter(s => s.type === 'PRODUCT').length,
    PACKAGE: skus.filter(s => s.type === 'PACKAGE').length,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Master SKU"
        subtitle="Kelola daftar produk RAW, PRODUCT, dan PACKAGE beserta BOM"
        actions={
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Cari SKU / Nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 rounded border text-sm"
              style={{ borderColor: colors.neutral.border }}
            />
            <Button
              variant="secondary"
              icon="📋"
              onClick={() => setShowBulkModal(true)}
            >
              Bulk Paste
            </Button>
            <Button variant="primary" icon="➕" onClick={() => setShowAddModal(true)}>
              Tambah SKU
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
          {/* Tabs */}
          <div 
            className="flex gap-2 mb-6 p-4 rounded-t-lg"
            style={{ backgroundColor: colors.neutral.card, borderColor: colors.neutral.border }}
          >
            {(['all', 'RAW', 'PRODUCT', 'PACKAGE'] as const).map((tab) => {
              const isActive = filter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className="px-4 py-2 rounded text-sm font-medium transition-all cursor-pointer select-none"
                  style={{
                    backgroundColor: isActive ? colors.brand[500] : 'transparent',
                    color: isActive ? 'white' : colors.neutral.textMuted,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(79,195,247,0.08)';
                      (e.currentTarget as HTMLElement).style.color = colors.neutral.textStrong;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = colors.neutral.textMuted;
                    }
                  }}
                >
                  {tab === 'all' ? 'Semua' : (tab === 'PRODUCT' ? 'Product' : tab)} ({counts[tab === 'all' ? 'all' : tab]})
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div 
            className="rounded-b-lg border overflow-hidden"
            style={{ borderColor: colors.neutral.border, backgroundColor: colors.neutral.card }}
          >
            {filteredSkus.length === 0 ? (
              <div className="py-16 text-center">
                <p style={{ color: colors.brand[500] }}>
                  {skus.length === 0 ? 'Tidak ada SKU. Klik "Tambah SKU"' : 'Tidak ada hasil pencarian'}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottomColor: colors.neutral.border, borderBottomWidth: '1px' }}>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>SKU CODE</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>NAMA</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>TIPE</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>UKURAN / KUANTITAS</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>STOK MIN</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>HARGA HPP</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide cursor-help" style={{ color: colors.neutral.textMuted }} title="Rekomendasi harga patokan yang diinputkan oleh owner">REKOMENDASI HARGA</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>BOM</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSkus.map((sku) => {
                    const stockMin = sku.stockMin ?? 0;

                    return (
                      <tr key={sku.id} style={{ borderBottomColor: colors.neutral.border, borderBottomWidth: '1px' }}>
                        <td className="px-6 py-4 text-sm font-medium" style={{ color: colors.neutral.textStrong }}>{sku.code}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: colors.neutral.textStrong }}>{sku.name}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge type={sku.type}>{sku.type === 'PRODUCT' ? 'PRODUCT' : sku.type}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right text-sm" style={{ color: colors.neutral.textStrong }}>
                          {sku.productSize && sku.productSize > 0 ? (
                            <span>
                              {sku.unit === 'pcs'
                                ? `${sku.productSize.toLocaleString('id-ID')} pcs`
                                : sku.productSize >= 1000
                                ? `${(sku.productSize / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} L`
                                : `${sku.productSize.toLocaleString('id-ID')} ml`}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium" style={{ color: colors.neutral.textMuted }}>
                          {stockMin > 0 ? stockMin.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          {(() => {
                            const hasBom = !!(sku.bomComponents && sku.bomComponents.length > 0);
                            const effectiveHpp = sku.avgCost ?? sku.hppPrice ?? 0;

                            if (sku.type === 'RAW' && !hasBom) {
                              const formattedHpp =
                                !effectiveHpp || effectiveHpp <= 0
                                  ? 'Rp 0'
                                  : `Rp ${
                                      effectiveHpp % 1 === 0
                                        ? effectiveHpp.toLocaleString('id-ID')
                                        : effectiveHpp.toLocaleString('id-ID', { maximumFractionDigits: 2 })
                                    }`;
                              return (
                                <span
                                  className="text-gray-700 cursor-help"
                                  title={
                                    effectiveHpp > 0
                                      ? "HPP dinamis dari histori pembelian supplier (Weighted Average)"
                                      : "Belum ada histori pembelian supplier (Rp 0)"
                                  }
                                >
                                  {formattedHpp}
                                </span>
                              );
                            }

                            const rawPart = (sku.type === 'RAW' ? effectiveHpp : (sku.rawCost ?? 0));
                            const packagingPart = sku.packagingCost ?? 0;
                            const totalDisplayHpp = sku.type === 'RAW' ? (rawPart + packagingPart) : (sku.estimatedBomHpp || effectiveHpp);
                            const formattedDisplayHpp =
                              !totalDisplayHpp || totalDisplayHpp <= 0
                                ? 'Rp 0'
                                : `Rp ${
                                    totalDisplayHpp % 1 === 0
                                      ? totalDisplayHpp.toLocaleString('id-ID')
                                      : totalDisplayHpp.toLocaleString('id-ID', { maximumFractionDigits: 2 })
                                  }`;

                            const rawTooltip = rawPart > 0 ? `Bahan: Rp ${Math.round(rawPart).toLocaleString('id-ID')}` : 'Bahan: Rp 0';
                            const packTooltip = packagingPart > 0 ? `Kemasan & Safety: Rp ${Math.round(packagingPart).toLocaleString('id-ID')}` : '';
                            const fullTooltip = [rawTooltip, packTooltip].filter(Boolean).join(' + ') || 'BOM Resep';

                            return (
                              <button
                                type="button"
                                onClick={() => setViewingSku(sku)}
                                className="group inline-flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900 cursor-pointer text-right transition-colors"
                                title={`${fullTooltip} - Klik untuk rincian kalkulasi detail`}
                              >
                                <span>{formattedDisplayHpp}</span>
                                <span className="text-[11px] opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all text-blue-600">
                                  ℹ️
                                </span>
                              </button>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm" style={{ color: colors.neutral.textStrong }}>
                          {sku.sellingPrice ? `Rp ${sku.sellingPrice.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {(sku.bomComponents && sku.bomComponents.length > 0) ? (
                            <div className="flex items-center justify-center">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setViewingSku(sku)}
                              >
                                Lihat BOM
                              </Button>
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              className="text-lg hover:opacity-70"
                              onClick={() => setEditingSku(sku)}
                              title="Edit SKU"
                            >
                              ✏️
                            </button>
                            <button 
                              className="text-lg hover:opacity-70"
                              onClick={() => setDeletingSkuId(sku.id)}
                              title="Hapus SKU"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <Pagination
              currentPage={page}
              totalItems={filteredSkus.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="SKU"
            />
          </div>
        </div>

      <AddEditSKUModal
        isOpen={showAddModal || !!editingSku}
        isLoading={isSubmitting}
        initialData={editingSku || undefined}
        onSubmit={editingSku ? handleEditSku : handleAddSku}
        onCancel={() => {
          setShowAddModal(false);
          setEditingSku(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deletingSkuId}
        title="Hapus SKU"
        message="Yakin ingin menghapus SKU ini? Aksi tidak bisa dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        onConfirm={() => deletingSkuId && handleDeleteSku(deletingSkuId)}
        onCancel={() => setDeletingSkuId(null)}
      />

      <BOMDetailModal
        isOpen={!!viewingSku}
        sku={viewingSku}
        onClose={() => setViewingSku(null)}
      />

      <BulkPasteModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => {
          setShowBulkModal(false);
          fetchSkus();
        }}
      />
    </div>
  );
}

function BulkPasteModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const sampleData = `SBN\tSabun Curah 20 Liter\tRAW\t20000\t0\t10
PBG\tParfum Bubblegum 5L\tRAW\t5000\t0\t5
SBN1-PBG\tSabun Bubblegum 1L\tPACKAGE\t1000\t25000\t35
SBN2-PCF\tSabun Kopi 500ml\tPACKAGE\t500\t15000\t50`;

  async function handleImport() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/skus/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ message: data.message, type: 'success' });
        setText('');
        onSuccess();
      } else {
        showToast({ message: data.error, type: 'error' });
      }
    } catch {
      showToast({ message: 'Gagal mengimpor data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-5 max-w-2xl w-full shadow-lg border border-gray-200">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Bulk Paste Master SKU</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tambah banyak data SKU sekaligus dari Excel / Spreadsheet
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors text-base"
          >
            ✕
          </button>
        </div>

        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
          <div className="font-medium text-gray-900 mb-1">Format Kolom (Tab-Separated):</div>
          <div className="font-mono text-[11px] bg-white p-1.5 border border-gray-200 rounded text-gray-800 overflow-x-auto whitespace-nowrap">
            KODE [TAB] NAMA [TAB] TIPE [TAB] UKURAN_ATAU_KUANTITAS [TAB] HARGA_JUAL [TAB] STOK_MIN
          </div>
          <p className="mt-1.5 text-gray-500 text-[11px]">
            Tipe: RAW, PRODUCT, atau PACKAGE. HPP dihitung otomatis oleh sistem dari data mutasi pembelian dan BOM. Baris header diabaikan.
          </p>
        </div>

        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-medium text-gray-700">Tempel Data dari Spreadsheet:</label>
          <button
            type="button"
            onClick={() => setText(sampleData)}
            className="text-xs text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
          >
            Gunakan Contoh Format
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-56 p-2.5 border border-gray-300 rounded text-xs font-mono mb-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={"KODE\tNAMA\tTIPE\tUKURAN_ML\tHARGA_JUAL\tSTOK_MIN\nSBN\tSabun Curah 20 Liter\tRAW\t20000\t0\t10\nSBN1-PBG\tSabun Bubblegum 1L\tPACKAGE\t1000\t25000\t35"}
        />

        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Batal</Button>
          <Button variant="primary" onClick={handleImport} disabled={loading || !text.trim()}>
            {loading ? 'Mengimpor...' : 'Impor Data'}
          </Button>
        </div>
      </div>
    </div>
  );
}
