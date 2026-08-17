# API Reference

Seluruh endpoint backend menggunakan Next.js Route Handlers dan mengembalikan data dalam format JSON.

## Modul: Master SKU

### `GET /api/skus`
Mengambil daftar seluruh SKU.
- **Query Params**: `type` (Optional: `RAW`, `WIP`, `PACKAGE`)
- **Response**: `Array<SKU>` dengan detail `bomComponents`.

### `POST /api/skus`
Membuat SKU baru.
- **Payload**:
  ```json
  {
    "code": "PACKAGE-SABUN-01",
    "name": "Sabun Lavender",
    "type": "PACKAGE",
    "sellingPrice": 50000,
    "bomComponents": [
      { "childId": "cuid_raw_oil", "quantity": 0.5 }
    ]
  }
  ```

### `POST /api/skus/bulk`
Impor massal SKU dari format Tab-Separated.
- **Payload**: `{ "text": "KODE\tNAMA\tTIPE\tHARGA" }`

## Modul: Pembelian RAW

### `POST /api/purchases`
Mencatat pembelian bahan baku. Otomatis menambah stok dan update `avgCost`.
- **Payload**:
  ```json
  {
    "date": "2026-08-17",
    "skuId": "cuid_raw_oil",
    "qty": 10,
    "unitPrice": 12000,
    "supplier": "Toko Wangi"
  }
  ```

## Modul: Produksi

### `POST /api/productions`
Mencatat sesi produksi. Memotong stok bahan (RAW/WIP) dan menambah stok output (WIP/PACKAGE).
- **Payload**:
  ```json
  {
    "date": "2026-08-17",
    "outputSkuId": "cuid_package_sabun",
    "outputQty": 20,
    "notes": "Batch pagi"
  }
  ```
- **Logic**: Validasi stok komponen harus cukup sebelum transaksi diproses.

## Modul: Penjualan

### `POST /api/sales`
Mencatat penjualan marketplace.
- **Payload**:
  ```json
  {
    "date": "2026-08-17",
    "skuId": "cuid_package_sabun",
    "qty": 5,
    "unitPrice": 50000,
    "channel": "SHOPEE",
    "fee": 2500
  }
  ```

## Modul: Dashboard & Inventory

### `GET /api/dashboard`
Ringkasan finansial (Revenue, HPP, Profit) dan data Chart.
- **Query Params**: `from`, `to` (Date strings)

### `GET /api/inventory/summary`
Data mutasi stok per SKU (Stock Awal, Masuk, Keluar, Stock Akhir).
- **Query Params**: `from`, `to` (Date strings)

## Modul: Export

### `GET /api/export`
Menghasilkan file CSV.
- **Query Params**: 
  - `type`: `sales`, `purchases`, `productions`, `inventory`, `skus`.
  - `from`, `to`: Untuk tipe berbasis periode.
- **Response**: Byte stream dengan header `Content-Type: text/csv`.
