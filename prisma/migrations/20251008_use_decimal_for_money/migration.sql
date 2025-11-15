-- AlterTable: Change Float to Decimal for money fields
-- This migration converts all monetary fields from Float to Decimal(10,2) for precise calculations

-- Product.price: Float -> Decimal(10,2)
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- Order.total: Float -> Decimal(10,2)
ALTER TABLE "Order" ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- OrderItem.price: Float -> Decimal(10,2)
ALTER TABLE "OrderItem" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);
