'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

export interface BOMComponentDetail {
  id: string;
  category: 'RAW' | 'PACKING' | 'STIKER' | 'SAFETY' | 'DUS';
  quantity: number;
  consumptionType?: 'AUTOMATIC' | 'MANUAL';
  childSkuId?: string | null;
  childKemasanId?: string | null;
  childSku?: {
    id: string;
    code: string;
    name: string;
    productSize?: number;
  } | null;
  childKemasan?: {
    id: string;
    code: string;
    name: string;
    category?: string;
  } | null;
}

export interface ProductionDetail {
  id: string;
  date: string;
  outputQty: number;
  output: {
    sku: {
      id?: string;
      code: string;
      name: string;
      bomComponents?: BOMComponentDetail[];
    };
  };
  inputs: Array<{
    id: string;
    qtyUsed: number;
    inputSkuId?: string;
    inputSku: {
      id?: string;
      code: string;
      name: string;
      productSize?: number;
    };
  }>;
  notes: string | null;
}

interface ProductionDetailModalProps {
  isOpen: boolean;
  production: ProductionDetail | null;
  onClose: () => void;
}

const CATEGORIES = ['RAW', 'PACKING', 'STIKER', 'SAFETY', 'DUS'] as const;

function getManualStatus(
  bom: {
    id: string;
    childKemasanId?: string | null;
    childKemasan?: { code?: string } | null;
    childSku?: { code?: string } | null;
  },
  notes: string | null | undefined
): boolean {
  if (!notes) return false;

  // 1. Try reading [MANUAL_CONSUMPTIONS:{...}] structured tag
  const match = notes.match(/\[MANUAL_CONSUMPTIONS:(.*?)\]/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (bom.childKemasanId && parsed[bom.childKemasanId] !== undefined) {
        return !!parsed[bom.childKemasanId];
      }
      const code = (bom.childKemasan?.code || bom.childSku?.code || '').toUpperCase();
      if (code && parsed[code] !== undefined) {
        return !!parsed[code];
      }
    } catch (e) {
      // ignore json parse error
    }
  }

  // 2. Fallback: Check human-readable notes from seed or manual entry
  // e.g. "SLTP dicentang", "PLWR tidak dicentang"
  const itemCode = (bom.childKemasan?.code || bom.childSku?.code || '').toLowerCase();
  if (itemCode) {
    const lowerNotes = notes.toLowerCase();
    if (lowerNotes.includes(`${itemCode} tidak dicentang`)) {
      return false;
    }
    if (lowerNotes.includes(`${itemCode} dicentang`)) {
      return true;
    }
  }

  return false;
}

export function ProductionDetailModal({
  isOpen,
  production,
  onClose,
}: ProductionDetailModalProps) {
  const [detail, setDetail] = useState<ProductionDetail | null>(production);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && production?.id) {
      setDetail(production);
      let isMounted = true;
      setLoading(true);

      fetch(`/api/productions/${production.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data && !data.error) {
            setDetail(data);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch detailed production info:', err);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    } else if (!isOpen) {
      setDetail(null);
    }
  }, [isOpen, production?.id]);

  if (!isOpen || !production) return null;

  const activeProduction = detail || production;
  const bomComponents = activeProduction.output?.sku?.bomComponents || [];
  const inputs = activeProduction.inputs || [];

  // Prepare grouped items per category
  const categorizedItems = CATEGORIES.map((cat) => {
    if (cat === 'RAW') {
      const items: Array<{
        id: string;
        code: string;
        name: string;
        qtyUsed: number;
        unit: string;
        productSize?: number;
        consumptionType: string;
        category: string;
        isManual?: boolean;
        isManualChecked?: boolean;
      }> = [];

      // If inputs recorded in DB exist, prioritize actual recorded consumption
      if (inputs.length > 0) {
        inputs.forEach((inp) => {
          const matchingBom = bomComponents.find(
            (b) => b.childSkuId === inp.inputSkuId || b.childSku?.code === inp.inputSku?.code
          );
          items.push({
            id: inp.id,
            code: inp.inputSku?.code || '—',
            name: inp.inputSku?.name || '—',
            qtyUsed: inp.qtyUsed,
            unit: 'unit',
            productSize: inp.inputSku?.productSize,
            consumptionType: matchingBom?.consumptionType || 'AUTOMATIC',
            category: 'RAW',
            isManual: false,
          });
        });

        // Also check if any RAW BOM components weren't captured in inputs
        bomComponents
          .filter((b) => b.category === 'RAW')
          .forEach((bom) => {
            const alreadyIncluded = items.some(
              (it) => it.code === (bom.childSku?.code || '')
            );
            if (!alreadyIncluded && bom.childSku) {
              items.push({
                id: bom.id,
                code: bom.childSku.code,
                name: bom.childSku.name,
                qtyUsed: bom.quantity * activeProduction.outputQty,
                unit: 'unit',
                productSize: bom.childSku.productSize,
                consumptionType: bom.consumptionType || 'AUTOMATIC',
                category: 'RAW',
                isManual: false,
              });
            }
          });
      } else {
        // Fallback to BOM definition if inputs array is empty
        bomComponents
          .filter((b) => b.category === 'RAW')
          .forEach((bom) => {
            const item = bom.childSku;
            items.push({
              id: bom.id,
              code: item?.code || '—',
              name: item?.name || '—',
              qtyUsed: bom.quantity * activeProduction.outputQty,
              unit: 'unit',
              productSize: item?.productSize,
              consumptionType: bom.consumptionType || 'AUTOMATIC',
              category: 'RAW',
              isManual: false,
            });
          });
      }

      return { category: cat, items };
    } else {
      // Packaging / Kemasan categories: PACKING, STIKER, SAFETY, DUS
      const matchingBoms = bomComponents.filter((b) => b.category === cat);
      const items = matchingBoms.map((bom) => {
        const item = bom.childKemasan || bom.childSku;
        const isManual = bom.consumptionType === 'MANUAL';
        const isManualChecked = isManual ? getManualStatus(bom, activeProduction.notes) : false;
        const qtyUsed = isManual ? (isManualChecked ? 1 : 0) : bom.quantity * activeProduction.outputQty;

        return {
          id: bom.id,
          code: item?.code || '—',
          name: item?.name || '—',
          qtyUsed,
          unit: 'pcs',
          productSize: undefined as number | undefined,
          consumptionType: bom.consumptionType || 'AUTOMATIC',
          category: cat,
          isManual,
          isManualChecked,
          ratioPerUnit: bom.quantity,
        };
      });

      return { category: cat, items };
    }
  });

  const totalItemsCount = categorizedItems.reduce((sum, c) => sum + c.items.length, 0);
  const displayNotes = activeProduction.notes?.replace(/\[MANUAL_CONSUMPTIONS:.*?\]/g, '').trim();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div
        className="rounded-lg p-6 w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]"
        style={{ backgroundColor: colors.neutral.card }}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b" style={{ borderColor: colors.neutral.border }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: colors.neutral.textStrong }}>
              Detail Produksi
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Rincian hasil output dan seluruh komponen (RAW & Kemasan) yang terpakai pada sesi produksi ini.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1 rounded hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {/* Production Info Cards */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg border bg-gray-50/70"
            style={{ borderColor: colors.neutral.border }}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tanggal Produksi</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {new Date(activeProduction.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Output SKU</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{activeProduction.output.sku.code}</p>
              <p className="text-xs text-gray-500 truncate" title={activeProduction.output.sku.name}>
                {activeProduction.output.sku.name}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Jumlah Output</p>
              <p className="text-lg font-bold mt-0.5" style={{ color: colors.brand[500] }}>
                {activeProduction.outputQty.toLocaleString('id-ID')} <span className="text-xs font-semibold text-gray-500">unit</span>
              </p>
            </div>
          </div>

          {displayNotes && (
            <div className="p-3 rounded-lg border bg-amber-50/50 border-amber-200/60 text-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-0.5">Catatan</p>
              <p className="text-gray-700 italic">{displayNotes}</p>
            </div>
          )}

          {/* Section: Komponen Terpakai */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Komponen Terpakai
              </p>
              {loading && (
                <span className="text-[10px] text-gray-400 italic">
                  Memperbarui data...
                </span>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden divide-y divide-gray-100" style={{ borderColor: colors.neutral.border }}>
              {totalItemsCount === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400 italic">
                  {loading ? 'Memuat komponen terpakai...' : 'Tidak ada komponen yang terpakai atau resep BOM belum dikonfigurasi.'}
                </div>
              ) : (
                categorizedItems.map(({ category, items }) => {
                  if (items.length === 0) return null;

                  return (
                    <div key={category} className="bg-white">
                      {/* Section Header consistent with Master SKU Lihat BOM */}
                      <div className="bg-gray-50 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] border-b flex justify-between items-center">
                        <span>{category}</span>
                        <span className="text-[10px] font-semibold text-gray-400 lowercase">{items.length} item</span>
                      </div>

                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100 bg-white">
                            <th className="px-4 py-2">Kode</th>
                            <th className="px-4 py-2">Nama</th>
                            <th className="px-4 py-2 text-right">Qty Terpakai</th>
                            <th className="px-4 py-2 text-center">Tipe Konsumsi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-2.5 font-mono text-xs font-bold text-gray-700">
                                {item.code}
                              </td>
                              <td className="px-4 py-2.5 text-gray-600 text-xs sm:text-sm">
                                {item.name}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                                {category === 'RAW' ? (
                                  <div>
                                    <span>
                                      {item.qtyUsed.toLocaleString('id-ID', { maximumFractionDigits: 4 })} unit
                                    </span>
                                    {item.productSize ? (
                                      <span className="block text-[10px] text-gray-500 font-normal">
                                        (~{item.qtyUsed * item.productSize >= 1000
                                          ? `${((item.qtyUsed * item.productSize) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} L`
                                          : `${Math.round(item.qtyUsed * item.productSize).toLocaleString('id-ID')} ml`})
                                      </span>
                                    ) : null}
                                  </div>
                                ) : item.isManual ? (
                                  item.isManualChecked ? (
                                    <span className="text-emerald-700 font-semibold text-xs">
                                      ✓ Dicentang habis — 1 pcs terpakai
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 font-medium text-xs">
                                      ☐ Tidak dicentang — 0 pcs terpakai (stok tidak berubah)
                                    </span>
                                  )
                                ) : (
                                  <div>
                                    <span>
                                      {item.qtyUsed.toLocaleString('id-ID', { maximumFractionDigits: 2 })}{' '}
                                      <span className="text-[10px] text-gray-400 font-medium uppercase">
                                        {item.unit}
                                      </span>
                                    </span>
                                    {'ratioPerUnit' in item && item.ratioPerUnit && item.ratioPerUnit !== 1 ? (
                                      <span className="block text-[10px] text-gray-400 font-normal">
                                        (@ {item.ratioPerUnit} {item.unit}/unit)
                                      </span>
                                    ) : null}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    item.consumptionType === 'MANUAL'
                                      ? 'bg-orange-100 text-orange-600'
                                      : 'bg-blue-100 text-blue-600'
                                  }`}
                                >
                                  {item.consumptionType || 'AUTOMATIC'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t flex justify-end" style={{ borderColor: colors.neutral.border }}>
          <Button variant="primary" onClick={onClose} style={{ minWidth: '120px' }}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
