'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/toast';
import { colors } from '@/lib/theme';
import {
  FiAlertTriangle,
  FiX,
  FiCheck,
  FiClock,
  FiShield,
  FiRefreshCw,
  FiPackage,
} from 'react-icons/fi';

interface Sale {
  id: string;
  date: string;
  channel: string;
  orderId: string | null;
  resi: string | null;
  qty: number;
  unitPrice: number;
  voucher: number;
  discount: number;
  platformFee: number;
  shippingFee: number;
  omset: number;
  hpp: number;
  totalHpp: number;
  laba: number;
  status: string;
  notes: string | null;
  sku: {
    id: string;
    code: string;
    name: string;
    hppPrice?: number;
  };
}

interface DiscrepancyData {
  discrepancies: Sale[];
  unmatchedScans: Sale[];
  totalPending: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
}

const CHANNEL_BADGE: Record<string, string> = {
  SHOPEE: 'bg-orange-50 text-orange-600 border-orange-200',
  TIKTOK: 'bg-gray-100 text-gray-800 border-gray-300',
  TOKOPEDIA: 'bg-green-50 text-green-700 border-green-200',
  OFFLINE: 'bg-blue-50 text-blue-600 border-blue-200',
  AFFILIATE: 'bg-purple-50 text-purple-600 border-purple-200',
};

function formatRp(val: number) {
  return `Rp ${(val || 0).toLocaleString('id-ID')}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Sub-component: confirm resolution for a single SELISIH_QTY record
function DiscrepancyResolveCard({
  sale,
  onResolved,
}: {
  sale: Sale;
  onResolved: () => void;
}) {
  const [mode, setMode] = useState<'accept_logistic' | 'accept_finance' | null>(null);
  const [financeQty, setFinanceQty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  // Extract finance qty from notes if available
  const noteMatch = sale.notes?.match(/Finance lapor (\d+(?:\.\d+)?) unit/);
  const suggestedFinanceQty = noteMatch ? noteMatch[1] : '';

  useEffect(() => {
    if (suggestedFinanceQty) setFinanceQty(suggestedFinanceQty);
  }, [suggestedFinanceQty]);

  async function handleResolve() {
    if (!mode) return;
    if (mode === 'accept_finance' && !financeQty) {
      showToast({ message: 'Masukkan qty finance yang benar', type: 'error' });
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/sales/${sale.id}/resolve-discrepancy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          financeQty: mode === 'accept_finance' ? parseFloat(financeQty) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyelesaikan discrepancy');
      }
      showToast({
        message:
          mode === 'accept_logistic'
            ? 'Discrepancy diselesaikan: qty logistik dipakai sebagai acuan fisik'
            : `Discrepancy diselesaikan: qty diupdate ke ${financeQty}`,
        type: 'success',
      });
      onResolved();
    } catch (err: any) {
      showToast({ message: err.message || 'Gagal menyelesaikan', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="border border-amber-200 rounded-xl bg-amber-50/60 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${CHANNEL_BADGE[sale.channel] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {sale.channel}
          </span>
          <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded">
            ⚠️ SELISIH QTY
          </span>
        </div>
        <span className="text-[10px] text-gray-400">{formatDate(sale.date)}</span>
      </div>

      {/* SKU & order info */}
      <div>
        <p className="text-sm font-bold text-gray-900">{sale.sku.code} — {sale.sku.name}</p>
        <p className="text-[11px] text-gray-500 font-mono mt-0.5">
          Resi: {sale.resi || '—'} · Order: {sale.orderId || '—'}
        </p>
      </div>

      {/* Discrepancy info */}
      <div className="grid grid-cols-2 gap-2 bg-white border border-amber-200 rounded-lg p-3 text-sm">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty Logistik (Fisik)</p>
          <p className="text-lg font-bold text-gray-900">{sale.qty} unit</p>
          <p className="text-[10px] text-gray-400">Sudah terpotong dari stok</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty Finance (Laporan)</p>
          <p className="text-lg font-bold text-amber-600">{suggestedFinanceQty || '?'} unit</p>
          <p className="text-[10px] text-gray-400">Dari bulk paste marketplace</p>
        </div>
      </div>

      {/* Resolution options */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pilih Resolusi:</p>

        {/* Option 1: Accept logistic qty */}
        <button
          onClick={() => setMode('accept_logistic')}
          className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
            mode === 'accept_logistic'
              ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-300'
              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <FiShield size={14} className="text-blue-600 shrink-0" />
            <div>
              <p className="font-bold text-gray-800">Pakai Qty Logistik ({sale.qty} unit)</p>
              <p className="text-[11px] text-gray-500">
                Stok tidak berubah. Data finansial dari finance diterapkan dengan qty fisik.
              </p>
            </div>
          </div>
        </button>

        {/* Option 2: Accept finance qty */}
        <button
          onClick={() => setMode('accept_finance')}
          className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
            mode === 'accept_finance'
              ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-300'
              : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <FiRefreshCw size={14} className="text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-gray-800">Pakai Qty Finance</p>
              <p className="text-[11px] text-gray-500">
                Stok akan dikoreksi otomatis. Qty transaksi diupdate ke qty finance.
              </p>
            </div>
          </div>
        </button>

        {/* Finance qty input (shown only if accept_finance) */}
        {mode === 'accept_finance' && (
          <div className="pl-4 pr-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Konfirmasi Qty Finance yang Benar
            </label>
            <input
              type="number"
              value={financeQty}
              onChange={(e) => setFinanceQty(e.target.value)}
              min="0.01"
              step="any"
              className="w-32 px-3 py-1.5 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
              placeholder="e.g. 3"
            />
            <span className="text-xs text-gray-400 ml-2">unit</span>
          </div>
        )}
      </div>

      {/* Confirm button */}
      {mode && (
        <button
          onClick={handleResolve}
          disabled={isSubmitting || (mode === 'accept_finance' && !financeQty)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <><FiRefreshCw size={13} className="animate-spin" /> Menyimpan...</>
          ) : (
            <><FiCheck size={13} /> Konfirmasi Resolusi</>
          )}
        </button>
      )}
    </div>
  );
}

// Sub-component: info card for unmatched logistic scan (no action needed here, just info)
function UnmatchedScanCard({ sale }: { sale: Sale }) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white p-3.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${CHANNEL_BADGE[sale.channel] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {sale.channel}
          </span>
          <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-300 px-2 py-0.5 rounded">
            🔍 Belum dicocokkan
          </span>
        </div>
        <span className="text-[10px] text-gray-400">{formatDate(sale.date)}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{sale.sku.code} — {sale.sku.name}</p>
        <p className="text-[11px] font-mono text-gray-500 mt-0.5">
          Resi: {sale.resi || '—'} · Qty: {sale.qty} unit
        </p>
      </div>
      <p className="text-[11px] text-gray-400">
        Stok sudah dipotong. Menunggu data finansial dari Finance bulk paste.
      </p>
    </div>
  );
}

export function DiscrepancyModal({ isOpen, onClose, onResolved }: Props) {
  const [data, setData] = useState<DiscrepancyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'discrepancies' | 'unmatched'>('discrepancies');
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sales/discrepancies');
      if (!res.ok) throw new Error('Gagal memuat data');
      setData(await res.json());
    } catch {
      showToast({ message: 'Gagal memuat data discrepancy', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  function handleResolved() {
    fetchData(); // refresh list
    onResolved(); // refresh parent sales table
  }

  if (!isOpen) return null;

  const discrepancyCount = data?.discrepancies.length ?? 0;
  const unmatchedCount = data?.unmatchedScans.length ?? 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <FiAlertTriangle size={18} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Rekonsiliasi Manual Finance
              </h2>
              <p className="text-[11px] text-gray-400">
                {data?.totalPending ?? 0} item menunggu konfirmasi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('discrepancies')}
            className={`flex items-center gap-1.5 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'discrepancies'
                ? 'border-amber-500 text-amber-700 bg-white'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <FiAlertTriangle size={13} />
            Selisih Qty
            {discrepancyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                {discrepancyCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('unmatched')}
            className={`flex items-center gap-1.5 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'unmatched'
                ? 'border-blue-500 text-blue-700 bg-white'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <FiClock size={13} />
            Belum Dicocokkan
            {unmatchedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-full">
                {unmatchedCount}
              </span>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-2">
                <FiRefreshCw size={24} className="animate-spin text-gray-300 mx-auto" />
                <p className="text-sm text-gray-400">Memuat data...</p>
              </div>
            </div>
          ) : activeTab === 'discrepancies' ? (
            discrepancyCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <FiCheck size={22} className="text-green-600" />
                </div>
                <p className="text-sm font-bold text-gray-700">Tidak ada selisih qty</p>
                <p className="text-xs text-gray-400 mt-1">Semua rekonsiliasi berjalan normal.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-1 pb-1">
                  <FiAlertTriangle size={13} className="text-amber-500" />
                  <p className="text-xs text-gray-500">
                    Pilih resolusi untuk setiap selisih qty. Stok gudang adalah fakta fisik yang terpercaya (ADR Decision 2).
                  </p>
                </div>
                {data!.discrepancies.map((sale) => (
                  <DiscrepancyResolveCard
                    key={sale.id}
                    sale={sale}
                    onResolved={handleResolved}
                  />
                ))}
              </>
            )
          ) : unmatchedCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <FiPackage size={22} className="text-green-600" />
              </div>
              <p className="text-sm font-bold text-gray-700">Semua scan logistik sudah dicocokkan</p>
              <p className="text-xs text-gray-400 mt-1">Tidak ada scan yang menunggu data finance.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-1 pb-1">
                <FiClock size={13} className="text-blue-500" />
                <p className="text-xs text-gray-500">
                  Scan ini sudah memotong stok fisik. Lakukan Bulk Paste finance untuk mencocokkan data finansialnya.
                </p>
              </div>
              {data!.unmatchedScans.map((sale) => (
                <UnmatchedScanCard key={sale.id} sale={sale} />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
