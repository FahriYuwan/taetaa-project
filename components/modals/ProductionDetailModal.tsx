'use client';

import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

interface ProductionDetail {
  id: string;
  date: string;
  outputQty: number;
  output: {
    sku: {
      code: string;
      name: string;
    }
  };
  inputs: Array<{
    id: string;
    qtyUsed: number;
    inputSku: {
      code: string;
      name: string;
    }
  }>;
  notes: string | null;
}

interface ProductionDetailModalProps {
  isOpen: boolean;
  production: ProductionDetail | null;
  onClose: () => void;
}

export function ProductionDetailModal({
  isOpen,
  production,
  onClose,
}: ProductionDetailModalProps) {
  if (!isOpen || !production) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="rounded-lg p-6 w-full mx-4 shadow-xl max-w-lg"
        style={{ backgroundColor: colors.neutral.card }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: colors.neutral.textStrong }}>
            Detail Produksi
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400">Tanggal</p>
              <p className="text-sm font-medium">{new Date(production.date).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400">Output SKU</p>
              <p className="text-sm font-bold">{production.output.sku.code}</p>
              <p className="text-[11px] text-gray-500">{production.output.sku.name}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Komponen Terpakai</p>
            <div className="border rounded divide-y" style={{ borderColor: colors.neutral.border }}>
              {production.inputs.map((input) => (
                <div key={input.id} className="p-3 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold">{input.inputSku.code}</span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-gray-600">{input.inputSku.name}</span>
                  </div>
                  <div className="font-bold">
                    {input.qtyUsed.toLocaleString('id-ID')} unit
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400">Jumlah Output</p>
            <p className="text-lg font-bold" style={{ color: colors.brand[500] }}>
              {production.outputQty.toLocaleString('id-ID')} unit
            </p>
          </div>

          {production.notes && (
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400">Catatan</p>
              <p className="text-sm text-gray-600 italic">{production.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
