import { z } from 'zod';

export const createProductionSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Format tanggal tidak valid' }),
  outputSkuId: z.string().min(1, 'SKU produk hasil produksi wajib dipilih'),
  outputQty: z.coerce.number().positive('Jumlah produksi (outputQty) harus lebih besar dari 0'),
  notes: z.string().nullable().optional(),
  manualConsumptions: z.record(z.string(), z.boolean()).optional(),
});

export type CreateProductionInput = z.infer<typeof createProductionSchema>;
