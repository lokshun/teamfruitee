-- DropForeignKey
ALTER TABLE "member_orders" DROP CONSTRAINT "member_orders_userId_fkey";

-- DropIndex
DROP INDEX "member_orders_groupOrderId_userId_key";

-- AlterTable
ALTER TABLE "member_orders" ADD COLUMN     "placedByCoordinatorId" TEXT,
ADD COLUMN     "proxyBuyerName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "_PaymentReferents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PaymentReferents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PaymentReferents_B_index" ON "_PaymentReferents"("B");

-- AddForeignKey
ALTER TABLE "member_orders" ADD CONSTRAINT "member_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_orders" ADD CONSTRAINT "member_orders_placedByCoordinatorId_fkey" FOREIGN KEY ("placedByCoordinatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentReferents" ADD CONSTRAINT "_PaymentReferents_A_fkey" FOREIGN KEY ("A") REFERENCES "group_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentReferents" ADD CONSTRAINT "_PaymentReferents_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex (partial unique: un userId ne peut commander qu'une fois par commande groupée)
CREATE UNIQUE INDEX "member_orders_group_user_unique"
ON "member_orders" ("groupOrderId", "userId")
WHERE "userId" IS NOT NULL;
