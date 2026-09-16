'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { Button, Badge } from '@/components/ui/Button';
import { AddEditSKUModal } from '@/components/modals/AddEditSKUModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';

interface SKU {
  id: string;
  code: string;
  name: string;
  type: 'RAW' | 'PRODUCT' | 'PACKAGE';
  hppPrice?: number;
  sellingPrice?: number;
  stock?: number;
  stockMin?: number | null;
  bomComponents?: any[];
}

export default function MasterSKUPage() {
  const [skus, setSkus] = useState<SKU[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
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
            {(['all', 'RAW', 'PRODUCT', 'PACKAGE'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className="px-4 py-2 rounded text-sm font-medium transition-all"
                style={{
                  backgroundColor: filter === tab ? colors.neutral.card : 'transparent',
                  color: filter === tab ? colors.neutral.textStrong : colors.neutral.textMuted,
                  boxShadow: filter === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {tab === 'all' ? 'Semua' : (tab === 'PRODUCT' ? 'Product' : tab)} ({counts[tab === 'all' ? 'all' : tab]})
              </button>
            ))}
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
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>STOK MIN</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>HARGA HPP</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>HARGA JUAL</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>BOM</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSkus.map((sku) => {
                    const stockMin = sku.stockMin ?? 0;

                    return (
                      <tr key={sku.id} style={{ borderBottomColor: colors.neutral.border, borderBottomWidth: '1px' }}>
                        <td className="px-6 py-4 text-sm font-medium" style={{ color: colors.neutral.textStrong }}>{sku.code}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: colors.neutral.textStrong }}>{sku.name}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge type={sku.type}>{sku.type === 'PRODUCT' ? 'PRODUCT' : sku.type}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium" style={{ color: colors.neutral.textMuted }}>
                          {stockMin > 0 ? stockMin.toLocaleString('id-ID') : '—'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm" style={{ color: colors.neutral.textStrong }}>
                          {sku.hppPrice ? `Rp ${sku.hppPrice.toLocaleString('id-ID')}` : 'Rp 0'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm" style={{ color: colors.neutral.textStrong }}>
                          {sku.type === 'PACKAGE' && sku.sellingPrice ? `Rp ${sku.sellingPrice.toLocaleString('id-ID')}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {(sku.type === 'PRODUCT' || sku.type === 'PACKAGE') && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setViewingSku(sku)}
                            >
                              Lihat BOM
                            </Button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right flex gap-2 justify-end">
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
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

      <BOMViewModal
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

  if (!isOpen) return null;

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
    } catch (err) {
      showToast({ message: 'Gagal mengimpor data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl">
        <h3 className="text-lg font-bold mb-2">Bulk Paste SKU</h3>
        <p className="text-xs text-gray-500 mb-4">
          Format: <code>KODE [TAB] NAMA [TAB] TIPE (RAW/PRODUCT/PACKAGE) [TAB] HARGA</code>
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-64 p-3 border rounded text-sm font-mono mb-4"
          placeholder="Paste dari Excel di sini..."
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Batal</Button>
          <Button variant="primary" onClick={handleImport} disabled={loading}>
            {loading ? 'Mengimpor...' : 'Impor Sekarang'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BOMViewModal({ isOpen, sku, onClose }: { isOpen: boolean, sku: SKU | null, onClose: () => void }) {
  if (!isOpen || !sku) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl mx-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">BOM: {sku.code}</h3>
            <p className="text-sm text-gray-500">{sku.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>

        <div className="border rounded-lg overflow-hidden divide-y divide-gray-100">
          {sku.bomComponents?.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400 italic">Tidak ada komponen resep</div>
          ) : (
            (['RAW', 'PACKING', 'STIKER', 'SAFETY', 'DUS'] as const).map(cat => {
              const comps = sku.bomComponents?.filter((c: any) => c.category === cat);
              if (!comps || comps.length === 0) return null;
              
              return (
                <div key={cat} className="bg-white">
                  <div className="bg-gray-50 px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b">
                    {cat}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[10px] text-gray-400 uppercase font-bold">
                        <th className="px-4 py-2">Kode</th>
                        <th className="px-4 py-2">Nama</th>
                        <th className="px-4 py-2 text-right">Qty/Unit</th>
                        <th className="px-4 py-2 text-center">Tipe Konsumsi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {comps.map((comp: any) => {
                        const item = comp.childSku || comp.childKemasan;
                        return (
                          <tr key={comp.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">{item?.code}</td>
                            <td className="px-4 py-3 text-gray-600">{item?.name}</td>
                            <td className="px-4 py-3 text-right font-bold">
                              {cat === 'RAW' ? (
                                <div>
                                  <span>{comp.quantity} unit</span>
                                  {item?.productSize ? (
                                    <span className="block text-[10px] text-gray-500 font-normal">
                                      (~{(comp.quantity * item.productSize >= 1000)
                                        ? `${((comp.quantity * item.productSize) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} L`
                                        : `${Math.round(comp.quantity * item.productSize).toLocaleString('id-ID')} ml`})
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                <span>{comp.quantity} <span className="text-[10px] text-gray-400 font-medium uppercase">pcs</span></span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                comp.consumptionType === 'MANUAL' 
                                  ? 'bg-orange-100 text-orange-600' 
                                  : 'bg-blue-100 text-blue-600'
                              }`}>
                                {comp.consumptionType || 'AUTOMATIC'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
        </div>
        
        <div className="mt-8 pt-6 border-t flex justify-end">
          <Button variant="primary" onClick={onClose} style={{ minWidth: '120px' }}>Tutup</Button>
        </div>
      </div>
    </div>
  );
}
