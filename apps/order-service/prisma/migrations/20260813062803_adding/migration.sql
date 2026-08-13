-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('GEL', 'USD', 'EUR');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'GEL';
