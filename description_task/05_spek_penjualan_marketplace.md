# Spesifikasi Halaman — "Penjualan Marketplace"
## Taetaa Company Sistem (Aplikasi Manajemen Inventory & Penjualan)

> Halaman 5 dari beberapa halaman aplikasi. Diakses dari sidebar menu "Penjualan". Halaman ini mencatat setiap transaksi penjualan lintas channel (Shopee, TikTok, Offline, Affiliate), dan otomatis menghitung pendapatan bersih serta laba per transaksi.

---

## 1. Konteks & Tujuan Halaman

Halaman transaksional untuk mencatat histori penjualan. Setiap entri penjualan baru akan:
- **Mengurangi stok** SKU (tipe PACKAGE, karena ini yang dijual ke customer) sejumlah Qty terjual.
- Menghitung **HPP** transaksi tersebut berdasarkan AVG COST SKU (dari Master SKU) dikali Qty.
- Menghitung **Pendapatan Bersih (Net Revenue)** = Gross dikurangi Biaya (fee marketplace, ongkir, dsb).
- Menghitung **Laba** = Net Revenue − HPP.
- Menjadi sumber data untuk KPI "Pendapatan Bersih", "Total HPP", "Laba Bersih", "Total Order", chart "Pendapatan vs HPP vs Laba", chart "Net Revenue per Marketplace", dan tabel "Top 10 SKU Paling Menguntungkan" di halaman Dashboard.
- Sesuai konteks data sumber, channel penjualan meliputi minimal: **Shopee**, **TikTok**, **Offline**, dan **Affiliate**.

---

## 2. Layout Global (reuse dari halaman-halaman sebelumnya)

- Sidebar kiri identik, item **"Penjualan"** dalam state **aktif** (background biru solid, teks putih bold).
- Footer sidebar 2 baris (konsisten dengan halaman Pembelian RAW):
  - Baris 1: `v1.0 - Weighted Average HPP`
  - Baris 2: `Manual entry mode`
- Toast notifikasi "Frontend Preview Only..." tetap muncul mengambang di bawah tengah layar — perlakukan sebagai elemen global dev/environment (lihat catatan di spesifikasi halaman Pembelian RAW), bukan bagian desain final produk.

---

## 3. Header Halaman

- Background abu-abu sangat muda (#F5F6F8), padding ±24px, border bawah tipis.
- **Kiri:**
  - Label kecil abu-abu kapital: `TAETAA COMPANY SISTEM`
  - Judul besar bold hitam (±28px): `Penjualan Marketplace`
  - Sub-judul abu-abu (±14px): `Catat transaksi penjualan beserta potongan biaya. Pendapatan bersih & laba dihitung otomatis.`
- **Kanan** (align kanan, sejajar horizontal, gap ±10-12px) — halaman ini punya **3 elemen** di kanan header (lebih banyak dari halaman lain):
  1. **Dropdown filter channel** — select box dengan panah bawah, nilai default `Semua`. Opsi lain kemungkinan: `Shopee`, `TikTok`, `Offline`, `Affiliate` (sesuai channel yang didukung sistem).
  2. Tombol `Bulk Paste` — outline/border abu-abu, background putih, ikon paste kecil di kiri teks.
  3. Tombol `+ Catat Penjualan` — solid biru (#2563EB), teks putih bold, ikon plus di kiri teks. CTA utama halaman.

**Perilaku:**
- Dropdown `Semua` → memfilter tabel di bawah agar hanya menampilkan transaksi dari marketplace/channel yang dipilih.
- `Bulk Paste` → modal tempel data massal penjualan (relevan karena data asal berbentuk rekap harian per marketplace dalam jumlah besar).
- `+ Catat Penjualan` → modal/form tambah 1 transaksi penjualan baru (lihat bagian 6).

**Catatan:** halaman ini **tidak memiliki card ringkasan** di atas tabel (langsung header → tabel), sama seperti halaman Produksi RAW→WIP.

---

## 4. Tabel Daftar Penjualan

Card putih, border tipis abu-abu, radius ±8px, langsung di bawah header.

### 4.1 Header Kolom
Baris header background abu-abu sangat muda, teks kapital kecil bold abu-abu gelap, border bawah. Ini adalah tabel dengan **kolom terbanyak** di antara semua halaman (10 kolom), sehingga kemungkinan perlu scroll horizontal pada layar sempit:

| Kolom | Rata | Keterangan |
|---|---|---|
| TANGGAL | Kiri | Tanggal transaksi penjualan |
| MARKETPLACE | Kiri | Channel penjualan: Shopee / TikTok / Offline / Affiliate |
| ORDER ID | Kiri | Nomor pesanan unik dari marketplace (opsional untuk transaksi offline) |
| SKU | Kiri | Kode SKU produk yang terjual (tipe PACKAGE) |
| QTY | Kanan | Jumlah unit terjual |
| HARGA | Kanan | Harga jual per unit (Rp) |
| GROSS | Kanan | Total kotor = QTY × HARGA (Rp) |
| BIAYA | Kanan | Potongan biaya (fee marketplace, ongkir, dll) (Rp) |
| NET REV | Kanan | Pendapatan bersih = GROSS − BIAYA (Rp) |
| HPP | Kanan | = QTY × AVG COST SKU saat transaksi (Rp) |
| LABA | Kanan | = NET REV − HPP (Rp), warna teks bisa hijau jika positif / merah jika negatif |

### 4.2 Baris Data
- Padding vertikal ±14px per baris, border bawah tipis antar baris, hover → background abu-abu sangat muda.
- Kolom HARGA, GROSS, BIAYA, NET REV, HPP, LABA memakai format Rupiah (`Rp #.###`).
- Disarankan menambah kolom `AKSI` (Edit/Hapus) di ujung kanan mengikuti pola tabel lain, meski belum terlihat karena tabel kosong.

### 4.3 Empty State (kondisi saat ini di gambar)
Ketika belum ada transaksi penjualan tercatat:
- Baris kosong dengan padding vertikal cukup besar.
- Teks di tengah, warna biru (konsisten dengan pola empty state di Master SKU & Pembelian RAW):
  `Belum ada penjualan.`

---

## 5. Modal/Form "Catat Penjualan" (dipicu tombol `+ Catat Penjualan`)

*(Tidak terlihat langsung di gambar, disusun berdasarkan kolom tabel agar konsisten)*

Field yang disarankan, urut sesuai kolom tabel:
- Tanggal (date picker, wajib, default hari ini)
- Marketplace (dropdown, wajib: Shopee / TikTok / Offline / Affiliate)
- Order ID (text, opsional — mungkin disembunyikan/nonaktif jika Marketplace = Offline)
- SKU (dropdown/autocomplete, wajib, hanya menampilkan SKU bertipe **PACKAGE** dari Master SKU) → sistem otomatis validasi ketersediaan stok
- Qty (angka, wajib, > 0)
- Harga (angka Rupiah, wajib, per unit; bisa auto-terisi dari Harga Jual di Master SKU tapi tetap bisa diedit manual)
- Gross (read-only, auto-calculate = Qty × Harga)
- Biaya (angka Rupiah, opsional, potongan fee/ongkir)
- Net Rev (read-only, auto-calculate = Gross − Biaya)
- HPP (read-only, auto-calculate = Qty × AVG COST SKU saat ini)
- Laba (read-only, auto-calculate = Net Rev − HPP, ditampilkan dengan warna hijau/merah)
- Tombol `Batal` (outline) dan `Simpan` (solid biru)

**Efek samping setelah simpan:** kurangi stok SKU PACKAGE terkait, tambah baris baru ke tabel, dan memperbarui seluruh KPI & chart terkait penjualan di halaman Dashboard.

---

## 6. Gaya Visual (Design Tokens)

Konsisten dengan halaman-halaman sebelumnya:
- Font sans-serif modern.
- Background halaman: `#F5F6F8`
- Card/tabel: putih `#FFFFFF`, border `#E5E7EB`, radius `8px`
- Tombol primer (Catat Penjualan): biru `#2563EB`, teks putih bold
- Tombol sekunder (Bulk Paste): outline abu-abu `#D1D5DB`, teks `#374151`
- Dropdown filter: border abu-abu `#D1D5DB`, background putih, panah bawah di kanan
- Header kolom tabel: teks kapital kecil `#6B7280`
- Empty-state text: biru `#2563EB`
- Kolom LABA: hijau `#10B981` untuk nilai positif, merah `#EF4444` untuk nilai negatif
- Toast notifikasi bawah (global/dev): background gelap `#111827`, teks putih, tombol aksi hijau `#10B981`

## 7. Interaktivitas Ringkas

1. Dropdown `Semua` (channel) → filter tabel berdasarkan marketplace.
2. `+ Catat Penjualan` → buka modal tambah transaksi penjualan baru, dengan auto-calculate Gross/Net Rev/HPP/Laba dan validasi stok.
3. `Bulk Paste` → buka modal tempel data massal penjualan.
4. Setiap transaksi baru otomatis: (a) kurangi stok SKU PACKAGE, (b) tambah baris ke tabel, (c) update seluruh KPI, time series, bar chart marketplace, dan tabel Top 10 SKU di Dashboard.
5. (Opsional, disarankan) filter tanggal & pencarian SKU/Order ID, agar konsisten dengan kebutuhan pelaporan — belum terlihat di gambar.

---

*Dokumen ini adalah spesifikasi halaman "Penjualan Marketplace". Lanjutkan ke halaman berikutnya sesuai urutan sidebar: Inventory, Laporan & Export.*
