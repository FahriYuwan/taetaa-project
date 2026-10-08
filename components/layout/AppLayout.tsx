'use client';

import { useSidebar } from '@/components/sidebar/SidebarContext';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { RestockAlertModal } from '@/components/modals/RestockAlertModal';
import { RestockAlertsProvider, useRestockAlertsContext } from '@/components/layout/RestockAlertsContext';

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { isDesktopOpen } = useSidebar();
  const { alerts, isModalOpen, closeModal } = useRestockAlertsContext();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Sidebar untuk Desktop & Drawer Mobile */}
      <Sidebar />

      {/* Area Konten Utama */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-[margin] duration-300 ease-in-out ${
          isDesktopOpen ? 'lg:ml-56' : 'lg:ml-0'
        }`}
      >
        {/* TopBar responsif: Selalu tampil di HP Android, dan tampil di Desktop saat sidebar disembunyikan */}
        <TopBar />

        {/* Container Viewport Halaman */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </main>
      </div>

      {/* Restock Alert Popup — muncul sekali per hari jika ada stok menipis */}
      <RestockAlertModal
        isOpen={isModalOpen}
        onClose={closeModal}
        alerts={alerts}
      />
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RestockAlertsProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </RestockAlertsProvider>
  );
}
