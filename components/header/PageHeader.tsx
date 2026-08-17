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
      className="px-6 py-6 border-b flex justify-between items-start"
      style={{ backgroundColor: colors.neutral.bg, borderColor: colors.neutral.border }}
    >
      <div>
        <p className="text-xs uppercase tracking-widest font-medium" style={{ color: colors.neutral.textMuted }}>
          Taetaa Company Sistem
        </p>
        <h1 className="text-3xl font-bold mt-1" style={{ color: colors.neutral.textStrong }}>
          {title}
        </h1>
        <p className="text-sm mt-1" style={{ color: colors.neutral.textMuted }}>
          {subtitle}
        </p>
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
}
