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
  type: 'RAW' | 'WIP' | 'PACKAGE';
  sellingPrice?: number;
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
  }, [filter]);

  async function fetchSkus() {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/api/skus' 
        : `/api/skus?type=${filter}`;
      const res = await fetch(url);
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

  const filteredSkus = skus.filter(sku =>
    sku.code.toLowerCase().includes(search.toLowerCase()) ||
    sku.name.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    all: skus.length,
    RAW: skus.filter(s => s.type === 'RAW').length,
    WIP: skus.filter(s => s.type === 'WIP').length,
    PACKAGE: skus.filter(s => s.type === 'PACKAGE').length,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Master SKU"
        subtitle="Kelola daftar produk RAW, WIP, dan PACKAGE beserta BOM"
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
            {(['all', 'RAW', 'WIP', 'PACKAGE'] as const).map((tab) => (
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
                {tab === 'all' ? 'Semua' : tab} ({counts[tab === 'all' ? 'all' : tab]})
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
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>HARGA JUAL</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>BOM</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide" style={{ color: colors.neutral.textMuted }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSkus.map((sku) => (
                    <tr key={sku.id} style={{ borderBottomColor: colors.neutral.border, borderBottomWidth: '1px' }}>
                      <td className="px-6 py-4 text-sm" style={{ color: colors.neutral.textStrong }}>{sku.code}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: colors.neutral.textStrong }}>{sku.name}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge type={sku.type}>{sku.type}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-sm" style={{ color: colors.neutral.textStrong }}>
                        {sku.type === 'PACKAGE' && sku.sellingPrice ? `Rp ${sku.sellingPrice.toLocaleString('id-ID')}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(sku.type === 'WIP' || sku.type === 'PACKAGE') && (
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
                        >
                          ✏️
                        </button>
                        <button 
                          className="text-lg hover:opacity-70"
                          onClick={() => setDeletingSkuId(sku.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
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
          Format: <code>KODE [TAB] NAMA [TAB] TIPE (RAW/WIP/PACKAGE) [TAB] HARGA</code>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">BOM: {sku.code}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{sku.name}</p>

        <div className="border rounded divide-y">
          {sku.bomComponents?.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400 italic">Tidak ada komponen</div>
          ) : (
            sku.bomComponents?.map((comp: any) => (
              <div key={comp.id} className="p-3 flex justify-between text-sm">
                <span>{comp.child?.name || 'Unknown'}</span>
                <span className="font-bold">{comp.quantity} unit</span>
              </div>
            ))
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </div>
  );
}
