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
    voucher: 0,
    discount: 0,
    platformFee: 0,
    shippingFee: 0,
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
        voucher: 0,
        discount: 0,
        platformFee: 0,
        shippingFee: 0,
        notes: '',
      });
      setSelectedSku(null);
      setError('');
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
      const sku = skus.find((s) => s.id === formData.skuId);
      setSelectedSku(sku);
      if (sku && !formData.unitPrice) {
        setFormData((prev) => ({ ...prev, unitPrice: sku.sellingPrice || 0 }));
      }
    } else {
      setSelectedSku(null);
    }
  }, [formData.skuId, skus]);

  if (!isOpen) return null;

  const gross = formData.qty * formData.unitPrice;
  const voucher = formData.voucher || 0;
  const discount = formData.discount || 0;
  const platformFee = formData.platformFee || 0;
  const shippingFee = formData.shippingFee || 0;
  const totalDeductions = voucher + discount + platformFee + shippingFee;
  const omset = gross - totalDeductions;
  const avgCost = selectedSku?.avgCost ?? selectedSku?.hppPrice ?? 0;
  const hppTotal = formData.qty * avgCost;
  const laba = omset - hppTotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.skuId || formData.qty <= 0 || !formData.channel) {
      setError('Harap isi SKU, Qty, dan Channel dengan benar');
      return;
    }

    if (selectedSku && selectedSku.stock !== undefined && formData.qty > selectedSku.stock) {
      setError(`Stok tidak cukup (Tersedia: ${selectedSku.stock}, Diminta: ${formData.qty})`);
      return;
    }

    try {
      await onSubmit({
        ...formData,
        fee: platformFee + shippingFee,
      });
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan penjualan');
    }
  }

  const inputClass = 'w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl flex flex-col max-h-[95vh]"
        style={{ backgroundColor: colors.neutral.card }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: colors.neutral.textStrong }}>
          Catat Penjualan Manual
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 overflow-auto pr-1">
          {/* Left Column */}
          <div className="space-y-3">
            {error && (
              <div className="p-3 rounded text-sm text-white col-span-2" style={{ backgroundColor: colors.semantic.red }}>
                {error}
              </div>
            )}

            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Tanggal
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={inputClass}
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
              />
            </div>

            {/* Channel */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Channel / Marketplace
              </label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                className={`${inputClass} bg-white`}
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
              >
                <option value="SHOPEE">Shopee</option>
                <option value="TIKTOK">TikTok Shop</option>
                <option value="TOKOPEDIA">Tokopedia</option>
                <option value="OFFLINE">Offline / Toko</option>
                <option value="AFFILIATE">Affiliate</option>
              </select>
            </div>

            {/* Order ID */}
            {formData.channel !== 'OFFLINE' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Order ID / No. Resi
                </label>
                <input
                  type="text"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  className={inputClass}
                  style={{ borderColor: colors.neutral.border }}
                  disabled={isLoading}
                  placeholder="Contoh: 260801733136US"
                />
              </div>
            )}

            {/* SKU */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Pilih Produk (PACKAGE)
              </label>
              <select
                value={formData.skuId}
                onChange={(e) => setFormData({ ...formData, skuId: e.target.value })}
                className={`${inputClass} bg-white`}
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
              >
                <option value="">Pilih SKU...</option>
                {skus.map((sku) => (
                  <option key={sku.id} value={sku.id}>
                    {sku.code} - {sku.name}
                  </option>
                ))}
              </select>
              {selectedSku && (
                <div className="text-[11px] mt-1 flex justify-between px-1">
                  <span className="text-gray-500">
                    Stok:{' '}
                    <strong className={(selectedSku.stock ?? 0) < (formData.qty || 1) ? 'text-red-500' : 'text-green-600'}>
                      {(selectedSku.stock ?? 0).toLocaleString('id-ID')} unit
                    </strong>
                  </span>
                  <span className="text-gray-500">
                    HPP: <strong>Rp {avgCost.toLocaleString('id-ID')}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Qty & Harga */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Qty
                </label>
                <input
                  type="number"
                  value={formData.qty || ''}
                  onChange={(e) => setFormData({ ...formData, qty: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                  style={{ borderColor: colors.neutral.border }}
                  disabled={isLoading}
                  placeholder="0"
                  min={1}
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
                  className={inputClass}
                  style={{ borderColor: colors.neutral.border }}
                  disabled={isLoading}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3 border-l pl-5" style={{ borderColor: colors.neutral.border }}>
            {/* Potongan */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Voucher (Rp)
                </label>
                <input
                  type="number"
                  value={formData.voucher || ''}
                  onChange={(e) => setFormData({ ...formData, voucher: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                  style={{ borderColor: colors.neutral.border }}
                  disabled={isLoading}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Diskon (Rp)
                </label>
                <input
                  type="number"
                  value={formData.discount || ''}
                  onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                  style={{ borderColor: colors.neutral.border }}
                  disabled={isLoading}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Platform Fee (Rp)
                </label>
                <input
                  type="number"
                  value={formData.platformFee || ''}
                  onChange={(e) => setFormData({ ...formData, platformFee: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                  style={{ borderColor: colors.neutral.border }}
                  disabled={isLoading}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Shipping Fee (Rp)
                </label>
                <input
                  type="number"
                  value={formData.shippingFee || ''}
                  onChange={(e) => setFormData({ ...formData, shippingFee: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                  style={{ borderColor: colors.neutral.border }}
                  disabled={isLoading}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Summary Box */}
            <div className="space-y-2 p-3 rounded-lg bg-gray-50 border border-dashed text-xs" style={{ borderColor: colors.neutral.border }}>
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase font-bold">Gross</span>
                <span className="font-bold">Rp {gross.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase font-bold">Total Potongan</span>
                <span className="text-red-500 font-medium">- Rp {totalDeductions.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t" style={{ borderColor: colors.neutral.border }}>
                <span className="text-gray-700 font-bold uppercase">Omset</span>
                <span className="font-bold" style={{ color: colors.brand[500] }}>
                  Rp {omset.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase font-bold">Total HPP</span>
                <span className="text-orange-600 font-medium">- Rp {hppTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t" style={{ borderColor: colors.neutral.border }}>
                <span className="font-bold uppercase text-gray-800">Estimasi Laba</span>
                <span className={`text-lg font-bold ${laba >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  Rp {laba.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Catatan
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className={`${inputClass} h-16`}
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
                placeholder="Opsional..."
              />
            </div>

            <div className="pt-2 flex gap-3 justify-end">
              <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
                Batal
              </Button>
              <Button variant="primary" type="submit" disabled={isLoading} style={{ minWidth: '140px' }}>
                {isLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
