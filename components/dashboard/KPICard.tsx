import { colors } from '@/lib/theme';
import { ReactNode } from 'react';

interface KPICardProps {
  label: string;
  value: ReactNode;
  valueColor?: string;
  description: string;
  isList?: boolean;
  icon?: ReactNode;
}

export function KPICard({
  label,
  value,
  valueColor = colors.neutral.textStrong,
  description,
  isList = false,
  icon,
}: KPICardProps) {
  return (
    <div
      style={{
        backgroundColor: colors.neutral.card,
        border: `1px solid ${colors.neutral.border}`,
        borderRadius: '12px',
        padding: '24px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: colors.neutral.textMuted,
            }}
          >
            {label}
          </div>
          {icon && (
            <div style={{ color: colors.brand[500], opacity: 0.8 }}>
              {icon}
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: isList ? '14px' : '28px',
            fontWeight: isList ? '600' : '800',
            color: valueColor || colors.neutral.textStrong,
            marginBottom: '16px',
            lineHeight: isList ? '1.8' : '1.2',
            whiteSpace: 'pre-line',
          }}
        >
          {value}
        </div>
      </div>
      <div
        style={{
          paddingTop: '12px',
          borderTop: `1px solid ${colors.neutral.border}`,
          fontSize: '12px',
          color: colors.neutral.textMuted,
          fontStyle: 'italic',
        }}
      >
        {description}
      </div>
    </div>
  );
}
