-- AddForeignKey
ALTER TABLE "ProductionInput" ADD CONSTRAINT "ProductionInput_inputSkuId_fkey" FOREIGN KEY ("inputSkuId") REFERENCES "SKU"("id") ON DELETE CASCADE ON UPDATE CASCADE;
