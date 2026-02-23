/*
  Warnings:

  - You are about to drop the column `minOrderAmount` on the `group_orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "group_orders" DROP COLUMN "minOrderAmount",
ADD COLUMN     "minOrderQuantity" INTEGER;
