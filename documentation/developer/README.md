# Taetaa Company Sistem - Developer Documentation

## Project Overview
Taetaa Company Sistem adalah aplikasi manajemen internal yang dirancang khusus untuk bisnis manufaktur skala kecil hingga menengah (seperti produksi sabun atau parfum). Sistem ini menangani alur kerja harian mulai dari pengelolaan stok bahan baku (RAW), proses produksi menjadi barang setengah jadi (WIP) atau produk siap jual (PACKAGE), hingga pencatatan penjualan di berbagai marketplace.

Masalah utama yang diselesaikan:
- **Pelacakan Stok Otomatis**: Mengurangi stok bahan baku saat produksi dan mengurangi produk jadi saat terjual.
- **Weighted Average HPP**: Kalkulasi otomatis harga pokok penjualan (HPP) yang akurat meskipun harga beli dari supplier berubah-ubah.
- **Konsolidasi Data Marketplace**: Mencatat penjualan dari Shopee, TikTok, dan offline dalam satu tempat.
- **Audit Mutasi**: Menyediakan laporan mutasi stok (stock card) yang transparan untuk setiap SKU.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS.
- **Backend**: Next.js Route Handlers (Serverless Functions).
- **Database**: PostgreSQL.
- **ORM**: Prisma.
- **Charts**: Recharts.
- **Icons**: Emoji & Custom SVG.

## Project Setup

### Prerequisites
- Node.js 18+ installed.
- PostgreSQL instance running.

### Steps
1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd taetaa-project
   npm install
   ```

2. **Environment Variables**
   Buat file `.env` di root folder dan isi dengan database URL Anda:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/taetaa_db?schema=public"
   ```

3. **Database Setup**
   Jalankan migrasi Prisma untuk membuat tabel di database:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## Folder Structure
- `/app`: Next.js App Router (Halaman dan API Routes).
  - `/app/api`: Backend logic (API endpoints).
- `/components`: Komponen UI reusable (Modal, Tabel, Sidebar, dll).
- `/lib`: Utility functions (DB client, theme tokens, toast logic).
- `/prisma`: Schema database dan file migrasi.
- `/public`: Static assets.
- `/documentation`: Dokumentasi lengkap project.
