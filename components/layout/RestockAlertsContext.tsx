'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface RestockItem {
  id: string;
  code: string;
  name: string;
  type: string;
  stockAkhir: number;
  stockMin: number;
  deficit: number;
}

interface RestockAlertsContextValue {
  alerts: RestockItem[];
  isModalOpen: boolean;
  closeModal: () => void;
  refetch: () => void;
}

const RestockAlertsContext = createContext<RestockAlertsContextValue>({
  alerts: [],
  isModalOpen: false,
  closeModal: () => {},
  refetch: () => {},
});

const STORAGE_KEY = 'restock_modal_dismissed_date';

export function RestockAlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<RestockItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    localStorage.setItem(STORAGE_KEY, new Date().toDateString());
  }, []);

  return (
    <RestockAlertsContext.Provider value={{ alerts, isModalOpen, closeModal, refetch: fetchAlerts }}>
      {children}
    </RestockAlertsContext.Provider>
  );
}

export function useRestockAlertsContext() {
  return useContext(RestockAlertsContext);
}
