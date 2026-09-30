'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/toast';
import { FiX, FiCheck, FiDollarSign, FiLock } from 'react-icons/fi';

interface SaleItem {
  id: string;
  orderId?: string | null;
  resi?: string | null;
  channel: string;
  qty: number;
  unitPrice: number;
  total: number;
  voucher?: number;
  discount?: number;
  platformFee?: number;
  shippingFee?: number;
  omset?: number;
  netRevenue?: number;
  hpp?: number;
  totalHpp?: number;
  laba?: number;
  notes?: string | null;
  sku: {
    code: string;
    name: string;
    hppPrice?: number;
  };
}

interface EditSaleFinancialModalProps {
  isOpen: boolean;
  sale: SaleItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSaleFinancialModal({
  isOpen,
  sale,
  onClose,
  onSuccess,
}: EditSaleFinancialModalProps) {
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [voucher, setVoucher] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [platformFee, setPlatformFee] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [orderId, setOrderId] = useState<string>('');
  const [resi, setResi] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (sale) {
      setUnitPrice(sale.unitPrice || 0);
      setVoucher(sale.voucher || 0);
      setDiscount(sale.discount || 0);
      setPlatformFee(sale.platformFee || 0);
      setShippingFee(sale.shippingFee || 0);
      setOrderId(sale.orderId || '');
      setResi(sale.resi || '');
      setNotes(sale.notes || '');
    }
  }, [sale]);

  if (!isOpen || !sale) return null;

  // Real-time calculations
  const qty = sale.qty || 1;
  const totalGross = qty * unitPrice;
  const totalDeductions = voucher + discount + platformFee + shippingFee;
  const netRevenue = totalGross - totalDeductions;
  const hppPerUnit = sale.hpp || sale.sku.hppPrice || 0;
  const totalHpp = sale.totalHpp || qty * hppPerUnit;
  const profit = netRevenue - totalHpp;

  function formatRp(val: number) {
    return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/sales/${sale?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId.trim() || null,
          resi: resi.trim() || null,
          unitPrice,
          total: totalGross,
          voucher,
          discount,
          platformFee,
          shippingFee,
          fee: platformFee + shippingFee,
          omset: netRevenue,
          netRevenue,
          totalHpp,
          laba: profit,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan perubahan');
      }

      showToast({ message: 'Data finansial penjualan berhasil diperbarui', type: 'success' });
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast({ message: err.message || 'Gagal menyimpan data', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <FiDollarSign size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Edit Data Finansial Penjualan</h3>
              <p className="text-xs text-gray-500">Perbarui harga, voucher, dan potongan marketplace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[75vh]">
          {/* Locked Physical Inventory Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-gray-500 font-medium">
              <span className="flex items-center gap-1">
                <FiLock size={12} className="text-gray-400" />
                Data Fisik Gudang (Terkunci)
              </span>
              <span className="font-bold text-gray-700">{sale.channel}</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-gray-900">{sale.sku.code}</span>
              <span className="font-bold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">
                Qty: {sale.qty} Unit
              </span>
            </div>
            <p className="text-[11px] text-gray-500 truncate">{sale.sku.name}</p>
          </div>

          {/* Nomor Pesanan & Nomor Resi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Order Code (No. Pesanan)
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Contoh: 240801733136US..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nomor Resi (Ekspedisi)
              </label>
              <input
                type="text"
                value={resi}
                onChange={(e) => setResi(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Contoh: SPXID0483920193..."
              />
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Harga Satuan (Rp)
              </label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Total Bruto
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800">
                {formatRp(totalGross)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Voucher Penjual (Rp)
              </label>
              <input
                type="number"
                value={voucher}
                onChange={(e) => setVoucher(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-red-600 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Diskon Penjual (Rp)
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-red-600 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Biaya Platform / Admin (Rp)
              </label>
              <input
                type="number"
                value={platformFee}
                onChange={(e) => setPlatformFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-red-600 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Ongkir Dibayar Penjual (Rp)
              </label>
              <input
                type="number"
                value={shippingFee}
                onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-red-600 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Catatan Rekonsiliasi (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Koreksi admin fee Shopee revisi faktur..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Calculation Preview Card */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Total Potongan Marketplace</span>
              <span className="font-semibold text-red-600">- {formatRp(totalDeductions)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t border-blue-200 pt-1.5">
              <span>Omset Bersih Diterima</span>
              <span className="text-blue-600">{formatRp(netRevenue)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total HPP ({qty} unit)</span>
              <span className="font-semibold text-orange-600">{formatRp(totalHpp)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t border-blue-200 pt-1.5">
              <span>Laba Bersih Transaksi</span>
              <span className={profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                {formatRp(profit)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2.5">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            icon={<FiCheck size={16} />}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>
    </div>
  );
}
