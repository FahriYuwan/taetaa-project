# Prompt Lanjutan — 11 Task Fitur Baru
## Taetaa Company Sistem — Untuk AI Coding Agent

> Copy-paste seluruh isi di bawah "---" ke AI agent (Copilot/Claude Code/dsb) yang melanjutkan project ini. Sertakan juga folder `/docs` (dokumen 00-08) di repo/workspace yang sama sebelum mengirim prompt ini.

---

Lanjutkan pengembangan "Taetaa Company Sistem" dengan 11 perubahan/fitur
baru berikut. Baca dulu SELURUH dokumen di /docs (00 sampai 08) dan
kode yang sudah ada sebelum mulai — ini bukan project baru, ini
perubahan di atas fondasi yang sudah dibangun sebagian.

## KONTEKS PENTING YANG WAJIB DIPAHAMI SEBELUM MULAI

Sistem ini mengelola produk sabun/parfum cair. Setiap PACKAGE (produk
jadi siap jual) itu hasil racikan dari beberapa KATEGORI komponen,
bukan cuma 1 jenis bahan baku:

1. **RAW** — bahan baku cair mentah (mis. sabun curah, parfum).
   Setiap SKU (baik RAW maupun PACKAGE) punya field "Product Size"
   dalam satuan ML (mililiter) — mis. Sabun 20 Liter = 20000 ml,
   Sabun 1 Liter = 1000 ml, Sabun 100 ML = 100 ml. Konsumsi RAW
   dihitung OTOMATIS dengan rumus:
     `RAW Terpakai (ml) = Product Size SKU output (ml) × Qty`
   Contoh: produksi/jual 11 pcs Sabun 1 Liter (Product Size 1000ml)
   akan mengurangi stok RAW sebesar 11.000 ml.

2. **PACKING** — kode botol/wadah fisik (mis. BTL1 = botol 1 Liter,
   FLP3 = botol flip-top, FOM3 = botol foam pump). Konsumsi OTOMATIS,
   rasio TETAP 1:1 per unit produk jadi (1 pcs packing per 1 unit).

3. **STIKER** — kode label, UNIK per SKU (mis. STSBN1 khusus untuk
   SKU SBN1, tidak dipakai SKU lain). Konsumsi OTOMATIS, rasio 1:1
   per unit.

4. **DUS** — kode kardus, spesifikasi ukuran BEDA-BEDA per SKU (mis.
   DUS7, DUS4, DUS1 = ukuran dus berbeda, bukan kapasitas isi).
   Konsumsi OTOMATIS, rasio 1:1 per unit.

5. **SAFETY** — kode segel keamanan. Ada 2 jenis mekanisme konsumsi:
   - MAYORITAS kode (contoh: TBTL) → OTOMATIS, rasio 1:1 per unit,
     SAMA seperti Packing/Stiker/Dus.
   - KHUSUS 2 kode: `SLTP` dan `PLWR` → MANUAL. Kedua item fisik ini
     (1 gulung plastik wrap / 1 lembar segel) bisa dipakai untuk
     BANYAK unit produk sebelum benar-benar habis, jadi TIDAK BOLEH
     otomatis dikurangi tiap produksi. Sebagai gantinya, form
     Produksi harus menampilkan CHECKBOX terpisah untuk tiap komponen
     SLTP/PLWR yang ada di BOM SKU tersebut, contoh:
       ☐ "SLTP habis, kurangi stok?"
       ☐ "PLWR habis, kurangi stok?"
     Kalau dicentang → stok berkurang 1 pcs. Kalau TIDAK dicentang →
     stok TIDAK berubah sama sekali (dianggap masih pakai unit fisik
     yang sama dari sesi produksi sebelumnya).

Item Packing/Stiker/Safety/Dus BUKAN produk yang dijual ke customer
— ini "bahan pendukung produksi", sebaiknya disimpan di
tabel/master terpisah dari Master SKU produk (mis. tabel
`master_item_kemasan` dengan field: Kode, Nama, Kategori, Stok,
AVG Cost per pcs), tapi tetap ditautkan sebagai baris BOM ke SKU
produk yang memakainya.

## TASK 1 — SEDERHANAKAN TIPE SKU (kerjakan PALING AWAL, breaking change)

Ubah enum/tipe SKU dari 3 kategori lama (RAW / WIP / PACKAGE) menjadi
3 kategori baru: RAW / PRODUCT / PACKAGE.
- RAW = bahan baku mentah (tidak berubah)
- PRODUCT = menggantikan konsep WIP lama
- PACKAGE = tidak berubah
Cek SEMUA referensi "WIP" di kode (skema database, enum, UI badge,
filter tab) dan ganti jadi "PRODUCT". Buat migration database untuk
perubahan enum ini kalau sudah ada data tersimpan dengan tipe WIP.

## TASK 2 — MASTER SKU: TAMBAH KOLOM HPP (BUKAN MENGGANTI HARGA JUAL)

Tambahkan kolom BARU "HARGA HPP" di tabel Master SKU dan form
Tambah/Edit SKU. Kolom "HARGA JUAL" yang SUDAH ADA sebelumnya TETAP
DIPERTAHANKAN, TIDAK DIHAPUS DAN TIDAK DIGANTI — kedua kolom ini
sekarang berdampingan:
- HARGA JUAL = harga ke customer (dipakai untuk hitung Gross di
  halaman Penjualan)
- HARGA HPP = biaya pokok produksi per unit (bisa diisi manual ATAU
  auto-calculate dari BOM — kalau memungkinkan, buat auto-calculate
  yang lebih akurat, tapi tetap izinkan override manual)
JANGAN migrasi/hapus data harga jual yang sudah ada.

## TASK 3 — MASTER SKU: MODAL DETAIL BOM PER KATEGORI

Saat tombol "Lihat BOM" di tabel Master SKU diklik, buka modal/panel
yang menampilkan komponen resep TERSTRUKTUR SEPERTI SPREADSHEET
(tabel rapi, bukan daftar polos), dikelompokkan per KATEGORI sesuai
penjelasan di bagian "KONTEKS PENTING" di atas:

  Tabel dengan kolom: Kategori | Kode Komponen | Nama | Qty/Unit |
  Satuan | Tipe Konsumsi

  Dikelompokkan visual per kategori (bisa pakai section header atau
  warna badge beda per kategori):
  - RAW (tampilkan Product Size dalam ml sebagai referensi rasio)
  - PACKING
  - STIKER
  - SAFETY (beri badge/tanda visual jelas: "Otomatis" vs "Manual" —
    HANYA SLTP & PLWR yang berlabel "Manual", sisanya "Otomatis")
  - DUS

Builder BOM di form "Tambah/Edit SKU" juga perlu diupdate: saat
menambah baris komponen, WAJIB pilih Kategori dulu (dropdown: RAW/
PACKING/STIKER/SAFETY/DUS), baru muncul dropdown Kode Komponen yang
sesuai kategori tersebut (kode Packing hanya muncul kalau kategori
Packing dipilih, dst).

## TASK 4 — HALAMAN "AFFILIATE" BARU (SUB-HALAMAN DARI PENJUALAN)

Buat halaman baru bertampilan spreadsheet (tabel padat, pola mirip
halaman Penjualan Marketplace), khusus menampilkan transaksi dengan
Marketplace = "Affiliate" dari tabel Penjualan yang SUDAH ADA (reuse
skema, filter berdasarkan channel, JANGAN buat tabel database baru).

Kolom wajib: Tanggal, SKU, Nama, Qty, HPP, Gross, Biaya, Net Rev,
Laba. Fitur wajib:
- Filter rentang tanggal (DARI–SAMPAI)
- Card ringkasan "TOTAL BIAYA (HPP) YANG DIKELUARKAN" = akumulasi
  HPP seluruh transaksi Affiliate pada periode terfilter

## TASK 5 — HALAMAN "PENGELUARAN LAIN" BARU (SUB-HALAMAN)

Halaman & tabel database baru untuk pengeluaran di luar alur bisnis
inti (bonus pegawai, compliment/hadiah) — TIDAK menyentuh stok SKU.

Kolom: Tanggal, Kategori (dropdown: Bonus/Compliment/Lainnya),
Penerima, Jumlah (Rp), Keterangan. Card ringkasan "Total Pengeluaran"
dengan filter tanggal, tombol "+ Catat Pengeluaran".

## TASK 6 — HALAMAN "LOST & BREAKAGE" (SUB-HALAMAN)

Halaman & tabel database baru untuk barang gagal QC/rusak/hilang —
MENGURANGI STOK SKU terkait, tercermin di Dashboard Inventory (Task 7).

Kolom: Tanggal, SKU, Qty, Kategori/Alasan (dropdown: Gagal QC/Rusak/
Hilang/Lainnya), Catatan. Card ringkasan "Total Kerugian (Rp)" =
Qty × HPP SKU, dengan filter tanggal.

## TASK 7 — DASHBOARD INVENTORY: KOLOM MUTASI "KELUAR (RUSAK)"

Tambah kolom "KELUAR (RUSAK)" di tabel mutasi stok, dari data Lost &
Breakage (Task 6). Update rumus:
  `Stock Akhir = Stock Awal + Masuk (Beli) + Masuk (Produksi) − Keluar (Produksi) − Keluar (Jual) − Keluar (Rusak)`

## TASK 8 — FORM PRODUKSI: CHECKBOX MANUAL SLTP/PLWR

Update form "Produksi Baru": saat SKU output punya komponen SLTP
dan/atau PLWR di BOM-nya, tampilkan checkbox terpisah untuk masing-
masing (lihat detail mekanisme di bagian "KONTEKS PENTING" di atas).
Komponen RAW/Packing/Stiker/Dus/Safety-otomatis tetap terpotong
otomatis tanpa interaksi tambahan.

## TASK 9 — RESTRUKTUR SIDEBAR: HALAMAN INDUK NON-KLIK + SUB-HALAMAN

```
📁 Penjualan              ← INDUK, tidak punya route/tidak bisa diklik
   ├─ Marketplace         ← sub-halaman aktif
   └─ Affiliate           ← sub-halaman aktif (Task 4)

📁 Kerugian & Pengeluaran ← INDUK, tidak punya route/tidak bisa diklik
   ├─ Lost & Breakage     ← sub-halaman aktif (Task 6)
   └─ Pengeluaran Lain    ← sub-halaman aktif (Task 5)
```

Item induk: section header, tidak memicu navigasi saat diklik,
styling beda (cursor default, teks lebih tebal). Sub-item ter-indent
±12-16px, tetap berperilaku seperti item sidebar normal.

## TASK 10 — STOCK OPNAME: TOOLTIP BREAKDOWN + CEKLIS REKONSILIASI

Di halaman Dashboard Inventory:

**10a. Tooltip breakdown pemakaian RAW** — hover/klik ikon info di
kolom STOCK AKHIR (khusus SKU RAW) menampilkan popover breakdown:
Stock Awal, Masuk (Beli), lalu daftar "Dipakai untuk:" per SKU
turunan (mis. SBN dipakai untuk SBN1 −11.000ml, SBN3 −800ml, dst,
dihitung dari rumus RAW di bagian "KONTEKS PENTING"), sampai Stock
Akhir. Kalau data terlalu panjang untuk tooltip, sediakan juga versi
modal detail dengan tabel scrollable.

**10b. Ceklis rekonsiliasi stok sistem vs manual** — section/halaman
baru untuk stock opname: per SKU tampilkan Stok Sistem (read-only),
input Stok Fisik (manual), Selisih (auto-calculate, warna merah/
hijau/kuning sesuai nilai), checkbox "Sudah dicek", field Catatan.
Tombol "Simpan Hasil Opname" menyimpan sesi ini sebagai record
historis (audit trail). Sediakan opsi bikin entri "Penyesuaian Stok"
otomatis dari selisih yang dikonfirmasi, tercatat sebagai mutasi baru
kategori "Penyesuaian" di tabel Dashboard Inventory.

## TASK 11 — UPDATE SEEDER: DATA CONTOH UNTUK SEMUA FITUR BARU

Update/perluas seeder demo yang sudah ada (JANGAN bikin dari nol
kalau sudah ada infrastruktur seed sebelumnya) supaya mencakup SEMUA
struktur baru di atas, dengan subset data SECUKUPNYA (bukan banyak,
tapi lengkap tiap jenis harus ada minimal 1 contoh):

- Minimal 2-3 SKU tipe RAW dengan Product Size terisi (ml)
- Minimal 3-4 SKU tipe PACKAGE dengan Product Size berbeda-beda
  (mis. 1000ml, 500ml, 100ml) supaya rumus konsumsi RAW berbasis
  volume bisa didemokan dengan hasil yang masuk akal
- Master item kemasan: minimal 1-2 kode tiap kategori (Packing,
  Stiker, Safety, Dus) — WAJIB sertakan kode `SLTP` dan `PLWR` di
  kategori Safety dengan tipe konsumsi "Manual", dan minimal 1 kode
  Safety lain (mis. `TBTL`) dengan tipe "Otomatis", supaya perbedaan
  mekanismenya bisa terlihat jelas saat demo
- BOM tiap SKU PACKAGE harus lengkap mencakup SEMUA kategori (RAW +
  Packing + Stiker + Safety + Dus) — jangan ada SKU PACKAGE dengan
  BOM kosong/parsial
- Setiap SKU produk WAJIB punya Harga Jual DAN Harga HPP terisi
  (dua-duanya, sesuai Task 2)
- Minimal 2-3 transaksi Produksi yang melibatkan checkbox manual
  SLTP/PLWR — buat variasi: ada sesi yang checkbox-nya dicentang
  (stok berkurang), ada yang tidak dicentang (stok tidak berubah) —
  supaya perbedaan efeknya kelihatan jelas saat didemokan
- Minimal 3-4 transaksi Penjualan dengan channel "Affiliate" secara
  eksplisit, supaya halaman Affiliate (Task 4) tidak kosong saat demo
- Minimal 2 entri Pengeluaran Lain (kategori Bonus & Compliment,
  masing-masing minimal 1)
- Minimal 2 entri Lost & Breakage dengan SKU dan alasan berbeda
- Pastikan seeder tetap IDEMPOTEN dan terpisah jelas dari data
  production, mengikuti aturan yang sudah ditetapkan sebelumnya

Setelah seeding, verifikasi: Dashboard Utama, Dashboard Inventory
(termasuk tooltip breakdown RAW), Master SKU (modal BOM per kategori),
dan halaman Affiliate/Pengeluaran Lain/Lost & Breakage SEMUA
menampilkan data, tidak ada yang masih kosong/Rp 0.

## ATURAN UMUM UNTUK SEMUA TASK

- Pakai design tokens dari dokumen 00 (palet warna brand) untuk
  semua elemen UI baru.
- Terapkan pola UX yang sudah disepakati: toast konfirmasi setelah
  simpan, dialog konfirmasi sebelum hapus, validasi stok real-time.
- Setelah tiap task selesai, jalankan aplikasi dan laporkan: apa yang
  sudah jadi, apa yang masih perlu dicek manual, screenshot kalau
  memungkinkan.
- Kerjakan urut sesuai nomor Task (1 → 11) — Task 1-3 adalah fondasi
  yang memengaruhi task berikutnya, jangan lompat ke UI baru sebelum
  itu selesai. Task 11 (seeder) dikerjakan PALING TERAKHIR, setelah
  semua fitur lain sudah ada, supaya seeder-nya mencerminkan struktur
  final yang benar.
- Kalau ada ambiguitas teknis yang tidak dijelaskan di sini,
  TANYAKAN dulu sebelum mengambil keputusan sepihak yang bisa
  menghapus/mengubah data.

Mulai dari Task 1: sederhanakan tipe SKU dari RAW/WIP/PACKAGE menjadi
RAW/PRODUCT/PACKAGE, dan tunjukkan rencana migration database sebelum
dieksekusi.
