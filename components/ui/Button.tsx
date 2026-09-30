'use client';

import { colors, skuTypeColors } from '@/lib/theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  icon, 
  children, 
  className = '',
  style,
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 
    'font-semibold rounded-xl transition-all duration-150 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none text-center';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm shadow-sm hover:shadow active:scale-[0.98]',
    lg: 'px-6 py-3.5 text-base font-bold shadow-md hover:shadow-lg active:scale-[0.98]',
  };

  const variantClasses = variant === 'primary'
    ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 active:bg-blue-800'
    : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 active:bg-gray-100 hover:border-gray-400';

  const defaultStyle = variant === 'primary' 
    ? { 
        backgroundColor: colors.brand[500], 
        color: '#ffffff',
        borderColor: colors.brand[700],
      }
    : { 
        backgroundColor: '#ffffff', 
        color: colors.neutral.textStrong,
        borderColor: colors.neutral.border,
      };

  return (
    <button 
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses} ${className}`}
      style={{ ...defaultStyle, ...style }}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

interface BadgeProps {
  type: 'RAW' | 'PRODUCT' | 'PACKAGE';
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
