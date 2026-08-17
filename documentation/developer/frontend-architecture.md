# Frontend Architecture

Aplikasi ini dibangun menggunakan Next.js App Router dengan fokus pada konsistensi visual dan kemudahan input data.

## Routes & Halaman
- `/dashboard`: Ringkasan bisnis dan chart performa.
- `/master-sku`: Manajemen katalog produk dan resep (BOM).
- `/pembelian-raw`: Input stok masuk bahan baku.
- `/produksi`: Proses konversi bahan baku ke produk jadi.
- `/penjualan`: Pencatatan omzet dari berbagai marketplace.
- `/inventory`: Laporan mutasi stok (Stock Card).
- `/laporan`: Pusat penarikan data mentah ke CSV.

## State Management & Data Fetching
- **Server Components**: Digunakan untuk layout utama.
- **Client Components (`'use client'`)**: Digunakan untuk hampir seluruh halaman fungsional karena membutuhkan interaktivitas tinggi (modal, filter, toast).
- **Data Fetching**: Menggunakan `fetch` API standar dalam `useEffect` hooks. Tidak menggunakan library external seperti React Query untuk menjaga dependensi tetap minimal.

## Design System

### Design Tokens
Berlokasi di `/lib/theme.ts`. Seluruh aplikasi merujuk ke file ini untuk warna:
- `colors.brand[500]`: `#1E88E5` (Warna utama brand).
- `colors.neutral.bg`: `#F5F6F8` (Latar belakang halaman).
- `colors.semantic`: Warna fungsional (Orange untuk HPP, Red untuk Error, Green untuk Profit).

### Reusable Components (`/components`)
- **Sidebar**: Navigasi utama dengan identitas visual Taetaa (Logo Piramida).
- **PageHeader**: Header seragam yang berisi Judul, Subtitle, dan tombol Aksi.
- **KPICard**: Menampilkan angka penting (Nilai, Label, Deskripsi).
- **Button**: Wrapper tombol standar dengan varian `primary` dan `secondary`.
- **Badge**: Menampilkan tipe SKU (`RAW`, `WIP`, `PACKAGE`) dengan warna yang berbeda.

### Global Toast
Terimplementasi di `/lib/toast.tsx`. Container dipasang di `RootLayout` sehingga notifikasi bisa dipicu dari komponen manapun melalui hook `useToast`.

## UI Patterns
- **Table Layout**: Seluruh tabel menggunakan style border-radius `8px` dengan header berwarna abu-abu muda (`bg-gray-50`).
- **Modal Validation**: Form di dalam modal memiliki validasi internal sebelum melakukan `fetch` ke backend.
- **Automatic Formatting**: Input angka (seperti Harga Jual) menampilkan format Rupiah (`toLocaleString`) di bawah input secara real-time untuk meminimalkan kesalahan baca.
