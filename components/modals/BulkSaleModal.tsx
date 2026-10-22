'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/toast';

interface BulkSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CHANNELS = [
  { value: 'SHOPEE', label: 'Shopee' },
  { value: 'TIKTOK', label: 'TikTok Shop' },
  { value: 'TOKOPEDIA', label: 'Tokopedia' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'AFFILIATE', label: 'Affiliate' },
];

export function BulkSaleModal({ isOpen, onClose, onSuccess }: BulkSaleModalProps) {
  const [text, setText] = useState('');
  const [channel, setChannel] = useState('SHOPEE');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    matched: number;
    created: number;
    skipped: number;
    errors: string[];
    discrepancies?: number;
  } | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading]);

  if (!isOpen) return null;

  async function handleImport() {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/sales/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, channel }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        showToast({ message: data.message, type: 'success' });
        onSuccess();
      } else {
        showToast({ message: data.error, type: 'error' });
      }
    } catch {
      showToast({ message: 'Gagal mengimpor data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setText('');
    setResult(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-5 max-w-3xl w-full shadow-lg max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Bulk Paste Finance - Penjualan Marketplace</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Data finance dicocokkan otomatis dengan nomor resi/order hasil scan logistik
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Tutup"
            className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors text-base"
          >
            ✕
          </button>
        </div>

        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
          <div className="font-medium text-gray-900 mb-1">Format Kolom (Tab-Separated):</div>
          <div className="font-mono text-[11px] bg-white p-1.5 border border-gray-200 rounded text-gray-800 overflow-x-auto whitespace-nowrap">
            NO [TAB] NOMOR_RESI [TAB] ORDER_CODE [TAB] DATE [TAB] SKU_CODE [TAB] PRODUCT [TAB] QTY [TAB] PRICE [TAB] VOUCHER [TAB] DISCOUNT [TAB] PLATFORM_FEE [TAB] SHIPPING_FEE [TAB] OMSET [TAB] HPP [TAB] TOTAL_HPP [TAB] LABA
          </div>
          <p className="mt-1.5 text-gray-500 text-[11px]">
            Mendukung format 16 kolom baru (dengan Resi) dan format 15 kolom lama. Baris header diabaikan.
          </p>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Marketplace Saluran (untuk data baru yang belum ada scan logistik):
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-gray-300 text-xs bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {CHANNELS.map((ch) => (
              <option key={ch.value} value={ch.value}>{ch.label}</option>
            ))}
          </select>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-56 p-2.5 border border-gray-300 rounded text-xs font-mono mb-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Paste baris data finance dari Excel / Spreadsheet di sini..."
        />

        {result && (
          <div className="mb-3 p-3 rounded border border-gray-200 bg-gray-50 text-xs text-gray-800 space-y-1">
            <div className="font-semibold text-gray-900">Hasil Rekonsiliasi:</div>
            {result.matched > 0 && (
              <div className="text-emerald-700 font-medium">{result.matched} data cocok dengan scan logistik.</div>
            )}
            {result.created > 0 && (
              <div className="text-blue-700 font-medium">{result.created} transaksi baru dibuat.</div>
            )}
            {result.discrepancies !== undefined && result.discrepancies > 0 && (
              <div className="text-amber-700 font-medium">{result.discrepancies} transaksi ditandai SELISIH QTY (perlu konfirmasi).</div>
            )}
            {result.skipped > 0 && (
              <div className="text-gray-600">{result.skipped} baris dilewati.</div>
            )}
            {result.errors.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 text-red-700 space-y-0.5">
                <div className="font-medium">Catatan:</div>
                {result.errors.map((e, i) => (
                  <div key={i}>- {e}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {result ? 'Tutup' : 'Batal'}
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={loading || !text.trim()}>
            {loading ? 'Memproses...' : 'Impor & Cocokkan'}
          </Button>
        </div>
      </div>
    </div>
  );
}
