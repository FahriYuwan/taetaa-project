import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const skus = await prisma.sKU.findMany({
    where: { name: { contains: 'Sabun 20 Liter (Curah)' } },
    include: {
      inventory: true
    }
  });

  for (const sku of skus) {
    console.log(`SKU: ${sku.code} - ${sku.name}`);
    const costHist = await prisma.sKUCostHistory.findUnique({ where: { skuId: sku.id } });
    console.log(`Cost History Stock: ${costHist?.stock}`);
    console.log(`Inventory Movement Sum: ${sku.inventory.reduce((sum, i) => sum + i.movement, 0)}`);
    console.log('--- Movemements ---');
    sku.inventory.forEach(i => console.log(`${i.date.toISOString()} | ${i.type} | ${i.movement} | ${i.reference}`));
  }
}

main().finally(() => pool.end());
