'use client';

import { useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const toastStore = {
  listeners: new Set<(toasts: Toast[]) => void>(),
  toasts: [] as Toast[],
  
  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },
  
  notify(message: string, type: ToastType = 'info', duration = 3000) {
    const id = Math.random().toString(36).substr(2, 9);
    const toast = { id, message, type };
    
    this.toasts = [...this.toasts, toast];
    this.listeners.forEach(l => l(this.toasts));
    
    if (duration > 0) {
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.listeners.forEach(l => l(this.toasts));
      }, duration);
    }
    
    return id;
  },
};

export function useToast() {
  return {
    showToast: useCallback((opts: { type: ToastType; message: string }) => {
      toastStore.notify(opts.message, opts.type);
    }, []),
  };
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  useEffect(() => {
    return toastStore.subscribe(setToasts);
  }, []);
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg text-white text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-300`}
          style={{
            backgroundColor: 
              toast.type === 'success' ? '#10B981' :
              toast.type === 'error' ? '#EF4444' :
              '#3B82F6',
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
