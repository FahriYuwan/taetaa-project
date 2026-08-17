# Spesifikasi Halaman — "Laporan & Export CSV"
## Taetaa Company Sistem (Aplikasi Manajemen Inventory & Penjualan)

> Halaman 7 (halaman terakhir) dari rangkaian aplikasi. Diakses dari sidebar menu "Laporan & Export". Halaman ini menyediakan pintu keluar data mentah dalam format CSV untuk dianalisis lebih lanjut di luar sistem (Excel/Google Sheets).

---

## 1. Konteks & Tujuan Halaman

Halaman ini adalah pusat ekspor data. Alih-alih menampilkan tabel/chart, halaman ini menampilkan sekumpulan **kartu ekspor** (satu kartu per jenis data/laporan), masing-masing dengan tombol unduh CSV. Ada 2 kategori laporan:

- **BERDASARKAN PERIODE** — data transaksional yang difilter sesuai rentang tanggal DARI–SAMPAI di header (Penjualan, Pembelian RAW, Produksi).
- **SNAPSHOT** — data kondisi saat ini, tidak terikat rentang tanggal (Inventory, Master SKU).

---

## 2. Layout Global (reuse dari halaman-halaman sebelumnya)

- Sidebar kiri identik, item **"Laporan & Export"** dalam state **aktif** (background biru solid, teks putih bold).
- Item "Produksi (RAW→WIP)" kembali tampak berwarna biru — konsisten dengan temuan berulang di halaman-halaman lain, tetap perlakukan sebagai item non-aktif standar (kemungkinan efek hover/render saat screenshot, bukan indikasi desain).
- Footer sidebar 2 baris:
  - Baris 1: `v1.0 - Weighted Average HPP`
  - Baris 2: `Manual entry mode`
- Toast notifikasi "Frontend Preview Only..." tetap muncul mengambang di bawah tengah layar — perlakukan sebagai elemen global dev/environment, bukan bagian desain final produk (lihat catatan konsisten di halaman-halaman transaksional sebelumnya).

---

## 3. Header Halaman

- Background abu-abu sangat muda (#F5F6F8), padding ±24px, border bawah tipis.
- **Kiri:**
  - Label kecil abu-abu kapital: `TAETAA COMPANY SISTEM`
  - Judul besar bold hitam (±28px): `Laporan & Export CSV`
  - Sub-judul abu-abu (±14px): `Export data mentah untuk analisis lanjutan di Excel / Google Sheets.`
- **Kanan** (align kanan, sejajar horizontal, gap ±16px) — pola sama seperti header Dashboard Utama:
  - Filter tanggal 1 — label kecil abu-abu di atas: `DARI`, input date dengan ikon kalender, contoh nilai `07/16/2026`
  - Filter tanggal 2 — label kecil abu-abu di atas: `SAMPAI`, input date dengan ikon kalender, contoh nilai `08/15/2026`
  - **Catatan:** halaman ini tidak punya tombol "Seed Contoh" di header (berbeda dari Dashboard Utama) — hanya 2 filter tanggal.

**Perilaku:** mengubah rentang tanggal ini memengaruhi isi file CSV untuk kartu-kartu berkategori "BERDASARKAN PERIODE" saja; kartu "SNAPSHOT" tidak terpengaruh filter tanggal karena selalu mengambil kondisi data saat ini.

---

## 4. Grid Kartu Laporan

Layout grid 2 kolom (tidak full-width — kartu memiliki lebar maksimum tetap ±330px per kartu, menyisakan ruang kosong di kanan karena hanya ada 5 kartu total), gap antar kartu ±16-20px horizontal & vertikal. Urutan kartu mengikuti pola baca kiri-ke-kanan, atas-ke-bawah:

**Baris 1:** Penjualan | Pembelian RAW
**Baris 2:** Produksi (RAW→WIP) | Inventory
**Baris 3:** Master SKU | *(kosong)*

### 4.1 Struktur Umum Setiap Kartu
Card putih, border tipis abu-abu, radius ±8px, padding ±20px:
- **Baris atas:** label kecil kapital abu-abu di kiri (`BERDASARKAN PERIODE` atau `SNAPSHOT`), ikon dokumen dengan panah download kecil di kanan (abu-abu, ±20px, sudut kanan atas kartu).
- **Judul kartu:** bold hitam (±16-18px), di bawah label kategori.
- **Deskripsi singkat:** abu-abu (±13px), 1 baris, menjelaskan isi data yang akan diekspor.
- **Tombol `Download CSV`:** solid biru (#2563EB), teks putih bold, ikon download kecil di kiri teks, lebar mengikuti isi konten (bukan full-width kartu), posisi di bagian bawah kartu dengan sedikit jarak dari deskripsi.

### 4.2 Detail Isi Tiap Kartu

| Kartu | Kategori (label kecil) | Judul | Deskripsi |
|---|---|---|---|
| 1 | BERDASARKAN PERIODE | **Penjualan** | "Semua transaksi penjualan marketplace + biaya & laba" |
| 2 | BERDASARKAN PERIODE | **Pembelian RAW** | "Semua transaksi pembelian bahan baku" |
| 3 | BERDASARKAN PERIODE | **Produksi (RAW→WIP)** | "Riwayat konversi produksi & konsumsi BOM" |
| 4 | SNAPSHOT | **Inventory** | "Snapshot stock saat ini per SKU (awal → akhir)" |
| 5 | SNAPSHOT | **Master SKU** | "Master data seluruh SKU + BOM" |

**Isi kolom CSV yang disarankan per kartu** (agar konsisten dengan tabel-tabel di halaman lain yang sudah dispesifikasikan):
- **Penjualan** → kolom sama seperti tabel di halaman Penjualan Marketplace: Tanggal, Marketplace, Order ID, SKU, Qty, Harga, Gross, Biaya, Net Rev, HPP, Laba.
- **Pembelian RAW** → kolom sama seperti tabel di halaman Pembelian RAW: Tanggal, SKU, Qty, Harga Satuan, Total, Supplier, Catatan.
- **Produksi (RAW→WIP)** → kolom sama seperti tabel di halaman Produksi RAW→WIP: Tanggal, Output SKU, Nama, Qty Output, Komponen Terpakai, Total Biaya, HPP/Unit.
- **Inventory** → kolom sama seperti tabel di halaman Dashboard Inventory: SKU, Nama, Tipe, Stock Awal, Masuk (Beli), Masuk (Produksi), Keluar (Produksi), Keluar (Jual), Stock Akhir, Avg Cost, Nilai Stock.
- **Master SKU** → kolom sama seperti tabel di halaman Master SKU: SKU Code, Nama, Tipe, Stock, Avg Cost, Harga Jual, Nilai Stock, plus detail BOM (komponen & qty) sebagai kolom tambahan/terpisah.

---

## 5. Tidak Ada Empty State di Halaman Ini

Berbeda dari halaman-halaman transaksional sebelumnya, halaman ini **selalu menampilkan 5 kartu** meskipun data di baliknya kosong — kartu bukan representasi data, melainkan aksi/tombol ekspor yang selalu tersedia. Jika file CSV yang dihasilkan kosong (tidak ada transaksi pada periode terpilih), file tetap terunduh namun hanya berisi baris header kolom tanpa data.

---

## 6. Gaya Visual (Design Tokens)

Konsisten dengan halaman-halaman sebelumnya:
- Font sans-serif modern.
- Background halaman: `#F5F6F8`
- Card: putih `#FFFFFF`, border `#E5E7EB`, radius `8px`
- Tombol Download CSV: biru `#2563EB`, teks putih bold, ikon download putih
- Label kategori kecil (BERDASARKAN PERIODE / SNAPSHOT): abu-abu kapital `#9CA3AF`, letter-spacing lebar
- Judul kartu: hitam bold `#111827`
- Deskripsi kartu: abu-abu `#6B7280`
- Ikon download di pojok kanan atas kartu: abu-abu netral `#9CA3AF`, ukuran kecil, non-interaktif (dekoratif, aksi utama tetap lewat tombol Download CSV)
- Toast notifikasi bawah (global/dev): background gelap `#111827`, teks putih, tombol aksi hijau `#10B981`

## 7. Interaktivitas Ringkas

1. Mengubah filter `DARI` / `SAMPAI` di header → memengaruhi isi CSV untuk kartu berkategori "BERDASARKAN PERIODE" (Penjualan, Pembelian RAW, Produksi); tidak memengaruhi kartu "SNAPSHOT" (Inventory, Master SKU).
2. Klik tombol `Download CSV` pada tiap kartu → langsung memicu unduhan file `.csv` sesuai jenis data kartu tersebut ke perangkat pengguna (tanpa modal/konfirmasi tambahan).
3. Tidak ada aksi lain di halaman ini (tidak ada input data, tidak ada tabel yang ditampilkan langsung di layar — murni halaman ekspor).

---

## 8. Ringkasan Keseluruhan Aplikasi (Rekap 7 Halaman)

Untuk referensi AI pembangun saat merangkai seluruh aplikasi, berikut urutan halaman & fungsinya:

1. **Dashboard Utama** — ringkasan bisnis (KPI, chart, top SKU).
2. **Master SKU** — CRUD data produk RAW/WIP/PACKAGE + BOM.
3. **Pembelian RAW** — pencatatan transaksi pembelian bahan baku.
4. **Produksi (RAW→WIP)** — pencatatan konversi RAW menjadi WIP/PACKAGE sesuai BOM.
5. **Penjualan Marketplace** — pencatatan transaksi penjualan lintas channel.
6. **Dashboard Inventory** — laporan mutasi stok (stock card) per SKU, read-only.
7. **Laporan & Export CSV** — pusat unduh data mentah per modul dalam format CSV.

Alur data: **Master SKU** (definisi produk & resep) menjadi acuan bagi **Pembelian RAW** (menambah stok RAW) → **Produksi** (mengonversi RAW menjadi WIP/PACKAGE, memakai BOM dari Master SKU) → **Penjualan** (mengurangi stok PACKAGE, menghasilkan laba). Seluruh transaksi ini terkonsolidasi otomatis di **Dashboard Inventory** (mutasi stok) dan **Dashboard Utama** (ringkasan finansial), serta bisa diekspor mentah lewat **Laporan & Export**.

---

*Ini adalah dokumen spesifikasi terakhir dari rangkaian 7 halaman "Taetaa Company Sistem". Seluruh dokumen (01–07) sudah cukup detail untuk diserahkan ke AI/developer lain guna membangun ulang aplikasi secara bertahap, halaman demi halaman.*
