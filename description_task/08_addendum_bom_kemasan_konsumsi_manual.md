# Addendum — Struktur BOM Komponen Kemasan & Mekanisme Konsumsi Manual
## Update untuk Dokumen 02 (Master SKU) & Dokumen 04 (Produksi RAW→WIP)

> Dokumen ini **melengkapi/merevisi** struktur BOM yang sebelumnya dispesifikasikan di dokumen 02, berdasarkan struktur data aktual dari file `SISTEM_SO_BARU.xlsx` (sheet MASTER SKU & WIP) dan konfirmasi langsung dari stakeholder. Terapkan perubahan ini di atas dokumen 02 & 04, jangan bangun BOM versi lama (Komponen 1-8 generik tanpa kategori).

---

## 1. Latar Belakang Perubahan

BOM (resep) tiap SKU ternyata bukan cuma daftar bahan baku cair (RAW), tapi terdiri dari **4 kategori komponen** dengan **2 mekanisme konsumsi berbeda**: otomatis (berdasarkan rasio tetap) dan manual (berdasarkan konfirmasi pengguna saat produksi). Ini penting supaya perhitungan HPP dan stok tetap akurat untuk semua jenis komponen, bukan cuma bahan baku cair.

---

## 2. Kategori Komponen BOM

| Kategori | Contoh Kode | Satuan Dasar | Mekanisme Konsumsi |
|---|---|---|---|
| **RAW** (bahan baku cair) | SBN, PBG, PCF, PVL | Mililiter (ml) | **Otomatis, berbasis volume** — Qty terpakai = `PRODUCT SIZE (ml SKU) × Qty diproduksi/terjual` |
| **PACKING** (botol/wadah) | BTL1, FLP3, FOM3 | Pcs | **Otomatis, rasio 1:1** — 1 pcs per 1 unit produk jadi |
| **STIKER** (label per SKU) | STSBN1, STSBF3 | Pcs | **Otomatis, rasio 1:1** — 1 pcs per 1 unit produk jadi |
| **DUS** (kardus, spesifikasi ukuran beda-beda per SKU) | DUS7, DUS4, DUS1 | Pcs | **Otomatis, rasio 1:1** — 1 pcs per 1 unit produk jadi |
| **SAFETY** (segel keamanan) | SLTP, TBTL, PLWR, dst | Pcs | **CAMPURAN** — lihat bagian 3 |

**Catatan penting:** rasio 1:1 untuk Packing/Stiker/Dus sudah dikonfirmasi stakeholder tidak ada pengecualian — field Qty untuk 3 kategori ini bisa di-set default = 1 dan dikunci (tidak perlu input manual per SKU), kecuali kamu ingin tetap sediakan field-nya untuk fleksibilitas di masa depan (opsional, tidak wajib).

---

## 3. Mekanisme Konsumsi Kategori SAFETY — Otomatis vs Manual

**Dikonfirmasi khusus dari stakeholder:** dari seluruh kode di kategori Safety, **HANYA `SLTP` dan `PLWR`** yang punya mekanisme konsumsi manual. Kode Safety lainnya (mis. `TBTL`) tetap **otomatis 1:1** seperti Packing/Stiker/Dus.

| Kode Safety | Mekanisme |
|---|---|
| `SLTP` | **Manual** — lihat alur di bagian 3.1 |
| `PLWR` | **Manual** — lihat alur di bagian 3.1 |
| `TBTL` (dan kode Safety lain di luar SLTP/PLWR) | Otomatis 1:1, sama seperti Packing/Stiker/Dus |

**Alasan bisnis:** 1 unit fisik SLTP/PLWR (misal 1 gulung plastik wrap atau 1 lembar segel) bisa dipakai untuk membungkus **banyak produk** sebelum benar-benar habis. Karena itu sistem tidak bisa asumsikan "1x produksi = 1 SLTP/PLWR habis" seperti komponen lain — pengguna yang tahu kondisi fisik di lapangan harus mengonfirmasi manual.

### 3.1 Alur UI di Form "Produksi Baru" (update dokumen 04)

Saat SKU output yang dipilih memiliki komponen `SLTP` dan/atau `PLWR` di BOM-nya:

1. Komponen RAW, Packing, Stiker, Dus tetap dihitung & dikurangi **otomatis** seperti biasa (tidak perlu interaksi tambahan dari pengguna).
2. Untuk tiap komponen `SLTP`/`PLWR` yang terdaftar di BOM, tampilkan **checkbox terpisah** di form, contoh:
   - ☐ "SLTP habis, kurangi stok?"
   - ☐ "PLWR habis, kurangi stok?"
3. **Jika dicentang** → stok komponen tersebut dikurangi 1 pcs.
4. **Jika tidak dicentang** (default/tidak wajib dicentang) → stok komponen tersebut **tidak berubah sama sekali**, dianggap masih memakai unit fisik yang sama dari sesi produksi sebelumnya.
5. Checkbox ini muncul di **setiap sesi produksi baru** untuk SKU yang punya komponen SLTP/PLWR di BOM-nya — bukan cuma sekali di awal, karena pengguna perlu mengonfirmasi kondisi fisik tiap kali produksi berlangsung.

---

## 4. Update Struktur Master SKU (dokumen 02)

Tabel BOM per SKU sebaiknya disimpan dengan struktur berikut (bukan lagi "Komponen 1-8" generik tanpa makna):

| Field | Keterangan |
|---|---|
| SKU Code (output) | SKU yang didefinisikan resepnya |
| Kategori Komponen | RAW / PACKING / STIKER / DUS / SAFETY |
| Kode Komponen | Merujuk ke SKU/item lain (mis. SBN, BTL1, STSBN1, DUS4, SLTP) |
| Qty per Unit | Untuk RAW: otomatis dari Product Size SKU (ml); untuk kategori lain: default 1 |
| Tipe Konsumsi | Otomatis / Manual — default Otomatis untuk semua, KECUALI kode `SLTP` dan `PLWR` yang defaultnya Manual |

**Field baru di Master SKU (level SKU, bukan level komponen):**
- **Product Size** (angka, satuan ml) — wajib diisi untuk SKU tipe RAW & WIP/PACKAGE yang berbasis volume cair. Ini dipakai sebagai pengali otomatis di rumus konsumsi RAW (lihat bagian 2).

**Field baru di Master Item Kemasan** (kemungkinan perlu tabel/master terpisah dari Master SKU produk, karena Packing/Stiker/Safety/Dus bukan "produk jual" tapi "bahan pendukung"):
- Kode Item (mis. BTL1, STSBN1, DUS4, SLTP, PLWR)
- Nama/Deskripsi Item
- Kategori (Packing/Stiker/Safety/Dus)
- Stok saat ini
- AVG Cost per pcs (kalau memang dibeli & dicatat biayanya)

---

## 5. Dampak ke Halaman Lain (Ringkas)

- **Master SKU (02):** butuh sub-tabel/master baru untuk item kemasan (Packing/Stiker/Safety/Dus), terpisah dari daftar SKU produk RAW/WIP/PACKAGE. Builder BOM saat "Tambah SKU" perlu dropdown kategori komponen, bukan cuma 8 slot kosong generik.
- **Produksi RAW→WIP (04):** tambah checkbox manual khusus untuk komponen SLTP/PLWR sesuai bagian 3.1. Kolom "Komponen Terpakai" di tabel produksi sebaiknya menampilkan juga status kemasan mana yang dicentang habis pada sesi tersebut.
- **Dashboard Inventory (06):** pertimbangkan menambah tab/filter kategori baru untuk item kemasan (Packing/Stiker/Safety/Dus) di luar RAW/WIP/PACKAGE, supaya stok botol/stiker/dus juga bisa dipantau seperti bahan baku.
- **Pembelian RAW (03):** kalau item kemasan juga dibeli dari supplier (kemungkinan besar iya — botol, stiker, dus biasanya dibeli, bukan diproduksi sendiri), pertimbangkan apakah halaman ini di-generalisasi jadi "Pembelian Bahan & Kemasan" atau dibuatkan halaman terpisah "Pembelian Kemasan". **Ini perlu dikonfirmasi ke stakeholder** — belum ditanyakan sejauh ini.
- **Laporan & Export (07):** tambah 1 kartu ekspor baru untuk data master item kemasan & stoknya, kalau memang dipisah dari Master SKU.

---

## 6. Pertanyaan Tambahan yang Masih Perlu Dikonfirmasi ke Stakeholder

1. Apakah item kemasan (Packing/Stiker/Safety/Dus) dibeli dari supplier dan perlu dicatat transaksinya seperti Pembelian RAW, atau stoknya diinput manual/sekali di awal saja?
2. Apakah perlu notifikasi/alert kalau stok salah satu item kemasan (terutama SLTP/PLWR yang manual) menipis, supaya tidak kehabisan mendadak saat produksi?

---

*Dokumen ini melengkapi dokumen 02 & 04. Serahkan bersama paket dokumen 00–07 + addendum ini ke AI/developer pembangun.*
