import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {MovementType, BreakageCategory} from "@prisma/client";

// Fungsi untuk mengambil data (GET)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');

        let where = {};
        if (fromDate && toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            where = {
                date: {
                    gte: new Date(fromDate),
                    lte: to,
                },
            };
        }

        const data = await prisma.breakage.findMany({
            where,
            include: { 
                sku: {
                    select: {
                        code: true,
                        name: true,
                        hppPrice: true
                    }
                } 
            },
            orderBy: { date: 'desc' },
        });

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
    }
}

// Fungsi untuk mengirim/simpan data (POST)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { date, skuId, qty, category, notes } = body;

        if (!date || !skuId || !qty || !category) {
            return NextResponse.json({ error: 'Field date, skuId, qty, dan kategori wajib diisi!' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const sku = await tx.sKU.findUnique({
                where: { id: skuId },
                select: { hppPrice: true }
            });

            const finalUnitPrice = sku?.hppPrice || 0;
            const total = qty * finalUnitPrice;

            const breakage = await tx.breakage.create({
                data: {
                    date: new Date(date),
                    skuId,
                    qty,
                    category: category as BreakageCategory,
                    unitPrice: finalUnitPrice,
                    total,
                    notes: notes || 'Breakage',
                },
                include: { sku: true }
            });

            await tx.inventory.create({
                data: {
                    date: new Date(date),
                    skuId,
                    qty: -qty, // Some parts of system use 'movement', let's check
                    movement: -qty,
                    type: MovementType.BREAKAGE,
                    reference: breakage.id,
                },
            });

            const costHistory = await tx.sKUCostHistory.findUnique({
                where: { skuId },
            });
            if (costHistory) {
                await tx.sKUCostHistory.update({
                    where: { skuId },
                    data: {
                        stock: { decrement: qty }
                    },
                });
            }

            return breakage;
        });

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