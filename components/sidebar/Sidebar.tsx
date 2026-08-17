'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { colors } from '@/lib/theme';

export function Sidebar() {
  const pathname = usePathname();

  const items = [
    { label: 'Dashboard', icon: '📊', href: '/dashboard' },
    { label: 'Master SKU', icon: '🏷️', href: '/master-sku' },
    { label: 'Pembelian RAW', icon: '🛒', href: '/pembelian-raw' },
    { label: 'Produksi (RAW→WIP)', icon: '📄', href: '/produksi' },
    { label: 'Penjualan', icon: '💻', href: '/penjualan' },
    { label: 'Inventory', icon: '👤', href: '/inventory' },
    { label: 'Laporan & Export', icon: '📋', href: '/laporan' },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-56 border-r" style={{ borderColor: colors.neutral.border, backgroundColor: colors.neutral.card }}>
      {/* Logo */}
      <div className="p-6">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 shadow-md"
          style={{ background: colors.brand.gradient }}
        >
          {/* Simplified pyramid logo using SVG */}
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

      {/* Navigation */}
      <nav className="space-y-2 px-3 mt-6">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className="w-full text-left px-4 py-2.5 rounded text-sm font-medium transition-colors cursor-pointer"
                style={{
                  backgroundColor: isActive ? colors.brand[500] : 'transparent',
                  color: isActive ? 'white' : colors.neutral.textMuted,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = `rgba(79, 195, 247, 0.1)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 text-[10px] leading-relaxed" style={{ color: colors.neutral.textMuted }}>
        <p className="font-medium">v1.0 - Weighted Average HPP</p>
        <p className="opacity-70">Manual entry mode</p>
      </div>
    </div>
  );
}
