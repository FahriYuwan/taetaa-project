'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import { FiDollarSign } from 'react-icons/fi';

interface Sale {
  id: string;
  date: string;
  sku: {
    code: string;
    name: string;
    hppPrice: number;
  };
  qty: number;
  unitPrice: number;
  total: number;
  fee: number;
  netRevenue: number;
}

export default function AffiliatePage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchAffiliateSales();
  }, [fromDate, toDate]);

  async function fetchAffiliateSales() {
    try {
      setLoading(true);
      const res = await fetch(`/api/sales?channel=AFFILIATE&from=${fromDate}&to=${toDate}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (error) {
      showToast({ message: 'Gagal memuat data affiliate', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const totalHPP = sales.reduce((sum, s) => sum + (s.qty * (s.sku.hppPrice || 0)), 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Penjualan Affiliate"
        subtitle="Daftar transaksi khusus channel Affiliate."
        actions={
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
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="max-w-sm">
          <KPICard
            label="TOTAL BIAYA (HPP) YANG DIKELUARKAN"
            value={`Rp ${totalHPP.toLocaleString('id-ID')}`}
            description="Akumulasi HPP periode terpilih"
            valueColor={colors.semantic.orange}
            icon={<FiDollarSign size={20} />}
          />
        </div>

        <div
          className="rounded-lg border bg-white shadow-sm overflow-x-auto"
          style={{ borderColor: colors.neutral.border }}
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b" style={{ borderColor: colors.neutral.border }}>
              <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
                <th className="px-6 py-4">TANGGAL</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">NAMA</th>
                <th className="px-6 py-4 text-right">QTY</th>
                <th className="px-6 py-4 text-right">HPP</th>
                <th className="px-6 py-4 text-right">GROSS</th>
                <th className="px-6 py-4 text-right">BIAYA</th>
                <th className="px-6 py-4 text-right">NET REV</th>
                <th className="px-6 py-4 text-right">LABA</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-20 text-center text-gray-400 font-medium">Belum ada data.</td></tr>
              ) : (
                sales.map((s) => {
                  const hpp = s.qty * (s.sku.hppPrice || 0);
                  const laba = s.netRevenue - hpp;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(s.date).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4 font-bold">{s.sku.code}</td>
                      <td className="px-6 py-4 text-gray-600 truncate max-w-[150px]">{s.sku.name}</td>
                      <td className="px-6 py-4 text-right font-bold">{s.qty.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right text-orange-600 font-medium">Rp {hpp.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right">Rp {s.total.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right text-red-400">Rp {s.fee.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right font-bold" style={{ color: colors.brand[500] }}>
                        Rp {s.netRevenue.toLocaleString('id-ID')}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${laba >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Rp {laba.toLocaleString('id-ID')}
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
  );
}
