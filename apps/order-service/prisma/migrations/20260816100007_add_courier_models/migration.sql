-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BIKE', 'MOPED', 'CAR');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "courierId" UUID;

-- CreateTable
CREATE TABLE "courier_applications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "documentUrls" TEXT[],
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "courier_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courier_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courier_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courier_profiles_userId_key" ON "courier_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "courier_profiles_applicationId_key" ON "courier_profiles"("applicationId");

-- AddForeignKey
ALTER TABLE "courier_profiles" ADD CONSTRAINT "courier_profiles_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "courier_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "courier_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
