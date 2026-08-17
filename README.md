# Taetaa Company Sistem

Sistem manajemen inventory, produksi, dan penjualan untuk bisnis manufaktur berbasis **Weighted Average HPP**.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)

---

## 📸 Screenshot / Demo

> [!TIP]
> Masukkan screenshot dashboard utama di bawah ini untuk presentasi yang lebih menarik.
> Simpan gambar di folder `docs/images/dashboard.png` lalu update link di bawah.

![Dashboard Utama](docs/images/dashboard.png)
*(Screenshot Placeholder - Harap isi manual)*

---

## 📝 Tentang Project

Taetaa Company Sistem adalah solusi digital terpadu untuk bisnis manufaktur skala kecil (seperti sabun cair atau parfum) yang ingin berpindah dari pencatatan spreadsheet manual ke sistem otomatis yang akurat. 

Project ini menyelesaikan masalah utama dalam manufaktur: **perhitungan biaya modal (HPP) yang fluktuatif**. Dengan metode **Weighted Average (Rata-rata Tertimbang)**, sistem secara otomatis menghitung nilai stok dan keuntungan bersih setiap kali ada perubahan harga beli bahan baku atau komposisi produksi.

### 7 Modul Utama:
1.  **Dashboard Utama**: Visualisasi KPI finansial (Revenue, HPP, Laba) dan tren performa harian.
2.  **Master SKU**: Katalog produk terpusat (RAW, WIP, PACKAGE) dengan manajemen resep (BOM).
3.  **Pembelian RAW**: Pencatatan stok masuk bahan baku yang otomatis memperbarui harga modal rata-rata.
4.  **Produksi RAW → WIP**: Simulasi dan eksekusi manufaktur berdasarkan resep dengan validasi stok bahan baku.
5.  **Penjualan Marketplace**: Pencatatan omzet lintas channel (Shopee, TikTok, Offline, Affiliate) dengan hitung laba bersih.
6.  **Dashboard Inventory**: Laporan mutasi stok (Stock Card) otomatis yang merinci alur masuk-keluar barang.
7.  **Laporan & Export CSV**: Pusat penarikan data mentah untuk keperluan pembukuan eksternal.

---

## 🚀 Tech Stack

-   **Frontend**: Next.js 15 (App Router), React 19, TypeScript
-   **Backend**: Next.js API Routes (Serverless)
-   **Styling**: Tailwind CSS 4.0
-   **Database**: PostgreSQL
-   **ORM**: Prisma
-   **Charts**: Recharts
-   **Environment**: Dotenv

---

## ✨ Fitur Utama

### 📊 Manajemen Data & Kalkulasi
-   **CRUD SKU & BOM**: Pengaturan komposisi produk (resep) yang mendalam.
-   **Weighted Average HPP**: Kalkulasi otomatis modal produk yang akurat secara real-time.
-   **Validasi Stok**: Sistem mencegah produksi atau penjualan jika stok fisik tidak mencukupi resep/pesanan.

### 🛒 Transaksi
-   **Multi-Channel Sales**: Pencatatan biaya admin (fee) berbeda-beda per marketplace.
-   **Bulk Paste**: Fitur impor massal data SKU, Pembelian, dan Penjualan langsung dari Excel/Spreadsheet.

### 📈 Pelaporan
-   **Auto-Generated Stock Card**: Audit trail lengkap untuk setiap pergerakan barang.
-   **Financial Summary**: Hitung Laba/Rugi bersih otomatis setelah dipotong biaya operasional marketplace.
-   **Exportable Data**: Semua modul mendukung ekspor ke format CSV.

---

## 🛠️ Getting Started

### Prasyarat
-   Node.js v18 atau lebih baru.
-   PostgreSQL instance (Lokal atau Cloud).

### Langkah Instalasi

1.  **Clone Repository**
    ```bash
    git clone https://github.com/username/taetaa-project.git
    cd taetaa-project
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**
    Buat file `.env` di root folder dan sesuaikan URL database Anda:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/taetaa_db?schema=public"
    ```

4.  **Setup Database**
    Jalankan migrasi Prisma untuk membuat tabel:
    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Seed Data Demo (Opsional)**
    Isi database dengan data contoh representatif untuk demo:
    ```bash
    npm run seed:demo
    ```

6.  **Jalankan Server Development**
    ```bash
    npm run dev
    ```
    Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 📂 Struktur Folder

-   `/app`: Routing halaman dan API endpoints (Next.js App Router).
-   `/components`: Komponen UI reusable (Modal, Tabel, Sidebar, Dashboard cards).
-   `/lib`: Konfigurasi utilitas (Database client, Design tokens, Global Toast).
-   `/prisma`: Skema database dan skrip seeder demo.
-   `/documentation`: Dokumentasi teknis dan panduan pengguna lengkap.
-   `/scratch`: Skrip utilitas untuk pembersihan data atau kalkulasi ulang stok.

---

## 💾 Skema Database (Ringkas)

Sistem menggunakan 7 entitas inti yang saling terelasi:
-   `SKU`: Master data produk.
-   `BOMComponent`: Definisi resep produk (hubungan parent-child).
-   `Purchase`: Transaksi stok masuk bahan baku.
-   `Production`: Proses konversi RAW menjadi produk jadi.
-   `Sale`: Transaksi keluar barang ke pembeli.
-   `Inventory`: Pencatatan setiap pergerakan stok (Audit Trail).
-   `SKUCostHistory`: Snapshot stok dan HPP rata-rata terbaru.

*Detail lengkap silakan lihat: [Database Schema Documentation](documentation/developer/database-schema.md)*

---

## 📚 Dokumentasi Lengkap

Kami menyediakan dua jenis dokumentasi:
-   **[Developer Documentation](documentation/developer/README.md)**: Arsitektur sistem, API Reference, dan panduan kontribusi kode.
-   **[User Guide](documentation/user-guide/README.md)**: Panduan langkah-demi-langkah penggunaan sistem untuk staf operasional.

---

## 🛤️ Roadmap & Status

- [x] Modul Master SKU & BOM Management
- [x] Modul Pembelian RAW & Weighted Average Logic
- [x] Modul Produksi dengan Validasi Stok Bahan
- [x] Modul Penjualan Multi-Marketplace & Profit Calc
- [x] Dashboard Inventory (Stock Card)
- [x] Export Laporan ke CSV
- [ ] Fitur Stock Opname / Manual Adjustment
- [ ] Modul Biaya Marketing & ROI Ads
- [ ] Sistem Autentikasi Pengguna (Login)

---

## 🤝 Kontribusi

Project ini bersifat **Internal / Proprietary**. Kontribusi eksternal saat ini tidak diterima. Untuk tim pengembang internal, silakan gunakan branch `feature/nama-fitur` dan lakukan Pull Request ke `main`.

---

## ⚖️ Lisensi

**Proprietary** — Digunakan terbatas untuk keperluan internal Taetaa Company saja. Penggunaan, penyalinan, atau distribusi tanpa izin tertulis dari pemilik project sangat dilarang.

---

## 📧 Kontak

**Maintainer**: [Nama Anda/Tim IT] - [email@perusahaan.com]
Project Link: [https://github.com/username/taetaa-project](https://github.com/username/taetaa-project)
