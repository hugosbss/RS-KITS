-- AlterTable
ALTER TABLE "users" ADD COLUMN "organizerId" TEXT;

-- AddForeignKey
ALTER TABLE "users"
  ADD CONSTRAINT "users_organizerId_fkey"
  FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "users_organizerId_idx" ON "users"("organizerId");