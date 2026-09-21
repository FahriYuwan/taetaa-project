-- CreateEnum
CREATE TYPE "BreakageCategory" AS ENUM ('GAGAL_QC', 'RUSAK', 'HILANG', 'LAINNYA');

-- CreateEnum
CREATE TYPE "AffiliateActivityType" AS ENUM ('AFFILIATE', 'NON_AFFILIATE');

-- AlterEnum
ALTER TYPE "MovementType" ADD VALUE 'AFFILIATE_SEEDING';

-- AlterTable
ALTER TABLE "SKU" ADD COLUMN     "stockMin" DOUBLE PRECISION DEFAULT 0;


-- CreateTable
CREATE TABLE "Breakage" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "skuId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "category" "BreakageCategory" NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Breakage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_activity" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "activityType" "AffiliateActivityType" NOT NULL DEFAULT 'AFFILIATE',
    "accountUsername" TEXT,
    "realName" TEXT,
    "skuId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "courier" TEXT,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marketplace" TEXT,
    "followers" TEXT,
    "affiliateData" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Breakage_date_idx" ON "Breakage"("date");

-- CreateIndex
CREATE INDEX "Breakage_skuId_idx" ON "Breakage"("skuId");

-- CreateIndex
CREATE INDEX "affiliate_activity_date_idx" ON "affiliate_activity"("date");

-- CreateIndex
CREATE INDEX "affiliate_activity_skuId_idx" ON "affiliate_activity"("skuId");

-- AddForeignKey
ALTER TABLE "Breakage" ADD CONSTRAINT "Breakage_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_activity" ADD CONSTRAINT "affiliate_activity_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE CASCADE ON UPDATE CASCADE;
