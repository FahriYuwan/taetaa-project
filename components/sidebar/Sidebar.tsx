'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { colors } from '@/lib/theme';

export function Sidebar() {
  const pathname = usePathname();

  const items = [
    { label: 'Dashboard', icon: '📊', href: '/dashboard'},
    { label: 'Master SKU', icon: '🏷️', href: '/master-sku'},
    { label: 'Pembelian RAW', icon: '🛒', href: '/pembelian-raw'},
    { label: 'Produksi (RAW→WIP)', icon: '📄', href: '/produksi'},
    { label: 'Penjualan', icon: '💻', href: '/penjualan', children: [{label: 'Marketplace', href: '/penjualan/marketplace'}, {label:'Affiliate', href: '/penjualan/affiliate'}]},
    { label: 'Kerugian & Pengeluaran', icon: '🗑️', href: '/kerugian-pengeluaran', children: [{label: 'Lost & Breakage', href: '/kerugian-pengeluaran/lost-breakage'}, {label:'Pengeluaran Lain', href: '/kerugian-pengeluaran/pengeluaran-lain'}]},
    { label: 'Inventory', icon: '👤', href: '/inventory'},
    { label: 'Laporan & Export', icon: '📋', href: '/laporan'},
  ];

  return (
      <div className="fixed left-0 top-0 h-screen w-56 border-r" style={{ borderColor: colors.neutral.border, backgroundColor: colors.neutral.card }}>
        {/* Logo Section */}
        <div className="p-6">
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
        <nav className="space-y-2 px-3 mt-6">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const hasChildren = item.children && item.children.length > 0;

            return (
                <div key={item.href} className="space-y-1">
                  {/* Menu Utama */}
                  <Link href={item.href}>
                    <div
                        className="w-full text-left px-4 py-2.5 rounded text-sm font-medium transition-colors cursor-pointer flex items-center"
                        style={{
                          backgroundColor: isActive ? colors.brand[500] : 'transparent',
                          color: isActive ? 'white' : colors.neutral.textMuted,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(79, 195, 247, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                    >
                      <span className="mr-2">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  </Link>

                  {/* Sub-menu (Jika ada children) */}
                  {hasChildren && (
                      <div className="ml-6 space-y-1">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href;
                          return (
                              <Link key={child.href} href={child.href}>
                                <div
                                    className="w-full text-left px-4 py-2 rounded text-xs font-medium transition-colors cursor-pointer"
                                    style={{
                                      backgroundColor: isChildActive ? 'rgba(79, 195, 247, 0.1)' : 'transparent',
                                      color: isChildActive ? colors.brand[500] : colors.neutral.textMuted,
                                    }}
                                >
                                  {child.label}
                                </div>
                              </Link>
                          );
                        })}
                      </div>
                  )}
                </div>
            );
          })}
        </nav>

        {/* Footer Section */}
        <div className="absolute bottom-4 left-4 text-[10px] leading-relaxed" style={{ color: colors.neutral.textMuted }}>
          <p className="font-medium">v1.0 - Weighted Average HPP</p>
          <p className="opacity-70">Manual entry mode</p>
        </div>
      </div>
  );}