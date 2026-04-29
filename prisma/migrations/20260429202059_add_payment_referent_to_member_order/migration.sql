-- AlterTable
ALTER TABLE "member_orders" ADD COLUMN     "paymentReferentId" TEXT;

-- AddForeignKey
ALTER TABLE "member_orders" ADD CONSTRAINT "member_orders_paymentReferentId_fkey" FOREIGN KEY ("paymentReferentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
