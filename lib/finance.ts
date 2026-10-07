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
  return `Rp ${(val || 0).toLocaleString('id-ID')}`;
}

