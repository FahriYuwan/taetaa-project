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
    include: { inventory: true },
    orderBy: { code: 'asc' }
  });

  for (const sku of skus) {
    const costHist = await prisma.sKUCostHistory.findUnique({ where: { skuId: sku.id } });
    const invStock = sku.inventory.reduce((sum, i) => sum + i.movement, 0);
    const isRestock = (sku.stockMin ?? 0) > 0 && invStock < (sku.stockMin ?? 0);
    console.log(`SKU: ${sku.code} | Type: ${sku.type} | Stock: ${invStock} (CH: ${costHist?.stock}) | Min: ${sku.stockMin} | Restock Alert: ${isRestock ? 'YES (KURANG ' + ((sku.stockMin ?? 0) - invStock) + ')' : 'NO'}`);
  }
}

main().finally(() => pool.end());
