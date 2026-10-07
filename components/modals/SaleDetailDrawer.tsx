'use client';

import { useEffect, useState } from 'react';
import { colors } from '@/lib/theme';
import { formatRupiah } from '@/lib/finance';
import {
  FiX,
  FiCopy,
  FiCheck,
  FiAlertTriangle,
  FiDollarSign,
  FiPackage,
  FiEdit2,
  FiTrash2,
  FiFileText,
  FiExternalLink,
} from 'react-icons/fi';

interface Sale {
  id: string;
  date: string;
  channel: string;
  orderId: string | null;
  resi: string | null;
  skuId: string;
  sku: {
    id?: string;
    code: string;
    name: string;
    hppPrice?: number;
  };
  qty: number;
  unitPrice: number;
  total: number;
  fee: number;
  netRevenue: number;
  voucher: number;
  discount: number;
  platformFee: number;
  shippingFee: number;
  omset: number;
  hpp: number;
  totalHpp: number;
  laba: number;
  status: string;
  scannedByLogistic: boolean;
  financeMatched: boolean;
  notes: string | null;
}

interface SaleDetailDrawerProps {
  isOpen: boolean;
  sale: Sale | null;
  onClose: () => void;
  onEditFinancial?: (sale: Sale) => void;
  onEditStatus?: (sale: Sale) => void;
  onResolveDiscrepancy?: (sale: Sale) => void;
  onDelete?: (saleId: string) => void;
}

const CHANNEL_BADGE: Record<string, string> = {
  SHOPEE: 'bg-orange-50 text-orange-600 border-orange-200',
  TIKTOK: 'bg-gray-100 text-gray-800 border-gray-300',
  TOKOPEDIA: 'bg-green-50 text-green-700 border-green-200',
  OFFLINE: 'bg-blue-50 text-blue-600 border-blue-200',
  AFFILIATE: 'bg-purple-50 text-purple-600 border-purple-200',
};

const STATUS_BADGE: Record<string, string> = {
  TERKIRIM: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DIRETURN: 'bg-rose-50 text-rose-700 border-rose-200',
  DIBATALKAN: 'bg-gray-100 text-gray-600 border-gray-200',
  SELISIH_QTY: 'bg-amber-50 text-amber-700 border-amber-300',
};

const STATUS_LABEL: Record<string, string> = {
  TERKIRIM: 'Terkirim',
  DIRETURN: 'Direturn',
  DIBATALKAN: 'Dibatalkan',
  SELISIH_QTY: '⚠️ Selisih Qty',
};

export function SaleDetailDrawer({
  isOpen,
  sale,
  onClose,
  onEditFinancial,
  onEditStatus,
  onResolveDiscrepancy,
  onDelete,
}: SaleDetailDrawerProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !sale) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const omsetValue = sale.omset || sale.netRevenue || 0;
  const totalHppValue = sale.totalHpp || (sale.hpp > 0 ? sale.hpp : (sale.sku.hppPrice || 0) * sale.qty);
  const labaValue = sale.laba !== 0 ? sale.laba : omsetValue - totalHppValue;
  const grossSubtotal = sale.total || (sale.unitPrice * sale.qty);
  const profitMargin = omsetValue > 0 ? ((labaValue / omsetValue) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside
        className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full z-10 overflow-hidden transition-transform duration-300 ease-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between shrink-0 bg-gray-50/70"
          style={{ borderColor: colors.neutral.border }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: colors.brand.gradient }}
            >
              <FiFileText size={16} />
            </div>
            <div>
              <h2 id="drawer-title" className="text-sm font-bold text-gray-900 leading-tight">
                Detail Transaksi Penjualan
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                {new Date(sale.date).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
            title="Tutup (Esc)"
            aria-label="Tutup"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Discrepancy Alert Banner (Jika Ada) */}
          {(sale.status === 'SELISIH_QTY' || sale.notes?.includes('SELISIH QTY')) && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <FiAlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-amber-900">
                    Perhatian: Selisih Kuantitas Terdeteksi
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    {sale.notes || 'Terdapat perbedaan kuantitas antara scan logistik dan laporan finance.'}
                  </p>
                </div>
              </div>

              {onResolveDiscrepancy && (
                <button
                  onClick={() => onResolveDiscrepancy(sale)}
                  className="w-full mt-2 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Selesaikan Selisih Sekarang</span>
                  <FiExternalLink size={13} />
                </button>
              )}
            </div>
          )}

          {/* Section 1: Informasi Pesanan & Logistik */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiPackage size={13} />
              Informasi Pesanan & Channel
            </h3>

            <div className="bg-gray-50/70 border rounded-xl p-4 space-y-3" style={{ borderColor: colors.neutral.border }}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Marketplace / Channel:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                    CHANNEL_BADGE[sale.channel] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {sale.channel}
                </span>
              </div>

              {sale.resi && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Nomor Resi:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                      {sale.resi}
                    </span>
                    <button
                      onClick={() => copyToClipboard(sale.resi!, 'resi')}
                      className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Salin Resi"
                    >
                      {copiedKey === 'resi' ? <FiCheck size={14} className="text-emerald-500" /> : <FiCopy size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {sale.orderId && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Order ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">
                      {sale.orderId}
                    </span>
                    <button
                      onClick={() => copyToClipboard(sale.orderId!, 'orderId')}
                      className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Salin Order ID"
                    >
                      {copiedKey === 'orderId' ? <FiCheck size={14} className="text-emerald-500" /> : <FiCopy size={14} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                <span className="text-xs text-gray-500 font-medium">Status Pesanan:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      STATUS_BADGE[sale.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {STATUS_LABEL[sale.status] ?? sale.status}
                  </span>
                  {onEditStatus && (
                    <button
                      onClick={() => onEditStatus(sale)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Ubah
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>Status Rekonsiliasi:</span>
                <span className="font-semibold flex items-center gap-1">
                  {sale.financeMatched ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <FiCheck size={13} /> Sesuai Finance
                    </span>
                  ) : sale.scannedByLogistic ? (
                    <span className="text-amber-600">Scan Gudang (Menunggu Finance)</span>
                  ) : (
                    <span className="text-gray-400">Manual Entry</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Detail Produk */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiPackage size={13} />
              Produk Terjual
            </h3>

            <div className="bg-gray-50/70 border rounded-xl p-4 space-y-2.5" style={{ borderColor: colors.neutral.border }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {sale.sku.code}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 mt-1.5 leading-snug">
                    {sale.sku.name}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-gray-500 block">Kuantitas</span>
                  <span className="text-base font-bold text-gray-900">{sale.qty} pcs</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-between text-xs text-gray-600">
                <span>Harga Satuan Jual:</span>
                <span className="font-semibold text-gray-900">{formatRupiah(sale.unitPrice)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Rincian Keuangan Lengkap (Financial Breakdown) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiDollarSign size={13} />
                Rincian Keuangan & Laba Bersih
              </h3>
              {onEditFinancial && (
                <button
                  onClick={() => onEditFinancial(sale)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <FiEdit2 size={12} />
                  <span>Edit Nilai</span>
                </button>
              )}
            </div>

            <div className="bg-white border rounded-xl overflow-hidden shadow-2xs divide-y" style={{ borderColor: colors.neutral.border }}>
              {/* Gross Revenue */}
              <div className="px-4 py-3 flex items-center justify-between text-xs bg-gray-50/40">
                <span className="font-medium text-gray-600">Penjualan Kotor (Subtotal):</span>
                <span className="font-bold text-gray-900">{formatRupiah(grossSubtotal)}</span>
              </div>

              {/* Deductions Breakdown */}
              <div className="px-4 py-3 space-y-2 bg-white text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Voucher Marketplace:</span>
                  <span className={sale.voucher > 0 ? 'font-medium text-rose-500' : 'text-gray-400'}>
                    {sale.voucher > 0 ? `- ${formatRupiah(sale.voucher)}` : 'Rp 0'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Diskon Penjual:</span>
                  <span className={sale.discount > 0 ? 'font-medium text-rose-500' : 'text-gray-400'}>
                    {sale.discount > 0 ? `- ${formatRupiah(sale.discount)}` : 'Rp 0'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Biaya Layanan (Platform Fee):</span>
                  <span className={sale.platformFee > 0 ? 'font-medium text-rose-500' : 'text-gray-400'}>
                    {sale.platformFee > 0 ? `- ${formatRupiah(sale.platformFee)}` : 'Rp 0'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Ongkos Kirim Ditanggung:</span>
                  <span className={sale.shippingFee > 0 ? 'font-medium text-rose-500' : 'text-gray-400'}>
                    {sale.shippingFee > 0 ? `- ${formatRupiah(sale.shippingFee)}` : 'Rp 0'}
                  </span>
                </div>
              </div>

              {/* Net Revenue / Omset */}
              <div className="px-4 py-3 flex items-center justify-between text-xs bg-blue-50/60 border-y border-blue-100">
                <div>
                  <span className="font-bold text-blue-900 block">Omset Bersih (Net Revenue):</span>
                  <span className="text-[10px] text-blue-700">Dana riil yang dicairkan ke kas</span>
                </div>
                <span className="text-sm font-bold text-blue-700">{formatRupiah(omsetValue)}</span>
              </div>

              {/* COGS / HPP */}
              <div className="px-4 py-3 space-y-1.5 bg-white text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span>HPP Satuan ({sale.qty} pcs):</span>
                  <span className="text-gray-700">{formatRupiah(sale.hpp || sale.sku.hppPrice || 0)} / pcs</span>
                </div>
                <div className="flex items-center justify-between font-medium text-orange-600">
                  <span>Total Beban Modal (HPP):</span>
                  <span>- {formatRupiah(totalHppValue)}</span>
                </div>
              </div>

              {/* Net Profit Summary */}
              <div
                className={`px-4 py-3.5 flex items-center justify-between ${
                  labaValue >= 0 ? 'bg-emerald-50/80 text-emerald-950' : 'bg-rose-50/80 text-rose-950'
                }`}
              >
                <div>
                  <span className="font-bold text-xs block">Laba Bersih Transaksi:</span>
                  <span className="text-[10px] opacity-80">
                    Margin: {profitMargin}% dari omset
                  </span>
                </div>
                <span
                  className={`text-base font-extrabold ${
                    labaValue >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {labaValue >= 0 ? `+ ${formatRupiah(labaValue)}` : `- ${formatRupiah(Math.abs(labaValue))}`}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Catatan Transaksi */}
          {sale.notes && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Catatan Transaksi
              </h3>
              <div className="p-3 bg-gray-50 border rounded-xl text-xs text-gray-700 leading-relaxed font-mono" style={{ borderColor: colors.neutral.border }}>
                {sale.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="px-6 py-3.5 border-t bg-gray-50/90 flex items-center justify-between shrink-0"
          style={{ borderColor: colors.neutral.border }}
        >
          {onDelete && (
            <button
              onClick={() => onDelete(sale.id)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FiTrash2 size={14} />
              <span>Hapus Transaksi</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
              style={{ borderColor: colors.neutral.border }}
            >
              Tutup
            </button>
            {onEditFinancial && (
              <button
                onClick={() => onEditFinancial(sale)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                style={{ backgroundColor: colors.brand[500] }}
              >
                <FiEdit2 size={13} />
                <span>Edit Finansial</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
