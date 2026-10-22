import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    const from = fromDate ? new Date(fromDate) : new Date(0);
    const to = toDate ? new Date(toDate) : new Date();
    to.setHours(23, 59, 59, 999);

    let rows: string[][] = [];
    let fileName = `export_${type}_${new Date().toISOString().split('T')[0]}.csv`;

    switch (type) {
      case 'sales': {
        const sales = await prisma.sale.findMany({
          where: { date: { gte: from, lte: to } },
          include: { sku: true },
          orderBy: { date: 'asc' },
        });

        const costHistories = await prisma.sKUCostHistory.findMany();
        const costMap = new Map(costHistories.map((ch) => [ch.skuId, ch.avgCost]));

        rows.push([
          'Tanggal',
          'Marketplace',
          'Order ID',
          'No. Resi',
          'Status Pesanan',
          'Kode SKU',
          'Nama Produk',
          'Qty Terjual',
          'Harga Satuan',
          'Total Gross',
          'Biaya Platform',
          'Net Revenue',
          'Total HPP',
          'Laba Bersih',
          'Scan Logistik',
          'Status Finance',
        ]);

        for (const s of sales) {
          const gross = s.total ?? (s.qty * s.unitPrice);
          const fee = s.fee ?? 0;
          const netRevenue = s.netRevenue ?? (gross - fee);
          const fallbackAvg = costMap.get(s.skuId) ?? s.sku?.hppPrice ?? 0;
          const hpp = s.totalHpp && s.totalHpp > 0 ? s.totalHpp : s.qty * fallbackAvg;
          const laba = s.laba && s.laba !== 0 ? s.laba : netRevenue - hpp;
          const scanStatus = s.scannedByLogistic ? 'Sudah Di-scan' : 'Belum';
          const financeStatus = s.financeMatched ? 'Cocok' : s.hasDiscrepancy ? 'Ada Selisih' : 'Belum';

          rows.push([
            s.date.toISOString().split('T')[0],
            s.channel,
            s.orderId || '',
            s.resi || '',
            s.status,
            s.sku?.code || '',
            s.sku?.name || '',
            String(s.qty),
            String(s.unitPrice),
            String(gross),
            String(fee),
            String(netRevenue),
            String(hpp),
            String(laba),
            scanStatus,
            financeStatus,
          ]);
        }
        break;
      }

      case 'purchases': {
        const purchases = await prisma.purchase.findMany({
          where: { date: { gte: from, lte: to } },
          include: { sku: true, kemasan: true },
          orderBy: { date: 'asc' },
        });

        rows.push([
          'Tanggal',
          'Tipe Barang',
          'Kategori Kemasan',
          'Kode Item',
          'Nama Barang',
          'Qty Beli',
          'Satuan',
          'Harga Satuan',
          'Total Pembelian',
          'Supplier',
          'Catatan',
        ]);

        for (const p of purchases) {
          const isKemasan = !!p.kemasanId;
          const typeLabel = isKemasan ? 'KEMASAN' : (p.sku?.type || 'RAW');
          const categoryLabel = p.kemasan?.category || '-';
          const code = p.kemasan?.code || p.sku?.code || '';
          const name = p.kemasan?.name || p.sku?.name || '';
          const unit = isKemasan ? 'pcs' : (p.sku?.unit || 'ml');

          rows.push([
            p.date.toISOString().split('T')[0],
            typeLabel,
            categoryLabel,
            code,
            name,
            String(p.qty),
            unit,
            String(p.unitPrice),
            String(p.total),
            p.supplier || '',
            p.notes || '',
          ]);
        }
        break;
      }

      case 'productions': {
        const productions = await prisma.production.findMany({
          where: { date: { gte: from, lte: to } },
          include: {
            output: { include: { sku: true } },
            inputs: { include: { inputSku: true } },
            kemasanInputs: { include: { kemasan: true } },
          },
          orderBy: { date: 'asc' },
        });

        rows.push([
          'Tanggal',
          'Kode Output SKU',
          'Nama Output Produk',
          'Qty Output',
          'Satuan',
          'Bahan Baku Terpakai (RAW/WIP)',
          'Kemasan Terpakai (BOM)',
          'Catatan',
        ]);

        for (const p of productions) {
          const rawInputs = (p.inputs || [])
            .map((inp) => `${inp.inputSku?.code || 'RAW'}: ${inp.qtyUsed} ${inp.inputSku?.unit || 'ml'}`)
            .join('; ');

          const kemasanInputs = (p.kemasanInputs || [])
            .map((k) => `${k.kemasan?.code || 'KEMASAN'}: ${k.qtyUsed} pcs`)
            .join('; ');

          rows.push([
            p.date.toISOString().split('T')[0],
            p.output?.sku?.code || '',
            p.output?.sku?.name || '',
            String(p.outputQty),
            p.output?.sku?.unit || 'pcs',
            rawInputs || '-',
            kemasanInputs || '-',
            p.notes || '',
          ]);
        }
        break;
      }

      case 'inventory': {
        const [skus, costHistories, kemasanList, inventoryAgg] = await Promise.all([
          prisma.sKU.findMany({ orderBy: { code: 'asc' } }),
          prisma.sKUCostHistory.findMany(),
          prisma.masterItemKemasan.findMany({ orderBy: { code: 'asc' } }),
          prisma.inventory.groupBy({
            by: ['skuId'],
            _sum: { movement: true },
          }),
        ]);

        const costMap = new Map(costHistories.map((ch) => [ch.skuId, ch]));
        const stockMap = new Map(inventoryAgg.map((inv) => [inv.skuId, inv._sum.movement ?? 0]));

        rows.push([
          'Kelompok',
          'Tipe / Kategori',
          'Kode Item',
          'Nama Item',
          'Satuan',
          'Stok Akhir',
          'Stok Minimum',
          'Status Stok',
          'Avg Cost (HPP)',
          'Total Nilai Stok',
        ]);

        // SKU items
        for (const sku of skus) {
          const stock = stockMap.get(sku.id) ?? 0;
          const costInfo = costMap.get(sku.id);
          const avgCost = costInfo?.avgCost ?? sku.hppPrice ?? 0;
          const stockMin = sku.stockMin ?? 0;
          let status = 'Aman';
          if (stock <= 0) status = 'Habis';
          else if (stockMin > 0 && stock <= stockMin) status = 'Menipis';

          rows.push([
            'PRODUK & BAHAN',
            sku.type,
            sku.code,
            sku.name,
            sku.unit || 'ml',
            String(stock),
            String(stockMin),
            status,
            String(avgCost),
            String(stock * avgCost),
          ]);
        }

        // Kemasan items
        for (const kemasan of kemasanList) {
          const stock = kemasan.stock ?? 0;
          const avgCost = kemasan.avgCost ?? 0;
          const stockMin = kemasan.stockMin ?? 0;
          let status = 'Aman';
          if (stock <= 0) status = 'Habis';
          else if (stockMin > 0 && stock <= stockMin) status = 'Menipis';

          rows.push([
            'KEMASAN PACKAGING',
            kemasan.category,
            kemasan.code,
            kemasan.name,
            'pcs',
            String(stock),
            String(stockMin),
            status,
            String(avgCost),
            String(stock * avgCost),
          ]);
        }
        break;
      }

      case 'skus': {
        const skus = await prisma.sKU.findMany({
          include: {
            bomComponents: {
              include: {
                childSku: true,
                childKemasan: true,
              },
            },
          },
          orderBy: { code: 'asc' },
        });

        rows.push([
          'Kode SKU',
          'Nama SKU',
          'Tipe',
          'Ukuran / Vol',
          'Satuan',
          'HPP Acuan (Rp)',
          'Harga Jual (Rp)',
          'Stok Minimum',
          'Komponen Resep BOM (Bahan & Kemasan)',
        ]);

        for (const sku of skus) {
          const bomParts = (sku.bomComponents || []).map((b) => {
            const label = b.childSku ? `${b.childSku.code} (${b.quantity} ${b.childSku.unit || 'ml'})` : b.childKemasan ? `${b.childKemasan.code} (${b.quantity} pcs)` : `Unknown (${b.quantity})`;
            return `${label} [${b.category}]`;
          });

          rows.push([
            sku.code,
            sku.name,
            sku.type,
            String(sku.productSize ?? 0),
            sku.unit || 'ml',
            String(sku.hppPrice ?? 0),
            String(sku.sellingPrice ?? 0),
            String(sku.stockMin ?? 0),
            bomParts.join('; ') || '-',
          ]);
        }
        break;
      }

      case 'kemasan': {
        const kemasanList = await prisma.masterItemKemasan.findMany({
          orderBy: { code: 'asc' },
        });

        rows.push([
          'Kode Kemasan',
          'Nama Item Kemasan',
          'Kategori',
          'Metode Pemantauan',
          'Stok Saat Ini (pcs)',
          'Batas Stok Minimum',
          'Harga Rata-rata HPP (Rp)',
          'Total Nilai Stok (Rp)',
          'Terakhir Opname Fisik',
        ]);

        for (const k of kemasanList) {
          const stock = k.stock ?? 0;
          const avgCost = k.avgCost ?? 0;
          const method = k.isPeriodic ? 'Periodik (Mingguan)' : 'Harian (Perpetual)';
          const lastOpname = k.lastOpname ? k.lastOpname.toISOString().split('T')[0] : 'Belum pernah';

          rows.push([
            k.code,
            k.name,
            k.category,
            method,
            String(stock),
            String(k.stockMin ?? 0),
            String(avgCost),
            String(stock * avgCost),
            lastOpname,
          ]);
        }
        break;
      }

      case 'opname': {
        const opnameSessions = await prisma.stockOpname.findMany({
          where: { date: { gte: from, lte: to } },
          include: {
            items: {
              include: { sku: true },
            },
          },
          orderBy: { date: 'desc' },
        });

        rows.push([
          'No Opname',
          'Tanggal Sesi',
          'Status Sesi',
          'Catatan Sesi',
          'Kode SKU',
          'Nama SKU',
          'Tipe SKU',
          'Stok Sistem',
          'Stok Fisik',
          'Selisih Stok',
          'Status Verifikasi',
          'Catatan Perbedaan',
        ]);

        for (const op of opnameSessions) {
          for (const it of op.items) {
            rows.push([
              op.opnameNumber || 'DRAFT',
              op.date.toISOString().split('T')[0],
              op.status,
              op.notes || '',
              it.sku?.code || '',
              it.sku?.name || '',
              it.sku?.type || '',
              String(it.systemStock),
              String(it.physicalStock),
              String(it.diff),
              it.checked ? 'Sudah Dicek' : 'Belum Dicek',
              it.notes || '',
            ]);
          }
        }
        break;
      }

      case 'breakage': {
        const breakageList = await prisma.breakage.findMany({
          where: { date: { gte: from, lte: to } },
          include: { sku: true },
          orderBy: { date: 'asc' },
        });

        rows.push([
          'Tanggal',
          'Kode SKU',
          'Nama Produk',
          'Qty Kerugian',
          'Satuan',
          'Kategori / Alasan',
          'Estimasi Kerugian (Rp)',
          'Catatan',
        ]);

        for (const b of breakageList) {
          rows.push([
            b.date.toISOString().split('T')[0],
            b.sku?.code || '',
            b.sku?.name || '',
            String(b.qty),
            b.sku?.unit || 'pcs',
            b.category,
            String(b.total),
            b.notes || '',
          ]);
        }
        break;
      }

      case 'expenses': {
        const expenses = await prisma.otherExpense.findMany({
          where: { date: { gte: from, lte: to } },
          orderBy: { date: 'asc' },
        });

        rows.push([
          'Tanggal',
          'Kategori Beban',
          'Penerima Dana',
          'Jumlah Pengeluaran (Rp)',
          'Keterangan / Catatan',
        ]);

        for (const e of expenses) {
          rows.push([
            e.date.toISOString().split('T')[0],
            e.category,
            e.recipient,
            String(e.amount),
            e.notes || '',
          ]);
        }
        break;
      }

      case 'affiliate': {
        const activities = await prisma.affiliateActivity.findMany({
          where: { date: { gte: from, lte: to } },
          include: { sku: true },
          orderBy: { date: 'asc' },
        });

        const costHistories = await prisma.sKUCostHistory.findMany();
        const costMap = new Map(costHistories.map((ch) => [ch.skuId, ch.avgCost]));

        rows.push([
          'Tanggal',
          'Tipe Aktivitas',
          'Username Akun',
          'Nama Asli',
          'Kode SKU',
          'Nama Produk',
          'Qty Sampel',
          'Ekspedisi',
          'Biaya Ongkir (Rp)',
          'Marketplace',
          'Followers',
          'HPP Terpakai (Rp)',
          'Total Biaya (Rp)',
          'Keterangan',
        ]);

        for (const a of activities) {
          const hppUnit = costMap.get(a.skuId) ?? a.sku?.hppPrice ?? 0;
          const hppCost = hppUnit * a.qty;
          const shippingCost = a.shippingCost ?? 0;
          const totalCost = hppCost + shippingCost;

          rows.push([
            a.date.toISOString().split('T')[0],
            a.activityType,
            a.accountUsername || '',
            a.realName || '',
            a.sku?.code || '',
            a.sku?.name || '',
            String(a.qty),
            a.courier || '',
            String(shippingCost),
            a.marketplace || '',
            String(a.followers || ''),
            String(hppCost),
            String(totalCost),
            a.notes || '',
          ]);
        }
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    // Convert rows to CSV with proper escaping and UTF-8 BOM
    const csvContent = '\uFEFF' + rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message || 'Failed to export data' }, { status: 500 });
  }
}
