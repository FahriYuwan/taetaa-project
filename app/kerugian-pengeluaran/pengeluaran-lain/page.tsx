'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import { FiDollarSign } from 'react-icons/fi';

interface Expense {
  id: string;
  date: string;
  category: string;
  recipient: string;
  amount: number;
  notes: string | null;
}

export default function PengeluaranLainPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { showToast } = useToast();

  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchExpenses();
  }, [fromDate, toDate]);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const res = await fetch(`/api/expenses?from=${fromDate}&to=${toDate}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (error) {
      showToast({ message: 'Gagal memuat data pengeluaran', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExpense(formData: any) {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal mencatat pengeluaran');
      }
      showToast({ message: 'Pengeluaran berhasil dicatat', type: 'success' });
      setShowAddModal(false);
      fetchExpenses();
    } catch (error: any) {
      showToast({ message: error.message, type: 'error' });
    }
  }

  async function handleEditExpense(id: string, formData: any) {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal memperbarui pengeluaran');
      }
      showToast({ message: 'Pengeluaran berhasil diperbarui', type: 'success' });
      setEditingExpense(null);
      fetchExpenses();
    } catch (error: any) {
      showToast({ message: error.message, type: 'error' });
    }
  }

  async function handleDeleteExpense(id: string) {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal menghapus pengeluaran');
      }
      showToast({ message: 'Pengeluaran berhasil dihapus', type: 'success' });
      setDeleteConfirmId(null);
      fetchExpenses();
    } catch (error: any) {
      showToast({ message: error.message, type: 'error' });
    }
  }

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Pengeluaran Lain"
        subtitle="Catat pengeluaran di luar alur bisnis inti (bonus, compliment, dll)."
        actions={
          <div className="flex gap-3">
            <div className="flex gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border rounded text-xs bg-white"
              />
              <span className="self-center text-gray-400">s/d</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border rounded text-xs bg-white"
              />
            </div>
            <Button variant="primary" icon="➕" onClick={() => setShowAddModal(true)}>
              Catat Pengeluaran
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="max-w-sm">
          <KPICard
            label="TOTAL PENGELUARAN"
            value={`Rp ${totalExpense.toLocaleString('id-ID')}`}
            description="Total pengeluaran periode terpilih"
            valueColor={colors.semantic.red}
            icon={<FiDollarSign size={20} />}
          />
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: colors.neutral.border }}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b" style={{ borderColor: colors.neutral.border }}>
              <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
                <th className="px-6 py-4">TANGGAL</th>
                <th className="px-6 py-4">KATEGORI</th>
                <th className="px-6 py-4">PENERIMA</th>
                <th className="px-6 py-4 text-right">JUMLAH (RP)</th>
                <th className="px-6 py-4">KETERANGAN</th>
                <th className="px-6 py-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-medium">Belum ada data.</td></tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(e.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        e.category === 'BONUS' ? 'bg-green-100 text-green-600' :
                        e.category === 'COMPLIMENT' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{e.recipient}</td>
                    <td className="px-6 py-4 text-right font-bold" style={{ color: colors.semantic.red }}>
                      Rp {e.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-gray-500 italic">{e.notes || '—'}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingExpense(e)}
                        >
                          ✏️ Edit
                        </Button>
                        <button
                          onClick={() => setDeleteConfirmId(e.id)}
                          className="px-3 py-1.5 rounded text-xs font-semibold border transition-colors text-red-600 border-red-200 hover:bg-red-50 hover:border-red-400"
                          title="Hapus pengeluaran"
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddModal || editingExpense) && (
        <ExpenseModal
          initialData={editingExpense}
          onClose={() => {
            setShowAddModal(false);
            setEditingExpense(null);
          }}
          onSubmit={editingExpense ? (data: any) => handleEditExpense(editingExpense.id, data) : handleAddExpense}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Hapus Pengeluaran"
        message="Yakin ingin menghapus catatan pengeluaran ini? Aksi tidak bisa dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        onConfirm={() => deleteConfirmId && handleDeleteExpense(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

function ExpenseModal({ initialData, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    date: initialData ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    category: initialData ? initialData.category : 'BONUS',
    recipient: initialData ? initialData.recipient : '',
    amount: initialData ? initialData.amount : 0,
    notes: initialData?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.recipient.trim()) {
      alert('Nama penerima wajib diisi');
      return;
    }
    if (formData.amount <= 0) {
      alert('Jumlah (Rp) harus lebih besar dari 0');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-bold mb-4">
          {initialData ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal</label>
            <input 
              type="date"
              className="w-full px-3 py-2 border rounded text-sm" 
              value={formData.date} 
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategori</label>
            <select 
              className="w-full px-3 py-2 border rounded text-sm bg-white" 
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option value="BONUS">Bonus Pegawai</option>
              <option value="COMPLIMENT">Compliment / Hadiah</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Penerima</label>
            <input 
              className="w-full px-3 py-2 border rounded text-sm" 
              value={formData.recipient} 
              onChange={e => setFormData({...formData, recipient: e.target.value})}
              placeholder="Nama penerima..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jumlah (Rp)</label>
            <input 
              type="number"
              className="w-full px-3 py-2 border rounded text-sm" 
              value={formData.amount} 
              onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Keterangan</label>
            <textarea 
              className="w-full px-3 py-2 border rounded text-sm h-20" 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Catatan tambahan..."
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Menyimpan...' : (initialData ? 'Simpan Perubahan' : 'Simpan')}
          </Button>
        </div>
      </div>
    </div>
  );
}
