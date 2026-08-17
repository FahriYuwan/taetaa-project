import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    const from = fromDate ? new Date(fromDate) : new Date(0);
    const to = toDate ? new Date(toDate) : new Date();
    to.setHours(23, 59, 59, 999);

    let csvContent = "";
    let fileName = `export_${type}_${new Date().toISOString().split('T')[0]}.csv`;

    switch (type) {
      case 'sales': {
        const sales = await prisma.sale.findMany({
          where: { date: { gte: from, lte: to } },
          include: { sku: true },
          orderBy: { date: 'asc' }
        });
        csvContent = "Tanggal,Marketplace,Order ID,SKU,Nama,Qty,Harga,Gross,Biaya,Net Revenue\n";
        sales.forEach(s => {
          csvContent += `${s.date.toISOString().split('T')[0]},${s.channel},${s.orderId || ""},${s.sku.code},${s.sku.name},${s.qty},${s.unitPrice},${s.total},${s.fee},${s.netRevenue}\n`;
        });
        break;
      }
      case 'purchases': {
        const purchases = await prisma.purchase.findMany({
          where: { date: { gte: from, lte: to } },
          include: { sku: true },
          orderBy: { date: 'asc' }
        });
        csvContent = "Tanggal,SKU,Nama,Qty,Harga Satuan,Total,Supplier,Catatan\n";
        purchases.forEach(p => {
          csvContent += `${p.date.toISOString().split('T')[0]},${p.sku.code},${p.sku.name},${p.qty},${p.unitPrice},${p.total},${p.supplier || ""},${p.notes || ""}\n`;
        });
        break;
      }
      case 'productions': {
        const productions = await prisma.production.findMany({
          where: { date: { gte: from, lte: to } },
          include: {
            output: { include: { sku: true } },
            inputs: true
          },
          orderBy: { date: 'asc' }
        });
        csvContent = "Tanggal,Output SKU,Nama,Qty Output,Catatan\n";
        productions.forEach(p => {
          csvContent += `${p.date.toISOString().split('T')[0]},${p.output.sku.code},${p.output.sku.name},${p.outputQty},${p.notes || ""}\n`;
        });
        break;
      }
      case 'inventory': {
        const skus = await prisma.sKU.findMany({
          include: { inventory: true }
        });
        const costHistories = await prisma.sKUCostHistory.findMany();
        const costMap = new Map(costHistories.map(ch => [ch.skuId, ch]));

        csvContent = "SKU,Nama,Tipe,Stock Akhir,Avg Cost,Nilai Stock\n";
        skus.forEach(sku => {
          const stock = sku.inventory.reduce((sum, inv) => sum + inv.movement, 0);
          const costInfo = costMap.get(sku.id);
          const avgCost = costInfo?.avgCost || 0;
          csvContent += `${sku.code},${sku.name},${sku.type},${stock},${avgCost},${stock * avgCost}\n`;
        });
        break;
      }
      case 'skus': {
        const skus = await prisma.sKU.findMany({
          include: { bomComponents: { include: { child: true } } }
        });
        csvContent = "SKU Code,Nama,Tipe,Selling Price,BOM Components\n";
        skus.forEach(sku => {
          const bom = sku.bomComponents.map(b => `${b.child.code}(${b.quantity})`).join("; ");
          csvContent += `${sku.code},${sku.name},${sku.type},${sku.sellingPrice || 0},"${bom}"\n`;
        });
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
