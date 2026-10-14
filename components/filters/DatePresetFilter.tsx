'use client';

import React from 'react';
import { colors } from '@/lib/theme';

export interface DatePresetFilterProps {
  fromDate: string;
  toDate: string;
  onDateChange: (from: string, to: string) => void;
}

export function DatePresetFilter({
  fromDate,
  toDate,
  onDateChange,
}: DatePresetFilterProps) {
  // Hitung rentang tanggal dinamis berbasis waktu berjalan saat ini
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  // Bulan Ini: tanggal 1 s/d akhir bulan berjalan
  const thisMonthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const thisMonthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];

  // Bulan Lalu: tanggal 1 s/d akhir bulan sebelumnya
  const prevMonthDate = new Date(year, month - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();
  const lastMonthStart = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`;
  const lastMonthEnd = new Date(prevYear, prevMonth + 1, 0).toISOString().split('T')[0];

  // 30 Hari: 30 hari ke belakang s/d hari ini
  const last30Date = new Date();
  last30Date.setDate(last30Date.getDate() - 30);
  const last30Start = last30Date.toISOString().split('T')[0];

  function applyPreset(preset: 'all' | 'thisMonth' | 'lastMonth' | 'last30') {
    switch (preset) {
      case 'all':
        onDateChange('', '');
        break;
      case 'thisMonth':
        onDateChange(thisMonthStart, thisMonthEnd);
        break;
      case 'lastMonth':
        onDateChange(lastMonthStart, lastMonthEnd);
        break;
      case 'last30':
        onDateChange(last30Start, todayStr);
        break;
    }
  }

  const isAll = !fromDate && !toDate;
  const isThisMonth = fromDate === thisMonthStart && (toDate === thisMonthEnd || toDate === todayStr);
  const isLastMonth = fromDate === lastMonthStart && toDate === lastMonthEnd;
  const isLast30 = fromDate === last30Start && toDate === todayStr;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Quick Date Presets (Mekanisme Relatif Waktu Berjalan) */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-medium border border-gray-200">
        <button
          type="button"
          onClick={() => applyPreset('all')}
          className={`min-h-[34px] px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            isAll ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'
          }`}
          title="Tampilkan semua data tanpa filter tanggal"
        >
          Semua
        </button>

        <button
          type="button"
          onClick={() => applyPreset('thisMonth')}
          className={`min-h-[34px] px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            isThisMonth ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'
          }`}
          title={`Bulan Ini: ${thisMonthStart} s/d ${thisMonthEnd}`}
        >
          Bulan Ini
        </button>

        <button
          type="button"
          onClick={() => applyPreset('lastMonth')}
          className={`min-h-[34px] px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            isLastMonth ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'
          }`}
          title={`Bulan Lalu: ${lastMonthStart} s/d ${lastMonthEnd}`}
        >
          Bulan Lalu
        </button>

        <button
          type="button"
          onClick={() => applyPreset('last30')}
          className={`min-h-[34px] px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            isLast30 ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'
          }`}
          title={`30 Hari Terakhir: ${last30Start} s/d ${todayStr}`}
        >
          30 Hari
        </button>
      </div>

      {/* Manual Date Range Inputs */}
      <div
        className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border min-h-[36px]"
        style={{ borderColor: colors.neutral.border }}
      >
        <span className="text-xs text-gray-600 font-medium">Periode:</span>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onDateChange(e.target.value, toDate)}
          className="text-xs text-gray-700 px-1 py-0.5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          aria-label="Tanggal Mulai"
        />
        <span className="text-xs text-gray-500 font-medium">s/d</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => onDateChange(fromDate, e.target.value)}
          className="text-xs text-gray-700 px-1 py-0.5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          aria-label="Tanggal Selesai"
        />
        {(fromDate || toDate) && (
          <button
            type="button"
            onClick={() => onDateChange('', '')}
            className="w-6 h-6 flex items-center justify-center text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded ml-1 cursor-pointer"
            title="Reset Filter Tanggal"
            aria-label="Reset Filter Tanggal"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
