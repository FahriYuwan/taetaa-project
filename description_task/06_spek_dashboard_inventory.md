# Spesifikasi Halaman — "Dashboard Inventory"
## Taetaa Company Sistem (Aplikasi Manajemen Inventory & Penjualan)

> Halaman 6 dari beberapa halaman aplikasi. Diakses dari sidebar menu "Inventory". Halaman ini adalah laporan mutasi stok terperinci per SKU — menunjukkan alur stok awal → masuk → keluar → stok akhir, hasil agregasi otomatis dari data Pembelian RAW, Produksi, dan Penjualan.

---

## 1. Konteks & Tujuan Halaman

Halaman ini adalah **kartu stok (stock card) per SKU**, mengagregasi seluruh mutasi dari 3 modul transaksi lain menjadi satu tampilan komprehensif per periode:

- **Stock Awal** — saldo stok di awal periode.
- **Masuk (Beli)** — penambahan stok dari transaksi di halaman Pembelian RAW (khusus SKU tipe RAW).
- **Masuk (Produksi)** — penambahan stok dari transaksi di halaman Produksi RAW→WIP, sebagai hasil output produksi (SKU tipe WIP/PACKAGE).
- **Keluar (Produksi)** — pengurangan stok karena dipakai sebagai komponen/bahan pada transaksi Produksi (biasanya SKU tipe RAW/WIP yang jadi komponen).
- **Keluar (Jual)** — pengurangan stok karena terjual, dari transaksi di halaman Penjualan (khusus SKU tipe PACKAGE).
- **Stock Akhir** = Stock Awal + Masuk (Beli) + Masuk (Produksi) − Keluar (Produksi) − Keluar (Jual).
- **AVG Cost** — harga rata-rata tertimbang per unit saat ini (sinkron dengan Master SKU).
- **Nilai Stock** = Stock Akhir × AVG Cost.

Halaman ini pada dasarnya adalah versi "audit trail" dari kolom STOCK & NILAI STOCK di halaman Master SKU, dipecah per jenis mutasi agar bisa ditelusuri asal setiap perubahan stok.

---

## 2. Layout Global (reuse dari halaman-halaman sebelumnya)

- Sidebar kiri identik, item **"Inventory"** dalam state **aktif** (background biru solid, teks putih bold).
- Footer sidebar & toast notifikasi dev tidak terlihat pada crop gambar ini — tetap gunakan pola yang sama dengan halaman lain untuk konsistensi (1-2 baris versi info di footer sidebar).

---

## 3. Header Halaman

- Background abu-abu sangat muda (#F5F6F8), padding ±24px, border bawah tipis.
- **Kiri:**
  - Label kecil abu-abu kapital: `TAETAA COMPANY SISTEM`
  - Judul besar bold hitam (±28px): `Dashboard Inventory`
  - Sub-judul abu-abu (±14px): `Stock awal → masuk → keluar → stock akhir per SKU. Terintegrasi dengan pembelian, produksi & penjualan.`
- **Kanan:**
  - Input pencarian dengan placeholder `Cari SKU...`, border abu-abu, rounded, lebar ±180-200px. **Catatan:** halaman ini hanya punya search box, **tidak ada** tombol Bulk Paste atau tombol tambah data (karena halaman ini murni laporan/agregasi, bukan tempat input transaksi baru).

**Perilaku:** input pencarian memfilter tabel di bagian bawah secara real-time berdasarkan kode/nama SKU.

---

## 4. Baris KPI Cards (grid 4 kolom, gap ±16px)

Card putih, border tipis abu-abu, radius ±8px, padding ±20px, shadow halus — style identik dengan KPI card di halaman Dashboard Utama.

| # | Label | Nilai Besar | Keterangan Kecil |
|---|-------|-------------|-------------------|
| 1 | NILAI TOTAL | Rp 0 | (tidak ada keterangan tambahan di bawah) |
| 2 | NILAI RAW | Rp 0 | "0 SKU" |
| 3 | NILAI WIP | Rp 0 | "0 SKU" |
| 4 | NILAI PACKAGE | Rp 0 | "0 SKU" |

**Catatan struktur:** Card pertama (`NILAI TOTAL`) tidak memiliki teks keterangan kecil di bawah nilai, sedangkan 3 card lainnya menampilkan jumlah SKU dalam kategori tersebut. `NILAI TOTAL` = penjumlahan `NILAI RAW + NILAI WIP + NILAI PACKAGE`.

---

## 5. Tab Filter Tipe SKU

Baris tab di bawah KPI cards, style pill/segmented control identik dengan tab di halaman Master SKU (tab aktif berwarna putih + shadow halus + teks bold hitam, tab non-aktif teks abu-abu tanpa background):

1. `Semua` — default aktif
2. `RAW`
3. `WIP`
4. `PACKAGE`

**Perbedaan dengan Master SKU:** tab pada halaman ini **tidak menampilkan angka counter** dalam kurung (berbeda dari tab `Semua (0)` dst di Master SKU) — hanya label teks polos.

**Perilaku:** klik tab memfilter tabel mutasi di bawah sesuai tipe SKU, tanpa reload halaman.

---

## 6. Tabel Mutasi Stok (Stock Card)

Card putih, border tipis abu-abu, radius ±8px, langsung menyatu di bawah baris tab dalam satu container yang sama (mengikuti pola tab+tabel di Master SKU).

### 6.1 Header Kolom
Baris header background abu-abu sangat muda, teks kapital kecil bold abu-abu gelap, border bawah. Ini tabel dengan kolom terbanyak kedua (10 kolom):

| Kolom | Rata | Keterangan |
|---|---|---|
| SKU | Kiri | Kode SKU |
| NAMA | Kiri | Nama deskriptif produk |
| TIPE | Kiri/Tengah | Badge kecil warna: RAW / WIP / PACKAGE (konsisten dengan badge di Master SKU) |
| STOCK AWAL | Kanan | Saldo stok di awal periode |
| MASUK (BELI) | Kanan | Total qty masuk dari Pembelian RAW pada periode ini |
| MASUK (PRODUKSI) | Kanan | Total qty masuk sebagai output Produksi pada periode ini |
| KELUAR (PRODUKSI) | Kanan | Total qty keluar karena dipakai sebagai komponen Produksi |
| KELUAR (JUAL) | Kanan | Total qty keluar karena terjual (Penjualan) |
| STOCK AKHIR | Kanan | Hasil akhir perhitungan mutasi (bold, lebih menonjol dari kolom lain) |
| AVG COST | Kanan | Harga rata-rata tertimbang per unit (Rp) |
| NILAI STOCK | Kanan | = STOCK AKHIR × AVG COST (Rp) |

### 6.2 Baris Data
- Padding vertikal ±14px per baris, border bawah tipis antar baris, hover → background abu-abu sangat muda.
- Kolom AVG COST dan NILAI STOCK memakai format Rupiah (`Rp #.###`).
- Baris dengan Stock Akhir negatif (indikasi kesalahan input/stok kurang) sebaiknya ditandai warna merah sebagai warning, meski tidak terlihat pada gambar.

### 6.3 Empty State (kondisi saat ini di gambar)
Ketika belum ada data mutasi:
- Baris kosong dengan padding vertikal besar.
- Teks di tengah, warna biru (konsisten dengan pola empty state umum):
  `Tidak ada data.`

---

## 7. Perbedaan Kunci vs Halaman Lain (catatan untuk AI pembangun)

1. Halaman ini **read-only/laporan** — tidak ada tombol untuk menambah transaksi baru (tidak ada "+Tambah", tidak ada "Bulk Paste"). Semua data berasal dari agregasi otomatis 3 modul transaksi lain (Pembelian RAW, Produksi, Penjualan).
2. Header kanan hanya berisi 1 elemen (search box), lebih sederhana dari halaman transaksional lainnya.
3. KPI card pertama (`NILAI TOTAL`) tidak punya keterangan tambahan, sedangkan 3 lainnya punya "X SKU".
4. Tab filter di halaman ini tidak memakai counter angka seperti di Master SKU.
5. Tabel di halaman ini fokus pada **mutasi/pergerakan** stok (5 kolom pergerakan: stock awal, 2 kolom masuk, 2 kolom keluar, stock akhir) — berbeda dari tabel Master SKU yang hanya menampilkan snapshot stok saat ini.

---

## 8. Gaya Visual (Design Tokens)

Konsisten dengan halaman-halaman sebelumnya:
- Font sans-serif modern.
- Background halaman: `#F5F6F8`
- Card/tabel: putih `#FFFFFF`, border `#E5E7EB`, radius `8px`
- Input pencarian: border abu-abu `#D1D5DB`, background putih, rounded
- Tab aktif: putih dengan shadow halus; tab non-aktif: transparan, teks abu-abu `#6B7280`
- Header kolom tabel: teks kapital kecil `#6B7280`
- Empty-state text: biru `#2563EB`
- Nilai KPI besar: hitam/biru tua bold (±22-24px), label kecil kapital abu-abu di atasnya

## 9. Interaktivitas Ringkas

1. Input `Cari SKU...` → filter tabel real-time.
2. Tab `Semua / RAW / WIP / PACKAGE` → filter tabel berdasarkan tipe SKU.
3. Seluruh KPI card dan tabel bersifat **otomatis terhitung** dari data transaksi di modul lain — tidak ada input manual di halaman ini.
4. (Opsional, jika diperlukan) filter rentang tanggal periode laporan, agar konsisten dengan filter DARI–SAMPAI di halaman Dashboard Utama — belum terlihat di gambar namun relevan mengingat sub-judul menyebut "per periode".

---

*Dokumen ini adalah spesifikasi halaman "Dashboard Inventory". Lanjutkan ke halaman terakhir sesuai urutan sidebar: Laporan & Export.*
