import { z } from 'zod';

export const createPurchaseSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Format tanggal tidak valid' }),
  skuId: z.string().nullable().optional(),
  kemasanId: z.string().nullable().optional(),
  qty: z.coerce.number().positive('Jumlah pembelian harus lebih besar dari 0'),
  unitPrice: z.coerce.number().min(0, 'Harga satuan tidak boleh negatif'),
  supplier: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).refine((data) => !!(data.skuId || data.kemasanId), {
  message: 'Bahan Baku (SKU) atau Item Kemasan wajib dipilih',
  path: ['skuId'],
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
