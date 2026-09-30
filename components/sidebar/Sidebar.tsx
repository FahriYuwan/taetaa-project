'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';
import {
  FiGrid,
  FiTag,
  FiBox,
  FiShoppingCart,
  FiLayers,
  FiTrendingDown,
  FiFolder,
  FiChevronRight,
  FiMenu,
  FiX,
} from 'react-icons/fi';

export function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Penjualan': true,
    'Kerugian & Pengeluaran': true,
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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
      {/* Logo Section */}
      <div className="p-5 shrink-0 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md shrink-0"
          style={{ background: colors.brand.gradient }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 4L16 9H8L12 4Z" fill="white" fillOpacity="0.9" />
            <path d="M17 11L21 16H3L7 11H17Z" fill="white" fillOpacity="0.8" />
            <path d="M18 18L22 23H2L6 18H18Z" fill="white" fillOpacity="0.7" />
          </svg>
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight" style={{ color: colors.neutral.textStrong }}>
            Taetaa
          </h1>
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: colors.neutral.textMuted }}>
            Company Sistem
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 overflow-y-auto pb-16">
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
                  className="w-full text-left px-4 py-2.5 rounded text-sm font-semibold flex items-center justify-between cursor-pointer select-none transition-all duration-200"
                  style={{ color: isExpanded ? colors.brand[500] : colors.neutral.textStrong }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.02)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                >
                  <div className="flex items-center">
                    <span className="mr-3 flex items-center opacity-75">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span
                    className="flex items-center transition-transform duration-300"
                    style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', color: colors.neutral.textMuted }}
                  >
                    <FiChevronRight size={14} />
                  </span>
                </div>
              ) : (
                <Link href={item.href}>
                  <div
                    className="w-full text-left px-4 py-2.5 rounded text-sm font-medium transition-all duration-200 cursor-pointer flex items-center"
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
                      className="ml-8 space-y-0.5 border-l-2 pl-2 transition-transform duration-300"
                      style={{
                        borderColor: colors.neutral.border,
                        transform: isExpanded ? 'translateY(0)' : 'translateY(-8px)',
                      }}
                    >
                      {item.children.map((child: any) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link key={child.href} href={child.href}>
                            <div
                              className="w-full text-left px-3 py-2 rounded text-xs font-medium transition-all duration-200 cursor-pointer"
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
      <div className="absolute bottom-3 left-4 text-[10px] leading-relaxed" style={{ color: colors.neutral.textMuted }}>
        <p className="font-medium">v1.0 · Weighted Average HPP</p>
      </div>
    </>
  );

  return (
    <>
      {/* ── MOBILE TOPBAR ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: colors.neutral.card, borderColor: colors.neutral.border }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: colors.brand.gradient }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L16 9H8L12 4Z" fill="white" fillOpacity="0.9" />
              <path d="M17 11L21 16H3L7 11H17Z" fill="white" fillOpacity="0.8" />
            </svg>
          </div>
          <span className="font-bold text-sm" style={{ color: colors.neutral.textStrong }}>Taetaa</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: colors.neutral.textStrong }}
        >
          <FiMenu size={22} />
        </button>
      </div>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setMobileOpen(false)}
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* drawer panel */}
          <div
            className="relative w-64 h-full flex flex-col overflow-hidden shadow-2xl"
            style={{ backgroundColor: colors.neutral.card }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg z-10 transition-colors"
              style={{ color: colors.neutral.textMuted }}
            >
              <FiX size={18} />
            </button>
            <NavContent />
          </div>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <div
        className="hidden lg:flex fixed left-0 top-0 h-screen w-56 border-r flex-col overflow-hidden"
        style={{ borderColor: colors.neutral.border, backgroundColor: colors.neutral.card }}
      >
        <NavContent />
      </div>
    </>
  );
}