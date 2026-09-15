'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import { FiAlertTriangle } from 'react-icons/fi';

interface Breakage {
  id: string;
  date: string;
  sku: {
    code: string;
    name: string;
  };
  qty: number;
  category: string;
  total: number;
  notes: string | null;
}

export default function LostBreakagePage() {
  const [items, setItems] = useState<Breakage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useToast();

  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchBreakage();
  }, [fromDate, toDate]);

  async function fetchBreakage() {
    try {
      setLoading(true);
      const res = await fetch(`/api/kerugian-pengeluaran/lost-breakage?from=${fromDate}&to=${toDate}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      showToast({ message: 'Gagal memuat data kerugian', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(formData: any) {
    try {
      const res = await fetch('/api/kerugian-pengeluaran/lost-breakage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal mencatat kerugian');
      }
      showToast({ message: 'Kerugian berhasil dicatat', type: 'success' });
      setShowAddModal(false);
      fetchBreakage();
    } catch (error: any) {
      showToast({ message: error.message, type: 'error' });
    }
  }

  const totalLoss = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Lost & Breakage"
        subtitle="Catat barang rusak, hilang, atau gagal QC. Stok SKU akan otomatis berkurang."
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
            <Button variant="primary" icon="⚠️" onClick={() => setShowAddModal(true)}>
              Catat Kerugian
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="max-w-sm">
          <KPICard
            label="TOTAL KERUGIAN"
            value={`Rp ${totalLoss.toLocaleString('id-ID')}`}
            description="Qty x HPP SKU (Periode terpilih)"
            valueColor={colors.semantic.red}
            icon={<FiAlertTriangle size={20} />}
          />
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: colors.neutral.border }}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b" style={{ borderColor: colors.neutral.border }}>
              <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
                <th className="px-6 py-4 whitespace-nowrap">TANGGAL</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4 text-right">QTY</th>
                <th className="px-6 py-4">KATEGORI / ALASAN</th>
                <th className="px-6 py-4 text-right">EST. KERUGIAN (RP)</th>
                <th className="px-6 py-4">CATATAN</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-medium">Belum ada data.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{item.sku.code}</div>
                      <div className="text-[10px] text-gray-400">{item.sku.name}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-red-600">-{item.qty.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.category === 'GAGAL_QC' ? 'bg-orange-100 text-orange-600' :
                        item.category === 'RUSAK' ? 'bg-red-100 text-red-600' :
                        item.category === 'HILANG' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">
                      Rp {item.total.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-gray-500 italic text-xs">{item.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddBreakageModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
        />
      )}
    </div>
  );
}

function AddBreakageModal({ onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    skuId: '',
    qty: 0,
    category: 'RUSAK',
    notes: '',
  });
  const [skus, setSkus] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/skus')
      .then(res => res.json())
      .then(data => setSkus(data));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-bold mb-4 text-red-600">Catat Kerugian (Stok Keluar)</h3>
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
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih SKU</label>
            <select 
              className="w-full px-3 py-2 border rounded text-sm bg-white" 
              value={formData.skuId} 
              onChange={e => setFormData({...formData, skuId: e.target.value})}
            >
              <option value="">Pilih Produk...</option>
              {skus.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jumlah (Qty)</label>
              <input 
                type="number"
                className="w-full px-3 py-2 border rounded text-sm" 
                value={formData.qty} 
                onChange={e => setFormData({...formData, qty: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategori</label>
              <select 
                className="w-full px-3 py-2 border rounded text-sm bg-white" 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="GAGAL_QC">Gagal QC</option>
                <option value="RUSAK">Rusak</option>
                <option value="HILANG">Hilang</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catatan</label>
            <textarea 
              className="w-full px-3 py-2 border rounded text-sm h-20" 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Jelaskan alasan barang rusak/hilang..."
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" style={{ backgroundColor: colors.semantic.red, borderColor: colors.semantic.red }} onClick={() => onSubmit(formData)}>Simpan Kerugian</Button>
        </div>
      </div>
    </div>
  );
}
