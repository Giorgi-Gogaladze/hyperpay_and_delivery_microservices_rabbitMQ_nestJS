-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'FROZEN', 'CLOSED');

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'GEL',
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "stripeConnectedAccountId" TEXT,
    "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_stripeCustomerId_key" ON "wallets"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_stripeConnectedAccountId_key" ON "wallets"("stripeConnectedAccountId");
