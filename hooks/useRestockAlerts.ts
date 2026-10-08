'use client';

import { useState, useEffect, useCallback } from 'react';

export interface RestockItem {
  id: string;
  code: string;
  name: string;
  type: string;
  stockAkhir: number;
  stockMin: number;
  deficit: number;
}

const STORAGE_KEY = 'restock_modal_dismissed_date';

/**
 * Hook that fetches restock alerts and manages modal "shown once per day" logic.
 *
 * - Fetches /api/inventory/restock-alerts on mount.
 * - Shows the popup modal once per day (resets at midnight).
 * - Returns alerts array + modal open state for consumption by dashboard or layout.
 */
export function useRestockAlerts() {
  const [alerts, setAlerts] = useState<RestockItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/restock-alerts');
      if (!res.ok) return;
      const data = await res.json();
      const items: RestockItem[] = data.alerts || [];
      setAlerts(items);

      if (items.length > 0) {
        const today = new Date().toDateString();
        const lastDismissed = localStorage.getItem(STORAGE_KEY);
        if (lastDismissed !== today) {
          setIsModalOpen(true);
        }
      }
    } catch {
      // silent fail
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    localStorage.setItem(STORAGE_KEY, new Date().toDateString());
  }, []);

  return { alerts, isModalOpen, closeModal, isLoaded };
}
