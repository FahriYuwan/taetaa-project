# 0001. Two-Phase Marketplace Reconciliation & Discrepancy Handling

Pencatatan penjualan marketplace dibagi menjadi dua fase independen pada entitas `Sale` yang sama: fase fisik gudang (Logistics Scan) yang memotong stok, dan fase finansial (Finance Settlement) yang mengisi nilai omset dan laba.

## Context

Tim logistik memindai barcode fisik paket pesanan sebelum kurir pickup, namun tidak mengetahui harga jual maupun potongan platform fee. Sebaliknya, tim finance mengunduh laporan pencairan dana berkala dari marketplace beberapa hari kemudian.

Jika nomor resi berganti saat transit atau terjadi selisih kuantitas antara laporan marketplace dengan pemindaian fisik gudang, pemotongan stok otomatis secara sepihak akan merusak akurasi kartu persediaan fisik gudang.

## Decision

1. **Single-Record Lifecycle**: Satu baris entitas `Sale` mewakili satu transaksi yang diisi bertahap:
   - Tahap 1: Logistik membuat `Sale` (`scannedByLogistic = true, financeMatched = false`) dan langsung memotong stok fisik.
   - Tahap 2: Finance mencocokkan baris tersebut via Bulk Paste (`financeMatched = true`) untuk mengisi harga, voucher, dan fee.
2. **Kuantitas Gudang Sebagai Fakta Fisik (Discrepancy Flagging)**: Jika kuantitas pada laporan Finance berbeda dengan hasil scan Logistik, sistem **tidak boleh** langsung memotong atau mengembalikan stok secara otomatis. Sistem menandai status `Selisih Qty` agar dikonfirmasi oleh manusia terlebih dahulu.
3. **Penyelarasan Resi Manual (Manual Matching)**: Disediakan antarmuka bagi Finance untuk menautkan nomor resi logistik yang belum cocok ke nomor resi finance baru tanpa menduplikasi pemotongan persediaan.
4. **Edit Terisolasi untuk Finansial**: Fitur edit pasca-rekonsiliasi hanya mengizinkan modifikasi nominal uang (Harga, Voucher, Diskon, Fee) dan mengunci SKU serta Qty guna melindungi integritas kartu persediaan.
5. **Dua Identitas Transaksi (Order Code vs Nomor Resi)**: Format impor rekonsiliasi finance menggunakan format 16 kolom dengan memisahkan `ORDER CODE` (nomor pesanan platform, col 2) dan `NO RESI` (nomor tracking ekspedisi, col 3) untuk mencegah ketertukaran antara barcode fisik scan logistik dengan nomor order marketplace.
