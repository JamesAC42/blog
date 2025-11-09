-- AlterTable
ALTER TABLE "GuestbookEntry" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "GuestbookEntry_parentId_idx" ON "GuestbookEntry"("parentId");

-- AddForeignKey
ALTER TABLE "GuestbookEntry" ADD CONSTRAINT "GuestbookEntry_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GuestbookEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
