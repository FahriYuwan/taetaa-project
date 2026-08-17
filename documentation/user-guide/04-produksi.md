# Panduan: Produksi (Konversi Stok)

Halaman ini digunakan untuk mencatat setiap kali Anda melakukan proses produksi. Mencatat produksi akan memotong stok bahan baku dan menambah stok produk jadi secara otomatis.

## Cara Mencatat Produksi Baru
1. Klik tombol **Produksi Baru**.
2. Pilih **Tanggal** Anda memproduksi.
3. Pilih **SKU Output** (Produk apa yang Anda buat hari ini? misal: Sabun Lavender).
4. Masukkan **Qty Output** (Berapa banyak yang berhasil Anda buat? misal: 20 batang).
5. Perhatikan panel di sebelah kanan. Sistem akan menampilkan **Estimasi Penggunaan Komponen**. Ini adalah daftar bahan yang akan berkurang dari stok Anda berdasarkan resep (BOM).
6. Klik **Simpan Produksi**.

## Validasi Stok
Sistem memiliki fitur keamanan: **Anda tidak bisa menyimpan produksi jika stok bahan baku tidak cukup**.
- Contoh: Jika resep butuh 10 botol minyak tapi stok di gudang sisa 2, tombol simpan tidak akan bisa diklik atau akan muncul pesan error. Pastikan stok bahan baku sudah diinput di menu "Pembelian RAW" sebelum mulai produksi.

## Efek Produksi
Setelah Anda menekan Simpan:
- Stok Bahan Baku (Minyak, dll) berkurang.
- Stok Produk Jadi (Sabun, dll) bertambah.
- Biaya pembuatan produk akan dihitung dari total harga bahan yang dipakai, sehingga Anda tahu persis modal (HPP) produk tersebut.
