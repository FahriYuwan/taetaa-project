'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { Button } from '@/components/ui/Button';
import { AddSaleModal } from '@/components/modals/AddSaleModal';
import { BulkSaleModal } from '@/components/modals/BulkSaleModal';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';

interface Sale {
  id: string;
  date: string;
  channel: string;
  orderId: string | null;
  sku: {
    code: string;
    name: string;
  };
  qty: number;
  unitPrice: number;
  total: number;
  fee: number;
  netRevenue: number;
  notes: string | null;
  // Temporary: calculating HPP based on current data for display
  estimatedHpp?: number;
}

export default function PenjualanPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [channelFilter, setChannelFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSales();
  }, [channelFilter]);

  async function fetchSales() {
    try {
      setLoading(true);
      const url = channelFilter === 'all'
        ? '/api/sales'
        : `/api/sales?channel=${channelFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Here we could fetch avgCost for each SKU if we wanted real-time HPP display
        setSales(data);
      }
    } catch (error) {
      showToast({ message: 'Gagal memuat data penjualan', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSale(formData: any) {
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal mencatat penjualan');
      }

      showToast({ message: 'Penjualan berhasil dicatat', type: 'success' });
      setShowAddModal(false);
      fetchSales();
    } catch (error: any) {
      throw error;
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Penjualan Marketplace"
        subtitle="Catat transaksi penjualan beserta potongan biaya. Pendapatan bersih & laba dihitung otomatis."
        actions={
          <div className="flex gap-3">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-4 py-2 rounded border text-sm bg-white"
              style={{ borderColor: colors.neutral.border }}
            >
              <option value="all">Semua Channel</option>
              <option value="SHOPEE">Shopee</option>
              <option value="TIKTOK">TikTok Shop</option>
              <option value="OFFLINE">Offline</option>
              <option value="AFFILIATE">Affiliate</option>
            </select>
            <Button variant="secondary" icon="📋" onClick={() => setShowBulkModal(true)}>
              Bulk Paste
            </Button>
            <Button variant="primary" icon="➕" onClick={() => setShowAddModal(true)}>
              Catat Penjualan
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div
          className="rounded-lg border bg-white shadow-sm overflow-x-auto"
          style={{ borderColor: colors.neutral.border }}
        >
          <table className="w-full text-sm min-w-[1200px]">
            <thead className="bg-gray-50 border-b" style={{ borderColor: colors.neutral.border }}>
              <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
                <th className="px-6 py-4 whitespace-nowrap">TANGGAL</th>
                <th className="px-6 py-4">MARKETPLACE</th>
                <th className="px-6 py-4">ORDER ID</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4 text-right">QTY</th>
                <th className="px-6 py-4 text-right">HARGA</th>
                <th className="px-6 py-4 text-right">GROSS</th>
                <th className="px-6 py-4 text-right">BIAYA</th>
                <th className="px-6 py-4 text-right">NET REV</th>
                <th className="px-6 py-4 text-right">LABA</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400">Loading data...</td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-20 text-center text-blue-500 font-medium">
                    Belum ada penjualan.
                  </td>
                </tr>
              ) : (
                sales.map((s) => {
                  // Simplified Laba calculation for display using a placeholder or current HPP if available
                  // In a real implementation, the HPP would be snapshotted in the database.
                  const estimatedHpp = 0; // Placeholder
                  const laba = s.netRevenue - estimatedHpp;

                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(s.date).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          s.channel === 'SHOPEE' ? 'bg-orange-100 text-orange-600' :
                          s.channel === 'TIKTOK' ? 'bg-gray-100 text-gray-800' :
                          s.channel === 'OFFLINE' ? 'bg-blue-100 text-blue-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {s.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{s.orderId || '—'}</td>
                      <td className="px-6 py-4 font-bold">{s.sku.code}</td>
                      <td className="px-6 py-4 text-right">{s.qty.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right">Rp {s.unitPrice.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right">Rp {s.total.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right text-red-400">Rp {s.fee.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right font-bold" style={{ color: colors.brand[500] }}>
                        Rp {s.netRevenue.toLocaleString('id-ID')}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${laba >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {laba !== 0 ? `Rp ${laba.toLocaleString('id-ID')}` : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddSaleModal
        isOpen={showAddModal}
        onSubmit={handleAddSale}
        onCancel={() => setShowAddModal(false)}
      />

      <BulkSaleModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => {
          setShowBulkModal(false);
          fetchSales();
        }}
      />
    </div>
  );
}
