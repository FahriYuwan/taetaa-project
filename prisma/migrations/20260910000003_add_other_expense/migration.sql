-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('BONUS', 'COMPLIMENT', 'LAINNYA');

-- CreateTable
CREATE TABLE "OtherExpense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "recipient" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtherExpense_pkey" PRIMARY KEY ("id")
);
