import {
  PrismaClient,
  SKUType,
  Channel,
  MovementType,
  BOMCategory,
  ConsumptionType,
  ExpenseCategory,
  BreakageCategory,
  AffiliateActivityType,
  SaleStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 13 Item Kemasan Diskret Utama (Perpetual / Dihitung Harian)
const DISCRETE_KEMASAN_CODES = new Set([
  'DUSG',     // DUS PACKAGING GRIP PADEL
  'BTL1',     // BOTOL 1 LITER
  'BTL2',     // BOTOL 500 ML
  'BTL3',     // BOTOL 250 ML
  'FLP3',     // BOTOL FLIP TOP 100 ML
  'FLP4',     // BOTOL FLIP TOP 70 ML
  'FOM3',     // BOTOL FOAM 100 ML
  'FOM4',     // BOTOL FOAM 60 ML
  'SPR3',     // BOTOL SPRAY 100 ML
  'SPR4',     // BOTOL SPRAY 70 ML
  'SPR5',     // BOTOL SPRAY 30 ML
  'SPRG',     // BOTOL SPRAY GRIP
  'KRC3',     // BOTOL KERUCUT 100 ML
]);

function getKemasanCategory(code: string): BOMCategory {
  if (code === 'DUSG' || code.startsWith('DUS')) return BOMCategory.DUS;
  if (code.startsWith('STK')) return BOMCategory.STIKER;
  if (
    [
      'SLTP',
      'PLWR',
      'TBTL',
      'BBW20',
      'BBW30',
      'RESI',
      'ZP14',
      'ZP20',
      'ZP28',
      'ZPL7',
      'ZPL8',
      'ZPL0',
      'PLM10',
      'PLM17',
      'PLM20',
      'PLM25',
      'PCH',
      'KW15',
    ].includes(code)
  ) {
    return BOMCategory.SAFETY;
  }
  return BOMCategory.PACKING;
}

function getSkuUnit(code: string, name: string, size: number): 'ml' | 'pcs' {
  const upper = (name + ' ' + code).toUpperCase();

  const isDiscrete = [
    'SIKAT', 'BRUSH', 'ERASER', 'KAOS KAKI', 'LAP', 'MICROFIBER', 'SPONS', 'PAD', 'KUAS', 'CLAMP', 
    'TREE', 'AKSESORIS', 'SENDOK', 'PENCOKEL', 'JARUM', 'HANGER', 'WOOL', 'BUNDLING', 'PAKET', 
    'KIT', 'BALSAM', 'BES', 'BEW', 'BKS', 'BCS', 'BCE', 'BEB', 'LBL', 'KBL', 'PCK', 'TSC', 'ESB'
  ].some((w) => new RegExp(`\\b${w}\\b`, 'i').test(upper));

  if (isDiscrete) return 'pcs';

  const hasVolume = /\b(\d+)\s*(LITER|ML|L)\b/i.test(name);
  if (hasVolume || size >= 30) return 'ml';
  if (size > 0 && size <= 10) return 'pcs';
  return 'ml';
}

async function main() {
  console.log('=== 1. RESETTING DATABASE TABLES ===');
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
  console.log('Database reset complete.');

  // Load JSON reference data
  const dataDir = path.join(__dirname, 'seed-data');
  const skuMasterData: any[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'sku_master.json'), 'utf-8')
  );
  const purchaseData: any[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'recent_purchase.json'), 'utf-8')
  );
  const cogsRaw: Record<string, number> = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'cogs_raw.json'), 'utf-8')
  );
  const cogsWip: Record<string, number> = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'cogs_wip.json'), 'utf-8')
  );
  const cogsMarketplace: Record<string, number> = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'cogs_marketplace.json'), 'utf-8')
  );
  const shopeeData: any[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'shopee.json'), 'utf-8')
  );
  const tokopediaData: any[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'tokopedia.json'), 'utf-8')
  );

  console.log(`Loaded JSON: SKU Master (${skuMasterData.length}), Purchases (${purchaseData.length}), Shopee (${shopeeData.length}), Tokopedia (${tokopediaData.length})`);

  // Calculate sold quantities per SKU
  const totalQtySoldBySku = new Map<string, number>();
  for (const s of shopeeData) {
    totalQtySoldBySku.set(s.skuCode, (totalQtySoldBySku.get(s.skuCode) || 0) + s.qty);
  }
  for (const t of tokopediaData) {
    totalQtySoldBySku.set(t.skuCode, (totalQtySoldBySku.get(t.skuCode) || 0) + t.qty);
  }

  // =========================================================================
  // 2. SEED MASTER ITEM KEMASAN (0. PACKAGING)
  // - 13 Item Utama Diskret: isPeriodic: false, stockMin: 20-30
  // - 31 Item Non-Diskret (Habis Pakai): isPeriodic: true, stockMin: 0
  // =========================================================================
  console.log('=== 2. SEEDING MASTER ITEM KEMASAN ===');
  const kemasanMap = new Map<string, any>();
  const pkgRows = skuMasterData.filter((it) =>
    String(it.GROUP || '').startsWith('0.')
  );

  for (const row of pkgRows) {
    const code = String(row['SKU CODE']).trim();
    const name = String(row.DETAILS || code).trim();
    const isDiscrete = DISCRETE_KEMASAN_CODES.has(code);
    const category = getKemasanCategory(code);
    const avgCost = cogsRaw[code] || 0;
    const stockMin = isDiscrete ? (code === 'DUSG' ? 30 : code === 'BTL2' ? 30 : 20) : 0;
    const initialStock = isDiscrete ? 350 : 600;

    const kemasan = await prisma.masterItemKemasan.create({
      data: {
        code,
        name,
        category,
        stock: initialStock,
        avgCost,
        stockMin,
        isPeriodic: !isDiscrete,
        lastOpname: !isDiscrete ? new Date('2026-08-01') : null,
      },
    });
    kemasanMap.set(code, kemasan);
  }
  console.log(`Created ${kemasanMap.size} MasterItemKemasan records (13 Discrete, ${kemasanMap.size - 13} Periodic).`);

  // =========================================================================
  // 3. SEED MASTER SKU (1. RAW, 2. WIP, 3. PACKAGE) + MISSING CODES
  // =========================================================================
  console.log('=== 3. SEEDING MASTER SKU ===');
  const skuMap = new Map<string, any>();

  // A. Items from SKU MASTER
  for (const row of skuMasterData) {
    const group = String(row.GROUP || '');
    if (group.startsWith('0.')) continue; // Already in MasterItemKemasan

    const code = String(row['SKU CODE']).trim();
    const name = String(row.DETAILS || code).trim();
    const productSize = parseFloat(row['PRODUCT SIZE']) || 0;

    let type: SKUType = SKUType.PACKAGE;
    let avgCost = 0;
    if (code === 'LBL') {
      // Leather Balsam dijadikan type PACKAGE (terdiri dari LBL balm + PAD spons)
      type = SKUType.PACKAGE;
      avgCost = 15000;
    } else if (group.startsWith('1.')) {
      type = SKUType.RAW;
      avgCost = cogsRaw[code] || 0;
    } else if (group.startsWith('2.')) {
      type = SKUType.PRODUCT;
      avgCost = cogsWip[code] || 0;
    } else {
      type = SKUType.PACKAGE;
      avgCost = cogsMarketplace[code] || 0;
    }

    const unit = getSkuUnit(code, name, productSize);
    const sellingPrice =
      code === 'LBL'
        ? 25461
        : type === SKUType.PACKAGE
        ? avgCost > 0
          ? avgCost * 2
          : 25000
        : null;

    const sku = await prisma.sKU.create({
      data: {
        code,
        name,
        type,
        productSize,
        unit,
        hppPrice: avgCost,
        sellingPrice,
        stockMin: 20,
      },
    });
    skuMap.set(code, { sku, avgCost });
  }

  // B. Missing codes in Shopee/Tokopedia
  const extraCodes = [
    { code: 'PCK', name: 'PAKET CUCI KIT', size: 5, price: 92000, cost: 25000, unit: 'pcs' },
    { code: 'SPT5', name: 'SPRAY CLEANER 30 ML', size: 30, price: 40000, cost: 12000, unit: 'ml' },
    { code: 'KBL', name: 'BUNDLING KAOS KAKI', size: 1, price: 60000, cost: 18000, unit: 'pcs' },
    { code: 'PFOK', name: 'PAKET FOAM CLEANER + ODOR', size: 5, price: 87266, cost: 24000, unit: 'pcs' },
    { code: 'PMCF', name: 'PAKET CUCI MINI COFFEE', size: 4, price: 25000, cost: 9500, unit: 'pcs' },
  ];

  for (const extra of extraCodes) {
    if (!skuMap.has(extra.code)) {
      const sku = await prisma.sKU.create({
        data: {
          code: extra.code,
          name: extra.name,
          type: SKUType.PACKAGE,
          productSize: extra.size,
          unit: extra.unit,
          hppPrice: extra.cost,
          sellingPrice: extra.price,
          stockMin: 20,
        },
      });
      skuMap.set(extra.code, { sku, avgCost: extra.cost });
    }
  }
  console.log(`Created ${skuMap.size} SKU records.`);

  // Create SKUCostHistory and Initial Inventory Movements for SKUs
  const costHistoriesData: any[] = [];
  const initialMovementsData: any[] = [];

  for (const [code, { sku, avgCost }] of skuMap.entries()) {
    const soldQty = totalQtySoldBySku.get(code) || 0;
    // Set initial stock: enough to cover August sales + safe positive buffer
    const buffer = sku.type === SKUType.RAW ? 100 : 30;
    const initialStock = soldQty + buffer;

    costHistoriesData.push({
      skuId: sku.id,
      avgCost: avgCost || 0,
      stock: initialStock,
    });

    initialMovementsData.push({
      date: new Date('2026-08-01'),
      skuId: sku.id,
      movement: initialStock,
      type: sku.type === SKUType.RAW ? MovementType.PURCHASE : MovementType.PRODUCTION,
      reference: 'SALDO_AWAL_AGUSTUS_2026',
    });
  }

  // Batch insert SKUCostHistory
  for (let i = 0; i < costHistoriesData.length; i += 500) {
    await prisma.sKUCostHistory.createMany({
      data: costHistoriesData.slice(i, i + 500),
    });
  }
  // Batch insert Initial Inventory Movements
  for (let i = 0; i < initialMovementsData.length; i += 500) {
    await prisma.inventory.createMany({
      data: initialMovementsData.slice(i, i + 500),
    });
  }
  console.log(`Initialized SKUCostHistory and inventory movements for ${costHistoriesData.length} SKUs.`);

  // =========================================================================
  // 4. SEED RECENT PURCHASE (32 TRANSACTIONS IN AUGUST 2026)
  // =========================================================================
  console.log('=== 4. SEEDING RECENT PURCHASE TRANSACTIONS ===');
  let purchasesCount = 0;
  for (const p of purchaseData) {
    const code = p.code;
    const totalQty = parseFloat(p.totalQty) || 0;
    const costPerUnit = parseFloat(p.costPerUnit) || 0;
    const cost = parseFloat(p.cost) || totalQty * costPerUnit;
    const date = new Date(p.date || '2026-08-01');

    if (kemasanMap.has(code)) {
      const kemasan = kemasanMap.get(code);
      await prisma.purchase.create({
        data: {
          date,
          kemasanId: kemasan.id,
          qty: totalQty,
          unitPrice: costPerUnit,
          total: cost,
          supplier: p.platform || 'ONLINE/SHOPEE',
          notes: `Pembelian Kemasan: ${p.name}`,
        },
      });

      // Update Kemasan stock & weighted average HPP
      const oldStock = kemasan.stock;
      const oldAvg = kemasan.avgCost;
      const newStock = oldStock + totalQty;
      const newAvg = newStock > 0 ? (oldStock * oldAvg + totalQty * costPerUnit) / newStock : costPerUnit;
      await prisma.masterItemKemasan.update({
        where: { id: kemasan.id },
        data: { stock: newStock, avgCost: newAvg },
      });
      kemasan.stock = newStock;
      kemasan.avgCost = newAvg;
      purchasesCount++;
    } else if (skuMap.has(code)) {
      const { sku } = skuMap.get(code);
      const purchase = await prisma.purchase.create({
        data: {
          date,
          skuId: sku.id,
          qty: totalQty,
          unitPrice: costPerUnit,
          total: cost,
          supplier: p.platform || 'ONLINE/SHOPEE',
          notes: `Pembelian Bahan/Barang: ${p.name}`,
        },
      });

      await prisma.inventory.create({
        data: {
          date,
          skuId: sku.id,
          movement: totalQty,
          type: MovementType.PURCHASE,
          reference: purchase.id,
        },
      });

      const costHist = await prisma.sKUCostHistory.findUnique({ where: { skuId: sku.id } });
      if (costHist) {
        const oldStock = costHist.stock;
        const oldAvg = costHist.avgCost;
        const newStock = oldStock + totalQty;
        const newAvg = newStock > 0 ? (oldStock * oldAvg + totalQty * costPerUnit) / newStock : costPerUnit;
        await prisma.sKUCostHistory.update({
          where: { skuId: sku.id },
          data: { stock: newStock, avgCost: newAvg },
        });
      }
      purchasesCount++;
    }
  }
  console.log(`Seeded ${purchasesCount} purchase transactions from RECENT PURCHASE.`);

  // =========================================================================
  // 5. SEED BOM RECIPES (FROM SKU MASTER & COGS)
  // =========================================================================
  console.log('=== 5. SEEDING BOM COMPONENTS ===');
  const bomComponentsData: any[] = [];
  const compColumns = [
    'RAW 1', 'RAW 2', 'RAW 3', 'RAW 4', 'RAW 5', 'RAW 6', 'RAW 7', 'RAW 8',
    'PACKING', 'SAFETY', 'ZIPPER', 'DUS'
  ];

  for (const row of skuMasterData) {
    const parentCode = String(row['SKU CODE']).trim();
    if (!skuMap.has(parentCode)) continue;
    const parentSku = skuMap.get(parentCode).sku;

    for (const col of compColumns) {
      const childCodeRaw = row[col];
      if (!childCodeRaw) continue;
      const childCode = String(childCodeRaw).trim();

      if (skuMap.has(childCode)) {
        const childSku = skuMap.get(childCode).sku;
        if (childSku.id === parentSku.id) continue; // Skip self reference

        // Child is a RAW or PRODUCT SKU
        bomComponentsData.push({
          parentId: parentSku.id,
          childSkuId: childSku.id,
          category: BOMCategory.RAW,
          quantity: 1,
          consumptionType: ConsumptionType.AUTOMATIC,
        });
      } else if (kemasanMap.has(childCode)) {
        // Child is a MasterItemKemasan
        const isDiscrete = DISCRETE_KEMASAN_CODES.has(childCode);
        const category = getKemasanCategory(childCode);

        bomComponentsData.push({
          parentId: parentSku.id,
          childKemasanId: kemasanMap.get(childCode).id,
          category,
          quantity: 1,
          // Only the 13 discrete items reduce automatically in production
          consumptionType: isDiscrete ? ConsumptionType.AUTOMATIC : ConsumptionType.MANUAL,
        });
      }
    }
  }

  for (let i = 0; i < bomComponentsData.length; i += 500) {
    await prisma.bOMComponent.createMany({
      data: bomComponentsData.slice(i, i + 500),
    });
  }
  console.log(`Seeded ${bomComponentsData.length} BOM recipe components.`);

  // =========================================================================
  // 6. SEED SHOPEE SALES (1,707 TRANSACTIONS)
  // =========================================================================
  console.log('=== 6. SEEDING SHOPEE TRANSACTIONS ===');
  const shopeeSalesData: any[] = [];
  const shopeeInventoryData: any[] = [];
  const skuStockDeductionMap = new Map<string, number>();

  for (const s of shopeeData) {
    const skuCode = s.skuCode;
    const skuEntry = skuMap.get(skuCode);
    if (!skuEntry) continue;
    const sku = skuEntry.sku;
    const date = new Date(s.date || '2026-08-01');

    shopeeSalesData.push({
      orderId: s.orderCode,
      date,
      skuId: sku.id,
      qty: s.qty,
      unitPrice: s.price,
      total: s.price * s.qty,
      channel: Channel.SHOPEE,
      voucher: s.voucher,
      discount: s.discount,
      platformFee: s.platformFee,
      shippingFee: s.shippingFee,
      omset: s.omset,
      hpp: s.hpp,
      totalHpp: s.totalHpp,
      laba: s.laba,
      status: SaleStatus.DITERIMA,
      scannedByLogistic: true,
      financeMatched: true,
    });

    shopeeInventoryData.push({
      date,
      skuId: sku.id,
      movement: -s.qty,
      type: MovementType.SALE,
      reference: s.orderCode,
    });

    skuStockDeductionMap.set(sku.id, (skuStockDeductionMap.get(sku.id) || 0) + s.qty);
  }

  for (let i = 0; i < shopeeSalesData.length; i += 500) {
    await prisma.sale.createMany({
      data: shopeeSalesData.slice(i, i + 500),
    });
  }
  for (let i = 0; i < shopeeInventoryData.length; i += 500) {
    await prisma.inventory.createMany({
      data: shopeeInventoryData.slice(i, i + 500),
    });
  }
  console.log(`Seeded ${shopeeSalesData.length} Shopee sales records and inventory deductions.`);

  // =========================================================================
  // 7. SEED TOKOPEDIA & TIKTOK SALES (202 TRANSACTIONS)
  // =========================================================================
  console.log('=== 7. SEEDING TOKOPEDIA / TIKTOK TRANSACTIONS ===');
  const tokpedSalesData: any[] = [];
  const tokpedInventoryData: any[] = [];

  for (const t of tokopediaData) {
    const skuCode = t.skuCode;
    const skuEntry = skuMap.get(skuCode);
    if (!skuEntry) continue;
    const sku = skuEntry.sku;
    const date = new Date(t.date || '2026-08-01');
    const channel = t.platform.toUpperCase().includes('TIKTOK')
      ? Channel.TIKTOK
      : Channel.TOKOPEDIA;

    tokpedSalesData.push({
      orderId: t.orderCode,
      date,
      skuId: sku.id,
      qty: t.qty,
      unitPrice: t.price,
      total: t.price * t.qty,
      channel,
      voucher: t.voucher,
      discount: 0,
      platformFee: t.platformFee,
      shippingFee: t.biayaLayanan + t.biayaLain,
      omset: t.omset,
      hpp: t.hpp,
      totalHpp: t.totalHpp,
      laba: t.laba,
      status: SaleStatus.DITERIMA,
      scannedByLogistic: true,
      financeMatched: true,
    });

    tokpedInventoryData.push({
      date,
      skuId: sku.id,
      movement: -t.qty,
      type: MovementType.SALE,
      reference: t.orderCode,
    });

    skuStockDeductionMap.set(sku.id, (skuStockDeductionMap.get(sku.id) || 0) + t.qty);
  }

  for (let i = 0; i < tokpedSalesData.length; i += 500) {
    await prisma.sale.createMany({
      data: tokpedSalesData.slice(i, i + 500),
    });
  }
  for (let i = 0; i < tokpedInventoryData.length; i += 500) {
    await prisma.inventory.createMany({
      data: tokpedInventoryData.slice(i, i + 500),
    });
  }
  console.log(`Seeded ${tokpedSalesData.length} Tokopedia/TikTok sales records.`);

  // Update current stock in SKUCostHistory according to deductions
  for (const [skuId, deductedQty] of skuStockDeductionMap.entries()) {
    await prisma.sKUCostHistory.update({
      where: { skuId },
      data: {
        stock: { decrement: deductedQty },
      },
    });
  }

  // =========================================================================
  // 8. SAMPLE REALISTIC BREAKAGE, RETURNS & AFFILIATE
  // =========================================================================
  console.log('=== 8. SEEDING SAMPLE OPERATIONAL EXPENSES / BREAKAGE / AFFILIATE ===');
  const sampleSku = skuMap.get('BEW')?.sku || skuMap.get('BES')?.sku;
  if (sampleSku) {
    await prisma.breakage.create({
      data: {
        date: new Date('2026-08-15'),
        skuId: sampleSku.id,
        qty: 2,
        category: BreakageCategory.GAGAL_QC,
        unitPrice: 15000,
        total: 30000,
        notes: 'Gagal QC kemasan penyok saat packing',
      },
    });
    await prisma.inventory.create({
      data: {
        date: new Date('2026-08-15'),
        skuId: sampleSku.id,
        movement: -2,
        type: MovementType.BREAKAGE,
        reference: 'BRK-20260815-001',
      },
    });

    await prisma.affiliateActivity.create({
      data: {
        date: new Date('2026-08-12'),
        activityType: AffiliateActivityType.AFFILIATE,
        accountUsername: '@sneakers_cleaner_id',
        realName: 'Budi Creator',
        skuId: sampleSku.id,
        qty: 3,
        courier: 'J&T Express',
        shippingCost: 15000,
        marketplace: 'TikTok',
        followers: '45.000',
        notes: 'Sample Seeding Video Review Agustus',
      },
    });
    await prisma.inventory.create({
      data: {
        date: new Date('2026-08-12'),
        skuId: sampleSku.id,
        movement: -3,
        type: MovementType.AFFILIATE_SEEDING,
        reference: 'AFF-20260812-001',
      },
    });
  }

  console.log('=== SEEDING COMPLETED SUCCESSFULLY ===');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
