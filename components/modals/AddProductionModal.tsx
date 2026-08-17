'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

interface AddProductionModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function AddProductionModal({
  isOpen,
  isLoading = false,
  onSubmit,
  onCancel,
}: AddProductionModalProps) {
  const [skus, setSkus] = useState<any[]>([]);
  const [selectedSku, setSelectedSku] = useState<any>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    outputSkuId: '',
    outputQty: 0,
    notes: '',
  });
  const [error, setError] = useState('');
  const [componentStatus, setComponentStatus] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchSkus();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        outputSkuId: '',
        outputQty: 0,
        notes: '',
      });
      setSelectedSku(null);
      setComponentStatus([]);
    }
  }, [isOpen]);

  async function fetchSkus() {
    try {
      // Fetch WIP and PACKAGE skus (which have BOM)
      const res = await fetch('/api/skus');
      if (res.ok) {
        const data = await res.json();
        setSkus(data.filter((s: any) => s.type !== 'RAW'));
      }
    } catch (err) {
      console.error('Failed to fetch SKUs:', err);
    }
  }

  useEffect(() => {
    if (formData.outputSkuId) {
      const sku = skus.find(s => s.id === formData.outputSkuId);
      setSelectedSku(sku);
      updateComponentStatus(sku, formData.outputQty);
    } else {
      setSelectedSku(null);
      setComponentStatus([]);
    }
  }, [formData.outputSkuId, formData.outputQty, skus]);

  async function updateComponentStatus(sku: any, qty: number) {
    if (!sku || !sku.bomComponents) return;

    try {
      const status = [];
      for (const bom of sku.bomComponents) {
        // Fetch SKU with its cost history (which contains current stock)
        const res = await fetch(`/api/skus/${bom.childId}`);
        const skuDetail = await res.json();

        // In our current API, /api/skus/[id] might not return cost history stock directly.
        // Let's check the API implementation.
        const available = skuDetail.stock ?? 0; // We need to ensure the API provides this

        status.push({
          name: bom.child.name,
          needed: bom.quantity * qty,
          available: available,
          isEnough: available >= (bom.quantity * qty)
        });
      }
      setComponentStatus(status);
    } catch (err) {
      console.error('Error updating component status:', err);
    }
  }

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.outputSkuId || formData.outputQty <= 0) {
      setError('Harap isi SKU Output dan Qty dengan benar');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan produksi');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="rounded-lg p-6 w-full mx-4 shadow-xl flex flex-col max-h-[90vh]"
        style={{ backgroundColor: colors.neutral.card, maxWidth: '800px' }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: colors.neutral.textStrong }}>
          Catat Produksi Baru
        </h2>

        <form onSubmit={handleSubmit} className="flex gap-6 overflow-hidden">
          {/* Left Side: Form */}
          <div className="flex-1 space-y-4">
            {error && (
              <div className="p-3 rounded text-sm text-white" style={{ backgroundColor: colors.semantic.red }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Tanggal Produksi
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded border text-sm"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Output SKU (WIP / PACKAGE)
              </label>
              <select
                value={formData.outputSkuId}
                onChange={(e) => setFormData({ ...formData, outputSkuId: e.target.value })}
                className="w-full px-3 py-2 rounded border text-sm bg-white"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
              >
                <option value="">Pilih SKU...</option>
                {skus.map(sku => (
                  <option key={sku.id} value={sku.id}>{sku.code} - {sku.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Qty Output
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.outputQty || ''}
                onChange={(e) => setFormData({ ...formData, outputQty: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded border text-sm"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Catatan
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 rounded border text-sm h-24"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
                placeholder="Opsional..."
              />
            </div>

            <div className="pt-4 flex gap-3 justify-end">
              <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
                Batal
              </Button>
              <Button variant="primary" type="submit" disabled={isLoading} style={{ minWidth: '120px' }}>
                {isLoading ? 'Menyimpan...' : 'Simpan Produksi'}
              </Button>
            </div>
          </div>

          {/* Right Side: BOM Preview & Validation */}
          <div className="w-80 border-l pl-6 flex flex-col" style={{ borderColor: colors.neutral.border }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: colors.neutral.textMuted }}>
              Estimasi Penggunaan Komponen
            </h3>

            <div className="flex-1 overflow-auto space-y-3">
              {!selectedSku ? (
                <p className="text-sm text-gray-400 italic text-center py-10">Pilih SKU untuk melihat BOM</p>
              ) : selectedSku.bomComponents?.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-10">SKU ini belum memiliki resep (BOM)</p>
              ) : (
                selectedSku.bomComponents.map((bom: any) => {
                  const needed = bom.quantity * formData.outputQty;
                  return (
                    <div key={bom.id} className="p-3 rounded border text-sm" style={{ borderColor: colors.neutral.border }}>
                      <div className="font-bold mb-1 truncate">{bom.child.name}</div>
                      <div className="flex justify-between text-[11px] text-gray-500">
                        <span>Butuh: {needed.toLocaleString('id-ID')}</span>
                        <span className="font-medium" style={{ color: colors.brand[500] }}>
                          {bom.quantity} / unit
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {selectedSku && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.neutral.border }}>
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Status Ketersediaan</div>
                <div className="text-xs italic text-gray-500">Sistem akan memvalidasi stok saat tombol Simpan diklik.</div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
