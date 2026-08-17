# Panduan: Laporan & Export CSV

Gunakan halaman ini jika Anda ingin menarik data mentah dari sistem untuk dipindahkan ke program lain seperti Microsoft Excel atau Google Sheets.

## Jenis Laporan

### 1. Berdasarkan Periode
Laporan ini akan mengambil data hanya dalam rentang waktu yang Anda pilih di filter tanggal atas.
- **Penjualan**: Rekap transaksi, potongan biaya, dan laba.
- **Pembelian RAW**: Rekap belanja bahan baku ke supplier.
- **Produksi**: Riwayat aktivitas konversi barang.

### 2. Snapshot (Kondisi Saat Ini)
Laporan ini mengabaikan filter tanggal dan selalu mengambil data terbaru saat ini.
- **Inventory**: Ringkasan stok akhir dan nilai uang dari seluruh barang.
- **Master SKU**: Daftar identitas produk beserta resep (BOM)-nya.

## Cara Mengunduh Laporan
1. Atur rentang tanggal di pojok kanan atas (hanya jika Anda ingin mengunduh laporan periode).
2. Klik tombol **Download CSV** pada kartu laporan yang Anda inginkan.
3. File akan otomatis tersimpan di perangkat Anda.
4. Buka file tersebut menggunakan Excel atau Google Sheets untuk analisis lebih lanjut.

## Tips Membuka CSV di Excel
Beberapa versi Excel mungkin menampilkan data dalam satu kolom panjang. Jika itu terjadi:
1. Blok kolom A.
2. Klik menu **Data** -> **Text to Columns**.
3. Pilih **Delimited** -> Next.
4. Centang **Comma** (atau Tab) -> Finish.
5. Data akan terbagi rapi ke dalam kolom-kolom.
