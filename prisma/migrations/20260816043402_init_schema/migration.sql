-- CreateEnum
CREATE TYPE "SKUType" AS ENUM ('RAW', 'WIP', 'PACKAGE');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('PURCHASE', 'PRODUCTION', 'SALE', 'ADJUSTMENT', 'BREAKAGE', 'RETURN');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('SHOPEE', 'TIKTOK', 'OFFLINE', 'AFFILIATE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SKU" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SKUType" NOT NULL,
    "sellingPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SKU_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOMComponent" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BOMComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "skuId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "skuId" TEXT NOT NULL,
    "movement" DOUBLE PRECISION NOT NULL,
    "type" "MovementType" NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Production" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "outputId" TEXT NOT NULL,
    "outputQty" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionOutput" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,

    CONSTRAINT "ProductionOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionInput" (
    "id" TEXT NOT NULL,
    "productionId" TEXT NOT NULL,
    "inputSkuId" TEXT NOT NULL,
    "qtyUsed" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ProductionInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "skuId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "channel" "Channel" NOT NULL,
    "orderId" TEXT,
    "fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marketing" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "channel" "Channel" NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "activity" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Marketing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Return" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "saleId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SKUCostHistory" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "avgCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SKUCostHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SKU_code_key" ON "SKU"("code");

-- CreateIndex
CREATE INDEX "BOMComponent_childId_idx" ON "BOMComponent"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "BOMComponent_parentId_childId_key" ON "BOMComponent"("parentId", "childId");

-- CreateIndex
CREATE INDEX "Purchase_date_idx" ON "Purchase"("date");

-- CreateIndex
CREATE INDEX "Purchase_skuId_idx" ON "Purchase"("skuId");

-- CreateIndex
CREATE INDEX "Inventory_date_idx" ON "Inventory"("date");

-- CreateIndex
CREATE INDEX "Inventory_skuId_idx" ON "Inventory"("skuId");

-- CreateIndex
CREATE UNIQUE INDEX "Production_outputId_key" ON "Production"("outputId");

-- CreateIndex
CREATE INDEX "Production_date_idx" ON "Production"("date");

-- CreateIndex
CREATE INDEX "ProductionOutput_skuId_idx" ON "ProductionOutput"("skuId");

-- CreateIndex
CREATE INDEX "ProductionInput_productionId_idx" ON "ProductionInput"("productionId");

-- CreateIndex
CREATE INDEX "Sale_date_idx" ON "Sale"("date");

-- CreateIndex
CREATE INDEX "Sale_skuId_idx" ON "Sale"("skuId");

-- CreateIndex
CREATE UNIQUE INDEX "SKUCostHistory_skuId_key" ON "SKUCostHistory"("skuId");

-- AddForeignKey
ALTER TABLE "BOMComponent" ADD CONSTRAINT "BOMComponent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SKU"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMComponent" ADD CONSTRAINT "BOMComponent_childId_fkey" FOREIGN KEY ("childId") REFERENCES "SKU"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Production" ADD CONSTRAINT "Production_outputId_fkey" FOREIGN KEY ("outputId") REFERENCES "ProductionOutput"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOutput" ADD CONSTRAINT "ProductionOutput_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionInput" ADD CONSTRAINT "ProductionInput_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE CASCADE ON UPDATE CASCADE;
