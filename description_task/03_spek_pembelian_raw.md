# Spesifikasi Halaman — "Pembelian RAW"
## Taetaa Company Sistem (Aplikasi Manajemen Inventory & Penjualan)

> Halaman 3 dari beberapa halaman aplikasi. Diakses dari sidebar menu "Pembelian RAW". Halaman ini mencatat setiap transaksi pembelian bahan baku dari supplier, yang otomatis memperbarui stok RAW dan HPP rata-rata tertimbang.

---

## 1. Konteks & Tujuan Halaman

Halaman transaksional untuk mencatat histori pembelian bahan baku (RAW). Setiap entri pembelian baru akan:
- Menambah stok SKU tipe RAW terkait (memengaruhi kolom `STOCK` di halaman Master SKU).
- Menghitung ulang **AVG COST** (HPP rata-rata tertimbang) SKU RAW tersebut menggunakan rumus Weighted Average:
  `AVG COST baru = (Stok lama × AVG COST lama + Qty baru × Harga Satuan baru) / (Stok lama + Qty baru)`
- Menjadi komponen dasar perhitungan HPP produk WIP/PACKAGE yang menggunakan RAW ini di BOM-nya (lihat Master SKU).

---

## 2. Layout Global (reuse dari halaman sebelumnya)

- Sidebar kiri identik, item **"Pembelian RAW"** dalam state **aktif** (background biru solid, teks putih bold).
- Item "Produksi (RAW→WIP)" kembali tampak sedikit berwarna biru — konsisten dengan temuan di halaman sebelumnya, kemungkinan hanya efek hover/render, perlakukan sebagai item non-aktif standar.
- Footer sidebar pada halaman ini menampilkan **2 baris teks** (berbeda dari halaman-halaman lain yang hanya 1 baris):
  - Baris 1: `v1.0 - Weighted Average HPP`
  - Baris 2: `Manual entry mode`

---

## 3. Header Halaman

- Background abu-abu sangat muda (#F5F6F8), padding ±24px, border bawah tipis.
- **Kiri:**
  - Label kecil abu-abu kapital: `TAETAA COMPANY SISTEM`
  - Judul besar bold hitam (±28px): `Pembelian RAW`
  - Sub-judul abu-abu (±14px): `Catat pembelian bahan baku. Sistem otomatis update HPP rata-rata (Weighted Average).`
- **Kanan** (align kanan, sejajar horizontal, gap ±10-12px):
  - Tombol `Bulk Paste` — outline/border abu-abu, background putih, ikon paste kecil di kiri teks.
  - Tombol `+ Catat Pembelian` — solid biru (#2563EB), teks putih bold, ikon plus di kiri teks. CTA utama halaman.

**Perilaku:**
- `Bulk Paste` → modal tempel data massal pembelian (format tab-separated, misal dari Excel: Tanggal, SKU, Qty, Harga Satuan, Supplier, Catatan).
- `+ Catat Pembelian` → modal/form tambah 1 transaksi pembelian baru (lihat bagian 6).

---

## 4. Card Ringkasan "Total Pembelian"

Card putih kecil, full-width, di bawah header, sebelum tabel, padding ±20px, border tipis, radius ±8px, menyatu di atas card tabel (atau card terpisah dengan gap kecil — pada gambar tampak sebagai satu card besar berisi ringkasan + tabel).

- Label kecil kapital abu-abu: `TOTAL PEMBELIAN`
- Nilai besar biru bold (±22px): `Rp 0`

**Perilaku:** Nilai ini adalah total akumulasi (Harga Satuan × Qty) dari seluruh baris pembelian yang tercatat. Jika halaman ini nantinya punya filter tanggal (belum terlihat di gambar), nilai ini mengikuti filter tersebut.

---

## 5. Tabel Daftar Pembelian

Menyatu langsung di bawah card ringkasan dalam satu container/card yang sama (border tipis abu-abu, radius ±8px).

### 5.1 Header Kolom
Baris header background abu-abu sangat muda, teks kapital kecil bold abu-abu gelap (beberapa kolom tampak beraksen warna berbeda di gambar — SKU & QTY & HARGA SATUAN dalam warna oranye/cokelat muda, kemungkinan efek rendering/hover; default-kan semua header dengan warna abu-abu standar seperti tabel Master SKU kecuali diinstruksikan lain), border bawah:

| Kolom | Rata | Keterangan |
|---|---|---|
| TANGGAL | Kiri | Tanggal transaksi pembelian |
| SKU | Kiri | Kode SKU bahan baku yang dibeli (RAW) |
| QTY | Kanan | Jumlah unit yang dibeli |
| HARGA SATUAN | Kanan | Harga per unit saat pembelian (Rp) |
| TOTAL | Kanan | = QTY × HARGA SATUAN (Rp) |
| SUPPLIER | Kiri | Nama pemasok/toko sumber bahan baku |
| CATATAN | Kiri | Keterangan bebas (opsional) |

### 5.2 Baris Data
- Padding vertikal ±14px per baris, border bawah tipis antar baris, hover → background abu-abu sangat muda.
- Kolom HARGA SATUAN dan TOTAL memakai format Rupiah (`Rp #.###`).
- Kemungkinan tiap baris memiliki ikon aksi Edit/Hapus di ujung kanan (tidak terlihat pada gambar karena tabel kosong — tambahkan sebagai kolom `AKSI` opsional mengikuti pola tabel Master SKU).

### 5.3 Empty State (kondisi saat ini di gambar)
Ketika belum ada transaksi pembelian tercatat:
- Baris kosong dengan padding vertikal besar (±60px).
- Teks di tengah warna biru:
  `Belum ada pembelian. Klik "Catat Pembelian".`
- Frasa `"Catat Pembelian"` idealnya adalah trigger/link yang membuka modal tambah pembelian, sama seperti tombol di header.

---

## 6. Modal/Form "Catat Pembelian" (dipicu tombol `+ Catat Pembelian`)

*(Tidak terlihat langsung di gambar, disusun berdasarkan kolom tabel agar konsisten)*

Field yang disarankan, urut sesuai kolom tabel:
- Tanggal (date picker, wajib, default hari ini)
- SKU (dropdown/autocomplete, wajib, hanya menampilkan SKU bertipe **RAW** dari Master SKU)
- Qty (angka, wajib, > 0)
- Harga Satuan (angka Rupiah, wajib, > 0)
- Total (angka Rupiah, read-only, auto-calculate = Qty × Harga Satuan)
- Supplier (text, opsional)
- Catatan (textarea singkat, opsional)
- Tombol `Batal` (outline) dan `Simpan` (solid biru)

**Efek samping setelah simpan:** update stok & AVG COST SKU RAW terkait (lihat bagian 1), menambah baris baru ke tabel, dan memperbarui angka `TOTAL PEMBELIAN`.

---

## 7. Elemen Global Tambahan Terlihat di Gambar — Toast/Banner Notifikasi

Muncul mengambang di bagian bawah tengah layar (posisi fixed, di atas seluruh konten), kemungkinan ini adalah elemen **global** yang muncul di semua halaman preview (bukan spesifik halaman Pembelian RAW) — tandai ke AI pembangun bahwa ini kemungkinan komponen sistem/dev, bukan bagian dari desain final produk:

- Bentuk pill/rounded, background gelap hampir hitam (#1F2937 atau lebih gelap), teks putih.
- Isi teks: `Frontend Preview Only. Please wake servers to enable backend functionality.`
- Tombol kecil hijau di ujung kanan pill: `Wake up servers`.
- **Catatan untuk implementasi:** ini tampaknya notifikasi environment/development (mis. server backend sedang idle/sleep di platform hosting), bukan bagian dari fungsionalitas bisnis. Sebaiknya diabaikan saat membangun ulang halaman produksi, kecuali user memang ingin mereplikasi sistem wake-server yang sama.

---

## 8. Gaya Visual (Design Tokens)

Konsisten dengan halaman Dashboard & Master SKU:
- Font sans-serif modern.
- Background halaman: `#F5F6F8`
- Card/tabel: putih `#FFFFFF`, border `#E5E7EB`, radius `8px`
- Tombol primer (Catat Pembelian): biru `#2563EB`, teks putih bold
- Tombol sekunder (Bulk Paste): outline abu-abu `#D1D5DB`, teks `#374151`
- Nilai ringkasan (Total Pembelian): biru bold, ukuran besar (±22-24px)
- Header kolom tabel: teks kapital kecil `#6B7280`
- Link/empty-state text: biru `#2563EB`
- Toast notifikasi bawah: background gelap `#111827`, teks putih, tombol aksi hijau `#10B981`

## 9. Interaktivitas Ringkas

1. `+ Catat Pembelian` → buka modal tambah transaksi pembelian baru.
2. `Bulk Paste` → buka modal tempel data massal pembelian.
3. Setiap transaksi baru otomatis: (a) menambah baris ke tabel, (b) update `TOTAL PEMBELIAN`, (c) update stok & AVG COST SKU RAW terkait yang tercermin di halaman Master SKU dan Dashboard.
4. (Opsional, disarankan) filter/pencarian per SKU atau rentang tanggal — belum terlihat di gambar, tambahkan jika diperlukan agar konsisten dengan pola halaman lain.

---

*Dokumen ini adalah spesifikasi halaman "Pembelian RAW". Lanjutkan ke halaman berikutnya sesuai urutan sidebar: Produksi (RAW→WIP), Penjualan, Inventory, Laporan & Export.*
