'use client';

import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

interface ExportCardProps {
  title: string;
  category: 'BERDASARKAN PERIODE' | 'SNAPSHOT';
  description: string;
  onDownload: () => void;
  isLoading?: boolean;
}

export function ExportCard({
  title,
  category,
  description,
  onDownload,
  isLoading = false,
}: ExportCardProps) {
  return (
    <div
      style={{
        backgroundColor: colors.neutral.card,
        border: `1px solid ${colors.neutral.border}`,
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '350px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Icon decoration in top right */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          color: '#9CA3AF',
          fontSize: '20px',
        }}
      >
        📄
      </div>

      <div
        style={{
          fontSize: '10px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: colors.neutral.textMuted,
          marginBottom: '8px',
        }}
      >
        {category}
      </div>

      <h3
        style={{
          fontSize: '18px',
          fontWeight: '700',
          color: colors.neutral.textStrong,
          marginBottom: '8px',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '13px',
          color: colors.neutral.textMuted,
          marginBottom: '24px',
          lineHeight: '1.4',
        }}
      >
        {description}
      </p>

      <div style={{ marginTop: 'auto' }}>
        <Button
          variant="primary"
          onClick={onDownload}
          disabled={isLoading}
          icon="📥"
        >
          {isLoading ? 'Downloading...' : 'Download CSV'}
        </Button>
      </div>
    </div>
  );
}
