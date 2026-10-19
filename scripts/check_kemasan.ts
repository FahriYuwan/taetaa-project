import 'dotenv/config';
import prisma from '../lib/db';

async function main() {
  const items = await prisma.masterItemKemasan.findMany({ orderBy: { code: 'asc' } });
  console.log('Total items in MasterItemKemasan:', items.length);
  for (const i of items) {
    console.log(
      i.code.padEnd(12),
      i.name.padEnd(32),
      'isPeriodic:',
      String(i.isPeriodic).padEnd(6),
      'stockMin:',
      String(i.stockMin).padEnd(4),
      'stock:',
      i.stock
    );
  }
  const totalSales = await prisma.sale.count();
  const shopeeSales = await prisma.sale.count({ where: { channel: 'SHOPEE' } });
  const tokpedSales = await prisma.sale.count({ where: { channel: 'TOKOPEDIA' } });
  const tiktokSales = await prisma.sale.count({ where: { channel: 'TIKTOK' } });

  const agg = await prisma.sale.aggregate({
    _sum: {
      total: true,
      omset: true,
      platformFee: true,
      shippingFee: true,
      totalHpp: true,
      laba: true
    }
  });

  console.log('=== SALES SUMMARY IN DB ===');
  console.log('Total sales records:', totalSales);
  console.log('Shopee records:', shopeeSales);
  console.log('Tokopedia records:', tokpedSales);
  console.log('TikTok records:', tiktokSales);
  console.log('Total Omset: Rp', agg._sum.omset?.toLocaleString('id-ID'));
  console.log('Total Platform Fee: Rp', agg._sum.platformFee?.toLocaleString('id-ID'));
  console.log('Total Shipping Fee: Rp', agg._sum.shippingFee?.toLocaleString('id-ID'));
  console.log('Total Laba: Rp', agg._sum.laba?.toLocaleString('id-ID'));

  const lbl = await prisma.sKU.findUnique({
    where: { code: 'LBL' },
    include: {
      bomComponents: {
        include: { childSku: true, childKemasan: true }
      }
    }
  });

  console.log('=== LBL RECORD ===');
  console.log('Code:', lbl?.code, '| Name:', lbl?.name, '| Type:', lbl?.type, '| Unit:', lbl?.unit, '| Size:', lbl?.productSize, '| Price:', lbl?.sellingPrice);
  console.log('LBL BOM:');
  lbl?.bomComponents.forEach(b => {
    console.log(' -', b.category, b.childSku?.code || b.childKemasan?.code, b.childSku?.name || b.childKemasan?.name, 'qty:', b.quantity, b.consumptionType);
  });

  const unitCounts = await prisma.sKU.groupBy({
    by: ['unit'],
    _count: true,
  });
  console.log('=== SKU UNIT COUNTS ===', unitCounts);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
