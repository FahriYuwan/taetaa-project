import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- RECALCULATING ALL STOCKS ---');
  const skus = await prisma.sKU.findMany({
    include: { inventory: true }
  });

  for (const sku of skus) {
    const actualStock = sku.inventory.reduce((sum, inv) => sum + inv.movement, 0);
    console.log(`SKU: ${sku.code} | Real Stock: ${actualStock}`);

    await prisma.sKUCostHistory.upsert({
      where: { skuId: sku.id },
      update: { stock: actualStock },
      create: { skuId: sku.id, stock: actualStock, avgCost: 0 }
    });
  }
  console.log('--- DONE ---');
}

main().finally(() => pool.end());
