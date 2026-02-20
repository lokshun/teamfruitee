-- CreateTable
CREATE TABLE "_GroupOrderDeliveryPoints" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GroupOrderDeliveryPoints_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_GroupOrderDeliveryPoints_B_index" ON "_GroupOrderDeliveryPoints"("B");

-- AddForeignKey
ALTER TABLE "_GroupOrderDeliveryPoints" ADD CONSTRAINT "_GroupOrderDeliveryPoints_A_fkey" FOREIGN KEY ("A") REFERENCES "delivery_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupOrderDeliveryPoints" ADD CONSTRAINT "_GroupOrderDeliveryPoints_B_fkey" FOREIGN KEY ("B") REFERENCES "group_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
