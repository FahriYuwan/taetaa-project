'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { AddAffiliateActivityModal } from '@/components/modals/AddAffiliateActivityModal';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import { FiTrendingUp, FiGift, FiLayers, FiTrash2, FiPlus } from 'react-icons/fi';

interface AffiliateItem {
  id: string;
  date: string;
  activityType: 'AFFILIATE' | 'NON_AFFILIATE';
  accountUsername: string | null;
  realName: string | null;
  sku: {
    id: string;
    code: string;
    name: string;
    hppPrice: number;
  };
  qty: number;
  courier: string | null;
  shippingCost: number;
  marketplace: string | null;
  followers: string | null;
  affiliateData: string | null;
  notes: string | null;
  hppUnit: number;
  hppTerpakai: number;
  totalBiaya: number;
}

interface SummaryData {
  affiliate: {
    count: number;
    qty: number;
    hpp: number;
    shipping: number;
    totalBiaya: number;
  };
  nonAffiliate: {
    count: number;
    qty: number;
    hpp: number;
    shipping: number;
    totalBiaya: number;
  };
  total: {
    count: number;
    qty: number;
    hpp: number;
    shipping: number;
    totalBiaya: number;
  };
}

export default function AffiliatePage() {
  const [items, setItems] = useState<AffiliateItem[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    affiliate: { count: 0, qty: 0, hpp: 0, shipping: 0, totalBiaya: 0 },
    nonAffiliate: { count: 0, qty: 0, hpp: 0, shipping: 0, totalBiaya: 0 },
    total: { count: 0, qty: 0, hpp: 0, shipping: 0, totalBiaya: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchActivities();
  }, [fromDate, toDate]);

  async function fetchActivities() {
    try {
      setLoading(true);
      const res = await fetch(`/api/affiliate?from=${fromDate}&to=${toDate}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (data.summary) setSummary(data.summary);
      } else {
        showToast({ message: 'Gagal memuat data aktivitas affiliate', type: 'error' });
      }
    } catch (error) {
      showToast({ message: 'Terjadi kesalahan jaringan', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddActivity(formData: any) {
    try {
      const res = await fetch('/api/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mencatat aktivitas');
      }

      showToast({ message: 'Aktivitas berhasil dicatat & stok dikurangi', type: 'success' });
      setShowAddModal(false);
      fetchActivities();
    } catch (error: any) {
      throw error;
    }
  }

  async function handleDeleteActivity() {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/affiliate/${deletingId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus aktivitas');
      }

      showToast({ message: 'Aktivitas dihapus & stok dikembalikan', type: 'success' });
      setDeletingId(null);
      fetchActivities();
    } catch (error: any) {
      showToast({ message: error.message || 'Gagal menghapus', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Aktivitas Affiliate & Seeding"
        subtitle="Pencatatan barang keluar untuk promosi Affiliate dan Non-Affiliate. Terintegrasi langsung dengan mutasi stok SKU."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border" style={{ borderColor: colors.neutral.border }}>
              <span className="text-xs text-gray-500 font-medium">Periode:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs text-gray-700 focus:outline-none"
              />
              <span className="text-xs text-gray-400">s/d</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-xs text-gray-700 focus:outline-none"
              />
            </div>
            <Button variant="primary" icon={<FiPlus size={16} />} onClick={() => setShowAddModal(true)}>
              Catat Aktivitas
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            label="TOTAL AFFILIATE"
            value={`Rp ${summary.affiliate.totalBiaya.toLocaleString('id-ID')}`}
            description={`${summary.affiliate.count} aktivitas • ${summary.affiliate.qty} unit (HPP: Rp ${summary.affiliate.hpp.toLocaleString('id-ID')}, Ongkir: Rp ${summary.affiliate.shipping.toLocaleString('id-ID')})`}
            valueColor={colors.brand[500]}
            icon={<FiTrendingUp size={20} />}
          />
          <KPICard
            label="TOTAL NON-AFFILIATE"
            value={`Rp ${summary.nonAffiliate.totalBiaya.toLocaleString('id-ID')}`}
            description={`${summary.nonAffiliate.count} aktivitas • ${summary.nonAffiliate.qty} unit (HPP: Rp ${summary.nonAffiliate.hpp.toLocaleString('id-ID')}, Ongkir: Rp ${summary.nonAffiliate.shipping.toLocaleString('id-ID')})`}
            valueColor={colors.semantic.orange}
            icon={<FiGift size={20} />}
          />
          <KPICard
            label="TOTAL KESELURUHAN"
            value={`Rp ${summary.total.totalBiaya.toLocaleString('id-ID')}`}
            description={`${summary.total.count} aktivitas • ${summary.total.qty} unit dikeluarkan (Total HPP: Rp ${summary.total.hpp.toLocaleString('id-ID')})`}
            valueColor={colors.neutral.textStrong}
            icon={<FiLayers size={20} />}
          />
        </div>

        {/* Spreadsheet-style Table */}
        <div
          className="rounded-lg border bg-white shadow-xs overflow-hidden"
          style={{ borderColor: colors.neutral.border }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b text-[10px] font-bold uppercase tracking-wider text-gray-500" style={{ borderColor: colors.neutral.border }}>
                <tr>
                  <th className="px-3 py-3 whitespace-nowrap">TANGGAL</th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">TIPE</th>
                  <th className="px-3 py-3 whitespace-nowrap">AKUN / USERNAME</th>
                  <th className="px-3 py-3 whitespace-nowrap">NAMA ASLI</th>
                  <th className="px-3 py-3 whitespace-nowrap">SKU PRODUK</th>
                  <th className="px-3 py-3 text-right whitespace-nowrap">QTY</th>
                  <th className="px-3 py-3 whitespace-nowrap">EKSPEDISI</th>
                  <th className="px-3 py-3 text-right whitespace-nowrap">ONGKIR</th>
                  <th className="px-3 py-3 whitespace-nowrap">MARKETPLACE</th>
                  <th className="px-3 py-3 whitespace-nowrap">FOLLOWERS</th>
                  <th className="px-3 py-3 whitespace-nowrap">DATA AFFILIATE</th>
                  <th className="px-3 py-3 whitespace-nowrap min-w-[140px]">KETERANGAN</th>
                  <th className="px-3 py-3 text-right whitespace-nowrap">HPP TERPAKAI</th>
                  <th className="px-3 py-3 text-right whitespace-nowrap font-bold text-gray-900">TOTAL BIAYA</th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
                {loading ? (
                  <tr>
                    <td colSpan={15} className="px-6 py-12 text-center text-gray-400">
                      Memuat data aktivitas...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="px-6 py-16 text-center text-gray-400 font-medium">
                      Belum ada data aktivitas untuk periode ini. Klik <strong>Catat Aktivitas</strong> untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isAffiliate = item.activityType === 'AFFILIATE';
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-3 py-2.5 whitespace-nowrap font-medium text-gray-700">
                          {new Date(item.date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          {isAffiliate ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Affiliate
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Non-Affiliate
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-bold text-gray-900">
                          {item.accountUsername || <span className="text-gray-300 font-normal">-</span>}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">
                          {item.realName || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="font-semibold text-gray-800">{item.sku?.code}</span>
                          <span className="text-gray-500 text-[11px] block">{item.sku?.name}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-gray-900 whitespace-nowrap">
                          {item.qty.toLocaleString('id-ID')}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">
                          {item.courier || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
                          Rp {item.shippingCost.toLocaleString('id-ID')}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">
                          {item.marketplace || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">
                          {item.followers || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">
                          {item.affiliateData || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-3 py-2.5 text-gray-700 font-medium">
                          {item.notes || <span className="text-gray-300 font-normal">-</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right text-orange-600 font-medium whitespace-nowrap">
                          Rp {item.hppTerpakai.toLocaleString('id-ID')}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-blue-700 whitespace-nowrap">
                          Rp {item.totalBiaya.toLocaleString('id-ID')}
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                            title="Hapus Aktivitas"
                          >
                            <FiTrash2 size={14} />
                          </button>
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

      {/* Add Modal */}
      <AddAffiliateActivityModal
        isOpen={showAddModal}
        onSubmit={handleAddActivity}
        onCancel={() => setShowAddModal(false)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Hapus Aktivitas"
        message="Yakin ingin menghapus aktivitas ini? Stok SKU akan otomatis dikembalikan ke sistem inventori."
        confirmText={isDeleting ? 'Menghapus...' : 'Hapus & Kembalikan Stok'}
        cancelText="Batal"
        variant="danger"
        onConfirm={handleDeleteActivity}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
