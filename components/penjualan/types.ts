export interface Sale {
  id: string;
  date: string;
  channel: string;
  orderId: string | null;
  resi: string | null;
  skuId: string;
  sku: {
    id?: string;
    code: string;
    name: string;
    hppPrice?: number;
  };
  qty: number;
  unitPrice: number;
  total: number;
  fee: number;
  netRevenue: number;
  voucher: number;
  discount: number;
  platformFee: number;
  shippingFee: number;
  omset: number;
  hpp: number;
  totalHpp: number;
  laba: number;
  status: string;
  scannedByLogistic: boolean;
  financeMatched: boolean;
  notes: string | null;
  avgCost?: number;
}

export interface OrderGroup {
  orderId: string | null;
  resi: string | null;
  channel: string;
  date: string;
  items: Sale[];
}

export interface MarketplaceTotals {
  qty: number;
  price?: number;
  voucher?: number;
  discount?: number;
  platformFee?: number;
  shippingFee?: number;
  omset: number;
  totalHpp: number;
  laba: number;
}

export const CHANNEL_BADGE: Record<string, string> = {
  SHOPEE: 'bg-orange-50 text-orange-600 border-orange-200',
  TIKTOK: 'bg-gray-100 text-gray-800 border-gray-300',
  TOKOPEDIA: 'bg-green-50 text-green-700 border-green-200',
  OFFLINE: 'bg-blue-50 text-blue-600 border-blue-200',
  AFFILIATE: 'bg-purple-50 text-purple-600 border-purple-200',
};

export const STATUS_BADGE: Record<string, string> = {
  DITERIMA: 'bg-green-50 text-green-700 border-green-200',
  HILANG: 'bg-rose-50 text-rose-700 border-rose-200',
  RETURN: 'bg-amber-50 text-amber-700 border-amber-200',
  TERKIRIM: 'bg-green-50 text-green-700 border-green-200',
  DIRETURN: 'bg-amber-50 text-amber-700 border-amber-200',
  DIBATALKAN: 'bg-gray-100 text-gray-500 border-gray-200',
  SELISIH_QTY: 'bg-amber-50 text-amber-700 border-amber-300',
};

export const STATUS_LABEL: Record<string, string> = {
  DITERIMA: 'Diterima',
  HILANG: 'Hilang',
  RETURN: 'Return',
  TERKIRIM: 'Diterima',
  DIRETURN: 'Return',
  DIBATALKAN: 'Dibatalkan',
  SELISIH_QTY: 'Selisih Qty',
};

export function formatRp(val: number) {
  if (!val && val !== 0) return 'Rp 0';
  if (val < 0) {
    return `-Rp ${Math.abs(val).toLocaleString('id-ID')}`;
  }
  return `Rp ${val.toLocaleString('id-ID')}`;
}
