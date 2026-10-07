'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import { useSidebar } from '@/components/sidebar/SidebarContext';
import {
  FiGrid,
  FiTag,
  FiBox,
  FiShoppingCart,
  FiLayers,
  FiTrendingDown,
  FiFolder,
  FiChevronRight,
  FiChevronsLeft,
  FiX,
} from 'react-icons/fi';

export function Sidebar() {
  const pathname = usePathname();
  const { isDesktopOpen, isMobileOpen, toggleDesktop, closeMobile } = useSidebar();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Penjualan': true,
    'Kerugian & Pengeluaran': true,
  });

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobile();
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const items = [
    { label: 'Dashboard', icon: <FiGrid size={16} />, href: '/dashboard' },
    { label: 'Master SKU', icon: <FiTag size={16} />, href: '/master-sku' },
    { label: 'Master Kemasan', icon: <FiBox size={16} />, href: '/master-kemasan' },
    { label: 'Pembelian RAW', icon: <FiShoppingCart size={16} />, href: '/pembelian-raw' },
    { label: 'Produksi (RAW→PRODUCT)', icon: <FiLayers size={16} />, href: '/produksi' },
    {
      label: 'Penjualan',
      icon: <FiFolder size={16} />,
      isHeader: true,
      children: [
        { label: 'Marketplace', href: '/penjualan/marketplace' },
        { label: 'Affiliate', href: '/penjualan/affiliate' },
      ],
    },
    {
      label: 'Kerugian & Pengeluaran',
      icon: <FiTrendingDown size={16} />,
      isHeader: true,
      children: [
        { label: 'Lost & Breakage', href: '/kerugian-pengeluaran/lost-breakage' },
        { label: 'Pengeluaran Lain', href: '/kerugian-pengeluaran/pengeluaran-lain' },
      ],
    },
    { label: 'Inventory', icon: <FiBox size={16} />, href: '/inventory' },
    { label: 'Stock Opname', icon: <FiGrid size={16} />, href: '/inventory/opname' },
    { label: 'Laporan & Export', icon: <FiLayers size={16} />, href: '/laporan' },
  ];

  const NavContent = () => (
    <>
      {/* Header Section */}
      <div
        className="p-4 shrink-0 flex items-center justify-between border-b"
        style={{ borderColor: colors.neutral.border }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white shadow-2xs border border-gray-100 shrink-0 overflow-hidden p-0.5">
            <img
              src="/logo.png"
              alt="Taetaa Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight" style={{ color: colors.neutral.textStrong }}>
              Taetaa
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: colors.neutral.textMuted }}>
              Company Sistem
            </p>
          </div>
        </div>

        {/* Desktop Collapse / Hide Button */}
        <button
          onClick={toggleDesktop}
          className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          title="Sembunyikan Sidebar"
          aria-label="Sembunyikan Sidebar"
        >
          <FiChevronsLeft size={18} />
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={closeMobile}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          title="Tutup Menu"
          aria-label="Tutup Menu"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto pb-16">
        {items.map((item: any) => {
          const isActive = pathname === item.href;
          const hasChildren = item.children && item.children.length > 0;
          const isHeader = item.isHeader;
          const isExpanded = openSections[item.label] ?? false;

          return (
            <div key={item.label} className="space-y-0.5">
              {isHeader ? (
                <div
                  onClick={() => toggleSection(item.label)}
                  className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between cursor-pointer select-none transition-all duration-200"
                  style={{ color: isExpanded ? colors.brand[500] : colors.neutral.textStrong }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.02)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="flex items-center">
                    <span className="mr-3 flex items-center opacity-75">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span
                    className="flex items-center transition-transform duration-300"
                    style={{
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      color: colors.neutral.textMuted,
                    }}
                  >
                    <FiChevronRight size={14} />
                  </span>
                </div>
              ) : (
                <Link href={item.href} onClick={closeMobile}>
                  <div
                    className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center"
                    style={{
                      backgroundColor: isActive ? colors.brand[500] : 'transparent',
                      color: isActive ? 'white' : colors.neutral.textMuted,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(79,195,247,0.08)';
                        (e.currentTarget as HTMLElement).style.color = colors.neutral.textStrong;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = colors.neutral.textMuted;
                      }
                    }}
                  >
                    <span className="mr-3 flex items-center opacity-75">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                </Link>
              )}

              {hasChildren && (
                <div
                  className="grid transition-all duration-300"
                  style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr', opacity: isExpanded ? 1 : 0 }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="ml-7 space-y-0.5 border-l-2 pl-2 my-1 transition-transform duration-300"
                      style={{
                        borderColor: colors.neutral.border,
                        transform: isExpanded ? 'translateY(0)' : 'translateY(-8px)',
                      }}
                    >
                      {item.children.map((child: any) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link key={child.href} href={child.href} onClick={closeMobile}>
                            <div
                              className="w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer"
                              style={{
                                backgroundColor: isChildActive ? 'rgba(30,136,229,0.08)' : 'transparent',
                                color: isChildActive ? colors.brand[500] : colors.neutral.textMuted,
                                fontWeight: isChildActive ? '600' : '500',
                                boxShadow: isChildActive ? 'inset 2px 0 0 ' + colors.brand[500] : 'none',
                              }}
                              onMouseEnter={(e) => {
                                if (!isChildActive) {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.02)';
                                  (e.currentTarget as HTMLElement).style.color = colors.neutral.textStrong;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isChildActive) {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                                  (e.currentTarget as HTMLElement).style.color = colors.neutral.textMuted;
                                }
                              }}
                            >
                              {child.label}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="absolute bottom-3 left-4 text-[10px] leading-relaxed"
        style={{ color: colors.neutral.textMuted }}
      >
        <p className="font-medium">v1.0 · Weighted Average HPP</p>
      </div>
    </>
  );

  return (
    <>
      {/* ── MOBILE DRAWER OVERLAY (Android / Layar Kecil) ── */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${
          isMobileOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
      >
        {/* Backdrop (Sentuh untuk menyembunyikan/menutup sidebar) */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMobile}
        />

        {/* Drawer panel */}
        <div
          className={`relative w-64 h-full flex flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ backgroundColor: colors.neutral.card }}
          onClick={(e) => e.stopPropagation()}
        >
          <NavContent />
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR (Bisa disembunyikan/slide keluar) ── */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-screen w-56 border-r flex-col overflow-hidden z-30 transition-transform duration-300 ease-in-out shadow-xs ${
          isDesktopOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ borderColor: colors.neutral.border, backgroundColor: colors.neutral.card }}
      >
        <NavContent />
      </aside>
    </>
  );
}