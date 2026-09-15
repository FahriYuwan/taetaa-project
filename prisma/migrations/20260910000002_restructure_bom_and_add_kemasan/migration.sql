-- CreateEnum
CREATE TYPE "BOMCategory" AS ENUM ('RAW', 'PACKING', 'STIKER', 'SAFETY', 'DUS');
CREATE TYPE "ConsumptionType" AS ENUM ('AUTOMATIC', 'MANUAL');

-- CreateTable MasterItemKemasan
CREATE TABLE "MasterItemKemasan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "BOMCategory" NOT NULL,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterItemKemasan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterItemKemasan_code_key" ON "MasterItemKemasan"("code");

-- Alter BOMComponent - Handle existing data first
-- 1. Add new columns
ALTER TABLE "BOMComponent" ADD COLUMN "childSkuId" TEXT;
ALTER TABLE "BOMComponent" ADD COLUMN "childKemasanId" TEXT;
ALTER TABLE "BOMComponent" ADD COLUMN "category" "BOMCategory";
ALTER TABLE "BOMComponent" ADD COLUMN "consumptionType" "ConsumptionType" NOT NULL DEFAULT 'AUTOMATIC';

-- 2. Migrate data: Treat all existing BOM components as RAW
UPDATE "BOMComponent" SET "childSkuId" = "childId", "category" = 'RAW';

-- 3. Make category NOT NULL after migration
ALTER TABLE "BOMComponent" ALTER COLUMN "category" SET NOT NULL;

-- 4. Drop old column and constraints
ALTER TABLE "BOMComponent" DROP CONSTRAINT "BOMComponent_childId_fkey";
DROP INDEX IF EXISTS "BOMComponent_childId_idx";
DROP INDEX IF EXISTS "BOMComponent_parentId_childId_key";
ALTER TABLE "BOMComponent" DROP COLUMN "childId";

-- 5. Add new constraints
CREATE INDEX "BOMComponent_childSkuId_idx" ON "BOMComponent"("childSkuId");
CREATE INDEX "BOMComponent_childKemasanId_idx" ON "BOMComponent"("childKemasanId");
ALTER TABLE "BOMComponent" ADD CONSTRAINT "BOMComponent_childSkuId_fkey" FOREIGN KEY ("childSkuId") REFERENCES "SKU"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BOMComponent" ADD CONSTRAINT "BOMComponent_childKemasanId_fkey" FOREIGN KEY ("childKemasanId") REFERENCES "MasterItemKemasan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
