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
