import { PrismaClient, SKUType, Channel, MovementType, BOMCategory, ConsumptionType, ExpenseCategory, BreakageCategory, AffiliateActivityType } from '@prisma/client';
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
  await prisma.stockOpnameItem.deleteMany({});
  await prisma.stockOpname.deleteMany({});
  await prisma.breakage.deleteMany({});
  await prisma.affiliateActivity.deleteMany({});
  await prisma.otherExpense.deleteMany({});
  await prisma.return.deleteMany({});
  await prisma.marketing.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.productionInput.deleteMany({});
  await prisma.production.deleteMany({});
  await prisma.productionOutput.deleteMany({});
  await prisma.purchase.deleteMany({});
  await prisma.bOMComponent.deleteMany({});
  await prisma.masterItemKemasan.deleteMany({});
  await prisma.sKUCostHistory.deleteMany({});
  await prisma.sKU.deleteMany({});
  console.log('--- DATABASE RESET COMPLETE ---');

  console.log('--- SEEDING MASTER ITEM KEMASAN ---');
  const btl1 = await prisma.masterItemKemasan.create({
    data: { code: 'BTL1', name: 'Botol 1 Liter', category: BOMCategory.PACKING, stock: 1000, avgCost: 1500 }
  });
  const btl500 = await prisma.masterItemKemasan.create({
    data: { code: 'BTL500', name: 'Botol 500 ML', category: BOMCategory.PACKING, stock: 1000, avgCost: 1200 }
  });
  const btl100 = await prisma.masterItemKemasan.create({
    data: { code: 'BTL100', name: 'Botol 100 ML', category: BOMCategory.PACKING, stock: 1000, avgCost: 800 }
  });

  const stk1 = await prisma.masterItemKemasan.create({
    data: { code: 'STK1', name: 'Stiker Bubblegum 1L', category: BOMCategory.STIKER, stock: 1000, avgCost: 500 }
  });
  const stk2 = await prisma.masterItemKemasan.create({
    data: { code: 'STK2', name: 'Stiker Kopi 500ML', category: BOMCategory.STIKER, stock: 1000, avgCost: 400 }
  });
  const stk3 = await prisma.masterItemKemasan.create({
    data: { code: 'STK3', name: 'Stiker Vanila 100ML', category: BOMCategory.STIKER, stock: 1000, avgCost: 300 }
  });

  const sltp = await prisma.masterItemKemasan.create({
    data: { code: 'SLTP', name: 'Plastik Wrap Rol', category: BOMCategory.SAFETY, stock: 50, avgCost: 25000 }
  });
  const plwr = await prisma.masterItemKemasan.create({
    data: { code: 'PLWR', name: 'Segel Plastik Lembar', category: BOMCategory.SAFETY, stock: 2000, avgCost: 100 }
  });
  const tbtl = await prisma.masterItemKemasan.create({
    data: { code: 'TBTL', name: 'Tutup Botol Standar', category: BOMCategory.SAFETY, stock: 3000, avgCost: 200 }
  });

  const dus1 = await prisma.masterItemKemasan.create({
    data: { code: 'DUS1', name: 'Kardus Besar', category: BOMCategory.DUS, stock: 500, avgCost: 5000 }
  });
  const dus2 = await prisma.masterItemKemasan.create({
    data: { code: 'DUS2', name: 'Kardus Sedang', category: BOMCategory.DUS, stock: 500, avgCost: 4000 }
  });
  const dus3 = await prisma.masterItemKemasan.create({
    data: { code: 'DUS3', name: 'Kardus Kecil', category: BOMCategory.DUS, stock: 500, avgCost: 3000 }
  });

  console.log('--- SEEDING MASTER SKU ---');
  // RAW Materials dengan productSize terisi (ml)
  const sbnRaw = await prisma.sKU.create({
    data: { code: 'SBN', name: 'Sabun 20 Liter (Curah)', type: SKUType.RAW, productSize: 20000, hppPrice: 5000, stockMin: 100 }
  });
  const pbgRaw = await prisma.sKU.create({
    data: { code: 'PBG', name: 'Parfum Bubblegum 5 Liter', type: SKUType.RAW, productSize: 5000, hppPrice: 200000, stockMin: 10 }
  });
  const pcfRaw = await prisma.sKU.create({
    data: { code: 'PCF', name: 'Parfum Kopi 5 Liter', type: SKUType.RAW, productSize: 5000, hppPrice: 250000, stockMin: 10 }
  });
  const pvlRaw = await prisma.sKU.create({
    data: { code: 'PVL', name: 'Parfum Vanila 5 Liter', type: SKUType.RAW, productSize: 5000, hppPrice: 220000, stockMin: 10 }
  });

  // PRODUCT (Setengah Jadi)
  const baseProduct = await prisma.sKU.create({
    data: { code: 'BASE-PROD', name: 'Base Sabun Wangi', type: SKUType.PRODUCT, productSize: 1000, hppPrice: 6000, stockMin: 0 }
  });
  await prisma.bOMComponent.create({
    data: { parentId: baseProduct.id, childSkuId: sbnRaw.id, category: BOMCategory.RAW, quantity: 0.05, consumptionType: ConsumptionType.AUTOMATIC } // 1.000 ml / 20.000 ml = 0.05 unit
  });

  // PACKAGE (Produk Jadi Siap Jual)
  const sbn1Pbg = await prisma.sKU.create({
    data: { code: 'SBN1-PBG', name: 'Sabun 1 Liter Bubblegum', type: SKUType.PACKAGE, productSize: 1000, hppPrice: 12000, sellingPrice: 25000, stockMin: 35 }
  });
  await prisma.bOMComponent.createMany({
    data: [
      { parentId: sbn1Pbg.id, childSkuId: sbnRaw.id, category: BOMCategory.RAW, quantity: 0.05, consumptionType: ConsumptionType.AUTOMATIC }, // 1.000 ml / 20.000 ml = 0.05 jerigen
      { parentId: sbn1Pbg.id, childSkuId: pbgRaw.id, category: BOMCategory.RAW, quantity: 0.004, consumptionType: ConsumptionType.AUTOMATIC }, // 20 ml / 5.000 ml = 0.004 jerigen
      { parentId: sbn1Pbg.id, childKemasanId: btl1.id, category: BOMCategory.PACKING, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn1Pbg.id, childKemasanId: stk1.id, category: BOMCategory.STIKER, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn1Pbg.id, childKemasanId: tbtl.id, category: BOMCategory.SAFETY, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn1Pbg.id, childKemasanId: sltp.id, category: BOMCategory.SAFETY, quantity: 1, consumptionType: ConsumptionType.MANUAL },
      { parentId: sbn1Pbg.id, childKemasanId: dus1.id, category: BOMCategory.DUS, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC }
    ]
  });

  const sbn2Pcf = await prisma.sKU.create({
    data: { code: 'SBN2-PCF', name: 'Sabun 500 ML Kopi', type: SKUType.PACKAGE, productSize: 500, hppPrice: 7000, sellingPrice: 15000, stockMin: 50 }
  });
  await prisma.bOMComponent.createMany({
    data: [
      { parentId: sbn2Pcf.id, childSkuId: sbnRaw.id, category: BOMCategory.RAW, quantity: 0.025, consumptionType: ConsumptionType.AUTOMATIC }, // 500 ml / 20.000 ml = 0.025 jerigen
      { parentId: sbn2Pcf.id, childSkuId: pcfRaw.id, category: BOMCategory.RAW, quantity: 0.002, consumptionType: ConsumptionType.AUTOMATIC }, // 10 ml / 5.000 ml = 0.002 jerigen
      { parentId: sbn2Pcf.id, childKemasanId: btl500.id, category: BOMCategory.PACKING, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn2Pcf.id, childKemasanId: stk2.id, category: BOMCategory.STIKER, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn2Pcf.id, childKemasanId: tbtl.id, category: BOMCategory.SAFETY, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn2Pcf.id, childKemasanId: plwr.id, category: BOMCategory.SAFETY, quantity: 1, consumptionType: ConsumptionType.MANUAL },
      { parentId: sbn2Pcf.id, childKemasanId: dus2.id, category: BOMCategory.DUS, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC }
    ]
  });

  const sbn3Pvl = await prisma.sKU.create({
    data: { code: 'SBN3-PVL', name: 'Sabun 100 ML Vanila', type: SKUType.PACKAGE, productSize: 100, hppPrice: 3000, sellingPrice: 5000, stockMin: 10 }
  });
  await prisma.bOMComponent.createMany({
    data: [
      { parentId: sbn3Pvl.id, childSkuId: sbnRaw.id, category: BOMCategory.RAW, quantity: 0.005, consumptionType: ConsumptionType.AUTOMATIC }, // 100 ml / 20.000 ml = 0.005 jerigen
      { parentId: sbn3Pvl.id, childSkuId: pvlRaw.id, category: BOMCategory.RAW, quantity: 0.0004, consumptionType: ConsumptionType.AUTOMATIC }, // 2 ml / 5.000 ml = 0.0004 jerigen
      { parentId: sbn3Pvl.id, childKemasanId: btl100.id, category: BOMCategory.PACKING, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn3Pvl.id, childKemasanId: stk3.id, category: BOMCategory.STIKER, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn3Pvl.id, childKemasanId: tbtl.id, category: BOMCategory.SAFETY, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn3Pvl.id, childKemasanId: dus3.id, category: BOMCategory.DUS, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC }
    ]
  });

  console.log('--- SEEDING PURCHASES & COST HISTORY (RAW) ---');
  const purchases = [
    { date: '2026-09-01', skuId: sbnRaw.id, qty: 500, unitPrice: 5000, supplier: 'Toko Kimia Sentosa' },
    { date: '2026-09-02', skuId: pbgRaw.id, qty: 50, unitPrice: 200000, supplier: 'Essence World' },
    { date: '2026-09-02', skuId: pcfRaw.id, qty: 50, unitPrice: 250000, supplier: 'Essence World' },
    { date: '2026-09-02', skuId: pvlRaw.id, qty: 50, unitPrice: 220000, supplier: 'Essence World' },
  ];

  for (const p of purchases) {
    const purchase = await prisma.purchase.create({
      data: { ...p, date: new Date(p.date), total: p.qty * p.unitPrice }
    });
    await prisma.inventory.create({
      data: { date: new Date(p.date), skuId: p.skuId, movement: p.qty, type: MovementType.PURCHASE, reference: purchase.id }
    });
    await prisma.sKUCostHistory.create({
      data: { skuId: p.skuId, stock: p.qty, avgCost: p.unitPrice }
    });
  }

  console.log('--- SEEDING PRODUCTIONS WITH MANUAL CHECKBOXES ---');
  // Produksi 1: SLTP dicentang (stok berkurang)
  const prod1Output = await prisma.productionOutput.create({ data: { skuId: sbn1Pbg.id } });
  const prod1 = await prisma.production.create({
    data: {
      date: new Date('2026-09-05'),
      outputId: prod1Output.id,
      outputQty: 50,
      notes: 'Sesi Produksi Bubblegum Premium (SLTP dicentang)',
      inputs: {
        create: [
          { inputSkuId: sbnRaw.id, qtyUsed: 50 },
          { inputSkuId: pbgRaw.id, qtyUsed: 2.5 }
        ]
      }
    }
  });
  // Mutasi stok untuk RAW & output
  await prisma.inventory.createMany({
    data: [
      { date: new Date('2026-09-05'), skuId: sbnRaw.id, movement: -50, type: MovementType.PRODUCTION, reference: prod1.id },
      { date: new Date('2026-09-05'), skuId: pbgRaw.id, movement: -2.5, type: MovementType.PRODUCTION, reference: prod1.id },
      { date: new Date('2026-09-05'), skuId: sbn1Pbg.id, movement: 50, type: MovementType.PRODUCTION, reference: prod1.id }
    ]
  });
  await prisma.sKUCostHistory.create({ data: { skuId: sbn1Pbg.id, stock: 50, avgCost: 12000 } });
  await prisma.sKUCostHistory.update({ where: { skuId: sbnRaw.id }, data: { stock: { decrement: 50 } } });
  await prisma.sKUCostHistory.update({ where: { skuId: pbgRaw.id }, data: { stock: { decrement: 2.5 } } });
  // Potong stok kemasan otomatis & manual (karena dicentang)
  await prisma.masterItemKemasan.update({ where: { id: btl1.id }, data: { stock: { decrement: 50 } } });
  await prisma.masterItemKemasan.update({ where: { id: sltp.id }, data: { stock: { decrement: 1 } } }); // MANUAL dicentang

  // Produksi 2: PLWR tidak dicentang (stok tidak berubah)
  const prod2Output = await prisma.productionOutput.create({ data: { skuId: sbn2Pcf.id } });
  const prod2 = await prisma.production.create({
    data: {
      date: new Date('2026-09-06'),
      outputId: prod2Output.id,
      outputQty: 100,
      notes: 'Sesi Produksi Sabun Kopi (PLWR tidak dicentang)',
      inputs: {
        create: [
          { inputSkuId: sbnRaw.id, qtyUsed: 50 },
          { inputSkuId: pcfRaw.id, qtyUsed: 2.5 }
        ]
      }
    }
  });
  await prisma.inventory.createMany({
    data: [
      { date: new Date('2026-09-06'), skuId: sbnRaw.id, movement: -50, type: MovementType.PRODUCTION, reference: prod2.id },
      { date: new Date('2026-09-06'), skuId: pcfRaw.id, movement: -2.5, type: MovementType.PRODUCTION, reference: prod2.id },
      { date: new Date('2026-09-06'), skuId: sbn2Pcf.id, movement: 100, type: MovementType.PRODUCTION, reference: prod2.id }
    ]
  });
  await prisma.sKUCostHistory.create({ data: { skuId: sbn2Pcf.id, stock: 100, avgCost: 7000 } });
  await prisma.sKUCostHistory.update({ where: { skuId: sbnRaw.id }, data: { stock: { decrement: 50 } } });
  await prisma.sKUCostHistory.update({ where: { skuId: pcfRaw.id }, data: { stock: { decrement: 2.5 } } });
  await prisma.masterItemKemasan.update({ where: { id: btl500.id }, data: { stock: { decrement: 100 } } });
  // plwr.id tidak diupdate karena tidak dicentang!

  // Produksi 3: SBN3-PVL (output: 13 unit -> setelah terjual 5 & affiliate 5, sisa stock = 3; stockMin = 10)
  const prod3Output = await prisma.productionOutput.create({ data: { skuId: sbn3Pvl.id } });
  const prod3 = await prisma.production.create({
    data: {
      date: new Date('2026-09-06'),
      outputId: prod3Output.id,
      outputQty: 13,
      notes: 'Sesi Produksi Sabun Vanila 100ml',
      inputs: {
        create: [
          { inputSkuId: sbnRaw.id, qtyUsed: 0.065 },
          { inputSkuId: pvlRaw.id, qtyUsed: 0.0052 }
        ]
      }
    }
  });
  await prisma.inventory.createMany({
    data: [
      { date: new Date('2026-09-06'), skuId: sbnRaw.id, movement: -0.065, type: MovementType.PRODUCTION, reference: prod3.id },
      { date: new Date('2026-09-06'), skuId: pvlRaw.id, movement: -0.0052, type: MovementType.PRODUCTION, reference: prod3.id },
      { date: new Date('2026-09-06'), skuId: sbn3Pvl.id, movement: 13, type: MovementType.PRODUCTION, reference: prod3.id }
    ]
  });
  await prisma.sKUCostHistory.create({ data: { skuId: sbn3Pvl.id, stock: 13, avgCost: 3000 } });
  await prisma.sKUCostHistory.update({ where: { skuId: sbnRaw.id }, data: { stock: { decrement: 0.065 } } });
  await prisma.sKUCostHistory.update({ where: { skuId: pvlRaw.id }, data: { stock: { decrement: 0.0052 } } });
  await prisma.masterItemKemasan.update({ where: { id: btl100.id }, data: { stock: { decrement: 13 } } });

  console.log('--- SEEDING SALES (PURE MARKETPLACE CHANNELS) ---');
  const sales = [
    { date: '2026-09-07', channel: Channel.SHOPEE, skuId: sbn1Pbg.id, qty: 10, unitPrice: 25000, fee: 2000, orderId: 'SHP-101', netRevenue: 248000, total: 250000 },
    { date: '2026-09-08', channel: Channel.TIKTOK, skuId: sbn2Pcf.id, qty: 15, unitPrice: 15000, fee: 1500, orderId: 'TT-201', netRevenue: 223500, total: 225000 },
    { date: '2026-09-08', channel: Channel.OFFLINE, skuId: sbn3Pvl.id, qty: 5, unitPrice: 5000, fee: 0, orderId: 'OFF-301', netRevenue: 25000, total: 25000 },
    { date: '2026-09-09', channel: Channel.SHOPEE, skuId: sbn1Pbg.id, qty: 5, unitPrice: 25000, fee: 1000, orderId: 'SHP-102', netRevenue: 124000, total: 125000 },
  ];

  for (const s of sales) {
    const sale = await prisma.sale.create({
      data: { ...s, date: new Date(s.date) }
    });
    await prisma.inventory.create({
      data: { date: new Date(s.date), skuId: s.skuId, movement: -s.qty, type: MovementType.SALE, reference: sale.id }
    });
    const ch = await prisma.sKUCostHistory.findUnique({ where: { skuId: s.skuId } });
    if (ch) {
      await prisma.sKUCostHistory.update({ where: { skuId: s.skuId }, data: { stock: { decrement: s.qty } } });
    }
  }

  console.log('--- SEEDING AFFILIATE & NON-AFFILIATE ACTIVITIES ---');
  const affiliateActivities = [
    {
      date: new Date('2026-09-07'),
      activityType: AffiliateActivityType.AFFILIATE,
      accountUsername: '@dapur_bunda_wina',
      realName: 'Wina Andriani',
      skuId: sbn1Pbg.id,
      qty: 2,
      courier: 'J&T Express',
      shippingCost: 18000,
      marketplace: 'TikTok',
      followers: '240K',
      affiliateData: '1.420 klik, 95 keranjang',
      notes: 'Seeding video review kebersihan dapur'
    },
    {
      date: new Date('2026-09-08'),
      activityType: AffiliateActivityType.AFFILIATE,
      accountUsername: '@racunshopee_lifestyle',
      realName: 'Rian Pratama',
      skuId: sbn2Pcf.id,
      qty: 3,
      courier: 'SiCepat',
      shippingCost: 14000,
      marketplace: 'Shopee',
      followers: '580K',
      affiliateData: '3.100 klik, 142 pesanan',
      notes: 'Live streaming Shopee campaign 9.9'
    },
    {
      date: new Date('2026-09-09'),
      activityType: AffiliateActivityType.AFFILIATE,
      accountUsername: '@aroma.rumah.id',
      realName: 'Dinda Lestari',
      skuId: sbn3Pvl.id,
      qty: 5,
      courier: 'SPX Express',
      shippingCost: 11000,
      marketplace: 'Shopee',
      followers: '85K',
      affiliateData: '620 klik, 38 pesanan',
      notes: 'Spill produk hampers aroma wangi'
    },
    {
      date: new Date('2026-09-10'),
      activityType: AffiliateActivityType.AFFILIATE,
      accountUsername: '@bersihkinclong.daily',
      realName: 'Hendra Wijaya',
      skuId: sbn1Pbg.id,
      qty: 2,
      courier: 'J&T Express',
      shippingCost: 19000,
      marketplace: 'TikTok',
      followers: '410K',
      affiliateData: '2.800 klik, 110 order',
      notes: 'Review bundling sabun cuci tangan viral'
    },
    {
      date: new Date('2026-09-06'),
      activityType: AffiliateActivityType.NON_AFFILIATE,
      accountUsername: null,
      realName: 'Yudhis Pratama',
      skuId: sbn1Pbg.id,
      qty: 2,
      courier: null,
      shippingCost: 0,
      marketplace: null,
      followers: null,
      affiliateData: null,
      notes: 'Compliment Yudhis'
    },
    {
      date: new Date('2026-09-07'),
      activityType: AffiliateActivityType.NON_AFFILIATE,
      accountUsername: null,
      realName: 'Event Organizer Jakarta Expo',
      skuId: sbn2Pcf.id,
      qty: 4,
      courier: 'GoSend Instant',
      shippingCost: 35000,
      marketplace: null,
      followers: null,
      affiliateData: null,
      notes: 'Marketing Sample Event Booth FMCG'
    }
  ];

  for (const act of affiliateActivities) {
    const activity = await prisma.affiliateActivity.create({
      data: act
    });
    await prisma.inventory.create({
      data: {
        date: act.date,
        skuId: act.skuId,
        movement: -act.qty,
        type: MovementType.AFFILIATE_SEEDING,
        reference: activity.id
      }
    });
    const ch = await prisma.sKUCostHistory.findUnique({ where: { skuId: act.skuId } });
    if (ch) {
      await prisma.sKUCostHistory.update({
        where: { skuId: act.skuId },
        data: { stock: { decrement: act.qty } }
      });
    }
  }

  console.log('--- SEEDING OTHER EXPENSES ---');
  await prisma.otherExpense.createMany({
    data: [
      { date: new Date('2026-09-05'), category: ExpenseCategory.BONUS, recipient: 'Budi Santoso', amount: 500000, notes: 'Bonus performa tim produksi bulanan' },
      { date: new Date('2026-09-06'), category: ExpenseCategory.COMPLIMENT, recipient: 'Influencer Cantik', amount: 350000, notes: 'Compliment product package review' }
    ]
  });

  console.log('--- SEEDING LOST & BREAKAGE ---');
  const breakageItems = [
    { date: '2026-09-08', skuId: sbn1Pbg.id, qty: 2, category: BreakageCategory.RUSAK, unitPrice: 12000, total: 24000, notes: 'Botol pecah saat pemindahan rak' },
    { date: '2026-09-09', skuId: sbn2Pcf.id, qty: 1, category: BreakageCategory.HILANG, unitPrice: 7000, total: 7000, notes: 'Selisih hilang saat stock opname awal' }
  ];

  for (const b of breakageItems) {
    const breakage = await prisma.breakage.create({
      data: { ...b, date: new Date(b.date) }
    });
    await prisma.inventory.create({
      data: { date: new Date(b.date), skuId: b.skuId, movement: -b.qty, type: MovementType.BREAKAGE, reference: breakage.id }
    });
    await prisma.sKUCostHistory.update({ where: { skuId: b.skuId }, data: { stock: { decrement: b.qty } } });
  }

  console.log('--- SEEDING COMPLETE SUCCESSFULLY ---');
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
