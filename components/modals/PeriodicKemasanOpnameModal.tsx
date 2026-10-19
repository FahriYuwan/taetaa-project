'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import { FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface PeriodicItem {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  lastOpname: string | null;
  daysSinceLastOpname: number | null;
  needsOpname: boolean;
}

interface PeriodicKemasanOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PeriodicKemasanOpnameModal({
  isOpen,
  onClose,
  onSuccess,
}: PeriodicKemasanOpnameModalProps) {
  const { showToast } = useToast();
  const [items, setItems] = useState<PeriodicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [physicalStocks, setPhysicalStocks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

  async function fetchItems() {
    try {
      setLoading(true);
      const res = await fetch('/api/kemasan/opname-periodik');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        const initialStocks: Record<string, number> = {};
        for (const item of data.items || []) {
          initialStocks[item.id] = item.stock;
        }
        setPhysicalStocks(initialStocks);
      }
    } catch {
      showToast({ message: 'Gagal memuat daftar kemasan periodik', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const updates = items.map((item) => ({
        id: item.id,
        physicalStock: physicalStocks[item.id] !== undefined ? physicalStocks[item.id] : item.stock,
      }));

      const res = await fetch('/api/kemasan/opname-periodik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) throw new Error('Gagal menyimpan opname');

      showToast({ message: 'Stok fisik kemasan periodik berhasil diperbarui', type: 'success' });
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast({ message: error.message || 'Terjadi kesalahan', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded bg-amber-100 text-amber-800">
                <FiClock size={18} />
              </span>
              <h3 className="text-lg font-bold text-gray-900">Opname Mingguan Kemasan Non-Diskret</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Pembaruan berkala untuk item habis pakai (sealtape roll, plastik wrap, stiker, tutup botol) yang tidak dihitung harian.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
            aria-label="Tutup Modal"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Memuat data kemasan periodik...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Tidak ada item kemasan dengan metode pemantauan periodik.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: colors.neutral.border }}>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b text-[10px] uppercase font-bold text-gray-500" style={{ borderColor: colors.neutral.border }}>
                  <tr>
                    <th className="px-4 py-2.5 text-left">Kode & Nama</th>
                    <th className="px-3 py-2.5 text-center">Kategori</th>
                    <th className="px-3 py-2.5 text-center">Status Cek</th>
                    <th className="px-4 py-2.5 text-right">Stok Sistem</th>
                    <th className="px-4 py-2.5 text-right w-36">Stok Fisik Aktual</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
                  {items.map((item) => {
                    const days = item.daysSinceLastOpname;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <div className="font-bold text-gray-900 text-xs">{item.code}</div>
                          <div className="text-xs text-gray-500">{item.name}</div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {item.needsOpname ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <FiAlertCircle size={12} />
                              {days === null ? 'Belum Cek' : `${days} hari lalu`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <FiCheckCircle size={12} />
                              {days === 0 ? 'Hari ini' : `${days} hari lalu`}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs text-gray-600">
                          {item.stock.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <NumberInput
                            className="text-right text-xs py-1 px-2 border rounded"
                            value={physicalStocks[item.id] ?? item.stock}
                            onChange={(val) =>
                              setPhysicalStocks((prev) => ({ ...prev, [item.id]: val }))
                            }
                            placeholder="0"
                            disabled={isSubmitting}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Tips: Cukup pastikan ada minimal 1 roll/bungkus utuh cadangan di rak penyimpanan (Two-Bin Kanban). Isi angka riil hasil tinjauan fisik di gudang.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2.5 border-t pt-4" style={{ borderColor: colors.neutral.border }}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || loading || items.length === 0}
          >
            {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Cek Fisik'}
          </Button>
        </div>
      </div>
    </div>
  );
}
