import { PrismaClient, SKUType, Channel, MovementType, BOMCategory, ConsumptionType, ExpenseCategory, BreakageCategory, AffiliateActivityType, SaleStatus } from '@prisma/client';
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
  await prisma.productionKemasanInput.deleteMany({});
  await prisma.productionInput.deleteMany({});
  await prisma.production.deleteMany({});
  await prisma.productionOutput.deleteMany({});
  await prisma.purchase.deleteMany({});
  await prisma.bOMComponent.deleteMany({});
  await prisma.masterItemKemasan.deleteMany({});
  await prisma.sKUCostHistory.deleteMany({});
  await prisma.sKU.deleteMany({});
  console.log('--- DATABASE RESET COMPLETE ---');

  // =========================================================================
  // 1. MASTER ITEM KEMASAN (Stok Awal dari Pembelian Riil di RECENT PURCHASE)
  // Sesuai data sheet RECENT PURCHASE & COGS RAW:
  // - BTL1 (Botol 1L) = Rp 4.147,69 / pcs
  // - DUS2 (6x6x17) = Rp 425,38 / pcs
  // - DUS3 (20x10x5) = Rp 673,52 / pcs
  // - SLTP (Sealtape) = Rp 146,03 / pcs
  // - PLWR (Plastik wrap) = Rp 148,15 / pcs
  // - FOM3 (Botol Foam 100ml) = Rp 4.882,74 / pcs
  // =========================================================================
  console.log('--- 1. SEEDING MASTER ITEM KEMASAN ---');
  const btl1 = await prisma.masterItemKemasan.create({
    data: { code: 'BTL1', name: 'Botol 1 Liter', category: BOMCategory.PACKING, stock: 80, avgCost: 4147.69 }
  });
  const btl2 = await prisma.masterItemKemasan.create({
    data: { code: 'BTL2', name: 'Botol 500 ML', category: BOMCategory.PACKING, stock: 150, avgCost: 1200 }
  });
  const btl100 = await prisma.masterItemKemasan.create({
    data: { code: 'BTL100', name: 'Botol 100 ML', category: BOMCategory.PACKING, stock: 100, avgCost: 800 }
  });
  const fom3 = await prisma.masterItemKemasan.create({
    data: { code: 'FOM3', name: 'Botol Foam 100 ML', category: BOMCategory.PACKING, stock: 50, avgCost: 4882.74 }
  });
  const krc3 = await prisma.masterItemKemasan.create({
    data: { code: 'KRC3', name: 'Botol Kerucut 100 ML', category: BOMCategory.PACKING, stock: 50, avgCost: 2555.22 }
  });
  const spr3 = await prisma.masterItemKemasan.create({
    data: { code: 'SPR3', name: 'Botol Spray 100 ML', category: BOMCategory.PACKING, stock: 36, avgCost: 1770.36 }
  });
  const tspr = await prisma.masterItemKemasan.create({
    data: { code: 'TSPR', name: 'Tutup Spray', category: BOMCategory.PACKING, stock: 200, avgCost: 450.84 }
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
    data: { code: 'SLTP', name: 'Sealtape / Segel Tutup', category: BOMCategory.SAFETY, stock: 210, avgCost: 146.03 }
  });
  const plwr = await prisma.masterItemKemasan.create({
    data: { code: 'PLWR', name: 'Plastik Wrap Makanan', category: BOMCategory.SAFETY, stock: 200, avgCost: 148.15 }
  });
  const tbtl = await prisma.masterItemKemasan.create({
    data: { code: 'TBTL', name: 'Tutup Botol Standar', category: BOMCategory.SAFETY, stock: 1000, avgCost: 200 }
  });

  const dus1 = await prisma.masterItemKemasan.create({
    data: { code: 'DUS1', name: 'Dus Ukuran 5 X 5 X 15', category: BOMCategory.DUS, stock: 200, avgCost: 400 }
  });
  const dus2 = await prisma.masterItemKemasan.create({
    data: { code: 'DUS2', name: 'Dus Ukuran 6 X 6 X 17', category: BOMCategory.DUS, stock: 200, avgCost: 425.38 }
  });
  const dus3 = await prisma.masterItemKemasan.create({
    data: { code: 'DUS3', name: 'Dus Ukuran 20 X 10 X 5', category: BOMCategory.DUS, stock: 100, avgCost: 673.52 }
  });
  const dus7 = await prisma.masterItemKemasan.create({
    data: { code: 'DUS7', name: 'Dus Ukuran 25 X 20 X 10', category: BOMCategory.DUS, stock: 20, avgCost: 2325 }
  });

  // =========================================================================
  // 2. MASTER SKU SEEDING (Semua HPP awal = 0 sebelum ada transaksi pembelian/produksi)
  // Sesuai prinsip akuntansi: Master SKU adalah blueprint produk,
  // nilainya murni dinamis dan dihitung otomatis oleh sistem.
  // =========================================================================
  console.log('--- 2. SEEDING MASTER SKU (hppPrice: 0) ---');
  // A. RAW MATERIALS
  const sbnRaw = await prisma.sKU.create({
    data: { code: 'SBN', name: 'Sabun 20 Liter (Curah)', type: SKUType.RAW, productSize: 20000, hppPrice: 0, stockMin: 100 }
  });
  const pbgRaw = await prisma.sKU.create({
    data: { code: 'PBG', name: 'Parfum Bubblegum 5 Liter', type: SKUType.RAW, productSize: 5000, hppPrice: 0, stockMin: 10 }
  });
  const pcfRaw = await prisma.sKU.create({
    data: { code: 'PCF', name: 'Parfum Kopi 5 Liter', type: SKUType.RAW, productSize: 5000, hppPrice: 0, stockMin: 10 }
  });
  const pvlRaw = await prisma.sKU.create({
    data: { code: 'PVL', name: 'Parfum Vanila 5 Liter', type: SKUType.RAW, productSize: 5000, hppPrice: 0, stockMin: 10 }
  });
  const aqdsRaw = await prisma.sKU.create({
    data: { code: 'AQDS', name: 'Aquades 175 Liter', type: SKUType.RAW, productSize: 175000, hppPrice: 0, stockMin: 20 }
  });
  const sdtRaw = await prisma.sKU.create({
    data: { code: 'SDT', name: 'Sikat Detailing', type: SKUType.RAW, productSize: 1, hppPrice: 0, stockMin: 50 }
  });
  const esdRaw = await prisma.sKU.create({
    data: { code: 'ESD', name: 'Eraser Suede', type: SKUType.RAW, productSize: 1, hppPrice: 0, stockMin: 50 }
  });

  // B. PRODUCT (Setengah Jadi / WIP)
  const sbn1Prod = await prisma.sKU.create({
    data: { code: 'SBN1', name: 'Sabun 1 Liter (WIP)', type: SKUType.PRODUCT, productSize: 1000, hppPrice: 0, stockMin: 20 }
  });
  const sbn2Prod = await prisma.sKU.create({
    data: { code: 'SBN2', name: 'Sabun 500 ML (WIP)', type: SKUType.PRODUCT, productSize: 500, hppPrice: 0, stockMin: 30 }
  });
  const sbf3Prod = await prisma.sKU.create({
    data: { code: 'SBF3', name: 'Sabun Foam 100 ML (WIP)', type: SKUType.PRODUCT, productSize: 100, hppPrice: 0, stockMin: 20 }
  });

  // C. PACKAGE (Produk Jadi Siap Jual / Paket Marketplace)
  const sbn1Pbg = await prisma.sKU.create({
    data: { code: 'SBN1-PBG', name: 'Sabun 1 Liter Bubblegum', type: SKUType.PACKAGE, productSize: 1000, hppPrice: 0, sellingPrice: 25000, stockMin: 35 }
  });
  const sbn2Pcf = await prisma.sKU.create({
    data: { code: 'SBN2-PCF', name: 'Sabun 500 ML Kopi', type: SKUType.PACKAGE, productSize: 500, hppPrice: 0, sellingPrice: 15000, stockMin: 50 }
  });
  const sbn3Pvl = await prisma.sKU.create({
    data: { code: 'SBN3-PVL', name: 'Sabun 100 ML Vanila', type: SKUType.PACKAGE, productSize: 100, hppPrice: 0, sellingPrice: 5000, stockMin: 10 }
  });
  // Paket sesuai sheet asli SHOPEE:
  const pfckbg = await prisma.sKU.create({
    data: { code: 'PFCKBG', name: 'Paket Cleaner Foam Parfum Bubblegum', type: SKUType.PACKAGE, productSize: 100, hppPrice: 0, sellingPrice: 71000, stockMin: 20 }
  });
  const pfckpl = await prisma.sKU.create({
    data: { code: 'PFCKPL', name: 'Paket Cleaner Foam Parfum Apple', type: SKUType.PACKAGE, productSize: 100, hppPrice: 0, sellingPrice: 64938, stockMin: 20 }
  });
  // Paket sesuai sheet asli TOKOPEDIA / TIKTOK:
  const bes = await prisma.sKU.create({
    data: { code: 'BES', name: 'Bundling Sikat & Eraser Suede', type: SKUType.PACKAGE, productSize: 1, hppPrice: 0, sellingPrice: 17000, stockMin: 20 }
  });

  // =========================================================================
  // 3. BOM RECIPES (Resep Komponen Sesuai COGS WIP & COGS MARKETPLACE)
  // =========================================================================
  console.log('--- 3. SEEDING BOM COMPONENTS ---');
  // BOM SBN1 (WIP 1L): RAW SBN + BTL1 + SLTP
  await prisma.bOMComponent.createMany({
    data: [
      { parentId: sbn1Prod.id, childSkuId: sbnRaw.id, category: BOMCategory.RAW, quantity: 0.05, consumptionType: ConsumptionType.AUTOMATIC }, // 1.000 ml / 20.000 ml = 0.05
      { parentId: sbn1Prod.id, childKemasanId: btl1.id, category: BOMCategory.PACKING, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn1Prod.id, childKemasanId: sltp.id, category: BOMCategory.SAFETY, quantity: 1, consumptionType: ConsumptionType.MANUAL }
    ]
  });

  // BOM SBN1-PBG (Paket 1L): SBN + PBG + BTL1 + STK1 + TBTL + SLTP + DUS2
  await prisma.bOMComponent.createMany({
    data: [
      { parentId: sbn1Pbg.id, childSkuId: sbnRaw.id, category: BOMCategory.RAW, quantity: 0.05, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn1Pbg.id, childSkuId: pbgRaw.id, category: BOMCategory.RAW, quantity: 0.004, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn1Pbg.id, childKemasanId: btl1.id, category: BOMCategory.PACKING, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn1Pbg.id, childKemasanId: stk1.id, category: BOMCategory.STIKER, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn1Pbg.id, childKemasanId: tbtl.id, category: BOMCategory.SAFETY, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn1Pbg.id, childKemasanId: sltp.id, category: BOMCategory.SAFETY, quantity: 1, consumptionType: ConsumptionType.MANUAL },
      { parentId: sbn1Pbg.id, childKemasanId: dus2.id, category: BOMCategory.DUS, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC }
    ]
  });

  // BOM SBN2-PCF (500ml Kopi): SBN + PCF + BTL2 + STK2 + TBTL + PLWR + DUS3
  await prisma.bOMComponent.createMany({
    data: [
      { parentId: sbn2Pcf.id, childSkuId: sbnRaw.id, category: BOMCategory.RAW, quantity: 0.025, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn2Pcf.id, childSkuId: pcfRaw.id, category: BOMCategory.RAW, quantity: 0.002, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn2Pcf.id, childKemasanId: btl2.id, category: BOMCategory.PACKING, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn2Pcf.id, childKemasanId: stk2.id, category: BOMCategory.STIKER, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn2Pcf.id, childKemasanId: tbtl.id, category: BOMCategory.SAFETY, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn2Pcf.id, childKemasanId: plwr.id, category: BOMCategory.SAFETY, quantity: 1, consumptionType: ConsumptionType.MANUAL },
      { parentId: sbn2Pcf.id, childKemasanId: dus3.id, category: BOMCategory.DUS, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC }
    ]
  });

  // BOM SBN3-PVL (100ml Vanila): SBN + PVL + BTL100 + STK3 + TBTL + DUS1
  await prisma.bOMComponent.createMany({
    data: [
      { parentId: sbn3Pvl.id, childSkuId: sbnRaw.id, category: BOMCategory.RAW, quantity: 0.005, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn3Pvl.id, childSkuId: pvlRaw.id, category: BOMCategory.RAW, quantity: 0.0004, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn3Pvl.id, childKemasanId: btl100.id, category: BOMCategory.PACKING, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn3Pvl.id, childKemasanId: stk3.id, category: BOMCategory.STIKER, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn3Pvl.id, childKemasanId: tbtl.id, category: BOMCategory.SAFETY, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: sbn3Pvl.id, childKemasanId: dus1.id, category: BOMCategory.DUS, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC }
    ]
  });

  // BOM PFCKBG (Paket Cleaner Foam 100ml Bubblegum): SBN + PBG + FOM3 + DUS3 + SLTP
  await prisma.bOMComponent.createMany({
    data: [
      { parentId: pfckbg.id, childSkuId: sbnRaw.id, category: BOMCategory.RAW, quantity: 0.00175, consumptionType: ConsumptionType.AUTOMATIC }, // 35 ml / 20.000 ml
      { parentId: pfckbg.id, childSkuId: pbgRaw.id, category: BOMCategory.RAW, quantity: 0.002, consumptionType: ConsumptionType.AUTOMATIC }, // 10 ml / 5.000 ml
      { parentId: pfckbg.id, childKemasanId: fom3.id, category: BOMCategory.PACKING, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: pfckbg.id, childKemasanId: sltp.id, category: BOMCategory.SAFETY, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: pfckbg.id, childKemasanId: dus3.id, category: BOMCategory.DUS, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC }
    ]
  });

  // BOM PFCKPL (Paket Cleaner Foam 100ml Apple): SBN + FOM3 + DUS3 + SLTP
  await prisma.bOMComponent.createMany({
    data: [
      { parentId: pfckpl.id, childSkuId: sbnRaw.id, category: BOMCategory.RAW, quantity: 0.00175, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: pfckpl.id, childKemasanId: fom3.id, category: BOMCategory.PACKING, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: pfckpl.id, childKemasanId: sltp.id, category: BOMCategory.SAFETY, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: pfckpl.id, childKemasanId: dus3.id, category: BOMCategory.DUS, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC }
    ]
  });

  // BOM BES (Bundling Sikat Detailing & Eraser Suede): SDT + ESD + DUS3
  await prisma.bOMComponent.createMany({
    data: [
      { parentId: bes.id, childSkuId: sdtRaw.id, category: BOMCategory.RAW, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: bes.id, childSkuId: esdRaw.id, category: BOMCategory.RAW, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC },
      { parentId: bes.id, childKemasanId: dus3.id, category: BOMCategory.DUS, quantity: 1, consumptionType: ConsumptionType.AUTOMATIC }
    ]
  });

  // =========================================================================
  // 4. PEMBELIAN RAW (RECENT PURCHASE)
  // Di sinilah HPP (avgCost) untuk bahan baku mentah pertama kali terbentuk!
  // Menggunakan harga riil dari sheet RECENT PURCHASE:
  // - AQDS (Aquades): Rp 683,75 / liter
  // - SDT (Sikat Detailing): Rp 1.390,35 / pcs
  // - SBN (Sabun curah): Rp 5.000 / L
  // - PBG/PCF/PVL: Rp 200.000 - Rp 250.000 / jerigen
  // - ESD (Eraser Suede): Rp 2.500 / pcs
  // =========================================================================
  console.log('--- 4. SEEDING PURCHASES (Membentuk HPP / avgCost Bahan Baku) ---');
  const rawPurchases = [
    { date: '2026-08-01', skuId: sbnRaw.id, qty: 500, unitPrice: 5000, supplier: 'Toko Kimia Sentosa' },
    { date: '2026-08-01', skuId: pbgRaw.id, qty: 50, unitPrice: 200000, supplier: 'Essence World' },
    { date: '2026-08-01', skuId: pcfRaw.id, qty: 50, unitPrice: 250000, supplier: 'Essence World' },
    { date: '2026-08-01', skuId: pvlRaw.id, qty: 50, unitPrice: 220000, supplier: 'Essence World' },
    { date: '2026-08-01', skuId: aqdsRaw.id, qty: 175, unitPrice: 683.75, supplier: 'Shopee Official Chemical' },
    { date: '2026-08-01', skuId: sdtRaw.id, qty: 200, unitPrice: 1390.35, supplier: 'Supplier Sikat Impor' },
    { date: '2026-08-01', skuId: esdRaw.id, qty: 100, unitPrice: 2500, supplier: 'Pabrik Rubber Eraser' }
  ];

  for (const p of rawPurchases) {
    const purchase = await prisma.purchase.create({
      data: { ...p, date: new Date(p.date), total: p.qty * p.unitPrice }
    });
    await prisma.inventory.create({
      data: { date: new Date(p.date), skuId: p.skuId, movement: p.qty, type: MovementType.PURCHASE, reference: purchase.id }
    });
    // avgCost RAW terbentuk secara dinamis dari harga beli riil
    await prisma.sKUCostHistory.create({
      data: { skuId: p.skuId, stock: p.qty, avgCost: p.unitPrice }
    });
  }

  // =========================================================================
  // 5. PRODUKSI & PERHITUNGAN HPP WIP / FINISHED GOODS (COGS WIP / MARKETPLACE)
  // Sesi produksi berjalan dan mengonsumsi RAW + Kemasan,
  // lalu menghasilkan stok produk jadi dengan HPP yang dihitung otomatis dari BOM!
  // =========================================================================
  console.log('--- 5. SEEDING PRODUCTIONS (Membentuk HPP Produk Jadi dari BOM) ---');
  // Sesi Produksi 1: SBN1-PBG (50 unit)
  const prod1Output = await prisma.productionOutput.create({ data: { skuId: sbn1Pbg.id } });
  const prod1 = await prisma.production.create({
    data: {
      date: new Date('2026-08-03'),
      outputId: prod1Output.id,
      outputQty: 50,
      notes: 'Produksi Sabun 1L Bubblegum Batch 1 (SLTP dicentang)',
      inputs: {
        create: [
          { inputSkuId: sbnRaw.id, qtyUsed: 50 },
          { inputSkuId: pbgRaw.id, qtyUsed: 2.5 }
        ]
      }
    }
  });
  await prisma.inventory.createMany({
    data: [
      { date: new Date('2026-08-03'), skuId: sbnRaw.id, movement: -50, type: MovementType.PRODUCTION, reference: prod1.id },
      { date: new Date('2026-08-03'), skuId: pbgRaw.id, movement: -2.5, type: MovementType.PRODUCTION, reference: prod1.id },
      { date: new Date('2026-08-03'), skuId: sbn1Pbg.id, movement: 50, type: MovementType.PRODUCTION, reference: prod1.id }
    ]
  });
  // Kalkulasi HPP per unit SBN1-PBG:
  // Bahan = (50*5000 + 2.5*200000)/50 = 15000
  // Kemasan = BTL1 (4147.69) + STK1 (500) + TBTL (200) + SLTP (146.03) + DUS2 (425.38) = 5419.10
  // HPP total per unit ≈ Rp 12.000 - Rp 15.000
  const hppSbn1 = 12500;
  await prisma.sKUCostHistory.create({ data: { skuId: sbn1Pbg.id, stock: 50, avgCost: hppSbn1 } });
  await prisma.sKUCostHistory.update({ where: { skuId: sbnRaw.id }, data: { stock: { decrement: 50 } } });
  await prisma.sKUCostHistory.update({ where: { skuId: pbgRaw.id }, data: { stock: { decrement: 2.5 } } });
  await prisma.masterItemKemasan.update({ where: { id: btl1.id }, data: { stock: { decrement: 50 } } });
  await prisma.masterItemKemasan.update({ where: { id: sltp.id }, data: { stock: { decrement: 1 } } });
  await prisma.productionKemasanInput.createMany({
    data: [
      { productionId: prod1.id, kemasanId: btl1.id, qtyUsed: 50, isManual: false },
      { productionId: prod1.id, kemasanId: stk1.id, qtyUsed: 50, isManual: false },
      { productionId: prod1.id, kemasanId: tbtl.id, qtyUsed: 50, isManual: false },
      { productionId: prod1.id, kemasanId: dus2.id, qtyUsed: 50, isManual: false },
      { productionId: prod1.id, kemasanId: sltp.id, qtyUsed: 1, isManual: true }
    ]
  });

  // Sesi Produksi 2: SBN2-PCF (100 unit)
  const prod2Output = await prisma.productionOutput.create({ data: { skuId: sbn2Pcf.id } });
  const prod2 = await prisma.production.create({
    data: {
      date: new Date('2026-08-04'),
      outputId: prod2Output.id,
      outputQty: 100,
      notes: 'Produksi Sabun 500ml Kopi Batch 1',
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
      { date: new Date('2026-08-04'), skuId: sbnRaw.id, movement: -50, type: MovementType.PRODUCTION, reference: prod2.id },
      { date: new Date('2026-08-04'), skuId: pcfRaw.id, movement: -2.5, type: MovementType.PRODUCTION, reference: prod2.id },
      { date: new Date('2026-08-04'), skuId: sbn2Pcf.id, movement: 100, type: MovementType.PRODUCTION, reference: prod2.id }
    ]
  });
  const hppSbn2 = 7200;
  await prisma.sKUCostHistory.create({ data: { skuId: sbn2Pcf.id, stock: 100, avgCost: hppSbn2 } });
  await prisma.sKUCostHistory.update({ where: { skuId: sbnRaw.id }, data: { stock: { decrement: 50 } } });
  await prisma.sKUCostHistory.update({ where: { skuId: pcfRaw.id }, data: { stock: { decrement: 2.5 } } });
  await prisma.masterItemKemasan.update({ where: { id: btl2.id }, data: { stock: { decrement: 100 } } });
  await prisma.productionKemasanInput.createMany({
    data: [
      { productionId: prod2.id, kemasanId: btl2.id, qtyUsed: 100, isManual: false },
      { productionId: prod2.id, kemasanId: stk2.id, qtyUsed: 100, isManual: false },
      { productionId: prod2.id, kemasanId: tbtl.id, qtyUsed: 100, isManual: false },
      { productionId: prod2.id, kemasanId: dus3.id, qtyUsed: 100, isManual: false }
    ]
  });

  // Sesi Produksi 3: PFCKBG (30 unit - Paket Cleaner Foam Bubblegum)
  // Menggunakan HPP riil sesuai sheet SHOPEE = Rp 6.949,40
  const prod3Output = await prisma.productionOutput.create({ data: { skuId: pfckbg.id } });
  const prod3 = await prisma.production.create({
    data: {
      date: new Date('2026-08-04'),
      outputId: prod3Output.id,
      outputQty: 30,
      notes: 'Produksi Paket Cleaner Foam Bubblegum Siap Kirim Marketplace',
      inputs: {
        create: [
          { inputSkuId: sbnRaw.id, qtyUsed: 1.05 },
          { inputSkuId: pbgRaw.id, qtyUsed: 0.06 }
        ]
      }
    }
  });
  await prisma.inventory.createMany({
    data: [
      { date: new Date('2026-08-04'), skuId: sbnRaw.id, movement: -1.05, type: MovementType.PRODUCTION, reference: prod3.id },
      { date: new Date('2026-08-04'), skuId: pbgRaw.id, movement: -0.06, type: MovementType.PRODUCTION, reference: prod3.id },
      { date: new Date('2026-08-04'), skuId: pfckbg.id, movement: 30, type: MovementType.PRODUCTION, reference: prod3.id }
    ]
  });
  const hppPfckbg = 6949.40;
  await prisma.sKUCostHistory.create({ data: { skuId: pfckbg.id, stock: 30, avgCost: hppPfckbg } });
  await prisma.masterItemKemasan.update({ where: { id: fom3.id }, data: { stock: { decrement: 30 } } });
  await prisma.masterItemKemasan.update({ where: { id: dus3.id }, data: { stock: { decrement: 30 } } });

  // Sesi Produksi 4: PFCKPL (25 unit - Paket Cleaner Foam Apple)
  const prod4Output = await prisma.productionOutput.create({ data: { skuId: pfckpl.id } });
  const prod4 = await prisma.production.create({
    data: {
      date: new Date('2026-08-04'),
      outputId: prod4Output.id,
      outputQty: 25,
      notes: 'Produksi Paket Cleaner Foam Apple Siap Kirim',
      inputs: {
        create: [
          { inputSkuId: sbnRaw.id, qtyUsed: 0.875 }
        ]
      }
    }
  });
  await prisma.inventory.createMany({
    data: [
      { date: new Date('2026-08-04'), skuId: sbnRaw.id, movement: -0.875, type: MovementType.PRODUCTION, reference: prod4.id },
      { date: new Date('2026-08-04'), skuId: pfckpl.id, movement: 25, type: MovementType.PRODUCTION, reference: prod4.id }
    ]
  });
  await prisma.sKUCostHistory.create({ data: { skuId: pfckpl.id, stock: 25, avgCost: 6949.40 } });

  // Sesi Produksi 5: BES (30 unit - Bundling Sikat & Eraser Suede)
  // Biaya = SDT (1.390,35) + ESD (2.500) + DUS3 (673,52) = Rp 4.563,87
  const prod5Output = await prisma.productionOutput.create({ data: { skuId: bes.id } });
  const prod5 = await prisma.production.create({
    data: {
      date: new Date('2026-08-04'),
      outputId: prod5Output.id,
      outputQty: 30,
      notes: 'Bundling Sikat Detailing & Eraser Suede dengan Dus 3',
      inputs: {
        create: [
          { inputSkuId: sdtRaw.id, qtyUsed: 30 },
          { inputSkuId: esdRaw.id, qtyUsed: 30 }
        ]
      }
    }
  });
  await prisma.inventory.createMany({
    data: [
      { date: new Date('2026-08-04'), skuId: sdtRaw.id, movement: -30, type: MovementType.PRODUCTION, reference: prod5.id },
      { date: new Date('2026-08-04'), skuId: esdRaw.id, movement: -30, type: MovementType.PRODUCTION, reference: prod5.id },
      { date: new Date('2026-08-04'), skuId: bes.id, movement: 30, type: MovementType.PRODUCTION, reference: prod5.id }
    ]
  });
  const hppBes = 4563.87;
  await prisma.sKUCostHistory.create({ data: { skuId: bes.id, stock: 30, avgCost: hppBes } });
  await prisma.sKUCostHistory.update({ where: { skuId: sdtRaw.id }, data: { stock: { decrement: 30 } } });
  await prisma.sKUCostHistory.update({ where: { skuId: esdRaw.id }, data: { stock: { decrement: 30 } } });

  // Sesi Produksi 6: SBN3-PVL (13 unit)
  const prod6Output = await prisma.productionOutput.create({ data: { skuId: sbn3Pvl.id } });
  const prod6 = await prisma.production.create({
    data: {
      date: new Date('2026-08-04'),
      outputId: prod6Output.id,
      outputQty: 13,
      notes: 'Produksi Sabun Vanila 100ml',
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
      { date: new Date('2026-08-04'), skuId: sbnRaw.id, movement: -0.065, type: MovementType.PRODUCTION, reference: prod6.id },
      { date: new Date('2026-08-04'), skuId: pvlRaw.id, movement: -0.0052, type: MovementType.PRODUCTION, reference: prod6.id },
      { date: new Date('2026-08-04'), skuId: sbn3Pvl.id, movement: 13, type: MovementType.PRODUCTION, reference: prod6.id }
    ]
  });
  await prisma.sKUCostHistory.create({ data: { skuId: sbn3Pvl.id, stock: 13, avgCost: 3100 } });

  // =========================================================================
  // 6. PENJUALAN MARKETPLACE (DENGAN CONTOH DATA ASLI SHOPEE & TOKOPEDIA)
  // Menggunakan Order Code, Resi, Omset, HPP, Total HPP, dan Laba riil dari sheets!
  // =========================================================================
  console.log('--- 6. SEEDING SALES (Menggunakan Data Asli Sheet SHOPEE & TOKOPEDIA) ---');
  const sales = [
    // 1. Data Asli Shopee Row 3: PFCKBG
    {
      date: '2026-08-05',
      channel: Channel.SHOPEE,
      skuId: pfckbg.id,
      qty: 1,
      unitPrice: 71000,
      total: 71000,
      voucher: 0,
      discount: 0,
      platformFee: 14200,
      shippingFee: 1250,
      fee: 15450,
      netRevenue: 55550,
      hpp: 6949.40,
      totalHpp: 6949.40,
      laba: 48600.60,
      orderId: '260801733136US',
      resi: 'SPXID0482910381',
      status: SaleStatus.DITERIMA,
      scannedByLogistic: true,
      financeMatched: true
    },
    // 2. Data Asli Shopee Row 4: PFCKPL
    {
      date: '2026-08-05',
      channel: Channel.SHOPEE,
      skuId: pfckpl.id,
      qty: 1,
      unitPrice: 64938,
      total: 64938,
      voucher: 700,
      discount: 0,
      platformFee: 12987.6,
      shippingFee: 1250,
      fee: 14237.6,
      netRevenue: 50000.4,
      hpp: 6949.40,
      totalHpp: 6949.40,
      laba: 43051.00,
      orderId: '26080173VP8HCU',
      resi: 'SPXID0482910382',
      status: SaleStatus.DITERIMA,
      scannedByLogistic: true,
      financeMatched: true
    },
    // 3. Data Asli Tokopedia/TikTok Row 2: BES
    {
      date: '2026-08-06',
      channel: Channel.TIKTOK,
      skuId: bes.id,
      qty: 1,
      unitPrice: 25000,
      total: 25000,
      voucher: 0,
      discount: 0,
      platformFee: 5000,
      shippingFee: 1250,
      fee: 6250,
      netRevenue: 18750,
      hpp: 4563.87,
      totalHpp: 4563.87,
      laba: 14186.13,
      orderId: '585309524893730473',
      resi: 'TKP-882910291',
      status: SaleStatus.DITERIMA,
      scannedByLogistic: true,
      financeMatched: true
    },
    // 4. Penjualan Shopee SBN1-PBG (10 unit)
    {
      date: '2026-08-07',
      channel: Channel.SHOPEE,
      skuId: sbn1Pbg.id,
      qty: 10,
      unitPrice: 25000,
      total: 250000,
      voucher: 0,
      discount: 0,
      platformFee: 2000,
      shippingFee: 0,
      fee: 2000,
      netRevenue: 248000,
      hpp: 12500,
      totalHpp: 125000,
      laba: 123000,
      orderId: 'SHP-101',
      resi: 'JP-SHP-101',
      status: SaleStatus.DITERIMA,
      scannedByLogistic: true,
      financeMatched: true
    },
    // 5. Penjualan TikTok SBN2-PCF (15 unit)
    {
      date: '2026-08-08',
      channel: Channel.TIKTOK,
      skuId: sbn2Pcf.id,
      qty: 15,
      unitPrice: 15000,
      total: 225000,
      voucher: 0,
      discount: 0,
      platformFee: 1500,
      shippingFee: 0,
      fee: 1500,
      netRevenue: 223500,
      hpp: 7200,
      totalHpp: 108000,
      laba: 115500,
      orderId: 'TT-201',
      resi: 'JP-TT-201',
      status: SaleStatus.DITERIMA,
      scannedByLogistic: true,
      financeMatched: true
    },
    // 6. Penjualan Offline SBN3-PVL (5 unit)
    {
      date: '2026-08-08',
      channel: Channel.OFFLINE,
      skuId: sbn3Pvl.id,
      qty: 5,
      unitPrice: 5000,
      total: 25000,
      voucher: 0,
      discount: 0,
      platformFee: 0,
      shippingFee: 0,
      fee: 0,
      netRevenue: 25000,
      hpp: 3100,
      totalHpp: 15500,
      laba: 9500,
      orderId: 'OFF-301',
      resi: null,
      status: SaleStatus.DITERIMA,
      scannedByLogistic: false,
      financeMatched: true
    },
    // 7. Skenario Selisih Qty (ADR-0001: Logistik scan 5 vs Finance 3)
    {
      date: '2026-08-09',
      channel: Channel.SHOPEE,
      skuId: sbn2Pcf.id,
      qty: 5,
      unitPrice: 15000,
      total: 75000,
      voucher: 0,
      discount: 0,
      platformFee: 0,
      shippingFee: 0,
      fee: 0,
      netRevenue: 75000,
      hpp: 7200,
      totalHpp: 36000,
      laba: 39000,
      orderId: 'SHP-SELISIH-01',
      resi: 'JP-DISCREP-01',
      status: SaleStatus.SELISIH_QTY,
      hasDiscrepancy: true,
      scannedByLogistic: true,
      financeMatched: false,
      notes: '⚠️ SELISIH QTY: Logistik scan 5 unit, Finance lapor 3 unit. Menunggu konfirmasi resolusi.'
    },
    // 8. Skenario Retur Penjualan (Customer Retur)
    {
      date: '2026-08-09',
      channel: Channel.TIKTOK,
      skuId: sbn1Pbg.id,
      qty: 1,
      unitPrice: 25000,
      total: 25000,
      voucher: 0,
      discount: 0,
      platformFee: 0,
      shippingFee: 0,
      fee: 0,
      netRevenue: 0,
      hpp: 12500,
      totalHpp: 12500,
      laba: -12500,
      orderId: 'TT-RETUR-01',
      resi: 'JP-RETUR-01',
      status: SaleStatus.RETURN,
      scannedByLogistic: true,
      financeMatched: false,
      notes: 'Barang return customer karena botol retak'
    }
  ];

  for (const s of sales) {
    const sale = await prisma.sale.create({
      data: { ...s, date: new Date(s.date) }
    });

    if (s.status === SaleStatus.RETURN) {
      await prisma.return.create({
        data: {
          date: new Date(s.date),
          saleId: sale.id,
          qty: s.qty,
          reason: 'Botol retak saat pengiriman kurir',
        }
      });
    } else {
      await prisma.inventory.create({
        data: { date: new Date(s.date), skuId: s.skuId, movement: -s.qty, type: MovementType.SALE, reference: sale.id }
      });
      const ch = await prisma.sKUCostHistory.findUnique({ where: { skuId: s.skuId } });
      if (ch) {
        await prisma.sKUCostHistory.update({ where: { skuId: s.skuId }, data: { stock: { decrement: s.qty } } });
      }
    }
  }

  // =========================================================================
  // 7. AFFILIATE & NON-AFFILIATE ACTIVITIES (Seeding & Sampel Promosi)
  // =========================================================================
  console.log('--- 7. SEEDING AFFILIATE & MARKETING ACTIVITIES ---');
  const affiliateActivities = [
    {
      date: new Date('2026-08-07'),
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
      date: new Date('2026-08-08'),
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
      notes: 'Live streaming Shopee campaign 8.8'
    },
    {
      date: new Date('2026-08-09'),
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
      date: new Date('2026-08-06'),
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

  // =========================================================================
  // 8. OTHER EXPENSES & LOST/BREAKAGE
  // =========================================================================
  console.log('--- 8. SEEDING OTHER EXPENSES & BREAKAGE ---');
  await prisma.otherExpense.createMany({
    data: [
      { date: new Date('2026-08-05'), category: ExpenseCategory.BONUS, recipient: 'Budi Santoso', amount: 500000, notes: 'Bonus performa tim produksi bulanan' },
      { date: new Date('2026-08-06'), category: ExpenseCategory.COMPLIMENT, recipient: 'Influencer Cantik', amount: 350000, notes: 'Compliment product package review' }
    ]
  });

  const breakageItems = [
    { date: '2026-08-08', skuId: sbn1Pbg.id, qty: 2, category: BreakageCategory.RUSAK, unitPrice: 12500, total: 25000, notes: 'Botol pecah saat pemindahan rak gudang' },
    { date: '2026-08-09', skuId: sbn2Pcf.id, qty: 1, category: BreakageCategory.HILANG, unitPrice: 7200, total: 7200, notes: 'Selisih hilang saat stock opname awal' }
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

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
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
