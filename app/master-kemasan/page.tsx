'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { Button, Badge } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';

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
        subtitle="Kelola item Packing, Stiker, Safety, dan Dus"
        actions={
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Cari Kode / Nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 rounded border text-sm"
              style={{ borderColor: colors.neutral.border }}
            />
            <Button variant="primary" icon="➕" onClick={() => setShowAddModal(true)}>
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
          {(['all', 'PACKING', 'STIKER', 'SAFETY', 'DUS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="px-4 py-2 rounded text-sm font-medium transition-all"
              style={{
                backgroundColor: filter === tab ? colors.brand[500] : 'transparent',
                color: filter === tab ? 'white' : colors.neutral.textMuted,
              }}
            >
              {tab === 'all' ? 'Semua' : tab}
            </button>
          ))}
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
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">AVG COST</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">AKSI</th>
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
                  <td className="px-6 py-4 text-right text-sm font-medium" style={{ color: colors.brand[500] }}>
                    Rp {item.avgCost.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <button className="text-lg hover:opacity-70" onClick={() => { setEditingItem(item); setShowAddModal(true); }}>✏️</button>
                    <button className="text-lg hover:opacity-70" onClick={() => setDeletingItemId(item.id)}>🗑️</button>
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
  const [formData, setFormData] = useState({
    code: item?.code || '',
    name: item?.name || '',
    category: item?.category || 'PACKING',
    stock: item?.stock || 0,
    avgCost: item?.avgCost || 0,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-bold mb-4">{item ? 'Edit' : 'Tambah'} Item Kemasan</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kode Item</label>
            <input 
              className="w-full px-3 py-2 border rounded text-sm" 
              value={formData.code} 
              onChange={e => setFormData({...formData, code: e.target.value})}
              placeholder="Contoh: BTL1"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama / Deskripsi</label>
            <input 
              className="w-full px-3 py-2 border rounded text-sm" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Contoh: Botol 1 Liter"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategori</label>
            <select 
              className="w-full px-3 py-2 border rounded text-sm bg-white" 
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option value="PACKING">PACKING</option>
              <option value="STIKER">STIKER</option>
              <option value="SAFETY">SAFETY</option>
              <option value="DUS">DUS</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stok Awal</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border rounded text-sm" 
                value={formData.stock} 
                onChange={e => setFormData({...formData, stock: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Avg Cost (Rp)</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border rounded text-sm" 
                value={formData.avgCost} 
                onChange={e => setFormData({...formData, avgCost: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>
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
