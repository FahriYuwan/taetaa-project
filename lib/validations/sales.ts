import { z } from 'zod';

export const createSaleSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Format tanggal tidak valid' }),
  skuId: z.string().min(1, 'SKU produk wajib dipilih'),
  qty: z.coerce.number().positive('Jumlah penjualan harus lebih besar dari 0'),
  unitPrice: z.coerce.number().min(0, 'Harga satuan tidak boleh negatif').optional().default(0),
  channel: z.enum(['SHOPEE', 'TIKTOK', 'TOKOPEDIA', 'OFFLINE', 'AFFILIATE'], {
    message: 'Channel tidak valid. Pilihan: SHOPEE, TIKTOK, TOKOPEDIA, OFFLINE, AFFILIATE',
  }),
  orderId: z.string().nullable().optional(),
  resi: z.string().nullable().optional(),
  fee: z.coerce.number().min(0).optional().default(0),
  voucher: z.coerce.number().min(0).optional().default(0),
  discount: z.coerce.number().min(0).optional().default(0),
  platformFee: z.coerce.number().min(0).optional().default(0),
  shippingFee: z.coerce.number().min(0).optional().default(0),
  notes: z.string().nullable().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
