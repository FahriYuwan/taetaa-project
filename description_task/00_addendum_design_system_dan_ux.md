# Addendum — Design System (Brand Taetaa) & Rekomendasi Perbaikan UX
## Berlaku untuk seluruh 7 halaman (dokumen 01–07)

> Dokumen ini **menggantikan/menimpa bagian "Gaya Visual (Design Tokens)"** di ketujuh dokumen spesifikasi sebelumnya (01_dashboard_utama hingga 07_laporan_export). Instruksikan ke AI pembangun: gunakan palet & pedoman di dokumen ini sebagai satu-satunya sumber kebenaran (single source of truth) untuk warna, dan terapkan poin-poin perbaikan UX pada bagian 2 ke halaman terkait masing-masing.

---

## 1. Design System Baru — Diturunkan dari Logo Taetaa

### 1.1 Analisis Logo
Logo Taetaa berbentuk piramida/segitiga geometris yang tersusun dari 3 lapisan trapesium bertumpuk (mirip anak tangga), dengan celah putih tipis antar lapisan yang membentuk siluet negative-space menyerupai huruf "Z". Gradasi warna dari biru muda cerah (bagian atas/puncak) ke biru tua lebih dalam (bagian bawah/alas). Gaya flat/geometric modern, tidak ada bayangan realistis — cocok dipakai sebagai dasar palet UI yang bersih dan profesional.

### 1.2 Palet Warna Utama (menggantikan `#2563EB` dkk di dokumen sebelumnya)

| Token | Hex | Kegunaan |
|---|---|---|
| `--brand-500` (primer) | `#1E88E5` | Warna utama brand — tombol primer, item sidebar aktif, angka penting (Pendapatan) |
| `--brand-400` (aksen terang) | `#4FC3F7` | Gradasi/hover state, highlight sekunder, elemen dekoratif |
| `--brand-700` (biru tua/gelap) | `#1257A6` | Teks di atas background terang yang butuh kontras lebih, state pressed/active tombol |
| `--brand-gradient` | `linear-gradient(135deg, #4FC3F7 0%, #1E88E5 55%, #1257A6 100%)` | Dipakai terbatas: header sidebar/logo container, ikon brand, aksen dekoratif kecil (bukan untuk background luas card/halaman agar tetap clean) |

### 1.3 Warna Semantik (tetap dipertahankan dari sebelumnya, hanya biru brand yang diganti)

| Token | Hex | Kegunaan |
|---|---|---|
| `--warning-orange` | `#F97316` | HPP/COGS, indikator biaya |
| `--danger-red` | `#EF4444` | Laba negatif, stok minus, validasi error, hapus |
| `--success-green` | `#10B981` | Laba positif, konfirmasi berhasil, badge status aman |
| `--neutral-bg` | `#F5F6F8` | Background halaman |
| `--neutral-card` | `#FFFFFF` | Background card |
| `--neutral-border` | `#E5E7EB` | Border card & tabel |
| `--neutral-text-muted` | `#6B7280` | Label kecil, teks sekunder |
| `--neutral-text-strong` | `#111827` | Judul, teks utama |

### 1.4 Penerapan ke Elemen Sidebar

- **Kotak ikon brand di pojok kiri atas sidebar**: ganti dari kotak biru solid + ikon sparkle putih, menjadi kotak dengan `--brand-gradient` sebagai background, berisi **logo piramida Taetaa yang disederhanakan** (versi monokrom putih atau versi mini penuh warna di atas gradient) — konsisten dengan identitas asli, bukan ikon generik.
- **Item menu sidebar aktif**: background `--brand-500` solid (bukan gradient penuh, agar tetap terbaca jelas & tidak ramai), teks putih bold.
- **Hover state item sidebar non-aktif**: background `--brand-400` dengan opacity rendah (±8-10%), bukan abu-abu netral — supaya nuansa brand tetap terasa di seluruh interaksi, bukan cuma di elemen aktif.

### 1.5 Penerapan ke Tombol

- **Tombol primer** (Tambah SKU, Catat Pembelian, Produksi Baru, Catat Penjualan, Download CSV, dll): background `--brand-500`, hover → `--brand-700`, teks putih bold. Opsional: tambahkan gradasi tipis `--brand-gradient` khusus pada tombol CTA paling utama di tiap halaman (1 tombol saja per halaman) agar terasa premium tanpa berlebihan.
- **Tombol sekunder** (Bulk Paste): tetap outline netral, tapi border hover berubah jadi `--brand-400` agar tetap terasa terhubung dengan brand saat interaksi.

### 1.6 Penerapan ke KPI Card & Chart

- Angka besar KPI "Pendapatan Bersih", nilai biru pada card ringkasan (Total Pembelian, dsb) → pakai `--brand-500`.
- Chart time series (Pendapatan vs HPP vs Laba di Dashboard Utama): garis Pendapatan pakai `--brand-500`, HPP tetap oranye, Laba tetap merah/hijau sesuai nilai.
- Donut chart "Alokasi Nilai Inventory": ganti 1 dari 3 warna kategori (mis. PACKAGE) menjadi `--brand-500` agar chart terasa senada dengan brand, 2 kategori lain tetap warna kontras (oranye & biru muda `--brand-400`) supaya tetap mudah dibedakan.

---

## 2. Rekomendasi Perbaikan UX (Berlaku Lintas Halaman)

Ini adalah penyempurnaan yang secara teori/best-practice akan membuat sistem lebih mudah & aman dipakai, di luar apa yang terlihat di gambar asli. Sifatnya **rekomendasi tambahan**, bukan pengganti struktur yang sudah dispesifikasikan — AI pembangun bisa menerapkan semua atau memilih prioritas sesuai waktu yang tersedia.

### 2.1 Umpan Balik Aksi (Feedback)
- **Toast konfirmasi** setiap kali simpan/hapus berhasil (mis. "SKU berhasil ditambahkan", "Pembelian tersimpan") — saat ini di gambar tidak terlihat ada notifikasi ini; tanpanya, pengguna tidak yakin aksinya berhasil atau tidak.
- **Konfirmasi sebelum hapus** (dialog "Yakin ingin menghapus SKU ini? Aksi tidak bisa dibatalkan") untuk semua ikon Hapus di tabel manapun — mencegah kehilangan data karena salah klik.
- **Loading state** (skeleton row / spinner) saat data sedang dimuat atau form sedang menyimpan, terutama untuk kalkulasi otomatis (HPP, stok) yang butuh proses di backend.

### 2.2 Pencegahan Kesalahan Input (Validasi)
- **Validasi stok real-time** di form Produksi & Penjualan: tampilkan warning inline (bukan cuma disabled tombol Simpan) jika stok komponen/SKU tidak cukup, lengkap dengan angka "Stok tersedia: X, dibutuhkan: Y" agar pengguna paham kenapa gagal.
- **Format angka otomatis** pada semua input Rupiah (mis. mengetik "50000" otomatis tampil "Rp 50.000" saat blur) — mengurangi salah baca/salah input nominal besar.
- **Konsistensi satuan tanggal**: pastikan format tanggal (DD/MM/YYYY) sama persis di semua halaman (Dashboard, Laporan & Export sudah konsisten di gambar; pertahankan ini di seluruh form input tanggal lain seperti Pembelian, Produksi, Penjualan).

### 2.3 Efisiensi Kerja Harian
- **Sorting kolom tabel** (klik header untuk urutkan naik/turun) — berguna terutama di tabel Penjualan & Inventory yang berpotensi berisi ratusan baris.
- **Pagination atau infinite scroll** untuk tabel yang datanya sudah banyak, agar halaman tidak lambat saat data bertambah seiring waktu (tidak terlihat kebutuhan ini sekarang karena semua tabel masih kosong, tapi wajib diantisipasi sejak awal desain database/frontend).
- **Auto-fill harga jual/harga satuan** dari Master SKU saat SKU dipilih di form Pembelian/Penjualan (sudah disebutkan di dokumen sebelumnya) — tetap izinkan diedit manual untuk kasus harga berubah.
- **Sticky table header** saat scroll ke bawah pada tabel panjang, supaya nama kolom tetap terlihat.

### 2.4 Mencegah Kehilangan Data Fisik vs Sistem
- Berdasarkan pola data sumber (ada kolom "SELISIH" yang mengindikasikan kebiasaan cross-check manual stok fisik vs sistem), disarankan menambahkan **fitur "Stock Opname / Penyesuaian Manual"** — form sederhana untuk mengoreksi selisih stok fisik dengan catatan alasan (rusak, hilang, salah hitung), yang otomatis tercatat sebagai mutasi di Dashboard Inventory. Ini mengeliminasi kebutuhan cross-check manual di luar sistem.

### 2.5 Aksesibilitas & Responsif
- Pastikan kontras warna teks label kecil abu-abu (`#6B7280`/`#9CA3AF`) di atas background `#F5F6F8` tetap memenuhi standar keterbacaan (WCAG AA) — dua warna abu-abu ini cukup terang, disarankan tes kontras sebelum finalisasi.
- Tabel dengan banyak kolom (Penjualan: 10 kolom, Inventory: 11 kolom) perlu **scroll horizontal dengan indikator visual** (shadow tipis di tepi) pada layar sempit/tablet, bukan kolom yang terpotong tanpa tanda.
- Kartu KPI & grid kartu ekspor perlu breakpoint responsif jelas: 4 kolom → 2 kolom → 1 kolom mengikuti lebar layar, sudah disebutkan di dokumen Dashboard Utama, pastikan diterapkan konsisten di semua grid card lain (Inventory, Laporan & Export).

### 2.6 Transparansi Sistem (Menghilangkan Elemen Dev yang Ditemukan Berulang)
- Toast "Frontend Preview Only. Please wake servers..." yang muncul di beberapa halaman sebelumnya dipastikan **dihapus di versi produksi final** — ini murni indikator development/idle-server, bukan bagian UX yang seharusnya dilihat pengguna akhir.

---

## 3. Catatan Implementasi untuk AI Pembangun

- Terapkan palet di bagian 1 secara global (design tokens/CSS variables), gantikan seluruh referensi warna biru `#2563EB` di dokumen 01–07 dengan token brand baru ini.
- Perbaikan UX di bagian 2 bersifat **enhancement**, tetap pertahankan seluruh struktur layout, komponen, dan urutan elemen yang sudah dirinci di dokumen 01–07 — dokumen ini hanya menambah kualitas interaksi & visual, bukan mengubah arsitektur informasi yang sudah ditetapkan.
- Jika ada keterbatasan waktu/scope, prioritaskan: (1) toast konfirmasi & konfirmasi hapus, (2) validasi stok real-time, (3) palet warna brand baru — tiga hal ini paling berdampak langsung ke kepercayaan pengguna terhadap sistem.

---

*Dokumen ini melengkapi dokumen 01–07. Serahkan seluruh 8 dokumen (00 addendum ini + 01–07) sebagai satu paket spesifikasi ke AI/developer pembangun.*
