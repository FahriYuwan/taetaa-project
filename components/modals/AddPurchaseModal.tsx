'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';

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
  const [itemType, setItemType] = useState<'RAW' | 'KEMASAN'>('RAW');
  const [skus, setSkus] = useState<any[]>([]);
  const [kemasans, setKemasans] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    skuId: '',
    kemasanId: '',
    qty: 0,
    unitPrice: 0,
    supplier: '',
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        skuId: '',
        kemasanId: '',
        qty: 0,
        unitPrice: 0,
        supplier: '',
        notes: '',
      });
      setError('');

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
          onCancel();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isLoading, onCancel]);

  async function fetchItems() {
    try {
      const [skuRes, kemasanRes] = await Promise.all([
        fetch('/api/skus?type=RAW'),
        fetch('/api/kemasan'),
      ]);
      if (skuRes.ok) {
        const skuData = await skuRes.json();
        setSkus(skuData);
      }
      if (kemasanRes.ok) {
        const kemasanData = await kemasanRes.json();
        setKemasans(kemasanData);
      }
    } catch (err) {
      console.error('Failed to fetch purchase items:', err);
    }
  }

  if (!isOpen) return null;

  const total = formData.qty * formData.unitPrice;

  const selectedItem = itemType === 'RAW'
    ? skus.find(s => s.id === formData.skuId)
    : kemasans.find(k => k.id === formData.kemasanId);

  // Estimasi HPP baru
  const currentStock = Math.max(0, selectedItem?.stock || 0);
  const currentAvgCost = selectedItem?.avgCost ?? selectedItem?.hppPrice ?? 0;
  const estimatedNewHpp = formData.qty > 0 && formData.unitPrice > 0
    ? ((currentStock * currentAvgCost) + (formData.qty * formData.unitPrice)) / (currentStock + formData.qty)
    : currentAvgCost;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (itemType === 'RAW' && !formData.skuId) {
      setError('Harap pilih bahan baku (SKU RAW)');
      return;
    }
    if (itemType === 'KEMASAN' && !formData.kemasanId) {
      setError('Harap pilih item kemasan');
      return;
    }
    if (formData.qty <= 0 || formData.unitPrice <= 0) {
      setError('Jumlah (Qty) dan Harga Satuan harus lebih besar dari 0');
      return;
    }

    try {
      await onSubmit({
        date: formData.date,
        skuId: itemType === 'RAW' ? formData.skuId : null,
        kemasanId: itemType === 'KEMASAN' ? formData.kemasanId : null,
        qty: formData.qty,
        unitPrice: formData.unitPrice,
        supplier: formData.supplier || null,
        notes: formData.notes || null,
      });
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pembelian');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-6">
      <div
        className="rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl"
        style={{ backgroundColor: colors.neutral.card }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: colors.neutral.textStrong }}>
          Catat Pembelian Bahan & Kemasan
        </h2>

        {/* Segmented Tab: RAW vs KEMASAN */}
        <div className="flex border rounded-lg p-1 mb-4 bg-gray-50" style={{ borderColor: colors.neutral.border }}>
          <button
            type="button"
            onClick={() => {
              setItemType('RAW');
              setFormData({ ...formData, kemasanId: '' });
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
              itemType === 'RAW'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Bahan Mentah (RAW)
          </button>
          <button
            type="button"
            onClick={() => {
              setItemType('KEMASAN');
              setFormData({ ...formData, skuId: '' });
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
              itemType === 'KEMASAN'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Kemasan (Botol, Stiker, Dus, Safety)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded text-sm text-white" style={{ backgroundColor: colors.semantic.red }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
              Tanggal Nota / Masuk
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
              {itemType === 'RAW' ? 'Pilih Bahan Baku (RAW)' : 'Pilih Item Kemasan'}
            </label>
            {itemType === 'RAW' ? (
              <select
                value={formData.skuId}
                onChange={(e) => setFormData({ ...formData, skuId: e.target.value })}
                className="w-full px-3 py-2 rounded border text-sm bg-white"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
              >
                <option value="">Pilih SKU Bahan Mentah...</option>
                {skus.map(sku => (
                  <option key={sku.id} value={sku.id}>{sku.code} - {sku.name}</option>
                ))}
              </select>
            ) : (
              <select
                value={formData.kemasanId}
                onChange={(e) => setFormData({ ...formData, kemasanId: e.target.value })}
                className="w-full px-3 py-2 rounded border text-sm bg-white"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
              >
                <option value="">Pilih Item Kemasan...</option>
                {kemasans.map(item => (
                  <option key={item.id} value={item.id}>
                    [{item.category}] {item.code} - {item.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Qty Beli
              </label>
              <NumberInput
                value={formData.qty}
                onChange={(val) => setFormData({ ...formData, qty: val })}
                allowDecimal={itemType === 'RAW'}
                className="border bg-white"
                style={{ borderColor: colors.neutral.border } as any}
                disabled={isLoading}
                placeholder="0"
                showPreview
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Harga Satuan Nota
              </label>
              <NumberInput
                value={formData.unitPrice}
                onChange={(val) => setFormData({ ...formData, unitPrice: val })}
                prefix="Rp "
                className="border bg-white font-bold"
                style={{ borderColor: colors.neutral.border } as any}
                disabled={isLoading}
                placeholder="0"
                showPreview
              />
            </div>
          </div>

          {/* Live Preview: Total & Kalkulasi Weighted Average */}
          <div className="p-3 rounded bg-gray-50 border space-y-2" style={{ borderColor: colors.neutral.border }}>
            <div className="flex justify-between items-center text-sm">
              <span className="text-xs font-bold uppercase text-gray-500">Total Pembelian</span>
              <span className="text-base font-bold" style={{ color: colors.brand[500] }}>
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>

            {selectedItem && formData.qty > 0 && formData.unitPrice > 0 && (
              <div className="pt-2 border-t border-gray-200 text-xs text-gray-600 flex justify-between items-center">
                <span>HPP Rata-rata Baru (Weighted Avg):</span>
                <span className="font-bold text-gray-900">
                  Rp {Math.round(estimatedNewHpp).toLocaleString('id-ID')}
                  <span className="text-[10px] text-gray-400 font-normal ml-1">
                    (dari Rp {Math.round(currentAvgCost).toLocaleString('id-ID')})
                  </span>
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
              Supplier / Toko
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-3 py-2 rounded border text-sm"
              style={{ borderColor: colors.neutral.border }}
              disabled={isLoading}
              placeholder="Contoh: Toko Botol Plastik Jaya"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
              Catatan
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded border text-sm h-16"
              style={{ borderColor: colors.neutral.border }}
              disabled={isLoading}
              placeholder="Nomor invoice, batch, atau catatan lainnya..."
            />
          </div>

          <div className="pt-2 flex gap-3 justify-end">
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
