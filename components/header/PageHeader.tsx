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
      className="px-4 md:px-6 py-4 md:py-5 border-b flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
      style={{ backgroundColor: colors.neutral.bg, borderColor: colors.neutral.border }}
    >
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest font-medium hidden md:block" style={{ color: colors.neutral.textMuted }}>
          Taetaa Company Sistem
        </p>
        <h1 className="text-xl md:text-3xl font-bold mt-0 md:mt-1 truncate" style={{ color: colors.neutral.textStrong }}>
          {title}
        </h1>
        <p className="text-xs md:text-sm mt-0.5 md:mt-1 line-clamp-2" style={{ color: colors.neutral.textMuted }}>
          {subtitle}
        </p>
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
