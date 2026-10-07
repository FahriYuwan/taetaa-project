'use client';

import { useSidebar } from '@/components/sidebar/SidebarContext';
import { colors } from '@/lib/theme';
import { FiMenu, FiSidebar } from 'react-icons/fi';

export function TopBar() {
  const { isDesktopOpen, toggleDesktop, toggleMobile } = useSidebar();

  return (
    <>
      {/* ── MOBILE TOPBAR (Android / Ponsel) ── */}
      <header
        className="lg:hidden shrink-0 h-14 flex items-center justify-between px-4 border-b z-20"
        style={{
          backgroundColor: colors.neutral.card,
          borderColor: colors.neutral.border,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-2xs border border-gray-100 shrink-0 overflow-hidden p-0.5">
            <img
              src="/logo.png"
              alt="Taetaa Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-bold text-sm block leading-tight" style={{ color: colors.neutral.textStrong }}>
              Taetaa
            </span>
            <span className="text-[9px] uppercase tracking-wider block font-semibold text-gray-400">
              Company Sistem
            </span>
          </div>
        </div>

        <button
          onClick={toggleMobile}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100 active:bg-gray-200 cursor-pointer"
          style={{ color: colors.neutral.textStrong }}
          aria-label="Buka Menu"
          title="Buka Menu"
        >
          <FiMenu size={22} />
        </button>
      </header>

      {/* ── DESKTOP TOPBAR (Website saat Sidebar Disembunyikan) ── */}
      {!isDesktopOpen && (
        <header
          className="hidden lg:flex shrink-0 h-12 items-center justify-between px-4 border-b bg-white/95 backdrop-blur-xs z-20 shadow-2xs transition-all"
          style={{ borderColor: colors.neutral.border }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDesktop}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 text-xs font-semibold shadow-2xs transition-all hover:border-gray-300 cursor-pointer group"
              title="Tampilkan Menu Navigasi"
            >
              <FiSidebar size={16} className="text-blue-600 transition-transform group-hover:scale-110" />
              <span>Tampilkan Menu</span>
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <img
                src="/logo.png"
                alt="Taetaa Logo"
                className="w-5 h-5 object-contain shrink-0"
              />
              <span className="text-xs font-bold text-gray-800">Taetaa</span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                Company Sistem
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Mode Layar Lebar
          </div>
        </header>
      )}
    </>
  );
}
