'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/header/PageHeader';
import { Button, Badge } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import { FiShoppingCart, FiPlus, FiEdit2, FiTrash2, FiClock, FiAlertCircle } from 'react-icons/fi';
import { PeriodicKemasanOpnameModal } from '@/components/modals/PeriodicKemasanOpnameModal';
import { BulkKemasanModal } from '@/components/modals/BulkKemasanModal';

interface KemasanItem {
  id: string;
  code: string;
  name: string;
  category: 'PACKING' | 'STIKER' | 'SAFETY' | 'DUS';
  stock: number;
  stockMin?: number | null;
  avgCost: number;
  isPeriodic?: boolean | null;
  lastOpname?: string | null;
}

export default function MasterKemasanPage() {
  const [items, setItems] = useState<KemasanItem[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [periodicAlertCount, setPeriodicAlertCount] = useState(0);
  const [editingItem, setEditingItem] = useState<KemasanItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchItems();
    fetchPeriodicSummary();
  }, [filter]);

  async function fetchPeriodicSummary() {
    try {
      const res = await fetch('/api/kemasan/opname-periodik');
      if (res.ok) {
        const data = await res.json();
        setPeriodicAlertCount(data.needsOpnameCount || 0);
      }
    } catch {
      // non-blocking
    }
  }

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

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) =>
      !q ||
      item.code.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q)
    );
  }, [items, search]);

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const paginatedItems = useMemo(() => {
    if (pageSize === 'all') return filteredItems;
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

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
            <Button 
              variant="secondary" 
              icon={<FiClock size={15} />} 
              onClick={() => setShowOpnameModal(true)}
              className={periodicAlertCount > 0 ? 'border-amber-400 bg-amber-50 text-amber-800' : ''}
            >
              {periodicAlertCount > 0 ? `Opname Mingguan (${periodicAlertCount})` : 'Opname Mingguan'}
            </Button>
            <Link href="/pembelian-raw">
              <Button variant="secondary" icon={<FiShoppingCart size={15} />}>
                Beli Kemasan
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => setShowBulkModal(true)}>
              Bulk Paste
            </Button>
            <Button variant="primary" icon={<FiPlus size={15} />} onClick={() => setShowAddModal(true)}>
              Tambah Item
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {periodicAlertCount > 0 && (
          <div className="mb-4 p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs text-amber-900 font-medium">
              <FiAlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>Pengingat Opname Mingguan:</strong> Terdapat <strong>{periodicAlertCount}</strong> item kemasan periodik (sealtape, wrap, stiker, tutup) yang belum dicek fisik minggu ini.
              </span>
            </div>
            <button
              onClick={() => setShowOpnameModal(true)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
            >
              Cek Fisik Sekarang
            </button>
          </div>
        )}

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
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500">PEMANTAUAN</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">STOK</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">STOK MIN</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500 cursor-help" title="HPP dinamis dari histori pembelian supplier (Weighted Average)">HARGA HPP</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    Memuat data kemasan...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-gray-400 font-medium">
                    Tidak ada item kemasan yang cocok.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} style={{ borderBottomColor: colors.neutral.border, borderBottomWidth: '1px' }}>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.isPeriodic ? (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Periodik (Mingguan)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          Harian (Perpetual)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">{item.stock.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {item.stockMin && item.stockMin > 0 ? `${item.stockMin.toLocaleString('id-ID')} pcs` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium" style={{ color: colors.neutral.textStrong }}>
                      <span
                        className="cursor-help text-gray-700"
                        title={
                          item.avgCost > 0
                            ? "HPP dinamis dari histori pembelian supplier (Weighted Average)"
                            : "Belum ada histori pembelian supplier (Rp 0)"
                        }
                      >
                        {item.avgCost > 0
                          ? `Rp ${item.avgCost % 1 === 0 ? item.avgCost.toLocaleString('id-ID') : item.avgCost.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`
                          : 'Rp 0'}
                      </span>
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
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <Pagination
            currentPage={page}
            totalItems={filteredItems.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[25, 50, 100, 'all']}
            itemLabel="item kemasan"
          />
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

      <PeriodicKemasanOpnameModal
        isOpen={showOpnameModal}
        onClose={() => setShowOpnameModal(false)}
        onSuccess={() => {
          fetchItems();
          fetchPeriodicSummary();
        }}
      />

      <BulkKemasanModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => {
          setShowBulkModal(false);
          fetchItems();
          fetchPeriodicSummary();
        }}
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
    stockMin: item?.stockMin ?? 0,
    avgCost: item?.avgCost || 0,
    isPeriodic: item?.isPeriodic ?? false,
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
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Metode Pemantauan</label>
            <select 
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
              value={formData.isPeriodic ? 'true' : 'false'} 
              onChange={e => setFormData({...formData, isPeriodic: e.target.value === 'true'})}
              disabled={isLoading}
            >
              <option value="false">Harian (Perpetual) - Botol & Dus Utama (Dihitung real-time)</option>
              <option value="true">Periodik (Mingguan) - Sealtape, Wrap, Stiker (Opname mingguan)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
              Stok Minimum {formData.isPeriodic ? '(Opsional - Periodik)' : '(Alert Restock)'}
            </label>
            <NumberInput 
              className="border bg-white" 
              value={formData.stockMin} 
              onChange={(val) => setFormData({...formData, stockMin: val})}
              suffix="pcs"
              showPreview
              placeholder="0"
              disabled={isLoading}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              {formData.isPeriodic 
                ? 'Item periodik dipantau mingguan via Opname Mingguan. Stok minimum opsional.'
                : 'Alert restock muncul jika stok di bawah angka ini. Isi 0 jika item tidak memerlukan batas minimum.'}
            </p>
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
