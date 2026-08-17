# Panduan: Master SKU (Katalog Produk)

Master SKU adalah tempat Anda mendaftarkan "KTP" setiap barang yang ada di Taetaa. Anda wajib mendaftarkan barang di sini sebelum bisa mencatat transaksi lainnya.

## Tipe-Tipe Produk
1. **RAW (Bahan Baku)**: Barang yang Anda beli dari supplier dan tidak Anda jual langsung (contoh: Minyak, Pewangi, NaOH).
2. **WIP (Setengah Jadi)**: Produk yang sudah diolah tapi masih butuh proses lanjutan (contoh: Base sabun yang belum dipotong).
3. **PACKAGE (Produk Jadi)**: Barang yang siap dikirim ke customer (contoh: Sabun Batang Lavender 100gr).

## Cara Menambah SKU Baru
1. Klik tombol **Tambah SKU**.
2. Masukkan **Kode SKU** (contoh: `RAW-OIL-01`). Gunakan kode yang unik dan mudah diingat.
3. Masukkan **Nama Produk**.
4. Pilih **Tipe SKU**.
5. Jika tipenya adalah **PACKAGE**, masukkan harga jual normal Anda di marketplace.
6. Klik **Simpan**.

## Cara Mengelola BOM (Resep)
BOM (Bill of Materials) adalah daftar bahan yang dibutuhkan untuk membuat 1 unit produk.
1. Saat menambah/mengubah SKU tipe **WIP** atau **PACKAGE**, akan muncul kolom "Komponen BOM".
2. Pilih bahan bakunya (hanya bahan tipe RAW/WIP yang muncul).
3. Masukkan jumlah yang dibutuhkan untuk 1 produk (contoh: 0.5 unit minyak untuk 1 sabun).
4. Klik **Add**.
5. Anda bisa menambahkan banyak bahan sekaligus. Sistem akan menggunakan daftar ini untuk memotong stok otomatis saat Anda mencatat produksi.

## Fitur Bulk Paste
Jika Anda punya ratusan data di Excel, Anda tidak perlu input satu-satu.
1. Klik **Bulk Paste**.
2. Salin data dari Excel sesuai format: `KODE [TAB] NAMA [TAB] TIPE [TAB] HARGA`.
3. Tempel di kotak yang tersedia dan klik **Impor Sekarang**.
