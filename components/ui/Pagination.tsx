'use client';

import React from 'react';
import { colors } from '@/lib/theme';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number | 'all';
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number | 'all') => void;
  pageSizeOptions?: Array<number | 'all'>;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200, 'all'],
  itemLabel = 'item',
}: PaginationProps) {
  if (totalItems === 0) return null;

  const isAll = pageSize === 'all';
  const effectiveSize = isAll ? totalItems : pageSize;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / effectiveSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = isAll ? 1 : Math.min((safePage - 1) * effectiveSize + 1, totalItems);
  const endItem = isAll ? totalItems : Math.min(safePage * effectiveSize, totalItems);

  // Generate pagination buttons with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: Array<number | '...'> = [1];
    const leftBound = Math.max(2, safePage - 1);
    const rightBound = Math.min(totalPages - 1, safePage + 1);

    if (leftBound > 2) {
      pages.push('...');
    }

    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }

    if (rightBound < totalPages - 1) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t text-xs select-none"
      style={{ borderColor: colors.neutral.border }}
    >
      {/* Range Info & Page Size Selector */}
      <div className="flex items-center gap-3 text-gray-600 flex-wrap justify-center sm:justify-start">
        <span>
          Menampilkan <strong className="text-gray-900 font-semibold">{startItem}</strong> -{' '}
          <strong className="text-gray-900 font-semibold">{endItem}</strong> dari{' '}
          <strong className="text-gray-900 font-semibold">{totalItems.toLocaleString('id-ID')}</strong> {itemLabel}
        </span>

        <div className="flex items-center gap-1.5 border-l pl-3" style={{ borderColor: colors.neutral.border }}>
          <span className="text-gray-500 text-[11px]">Per halaman:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
              onPageSizeChange(val);
              onPageChange(1);
            }}
            className="px-2 py-1 rounded border text-xs bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-gray-700 cursor-pointer"
            style={{ borderColor: colors.neutral.border }}
          >
            {pageSizeOptions.map((opt) => (
              <option key={String(opt)} value={opt}>
                {opt === 'all' ? 'Semua' : opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Controls */}
      {!isAll && totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safePage === 1}
            title="Halaman Pertama"
            className="p-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <FiChevronsLeft size={13} />
          </button>

          {/* Prev Page */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
            title="Halaman Sebelumnya"
            className="p-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <FiChevronLeft size={13} />
          </button>

          {/* Numbered Buttons */}
          <div className="flex items-center gap-1 mx-1">
            {pageNumbers.map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1.5 text-gray-400 font-bold">
                    ...
                  </span>
                );
              }
              const isActive = p === safePage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`min-w-[28px] h-7 px-2 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            disabled={safePage === totalPages}
            title="Halaman Berikutnya"
            className="p-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <FiChevronRight size={13} />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={safePage === totalPages}
            title="Halaman Terakhir"
            className="p-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <FiChevronsRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
