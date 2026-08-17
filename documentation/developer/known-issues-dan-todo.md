# Project Status, Known Issues & TODO

## Status Modul (100% Selesai)
- [x] **01 Dashboard Utama**: KPI & Chart tersambung ke data riil.
- [x] **02 Master SKU**: CRUD SKU & Management BOM (Resep).
- [x] **03 Pembelian RAW**: Pencatatan stok masuk & HPP.
- [x] **04 Produksi (RAW→WIP)**: Konversi stok & validasi BOM.
- [x] **05 Penjualan Marketplace**: Pencatatan omzet lintas channel.
- [x] **06 Dashboard Inventory**: Laporan mutasi stok (Stock Card).
- [x] **07 Laporan & Export**: Unduh CSV untuk semua modul.

## Perbedaan dari Spesifikasi Awal (Addendum)
- **Layout**: Menghapus redundansi Sidebar di tiap halaman, sekarang dikelola terpusat di `layout.tsx`.
- **HPP History**: Menambahkan tabel `SKUCostHistory` untuk mengunci snapshot HPP, yang sebelumnya direncanakan hanya kalkulasi *on-the-fly*.
- **Validation**: Menambahkan validasi stok real-time pada modal Produksi dan Penjualan untuk mencegah stok minus.

## Known Issues (Bugs)
- **Pagination**: Tabel belum mendukung pagination. Jika data mencapai ribuan baris, performa render halaman mungkin menurun.
- **Date Range Logic**: Filter tanggal di Dashboard Inventory menghitung saldo awal secara rekursif, yang mungkin melambat jika riwayat transaksi sangat panjang.

## Fitur yang Direkomendasikan (TODO)
- **Stock Opname / Adjustment**: Modul khusus untuk koreksi selisih stok fisik vs sistem (saat ini hanya bisa dilakukan via database manual).
- **Marketing Expense Input**: Input biaya iklan per channel (Shopee/TikTok ads) untuk menghitung ROI pemasaran yang lebih akurat.
- **Return & Breakage Management**: Pencatatan barang retur dari marketplace atau barang pecah saat pengiriman.
- **User Authentication**: Sistem saat ini belum memiliki login. Disarankan menambahkan NextAuth.js atau Clerk untuk keamanan.

## Technical Debt
- **API Optimization**: Beberapa endpoint melakukan perulangan (`for loop`) pada transaksi bulk. Disarankan menggunakan `createMany` jika skema database memungkinkan optimasi lebih lanjut.
- **TypeScript Strictness**: Beberapa komponen modal masih menggunakan tipe `any` untuk payload data form. Perlu didefinisikan interface yang lebih ketat.
