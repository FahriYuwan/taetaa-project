'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { Button } from '@/components/ui/Button';
import { AddProductionModal } from '@/components/modals/AddProductionModal';
import { BulkProductionModal } from '@/components/modals/BulkProductionModal';
import { ProductionDetailModal } from '@/components/modals/ProductionDetailModal';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';

interface Production {
  id: string;
  date: string;
  outputQty: number;
  output: {
    sku: {
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Produksi RAW → WIP"
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
                <th className="px-6 py-4 text-right">AKSI</th>
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
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedProduction(p)}
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddProductionModal
        isOpen={showAddModal}
        onSubmit={handleAddProduction}
        onCancel={() => setShowAddModal(false)}
      />

      <BulkProductionModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => {
          setShowBulkModal(false);
          fetchProductions();
        }}
      />

      <ProductionDetailModal
        isOpen={!!selectedProduction}
        production={selectedProduction}
        onClose={() => setSelectedProduction(null)}
      />
    </div>
  );
}
