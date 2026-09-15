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

-- CreateIndex
CREATE INDEX "Breakage_date_idx" ON "Breakage"("date");
CREATE INDEX "Breakage_skuId_idx" ON "Breakage"("skuId");

-- AddForeignKey
ALTER TABLE "Breakage" ADD CONSTRAINT "Breakage_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE CASCADE ON UPDATE CASCADE;
