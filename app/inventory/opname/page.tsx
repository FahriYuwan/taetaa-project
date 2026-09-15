'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { Button, Badge } from '@/components/ui/Button';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';

interface OpnameItem {
  skuId: string;
  code: string;
  name: string;
  type: 'RAW' | 'PRODUCT' | 'PACKAGE';
  systemStock: number;
  physicalStock: number;
  diff: number;
  checked: boolean;
  notes: string;
  adjustStock: boolean;
}

export default function StockOpnamePage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<OpnameItem[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOpnameData();
  }, []);

  async function fetchOpnameData() {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory/opname');
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((sku: any) => ({
          skuId: sku.id,
          code: sku.code,
          name: sku.name,
          type: sku.type,
          systemStock: sku.systemStock,
          physicalStock: sku.systemStock,
          diff: 0,
          checked: false,
          notes: '',
          adjustStock: true,
        }));
        setItems(formatted);
      }
    } catch (error) {
      showToast({ message: 'Gagal memuat data SKU untuk opname', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function handlePhysicalStockChange(skuId: string, value: number) {
    setItems(prev => prev.map(item => {
      if (item.skuId === skuId) {
        const diff = value - item.systemStock;
        return { ...item, physicalStock: value, diff };
      }
      return item;
    }));
  }

  function handleItemToggleChecked(skuId: string) {
    setItems(prev => prev.map(item => {
      if (item.skuId === skuId) {
        return { ...item, checked: !item.checked };
      }
      return item;
    }));
  }

  function handleItemToggleAdjust(skuId: string) {
    setItems(prev => prev.map(item => {
      if (item.skuId === skuId) {
        return { ...item, adjustStock: !item.adjustStock };
      }
      return item;
    }));
  }

  function handleItemNotesChange(skuId: string, text: string) {
    setItems(prev => prev.map(item => {
      if (item.skuId === skuId) {
        return { ...item, notes: text };
      }
      return item;
    }));
  }

  async function handleSaveOpname() {
    const checkedItems = items.filter(item => item.checked);
    if (checkedItems.length === 0) {
      showToast({ message: 'Pilih minimal 1 item yang sudah dicek untuk disimpan', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory/opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: generalNotes,
          items: items,
        }),
      });

      if (res.ok) {
        showToast({ message: 'Hasil stock opname berhasil disimpan dan disesuaikan!', type: 'success' });
        setGeneralNotes('');
        fetchOpnameData();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan opname');
      }
    } catch (error: any) {
      showToast({ message: error.message || 'Gagal menyimpan opname', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Rekonsiliasi Stock Opname"
        subtitle="Verifikasi stok sistem vs fisik secara real-time dan rekam sesi audit trail."
        actions={
          <Button
            variant="primary"
            icon="💾"
            onClick={handleSaveOpname}
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Hasil Opname'}
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* General Notes Card */}
        <div className="bg-white p-4 rounded-lg border shadow-sm" style={{ borderColor: colors.neutral.border }}>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
            Catatan Sesi Rekonsiliasi (General Notes)
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded text-sm bg-white"
            placeholder="Contoh: Opname Akhir Bulan September oleh Tim Gudang"
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            disabled={isSubmitting || loading}
          />
        </div>

        {/* Table Spreadsheet View */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: colors.neutral.border }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b" style={{ borderColor: colors.neutral.border }}>
                <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <th className="px-4 py-3 text-center w-12">SUDAH DICEK</th>
                  <th className="px-4 py-3 w-32">SKU CODE</th>
                  <th className="px-4 py-3">NAMA PRODUK</th>
                  <th className="px-4 py-3 text-center w-24">TIPE</th>
                  <th className="px-4 py-3 text-right w-32">STOK SISTEM</th>
                  <th className="px-4 py-3 text-center w-36">STOK FISIK</th>
                  <th className="px-4 py-3 text-right w-28">SELISIH</th>
                  <th className="px-4 py-3 text-center w-32">SESUAIKAN STOK</th>
                  <th className="px-4 py-3">CATATAN KHUSUS</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">Loading SKU data...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-20 text-center text-gray-400">Tidak ada produk ditemukan.</td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const diffColor = item.diff > 0
                      ? 'text-green-600 font-bold'
                      : item.diff < 0
                        ? 'text-red-600 font-bold'
                        : 'text-gray-400 font-medium';

                    return (
                      <tr
                        key={item.skuId}
                        className="hover:bg-gray-50/50 transition-colors"
                        style={{ backgroundColor: item.checked ? 'rgba(79, 195, 247, 0.03)' : 'transparent' }}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                            checked={item.checked}
                            onChange={() => handleItemToggleChecked(item.skuId)}
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-800">{item.code}</td>
                        <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]" title={item.name}>
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge type={item.type}>{item.type}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-500 bg-gray-50/50">
                          {item.systemStock.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            step="0.01"
                            className="w-28 px-2 py-1 border rounded text-right text-sm font-bold focus:ring-2 focus:ring-blue-500"
                            value={item.physicalStock}
                            onChange={(e) => handlePhysicalStockChange(item.skuId, parseFloat(e.target.value) || 0)}
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className={`px-4 py-3 text-right ${diffColor}`}>
                          {item.diff > 0 ? `+${item.diff.toLocaleString('id-ID')}` : item.diff.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.diff !== 0 ? (
                            <label className="inline-flex items-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-orange-600 accent-orange-600"
                                checked={item.adjustStock}
                                onChange={() => handleItemToggleAdjust(item.skuId)}
                                disabled={isSubmitting || !item.checked}
                              />
                              <span className="ml-1.5 text-[10px] font-bold text-orange-700 uppercase">Otomatis</span>
                            </label>
                          ) : (
                            <span className="text-[10px] text-gray-300 font-bold uppercase">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border rounded text-xs bg-white text-gray-600"
                            placeholder="Catatan perbedaan fisik..."
                            value={item.notes}
                            onChange={(e) => handleItemNotesChange(item.skuId, e.target.value)}
                            disabled={isSubmitting}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
