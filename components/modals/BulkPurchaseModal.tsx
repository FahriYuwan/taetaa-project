'use client';

import { useState } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/toast';

interface BulkPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkPurchaseModal({ isOpen, onClose, onSuccess }: BulkPurchaseModalProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  async function handleImport() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/purchases/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ message: data.message, type: 'success' });
        setText('');
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full shadow-xl mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Bulk Paste Pembelian</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 mb-4 border border-blue-100">
          <p className="font-bold mb-1">Format Kolom (Tab-Separated):</p>
          <code>TANGGAL (YYYY-MM-DD) [TAB] KODE_SKU [TAB] QTY [TAB] HARGA_SATUAN [TAB] SUPPLIER [TAB] CATATAN</code>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-80 p-3 border rounded text-sm font-mono mb-4 focus:outline-none focus:ring-1"
          style={{ borderColor: colors.neutral.border }}
          placeholder="Paste data dari Excel / Spreadsheet di sini..."
        />

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Batal</Button>
          <Button variant="primary" onClick={handleImport} disabled={loading} style={{ minWidth: '150px' }}>
            {loading ? 'Mengimpor...' : 'Impor Sekarang'}
          </Button>
        </div>
      </div>
    </div>
  );
}
