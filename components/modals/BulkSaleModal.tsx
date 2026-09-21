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

export function BulkSaleModal({ isOpen, onClose, onSuccess }: BulkSaleModalProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  async function handleImport() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/sales/bulk', {
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
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full shadow-xl mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Bulk Paste Penjualan Marketplace</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="bg-blue-50 p-3 rounded text-[11px] text-blue-700 mb-4 border border-blue-100 grid grid-cols-2 gap-4">
          <div>
            <p className="font-bold mb-1 uppercase">Format Kolom (TAB-SEPARATED):</p>
            <code>DATE [TAB] CHANNEL [TAB] ORDER_ID [TAB] SKU [TAB] QTY [TAB] PRICE [TAB] FEE [TAB] NOTES</code>
          </div>
          <div>
            <p className="font-bold mb-1 uppercase">Pilihan Channel:</p>
            <code>SHOPEE, TIKTOK, OFFLINE, AFFILIATE</code>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-80 p-3 border rounded text-xs font-mono mb-4 focus:outline-none focus:ring-1"
          style={{ borderColor: colors.neutral.border }}
          placeholder="Paste data dari Excel di sini..."
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
