'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { Button } from '@/components/ui/Button';
import { AddProductionModal } from '@/components/modals/AddProductionModal';
import { BulkProductionModal } from '@/components/modals/BulkProductionModal';
import { ProductionDetailModal } from '@/components/modals/ProductionDetailModal';
import { EditProductionModal } from '@/components/modals/EditProductionModal';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';

interface Production {
  id: string;
  date: string;
  outputQty: number;
  output: {
    sku: {
      id: string;
      code: string;
      name: string;
    }
  };
  inputs: Array<{
    id: string;
    qtyUsed: number;
    inputSku: {
      code: string;
      name: string;
    }
  }>;
  notes: string | null;
}

export default function ProduksiPage() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [editProduction, setEditProduction] = useState<Production | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchProductions();
  }, []);

  async function fetchProductions() {
    try {
      setLoading(true);
      const res = await fetch('/api/productions');
      if (res.ok) {
        const data = await res.json();
        setProductions(data);
      }
    } catch (error) {
      showToast({ message: 'Gagal memuat data produksi', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddProduction(formData: any) {
    try {
      const res = await fetch('/api/productions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal mencatat produksi');
      }

      showToast({ message: 'Produksi berhasil dicatat', type: 'success' });
      setShowAddModal(false);
      fetchProductions();
    } catch (error: any) {
      throw error;
    }
  }

  async function handleEditProduction(id: string, data: { date: string; outputQty: number; notes: string }) {
    try {
      setEditLoading(true);
      const res = await fetch(`/api/productions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal memperbarui produksi');
      }

      showToast({ message: 'Produksi berhasil diperbarui', type: 'success' });
      setEditProduction(null);
      fetchProductions();
    } catch (error: any) {
      throw error;
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteProduction(id: string) {
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/productions/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal menghapus produksi');
      }

      showToast({ message: 'Produksi berhasil dihapus dan stok bahan dikembalikan', type: 'success' });
      setDeleteConfirmId(null);
      fetchProductions();
    } catch (error: any) {
      showToast({ message: error.message || 'Gagal menghapus produksi', type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  }

  const productionToDelete = productions.find((p) => p.id === deleteConfirmId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Produksi RAW → PRODUCT"
        subtitle="Konversi bahan baku menjadi produk jadi berdasarkan BOM. HPP dihitung otomatis (Weighted Average)."
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" icon="📋" onClick={() => setShowBulkModal(true)}>
              Bulk Paste
            </Button>
            <Button variant="primary" icon="📄" onClick={() => setShowAddModal(true)}>
              Produksi Baru
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div
          className="rounded-lg border bg-white overflow-hidden shadow-sm"
          style={{ borderColor: colors.neutral.border }}
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b" style={{ borderColor: colors.neutral.border }}>
              <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
                <th className="px-6 py-4">TANGGAL</th>
                <th className="px-6 py-4">OUTPUT SKU</th>
                <th className="px-6 py-4">NAMA</th>
                <th className="px-6 py-4 text-center">QTY OUTPUT</th>
                <th className="px-6 py-4">CATATAN</th>
                <th className="px-6 py-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading data...</td>
                </tr>
              ) : productions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-32 text-center">
                    <p style={{ color: '#B45309' }} className="font-medium text-lg">
                      Belum ada produksi.
                    </p>
                  </td>
                </tr>
              ) : (
                productions.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">{new Date(p.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 font-bold">{p.output.sku.code}</td>
                    <td className="px-6 py-4">{p.output.sku.name}</td>
                    <td className="px-6 py-4 text-center font-medium">{p.outputQty.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs italic">{p.notes || '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedProduction(p)}
                        >
                          Detail
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditProduction(p)}
                        >
                          ✏️ Edit
                        </Button>
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="px-3 py-1.5 rounded text-xs font-semibold border transition-colors text-red-600 border-red-200 hover:bg-red-50 hover:border-red-400"
                          title="Hapus sesi produksi"
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Production Modal */}
      <AddProductionModal
        isOpen={showAddModal}
        onSubmit={handleAddProduction}
        onCancel={() => setShowAddModal(false)}
      />

      {/* Bulk Paste Modal */}
      <BulkProductionModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => {
          setShowBulkModal(false);
          fetchProductions();
        }}
      />

      {/* Detail Modal */}
      <ProductionDetailModal
        isOpen={!!selectedProduction}
        production={selectedProduction}
        onClose={() => setSelectedProduction(null)}
      />

      {/* Edit Modal */}
      <EditProductionModal
        isOpen={!!editProduction}
        production={editProduction}
        isLoading={editLoading}
        onSubmit={handleEditProduction}
        onCancel={() => setEditProduction(null)}
      />

      {/* Delete Confirm Dialog */}
      {deleteConfirmId && productionToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            style={{ backgroundColor: colors.neutral.card }}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xl">
                🗑️
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Hapus Sesi Produksi?</h3>
                <p className="text-sm text-gray-600 mb-1">
                  Anda akan menghapus sesi produksi berikut:
                </p>
                <div className="p-3 rounded border bg-gray-50 text-sm mb-3" style={{ borderColor: colors.neutral.border }}>
                  <p className="font-bold text-gray-800">{productionToDelete.output.sku.name}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(productionToDelete.date).toLocaleDateString('id-ID')} &bull;{' '}
                    Qty: {productionToDelete.outputQty.toLocaleString('id-ID')} unit
                  </p>
                </div>
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                  ⚠️ Seluruh stok bahan baku yang dikonsumsi akan dikembalikan, dan stok output akan dikurangi. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-5">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteLoading}
              >
                Batal
              </Button>
              <button
                onClick={() => handleDeleteProduction(deleteConfirmId)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Produksi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
