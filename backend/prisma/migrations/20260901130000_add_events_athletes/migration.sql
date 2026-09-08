-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('RASCUNHO', 'PROXIMO', 'EM_ANDAMENTO', 'FINALIZADO');

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "place" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'RASCUNHO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_users" (
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_users_pkey" PRIMARY KEY ("eventId","userId")
);

-- CreateTable
CREATE TABLE "athletes" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "num" TEXT,
    "nomeAtleta" TEXT NOT NULL,
    "kit" TEXT,
    "distancia" TEXT,
    "fxEtaria" TEXT,
    "categEspecial" TEXT,
    "nascto" TEXT,
    "nascimento" TIMESTAMP(3),
    "sexo" TEXT,
    "equipe" TEXT,
    "cidadeUf" TEXT,
    "camiseta" TEXT,
    "cpfAtleta" TEXT,
    "cel" TEXT,
    "email" TEXT,
    "quemVaiRetirar" TEXT,
    "notas" TEXT,
    "obs1" TEXT,
    "obs2" TEXT,
    "alerta" TEXT,
    "nomeEvento" TEXT,
    "contato" TEXT,
    "grauParentesco" TEXT,
    "celularContato" TEXT,
    "pin" TEXT,
    "itensAdicionais" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athletes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "athletes_eventId_idx" ON "athletes"("eventId");

-- AddForeignKey
ALTER TABLE "event_users"
    ADD CONSTRAINT "event_users_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_users"
    ADD CONSTRAINT "event_users_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athletes"
    ADD CONSTRAINT "athletes_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;