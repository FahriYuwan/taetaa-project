-- CreateEnum
CREATE TYPE "OpnameStatus" AS ENUM ('DRAFT', 'REVIEW', 'POSTED');

-- AlterTable StockOpname: add status, opnameNumber, updatedAt
ALTER TABLE "StockOpname"
  ADD COLUMN IF NOT EXISTS "opnameNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "status" "OpnameStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "StockOpname" ALTER COLUMN "updatedAt" DROP DEFAULT;
