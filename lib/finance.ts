/**
 * Finance domain calculation utilities.
 * Unifies HPP and Profit fallback chains across sales and dashboard routes.
 */

export interface SaleCostInput {
  qty: number;
  hpp?: number | null;
  totalHpp?: number | null;
  laba?: number | null;
}

/**
 * Resolves effective Total HPP for a sale:
 * 1. sale.totalHpp (if > 0)
 * 2. sale.hpp (if > 0)
 * 3. Fallback: sale.qty * avgCost
 */
export function resolveSaleHpp(
  sale: SaleCostInput,
  avgCost: number
): number {
  if (sale.totalHpp && sale.totalHpp > 0) {
    return sale.totalHpp;
  }
  if (sale.hpp && sale.hpp > 0) {
    return sale.hpp;
  }
  return (sale.qty || 0) * (avgCost || 0);
}

/**
 * Resolves effective Profit (laba) for a sale:
 * 1. sale.laba (if explicitly stored and !== 0)
 * 2. Fallback: netRevenue - saleHpp
 */
export function resolveSaleProfit(
  sale: SaleCostInput,
  netRevenue: number,
  saleHpp: number
): number {
  if (sale.laba !== undefined && sale.laba !== null && sale.laba !== 0) {
    return sale.laba;
  }
  return netRevenue - saleHpp;
}

export function formatRupiah(val: number): string {
  if (!val && val !== 0) return 'Rp 0';
  if (val < 0) {
    return `-Rp ${Math.abs(val).toLocaleString('id-ID')}`;
  }
  return `Rp ${val.toLocaleString('id-ID')}`;
}

/**
 * Robust Indonesian & international currency parser.
 * Handles:
 * - "120.000" -> 120000 (Indonesian thousands separator)
 * - "7.800" -> 7800
 * - "1.200" -> 1200
 * - "102.200" -> 102200
 * - "10" -> 10
 * - "Rp 120.000" -> 120000
 * - "-57.200" -> -57200
 * - "120,000" -> 120000 (US thousands separator)
 * - "120.000,50" -> 120000.5
 * - "120,000.50" -> 120000.5
 * - "0.5" / "12.5" -> 0.5 / 12.5
 */
export function parseRupiahNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let str = val.trim();
  if (!str) return 0;

  const isNegative = str.startsWith('-') || /^\(.*\)$/.test(str);

  // Clean non-numeric characters except digits, dot, comma
  str = str.replace(/[^0-9.,]/g, '');
  if (!str) return 0;

  let num = 0;

  // Case 1: Has both dot and comma
  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Indonesian: 1.200.000,50 -> dot is thousands, comma is decimal
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US: 1,200,000.50 -> comma is thousands, dot is decimal
      str = str.replace(/,/g, '');
    }
    num = parseFloat(str) || 0;
  }
  // Case 2: Has only comma
  else if (str.includes(',') && !str.includes('.')) {
    const parts = str.split(',');
    // If multiple commas, or exactly 3 digits after single comma: 120,000 -> thousands
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/,/g, '');
    } else {
      // Decimal comma: 12,5 -> 12.5
      str = str.replace(',', '.');
    }
    num = parseFloat(str) || 0;
  }
  // Case 3: Has only dot
  else if (str.includes('.') && !str.includes(',')) {
    const parts = str.split('.');
    // If multiple dots (e.g. 1.200.000), or exactly 3 digits after dot (e.g. 120.000, 7.800):
    // In Rupiah amounts, this is always thousands separator!
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/\./g, '');
    } else {
      // Decimal dot: 0.5 or 12.5
      // Leave as is
    }
    num = parseFloat(str) || 0;
  }
  // Case 4: Plain integer
  else {
    num = parseFloat(str) || 0;
  }

  return isNegative ? -Math.abs(num) : Math.abs(num);
}

