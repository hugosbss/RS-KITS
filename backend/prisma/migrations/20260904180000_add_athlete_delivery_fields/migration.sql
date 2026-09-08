-- AlterTable
ALTER TABLE "athletes" ADD COLUMN "statusEntrega" TEXT DEFAULT 'PENDENTE',
ADD COLUMN "dataEntrega" TEXT,
ADD COLUMN "usuarioEntrega" TEXT,
ADD COLUMN "obsEntrega" TEXT,
ADD COLUMN "dataEstorno" TEXT,
ADD COLUMN "usuarioEstorno" TEXT,
ADD COLUMN "nomeEntrega" TEXT,
ADD COLUMN "cpfEntrega" TEXT,
ADD COLUMN "foneEntrega" TEXT,
ADD COLUMN "emailEntrega" TEXT,
ADD COLUMN "terceiro" BOOLEAN NOT NULL DEFAULT false;