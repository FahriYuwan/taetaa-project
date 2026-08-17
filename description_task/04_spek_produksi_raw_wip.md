# Spesifikasi Halaman — "Produksi RAW → WIP"
## Taetaa Company Sistem (Aplikasi Manajemen Inventory & Penjualan)

> Halaman 4 dari beberapa halaman aplikasi. Diakses dari sidebar menu "Produksi (RAW→WIP)". Halaman ini mencatat proses konversi/perakitan bahan baku (RAW) menjadi produk jadi/setengah jadi (WIP/PACKAGE) sesuai resep (BOM) yang didefinisikan di Master SKU.

---

## 1. Konteks & Tujuan Halaman

Halaman transaksional untuk mencatat setiap sesi produksi. Satu entri produksi berarti: sejumlah unit SKU output (tipe WIP atau PACKAGE) dibuat dengan mengonsumsi komponen-komponen RAW/WIP sesuai BOM yang sudah didefinisikan di Master SKU. Setiap entri produksi baru akan:
- **Mengurangi stok** SKU komponen yang dipakai (sesuai qty BOM × qty output), memengaruhi kolom `STOCK` mereka di Master SKU.
- **Menambah stok** SKU output (WIP/PACKAGE) sejumlah qty yang diproduksi.
- **Menghitung HPP per unit** SKU output secara otomatis dengan Weighted Average, berdasarkan total biaya komponen yang dipakai (mengacu pada AVG COST tiap komponen saat itu) dibagi qty output — hasilnya menjadi/mempengaruhi AVG COST SKU output tersebut di Master SKU.
- Menjadi input data untuk KPI "Nilai Inventory WIP" di halaman Dashboard.

---

## 2. Layout Global (reuse dari halaman sebelumnya)

- Sidebar kiri identik dengan halaman-halaman sebelumnya, item **"Produksi (RAW→WIP)"** dalam state **aktif** (background biru solid, teks putih bold).
- Sidebar & konten pada gambar ini tampak sedikit lebih sempit/berbeda skala dibanding halaman-halaman sebelumnya (ukuran layar capture berbeda) — perlakukan sebagai perbedaan viewport saja, bukan perubahan desain; struktur & proporsi elemen tetap sama.
- Footer sidebar kembali ke pola 1 baris seperti halaman Dashboard & Master SKU (tidak terlihat jelas di gambar, gunakan `v1.0 - Weighted Average HPP` sebagai default, kecuali mode "Manual entry mode" perlu ditampilkan konsisten di semua halaman — samakan dengan temuan di halaman Pembelian RAW).

---

## 3. Header Halaman

- Background abu-abu sangat muda (#F5F6F8), padding ±20-24px, border bawah tipis.
- **Kiri:**
  - Label kecil abu-abu kapital: `TAETAA COMPANY SISTEM`
  - Judul besar bold hitam (±24-26px): `Produksi RAW → WIP`
  - Sub-judul abu-abu (±13-14px): `Konversi bahan baku menjadi produk jadi berdasarkan BOM. HPP dihitung otomatis (Weighted Average).`
- **Kanan** (align kanan, sejajar horizontal, gap ±10px):
  - Tombol `Bulk Paste` — outline/border abu-abu, background putih, ikon paste kecil di kiri teks.
  - Tombol `Produksi Baru` — solid biru (#2563EB), teks putih bold, ikon folder/dokumen kecil di kiri teks (bukan ikon plus seperti halaman lain — perhatikan detail ikon ini). CTA utama halaman.

**Perilaku:**
- `Bulk Paste` → modal tempel data massal entri produksi.
- `Produksi Baru` → modal/form untuk mencatat 1 sesi produksi baru (lihat bagian 5).

**Catatan:** halaman ini **tidak memiliki card ringkasan** (seperti "Total Pembelian" di halaman Pembelian RAW) — header langsung diikuti tabel.

---

## 4. Tabel Daftar Produksi

Card putih, border tipis abu-abu, radius ±8px, langsung di bawah header (tanpa card ringkasan di atasnya).

### 4.1 Header Kolom
Baris header background abu-abu sangat muda, teks kapital kecil bold abu-abu gelap, border bawah:

| Kolom | Rata | Keterangan |
|---|---|---|
| TANGGAL | Kiri | Tanggal sesi produksi dilakukan |
| OUTPUT SKU | Kiri | Kode SKU hasil produksi (tipe WIP atau PACKAGE) |
| NAMA | Kiri | Nama deskriptif SKU output |
| QTY OUTPUT | Kanan/Tengah | Jumlah unit yang berhasil diproduksi |
| KOMPONEN TERPAKAI | Kiri | Ringkasan/daftar komponen RAW/WIP yang dikonsumsi beserta qty-nya (bisa berupa teks ringkas dipisah koma, atau badge per komponen, atau link "Lihat detail") |
| TOTAL BIAYA | Kanan | Total biaya produksi (Rp) = akumulasi (qty komponen × AVG COST komponen saat itu) |
| HPP / UNIT | Kanan | = TOTAL BIAYA ÷ QTY OUTPUT (Rp per unit) |

### 4.2 Baris Data
- Padding vertikal ±14px per baris, border bawah tipis antar baris, hover → background abu-abu sangat muda.
- Kolom TOTAL BIAYA dan HPP/UNIT memakai format Rupiah (`Rp #.###`).
- Disarankan menambah kolom `AKSI` (Edit/Hapus/Lihat Detail) di ujung kanan mengikuti pola tabel lain, meski tidak terlihat karena tabel kosong.

### 4.3 Empty State (kondisi saat ini di gambar)
Ketika belum ada sesi produksi tercatat:
- Baris kosong dengan padding vertikal cukup besar.
- Teks di tengah, warna **merah/oranye kecoklatan** (berbeda dari pola empty state halaman lain yang berwarna biru — perhatikan detail warna ini):
  `Belum ada produksi.`
- Tidak ada kalimat ajakan aksi tambahan seperti di halaman lain (mis. tidak ada "Klik ... untuk menambah") — hanya pernyataan status kosong.

---

## 5. Modal/Form "Produksi Baru" (dipicu tombol `Produksi Baru`)

*(Tidak terlihat langsung di gambar, disusun berdasarkan kolom tabel & logika BOM agar konsisten)*

Alur yang disarankan:
1. **Tanggal** produksi (date picker, wajib, default hari ini).
2. **Output SKU** (dropdown/autocomplete, wajib, hanya menampilkan SKU bertipe **WIP** atau **PACKAGE** dari Master SKU).
3. Setelah Output SKU dipilih → sistem otomatis menampilkan **daftar komponen BOM** SKU tersebut (dari resep di Master SKU: Komponen 1-8 + Plastik Luar beserta qty per 1 unit).
4. **Qty Output** (angka, wajib) → saat diisi, sistem otomatis menghitung kebutuhan tiap komponen (qty BOM per unit × Qty Output) dan menampilkan validasi apakah stok komponen tersebut mencukupi (indikator hijau/merah).
5. Tampilan ringkasan otomatis (read-only): Total Biaya (akumulasi qty komponen terpakai × AVG COST masing-masing) dan HPP/Unit hasil hitung.
6. Catatan (opsional).
7. Tombol `Batal` (outline) dan `Simpan` (solid biru) — tombol Simpan sebaiknya nonaktif/disabled jika ada komponen dengan stok tidak mencukupi.

**Efek samping setelah simpan:** kurangi stok komponen, tambah stok output SKU, update AVG COST SKU output, tambah baris baru ke tabel produksi, dan memengaruhi KPI Nilai Inventory RAW/WIP/Package di Dashboard.

---

## 6. Gaya Visual (Design Tokens)

Konsisten dengan halaman-halaman sebelumnya, dengan catatan warna khusus di halaman ini:
- Font sans-serif modern.
- Background halaman: `#F5F6F8`
- Card/tabel: putih `#FFFFFF`, border `#E5E7EB`, radius `8px`
- Tombol primer (Produksi Baru): biru `#2563EB`, teks putih bold
- Tombol sekunder (Bulk Paste): outline abu-abu `#D1D5DB`, teks `#374151`
- Header kolom tabel: teks kapital kecil `#6B7280`
- **Empty-state text halaman ini: merah/oranye kecoklatan** (mis. `#B45309` atau `#DC2626` — beda dari pola biru di halaman lain, replikasikan sesuai gambar)

## 7. Interaktivitas Ringkas

1. `Produksi Baru` → buka modal pencatatan sesi produksi baru dengan auto-load BOM & validasi stok.
2. `Bulk Paste` → buka modal tempel data massal produksi.
3. Setiap entri produksi baru otomatis: (a) kurangi stok komponen RAW/WIP, (b) tambah stok SKU output, (c) update AVG COST SKU output, (d) tambah baris ke tabel, (e) memengaruhi Dashboard (Nilai Inventory RAW/WIP/Package).
4. (Opsional, disarankan) filter/pencarian per SKU output atau rentang tanggal, agar konsisten dengan kebutuhan halaman lain — belum terlihat di gambar.

---

*Dokumen ini adalah spesifikasi halaman "Produksi RAW → WIP". Lanjutkan ke halaman berikutnya sesuai urutan sidebar: Penjualan, Inventory, Laporan & Export.*
