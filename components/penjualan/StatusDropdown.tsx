'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiCheck, FiLoader } from 'react-icons/fi';
import { STATUS_BADGE, STATUS_LABEL } from './types';

export interface StatusOption {
  value: string;
  label: string;
  description: string;
  badgeStyle: string;
  dotColor: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'DITERIMA',
    label: 'Diterima',
    description: 'Pesanan sukses diterima pembeli',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  {
    value: 'HILANG',
    label: 'Hilang',
    description: 'Omset Rp 0, rugi HPP & biaya operasional',
    badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500',
  },
  {
    value: 'RETURN',
    label: 'Return',
    description: 'Omset Rp 0, stok dikembalikan ke gudang',
    badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
];

interface StatusDropdownProps {
  currentStatus: string;
  onSelect: (newStatus: string) => void;
  isSaving?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function StatusDropdown({
  currentStatus,
  onSelect,
  isSaving = false,
  disabled = false,
  size = 'sm',
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalCoords, setPortalCoords] = useState<{
    top: number;
    left: number;
    placement: 'bottom' | 'top';
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Normalize legacy status names
  const normalizedStatus =
    currentStatus === 'TERKIRIM'
      ? 'DITERIMA'
      : currentStatus === 'DIRETURN'
      ? 'RETURN'
      : currentStatus;

  // Toggle & compute portal position
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isSaving) return;

    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = spaceBelow < dropdownHeight ? 'top' : 'bottom';

    const top =
      placement === 'top'
        ? Math.max(10, rect.top - dropdownHeight - 4)
        : rect.bottom + 4;

    // Center horizontally relative to badge, with viewport bound guards
    const menuWidth = 270;
    let left = rect.left + rect.width / 2 - menuWidth / 2;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    setPortalCoords({ top, left, placement });
  };

  // Close on outside click, scroll, resize, or escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const handleSelectOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (value !== normalizedStatus) {
      onSelect(value);
    }
  };

  const currentBadgeClass =
    STATUS_BADGE[normalizedStatus] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  const currentLabel = STATUS_LABEL[normalizedStatus] ?? normalizedStatus;

  return (
    <div className="relative inline-block text-left">
      {/* Badge Button Trigger - Does NOT morph into a select box */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled || isSaving}
        title="Klik untuk memilih status"
        className={`group inline-flex items-center gap-1.5 rounded-full font-bold border transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
        } ${currentBadgeClass} ${
          isSaving
            ? 'opacity-70 cursor-wait'
            : 'hover:shadow-xs hover:brightness-95 active:scale-95'
        }`}
      >
        <span>{currentLabel}</span>

        {isSaving ? (
          <FiLoader size={10} className="animate-spin text-gray-500" />
        ) : (
          <FiChevronDown
            size={11}
            className={`transition-transform duration-150 text-gray-400 group-hover:text-gray-600 ${
              isOpen ? 'rotate-180 text-gray-700' : ''
            }`}
          />
        )}
      </button>

      {/* Floating Popover Menu via React Portal */}
      {isOpen &&
        portalCoords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${portalCoords.top}px`,
              left: `${portalCoords.left}px`,
              width: '270px',
              zIndex: 9999,
            }}
            className="bg-white rounded-xl shadow-xl border border-gray-200/90 py-1.5 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Ubah Status Transaksi
            </div>

            <div className="p-1 space-y-0.5">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = normalizedStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={(e) => handleSelectOption(opt.value, e)}
                    title={`${opt.label} — ${opt.description}`}
                    className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 text-blue-900'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${opt.dotColor}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? 'text-blue-900' : 'text-gray-800'
                          }`}
                        >
                          {opt.label}
                        </span>
                        {isSelected && (
                          <FiCheck size={12} className="text-blue-600 shrink-0" />
                        )}
                      </div>
                      <p
                        title={opt.description}
                        className="text-[10px] text-gray-500 leading-snug mt-0.5"
                      >
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
