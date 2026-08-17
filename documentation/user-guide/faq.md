# Pertanyaan Sering Diajukan (FAQ)

## Umum
**Q: Kenapa angka di Dashboard tidak langsung update?**
A: Dashboard ditarik berdasarkan rentang tanggal. Pastikan Anda telah mengatur filter tanggal di pojok kanan atas Dashboard untuk mencakup hari ini.

**Q: Apakah sistem ini butuh koneksi internet?**
A: Ya, karena database disimpan di server pusat agar data sinkron antar pengguna.

## Stok & Produksi
**Q: Kenapa saya tidak bisa menyimpan produksi (tombol simpan merah/error)?**
A: Kemungkinan stok bahan baku (RAW) Anda tidak mencukupi resep yang sudah ditentukan di Master SKU. Silakan cek menu "Pembelian RAW" untuk memastikan stok bahan baku sudah masuk sistem.

**Q: Apa bedanya WIP dan PACKAGE?**
A: **WIP** adalah barang setengah jadi yang belum Anda jual ke customer (misal: adonan sabun). **PACKAGE** adalah produk final yang sudah siap dikirim (misal: sabun lavender 100gr yang sudah dibungkus).

**Q: Bagaimana cara mengoreksi stok kalau ada barang rusak/hilang?**
A: Saat ini sistem belum memiliki menu khusus "Koreksi Stok". Jika ada barang hilang, Anda bisa mencatatnya sementara di menu Penjualan dengan channel "OFFLINE", Qty sejumlah barang hilang, dan harga Rp 0 dengan catatan "Barang Rusak".

## HPP & Laba
**Q: Kenapa laba saya terlihat minus (merah)?**
A: Ini terjadi jika **Pendapatan Bersih** (setelah potong biaya admin) lebih kecil daripada **HPP** (modal bahan baku). Segera cek apakah harga jual Anda terlalu rendah atau biaya admin marketplace terlalu tinggi.

**Q: Dari mana sistem tahu harga modal saya?**
A: Sistem menghitung modal dari riwayat belanja yang Anda input di "Pembelian RAW". Jika Anda tidak pernah input harga beli, maka modal akan dianggap Rp 0.

## Teknis
**Q: Bisakah saya membatalkan transaksi yang salah input?**
A: Saat ini Anda dapat menghapus data yang salah input di tabel masing-masing menu (klik ikon tong sampah) dan menginput ulang data yang benar.
