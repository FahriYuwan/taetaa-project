# Taetaa Inventory & Marketplace

Sistem manajemen inventaris manufaktur dan rekonsiliasi penjualan marketplace multi-channel (Shopee, TikTok Shop, Tokopedia).

## Language

**Logistics Scan**:
Pencatatan fisik paket di gudang menggunakan barcode scanner yang langsung memotong stok persediaan barang (`Inventory Movement`), tanpa membawa data harga atau potongan biaya platform.
_Avoid_: Input penjualan, order entry, kasir

**Finance Settlement**:
Data pencairan dana dan biaya yang diimpor dari laporan marketplace (Excel/Spreadsheet) untuk melengkapi nilai finansial pesanan.
_Avoid_: Laporan penjualan, upload invoice

**Reconciliation (Matching)**:
Proses penyelarasan otomatis atau manual antara catatan fisik `Logistics Scan` dengan laporan `Finance Settlement` berdasarkan Channel, Nomor Resi, dan Kode SKU.
_Avoid_: Verifikasi, sinkronisasi, validasi

**Discrepancy (Selisih)**:
Kondisi di mana data `Finance Settlement` tidak identik dengan data `Logistics Scan` (misalnya nomor resi berbeda akibat kurir, atau selisih kuantitas barang).
_Avoid_: Error, data rusak, bug

**Order Code (Nomor Pesanan)**:
Pengenal unik transaksi pesanan yang diterbitkan oleh platform marketplace (contoh: nomor pesanan Shopee atau TikTok Shop).
_Avoid_: No resi, tracking ID, invoice number

**Nomor Resi (Tracking Number / AWB)**:
Nomor identifikasi fisik paket pengiriman yang diterbitkan oleh pihak ekspedisi kurir (contoh: SPX, J&T, SiCepat) dan dicetak sebagai barcode pada label paket untuk dipindai oleh logistik.
_Avoid_: Order ID, nomor pesanan, kode barcode

**Sale Record**:
Entitas tunggal dalam basis data yang merepresentasikan satu baris transaksi penjualan, yang berevolusi dari draf logistik (`scannedByLogistic = true, financeMatched = false`) menjadi transaksi lengkap terrekonsiliasi (`financeMatched = true`).
_Avoid_: Faktur, invoice, receipt

**Status Transaksi (Sale Status)**:
Klasifikasi operasional dan akuntansi untuk setiap item transaksi penjualan. Terdapat 3 status utama yang dapat dipilih:
- **Diterima (`DITERIMA`)**: Pesanan sukses sampai dan diterima oleh pembeli. Omset dan laba dihitung secara normal. _Avoid_: Terkirim, selesai, sukses, delivered.
- **Hilang (`HILANG`)**: Paket hilang atau musnah di ekspedisi pengiriman. Omset otomatis menjadi Rp 0, laba tercatat sebagai kerugian minus `-(HPP + Ongkir + Biaya Platform)`, dan stok fisik tetap terpotong. _Avoid_: Hilang kurir, paket lenyap, paket hilang.
- **Return (`RETURN`)**: Paket dikembalikan pembeli atau gagal antar kurir (RTS). Omset otomatis menjadi Rp 0, stok barang otomatis dikembalikan (+Qty) ke gudang persediaan, dan laba tercatat rugi minus sebesar biaya platform & ongkir non-refundable. _Avoid_: Direturn, retur customer, batal kirim, refund.
- **Selisih Qty (`SELISIH_QTY`)**: Status sementara dari sistem saat kuantitas hasil scan logistik berbeda dengan kuantitas laporan finance settlement, menunggu tindakan di modal resolusi selisih. _Avoid_: Error scan, draft selisih.

**Omset**:
Nilai penerimaan bersih riil hasil pencairan dari platform marketplace yang masuk ke kas (`Harga Jual Kotor - Voucher - Diskon - Platform Fee - Shipping Fee`). Istilah ini distandarkan di seluruh aplikasi menggantikan istilah asing seperti `Net Revenue`.
_Avoid_: Net Revenue, revenue, pendapatan bersih, omset kotor, gross sales.

**Total HPP (Total Modal Pokok)**:
Total beban modal pokok barang (`HPP Satuan × Qty`). Pada status `Return`, HPP bersih = Rp 0 karena barang kembali ke gudang; pada status `Hilang`, HPP tetap menjadi beban rugi.
_Avoid_: Modal satuan, harga beli per botol.

**Laba Bersih (Net Profit)**:
Keuntungan atau kerugian riil per transaksi (`Omset - Total HPP`). Bernilai negatif (`-Rp X`) pada transaksi berstatus `Hilang` atau `Return`.
_Avoid_: Margin kotor, keuntungan kotor.
