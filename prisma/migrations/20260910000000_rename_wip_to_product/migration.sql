-- AlterEnum
ALTER TYPE "SKUType" ADD VALUE 'PRODUCT';

-- UpdateData
UPDATE "SKU" SET "type" = 'PRODUCT' WHERE "type" = 'WIP';

-- Note: We can't easily remove 'WIP' from the enum in some Postgres versions without a new type.
-- For now, adding 'PRODUCT' and updating the data is sufficient for the application to function.
-- Prisma will use 'PRODUCT' as defined in the schema.
