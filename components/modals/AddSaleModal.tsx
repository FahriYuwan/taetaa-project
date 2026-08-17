'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

interface AddSaleModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function AddSaleModal({
  isOpen,
  isLoading = false,
  onSubmit,
  onCancel,
}: AddSaleModalProps) {
  const [skus, setSkus] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    channel: 'SHOPEE',
    orderId: '',
    skuId: '',
    qty: 0,
    unitPrice: 0,
    fee: 0,
    notes: '',
  });
  const [selectedSku, setSelectedSku] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSkus();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        channel: 'SHOPEE',
        orderId: '',
        skuId: '',
        qty: 0,
        unitPrice: 0,
        fee: 0,
        notes: '',
      });
      setSelectedSku(null);
    }
  }, [isOpen]);

  async function fetchSkus() {
    try {
      const res = await fetch('/api/skus?type=PACKAGE');
      if (res.ok) {
        const data = await res.json();
        setSkus(data);
      }
    } catch (err) {
      console.error('Failed to fetch SKUs:', err);
    }
  }

  useEffect(() => {
    if (formData.skuId) {
      const sku = skus.find(s => s.id === formData.skuId);
      setSelectedSku(sku);
      if (sku && !formData.unitPrice) {
        setFormData(prev => ({ ...prev, unitPrice: sku.sellingPrice || 0 }));
      }
    } else {
      setSelectedSku(null);
    }
  }, [formData.skuId, skus]);

  if (!isOpen) return null;

  const gross = formData.qty * formData.unitPrice;
  const netRevenue = gross - formData.fee;

  // Note: We don't have current avgCost in the SKU list easily without another fetch or update to the API
  // In a real app, I'd include it in the SKU data.
  // For UI preview, let's assume it's there or just show revenue.

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.skuId || formData.qty <= 0 || formData.unitPrice <= 0) {
      setError('Harap isi SKU, Qty, dan Harga dengan benar');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan penjualan');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl flex flex-col max-h-[95vh]"
        style={{ backgroundColor: colors.neutral.card }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: colors.neutral.textStrong }}>
          Catat Penjualan Baru
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 overflow-auto pr-2">
          {/* Left Column */}
          <div className="space-y-4">
            {error && (
              <div className="p-3 rounded text-sm text-white col-span-2" style={{ backgroundColor: colors.semantic.red }}>
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
                Channel / Marketplace
              </label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                className="w-full px-3 py-2 rounded border text-sm bg-white"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
              >
                <option value="SHOPEE">Shopee</option>
                <option value="TIKTOK">TikTok Shop</option>
                <option value="OFFLINE">Offline / Toko</option>
                <option value="AFFILIATE">Affiliate</option>
              </select>
            </div>

            {formData.channel !== 'OFFLINE' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Order ID
                </label>
                <input
                  type="text"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{ borderColor: colors.neutral.border }}
                  disabled={isLoading}
                  placeholder="Contoh: ID2405001..."
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Pilih Produk (PACKAGE)
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
                  Qty Terjual
                </label>
                <input
                  type="number"
                  value={formData.qty || ''}
                  onChange={(e) => setFormData({ ...formData, qty: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{ borderColor: colors.neutral.border }}
                  disabled={isLoading}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Harga Jual (Rp)
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
          </div>

          {/* Right Column: Calculations & Summary */}
          <div className="space-y-4 border-l pl-6" style={{ borderColor: colors.neutral.border }}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Biaya / Potongan (Rp)
              </label>
              <input
                type="number"
                value={formData.fee || ''}
                onChange={(e) => setFormData({ ...formData, fee: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded border text-sm"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
                placeholder="Fee, Admin, Ongkir, dsb"
              />
            </div>

            <div className="mt-6 space-y-3 p-4 rounded-lg bg-gray-50 border border-dashed" style={{ borderColor: colors.neutral.border }}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-bold uppercase">Gross Revenue</span>
                <span className="font-bold">Rp {gross.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-bold uppercase">Total Biaya</span>
                <span className="text-red-500">- Rp {formData.fee.toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-2 border-t flex justify-between items-center" style={{ borderColor: colors.neutral.border }}>
                <span className="text-sm font-bold uppercase text-gray-700">Net Revenue</span>
                <span className="text-xl font-bold" style={{ color: colors.brand[500] }}>
                  Rp {netRevenue.toLocaleString('id-ID')}
                </span>
              </div>
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
                {isLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
