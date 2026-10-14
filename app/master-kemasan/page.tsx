'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/header/PageHeader';
import { Button, Badge } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import { FiShoppingCart, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface KemasanItem {
  id: string;
  code: string;
  name: string;
  category: 'PACKING' | 'STIKER' | 'SAFETY' | 'DUS';
  stock: number;
  avgCost: number;
}

export default function MasterKemasanPage() {
  const [items, setItems] = useState<KemasanItem[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<KemasanItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchItems();
  }, [filter]);

  async function fetchItems() {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/api/kemasan' 
        : `/api/kemasan?category=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      showToast({ message: 'Gagal memuat data kemasan', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData: any) {
    setIsSubmitting(true);
    try {
      const url = editingItem ? `/api/kemasan/${editingItem.id}` : '/api/kemasan';
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Gagal menyimpan data');

      showToast({ message: `Item berhasil ${editingItem ? 'diperbarui' : 'ditambahkan'}`, type: 'success' });
      setShowAddModal(false);
      setEditingItem(null);
      fetchItems();
    } catch (error: any) {
      showToast({ message: error.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/kemasan/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus item');
      
      showToast({ message: 'Item berhasil dihapus', type: 'success' });
      setDeletingItemId(null);
      fetchItems();
    } catch (error: any) {
      showToast({ message: error.message, type: 'error' });
    }
  }

  const filteredItems = items.filter(item =>
    item.code.toLowerCase().includes(search.toLowerCase()) ||
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Master Kemasan"
        subtitle="Kelola item Packing, Stiker, Safety, dan Dus. HPP otomatis terupdate saat mencatat pembelian."
        actions={
          <div className="flex gap-2.5">
            <input
              type="text"
              placeholder="Cari Kode / Nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 rounded border text-sm"
              style={{ borderColor: colors.neutral.border }}
            />
            <Link href="/pembelian-raw">
              <Button variant="secondary" icon={<FiShoppingCart size={15} />}>
                Beli Kemasan
              </Button>
            </Link>
            <Button variant="primary" icon={<FiPlus size={15} />} onClick={() => setShowAddModal(true)}>
              Tambah Item
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div 
          className="flex gap-2 mb-6 p-4 rounded-t-lg"
          style={{ backgroundColor: colors.neutral.card, borderColor: colors.neutral.border }}
        >
          {(['all', 'PACKING', 'STIKER', 'SAFETY', 'DUS'] as const).map((tab) => {
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className="px-4 py-2 rounded text-sm font-medium transition-all cursor-pointer select-none"
                style={{
                  backgroundColor: isActive ? colors.brand[500] : 'transparent',
                  color: isActive ? 'white' : colors.neutral.textMuted,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(79,195,247,0.08)';
                    (e.currentTarget as HTMLElement).style.color = colors.neutral.textStrong;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = colors.neutral.textMuted;
                  }
                }}
              >
                {tab === 'all' ? 'Semua' : tab}
              </button>
            );
          })}
        </div>

        <div 
          className="rounded-b-lg border overflow-hidden"
          style={{ borderColor: colors.neutral.border, backgroundColor: colors.neutral.card }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottomColor: colors.neutral.border, borderBottomWidth: '1px' }}>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">KODE</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">NAMA</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500">KATEGORI</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">STOK</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">HARGA HPP</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} style={{ borderBottomColor: colors.neutral.border, borderBottomWidth: '1px' }}>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{item.category}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">{item.stock.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium" style={{ color: colors.neutral.textStrong }}>
                    {item.avgCost > 0
                      ? `Rp ${item.avgCost % 1 === 0 ? item.avgCost.toLocaleString('id-ID') : item.avgCost.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`
                      : 'Rp 0'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="p-1 text-gray-500 hover:text-blue-600 rounded transition-colors cursor-pointer"
                        onClick={() => { setEditingItem(item); setShowAddModal(true); }}
                        title="Edit Item"
                        aria-label="Edit Item"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        className="p-1 text-gray-500 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        onClick={() => setDeletingItemId(item.id)}
                        title="Hapus Item"
                        aria-label="Hapus Item"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddModal || editingItem) && (
        <KemasanModal 
          item={editingItem} 
          isLoading={isSubmitting}
          onClose={() => { setShowAddModal(false); setEditingItem(null); }} 
          onSubmit={handleSubmit} 
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingItemId}
        title="Hapus Item"
        message="Yakin ingin menghapus item kemasan ini?"
        confirmText="Hapus"
        onConfirm={() => deletingItemId && handleDelete(deletingItemId)}
        onCancel={() => setDeletingItemId(null)}
        variant="danger"
      />
    </div>
  );
}

function KemasanModal({ item, isLoading, onClose, onSubmit }: any) {
  const isEditing = !!item;
  const [formData, setFormData] = useState({
    code: item?.code || '',
    name: item?.name || '',
    category: item?.category || 'PACKING',
    stock: item?.stock || 0,
    avgCost: item?.avgCost || 0,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-6">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit Item Kemasan' : 'Tambah Item Kemasan'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer" aria-label="Tutup Modal">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kode Item</label>
            <input 
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={formData.code} 
              onChange={e => setFormData({...formData, code: e.target.value})}
              placeholder="Contoh: BTL1"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nama / Deskripsi</label>
            <input 
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Contoh: Botol 1 Liter"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kategori</label>
            <select 
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})}
              disabled={isLoading}
            >
              <option value="PACKING">PACKING (Botol, Jerigen, Cup)</option>
              <option value="STIKER">STIKER (Label Depan/Belakang)</option>
              <option value="SAFETY">SAFETY (Sealtape, Bubble, Plastik Wrapping)</option>
              <option value="DUS">DUS (Box Kemasan Luar)</option>
            </select>
          </div>

          {/* Kondisi Mode Edit vs Mode Tambah Baru */}
          {isEditing ? (
            <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[10px] text-gray-500">Stok & HPP Terkini</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
                  Otomatis Sistem
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-xs text-gray-500">Saldo Stok Gudang</span>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                    {formData.stock.toLocaleString('id-ID')} pcs
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Harga HPP Rata-rata</span>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                    {formData.avgCost > 0
                      ? `Rp ${formData.avgCost % 1 === 0 ? formData.avgCost.toLocaleString('id-ID') : formData.avgCost.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`
                      : 'Rp 0'}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 pt-1.5 border-t border-gray-200 leading-tight">
                *Stok dan HPP kemasan tidak diubah manual. Saldo akan bertambah saat mencatat nota di menu <strong className="text-gray-700">Pembelian Bahan & Kemasan</strong> atau berkurang saat <strong className="text-gray-700">Produksi</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-800 leading-relaxed">
                <strong>Catatan Saldo Awal:</strong> Kolom di bawah hanya diisi jika Anda memiliki sisa stok saat migrasi sistem awal. Jika memulai dari nol, isi <strong>0</strong> dan catat belanja masuk melalui menu <strong>Pembelian Bahan & Kemasan</strong>.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Stok Awal (Opsional)</label>
                  <NumberInput 
                    className="border bg-white" 
                    value={formData.stock} 
                    onChange={(val) => setFormData({...formData, stock: val})}
                    suffix="pcs"
                    showPreview
                    placeholder="0"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">HPP Saldo Awal</label>
                  <NumberInput 
                    className="border bg-white font-bold" 
                    prefix="Rp "
                    value={formData.avgCost} 
                    onChange={(val) => setFormData({...formData, avgCost: val})}
                    showPreview
                    placeholder="0"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Batal</Button>
          <Button variant="primary" onClick={() => onSubmit(formData)} disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>
    </div>
  );
}
