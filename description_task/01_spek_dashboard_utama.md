# Spesifikasi Halaman — "Dashboard Utama"
## Taetaa Company Sistem (Aplikasi Manajemen Inventory & Penjualan)

> Halaman 1 dari beberapa halaman aplikasi. Ini adalah landing page setelah login, menampilkan ringkasan bisnis secara keseluruhan.

---

## 1. Konteks Aplikasi

Ini adalah sistem internal untuk bisnis manufaktur/FMCG (produk sabun & parfum cair, dijual dalam kemasan liter) bernama **Taetaa**. Sistem melacak alur: pembelian bahan baku (RAW) → produksi menjadi barang setengah jadi/jadi (WIP/PACKAGE) → penjualan lintas marketplace (Shopee, TikTok), offline, dan affiliate. Sistem menghitung HPP (COGS) dengan metode **Weighted Average**.

Modul data yang mendasari (untuk referensi logika, bukan untuk ditampilkan mentah):
- **Master SKU** — daftar kode produk & komposisi bahan baku
- **RAW** — daftar bahan baku & stok
- **PACKAGE** — resep/BOM (komponen + qty per SKU)
- **Pembelian RAW** — histori pembelian bahan baku
- **Inventory** — mutasi stok masuk/keluar per SKU per hari
- **Sales Taeta / Offline / Affiliate** — histori transaksi penjualan per channel
- **Lost & Breakage**, **Return** — penyesuaian stok
- **Input Marketing** — biaya & aktivitas marketing per akun/marketplace

---

## 2. Layout Global (berlaku di semua halaman)

**Struktur:** Sidebar kiri tetap (fixed) + area konten kanan yang bisa scroll.

### 2.1 Sidebar Kiri
- Lebar tetap ±220px, latar putih, border kanan tipis abu-abu muda.
- **Header brand** (paling atas, padding ±20px):
  - Kotak ikon kecil (±36x36px), sudut membulat, warna biru (#2563EB atau sejenis), berisi ikon bintang/sparkle putih.
  - Di sampingnya: teks "**Taetaa**" (bold, hitam, ukuran ±16px) dan di bawahnya "COMPANY SISTEM" (huruf kapital kecil, abu-abu, letter-spacing lebar, ±10px).
- **Menu navigasi** (list vertikal, tiap item full-width, padding ±10px 16px, sudut membulat, ikon 18px + label):
  1. Dashboard (ikon grid) — **state aktif**: background biru muda solid, teks putih/biru tua bold
  2. Master SKU (ikon kotak/tag)
  3. Pembelian RAW (ikon keranjang belanja)
  4. Produksi (RAW→WIP) (ikon dokumen/file)
  5. Penjualan (ikon monitor/kasir)
  6. Inventory (ikon orang/gudang)
  7. Laporan & Export (ikon dokumen teks)
  - Item non-aktif: teks abu-abu gelap, hover menimbulkan background abu-abu sangat muda.
- **Footer sidebar** (menempel di bawah, teks kecil abu-abu ±11px): `v1.0 - Weighted Average HPP`

### 2.2 Header Halaman (bagian atas area konten)
- Background sedikit lebih terang/berbeda dari card (abu-abu sangat muda, misal #F5F6F8), full width, padding ±24px, border bawah tipis.
- **Kiri:**
  - Label kecil abu-abu kapital, letter-spacing: `TAETAA COMPANY SISTEM`
  - Judul besar bold hitam (±28px): `Dashboard Utama`
  - Sub-judul abu-abu (±14px): `Ringkasan pendapatan bersih, HPP, dan nilai inventory`
- **Kanan** (align kanan, sejajar horizontal, gap antar elemen ±16px):
  - Filter tanggal 1 — label kecil abu-abu di atas: `DARI`, input date dengan ikon kalender, contoh nilai `07/15/2026`
  - Filter tanggal 2 — label kecil abu-abu di atas: `SAMPAI`, input date dengan ikon kalender, contoh nilai `08/14/2026`
  - Tombol `Seed Contoh` — outline/border abu-abu, rounded, ikon kecil di kiri teks, background putih, untuk mengisi data contoh/dummy.
  - **Perilaku:** mengubah rentang tanggal ini akan me-refresh seluruh angka & grafik di bawah sesuai periode yang dipilih.

---

## 3. Konten Utama (dalam padding ±24px, background abu-abu muda #F5F6F8, isi berupa card putih)

### 3.1 Baris KPI Cards #1 (grid 4 kolom, gap ±16px)

Setiap card: background putih, border tipis abu-abu, sudut membulat ±8px, padding ±20px, shadow sangat halus.
Struktur tiap card: label kecil kapital abu-abu di atas → angka besar bold di tengah (±26px) → keterangan kecil abu-abu di bawah.

| # | Label | Nilai Besar | Warna Angka | Keterangan Kecil |
|---|-------|-------------|-------------|-------------------|
| 1 | PENDAPATAN BERSIH | Rp 0 | Biru | "Gross: Rp 0 · Fee: Rp 0" |
| 2 | TOTAL HPP (COGS) | Rp 0 | Oranye | "Qty terjual: 0" |
| 3 | LABA BERSIH | Rp 0 | Merah (atau hijau jika positif) | "0% margin" |
| 4 | TOTAL ORDER | 0 | Hitam | "Avg: Rp 0" |

*Catatan logika:* Pendapatan Bersih = total gross penjualan dikurangi fee marketplace (dari sheet Sales Taeta/Offline/Affiliate). Total HPP = qty terjual × HPP weighted average per SKU (dari sheet RAW + PACKAGE). Laba Bersih = Pendapatan Bersih − Total HPP. Margin = Laba Bersih / Pendapatan Bersih.

### 3.2 Baris KPI Cards #2 (grid 4 kolom, gap ±16px, style sama seperti 3.1)

| # | Label | Nilai Besar | Keterangan Kecil |
|---|-------|-------------|-------------------|
| 1 | NILAI INVENTORY RAW | Rp 0 | — |
| 2 | NILAI INVENTORY WIP | Rp 0 | — |
| 3 | NILAI INVENTORY PACKAGE | Rp 0 | — |
| 4 | TOTAL PEMBELIAN RAW | Rp 0 | "Periode dipilih" |

*Catatan logika:* Nilai Inventory = stok akhir (dari sheet Inventory) × harga rata-rata tertimbang, dipecah per kategori (RAW / WIP / PACKAGE jadi).

### 3.3 Baris Grafik #1 (grid 2 kolom, kolom kiri lebih lebar ±70%, kolom kanan ±30%, gap ±16px)

**Card Kiri — Time Series**
- Label kecil abu-abu: `TIME SERIES`
- Judul: `Pendapatan vs HPP vs Laba` (bold)
- Area chart/line chart dengan 3 garis (Pendapatan = biru, HPP = oranye, Laba = merah/hijau), sumbu X = tanggal (mengikuti rentang filter DARI–SAMPAI), sumbu Y = Rupiah.
- Saat kosong data: area chart kosong dengan border putus-putus/grid tipis (empty state).

**Card Kanan — Donut Chart**
- Label kecil abu-abu: `ALOKASI NILAI`
- Judul: `Inventory` (bold)
- Donut/pie chart menampilkan proporsi nilai inventory per kategori.
- Legend di bawah chart, horizontal, tiap item ada kotak warna kecil + label: 🟩 PACKAGE, 🟦 RAW, 🟧 WIP.

### 3.4 Baris Grafik #2 (grid 2 kolom, sama lebar ±50/50, gap ±16px)

**Card Kiri — Bar Chart**
- Label kecil abu-abu: `PERBANDINGAN MARKETPLACE`
- Judul: `Net Revenue per Marketplace` (bold)
- Bar chart perbandingan pendapatan bersih per channel (Shopee, TikTok, Offline, Affiliate), sumbu X = nama marketplace, sumbu Y = Rupiah.

**Card Kanan — Tabel Top 10**
- Label kecil abu-abu: `TOP 10`
- Judul: `SKU Paling Menguntungkan` (bold)
- Tabel dengan header kolom: `SKU` | `QTY` | `REVENUE` | `LABA` (header kecil kapital abu-abu, rata kiri untuk SKU, rata kanan untuk angka)
- Baris data diurutkan dari laba tertinggi.
- **Empty state:** jika belum ada data penjualan pada periode terpilih, tampilkan teks abu-abu di tengah tabel: `Belum ada data penjualan`.

---

## 4. Gaya Visual (Design Tokens)

- **Font:** Sans-serif modern (misal Inter/system-ui).
- **Warna latar utama:** `#F5F6F8` (abu-abu sangat muda)
- **Warna card:** `#FFFFFF`, border `#E5E7EB`, radius `8px`, shadow halus `0 1px 2px rgba(0,0,0,0.04)`
- **Warna aksen:**
  - Biru utama (brand/pendapatan): `#2563EB`
  - Oranye (HPP): `#F97316`
  - Merah (laba/negatif): `#EF4444`
  - Hijau (laba positif, opsional): `#10B981`
  - Teks label kecil: `#9CA3AF` kapital, letter-spacing lebar
  - Teks judul: `#111827` bold
- **Spacing:** padding card ±20-24px, gap antar card/grid ±16px, padding halaman ±24px.
- **Responsif:** pada layar sempit, grid KPI 4 kolom → 2 kolom → 1 kolom; grid grafik 2 kolom → 1 kolom (chart & tabel ditumpuk).

## 5. Interaktivitas Halaman Ini

1. Mengubah `DARI` / `SAMPAI` → re-fetch & re-render seluruh KPI card + 3 grafik + tabel top 10.
2. Tombol `Seed Contoh` → mengisi data dummy/contoh ke seluruh sistem agar dashboard tidak kosong (berguna untuk demo).
3. Sidebar item `Dashboard` dalam keadaan aktif (highlight biru) karena ini halaman saat ini; klik item lain akan berpindah ke halaman terkait (akan dispesifikasikan pada dokumen terpisah).
4. Semua card KPI bersifat read-only (tidak bisa diklik) — murni tampilan ringkasan.

---

*Dokumen ini adalah spesifikasi halaman "Dashboard Utama" saja. Halaman-halaman lain (Master SKU, Pembelian RAW, Produksi, Penjualan, Inventory, Laporan & Export) akan dibuatkan spesifikasi terpisah menyusul, mengikuti struktur data pada file inventory yang sama.*
