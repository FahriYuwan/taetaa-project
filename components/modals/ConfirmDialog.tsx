'use client';

import { colors } from '@/lib/theme';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        className="rounded-lg p-6 max-w-sm w-full mx-4"
        style={{ backgroundColor: colors.neutral.card }}
      >
        <h2 className="text-lg font-bold" style={{ color: colors.neutral.textStrong }}>
          {title}
        </h2>
        <p className="mt-2 text-sm" style={{ color: colors.neutral.textMuted }}>
          {message}
        </p>
        
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded text-sm font-medium border transition-colors"
            style={{ 
              borderColor: colors.neutral.border,
              color: colors.neutral.textStrong 
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded text-sm font-medium text-white transition-colors"
            style={{ 
              backgroundColor: variant === 'danger' ? colors.semantic.red : colors.brand[500],
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
