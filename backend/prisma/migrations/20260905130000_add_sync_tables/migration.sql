-- Etapa 2/4: versionamento otimista por registro e tabelas de sincronização.
-- Todas as colunas de version são aditivas com default, portanto a migração
-- não apaga nem reescreve dados existentes.

ALTER TABLE "events"   ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "athletes" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "sync_operations" (
    "operationId" TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "deviceId"    TEXT NOT NULL,
    "eventId"     TEXT,
    "entityType"  TEXT NOT NULL,
    "entityId"    TEXT NOT NULL,
    "baseVersion" INTEGER,
    "opType"      TEXT NOT NULL,
    "status"      TEXT NOT NULL DEFAULT 'APPLIED',
    "detail"      TEXT,
    "appliedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_operations_pkey" PRIMARY KEY ("operationId")
);

CREATE INDEX IF NOT EXISTS "sync_operations_eventId_idx" ON "sync_operations"("eventId");
CREATE INDEX IF NOT EXISTS "sync_operations_userId_idx"  ON "sync_operations"("userId");

CREATE TABLE IF NOT EXISTS "sync_changes" (
    "seq"        SERIAL NOT NULL,
    "eventId"    TEXT,
    "entityType" TEXT NOT NULL,
    "entityId"   TEXT NOT NULL,
    "version"    INTEGER NOT NULL,
    "op"         TEXT NOT NULL DEFAULT 'UPSERT',
    "payload"    JSONB,
    "deleted"    BOOLEAN NOT NULL DEFAULT false,
    "deviceId"   TEXT,
    "userId"     TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_changes_pkey" PRIMARY KEY ("seq")
);

CREATE INDEX IF NOT EXISTS "sync_changes_eventId_seq_idx" ON "sync_changes"("eventId", "seq");
CREATE INDEX IF NOT EXISTS "sync_changes_seq_idx"         ON "sync_changes"("seq");

CREATE TABLE IF NOT EXISTS "sync_conflicts" (
    "id"             TEXT NOT NULL,
    "operationId"    TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "eventId"        TEXT NOT NULL,
    "entityType"     TEXT NOT NULL,
    "entityId"       TEXT NOT NULL,
    "baseVersion"    INTEGER NOT NULL,
    "centralVersion" INTEGER NOT NULL,
    "localPayload"   JSONB,
    "centralPayload" JSONB,
    "status"         TEXT NOT NULL DEFAULT 'OPEN',
    "resolution"     TEXT,
    "resolvedById"   TEXT,
    "resolvedAt"     TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sync_conflicts_eventId_status_idx" ON "sync_conflicts"("eventId", "status");
