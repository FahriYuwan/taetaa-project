import { PrismaClient, SKUType, Channel, MovementType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- RESETTING DATABASE ---');
  await prisma.return.deleteMany({});
  await prisma.marketing.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.productionInput.deleteMany({});
  await prisma.production.deleteMany({});
  await prisma.productionOutput.deleteMany({});
  await prisma.purchase.deleteMany({});
  await prisma.bOMComponent.deleteMany({});
  await prisma.sKUCostHistory.deleteMany({});
  await prisma.sKU.deleteMany({});
  console.log('--- DATABASE RESET COMPLETE ---');

  console.log('--- SEEDING MASTER SKU ---');
  // 1. RAW Materials
  const sbnRaw = await prisma.sKU.create({
    data: { code: 'SBN', name: 'Sabun 20 Liter (Curah)', type: SKUType.RAW }
  });
  const pbgRaw = await prisma.sKU.create({
    data: { code: 'PBG', name: 'Parfum Bubblegum 5 Liter', type: SKUType.RAW }
  });
  const pcfRaw = await prisma.sKU.create({
    data: { code: 'PCF', name: 'Parfum Kopi 5 Liter', type: SKUType.RAW }
  });
  const pvlRaw = await prisma.sKU.create({
    data: { code: 'PVL', name: 'Parfum Vanila 5 Liter', type: SKUType.RAW }
  });

  // 2. WIP (Setengah Jadi)
  const baseWip = await prisma.sKU.create({
    data: { code: 'BASE-WIP', name: 'Base Sabun Wangi (WIP)', type: SKUType.WIP }
  });
  await prisma.bOMComponent.create({
    data: { parentId: baseWip.id, childId: sbnRaw.id, quantity: 1 } // 1L SBN for 1L WIP
  });

  // 3. PACKAGE (Produk Jadi)
  const sbn20 = await prisma.sKU.create({
    data: { code: 'SBN20', name: 'Sabun 20 Liter', type: SKUType.PACKAGE, sellingPrice: 150000 }
  });
  await prisma.bOMComponent.create({
    data: { parentId: sbn20.id, childId: sbnRaw.id, quantity: 20 }
  });

  const sbn1Pbg = await prisma.sKU.create({
    data: { code: 'SBN1-PBG', name: 'Sabun 1 Liter Bubblegum', type: SKUType.PACKAGE, sellingPrice: 25000 }
  });
  await prisma.bOMComponent.createMany({
    data: [
      { parentId: sbn1Pbg.id, childId: sbnRaw.id, quantity: 1 },
      { parentId: sbn1Pbg.id, childId: pbgRaw.id, quantity: 0.05 } // 50ml parfum
    ]
  });

  const sbn2Pcf = await prisma.sKU.create({
    data: { code: 'SBN2-PCF', name: 'Sabun 500 ML Kopi', type: SKUType.PACKAGE, sellingPrice: 15000 }
  });
  await prisma.bOMComponent.createMany({
    data: [
      { parentId: sbn2Pcf.id, childId: sbnRaw.id, quantity: 0.5 },
      { parentId: sbn2Pcf.id, childId: pcfRaw.id, quantity: 0.025 }
    ]
  });

  const sbn3Pvl = await prisma.sKU.create({
    data: { code: 'SBN3-PVL', name: 'Sabun 100 ML Vanila', type: SKUType.PACKAGE, sellingPrice: 5000 }
  });
  await prisma.bOMComponent.createMany({
    data: [
      { parentId: sbn3Pvl.id, childId: sbnRaw.id, quantity: 0.1 },
      { parentId: sbn3Pvl.id, childId: pvlRaw.id, quantity: 0.01 }
    ]
  });

  console.log('--- SEEDING PURCHASES (RAW) ---');
  const purchases = [
    { date: '2026-08-01', skuId: sbnRaw.id, qty: 250, unitPrice: 5000, supplier: 'Toko Kimia Sentosa' },
    { date: '2026-08-05', skuId: sbnRaw.id, qty: 250, unitPrice: 5500, supplier: 'Toko Kimia Sentosa' }, // Increased qty to prevent negative stock
    { date: '2026-08-02', skuId: pbgRaw.id, qty: 20, unitPrice: 200000, supplier: 'Essence World' },
    { date: '2026-08-02', skuId: pcfRaw.id, qty: 20, unitPrice: 250000, supplier: 'Essence World' },
    { date: '2026-08-02', skuId: pvlRaw.id, qty: 20, unitPrice: 220000, supplier: 'Essence World' },
  ];

  for (const p of purchases) {
    const purchase = await prisma.purchase.create({
      data: { ...p, date: new Date(p.date), total: p.qty * p.unitPrice }
    });
    await prisma.inventory.create({
      data: { date: new Date(p.date), skuId: p.skuId, movement: p.qty, type: MovementType.PURCHASE, reference: purchase.id }
    });
    const costHist = await prisma.sKUCostHistory.findUnique({ where: { skuId: p.skuId } });
    if (costHist) {
      const newStock = costHist.stock + p.qty;
      const newAvgCost = ((costHist.stock * costHist.avgCost) + (p.qty * p.unitPrice)) / newStock;
      await prisma.sKUCostHistory.update({ where: { skuId: p.skuId }, data: { stock: newStock, avgCost: newAvgCost } });
    } else {
      await prisma.sKUCostHistory.create({ data: { skuId: p.skuId, stock: p.qty, avgCost: p.unitPrice } });
    }
  }

  console.log('--- SEEDING PRODUCTIONS ---');
  const productions = [
    { date: '2026-08-06', outputSkuId: sbn20.id, outputQty: 5, notes: 'Batch SBN20 Perdana' },
    { date: '2026-08-07', outputSkuId: sbn1Pbg.id, outputQty: 50, notes: 'Batch 1L Bubblegum' },
    { date: '2026-08-10', outputSkuId: sbn2Pcf.id, outputQty: 100, notes: 'Batch 500ml Kopi' },
    { date: '2026-08-10', outputSkuId: sbn3Pvl.id, outputQty: 100, notes: 'Batch 100ml Vanila' }, // Added to fix missing cost history
  ];

  for (const prod of productions) {
    const sku = await prisma.sKU.findUnique({
      where: { id: prod.outputSkuId },
      include: { bomComponents: { include: { child: true } } }
    });
    if (!sku) continue;

    let totalCost = 0;
    const inputs = [];
    for (const bom of sku.bomComponents) {
      const qtyNeeded = bom.quantity * prod.outputQty;
      const componentCost = await prisma.sKUCostHistory.findUnique({ where: { skuId: bom.childId } });
      const avgCost = componentCost?.avgCost || 0;
      totalCost += qtyNeeded * avgCost;

      await prisma.inventory.create({
        data: { date: new Date(prod.date), skuId: bom.childId, movement: -qtyNeeded, type: MovementType.PRODUCTION, reference: 'SEED' }
      });
      await prisma.sKUCostHistory.update({
        where: { skuId: bom.childId },
        data: { stock: { decrement: qtyNeeded } }
      });
      inputs.push({ inputSkuId: bom.childId, qtyUsed: qtyNeeded });
    }

    const output = await prisma.productionOutput.create({ data: { skuId: prod.outputSkuId } });
    const pRecord = await prisma.production.create({
      data: {
        date: new Date(prod.date),
        outputId: output.id,
        outputQty: prod.outputQty,
        notes: prod.notes,
        inputs: { create: inputs }
      }
    });

    await prisma.inventory.create({
      data: { date: new Date(prod.date), skuId: prod.outputSkuId, movement: prod.outputQty, type: MovementType.PRODUCTION, reference: pRecord.id }
    });

    const hppPerUnit = totalCost / prod.outputQty;
    const costHist = await prisma.sKUCostHistory.findUnique({ where: { skuId: prod.outputSkuId } });
    if (costHist) {
      const newStock = costHist.stock + prod.outputQty;
      const newAvgCost = ((costHist.stock * costHist.avgCost) + (prod.outputQty * hppPerUnit)) / newStock;
      await prisma.sKUCostHistory.update({ where: { skuId: prod.outputSkuId }, data: { stock: newStock, avgCost: newAvgCost } });
    } else {
      await prisma.sKUCostHistory.create({ data: { skuId: prod.outputSkuId, stock: prod.outputQty, avgCost: hppPerUnit } });
    }
  }

  console.log('--- SEEDING SALES ---');
  const sales = [
    { date: '2026-08-11', channel: Channel.SHOPEE, skuId: sbn20.id, qty: 2, unitPrice: 150000, fee: 7500, orderId: 'SHP-001' },
    { date: '2026-08-12', channel: Channel.TIKTOK, skuId: sbn1Pbg.id, qty: 10, unitPrice: 25000, fee: 2000, orderId: 'TK-001' },
    { date: '2026-08-12', channel: Channel.OFFLINE, skuId: sbn2Pcf.id, qty: 5, unitPrice: 15000, fee: 0, orderId: 'OFF-001' },
    { date: '2026-08-13', channel: Channel.AFFILIATE, skuId: sbn3Pvl.id, qty: 20, unitPrice: 5000, fee: 1000, orderId: 'AFF-001' },
    // More sales to vary data
    { date: '2026-08-14', channel: Channel.SHOPEE, skuId: sbn1Pbg.id, qty: 15, unitPrice: 26000, fee: 1500, orderId: 'SHP-002' }, // High margin
    { date: '2026-08-15', channel: Channel.TIKTOK, skuId: sbn2Pcf.id, qty: 30, unitPrice: 13000, fee: 1500, orderId: 'TK-002' }, // Low margin
    { date: '2026-08-15', channel: Channel.OFFLINE, skuId: sbn20.id, qty: 1, unitPrice: 145000, fee: 0, orderId: 'OFF-002' },
  ];

  for (const s of sales) {
    const sale = await prisma.sale.create({
      data: { ...s, date: new Date(s.date), total: s.qty * s.unitPrice, netRevenue: (s.qty * s.unitPrice) - s.fee }
    });
    await prisma.inventory.create({
      data: { date: new Date(s.date), skuId: s.skuId, movement: -s.qty, type: MovementType.SALE, reference: sale.id }
    });

    // Ensure Cost History exists before update
    const costHist = await prisma.sKUCostHistory.findUnique({ where: { skuId: s.skuId } });
    if (costHist) {
      await prisma.sKUCostHistory.update({
        where: { skuId: s.skuId },
        data: { stock: { decrement: s.qty } }
      });
    } else {
      // Should not happen with current script, but for safety:
      await prisma.sKUCostHistory.create({
        data: { skuId: s.skuId, stock: -s.qty, avgCost: 0 }
      });
    }
  }

  console.log('--- SEEDING LOST & BREAKAGE ---');
  const breakage = await prisma.inventory.create({
    data: {
      date: new Date('2026-08-16'),
      skuId: sbn20.id,
      movement: -1,
      type: MovementType.BREAKAGE,
      reference: 'Karat'
    }
  });
  await prisma.sKUCostHistory.update({ where: { skuId: sbn20.id }, data: { stock: { decrement: 1 } } });

  console.log('--- SEEDING RETURNS ---');
  const ret = await prisma.return.create({
    data: {
      date: new Date('2026-08-16'),
      saleId: 'SHP-001',
      qty: 1,
      reason: 'Bocor sedikit'
    }
  });
  await prisma.inventory.create({
    data: {
      date: new Date('2026-08-16'),
      skuId: sbn20.id,
      movement: 1,
      type: MovementType.RETURN,
      reference: ret.id
    }
  });
  await prisma.sKUCostHistory.update({ where: { skuId: sbn20.id }, data: { stock: { increment: 1 } } });

  console.log('--- SEEDING MARKETING ---');
  await prisma.marketing.createMany({
    data: [
      { date: new Date('2026-08-01'), channel: Channel.TIKTOK, cost: 500000, activity: 'Endorse Mamak Sholehah', notes: '100k followers' },
      { date: new Date('2026-08-10'), channel: Channel.SHOPEE, cost: 200000, activity: 'Shopee Ads Flash Sale' },
    ]
  });

  console.log('--- SEEDING COMPLETE ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
