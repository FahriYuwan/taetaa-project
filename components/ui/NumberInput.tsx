'use client';

import React, { useState, useEffect } from 'react';

export interface NumberInputProps {
  value: number | undefined | null;
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  showPreview?: boolean;
  id?: string;
  name?: string;
}

/**
 * Format integer with Indonesian dot '.' separator.
 * Example: 1500000 -> "1.500.000"
 */
function formatIndonesianNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '';
  return num.toLocaleString('id-ID');
}

/**
 * Input field with real-time Indonesian thousand separator ('.').
 * Keeps value as standard number for state, while displaying user-friendly
 * Indonesian formatting so users can verify zero counts easily (e.g. 50.000 vs 500.000).
 */
export function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  placeholder = '0',
  className = '',
  style,
  disabled = false,
  min,
  max,
  allowDecimal = false,
  showPreview = false,
  id,
  name,
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (value === undefined || value === null || value === 0) return '';
    return formatIndonesianNumber(value);
  });

  // Sync internal display when external value changes
  useEffect(() => {
    if (value === undefined || value === null) {
      setDisplayValue('');
    } else {
      const rawNum = parseNumeric(displayValue);
      // Only reformat if the numeric value actually differs
      if (rawNum !== value) {
        setDisplayValue(value === 0 ? '' : formatIndonesianNumber(value));
      }
    }
  }, [value]);

  function parseNumeric(str: string): number {
    if (!str) return 0;
    if (allowDecimal) {
      // In Indonesian format, '.' is thousands and ',' is decimal
      // Convert standard clean
      const cleaned = str.replace(/\./g, '').replace(/,/g, '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    const cleaned = str.replace(/[^0-9]/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const inputVal = e.target.value;

    if (!inputVal.trim()) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    if (allowDecimal) {
      // Allow digits and single comma or dot
      const cleaned = inputVal.replace(/[^0-9,.]/g, '');
      const num = parseNumeric(cleaned);
      if (min !== undefined && num < min) return;
      if (max !== undefined && num > max) return;
      setDisplayValue(cleaned);
      onChange(num);
      return;
    }

    // Integer with live Indonesian thousand dot separators
    const digitsOnly = inputVal.replace(/[^0-9]/g, '');
    if (!digitsOnly) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    let num = parseInt(digitsOnly, 10);
    if (isNaN(num)) num = 0;

    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;

    setDisplayValue(num.toLocaleString('id-ID'));
    onChange(num);
  }

  return (
    <div className="relative w-full">
      <div className="relative flex items-center w-full">
        {prefix && (
          <span className="absolute left-3 text-xs font-semibold text-gray-500 pointer-events-none select-none">
            {prefix}
          </span>
        )}

        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          style={style}
          className={`w-full text-xs rounded-lg transition-colors focus:outline-none ${
            prefix ? 'pl-8' : 'pl-3'
          } ${suffix ? 'pr-10' : 'pr-3'} py-2 ${className}`}
        />

        {suffix && (
          <span className="absolute right-3 text-xs font-medium text-gray-400 pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>

      {showPreview && value !== undefined && value !== null && value > 0 && (
        <p className="text-[10px] text-gray-500 mt-0.5 px-1 truncate">
          Format: {prefix || ''}{value.toLocaleString('id-ID')}{suffix ? ` ${suffix}` : ''}
        </p>
      )}
    </div>
  );
}
