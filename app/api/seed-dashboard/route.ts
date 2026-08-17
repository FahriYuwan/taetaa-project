import prisma from '@/lib/db';

export async function POST() {
  try {
    // Create sample SKUs
    const skus = await prisma.sKU.createMany({
      data: [
        {
          code: 'SOAP-001',
          name: 'Sabun Cair Premium 500ml',
          type: 'PACKAGE',
          sellingPrice: 35000,
        },
        {
          code: 'SOAP-002',
          name: 'Sabun Cair Standard 500ml',
          type: 'PACKAGE',
          sellingPrice: 25000,
        },
        {
          code: 'PERF-001',
          name: 'Parfum Lemon Fresh 100ml',
          type: 'PACKAGE',
          sellingPrice: 45000,
        },
        {
          code: 'OIL-001',
          name: 'Minyak Inti 1L',
          type: 'RAW',
        },
        {
          code: 'WATER-001',
          name: 'Air Demineralisasi 1L',
          type: 'RAW',
        },
      ],
      skipDuplicates: true,
    });

    // Get SKUs for creating related data
    const createdSKUs = await prisma.sKU.findMany({
      take: 5,
    });

    if (createdSKUs.length === 0) {
      return Response.json({ error: 'No SKUs found' }, { status: 400 });
    }

    const now = new Date();
    const rawSkus = createdSKUs.filter((s) => s.type === 'RAW');
    const packageSkus = createdSKUs.filter((s) => s.type === 'PACKAGE');

    // Create sample purchases
    for (let i = 0; i < 8; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      const sku = rawSkus[Math.floor(Math.random() * rawSkus.length)];

      const qty = 20 + Math.random() * 80;
      const unitPrice = 15000 + Math.random() * 10000;
      const total = qty * unitPrice;

      await prisma.purchase.create({
        data: {
          skuId: sku.id,
          date,
          qty,
          unitPrice,
          total,
          supplier: 'Supplier ' + Math.floor(Math.random() * 5),
        },
      });
    }

    // Create sample sales
    for (let i = 0; i < 12; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      const sku = packageSkus[Math.floor(Math.random() * packageSkus.length)];

      const qty = 2 + Math.floor(Math.random() * 8);
      const unitPrice = sku.sellingPrice || 35000;
      const total = qty * unitPrice;
      const fee = Math.random() * 0.1 * total;
      const channels = ['SHOPEE', 'TIKTOK', 'OFFLINE', 'AFFILIATE'];

      await prisma.sale.create({
        data: {
          skuId: sku.id,
          date,
          qty,
          unitPrice,
          total,
          fee,
          netRevenue: total - fee,
          channel: channels[Math.floor(Math.random() * channels.length)] as any,
        },
      });
    }

    // Create sample inventory movements (purchases)
    for (let i = 0; i < 10; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      const sku = createdSKUs[Math.floor(Math.random() * createdSKUs.length)];

      await prisma.inventory.create({
        data: {
          skuId: sku.id,
          date,
          movement: 50 + Math.random() * 100,
          type: 'PURCHASE',
          reference: 'PURCHASE-' + Math.floor(Math.random() * 1000),
        },
      });
    }

    return Response.json({
      success: true,
      message: 'Sample data seeded successfully',
      skusCreated: skus.count,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json(
      { error: 'Failed to seed data', details: error },
      { status: 500 }
    );
  }
}

