'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/header/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { Button, Badge } from '@/components/ui/Button';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import { 
  FiPackage, 
  FiActivity, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiAlertCircle, 
  FiDatabase,
  FiInfo
} from 'react-icons/fi';

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  type: 'RAW' | 'PRODUCT' | 'PACKAGE';
  stockAwal: number;
  masukBeli: number;
  masukProduksi: number;
  keluarProduksi: number;
  keluarJual: number;
  keluarBreakage: number;
  keluarAffiliate: number;
  stockAkhir: number;
  stockMin?: number | null;
  avgCost: number;
  nilaiStock: number;
  rawBreakdown?: Array<{
    parentCode: string;
    qtyProduced: number;
    totalUsage: number;
  }> | null;
}

interface InventoryData {
  kpi: {
    totalValue: number;
    raw: { value: number, count: number };
    product: { value: number, count: number };
    package: { value: number, count: number };
  };
  items: InventoryItem[];
}

export default function InventoryDashboardPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InventoryData | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'RAW' | 'PRODUCT' | 'PACKAGE' | 'RESTOCK'>('all');
  const [viewingBreakdown, setViewingBreakdown] = useState<InventoryItem | null>(null);

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
    if (!matchesSearch) return false;

    if (typeFilter === 'RESTOCK') {
      const min = item.stockMin ?? 0;
      return min > 0 && item.stockAkhir < min;
    }

    return typeFilter === 'all' || item.type === typeFilter;
  }) || [];

  const top5ItemsSold = data?.items
    .slice()
    .sort((a, b) => b.keluarJual - a.keluarJual)
    .slice(0, 5);

  const top5LeastSoldItems = data?.items
    .slice()
    .sort((a, b) => a.keluarJual - b.keluarJual)
    .slice(0, 5);

  const top5PriorityRestock = data?.items
    .slice()
    .sort((a, b) => a.stockAkhir - b.stockAkhir)
    .slice(0, 5);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.neutral.bg }}>
      <PageHeader
        title="Dashboard Inventory"
        subtitle="Stock awal → masuk → keluar → stock akhir per SKU."
        actions={
          <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Periode</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-2 py-1.5 border rounded text-xs bg-white"
                />
                <span className="text-gray-400">s/d</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-2 py-1.5 border rounded text-xs bg-white"
                />
              </div>
            </div>
            
            <div className="space-y-1 border-l pl-4 ml-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Pencarian</label>
              <input
                type="text"
                placeholder="Cari SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block px-3 py-1.5 border rounded text-xs bg-white w-40"
              />
            </div>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Row 1: Financial KPI (Main) */}
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-2">
            <KPICard
              label="Nilai Total Inventory"
              value={`Rp ${(data?.kpi.totalValue || 0).toLocaleString('id-ID')}`}
              description="Total akumulasi nilai stock akhir dari seluruh kategori SKU (Raw, Product, Package)."
              valueColor={colors.brand[500]}
              icon={<FiDatabase size={24} />}
            />
          </div>
          <KPICard
            label="Raw Material Value"
            value={`Rp ${(data?.kpi.raw.value || 0).toLocaleString('id-ID')}`}
            description={`${data?.kpi.raw.count || 0} SKU Bahan Baku`}
            icon={<FiPackage size={20} />}
          />
          <KPICard
            label="Product & Package Value"
            value={`Rp ${((data?.kpi.product.value || 0) + (data?.kpi.package.value || 0)).toLocaleString('id-ID')}`}
            description={`${(data?.kpi.product.count || 0) + (data?.kpi.package.count || 0)} SKU Barang Jadi/Kemas`}
            icon={<FiActivity size={20} />}
          />
        </div>

        {/* Row 2: Analytics (Secondary) */}
        <div className="grid grid-cols-3 gap-6">
          <KPICard
            label="Top 5 Terlaris"
            isList={true}
            icon={<FiTrendingUp size={18} />}
            value={
              top5ItemsSold?.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: index === 0 ? colors.brand[500] : 'inherit',
                    fontWeight: index === 0 ? '800' : '400',
                  }}
                >
                  <span>{index + 1}. {item.name}</span>
                  <span style={{ opacity: 0.6, fontSize: '11px' }}>({item.keluarJual})</span>
                </div>
              )) || '-'
            }
            description="Berdasarkan volume keluar jual tertinggi"
          />
          <KPICard
            label="Top 5 Penjualan Terendah"
            isList={true}
            icon={<FiTrendingDown size={18} />}
            value={
              top5LeastSoldItems?.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: index === 0 ? colors.brand[500] : 'inherit',
                    fontWeight: index === 0 ? '800' : '400',
                  }}
                >
                  <span>{index + 1}. {item.name}</span>
                  <span style={{ opacity: 0.6, fontSize: '11px' }}>({item.keluarJual})</span>
                </div>
              )) || '-'
            }
            description="SKU dengan pergerakan keluar paling lambat"
          />
          <KPICard
            label="Prioritas Restock"
            isList={true}
            icon={<FiAlertCircle size={18} />}
            value={
              top5PriorityRestock?.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: item.stockAkhir <= 0 ? colors.semantic.red : index === 0 ? colors.brand[500] : 'inherit',
                    fontWeight: index === 0 ? '800' : '400',
                  }}
                >
                  <span>{index + 1}. {item.name}</span>
                  <span style={{ 
                    fontWeight: '700', 
                    fontSize: '12px',
                    color: item.stockAkhir <= 0 ? colors.semantic.red : 'inherit'
                  }}>
                    {item.stockAkhir}
                  </span>
                </div>
              )) || '-'
            }
            description="SKU dengan sisa stok terendah saat ini"
          />
        </div>

        {/* Tabs & Table */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: colors.neutral.border }}>
          {/* Tabs */}
          <div className="flex border-b bg-gray-50/50" style={{ borderColor: colors.neutral.border }}>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'RAW', label: 'RAW' },
              { id: 'PRODUCT', label: 'Product' },
              { id: 'PACKAGE', label: 'PACKAGE' },
              { id: 'RESTOCK', label: '⚠️ Perlu Restock' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id as any)}
                className={`px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  typeFilter === tab.id
                    ? (tab.id === 'RESTOCK' ? 'bg-white border-red-500 text-red-600' : 'bg-white border-blue-500 text-blue-600')
                    : (tab.id === 'RESTOCK' ? 'border-transparent text-red-500/80 hover:text-red-600' : 'border-transparent text-gray-400 hover:text-gray-600')
                }`}
              >
                <span>{tab.label}</span>
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
                  <th className="px-4 py-3 text-right">KELUAR (RUSAK)</th>
                  <th className="px-4 py-3 text-right">KELUAR (AFF/SEED)</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-900">STOCK AKHIR</th>
                  <th className="px-4 py-3 text-right">AVG COST</th>
                  <th className="px-4 py-3 text-right">NILAI STOCK</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
                {loading ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-12 text-center text-gray-400">Loading inventory data...</td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-20 text-center font-medium" style={{ color: typeFilter === 'RESTOCK' ? colors.semantic.green : colors.brand[500] }}>
                      {typeFilter === 'RESTOCK'
                        ? 'Semua stok masih aman, tidak ada yang perlu direstock.'
                        : 'Tidak ada data.'}
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
                      <td className="px-4 py-3 text-right text-red-400">-{item.keluarBreakage.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right text-purple-600">-{item.keluarAffiliate ? item.keluarAffiliate.toLocaleString('id-ID') : 0}</td>
                      <td className="px-4 py-3 text-right">
                        {(() => {
                          const stockMin = item.stockMin ?? 0;
                          const isRestockNeeded = stockMin > 0 && item.stockAkhir < stockMin;
                          const kurang = stockMin - item.stockAkhir;

                          return (
                            <div className="flex items-center justify-end gap-1 font-bold">
                              {item.type === 'RAW' && item.rawBreakdown && item.rawBreakdown.length > 0 && (
                                <button 
                                  onClick={() => setViewingBreakdown(item)}
                                  className="text-blue-400 hover:text-blue-600 p-1"
                                  title="Lihat Breakdown Pemakaian"
                                >
                                  <FiInfo size={12} />
                                </button>
                              )}
                              {isRestockNeeded ? (
                                <div 
                                  className="inline-flex items-center gap-1 cursor-help"
                                  style={{ color: colors.semantic.red }}
                                  title={`Stok saat ini: ${item.stockAkhir} — Stok Minimum: ${stockMin} — Kurang: ${kurang} unit`}
                                >
                                  <span>⚠️</span>
                                  <span>{item.stockAkhir.toLocaleString('id-ID')}</span>
                                </div>
                              ) : (
                                <span className="text-gray-900">
                                  {item.stockAkhir.toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                          );
                        })()}
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

      {viewingBreakdown && (
        <RawUsageModal 
          item={viewingBreakdown} 
          onClose={() => setViewingBreakdown(null)} 
        />
      )}
    </div>
  );
}

function RawUsageModal({ item, onClose }: { item: InventoryItem, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold">Breakdown Pemakaian: {item.code}</h3>
            <p className="text-xs text-gray-500">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm border-b pb-4">
            <div className="text-gray-500">Stok Awal:</div>
            <div className="text-right font-medium">{item.stockAwal.toLocaleString('id-ID')} ml</div>
            <div className="text-gray-500">Masuk (Beli):</div>
            <div className="text-right font-medium text-green-600">+{item.masukBeli.toLocaleString('id-ID')} ml</div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Dipakai Untuk:</div>
            <div className="border rounded divide-y max-h-[200px] overflow-auto">
              {item.rawBreakdown?.map((usage, idx) => (
                <div key={idx} className="p-2 flex justify-between text-sm">
                  <div>
                    <div className="font-bold">{usage.parentCode}</div>
                    <div className="text-[10px] text-gray-400">Prod: {usage.qtyProduced} unit</div>
                  </div>
                  <div className="text-red-500 font-medium">-{usage.totalUsage.toLocaleString('id-ID')} ml</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm border-t pt-4 font-bold">
            <div>Stok Akhir:</div>
            <div className="text-right">{item.stockAkhir.toLocaleString('id-ID')} ml</div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </div>
  );
}
