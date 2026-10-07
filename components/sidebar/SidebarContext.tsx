'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isDesktopOpen: boolean;
  isMobileOpen: boolean;
  toggleDesktop: () => void;
  toggleMobile: () => void;
  openMobile: () => void;
  closeMobile: () => void;
  setDesktopOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load saved desktop preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('taetaa_sidebar_desktop_open');
      if (saved !== null) {
        setIsDesktopOpen(saved === 'true');
      }
    } catch {
      // Ignore localStorage errors in SSR/restricted environments
    }
  }, []);

  const toggleDesktop = () => {
    setIsDesktopOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('taetaa_sidebar_desktop_open', String(next));
      } catch {}
      return next;
    });
  };

  const toggleMobile = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const openMobile = () => {
    setIsMobileOpen(true);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  return (
    <SidebarContext.Provider
      value={{
        isDesktopOpen,
        isMobileOpen,
        toggleDesktop,
        toggleMobile,
        openMobile,
        closeMobile,
        setDesktopOpen: setIsDesktopOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
