'use client';

import React from 'react';
import { colors } from '@/lib/theme';
import {
  Sale,
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

interface MarketplaceDetailedTableProps {
  sales: Sale[];
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

export function MarketplaceDetailedTable({
  sales,
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
}: MarketplaceDetailedTableProps) {
  return (
    <div
      className="rounded-xl border bg-white shadow-xs overflow-hidden"
      style={{ borderColor: colors.neutral.border }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left min-w-[1650px]">
          <thead
            className="bg-gray-50/90 border-b text-[10px] font-bold uppercase tracking-wider text-gray-500"
            style={{ borderColor: colors.neutral.border }}
          >
            <tr>
              <th className="px-3 py-3 text-center whitespace-nowrap w-12">NO</th>
              <th className="px-4 py-3 whitespace-nowrap">NOMOR RESI</th>
              <th className="px-4 py-3 whitespace-nowrap">ORDER CODE</th>
              <th className="px-4 py-3 whitespace-nowrap">DATE</th>
              <th className="px-4 py-3 whitespace-nowrap">SKU CODE</th>
              <th className="px-4 py-3 whitespace-nowrap">PRODUCT</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">QTY</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">PRICE</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">VOUCHER</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">DISCOUNT</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">PLATFORM FEE</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">SHIPPING FEE</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">OMSET</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">HPP</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">TOTAL HPP</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">LABA</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">STATUS</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: colors.neutral.border }}>
            {loading ? (
              <tr>
                <td colSpan={18} className="px-6 py-12 text-center text-gray-400">
                  Memuat data penjualan...
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={18} className="px-6 py-16 text-center text-blue-500 font-medium">
                  Belum ada penjualan untuk kriteria ini.
                </td>
              </tr>
            ) : (
              sales.map((sale, index) => {
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
                    {/* NO */}
                    <td className="px-3 py-3 text-center text-gray-400 font-mono text-[11px] whitespace-nowrap">
                      {index + 1}
                    </td>

                    {/* NOMOR RESI */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-mono text-xs font-bold text-gray-900 max-w-[140px] truncate block"
                          title={sale.resi || '—'}
                        >
                          {sale.resi || '—'}
                        </span>
                        {isUnmatched && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 shrink-0"
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
                    </td>

                    {/* ORDER CODE */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className="font-mono text-xs text-gray-700 max-w-[140px] truncate block"
                        title={sale.orderId || '—'}
                      >
                        {sale.orderId || '—'}
                      </span>
                    </td>

                    {/* DATE */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-800 font-medium">
                          {new Date(sale.date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                            CHANNEL_BADGE[sale.channel] ??
                            'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {sale.channel}
                        </span>
                      </div>
                    </td>

                    {/* SKU CODE */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => onSelectSaleForDetail(sale)}
                        className="font-bold text-gray-900 hover:text-blue-600 transition-colors text-left"
                        title="Klik untuk lihat detail transaksi"
                      >
                        {sale.sku?.code || '—'}
                      </button>
                    </td>

                    {/* PRODUCT */}
                    <td className="px-4 py-3">
                      <span
                        className="block text-xs text-gray-600 truncate max-w-[170px]"
                        title={sale.sku?.name || '—'}
                      >
                        {sale.sku?.name || '—'}
                      </span>
                    </td>

                    {/* QTY */}
                    <td className="px-3 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                      {sale.qty}
                    </td>

                    {/* PRICE */}
                    <td className="px-3 py-3 text-right font-mono text-xs text-gray-700 whitespace-nowrap">
                      {sale.unitPrice > 0 ? (
                        formatRp(sale.unitPrice)
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* VOUCHER */}
                    <td className="px-3 py-3 text-right font-mono text-xs text-purple-600 whitespace-nowrap">
                      {sale.voucher > 0 ? (
                        formatRp(sale.voucher)
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* DISCOUNT */}
                    <td className="px-3 py-3 text-right font-mono text-xs text-amber-600 whitespace-nowrap">
                      {sale.discount > 0 ? (
                        formatRp(sale.discount)
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* PLATFORM FEE */}
                    <td className="px-3 py-3 text-right font-mono text-xs text-red-600 whitespace-nowrap">
                      {sale.platformFee > 0 ? (
                        formatRp(sale.platformFee)
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* SHIPPING FEE */}
                    <td className="px-3 py-3 text-right font-mono text-xs text-gray-600 whitespace-nowrap">
                      {sale.shippingFee > 0 ? (
                        formatRp(sale.shippingFee)
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* OMSET */}
                    <td
                      className="px-4 py-3 text-right font-bold font-mono text-xs whitespace-nowrap"
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

                    {/* HPP */}
                    <td className="px-3 py-3 text-right font-mono text-xs text-orange-600 whitespace-nowrap">
                      {sale.hpp > 0 ? (
                        formatRp(sale.hpp)
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* TOTAL HPP */}
                    <td className="px-4 py-3 text-right font-bold font-mono text-xs text-orange-600 whitespace-nowrap">
                      {sale.totalHpp > 0 ? (
                        formatRp(sale.totalHpp)
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* LABA */}
                    <td
                      className={`px-4 py-3 text-right font-bold font-mono text-xs whitespace-nowrap ${
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
            )}
          </tbody>

          {/* Totals Footer */}
          {sales.length > 0 && (
            <tfoot
              className="bg-gray-50/90 border-t-2 font-bold text-xs"
              style={{ borderColor: colors.neutral.border }}
            >
              <tr>
                <td colSpan={6} className="px-4 py-3 text-gray-800 uppercase tracking-wider">
                  TOTAL ({sales.length} Transaksi)
                </td>
                <td className="px-3 py-3 text-right text-gray-900">
                  {totals.qty.toLocaleString('id-ID')}
                </td>
                <td className="px-3 py-3 text-right text-gray-300">—</td>
                <td className="px-3 py-3 text-right font-mono text-purple-600">
                  {(totals.voucher || 0) > 0 ? formatRp(totals.voucher || 0) : '—'}
                </td>
                <td className="px-3 py-3 text-right font-mono text-amber-600">
                  {(totals.discount || 0) > 0 ? formatRp(totals.discount || 0) : '—'}
                </td>
                <td className="px-3 py-3 text-right font-mono text-red-600">
                  {(totals.platformFee || 0) > 0 ? formatRp(totals.platformFee || 0) : '—'}
                </td>
                <td className="px-3 py-3 text-right font-mono text-gray-600">
                  {(totals.shippingFee || 0) > 0 ? formatRp(totals.shippingFee || 0) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono" style={{ color: colors.brand[500] }}>
                  {formatRp(totals.omset)}
                </td>
                <td className="px-3 py-3 text-right text-gray-300">—</td>
                <td className="px-4 py-3 text-right font-mono text-orange-600">
                  {formatRp(totals.totalHpp)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono ${
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
