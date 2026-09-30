'use client';

import { useState } from 'react';
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
  } | null>(null);
  const { showToast } = useToast();

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
    } catch (err) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-5xl w-full shadow-2xl mx-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Bulk Paste Finance — Penjualan Marketplace</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Data finance akan dicocokkan otomatis dengan hasil scan logistik
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Format Guide */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-[11px]">
          <p className="font-bold text-blue-800 mb-2 uppercase text-[10px] tracking-wider">
            Format Kolom (Tab-Separated dari Excel / Spreadsheet):
          </p>
          <div className="overflow-x-auto">
            <table className="text-blue-700 text-[10px] border-collapse">
              <thead>
                <tr>
                  {['NO', 'ORDER CODE', 'NO RESI', 'DATE', 'SKU CODE', 'PRODUCT', 'QTY', 'PRICE', 'VOUCHER', 'DISCOUNT', 'PLATFORM FEE', 'SHIPPING FEE', 'OMSET', 'HPP', 'TOTAL HPP', 'LABA'].map((col) => (
                    <th key={col} className="border border-blue-200 px-2 py-1 bg-blue-100 font-bold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
                <tr>
                  <td className="border border-blue-200 px-2 py-1 text-center">1</td>
                  <td className="border border-blue-200 px-2 py-1 font-mono">240801733136US</td>
                  <td className="border border-blue-200 px-2 py-1 font-mono">SPXID0483920193</td>
                  <td className="border border-blue-200 px-2 py-1">30-Sep</td>
                  <td className="border border-blue-200 px-2 py-1 font-mono">PBG</td>
                  <td className="border border-blue-200 px-2 py-1">Parfum Bubblegum...</td>
                  <td className="border border-blue-200 px-2 py-1 text-center">2</td>
                  <td className="border border-blue-200 px-2 py-1">120.000</td>
                  <td className="border border-blue-200 px-2 py-1">10.000</td>
                  <td className="border border-blue-200 px-2 py-1">10</td>
                  <td className="border border-blue-200 px-2 py-1">7.800</td>
                  <td className="border border-blue-200 px-2 py-1">1.200</td>
                  <td className="border border-blue-200 px-2 py-1">102.200</td>
                  <td className="border border-blue-200 px-2 py-1">45.000</td>
                  <td className="border border-blue-200 px-2 py-1">45.000</td>
                  <td className="border border-blue-200 px-2 py-1">57.200</td>
                </tr>
              </thead>
            </table>
          </div>
          <p className="mt-2 text-blue-600">
            💡 Baris header (NO, ORDER CODE, ...) akan dilewati otomatis. Kolom HPP & TOTAL HPP dari data ini akan dipakai jika ada, 
            jika tidak ada akan dihitung dari HPP SKU × Qty.
          </p>
        </div>

        {/* Channel Selector */}
        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
            Marketplace (untuk data baru yang tidak cocok dengan scan logistik)
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm bg-white font-medium"
            style={{ borderColor: colors.neutral.border }}
          >
            {CHANNELS.map((ch) => (
              <option key={ch.value} value={ch.value}>{ch.label}</option>
            ))}
          </select>
        </div>

        {/* Text Area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-64 p-3 border rounded-xl text-xs font-mono mb-4 focus:outline-none focus:ring-2 focus:ring-blue-200"
          style={{ borderColor: colors.neutral.border }}
          placeholder="Paste data dari Excel/Spreadsheet finance di sini (Ctrl+A lalu Ctrl+C dari spreadsheet)..."
        />

        {/* Result */}
        {result && (
          <div className="mb-4 p-4 rounded-xl border bg-green-50 border-green-200 text-sm space-y-1">
            <p className="font-bold text-green-800">✓ Import Selesai</p>
            {result.matched > 0 && (
              <p className="text-green-700">✅ {result.matched} dicocokkan dengan scan logistik</p>
            )}
            {result.created > 0 && (
              <p className="text-blue-700">➕ {result.created} data baru dibuat</p>
            )}
            {result.skipped > 0 && (
              <p className="text-gray-500">⏭ {result.skipped} baris dilewati</p>
            )}
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-red-600 font-bold text-xs">Error:</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-red-500 text-xs">• {e}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>Tutup</Button>
          <Button variant="primary" onClick={handleImport} disabled={loading || !text.trim()} style={{ minWidth: '160px' }}>
            {loading ? 'Memproses...' : 'Impor & Cocokkan'}
          </Button>
        </div>
      </div>
    </div>
  );
}
