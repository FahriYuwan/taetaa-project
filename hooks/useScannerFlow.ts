'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/lib/toast';

export interface ScannedItem {
  skuCode: string;
  qty: number;
  skuName?: string;
  stock?: number;
  status: 'valid' | 'invalid';
  errorMsg?: string;
}

export type ScannerStep = 'channel' | 'resi' | 'sku' | 'review';

export interface UseScannerFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function useScannerFlow({ isOpen, onClose, onSuccess }: UseScannerFlowProps) {
  const [step, setStep] = useState<ScannerStep>('channel');
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

  // Reset all state when modal closes
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

  // Autofocus input fields on step transitions
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
        showToast({
          message: `Resi ${orderId.trim()} (${validItems.length} SKU) berhasil disimpan!`,
          type: 'success',
        });
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

  const validItems = items.filter((i) => i.status === 'valid');
  const invalidItems = items.filter((i) => i.status === 'invalid');
  const totalUnits = validItems.reduce((acc, curr) => acc + curr.qty, 0);

  return {
    step,
    setStep,
    channel,
    setChannel,
    orderId,
    setOrderId,
    currentSkuCode,
    setCurrentSkuCode,
    currentQty,
    setCurrentQty,
    items,
    validItems,
    invalidItems,
    totalUnits,
    isSubmitting,
    isValidatingSku,
    sessionSavedCount,
    sessionSavedOrders,
    resiInputRef,
    skuInputRef,
    handleChannelSelect,
    handleResiInput,
    handleSkuKeyDown,
    validateAndAddSku,
    removeItem,
    updateItemQty,
    handleSubmit,
  };
}
