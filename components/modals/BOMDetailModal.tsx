'use client';

import React from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

export interface BOMComponentDetail {
  id: string;
  category: 'RAW' | 'PACKING' | 'STIKER' | 'SAFETY' | 'DUS';
  quantity: number;
  consumptionType?: 'AUTOMATIC' | 'MANUAL';
  unitCost?: number;
  totalCost?: number;
  childSkuId?: string | null;
  childKemasanId?: string | null;
  childName?: string;
  childCode?: string;
  childProductSize?: number;
  childSku?: {
    id: string;
    code: string;
    name: string;
    productSize?: number;
    hppPrice?: number;
  } | null;
  childKemasan?: {
    id: string;
    code: string;
    name: string;
    category?: string;
    avgCost?: number;
  } | null;
}

export interface SKUDetail {
  id: string;
  code: string;
  name: string;
  type: 'RAW' | 'PRODUCT' | 'PACKAGE';
  productSize?: number;
  unit?: string;
  hppPrice?: number;
  avgCost?: number;
  sellingPrice?: number;
  stock?: number;
  stockMin?: number | null;
  rawCost?: number;
  packagingCost?: number;
  estimatedBomHpp?: number;
  bomComponents?: BOMComponentDetail[];
}

interface BOMDetailModalProps {
  isOpen: boolean;
  sku: SKUDetail | null;
  onClose: () => void;
}

function formatRp(num: number | undefined | null): string {
  const val = Number(num) || 0;
  if (val === 0) return 'Rp 0';
  return `Rp ${val % 1 === 0 ? val.toLocaleString('id-ID') : val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BOMDetailModal({ isOpen, sku, onClose }: BOMDetailModalProps) {
  if (!isOpen || !sku) return null;

  const currentHpp = sku.avgCost ?? sku.hppPrice ?? 0;

  let calcRawCost = 0;
  let calcPackagingCost = 0;

  const components = (sku.bomComponents || []).map((comp) => {
    let unitCost = comp.unitCost ?? 0;
    if (unitCost === 0) {
      if (comp.category === 'RAW' && comp.childSku) {
        unitCost = comp.childSku.hppPrice ?? 0;
      } else if (comp.childKemasan) {
        unitCost = comp.childKemasan.avgCost ?? 0;
      }
    }

    const totalCost = comp.totalCost ?? comp.quantity * unitCost;

    if (comp.category === 'RAW') {
      calcRawCost += totalCost;
    } else {
      calcPackagingCost += totalCost;
    }

    return {
      ...comp,
      unitCost,
      totalCost,
    };
  });

  const rawSubtotal = sku.type === 'RAW' ? currentHpp : (sku.rawCost ?? calcRawCost);
  const packagingSubtotal = sku.packagingCost ?? calcPackagingCost;
  const totalBomHpp = rawSubtotal + packagingSubtotal;

  const rawItems = components.filter((c) => c.category === 'RAW');
  const packagingItems = components.filter((c) => c.category !== 'RAW');

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh] border"
        style={{ borderColor: colors.neutral.border }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-start justify-between bg-gray-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-gray-900 bg-gray-200/80 px-2 py-0.5 rounded">
                {sku.code}
              </span>
              <span className="text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded">
                {sku.type}
              </span>
              {sku.productSize && sku.productSize > 0 ? (
                <span className="text-[11px] text-gray-500 font-mono">
                  {sku.unit === 'pcs'
                    ? `${sku.productSize} pcs`
                    : sku.productSize >= 1000
                    ? `${sku.productSize / 1000} L`
                    : `${sku.productSize} ml`}
                </span>
              ) : null}
            </div>
            <h2 className="text-base font-bold text-gray-900 leading-snug">{sku.name}</h2>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="Tutup (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-5">
          {components.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              Belum ada komponen resep BOM untuk SKU ini.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 tracking-wider border-b">
                    <th className="px-3.5 py-2.5">Komponen</th>
                    <th className="px-2.5 py-2.5 text-center">Kategori</th>
                    <th className="px-3 py-2.5 text-right">Kebutuhan</th>
                    <th className="px-3 py-2.5 text-right">Biaya Satuan</th>
                    <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Section 1: Bahan Mentah */}
                  {sku.type === 'RAW' ? (
                    <>
                      <tr className="bg-gray-50/50 font-semibold text-[11px] text-gray-700">
                        <td colSpan={4} className="px-3.5 py-1.5">
                          Bahan Baku / Produk Utama (RAW)
                        </td>
                        <td className="px-3.5 py-1.5 text-right font-mono font-bold text-gray-900">
                          {formatRp(rawSubtotal)}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/40">
                        <td className="px-3.5 py-2">
                          <span className="font-mono font-semibold text-gray-900 mr-2">{sku.code}</span>
                          <span className="text-gray-600">{sku.name}</span>
                        </td>
                        <td className="px-2.5 py-2 text-center text-[10px] text-gray-500">RAW</td>
                        <td className="px-3 py-2 text-right font-mono text-gray-700">1 unit</td>
                        <td className="px-3 py-2 text-right font-mono text-gray-600">{formatRp(rawSubtotal)}</td>
                        <td className="px-3.5 py-2 text-right font-mono font-bold text-gray-900">{formatRp(rawSubtotal)}</td>
                      </tr>
                    </>
                  ) : rawItems.length > 0 && (
                    <>
                      <tr className="bg-gray-50/50 font-semibold text-[11px] text-gray-700">
                        <td colSpan={4} className="px-3.5 py-1.5">
                          Bahan Baku Cair (RAW)
                        </td>
                        <td className="px-3.5 py-1.5 text-right font-mono font-bold text-gray-900">
                          {formatRp(rawSubtotal)}
                        </td>
                      </tr>
                      {rawItems.map((comp) => {
                        const code = comp.childCode || comp.childSku?.code || '-';
                        const name = comp.childName || comp.childSku?.name || 'Bahan';
                        return (
                          <tr key={comp.id} className="hover:bg-gray-50/40">
                            <td className="px-3.5 py-2">
                              <span className="font-mono font-semibold text-gray-900 mr-2">{code}</span>
                              <span className="text-gray-600">{name}</span>
                            </td>
                            <td className="px-2.5 py-2 text-center text-[10px] text-gray-500">RAW</td>
                            <td className="px-3 py-2 text-right font-mono text-gray-700">
                              {comp.quantity} unit
                              {comp.childProductSize ? (
                                <span className="block text-[10px] text-gray-400 font-normal">
                                  ({Math.round(comp.quantity * comp.childProductSize)} ml)
                                </span>
                              ) : null}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-gray-600">
                              {formatRp(comp.unitCost)}
                            </td>
                            <td className="px-3.5 py-2 text-right font-mono font-bold text-gray-900">
                              {formatRp(comp.totalCost)}
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}

                  {/* Section 2: Kemasan & Safety */}
                  {packagingItems.length > 0 && (
                    <>
                      <tr className="bg-gray-50/50 font-semibold text-[11px] text-gray-700">
                        <td colSpan={4} className="px-3.5 py-1.5">
                          Kemasan & Safety (Botol, Stiker, Segel, Dus)
                        </td>
                        <td className="px-3.5 py-1.5 text-right font-mono font-bold text-gray-900">
                          {formatRp(packagingSubtotal)}
                        </td>
                      </tr>
                      {packagingItems.map((comp) => {
                        const code = comp.childCode || comp.childKemasan?.code || '-';
                        const name = comp.childName || comp.childKemasan?.name || 'Kemasan';
                        const isManual = comp.consumptionType === 'MANUAL';

                        return (
                          <tr key={comp.id} className="hover:bg-gray-50/40">
                            <td className="px-3.5 py-2">
                              <span className="font-mono font-semibold text-gray-900 mr-2">{code}</span>
                              <span className="text-gray-600">{name}</span>
                              {isManual && (
                                <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  manual
                                </span>
                              )}
                            </td>
                            <td className="px-2.5 py-2 text-center text-[10px] text-gray-500">
                              {comp.category}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-gray-700">
                              {comp.quantity} pcs
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-gray-600">
                              {formatRp(comp.unitCost)}
                            </td>
                            <td className="px-3.5 py-2 text-right font-mono font-bold text-gray-900">
                              {formatRp(comp.totalCost)}
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </tbody>
              </table>

              {/* Total Summary Row */}
              <div className="bg-gray-50 px-3.5 py-2.5 border-t flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800">Total HPP per Unit</span>
                <span className="font-mono text-sm font-extrabold text-gray-950">
                  {formatRp(totalBomHpp)}
                </span>
              </div>
            </div>
          )}

          {/* Clean Comparative Footer Note */}
          <div className="mt-4 flex items-center justify-between text-[11px] text-gray-500 px-1">
            <span>
              HPP Master Saat Ini: <strong className="font-mono text-gray-800">{formatRp(currentHpp)}</strong>
            </span>
            <span>
              Komponen: <strong className="text-gray-700">{components.length} item</strong>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-gray-50/70 flex justify-end">
          <Button variant="secondary" onClick={onClose} size="sm">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
