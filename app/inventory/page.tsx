'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { Badge } from '@/components/ui/Button';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  type: 'RAW' | 'WIP' | 'PACKAGE';
  stockAwal: number;
  masukBeli: number;
  masukProduksi: number;
  keluarProduksi: number;
  keluarJual: number;
  stockAkhir: number;
  avgCost: number;
  nilaiStock: number;
}

interface InventoryData {
  kpi: {
    totalValue: number;
    raw: { value: number, count: number };
    wip: { value: number, count: number };
    package: { value: number, count: number };
  };
  items: InventoryItem[];
}

export default function InventoryDashboardPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InventoryData | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Date filters
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchInventory();
  }, [fromDate, toDate]);

  async function fetchInventory() {
    try {
      setLoading(true);
      const res = await fetch(`/api/inventory/summary?from=${fromDate}&to=${toDate}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      showToast({ message: 'Gagal memuat data inventory', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = data?.items.filter(item => {
    const matchesSearch = item.code.toLowerCase().includes(search.toLowerCase()) ||
                         item.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <div className="bg-white border-b p-6 flex justify-between items-start gap-6" style={{ borderColor: colors.neutral.border }}>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1">TAETAA COMPANY SISTEM</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard Inventory</h1>
          <p className="text-sm text-gray-500">Stock awal → masuk → keluar → stock akhir per SKU.</p>
        </div>

        <div className="flex gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Periode Dari</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="block px-3 py-2 border rounded text-sm bg-white"
              style={{ borderColor: colors.neutral.border }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Sampai</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="block px-3 py-2 border rounded text-sm bg-white"
              style={{ borderColor: colors.neutral.border }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Cari SKU</label>
            <input
              type="text"
              placeholder="Cari SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block px-4 py-2 border rounded text-sm bg-white w-48"
              style={{ borderColor: colors.neutral.border }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard
            label="NILAI TOTAL"
            value={`Rp ${(data?.kpi.totalValue || 0).toLocaleString('id-ID')}`}
            description="—"
            valueColor={colors.brand[500]}
          />
          <KPICard
            label="NILAI RAW"
            value={`Rp ${(data?.kpi.raw.value || 0).toLocaleString('id-ID')}`}
            description={`${data?.kpi.raw.count || 0} SKU`}
          />
          <KPICard
            label="NILAI WIP"
            value={`Rp ${(data?.kpi.wip.value || 0).toLocaleString('id-ID')}`}
            description={`${data?.kpi.wip.count || 0} SKU`}
          />
          <KPICard
            label="NILAI PACKAGE"
            value={`Rp ${(data?.kpi.package.value || 0).toLocaleString('id-ID')}`}
            description={`${data?.kpi.package.count || 0} SKU`}
          />
        </div>

        {/* Tabs & Table */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: colors.neutral.border }}>
          {/* Tabs */}
          <div className="flex border-b bg-gray-50/50" style={{ borderColor: colors.neutral.border }}>
            {(['all', 'RAW', 'WIP', 'PACKAGE'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTypeFilter(tab)}
                className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                  typeFilter === tab
                    ? 'bg-white border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab === 'all' ? 'Semua' : tab}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b" style={{ borderColor: colors.neutral.border }}>
                <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">NAMA</th>
                  <th className="px-4 py-3 text-center">TIPE</th>
                  <th className="px-4 py-3 text-right">STOCK AWAL</th>
                  <th className="px-4 py-3 text-right">MASUK (BELI)</th>
                  <th className="px-4 py-3 text-right">MASUK (PROD)</th>
                  <th className="px-4 py-3 text-right">KELUAR (PROD)</th>
                  <th className="px-4 py-3 text-right">KELUAR (JUAL)</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-900">STOCK AKHIR</th>
                  <th className="px-4 py-3 text-right">AVG COST</th>
                  <th className="px-4 py-3 text-right">NILAI STOCK</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-gray-400">Loading inventory data...</td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-20 text-center text-blue-500 font-medium">
                      Tidak ada data.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-bold">{item.code}</td>
                      <td className="px-4 py-3 text-gray-600 truncate max-w-[150px]">{item.name}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge type={item.type}>{item.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">{item.stockAwal.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right text-green-600">+{item.masukBeli.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right text-green-600">+{item.masukProduksi.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right text-orange-600">-{item.keluarProduksi.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right text-red-600">-{item.keluarJual.toLocaleString('id-ID')}</td>
                      <td className={`px-4 py-3 text-right font-bold ${item.stockAkhir < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.stockAkhir.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right">Rp {item.avgCost.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: colors.brand[500] }}>
                        Rp {item.nilaiStock.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
