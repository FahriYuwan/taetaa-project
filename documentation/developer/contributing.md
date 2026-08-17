# Panduan Kontribusi

Terima kasih telah membantu pengembangan Taetaa Company Sistem. Ikuti panduan ini untuk menjaga kualitas kode.

## Konvensi Kode
- **Bahasa**: Gunakan Bahasa Inggris untuk penamaan variabel, fungsi, dan file. Gunakan Bahasa Indonesia untuk label UI (labels, placeholder, messages).
- **Naming**:
  - Komponen: PascalCase (contoh: `AddPurchaseModal.tsx`).
  - API Routes: lowercase (contoh: `/api/sales/bulk/route.ts`).
  - Database Table: PascalCase (Prisma convention).
- **Styling**: Gunakan utility classes dari Tailwind CSS. Hindari inline styles kecuali untuk nilai yang datang dari Design Tokens (`lib/theme.ts`).

## Alur Penambahan Fitur Baru
Jika Anda ingin menambahkan halaman baru (misal: "Barang Rusak"):
1. **Schema**: Update `prisma/schema.prisma` jika butuh tabel baru. Jalankan `npx prisma migrate dev`.
2. **API**: Buat folder baru di `app/api/<fitur-baru>` dan implementasikan logic CRUD.
3. **Komponen**: Buat komponen UI yang dibutuhkan di folder `components`.
4. **Halaman**: Buat folder di `app/<fitur-baru>` dengan file `page.tsx`.
5. **Sidebar**: Tambahkan menu baru di `components/sidebar/Sidebar.tsx`.

## Testing
Saat ini belum ada automated testing (Jest/Cypress). Lakukan verifikasi manual pada:
- **Kalkulasi**: Pastikan angka HPP berubah saat ada pembelian.
- **Mutasi**: Pastikan stok di Master SKU berkurang setelah simulasi Penjualan.
- **Integritas**: Pastikan transaksi gagal (error toast) jika stok tidak cukup.

## Deployment
Aplikasi ini dioptimalkan untuk **Vercel**:
1. Hubungkan repository ke dashboard Vercel.
2. Atur Environment Variables (`DATABASE_URL`).
3. Deploy (Vercel akan otomatis mendeteksi konfigurasi Next.js).
