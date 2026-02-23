/*
  Warnings:

  - You are about to drop the column `kDriveFileId` on the `documents` table. All the data in the column will be lost.
  - Added the required column `shareUrl` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" DROP COLUMN "kDriveFileId",
ADD COLUMN     "shareUrl" TEXT NOT NULL;
