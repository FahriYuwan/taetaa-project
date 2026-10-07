-- CreateTable
CREATE TABLE "ProductionKemasanInput" (
    "id" TEXT NOT NULL,
    "productionId" TEXT NOT NULL,
    "kemasanId" TEXT NOT NULL,
    "qtyUsed" DOUBLE PRECISION NOT NULL,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionKemasanInput_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductionKemasanInput_productionId_idx" ON "ProductionKemasanInput"("productionId");

-- CreateIndex
CREATE INDEX "ProductionKemasanInput_kemasanId_idx" ON "ProductionKemasanInput"("kemasanId");

-- CreateIndex
CREATE INDEX "Return_saleId_idx" ON "Return"("saleId");

-- AddForeignKey
ALTER TABLE "ProductionKemasanInput" ADD CONSTRAINT "ProductionKemasanInput_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionKemasanInput" ADD CONSTRAINT "ProductionKemasanInput_kemasanId_fkey" FOREIGN KEY ("kemasanId") REFERENCES "MasterItemKemasan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
