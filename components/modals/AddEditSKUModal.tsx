'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

interface BOMComponentInput {
  childId: string;
  quantity: number;
  childName?: string; // for display
}

interface SKUFormData {
  code: string;
  name: string;
  type: 'RAW' | 'WIP' | 'PACKAGE';
  sellingPrice?: number;
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
    sellingPrice: undefined,
    bomComponents: [],
  });
  const [availableComponents, setAvailableComponents] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedQty, setSelectedQty] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          code: initialData.code || '',
          name: initialData.name || '',
          type: initialData.type || 'RAW',
          sellingPrice: initialData.sellingPrice,
          bomComponents: initialData.bomComponents ? initialData.bomComponents.map((b: any) => ({
            childId: b.childId,
            quantity: b.quantity,
            childName: b.child?.name || b.childName
          })) : [],
        });
      } else {
        setFormData({
          code: '',
          name: '',
          type: 'RAW',
          sellingPrice: undefined,
          bomComponents: [],
        });
      }
      fetchAvailableComponents();
    }
  }, [isOpen, initialData]);

  async function fetchAvailableComponents() {
    try {
      // Fetch RAW and WIP skus as possible components
      const res = await fetch('/api/skus');
      if (res.ok) {
        const data = await res.json();
        // Filter out self if editing
        const filtered = data.filter((s: any) => s.id !== initialData?.id && (s.type === 'RAW' || s.type === 'WIP'));
        setAvailableComponents(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch components:', err);
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

    if ((formData.type === 'WIP' || formData.type === 'PACKAGE') && formData.bomComponents.length === 0) {
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

    if (formData.bomComponents.some(c => c.childId === selectedChildId)) {
      setError('Komponen sudah ada di daftar');
      return;
    }

    setFormData({
      ...formData,
      bomComponents: [
        ...formData.bomComponents,
        { childId: selectedChildId, quantity: selectedQty, childName: component.name }
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
                  <option value="RAW">RAW (Bahan Baku)</option>
                  <option value="WIP">WIP (Setengah Jadi)</option>
                  <option value="PACKAGE">PACKAGE (Produk Jadi)</option>
                </select>
              </div>

              {formData.type === 'PACKAGE' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.neutral.textMuted }}>
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.sellingPrice || ''}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: colors.neutral.border, '--tw-ring-color': colors.brand[500] } as any}
                    disabled={isLoading}
                    placeholder="0"
                  />
                  {formData.sellingPrice && (
                    <p className="mt-1 text-[10px] text-gray-500 font-medium">
                      Format: Rp {formData.sellingPrice.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: BOM Components */}
            {formData.type !== 'RAW' && (
              <div className="border-l pl-6 space-y-4" style={{ borderColor: colors.neutral.border }}>
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.neutral.textStrong }}>
                  Komponen BOM (Resep)
                </h3>

                {/* Add Component Form */}
                <div className="flex gap-2">
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded border text-sm bg-white"
                    style={{ borderColor: colors.neutral.border }}
                  >
                    <option value="">Pilih Komponen...</option>
                    {availableComponents.map(s => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedQty || ''}
                    onChange={(e) => setSelectedQty(parseFloat(e.target.value))}
                    className="w-20 px-3 py-2 rounded border text-sm"
                    style={{ borderColor: colors.neutral.border }}
                    placeholder="Qty"
                  />
                  <Button type="button" variant="secondary" onClick={addComponent}>
                    Add
                  </Button>
                </div>

                {/* Component List */}
                <div className="border rounded divide-y max-h-[300px] overflow-auto" style={{ borderColor: colors.neutral.border }}>
                  {formData.bomComponents.length === 0 ? (
                    <div className="p-4 text-center text-xs italic text-gray-400">
                      Belum ada komponen ditambahkan
                    </div>
                  ) : (
                    formData.bomComponents.map((comp) => (
                      <div key={comp.childId} className="p-3 flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">{comp.childName || availableComponents.find(s => s.id === comp.childId)?.name}</span>
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {comp.quantity} unit
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeComponent(comp.childId)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))
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
