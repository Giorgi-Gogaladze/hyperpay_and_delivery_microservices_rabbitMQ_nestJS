/*
  Warnings:

  - The `currency` column on the `wallets` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('GEL', 'USD', 'EUR');

-- AlterTable
ALTER TABLE "wallets" DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'GEL';
