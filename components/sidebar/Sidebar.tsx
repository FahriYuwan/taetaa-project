'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { colors } from '@/lib/theme';
import {
  FiGrid,
  FiTag,
  FiBox,
  FiShoppingCart,
  FiLayers,
  FiTrendingDown,
  FiFolder,
  FiChevronRight
} from 'react-icons/fi';

export function Sidebar() {
  const pathname = usePathname();

  // State untuk menyimpan menu induk mana saja yang sedang terbuka (ter-expand)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Penjualan': true,
    'Kerugian & Pengeluaran': true
  });

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const items = [
    { label: 'Dashboard', icon: <FiGrid size={16} />, href: '/dashboard'},
    { label: 'Master SKU', icon: <FiTag size={16} />, href: '/master-sku'},
    { label: 'Master Kemasan', icon: <FiBox size={16} />, href: '/master-kemasan'},
    { label: 'Pembelian RAW', icon: <FiShoppingCart size={16} />, href: '/pembelian-raw'},
    { label: 'Produksi (RAW→PRODUCT)', icon: <FiLayers size={16} />, href: '/produksi'},
    { 
      label: 'Penjualan', 
      icon: <FiFolder size={16} />,
      isHeader: true,
      children: [
        {label: 'Marketplace', href: '/penjualan/marketplace'}, 
        {label:'Affiliate', href: '/penjualan/affiliate'}
      ]
    },
    { 
      label: 'Kerugian & Pengeluaran', 
      icon: <FiTrendingDown size={16} />,
      isHeader: true,
      children: [
        {label: 'Lost & Breakage', href: '/kerugian-pengeluaran/lost-breakage'}, 
        {label:'Pengeluaran Lain', href: '/kerugian-pengeluaran/pengeluaran-lain'}
      ]
    },
    { label: 'Inventory', icon: <FiBox size={16} />, href: '/inventory'},
    { label: 'Stock Opname', icon: <FiGrid size={16} />, href: '/inventory/opname'},
    { label: 'Laporan & Export', icon: <FiLayers size={16} />, href: '/laporan'},
  ];

  return (
      <div className="fixed left-0 top-0 h-screen w-56 border-r flex flex-col overflow-hidden" style={{ borderColor: colors.neutral.border, backgroundColor: colors.neutral.card }}>
        {/* Logo Section */}
        <div className="p-6 shrink-0">
          <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 shadow-md"
              style={{ background: colors.brand.gradient }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L16 9H8L12 4Z" fill="white" fillOpacity="0.9" />
              <path d="M17 11L21 16H3L7 11H17Z" fill="white" fillOpacity="0.8" />
              <path d="M18 18L22 23H2L6 18H18Z" fill="white" fillOpacity="0.7" />
            </svg>
          </div>
          <h1 className="font-bold text-lg leading-tight" style={{ color: colors.neutral.textStrong }}>
            Taetaa
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.neutral.textMuted }}>
            Company Sistem
          </p>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-2 px-3 mt-6 overflow-y-auto pb-20">
          {items.map((item: any) => {
            const isActive = pathname === item.href;
            const hasChildren = item.children && item.children.length > 0;
            const isHeader = item.isHeader;
            const isExpanded = openSections[item.label] ?? false;

            return (
                <div key={item.label} className="space-y-1">
                  {/* Menu Utama / Header */}
                  {isHeader ? (
                    <div
                        onClick={() => toggleSection(item.label)}
                        className="w-full text-left px-4 py-2.5 rounded text-sm font-semibold flex items-center justify-between cursor-pointer select-none transition-all duration-200"
                        style={{
                          color: isExpanded ? colors.brand[500] : colors.neutral.textStrong,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                    >
                      <div className="flex items-center">
                        <span className="mr-3 flex items-center opacity-75">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <span className="flex items-center transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', color: colors.neutral.textMuted }}>
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
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(79, 195, 247, 0.08)';
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

                  {/* Sub-menu Utama dengan CSS Grid Transitions ala UI Premium */}
                  {hasChildren && (
                    <div
                      className="grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                      style={{
                        gridTemplateRows: isExpanded ? '1fr' : '0fr',
                        opacity: isExpanded ? 1 : 0
                      }}
                    >
                      <div className="overflow-hidden">
                        <div
                          className="ml-8 space-y-1 border-l-2 pl-2 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                          style={{
                            borderColor: colors.neutral.border,
                            transform: isExpanded ? 'translateY(0)' : 'translateY(-8px)'
                          }}
                        >
                          {item.children.map((child: any) => {
                            const isChildActive = pathname === child.href;
                            return (
                                <Link key={child.href} href={child.href}>
                                  <div
                                      className="w-full text-left px-3 py-2 rounded text-xs font-medium transition-all duration-200 cursor-pointer"
                                      style={{
                                        backgroundColor: isChildActive ? 'rgba(30, 136, 229, 0.08)' : 'transparent',
                                        color: isChildActive ? colors.brand[500] : colors.neutral.textMuted,
                                        fontWeight: isChildActive ? '600' : '500',
                                        boxShadow: isChildActive ? 'inset 2px 0 0 ' + colors.brand[500] : 'none'
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

        {/* Footer Section */}
        <div className="absolute bottom-4 left-4 text-[10px] leading-relaxed shrink-0 bg-white/80 backdrop-blur w-full" style={{ color: colors.neutral.textMuted }}>
          <p className="font-medium">v1.0 - Weighted Average HPP</p>
          <p className="opacity-70">Manual entry mode</p>
        </div>
      </div>
  );
}