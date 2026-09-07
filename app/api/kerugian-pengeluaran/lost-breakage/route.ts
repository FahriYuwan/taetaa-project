import { NextResponse } from 'next/server';
import prisma from '@/lib/db.ts';
import {MovementType} from "@prisma/client"; // Import database konektor

// Fungsi untuk mengambil data (GET)
export async function GET(req: Request) {
    try {
        // 1. Ambil data dari database
        const data = await prisma.breakage.findMany({
            include: { sku: true },
            orderBy: { date: 'desc' },
        });

        // 2. Kirim respon sukses
        return NextResponse.json(data);
    } catch (error) {
        // 3. Tangani jika ada error
        return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
    }
}

// Fungsi untuk mengirim/simpan data (POST)
export async function POST(req: Request) {
    try {
        // 1. Ambil data dari body request (input user)
        const body = await req.json();
        const { date, skuId, qty, unitPrice, notes } = body;

        // 2. Validasi sederhana
        if (!date || !skuId || !qty || !unitPrice || !notes) {
            return NextResponse.json({ error: 'Terdapat Field yang belum diisi!' }, { status: 400 });
        }

        const total = qty * unitPrice;

        // 3. Simpan ke database
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the breakage record / saves to breakage table
            const breakage = await tx.breakage.create({
                data: {
                    date: new Date(date),
                    skuId,
                    qty,
                    unitPrice,
                    total,
                    notes,
                },
            });
            // 2. Add to Inventory Movement
            await tx.inventory.create({
                data: {
                    date: new Date(date),
                    skuId,
                    movement: -qty,
                    type: MovementType.BREAKAGE,
                    reference: breakage.id,
                },
            })

            // 3. Update SKUCostHistory (Weighted Average HPP)
             const costHistory = await tx.sKUCostHistory.findUnique({
                where: { skuId },
            });

            if (costHistory) {
                const oldStock = costHistory.stock;
                const newStock = oldStock - qty;

                await tx.sKUCostHistory.update({
                    where: { skuId },
                    data: {
                        stock: newStock
                    },
                });
            } else {
                console.error('SKU not found in cost history');
            }
        })
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Breakage creation error:', error);
        return NextResponse.json({ error: 'Gagal menyimpan data Kerugian' }, { status: 500 });
    }
}


// // Fungsi untuk mengambil data (GET)
// export async function GET(req: Request) {
//     try {
//         // 1. Ambil data dari database
//         const data = await prisma.namaTable.findMany();
//
//         // 2. Kirim respon sukses
//         return NextResponse.json(data);
//     } catch (error) {
//         // 3. Tangani jika ada error
//         return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
//     }
// }
//
// // Fungsi untuk mengirim/simpan data (POST)
// export async function POST(req: Request) {
//     try {
//         // 1. Ambil data dari body request (input user)
//         const body = await req.json();
//         const { field1, field2 } = body;
//
//         // 2. Validasi sederhana
//         if (!field1) {
//             return NextResponse.json({ error: 'Field 1 wajib diisi' }, { status: 400 });
//         }
//
//         // 3. Simpan ke database
//         const result = await prisma.namaTable.create({
//             data: { field1, field2 }
//         });
//
//         return NextResponse.json(result, { status: 201 });
//     } catch (error) {
//         return NextResponse.json({ error: 'Gagal menyimpan data' }, { status: 500 });
//     }
// }