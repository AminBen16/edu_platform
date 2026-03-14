-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "parentId" TEXT;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "publishedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");
