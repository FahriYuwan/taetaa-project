// app/api/kerugian-pengeluaran/lost-breakage/bulk/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';

export async function POST(req: Request) {
    try {
        const { text } = await req.json();
        const lines = text.trim().split('\n');

        const results = await prisma.$transaction(async (tx) => {
            let count = 0;
            for (const line of lines) {
                const [dateStr, skuCode, qtyStr, priceStr, notes] = line.split('\t');
                if (!dateStr || !skuCode || !qtyStr) continue;

                const sku = await tx.sKU.findUnique({ where: { code: skuCode.trim() } });
                if (!sku) continue;

                const date = new Date(dateStr.trim());
                const qty = parseFloat(qtyStr.trim());
                // Jika harga tidak ada di excel, ambil dari cost history (HPP saat ini)
                const costHistory = await tx.sKUCostHistory.findUnique({ where: { skuId: sku.id } });
                const unitPrice = priceStr ? parseFloat(priceStr.replace(/[^0-9.]/g, '')) : (costHistory?.avgCost || 0);

                const breakage = await tx.breakage.create({
                    data: { date, skuId: sku.id, qty, unitPrice, total: qty * unitPrice, notes: notes?.trim() || 'Bulk Import' },
                });

                await tx.inventory.create({
                    data: { date, skuId: sku.id, movement: -qty, type: MovementType.BREAKAGE, reference: breakage.id },
                });

                if (costHistory) {
                    await tx.sKUCostHistory.update({
                        where: { skuId: sku.id },
                        data: { stock: costHistory.stock - qty },
                    });
                }
                count++;
            }
            return count;
        });

        return NextResponse.json({ success: true, message: `${results} data kerugian berhasil diimpor` });
    } catch (error) {
        return NextResponse.json({ error: 'Gagal impor data' }, { status: 500 });
    }
}