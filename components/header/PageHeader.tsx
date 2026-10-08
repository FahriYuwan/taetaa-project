'use client';

import { colors } from '@/lib/theme';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div
      className="px-4 md:px-6 py-3.5 md:py-4 border-b flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"
      style={{ backgroundColor: colors.neutral.bg, borderColor: colors.neutral.border }}
    >
      <div className="min-w-0 max-w-xl">
        <p className="text-[10px] uppercase tracking-widest font-medium hidden md:block" style={{ color: colors.neutral.textMuted }}>
          Taetaa Company Sistem
        </p>
        <h1 className="text-xl md:text-2xl font-bold mt-0 md:mt-0.5 truncate" style={{ color: colors.neutral.textStrong }}>
          {title}
        </h1>
        <p className="text-xs md:text-sm mt-0.5 line-clamp-2" style={{ color: colors.neutral.textMuted }}>
          {subtitle}
        </p>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          {actions}
        </div>
      )}
    </div>
  );
}
