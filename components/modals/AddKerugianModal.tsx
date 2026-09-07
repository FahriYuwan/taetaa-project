'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

interface AddKerugianModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function AddKerugianModal({
  isOpen,
  isLoading = false,
  onSubmit,
  onCancel,
}: AddKerugianModalProps) {
  const [skus, setSkus] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    skuId: '',
    qty: 0,
    unitPrice: 0,
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSkus();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        skuId: '', //Pilihan
        qty: 0, // Jumlah barang yang dikurangi
        unitPrice: 0, // Harga satuan yang dikurangi mengambil dari SKUCostHistory
        notes: '', // Keterangan benda yang dikurangi
      });
    }
  }, [isOpen]);

  async function fetchSkus() {
    try {
      const res = await fetch('/api/skus');
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

    if (!formData.skuId) {
      setError('Harap isi SKU dengan benar');
      return;
    }
    if (formData.qty <= 0) {
      setError('Harap isi jumlah benda yang dikurangi');
      return;
    }
    if (!formData.notes) {
      setError('Harap isi catatan benda yang dikurangi');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan laporan kerugian. Harap coba lagi.');
    }
  }

  //Fungsi untuk mengambil harga satuan dari SKUCostHistory
  const handleSkuChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSkuId = e.target.value;

    // 1. Update skuId dulu agar UI tidak lag
    setFormData(prev => ({ ...prev, skuId: selectedSkuId }));

    if (selectedSkuId) {
      try {
        // 2. Fetch detail SKU untuk mendapatkan avgCost (HPP)
        const res = await fetch(`/api/skus/${selectedSkuId}`);
        if (res.ok) {
          const skuData = await res.json();

          // 3. Masukkan avgCost ke dalam unitPrice secara otomatis
          setFormData(prev => ({
            ...prev,
            unitPrice: skuData.avgCost || 0
          }));
        }
      } catch (err) {
        console.error("Gagal mengambil HPP SKU:", err);
      }
    } else {
      // Reset harga jika SKU dikosongkan
      setFormData(prev => ({ ...prev, unitPrice: 0 }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        style={{ backgroundColor: colors.neutral.card }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: colors.neutral.textStrong }}>
          Catat Kerugian Barang
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
              Pilih Barang
            </label>
            <select
              value={formData.skuId}
              onChange={handleSkuChange}
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
                Jumlah Kerugian
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
                className="w-full px-3 py-2 rounded border text-sm bg-gray-100 cursor-not-allowed" // Tambah bg-gray agar terlihat terkunci
                style={{ borderColor: colors.neutral.border }}
                readOnly
                placeholder="0"
              />
            </div>
          </div>

          <div className="p-3 rounded bg-gray-50 border border-dashed flex justify-between items-center" style={{ borderColor: colors.neutral.border }}>
            <span className="text-xs font-bold uppercase text-gray-500">Total Kerugian</span>
            <span className="text-lg font-bold" style={{ color: colors.semantic.red }}>
              Rp -{total.toLocaleString('id-ID')}
            </span>
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
              required
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
