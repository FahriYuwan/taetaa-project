'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';

interface BOMComponentInput {
  childId: string;
  category: 'RAW' | 'PACKING' | 'STIKER' | 'SAFETY' | 'DUS';
  quantity: number;
  consumptionType: 'AUTOMATIC' | 'MANUAL';
  childName?: string; // for display
}

interface SKUFormData {
  code: string;
  name: string;
  type: 'RAW' | 'PRODUCT' | 'PACKAGE';
  productSize: number;
  unit?: 'ml' | 'pcs';
  hppPrice: number;
  sellingPrice?: number;
  stockMin?: number | null;
  bomComponents: BOMComponentInput[];
}

interface AddEditSKUModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  initialData?: any;
  onSubmit: (data: SKUFormData) => Promise<void>;
  onCancel: () => void;
}

export function AddEditSKUModal({
  isOpen,
  isLoading = false,
  initialData,
  onSubmit,
  onCancel,
}: AddEditSKUModalProps) {
  const [formData, setFormData] = useState<SKUFormData>({
    code: '',
    name: '',
    type: 'RAW',
    productSize: 0,
    hppPrice: 0,
    sellingPrice: undefined,
    stockMin: 0,
    bomComponents: [],
  });
  const [selectedCategory, setSelectedCategory] = useState<'RAW' | 'PACKING' | 'STIKER' | 'SAFETY' | 'DUS'>('RAW');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedQty, setSelectedQty] = useState(0);
  const [availableComponents, setAvailableComponents] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          code: initialData.code || '',
          name: initialData.name || '',
          type: initialData.type || 'RAW',
          productSize: initialData.productSize || 0,
          unit: initialData.unit || 'ml',
          hppPrice: initialData.avgCost ?? initialData.hppPrice ?? 0,
          sellingPrice: initialData.sellingPrice,
          stockMin: initialData.stockMin !== undefined ? initialData.stockMin : 0,
          bomComponents: initialData.bomComponents ? initialData.bomComponents.map((b: any) => ({
            childId: b.childSkuId || b.childKemasanId,
            category: b.category,
            quantity: b.quantity,
            consumptionType: b.consumptionType,
            childName: b.childSku?.name || b.childKemasan?.name || b.childName
          })) : [],
        });
      } else {
        setFormData({
          code: '',
          name: '',
          type: 'RAW',
          productSize: 0,
          unit: 'ml',
          hppPrice: 0,
          sellingPrice: undefined,
          stockMin: 0,
          bomComponents: [],
        });
      }
      fetchAvailableItems();
    }
  }, [isOpen, initialData, selectedCategory]);

  async function fetchAvailableItems() {
    try {
      let url = '';
      if (selectedCategory === 'RAW') {
        url = '/api/skus';
      } else {
        url = `/api/kemasan?category=${selectedCategory}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        let filtered = data;
        if (selectedCategory === 'RAW') {
          // Only show RAW skus or PRODUCT skus as components
          filtered = data.filter((s: any) => s.id !== initialData?.id && (s.type === 'RAW' || s.type === 'PRODUCT'));
        }
        setAvailableComponents(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
  }

  if (!isOpen) return null;

  const isEditing = !!initialData?.id;
  const title = isEditing ? 'Edit SKU' : 'Tambah SKU';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.code.trim() || !formData.name.trim()) {
      setError('Kode dan Nama SKU harus diisi');
      return;
    }

    if ((formData.type === 'PRODUCT' || formData.type === 'PACKAGE') && formData.bomComponents.length === 0) {
      setError('Harap tambahkan minimal 1 komponen BOM');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan SKU');
    }
  }

  function addComponent() {
    if (!selectedChildId || selectedQty <= 0) return;

    const component = availableComponents.find(c => c.id === selectedChildId);
    if (!component) return;

    if (formData.bomComponents.some(c => c.childId === selectedChildId && c.category === selectedCategory)) {
      setError('Komponen sudah ada di daftar');
      return;
    }

    const consumptionType = (selectedCategory === 'SAFETY' && (component.code === 'SLTP' || component.code === 'PLWR'))
      ? 'MANUAL'
      : 'AUTOMATIC';

    setFormData({
      ...formData,
      bomComponents: [
        ...formData.bomComponents,
        { 
          childId: selectedChildId, 
          category: selectedCategory,
          quantity: selectedQty, 
          consumptionType,
          childName: component.name 
        }
      ]
    });
    setSelectedChildId('');
    setSelectedQty(0);
  }

  function removeComponent(id: string) {
    setFormData({
      ...formData,
      bomComponents: formData.bomComponents.filter(c => c.childId !== id)
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
      <div 
        className="rounded-lg p-6 w-full mx-4 shadow-xl"
        style={{ backgroundColor: colors.neutral.card, maxWidth: formData.type === 'RAW' ? '450px' : '800px' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.neutral.textStrong }}>
            {title}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded text-sm text-white" style={{ backgroundColor: colors.semantic.red }}>
              {error}
            </div>
          )}

          <div className={`grid ${formData.type === 'RAW' ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
            {/* Left Column: Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Kode SKU
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: colors.neutral.border, '--tw-ring-color': colors.brand[500] } as any}
                  disabled={isLoading}
                  placeholder="Contoh: RAW-OIL-01"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Nama Produk
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: colors.neutral.border, '--tw-ring-color': colors.brand[500] } as any}
                  disabled={isLoading}
                  placeholder="Contoh: Fragrance Oil Lavender"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Tipe SKU
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SKUFormData['type'] })}
                  className="w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 bg-white"
                  style={{ borderColor: colors.neutral.border, '--tw-ring-color': colors.brand[500] } as any}
                  disabled={isLoading}
                >
                  <option value="RAW">RAW (Bahan Baku Murni)</option>
                  <option value="PRODUCT">PRODUCT (Olahan / Setengah Jadi)</option>
                  <option value="PACKAGE">PACKAGE (Produk Jadi Siap Jual)</option>
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  Semua tipe (PACKAGE, RAW, PRODUCT) dapat dijual langsung pada transaksi Penjualan &amp; Bulk Paste.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: colors.neutral.textMuted }}>
                    {formData.unit === 'pcs' ? 'Kuantitas / Jumlah Satuan' : 'Product Size (Kapasitas Isi)'}
                  </label>
                  <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, unit: 'ml' })}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        (formData.unit || 'ml') === 'ml'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ml (Volume)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, unit: 'pcs' })}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        formData.unit === 'pcs'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      pcs (Kuantitas)
                    </button>
                  </div>
                </div>
                <NumberInput
                  value={formData.productSize}
                  onChange={(val) => setFormData({ ...formData, productSize: val })}
                  suffix={formData.unit === 'pcs' ? 'pcs' : 'ml'}
                  className="border focus:ring-2 bg-white"
                  style={{ borderColor: colors.neutral.border } as any}
                  disabled={isLoading}
                  placeholder="0"
                  showPreview
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  {formData.unit === 'pcs'
                    ? 'Gunakan pcs jika produk berbentuk fisik satuan/alat (contoh: 1 pcs sikat, 2 pcs bundling sikat & eraser).'
                    : 'Gunakan ml jika produk berupa cairan dalam botol/jerigen (contoh: 100 ml, 500 ml, 20.000 ml untuk 20L).'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between text-gray-500 font-medium">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-gray-500">Harga HPP (Dinamis)</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
                    Otomatis Sistem
                  </span>
                </div>
                <div className="text-base font-bold text-gray-900 mt-1">
                  {formData.hppPrice > 0 ? `Rp ${formData.hppPrice % 1 === 0 ? formData.hppPrice.toLocaleString('id-ID') : formData.hppPrice.toLocaleString('id-ID', { maximumFractionDigits: 2 })}` : 'Rp 0'}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                  Tidak perlu diinput manual. HPP otomatis dihitung dari histori transaksi Pembelian RAW (Weighted Average) atau kalkulasi BOM saat Produksi.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Rekomendasi Harga Jual {formData.type !== 'PACKAGE' && <span className="text-[10px] lowercase font-normal text-gray-400">(opsional)</span>}
                </label>
                <NumberInput
                  value={formData.sellingPrice}
                  onChange={(val) => setFormData({ ...formData, sellingPrice: val || undefined })}
                  prefix="Rp "
                  className="border focus:ring-2 bg-white"
                  style={{ borderColor: colors.neutral.border } as any}
                  disabled={isLoading}
                  placeholder="0"
                  showPreview
                />
                <p className="mt-1 text-[11px] text-gray-500 leading-tight">
                  {formData.type === 'PACKAGE'
                    ? 'Rekomendasi harga patokan yang diinputkan oleh owner. Otomatis mengisi harga satuan saat input transaksi penjualan.'
                    : 'Opsional. Rekomendasi harga patokan dari owner jika bahan baku / produk olahan ini dijual langsung ke pembeli.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                  Stok Minimum (Opsional)
                </label>
                <NumberInput
                  value={formData.stockMin ?? 0}
                  onChange={(val) => setFormData({ 
                    ...formData, 
                    stockMin: val === 0 ? null : val 
                  })}
                  suffix="unit"
                  className="border focus:ring-2 bg-white"
                  style={{ borderColor: colors.neutral.border } as any}
                  disabled={isLoading}
                  placeholder="0 (atau kosongkan)"
                  showPreview
                />
                <p className="mt-1 text-[10px] text-gray-500">
                  Peringatan restock aktif jika stok &lt; stok minimum. Isi 0 atau kosongkan jika tanpa batas minimum.
                </p>
              </div>
            </div>

            {/* Right Column: BOM Components */}
            {formData.type !== 'RAW' && (
              <div className="border-l pl-6 space-y-4" style={{ borderColor: colors.neutral.border }}>
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.neutral.textStrong }}>
                  Komponen BOM (Resep)
                </h3>

                {/* Add Component Form */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value as any);
                        setSelectedChildId('');
                      }}
                      className="w-32 px-3 py-2 rounded border text-sm bg-white font-bold"
                      style={{ borderColor: colors.neutral.border }}
                    >
                      <option value="RAW">RAW</option>
                      <option value="PACKING">PACKING</option>
                      <option value="STIKER">STIKER</option>
                      <option value="SAFETY">SAFETY</option>
                      <option value="DUS">DUS</option>
                    </select>
                    <select
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      className="flex-1 px-3 py-2 rounded border text-sm bg-white"
                      style={{ borderColor: colors.neutral.border }}
                    >
                      <option value="">Pilih {selectedCategory}...</option>
                      {availableComponents.map(s => (
                        <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <NumberInput
                        value={selectedQty}
                        onChange={(val) => setSelectedQty(val)}
                        allowDecimal
                        suffix={selectedCategory === 'RAW' ? 'UNIT' : 'PCS'}
                        className="border bg-white"
                        style={{ borderColor: colors.neutral.border } as any}
                        placeholder={selectedCategory === 'RAW' ? "Qty Unit (cth: 0.05)" : "Qty (pcs)"}
                      />
                    </div>
                    <Button type="button" variant="secondary" onClick={addComponent} style={{ width: '100px' }}>
                      Add
                    </Button>
                  </div>
                  {selectedCategory === 'RAW' && selectedChildId && (() => {
                    const sel = availableComponents.find(c => c.id === selectedChildId);
                    if (!sel || !sel.productSize) return null;
                    const volMl = (selectedQty || 0) * sel.productSize;
                    return (
                      <div className="text-[11px] text-gray-500 italic mt-1">
                        Kapasitas bahan baku: {sel.productSize >= 1000 ? `${sel.productSize / 1000} L` : `${sel.productSize} ml`} / unit.
                        {selectedQty > 0 && (
                          <span className="font-semibold text-blue-600 ml-1">
                            (~{volMl >= 1000 ? `${(volMl / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Liter` : `${Math.round(volMl).toLocaleString('id-ID')} ml`})
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Component List */}
                <div className="border rounded divide-y max-h-[400px] overflow-auto" style={{ borderColor: colors.neutral.border }}>
                  {formData.bomComponents.length === 0 ? (
                    <div className="p-4 text-center text-xs italic text-gray-400">
                      Belum ada komponen ditambahkan
                    </div>
                  ) : (
                    (['RAW', 'PACKING', 'STIKER', 'SAFETY', 'DUS'] as const).map(cat => {
                      const comps = formData.bomComponents.filter(c => c.category === cat);
                      if (comps.length === 0) return null;
                      return (
                        <div key={cat} className="bg-white">
                          <div className="bg-gray-50 px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-y">
                            {cat}
                          </div>
                          {comps.map((comp) => (
                            <div key={comp.childId} className="p-3 flex justify-between items-center text-sm">
                              <div>
                                <span className="font-medium text-gray-700">{comp.childName}</span>
                                <div className="flex gap-2 mt-0.5">
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold">
                                    {comp.quantity} {cat === 'RAW' ? 'unit' : 'pcs'}
                                  </span>
                                  {comp.consumptionType === 'MANUAL' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-bold">
                                      MANUAL
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeComponent(comp.childId)}
                                className="text-red-400 hover:text-red-600 p-1"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t flex gap-3 justify-end" style={{ borderColor: colors.neutral.border }}>
            <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading} style={{ minWidth: '120px' }}>
              {isLoading ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Buat SKU')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
