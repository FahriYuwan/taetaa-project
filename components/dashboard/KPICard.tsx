import { colors } from '@/lib/theme';

interface KPICardProps {
  label: string;
  value: string;
  valueColor?: string;
  description: string;
}

export function KPICard({
  label,
  value,
  valueColor = colors.neutral.textStrong,
  description,
}: KPICardProps) {
  return (
    <div
      style={{
        backgroundColor: colors.neutral.card,
        border: `1px solid ${colors.neutral.border}`,
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: colors.neutral.textMuted,
          marginBottom: '8px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '26px',
          fontWeight: '700',
          color: valueColor,
          marginBottom: '8px',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '12px',
          color: colors.neutral.textMuted,
        }}
      >
        {description}
      </div>
    </div>
  );
}
