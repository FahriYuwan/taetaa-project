import { z } from 'zod';

export const createPurchaseSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Format tanggal tidak valid' }),
  skuId: z.string().min(1, 'SKU bahan/barang wajib dipilih'),
  qty: z.coerce.number().positive('Jumlah pembelian harus lebih besar dari 0'),
  unitPrice: z.coerce.number().min(0, 'Harga satuan tidak boleh negatif'),
  supplier: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
