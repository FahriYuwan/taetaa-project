'use client';

import React from 'react';
import { colors } from '@/lib/theme';
import {
  Sale,
  OrderGroup,
  MarketplaceTotals,
  CHANNEL_BADGE,
  STATUS_BADGE,
  STATUS_LABEL,
  formatRp,
} from './types';
import {
  FiTrash2,
  FiEdit2,
  FiEye,
  FiAlertTriangle,
} from 'react-icons/fi';
import { StatusDropdown } from './StatusDropdown';

interface MarketplaceCompactTableProps {
  orderGroups: OrderGroup[];
  filteredSalesCount: number;
  loading: boolean;
  totals: MarketplaceTotals;
  editingStatusId?: string | null;
  editingStatus?: string;
  isSavingStatus?: boolean;
  onStartEditStatus?: (sale: Sale) => void;
  onSaveStatus: (saleId: string, newStatus?: string) => void;
  onCancelEditStatus?: () => void;
  onChangeEditingStatus?: (status: string) => void;
  onSelectSaleForDetail: (sale: Sale) => void;
  onEditFinancial: (sale: Sale) => void;
  onDeleteSale: (saleId: string) => void;
}

export function MarketplaceCompactTable({
  orderGroups,
  filteredSalesCount,
  loading,
  totals,
  editingStatusId,
  editingStatus,
  isSavingStatus,
  onStartEditStatus,
  onSaveStatus,
  onCancelEditStatus,
  onChangeEditingStatus,
  onSelectSaleForDetail,
  onEditFinancial,
  onDeleteSale,
}: MarketplaceCompactTableProps) {
  return (
    <div
      className="rounded-xl border bg-white shadow-xs overflow-hidden"
      style={{ borderColor: colors.neutral.border }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left min-w-[920px]">
          <thead
            className="bg-gray-50/80 border-b text-[10px] font-bold uppercase tracking-wider text-gray-500"
            style={{ borderColor: colors.neutral.border }}
          >
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">TANGGAL & CHANNEL</th>
              <th className="px-4 py-3 whitespace-nowrap">NO. RESI / PESANAN</th>
              <th className="px-4 py-3 whitespace-nowrap">PRODUK / SKU</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">QTY</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">OMSET</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">TOTAL HPP</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">LABA</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">STATUS</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                  Memuat data penjualan...
                </td>
              </tr>
            ) : orderGroups.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center text-blue-500 font-medium">
                  Belum ada penjualan untuk kriteria ini.
                </td>
              </tr>
            ) : (
              orderGroups.map((group) =>
                group.items.map((sale, itemIdx) => {
                  const isFirstInGroup = itemIdx === 0;
                  const rowCount = group.items.length;
                  const isUnmatched = sale.scannedByLogistic && !sale.financeMatched;

                  return (
                    <tr
                      key={sale.id}
                      className={`transition-colors ${
                        isUnmatched
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : sale.status === 'RETURN' || sale.status === 'DIRETURN'
                          ? 'bg-amber-50/30 hover:bg-amber-50/50'
                          : sale.status === 'HILANG'
                          ? 'bg-rose-50/30 hover:bg-rose-50/50'
                          : 'hover:bg-blue-50/20'
                      }`}
                    >
                      {/* Grouped: Tanggal & Channel */}
                      {isFirstInGroup ? (
                        <td
                          className="px-4 py-3 whitespace-nowrap align-top bg-white"
                          rowSpan={rowCount}
                        >
                          <div className="font-semibold text-gray-900">
                            {new Date(sale.date).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="mt-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                CHANNEL_BADGE[sale.channel] ??
                                'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            >
                              {sale.channel}
                            </span>
                          </div>
                        </td>
                      ) : null}

                      {/* Grouped: No. Resi & Pesanan */}
                      {isFirstInGroup ? (
                        <td className="px-4 py-3 align-top bg-white" rowSpan={rowCount}>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="font-mono text-xs font-bold text-gray-900 max-w-[150px] truncate block"
                                title={`No. Resi: ${sale.resi || sale.orderId || '—'}`}
                              >
                                {sale.resi || sale.orderId || '—'}
                              </span>
                              {isUnmatched && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0"
                                  title="Belum ada data finance"
                                >
                                  BELUM COCOK
                                </span>
                              )}
                              {sale.financeMatched && (
                                <span
                                  className="text-green-600 text-[11px] font-bold"
                                  title="Data finance sudah dicocokkan"
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                            {sale.orderId && sale.resi && sale.orderId !== sale.resi && (
                              <p
                                className="text-[10px] text-gray-400 font-mono truncate max-w-[150px]"
                                title={`Order Code (No. Pesanan): ${sale.orderId}`}
                              >
                                Order: {sale.orderId}
                              </p>
                            )}
                          </div>
                        </td>
                      ) : null}

                      {/* Per-item: Produk / SKU */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-1.5">
                          {rowCount > 1 && (
                            <span className="text-gray-300 font-mono select-none">└</span>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => onSelectSaleForDetail(sale)}
                                className="font-bold text-gray-900 hover:text-blue-600 transition-colors text-left"
                                title="Klik untuk lihat detail transaksi"
                              >
                                {sale.sku?.code}
                              </button>
                              {sale.notes && sale.notes.includes('SELISIH') ? (
                                <button
                                  onClick={() => onSelectSaleForDetail(sale)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                                  title={sale.notes}
                                >
                                  <FiAlertTriangle size={10} className="text-amber-700" />
                                  <span>Selisih</span>
                                </button>
                              ) : sale.notes ? (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-600 border border-gray-200 truncate max-w-[130px] inline-block"
                                  title={sale.notes}
                                >
                                  {sale.notes}
                                </span>
                              ) : null}
                            </div>
                            <span
                              className="block text-[11px] text-gray-500 truncate max-w-[210px]"
                              title={sale.sku?.name}
                            >
                              {sale.sku?.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* QTY */}
                      <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                        {sale.qty}
                      </td>

                      {/* OMSET (Net) */}
                      <td
                        className="px-4 py-3 text-right font-bold whitespace-nowrap"
                        style={{ color: colors.brand[500] }}
                      >
                        {(sale.omset || sale.netRevenue) > 0 ? (
                          formatRp(sale.omset || sale.netRevenue)
                        ) : sale.status === 'HILANG' || sale.status === 'RETURN' || sale.status === 'DIRETURN' ? (
                          <span className="text-gray-400 font-mono">Rp 0</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* TOTAL HPP */}
                      <td className="px-4 py-3 text-right text-orange-600 font-medium whitespace-nowrap">
                        {sale.totalHpp > 0 ? (
                          formatRp(sale.totalHpp)
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* LABA */}
                      <td
                        className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                          (sale.laba || 0) >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {sale.laba !== 0 ? formatRp(sale.laba) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <StatusDropdown
                          currentStatus={sale.status}
                          onSelect={(newStatus) => onSaveStatus(sale.id, newStatus)}
                          isSaving={Boolean(isSavingStatus && editingStatusId === sale.id)}
                        />
                      </td>

                      {/* AKSI */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectSaleForDetail(sale)}
                            className="px-2 py-1 rounded text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Buka Detail Transaksi & Breakdown Finansial"
                          >
                            <FiEye size={12} />
                            <span>Detail</span>
                          </button>
                          <button
                            onClick={() => onEditFinancial(sale)}
                            className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Nilai Finansial (Harga, Voucher, Fee)"
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            onClick={() => onDeleteSale(sale.id)}
                            className="text-gray-300 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus Penjualan"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )
            )}
          </tbody>

          {/* Totals Footer */}
          {filteredSalesCount > 0 && (
            <tfoot
              className="bg-gray-50/90 border-t-2 font-bold text-xs"
              style={{ borderColor: colors.neutral.border }}
            >
              <tr>
                <td colSpan={3} className="px-4 py-3 text-gray-800 uppercase tracking-wider">
                  TOTAL ({orderGroups.length} Resi · {filteredSalesCount} Item)
                </td>
                <td className="px-4 py-3 text-right text-gray-900">
                  {totals.qty.toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3 text-right" style={{ color: colors.brand[500] }}>
                  {formatRp(totals.omset)}
                </td>
                <td className="px-4 py-3 text-right text-orange-600">
                  {formatRp(totals.totalHpp)}
                </td>
                <td
                  className={`px-4 py-3 text-right ${
                    totals.laba >= 0 ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {formatRp(totals.laba)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
