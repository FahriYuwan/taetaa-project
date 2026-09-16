'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

interface EditProductionModalProps {
  isOpen: boolean;
  production: any;
  isLoading?: boolean;
  onSubmit: (id: string, data: { date: string; outputQty: number; notes: string }) => Promise<void>;
  onCancel: () => void;
}

export function EditProductionModal({
  isOpen,
  production,
  isLoading = false,
  onSubmit,
  onCancel,
}: EditProductionModalProps) {
  const [formData, setFormData] = useState({
    date: '',
    outputQty: 0,
    notes: '',
  });
  const [skuWithBom, setSkuWithBom] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && production) {
      setFormData({
        date: new Date(production.date).toISOString().split('T')[0],
        outputQty: production.outputQty,
        notes: production.notes || '',
      });
      setError('');
      fetchSkuDetail(production.output.sku.id);
    }
  }, [isOpen, production]);

  async function fetchSkuDetail(skuId: string) {
    try {
      const res = await fetch(`/api/skus/${skuId}`);
      if (res.ok) {
        const data = await res.json();
        setSkuWithBom(data);
      }
    } catch (err) {
      console.error('Failed to fetch SKU BOM detail:', err);
    }
  }

  if (!isOpen || !production) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.date || formData.outputQty <= 0) {
      setError('Tanggal dan Jumlah Output harus diisi dengan benar');
      return;
    }

    try {
      await onSubmit(production.id, {
        date: formData.date,
        outputQty: Number(formData.outputQty),
        notes: formData.notes,
      });
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui produksi');
    }
  }

  const outputSku = production.output.sku;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
      <div
        className="rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl"
        style={{ backgroundColor: colors.neutral.card }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: colors.neutral.textStrong }}>
              Edit Sesi Produksi
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Penyesuaian tanggal, jumlah output, atau catatan sesi produksi.
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded text-sm text-white bg-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-6">
          {/* Left Side: Form Controls */}
          <div className="flex-1 space-y-4">
            {/* Output SKU (Disabled) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                Output SKU (Produk Jadi)
              </label>
              <input
                type="text"
                disabled
                value={`[${outputSku.code}] ${outputSku.name}`}
                className="w-full px-3 py-2 rounded border text-sm bg-gray-100 font-semibold text-gray-700 cursor-not-allowed"
                style={{ borderColor: colors.neutral.border }}
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                SKU output tidak dapat diubah. Jika salah SKU, hapus dan buat sesi produksi baru.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Tanggal Produksi *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{ borderColor: colors.neutral.border }}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Jumlah Output (Qty) *
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={formData.outputQty || ''}
                  onChange={(e) => setFormData({ ...formData, outputQty: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded border text-sm font-bold"
                  style={{ borderColor: colors.neutral.border }}
                  disabled={isLoading}
                  placeholder="0"
                />
              </div>
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
                placeholder="Catatan penyesuaian produksi..."
              />
            </div>

            <div className="pt-4 flex gap-3 justify-end border-t" style={{ borderColor: colors.neutral.border }}>
              <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
                Batal
              </Button>
              <Button variant="primary" type="submit" disabled={isLoading} style={{ minWidth: '140px' }}>
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </div>

          {/* Right Side: Dynamic BOM Calculation Preview */}
          <div className="w-72 border-l pl-6 flex flex-col" style={{ borderColor: colors.neutral.border }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.neutral.textMuted }}>
              Estimasi Komponen Baru
            </h3>

            <div className="flex-1 overflow-auto space-y-2.5 max-h-[360px]">
              {!skuWithBom || !skuWithBom.bomComponents || skuWithBom.bomComponents.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-6 text-center">Memuat resep komponen...</p>
              ) : (
                skuWithBom.bomComponents.map((bom: any) => {
                  const needed = bom.quantity * (formData.outputQty || 0);
                  const item = bom.childSku || bom.childKemasan;
                  const isManual = bom.consumptionType === 'MANUAL';

                  return (
                    <div key={bom.id} className="p-2.5 rounded border text-xs bg-white" style={{ borderColor: colors.neutral.border }}>
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold truncate pr-1 text-gray-800">{item?.name}</div>
                        <span className="text-[9px] px-1 py-0.5 rounded bg-gray-100 text-gray-500 font-bold uppercase shrink-0">
                          {bom.category}
                        </span>
                      </div>

                      {isManual ? (
                        <div className="text-[10px] text-orange-600 font-medium italic">
                          Komponen Manual
                        </div>
                      ) : (
                        <div className="flex justify-between items-end text-[11px] text-gray-500 mt-1">
                          <div>
                            {bom.category === 'RAW' ? (
                              <span>
                                Butuh: <strong className="text-gray-900">{needed.toLocaleString('id-ID', { maximumFractionDigits: 4 })} unit</strong>
                                {item?.productSize ? (
                                  <span className="text-gray-500 font-medium ml-1">
                                    (~{(needed * item.productSize >= 1000)
                                      ? `${((needed * item.productSize) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} L`
                                      : `${Math.round(needed * item.productSize).toLocaleString('id-ID')} ml`})
                                  </span>
                                ) : null}
                              </span>
                            ) : (
                              <span>Butuh: <strong className="text-gray-900">{needed.toLocaleString('id-ID')} pcs</strong></span>
                            )}
                          </div>
                          <span className="font-semibold text-[10px]" style={{ color: colors.brand[500] }}>
                            {bom.quantity} {bom.category === 'RAW' ? 'unit' : 'pcs'} / out
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-3 pt-3 border-t text-[11px] text-gray-400 italic" style={{ borderColor: colors.neutral.border }}>
              Jika Qty diubah, sistem akan otomatis menyesuaikan kembali stok bahan dan HPP.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
