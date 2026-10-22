'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/toast';

interface BulkKemasanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkKemasanModal({ isOpen, onClose, onSuccess }: BulkKemasanModalProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number; skipped?: number; message?: string } | null>(null);
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

  function handleClose() {
    setText('');
    setResult(null);
    onClose();
  }

  async function handleImport() {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/kemasan/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        showToast({ message: data.message, type: 'success' });
        if (data.count > 0) {
          onSuccess();
        }
      } else {
        showToast({ message: data.error || 'Gagal mengimpor data kemasan', type: 'error' });
      }
    } catch {
      showToast({ message: 'Gagal mengimpor data kemasan', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-5 max-w-2xl w-full shadow-lg max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Bulk Paste Master Kemasan</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tambah item kemasan (Packing, Stiker, Safety, Dus) secara massal dari Excel / Spreadsheet
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
          <div className="font-mono text-[11px] bg-white p-1.5 border border-gray-200 rounded text-gray-800 overflow-x-auto">
            KODE [TAB] NAMA [TAB] KATEGORI [TAB] STOK_MIN [TAB] OPNAME_MINGGUAN
          </div>
          <p className="mt-1.5 text-gray-500 text-[11px]">
            Kategori: PACKING, STIKER, SAFETY, atau DUS. Opname Mingguan diisi YA atau TIDAK.
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-56 p-2.5 border border-gray-300 rounded text-xs font-mono mb-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Paste baris data kemasan dari Excel / Spreadsheet di sini..."
        />

        {result && (
          <div className="mb-3 p-3 rounded border border-gray-200 bg-gray-50 text-xs text-gray-800 space-y-1">
            <div className="font-semibold text-gray-900">Hasil Impor:</div>
            <div className="text-emerald-700 font-medium">{result.count} item kemasan berhasil ditambahkan.</div>
            {result.skipped !== undefined && result.skipped > 0 && (
              <div className="text-gray-600">{result.skipped} baris dilewati.</div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {result ? 'Tutup' : 'Batal'}
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={loading || !text.trim()}>
            {loading ? 'Mengimpor...' : 'Impor Data'}
          </Button>
        </div>
      </div>
    </div>
  );
}
