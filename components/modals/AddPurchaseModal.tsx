'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

interface AddPurchaseModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function AddPurchaseModal({
  isOpen,
  isLoading = false,
  onSubmit,
  onCancel,
}: AddPurchaseModalProps) {
  const [skus, setSkus] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    skuId: '',
    qty: 0,
    unitPrice: 0,
    supplier: '',
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSkus();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        skuId: '',
        qty: 0,
        unitPrice: 0,
        supplier: '',
        notes: '',
      });
    }
  }, [isOpen]);

  async function fetchSkus() {
    try {
      const res = await fetch('/api/skus?type=RAW');
      if (res.ok) {
        const data = await res.json();
        setSkus(data);
      }
    } catch (err) {
      console.error('Failed to fetch SKUs:', err);
    }
  }

  if (!isOpen) return null;

  const total = formData.qty * formData.unitPrice;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.skuId || formData.qty <= 0 || formData.unitPrice <= 0) {
      setError('Harap isi SKU, Qty, dan Harga Satuan dengan benar');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pembelian');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        style={{ backgroundColor: colors.neutral.card }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: colors.neutral.textStrong }}>
          Catat Pembelian RAW
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded text-sm text-white" style={{ backgroundColor: colors.semantic.red }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
              Tanggal
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
              Pilih Bahan Baku (RAW)
            </label>
            <select
              value={formData.skuId}
              onChange={(e) => setFormData({ ...formData, skuId: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Qty
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.qty || ''}
                onChange={(e) => setFormData({ ...formData, qty: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded border text-sm"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Harga Satuan (Rp)
              </label>
              <input
                type="number"
                value={formData.unitPrice || ''}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded border text-sm"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
                placeholder="0"
              />
            </div>
          </div>

          <div className="p-3 rounded bg-gray-50 border border-dashed flex justify-between items-center" style={{ borderColor: colors.neutral.border }}>
            <span className="text-xs font-bold uppercase text-gray-500">Total Pembelian</span>
            <span className="text-lg font-bold" style={{ color: colors.brand[500] }}>
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
              Supplier
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-3 py-2 rounded border text-sm"
              style={{ borderColor: colors.neutral.border }}
              disabled={isLoading}
              placeholder="Nama Toko / Distributor"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
              Catatan
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded border text-sm h-20"
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
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
