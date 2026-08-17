# Spesifikasi Halaman — "Master SKU"
## Taetaa Company Sistem (Aplikasi Manajemen Inventory & Penjualan)

> Halaman 2 dari beberapa halaman aplikasi. Diakses dari sidebar menu "Master SKU". Halaman ini adalah pusat data produk: mendaftarkan semua kode produk (SKU) beserta tipe dan resep/komposisinya (BOM).

---

## 1. Konteks & Tujuan Halaman

Halaman ini adalah CRUD (Create/Read/Update/Delete) untuk **Master SKU** — daftar induk semua kode produk yang dipakai di seluruh sistem (Pembelian, Produksi, Penjualan, Inventory). Setiap SKU punya salah satu dari 3 tipe:

- **RAW** — bahan baku mentah (mis. sabun cair curah, parfum, botol kosong). Berasal dari sheet `RAW`.
- **WIP** (Work In Progress) — barang setengah jadi hasil produksi dari RAW, belum dikemas final.
- **PACKAGE** — produk jadi siap jual, hasil rakitan dari beberapa komponen RAW/WIP sesuai resep (Bill of Materials / BOM). Berasal dari sheet `PACKAGE` (kolom KOMPONEN 1–8 + QTY masing-masing, plus PLASTIK LUAR).

Struktur BOM di data sumber: setiap SKU PACKAGE punya hingga 8 slot komponen, masing-masing merujuk ke SKU RAW/WIP lain beserta quantity yang dibutuhkan untuk membuat 1 unit SKU tersebut. Sistem ini yang jadi basis perhitungan HPP (COGS) weighted average di halaman Dashboard.

---

## 2. Layout Global (sama seperti halaman Dashboard — reuse)

- Sidebar kiri identik dengan spesifikasi Dashboard (lihat dokumen halaman 1), namun sekarang item **"Master SKU"** dalam state **aktif** (background biru solid, teks putih bold), dan item "Dashboard" kembali ke state non-aktif.
- Catatan kecil: pada gambar, item "Produksi (RAW→WIP)" tampak berwarna biru/teks link — kemungkinan hover state atau sekadar variasi rendering, bukan navigasi aktif. Perlakukan seperti item non-aktif standar kecuali ada instruksi lain.

---

## 3. Header Halaman

- Background abu-abu sangat muda (#F5F6F8), padding ±24px, border bawah tipis.
- **Kiri:**
  - Label kecil abu-abu kapital: `TAETAA COMPANY SISTEM`
  - Judul besar bold hitam (±28px): `Master SKU`
  - Sub-judul abu-abu (±14px): `Kelola daftar produk RAW, WIP, dan PACKAGE beserta BOM`
- **Kanan** (align kanan, sejajar horizontal, gap ±10-12px):
  - Input pencarian dengan ikon kaca pembesar di kiri, placeholder: `Cari SKU / Nama...`, lebar ±220px, border abu-abu, rounded.
  - Tombol `Bulk Paste` — outline/border abu-abu, background putih, ikon paste/upload kecil di kiri teks.
  - Tombol `+ Tambah SKU` — solid biru (#2563EB), teks putih, ikon plus di kiri teks, menjadi CTA utama halaman (paling menonjol).

**Perilaku:**
- Input pencarian memfilter tabel secara real-time berdasarkan SKU Code atau Nama.
- `Bulk Paste` membuka modal/dialog untuk tempel data massal (misal dari Excel/clipboard, format tab-separated) untuk menambah banyak SKU sekaligus.
- `+ Tambah SKU` membuka form/modal untuk menambah 1 SKU baru (lihat bagian 6).

---

## 4. Tab Filter Tipe SKU

Baris tab di bawah header, di dalam card/container dengan padding ±16px:

- Tab berbentuk pill/segmented control, container abu-abu muda dengan tab aktif berwarna putih + shadow halus + teks bold hitam; tab non-aktif teks abu-abu tanpa background.
- 4 tab, masing-masing menampilkan **jumlah SKU dalam kurung** yang otomatis mengikuti data:
  1. `Semua (0)` — default aktif, menampilkan semua tipe.
  2. `RAW (0)` — hanya SKU tipe RAW.
  3. `WIP (0)` — hanya SKU tipe WIP.
  4. `PACKAGE (0)` — hanya SKU tipe PACKAGE.

**Perilaku:** klik salah satu tab memfilter tabel di bawah tanpa reload halaman; angka di dalam kurung update otomatis setiap kali ada perubahan data (tambah/hapus SKU).

---

## 5. Tabel Daftar SKU

Card putih, border tipis abu-abu, radius ±8px, menyatu langsung di bawah baris tab (tab dan tabel berada dalam satu card besar yang sama).

### 5.1 Header Kolom
Baris header dengan background sedikit abu-abu, teks kapital kecil bold abu-abu gelap, border bawah:

| Kolom | Rata | Keterangan |
|---|---|---|
| SKU CODE | Kiri | Kode unik SKU, mis. `SBN20` |
| NAMA | Kiri | Nama deskriptif produk, mis. "Sabun 20 Liter" |
| TIPE | Kiri/Tengah | Badge kecil berwarna: RAW / WIP / PACKAGE (tiap tipe warna beda, mis. RAW=abu, WIP=kuning, PACKAGE=biru/hijau) |
| STOCK | Kanan | Jumlah stok saat ini (angka, satuan unit) |
| AVG COST | Kanan | Harga rata-rata tertimbang per unit (Rp) — dihitung sistem otomatis dari histori pembelian & produksi |
| HARGA JUAL | Kanan | Harga jual per unit (Rp), hanya relevan untuk tipe PACKAGE |
| NILAI STOCK | Kanan | = STOCK × AVG COST (Rp) |
| BOM | Kiri/Tengah | Tombol/link kecil untuk melihat atau mengedit komposisi bahan (hanya muncul/aktif untuk tipe WIP & PACKAGE) |
| AKSI | Kanan | Ikon aksi: Edit (pensil), Hapus (tempat sampah), mungkin Duplikat |

### 5.2 Baris Data
- Setiap baris SKU ditampilkan dengan padding vertikal ±14px, border bawah tipis antar baris, hover memunculkan background abu-abu sangat muda.
- Kolom AVG COST, HARGA JUAL, NILAI STOCK memakai format Rupiah (`Rp #.###`).
- Kolom BOM: untuk SKU tipe PACKAGE/WIP menampilkan tombol kecil "Lihat BOM" yang membuka panel/modal berisi daftar komponen (dari resep KOMPONEN 1–8 + qty + PLASTIK LUAR) dan tombol edit resep tersebut. Untuk tipe RAW, kolom ini kosong/strip (–) karena RAW tidak punya resep.

### 5.3 Empty State (kondisi saat ini di gambar)
Ketika tabel kosong (belum ada SKU sama sekali):
- Baris kosong dengan tinggi cukup besar (±60px padding vertikal).
- Teks di tengah, warna biru (mirip link), ukuran normal:
  `Tidak ada SKU. Klik "Tambah SKU" atau "Seed Contoh" di Dashboard.`
- Bagian `"Tambah SKU"` dan `"Seed Contoh"` bisa berupa link/teks yang mengarahkan user langsung ke aksi tersebut (klik untuk membuka modal Tambah SKU, atau untuk `Seed Contoh` mengarahkan ke halaman Dashboard).

---

## 6. Modal/Form "Tambah SKU" (dipicu tombol `+ Tambah SKU`)

*(Tidak terlihat di gambar, disusun berdasarkan konteks data agar konsisten — tandai sebagai asumsi ke AI pembangun)*

Field yang disarankan:
- SKU Code (text, wajib, unik)
- Nama/Details (text, wajib)
- Tipe (select: RAW / WIP / PACKAGE)
- Jika Tipe = PACKAGE atau WIP: builder BOM dinamis — tambah baris komponen (pilih SKU dari dropdown existing SKU + input qty), maksimal mengikuti struktur sumber data (hingga 8 komponen + 1 baris khusus "Plastik Luar")
- Harga Jual (khusus PACKAGE, angka Rupiah)
- Stock Awal (angka, opsional)
- Tombol `Batal` (outline) dan `Simpan` (solid biru)

---

## 7. Gaya Visual (Design Tokens)

Mengikuti token yang sama dengan halaman Dashboard:
- Font sans-serif modern.
- Background halaman: `#F5F6F8`
- Card/tabel: putih `#FFFFFF`, border `#E5E7EB`, radius `8px`
- Tombol primer (Tambah SKU): biru `#2563EB`, teks putih
- Tombol sekunder (Bulk Paste): outline abu-abu `#D1D5DB`, teks `#374151`
- Tab aktif: putih dengan shadow halus; tab non-aktif: transparan, teks abu-abu `#6B7280`
- Header kolom tabel: teks kapital kecil `#6B7280`, letter-spacing sedikit lebar
- Badge tipe SKU: pill kecil rounded-full, warna berbeda tiap tipe (disarankan RAW=abu netral, WIP=kuning/amber, PACKAGE=biru/hijau)
- Link/empty-state text: biru `#2563EB`

## 8. Interaktivitas Ringkas

1. Pencarian real-time via input `Cari SKU / Nama...`.
2. Filter tab (Semua/RAW/WIP/PACKAGE) dengan counter otomatis.
3. `+ Tambah SKU` → buka modal form tambah SKU baru (dengan builder BOM jika tipe WIP/PACKAGE).
4. `Bulk Paste` → buka modal tempel data massal.
5. Tombol "Lihat BOM" per baris → buka detail/edit resep komponen.
6. Ikon Edit/Hapus per baris → edit data SKU / konfirmasi hapus SKU.
7. Semua perubahan pada halaman ini (tambah/edit/hapus SKU & BOM) menjadi sumber data yang dipakai untuk kalkulasi HPP, stok, dan laporan di halaman-halaman lain (Pembelian RAW, Produksi, Penjualan, Inventory, Dashboard).

---

*Dokumen ini adalah spesifikasi halaman "Master SKU". Lanjutkan ke halaman berikutnya sesuai urutan sidebar: Pembelian RAW, Produksi (RAW→WIP), Penjualan, Inventory, Laporan & Export.*
