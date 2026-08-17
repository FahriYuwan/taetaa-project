'use client';

import { colors, skuTypeColors } from '@/lib/theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', icon, children, ...props }: ButtonProps) {
  const baseClasses = 'font-medium rounded transition-colors flex items-center gap-2';
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = variant === 'primary' 
    ? { 
        backgroundColor: colors.brand[500],
        color: 'white',
        ':hover': { backgroundColor: colors.brand[700] }
      }
    : { 
        border: `1px solid ${colors.neutral.border}`,
        backgroundColor: colors.neutral.card,
        color: colors.neutral.textStrong,
        ':hover': { borderColor: colors.brand[400] }
      };

  return (
    <button 
      className={`${baseClasses} ${sizeClasses[size]}`}
      style={variantClasses as any}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

interface BadgeProps {
  type: 'RAW' | 'WIP' | 'PACKAGE';
  children: React.ReactNode;
}

export function Badge({ type, children }: BadgeProps) {
  return (
    <span 
      className="px-2.5 py-1 rounded text-xs font-medium text-white"
      style={{ backgroundColor: skuTypeColors[type] }}
    >
      {children}
    </span>
  );
}
