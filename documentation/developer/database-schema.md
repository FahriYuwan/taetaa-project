# Database Schema Documentation

Project ini menggunakan Prisma ORM dengan database PostgreSQL.

## Data Models

### 1. SKU (Stock Keeping Unit)
Menyimpan data master produk.
- `id`: String (CUID, PK)
- `code`: String (Unique) - Kode identifikasi produk.
- `name`: String - Nama produk.
- `type`: Enum (`RAW`, `WIP`, `PACKAGE`).
- `sellingPrice`: Float (Optional) - Hanya untuk tipe `PACKAGE`.

### 2. BOMComponent (Bill of Materials)
Mendefinisikan resep/komponen untuk SKU tipe `WIP` atau `PACKAGE`.
- `parentId`: FK ke SKU - Produk yang dibuat.
- `childId`: FK ke SKU - Komponen yang digunakan.
- `quantity`: Float - Jumlah komponen per 1 unit parent.

### 3. Purchase
Mencatat transaksi pembelian bahan baku (`RAW`).
- `date`: DateTime
- `skuId`: FK ke SKU
- `qty`: Float
- `unitPrice`: Float
- `total`: Float (Auto: `qty * unitPrice`)
- `supplier`: String (Optional)

### 4. Production
Mencatat sesi produksi (Konversi RAW/WIP menjadi WIP/PACKAGE).
- `date`: DateTime
- `outputId`: FK ke ProductionOutput
- `outputQty`: Float
- `inputs`: Relasi ke ProductionInput (Daftar bahan yang dikonsumsi).

### 5. Sale
Mencatat transaksi penjualan.
- `date`: DateTime
- `skuId`: FK ke SKU
- `channel`: Enum (`SHOPEE`, `TIKTOK`, `OFFLINE`, `AFFILIATE`).
- `qty`: Float
- `unitPrice`: Float
- `fee`: Float - Potongan biaya marketplace.
- `netRevenue`: Float (Auto: `total - fee`)

### 6. Inventory
Audit trail mutasi stok. Setiap transaksi (Purchase, Production, Sale) mencatat baris di sini.
- `date`: DateTime
- `skuId`: FK ke SKU
- `movement`: Float (Positif untuk masuk, Negatif untuk keluar).
- `type`: Enum (`PURCHASE`, `PRODUCTION`, `SALE`, `ADJUSTMENT`, `BREAKAGE`, `RETURN`).

### 7. SKUCostHistory
Menyimpan kondisi stok dan HPP saat ini (Weighted Average).
- `skuId`: String (Unique, PK)
- `avgCost`: Float - Biaya rata-rata tertimbang.
- `stock`: Float - Saldo stok saat ini.

## Key Business Logic

### Weighted Average (HPP Rata-rata Tertimbang)
Logika ini diimplementasikan di level API (`/app/api/purchases/route.ts` dan `/app/api/productions/route.ts`) menggunakan formula:
```
New AVG Cost = ((Old Stock * Old AVG Cost) + (New Qty * New Unit Cost)) / (Old Stock + New Qty)
```
- Saat **Pembelian RAW**: `unitPrice` supplier digunakan sebagai `New Unit Cost`.
- Saat **Produksi**: Total biaya komponen (berdasarkan `avgCost` masing-masing komponen saat itu) dibagi `outputQty` digunakan sebagai `New Unit Cost`.

### Inventory Aggregation
Halaman **Dashboard Inventory** menghitung saldo awal dan mutasi secara dinamis dari tabel `Inventory`. Saldo awal dihitung dengan menjumlahkan seluruh `movement` sebelum `fromDate` yang dipilih.

## Database Integrity
- Menggunakan `prisma.$transaction` pada operasi produksi dan penjualan untuk memastikan integritas data (contoh: stok tidak boleh terpotong jika pencatatan transaksi gagal).
- `Cascade Delete` diterapkan pada relasi SKU ke BOM, sehingga jika SKU dihapus, resep terkait otomatis terhapus.
