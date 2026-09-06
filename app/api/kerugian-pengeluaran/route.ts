import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import database konektor

// Fungsi untuk mengambil data (GET)
export async function GET(req: Request) {
    try {
        // 1. Ambil data dari database
        const data = await prisma.namaTable.findMany();

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
        const { field1, field2 } = body;

        // 2. Validasi sederhana
        if (!field1) {
            return NextResponse.json({ error: 'Field 1 wajib diisi' }, { status: 400 });
        }

        // 3. Simpan ke database
        const result = await prisma.namaTable.create({
            data: { field1, field2 }
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Gagal menyimpan data' }, { status: 500 });
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