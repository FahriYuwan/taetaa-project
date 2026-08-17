# Panduan: Dashboard Inventory (Riwayat Stok)

Dashboard Inventory adalah "Kartu Stok" otomatis Anda. Di sini Anda tidak menginput data, melainkan mengawasi pergerakan stok dari transaksi yang sudah Anda buat di menu lain.

## Memahami Tabel Mutasi
Tabel ini merinci alur barang dari awal sampai akhir:
- **STOCK AWAL**: Berapa stok Anda sebelum tanggal yang dipilih.
- **MASUK (BELI)**: Barang yang datang dari supplier (Menu Pembelian).
- **MASUK (PROD)**: Barang yang dihasilkan dari dapur produksi (Menu Produksi).
- **KELUAR (PROD)**: Bahan baku yang dipakai untuk memproduksi (Menu Produksi).
- **KELUAR (JUAL)**: Barang yang dikirim ke pembeli (Menu Penjualan).
- **STOCK AKHIR**: Sisa stok Anda saat ini di gudang.

## Cara Melakukan Audit Stok
Jika stok di aplikasi berbeda dengan stok fisik di gudang:
1. Cari SKU tersebut menggunakan kotak **Cari SKU...**.
2. Atur rentang tanggal untuk melihat kapan perbedaan itu terjadi.
3. Perhatikan kolom Keluar/Masuk. Anda bisa mencocokkan angka tersebut dengan nota fisik atau log harian gudang Anda.

## Peringatan Stok Minus
Jika angka di kolom **STOCK AKHIR** berwarna **merah**, artinya ada transaksi yang membuat stok Anda di bawah nol (misal: Anda mencatat terjual 10 padahal stok di sistem hanya 5). Segera cek riwayat pembelian atau produksi barang tersebut.
