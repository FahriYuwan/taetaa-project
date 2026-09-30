'use client';

import { useState, useEffect, useRef } from 'react';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/toast';
import { 
  FiX, 
  FiPlus, 
  FiMinus, 
  FiTrash2, 
  FiCheck, 
  FiArrowRight, 
  FiArrowLeft, 
  FiEdit2,
  FiRotateCcw,
  FiAlertCircle
} from 'react-icons/fi';
import { SiShopee, SiTiktok } from 'react-icons/si';

// Official Tokopedia Mascot: Toped (Burung Hijau Tokopedia)
export function TokopediaOwlIcon({ size = 26, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Tokopedia"
    >
      {/* Pegangan tas / telinga Toped */}
      <path
        d="M13 10C13 7.2 15.2 5 18 5C20.8 5 23 7.2 23 10"
        stroke="#42B549"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Badan burung hijau (Toped) */}
      <rect x="4" y="9" width="28" height="22" rx="7" fill="#42B549" />
      {/* Mata Kiri Toped */}
      <circle cx="12.5" cy="19.5" r="5" fill="#FFFFFF" />
      <circle cx="12.5" cy="19.5" r="2.8" fill="#1E293B" />
      <circle cx="13.5" cy="18.5" r="1" fill="#FFFFFF" />
      {/* Mata Kanan Toped */}
      <circle cx="23.5" cy="19.5" r="5" fill="#FFFFFF" />
      <circle cx="23.5" cy="19.5" r="2.8" fill="#1E293B" />
      <circle cx="24.5" cy="18.5" r="1" fill="#FFFFFF" />
      {/* Paruh oranye */}
      <path d="M16.5 22L18 25L19.5 22H16.5Z" fill="#F97316" />
    </svg>
  );
}

interface ScannedItem {
  skuCode: string;
  qty: number;
  skuName?: string;
  stock?: number;
  status: 'valid' | 'invalid';
  errorMsg?: string;
}

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CHANNELS = [
  { 
    value: 'SHOPEE', 
    label: 'Shopee', 
    expeditions: 'SPX, J&T, SiCepat, Anteraja',
    icon: SiShopee,
    brandColor: '#EE4D2D',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  { 
    value: 'TIKTOK', 
    label: 'TikTok Shop', 
    expeditions: 'J&T, Ninja Van, JNE, SiCepat',
    icon: SiTiktok,
    brandColor: '#111827',
    badgeClass: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  { 
    value: 'TOKOPEDIA', 
    label: 'Tokopedia', 
    expeditions: 'GoSend, SiCepat, JNE, Anteraja',
    icon: TokopediaOwlIcon,
    brandColor: '#42B549',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
];

export function ScannerModal({ isOpen, onClose, onSuccess }: ScannerModalProps) {
  const [step, setStep] = useState<'channel' | 'resi' | 'sku' | 'review'>('channel');
  const [channel, setChannel] = useState('');
  const [orderId, setOrderId] = useState('');
  const [currentSkuCode, setCurrentSkuCode] = useState('');
  const [currentQty, setCurrentQty] = useState(1);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingSku, setIsValidatingSku] = useState(false);
  const [sessionSavedCount, setSessionSavedCount] = useState(0);
  const [sessionSavedOrders, setSessionSavedOrders] = useState<string[]>([]);
  const resiInputRef = useRef<HTMLInputElement>(null);
  const skuInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setStep('channel');
      setChannel('');
      setOrderId('');
      setCurrentSkuCode('');
      setCurrentQty(1);
      setItems([]);
      setSessionSavedCount(0);
      setSessionSavedOrders([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'resi' && resiInputRef.current) {
      setTimeout(() => resiInputRef.current?.focus(), 80);
    }
    if (step === 'sku' && skuInputRef.current) {
      setTimeout(() => skuInputRef.current?.focus(), 80);
    }
  }, [step]);

  function handleChannelSelect(ch: string) {
    setChannel(ch);
    setStep('resi');
  }

  function handleResiInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (orderId.trim()) {
        setStep('sku');
      } else {
        showToast({ message: 'Masukkan nomor resi terlebih dahulu', type: 'error' });
      }
    }
  }

  async function validateAndAddSku() {
    const rawCode = currentSkuCode.trim().toUpperCase();
    if (!rawCode) return;
    if (currentQty <= 0) {
      showToast({ message: 'Qty minimal 1 unit', type: 'error' });
      return;
    }

    setIsValidatingSku(true);
    try {
      const res = await fetch(`/api/skus?code=${encodeURIComponent(rawCode)}`);
      const data = await res.json();
      const sku = Array.isArray(data) ? data[0] : (data?.id ? data : null);

      if (sku) {
        const existingIdx = items.findIndex((i) => i.skuCode === rawCode && i.status === 'valid');
        if (existingIdx >= 0) {
          setItems((prev) =>
            prev.map((item, idx) =>
              idx === existingIdx ? { ...item, qty: item.qty + currentQty } : item
            )
          );
        } else {
          const newItem: ScannedItem = {
            skuCode: rawCode,
            qty: currentQty,
            skuName: sku.name,
            stock: sku.stock ?? 0,
            status: 'valid',
          };
          setItems((prev) => [newItem, ...prev]);
        }
      } else {
        const newItem: ScannedItem = {
          skuCode: rawCode,
          qty: currentQty,
          status: 'invalid',
          errorMsg: 'SKU tidak terdaftar di sistem',
        };
        setItems((prev) => [newItem, ...prev]);
      }

      setCurrentSkuCode('');
      setCurrentQty(1);
      setTimeout(() => skuInputRef.current?.focus(), 50);
    } catch {
      setItems((prev) => [
        {
          skuCode: rawCode,
          qty: currentQty,
          status: 'invalid',
          errorMsg: 'Gagal memvalidasi SKU',
        },
        ...prev,
      ]);
      setCurrentSkuCode('');
      setCurrentQty(1);
    } finally {
      setIsValidatingSku(false);
    }
  }

  function handleSkuKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateAndAddSku();
    }
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItemQty(index: number, newQty: number) {
    if (newQty < 1) return;
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, qty: newQty } : item)));
  }

  async function handleSubmit(saveAndNext = false) {
    const validItems = items.filter((i) => i.status === 'valid');
    if (validItems.length === 0) {
      showToast({ message: 'Tidak ada SKU valid yang dapat disimpan', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sales/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          resi: orderId.trim(),
          orderId: orderId.trim(),
          items: validItems.map((i) => ({ skuCode: i.skuCode, qty: i.qty })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast({ message: `Resi ${orderId.trim()} (${validItems.length} SKU) berhasil disimpan!`, type: 'success' });
        onSuccess();

        setSessionSavedCount((c) => c + 1);
        setSessionSavedOrders((prev) => [orderId.trim(), ...prev]);

        if (saveAndNext) {
          // Reset form untuk scan paket berikutnya, channel tetap sama
          setOrderId('');
          setCurrentSkuCode('');
          setCurrentQty(1);
          setItems([]);
          setStep('resi');
          setTimeout(() => resiInputRef.current?.focus(), 80);
        } else {
          onClose();
        }
      } else {
        showToast({ message: data.error || 'Gagal menyimpan scan', type: 'error' });
      }
    } catch {
      showToast({ message: 'Koneksi ke server terputus', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const selectedChannel = CHANNELS.find((c) => c.value === channel);
  const ChannelIcon = selectedChannel?.icon;
  const validItems = items.filter((i) => i.status === 'valid');
  const invalidItems = items.filter((i) => i.status === 'invalid');
  const totalUnits = validItems.reduce((acc, curr) => acc + curr.qty, 0);

  const stepsList = [
    { key: 'channel', label: 'Marketplace' },
    { key: 'resi', label: 'No. Resi' },
    { key: 'sku', label: 'Scan SKU' },
    { key: 'review', label: 'Konfirmasi' },
  ];
  const stepIdx = stepsList.findIndex((s) => s.key === step);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-gray-200 overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-base font-bold text-gray-900">Scanner Logistik</h2>
            <p className="text-xs text-gray-500 mt-0.5">Input nomor resi dan SKU paket pengiriman</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="border-b border-gray-200 bg-gray-50/60 px-6 py-2.5">
          <div className="flex items-center justify-between text-xs">
            {stepsList.map((s, idx) => {
              const isActive = s.key === step;
              const isPast = idx < stepIdx;
              return (
                <div key={s.key} className="flex items-center gap-1.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </span>
                  <span
                    className={`font-medium ${
                      isActive ? 'text-blue-600 font-bold' : isPast ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {s.label}
                  </span>
                  {idx < stepsList.length - 1 && <span className="text-gray-300 ml-1">/</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Banner Sesi Tersimpan */}
        {sessionSavedCount > 0 && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-1.5 font-medium truncate">
              <span className="font-bold">✓ {sessionSavedCount} paket tersimpan di sesi ini</span>
              <span className="text-emerald-600 truncate max-w-xs text-[11px] hidden sm:inline">
                ({sessionSavedOrders.slice(0, 3).join(', ')}{sessionSavedOrders.length > 3 ? '...' : ''})
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-300 px-2 py-0.5 rounded hover:bg-emerald-100 cursor-pointer ml-2 flex-shrink-0"
            >
              Selesai & Tutup
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: PILIH MARKETPLACE */}
          {step === 'channel' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Pilih Marketplace
              </label>
              <div className="grid gap-2.5">
                {CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  return (
                    <button
                      key={ch.value}
                      type="button"
                      onClick={() => handleChannelSelect(ch.value)}
                      className="w-full text-left p-3.5 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/20 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 group-hover:border-blue-300">
                          {ch.value === 'TOKOPEDIA' ? (
                            <TokopediaOwlIcon size={26} />
                          ) : (
                            <Icon size={20} style={{ color: ch.brandColor }} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{ch.label}</p>
                          <p className="text-xs text-gray-500">{ch.expeditions}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Pilih <FiArrowRight size={13} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: INPUT / SCAN NOMOR RESI */}
          {step === 'resi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  {ChannelIcon && (
                    <div className="w-6 h-6 flex items-center justify-center">
                      {channel === 'TOKOPEDIA' ? (
                        <TokopediaOwlIcon size={20} />
                      ) : (
                        <ChannelIcon size={16} style={{ color: selectedChannel?.brandColor }} />
                      )}
                    </div>
                  )}
                  <span className="text-xs font-bold text-gray-800">{selectedChannel?.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('channel')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                >
                  Ganti Channel
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nomor Resi Pengiriman
                </label>
                <div className="relative">
                  <input
                    ref={resiInputRef}
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value.trim())}
                    onKeyDown={handleResiInput}
                    placeholder="Scan barcode resi atau ketik manual..."
                    className="w-full px-3.5 py-3 border border-gray-300 rounded-lg text-base font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    autoComplete="off"
                  />
                  {orderId && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrderId('');
                        resiInputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Tekan <strong>Enter</strong> pada keyboard atau alat scanner untuk lanjut ke scan SKU.
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setStep('channel')}
                  className="flex-1"
                >
                  ← Kembali
                </Button>
                <Button
                  variant="primary"
                  onClick={() => orderId.trim() && setStep('sku')}
                  disabled={!orderId.trim()}
                  className="flex-2"
                >
                  Lanjut Scan SKU →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: SCAN SKU PRODUK */}
          {step === 'sku' && (
            <div className="space-y-4">
              {/* Context Strip */}
              <div className="flex items-center justify-between text-xs bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  {ChannelIcon && (
                    <div className="w-5 h-5 flex items-center justify-center">
                      {channel === 'TOKOPEDIA' ? (
                        <TokopediaOwlIcon size={18} />
                      ) : (
                        <ChannelIcon size={15} style={{ color: selectedChannel?.brandColor }} />
                      )}
                    </div>
                  )}
                  <span className="font-semibold text-gray-800">{selectedChannel?.label}</span>
                  <span className="text-gray-300">|</span>
                  <span className="font-mono text-gray-700">Resi: <strong>{orderId}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('resi')}
                  className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                >
                  Ubah Resi
                </button>
              </div>

              {/* SKU Form */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 space-y-2.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Scan Barcode SKU Produk
                </label>
                <div className="flex gap-2">
                  <input
                    ref={skuInputRef}
                    type="text"
                    value={currentSkuCode}
                    onChange={(e) => setCurrentSkuCode(e.target.value.toUpperCase())}
                    onKeyDown={handleSkuKeyDown}
                    placeholder="Scan / ketik kode SKU..."
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                    disabled={isValidatingSku}
                  />

                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setCurrentQty((q) => Math.max(1, q - 1))}
                      disabled={currentQty <= 1 || isValidatingSku}
                      className="px-2.5 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                    >
                      <FiMinus size={12} />
                    </button>
                    <input
                      type="number"
                      value={currentQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setCurrentQty(isNaN(val) || val < 1 ? 1 : val);
                      }}
                      min={1}
                      className="w-10 text-center text-xs font-bold text-gray-900 border-x border-gray-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCurrentQty((q) => q + 1)}
                      disabled={isValidatingSku}
                      className="px-2.5 py-2 text-gray-600 hover:bg-gray-100 cursor-pointer"
                    >
                      <FiPlus size={12} />
                    </button>
                  </div>

                  <Button
                    variant="primary"
                    onClick={validateAndAddSku}
                    disabled={!currentSkuCode.trim() || isValidatingSku}
                    size="sm"
                    className="px-4"
                  >
                    {isValidatingSku ? '...' : '+ Tambah'}
                  </Button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Tekan <strong>Enter</strong> untuk langsung menambahkan SKU ke daftar.
                </p>
              </div>

              {/* Scanned Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>Daftar SKU ({items.length} item)</span>
                  {items.length > 0 && (
                    <span className="text-gray-500 font-normal">
                      Total: <strong>{totalUnits}</strong> Pcs
                    </span>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-400 text-xs">
                    Belum ada SKU yang dimasukkan untuk resi ini.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {items.map((item, idx) => {
                      const isValid = item.status === 'valid';
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border flex items-center justify-between gap-2.5 text-xs ${
                            isValid
                              ? 'bg-white border-gray-200'
                              : 'bg-red-50/50 border-red-200 text-red-700'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-gray-900">{item.skuCode}</span>
                              {isValid && item.stock !== undefined && (
                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                  Stok: {item.stock}
                                </span>
                              )}
                            </div>
                            {item.skuName && (
                              <p className="text-gray-500 truncate text-[11px] mt-0.5">{item.skuName}</p>
                            )}
                            {item.errorMsg && (
                              <p className="text-red-600 font-medium text-[11px] mt-0.5">{item.errorMsg}</p>
                            )}
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isValid && (
                              <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(idx, item.qty - 1)}
                                  disabled={item.qty <= 1}
                                  className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                                >
                                  <FiMinus size={11} />
                                </button>
                                <span className="px-2 text-xs font-bold text-gray-900 min-w-5 text-center">
                                  {item.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(idx, item.qty + 1)}
                                  className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                >
                                  <FiPlus size={11} />
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                              title="Hapus"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {invalidItems.length > 0 && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center gap-1.5">
                    <FiAlertCircle size={14} className="flex-shrink-0" />
                    <span>{invalidItems.length} SKU tidak valid akan dilewati saat simpan.</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center gap-2.5 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setStep('resi')}
                  className="flex-1"
                >
                  ← Ubah Resi
                </Button>
                <Button
                  variant="primary"
                  onClick={() => validItems.length > 0 && setStep('review')}
                  disabled={validItems.length === 0}
                  className="flex-2"
                >
                  Lanjut ke Konfirmasi ({validItems.length} SKU) →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: KONFIRMASI & SIMPAN */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-500">Marketplace</span>
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    {ChannelIcon && (
                      <span className="w-4 h-4 flex items-center justify-center">
                        {channel === 'TOKOPEDIA' ? (
                          <TokopediaOwlIcon size={16} />
                        ) : (
                          <ChannelIcon size={13} style={{ color: selectedChannel?.brandColor }} />
                        )}
                      </span>
                    )}
                    <span>{selectedChannel?.label}</span>
                  </div>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-500">Nomor Resi</span>
                  <span className="font-mono font-bold text-gray-900">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Barang</span>
                  <span className="font-bold text-gray-900">
                    {validItems.length} SKU ({totalUnits} Pcs)
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Rincian Item yang Disimpan:
                </label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {validItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white border border-gray-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-gray-900">{item.skuCode}</span>
                        {item.skuName && (
                          <p className="text-[11px] text-gray-500 truncate">{item.skuName}</p>
                        )}
                      </div>
                      <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                        {item.qty} Unit
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setStep('sku')}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    ← Edit
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting || validItems.length === 0}
                    className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Menyimpan...' : '✓ Simpan & Scan Paket Lain'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting || validItems.length === 0}
                    className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                    style={{ backgroundColor: '#059669', borderColor: '#047857' }}
                  >
                    {isSubmitting ? 'Menyimpan...' : '✓ Simpan & Selesai'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
