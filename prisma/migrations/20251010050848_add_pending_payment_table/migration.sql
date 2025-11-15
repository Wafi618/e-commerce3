-- CreateTable
CREATE TABLE "PendingPayment" (
    "id" TEXT NOT NULL,
    "paymentID" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "country" TEXT,
    "address" TEXT,
    "house" TEXT,
    "floor" TEXT,
    "notes" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "cartItems" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingPayment_paymentID_key" ON "PendingPayment"("paymentID");

-- CreateIndex
CREATE INDEX "PendingPayment_paymentID_idx" ON "PendingPayment"("paymentID");

-- CreateIndex
CREATE INDEX "PendingPayment_expiresAt_idx" ON "PendingPayment"("expiresAt");
