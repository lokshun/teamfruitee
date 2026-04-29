-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CHECK', 'TRANSFER');

-- AlterTable
ALTER TABLE "member_orders" ADD COLUMN     "paymentMethod" "PaymentMethod";
