-- AlterTable
ALTER TABLE "MasterItemKemasan" ADD COLUMN     "isPeriodic" BOOLEAN DEFAULT false,
ADD COLUMN     "lastOpname" TIMESTAMP(3),
ADD COLUMN     "stockMin" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "kemasanId" TEXT,
ALTER COLUMN "skuId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SKU" ADD COLUMN     "unit" TEXT DEFAULT 'ml';

-- CreateIndex
CREATE INDEX "BOMComponent_parentId_idx" ON "BOMComponent"("parentId");

-- CreateIndex
CREATE INDEX "Marketing_date_idx" ON "Marketing"("date");

-- CreateIndex
CREATE INDEX "OtherExpense_date_idx" ON "OtherExpense"("date");

-- CreateIndex
CREATE INDEX "Purchase_kemasanId_idx" ON "Purchase"("kemasanId");

-- CreateIndex
CREATE INDEX "Sale_channel_idx" ON "Sale"("channel");

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- CreateIndex
CREATE INDEX "Sale_date_channel_idx" ON "Sale"("date", "channel");

-- CreateIndex
CREATE INDEX "Sale_scannedByLogistic_financeMatched_idx" ON "Sale"("scannedByLogistic", "financeMatched");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_kemasanId_fkey" FOREIGN KEY ("kemasanId") REFERENCES "MasterItemKemasan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
