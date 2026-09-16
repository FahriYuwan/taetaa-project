'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

interface AddAffiliateActivityModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function AddAffiliateActivityModal({
  isOpen,
  isLoading = false,
  onSubmit,
  onCancel,
}: AddAffiliateActivityModalProps) {
  const [skus, setSkus] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    activityType: 'AFFILIATE' as 'AFFILIATE' | 'NON_AFFILIATE',
    accountUsername: '',
    realName: '',
    skuId: '',
    qty: 1,
    courier: 'J&T Express',
    shippingCost: 0,
    marketplace: 'Shopee',
    followers: '',
    affiliateData: '',
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSkus();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        activityType: 'AFFILIATE',
        accountUsername: '',
        realName: '',
        skuId: '',
        qty: 1,
        courier: 'J&T Express',
        shippingCost: 0,
        marketplace: 'Shopee',
        followers: '',
        affiliateData: '',
        notes: '',
      });
      setError('');
    }
  }, [isOpen]);

  async function fetchSkus() {
    try {
      const res = await fetch('/api/skus');
      if (res.ok) {
        const data = await res.json();
        setSkus(data);
        if (data.length > 0 && !formData.skuId) {
          setFormData((prev) => ({ ...prev, skuId: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch SKUs:', err);
    }
  }

  if (!isOpen) return null;

  const selectedSku = skus.find((s) => s.id === formData.skuId);
  const hppPerUnit = selectedSku?.hppPrice || 0;
  const hppTerpakai = hppPerUnit * (formData.qty || 0);
  const totalBiaya = hppTerpakai + (Number(formData.shippingCost) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.skuId) {
      setError('Pilih SKU terlebih dahulu');
      return;
    }

    if (!formData.qty || formData.qty <= 0) {
      setError('Jumlah (Qty) harus lebih besar dari 0');
      return;
    }

    if (formData.activityType === 'AFFILIATE' && !formData.accountUsername.trim()) {
      setError('Akun/Username Affiliate wajib diisi untuk tipe Affiliate');
      return;
    }

    if (formData.activityType === 'NON_AFFILIATE' && !formData.notes.trim()) {
      setError('Keterangan wajib diisi untuk aktivitas Non-Affiliate (contoh: Compliment Yudhis, Marketing)');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        qty: Number(formData.qty),
        shippingCost: Number(formData.shippingCost) || 0,
      });
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan aktivitas affiliate');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ borderColor: colors.neutral.border }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: colors.neutral.border }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: colors.neutral.textStrong }}>
              Catat Pengiriman Barang (Affiliate / Non-Affiliate)
            </h2>
            <p className="text-xs text-gray-500">
              Barang yang dicatat otomatis mengurangi stok SKU (PACKAGE) dengan mutasi Keluar (Affiliate/Seeding).
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
              {error}
            </div>
          )}

          {/* Activity Type Toggle */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Tipe Aktivitas *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, activityType: 'AFFILIATE' })}
                className={`py-2 px-4 rounded border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  formData.activityType === 'AFFILIATE'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-100'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>🌟</span> Affiliate / Seeding
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, activityType: 'NON_AFFILIATE' })}
                className={`py-2 px-4 rounded border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  formData.activityType === 'NON_AFFILIATE'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-100'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>📦</span> Non-Affiliate (Sample, Compliment, dll)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700">
                Tanggal *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded border text-sm bg-white"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
                required
              />
            </div>

            {/* SKU Selection (All SKU Types) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700">
                SKU Produk (RAW / PRODUCT / PACKAGE) *
              </label>
              <select
                value={formData.skuId}
                onChange={(e) => setFormData({ ...formData, skuId: e.target.value })}
                className="w-full px-3 py-2 rounded border text-sm bg-white font-medium"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
                required
              >
                <option value="">Pilih SKU...</option>
                {skus.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.type}] {s.code} - {s.name} (HPP: Rp {(s.hppPrice || 0).toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Qty */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700">
                Jumlah Qty (Unit) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded border text-sm font-bold"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
                required
              />
            </div>

            {/* Ekspedisi */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700">
                Ekspedisi
              </label>
              <input
                type="text"
                value={formData.courier}
                onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
                placeholder="Contoh: J&T, SiCepat, SPX"
                className="w-full px-3 py-2 rounded border text-sm"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
              />
            </div>

            {/* Biaya Pengiriman */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700">
                Biaya Pengiriman (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={formData.shippingCost}
                onChange={(e) => setFormData({ ...formData, shippingCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded border text-sm"
                style={{ borderColor: colors.neutral.border }}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Field khusus Affiliate */}
          {formData.activityType === 'AFFILIATE' && (
            <div className="p-4 bg-gray-50 rounded-lg border space-y-4" style={{ borderColor: colors.neutral.border }}>
              <p className="text-[11px] font-bold uppercase text-blue-600 tracking-wider">
                Informasi Kreator / Affiliate
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700">
                    Akun / Username *
                  </label>
                  <input
                    type="text"
                    value={formData.accountUsername}
                    onChange={(e) => setFormData({ ...formData, accountUsername: e.target.value })}
                    placeholder="Contoh: @sabun_viral"
                    className="w-full px-3 py-2 rounded border text-sm bg-white"
                    style={{ borderColor: colors.neutral.border }}
                    disabled={isLoading}
                    required={formData.activityType === 'AFFILIATE'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700">
                    Nama Asli (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.realName}
                    onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                    placeholder="Nama asli pemilik akun"
                    className="w-full px-3 py-2 rounded border text-sm bg-white"
                    style={{ borderColor: colors.neutral.border }}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700">
                    Marketplace
                  </label>
                  <select
                    value={formData.marketplace}
                    onChange={(e) => setFormData({ ...formData, marketplace: e.target.value })}
                    className="w-full px-3 py-2 rounded border text-sm bg-white"
                    style={{ borderColor: colors.neutral.border }}
                    disabled={isLoading}
                  >
                    <option value="Shopee">Shopee</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700">
                    Followers
                  </label>
                  <input
                    type="text"
                    value={formData.followers}
                    onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                    placeholder="Contoh: 120K / 1.5M"
                    className="w-full px-3 py-2 rounded border text-sm bg-white"
                    style={{ borderColor: colors.neutral.border }}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700">
                    Data Klik / Pesanan
                  </label>
                  <input
                    type="text"
                    value={formData.affiliateData}
                    onChange={(e) => setFormData({ ...formData, affiliateData: e.target.value })}
                    placeholder="Contoh: 850 klik, 42 order"
                    className="w-full px-3 py-2 rounded border text-sm bg-white"
                    style={{ borderColor: colors.neutral.border }}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700">
              Keterangan {formData.activityType === 'NON_AFFILIATE' && <span className="text-red-500">* (Wajib diisi)</span>}
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={
                formData.activityType === 'NON_AFFILIATE'
                  ? 'Contoh: Compliment Yudhis, Marketing, Sample Event, dll'
                  : 'Catatan tambahan terkait pengiriman / promosi...'
              }
              className="w-full px-3 py-2 rounded border text-sm"
              style={{ borderColor: colors.neutral.border }}
              disabled={isLoading}
              required={formData.activityType === 'NON_AFFILIATE'}
            />
          </div>

          {/* Realtime Calculated Preview */}
          <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 text-xs grid grid-cols-3 gap-2">
            <div>
              <p className="text-gray-500">HPP Satuan SKU:</p>
              <p className="font-bold text-gray-800">Rp {hppPerUnit.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-gray-500">HPP Terpakai ({formData.qty || 0} unit):</p>
              <p className="font-bold text-orange-600">Rp {hppTerpakai.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Biaya (HPP + Ongkir):</p>
              <p className="font-bold text-blue-700 text-sm">Rp {totalBiaya.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: colors.neutral.border }}>
            <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading} style={{ minWidth: '130px' }}>
              {isLoading ? 'Menyimpan...' : 'Simpan Aktivitas'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
