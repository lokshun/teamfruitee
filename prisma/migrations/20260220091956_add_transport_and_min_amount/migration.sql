-- AlterTable
ALTER TABLE "group_orders" ADD COLUMN     "minOrderAmount" DECIMAL(10,2),
ADD COLUMN     "transportUserId" TEXT;

-- AddForeignKey
ALTER TABLE "group_orders" ADD CONSTRAINT "group_orders_transportUserId_fkey" FOREIGN KEY ("transportUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
