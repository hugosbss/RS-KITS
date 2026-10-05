-- Etapa 1: código de acesso como identificador alternativo de login.
--
-- Princípios desta migração:
--   1. Nenhum usuário é apagado ou alterado silenciosamente.
--   2. Colisões são detectadas ANTES de qualquer escrita. Se existirem, a
--      migração aborta com o relatório das colisões e o banco fica intacto —
--      o administrador resolve os dados e roda a migração de novo.
--   3. A normalização só roda quando não há colisão, portanto nunca quebra
--      os índices únicos já existentes (users_email_key, users_cpf_key...).
--
-- Para checar as colisões sem aplicar nada:
--   SELECT regexp_replace("cpf", '\D', '', 'g') AS doc, array_agg("id")
--   FROM "users" WHERE "cpf" IS NOT NULL AND "cpf" <> ''
--   GROUP BY 1 HAVING count(*) > 1;

DO $$
DECLARE
  relatorio TEXT := '';
  linha     TEXT;
BEGIN
  ---------------------------------------------------------------------
  -- Colisão de e-mail (ignorando maiúsculas/espaços)
  ---------------------------------------------------------------------
  FOR linha IN
    SELECT 'email=' || lower(trim("email")) || ' -> ' || array_agg("id"::text)::text
    FROM "users"
    WHERE "email" IS NOT NULL AND "email" <> ''
    GROUP BY lower(trim("email"))
    HAVING count(*) > 1
  LOOP
    relatorio := relatorio || linha || E'\n';
  END LOOP;

  ---------------------------------------------------------------------
  -- Colisão de CPF (ignorando máscara)
  ---------------------------------------------------------------------
  FOR linha IN
    SELECT 'cpf=' || regexp_replace("cpf", '\D', '', 'g') || ' -> ' || array_agg("id"::text)::text
    FROM "users"
    WHERE "cpf" IS NOT NULL AND "cpf" <> ''
    GROUP BY regexp_replace("cpf", '\D', '', 'g')
    HAVING count(*) > 1
  LOOP
    relatorio := relatorio || linha || E'\n';
  END LOOP;

  ---------------------------------------------------------------------
  -- Colisão de CNPJ (ignorando máscara)
  ---------------------------------------------------------------------
  FOR linha IN
    SELECT 'cnpj=' || regexp_replace("cnpj", '\D', '', 'g') || ' -> ' || array_agg("id"::text)::text
    FROM "users"
    WHERE "cnpj" IS NOT NULL AND "cnpj" <> ''
    GROUP BY regexp_replace("cnpj", '\D', '', 'g')
    HAVING count(*) > 1
  LOOP
    relatorio := relatorio || linha || E'\n';
  END LOOP;

  IF relatorio <> '' THEN
    RAISE EXCEPTION E'RS KITS: colisão de documento impede a migração.\nNenhum dado foi alterado. Corrija os registros abaixo e rode novamente:\n%', relatorio;
  END IF;
END $$;

-- Sem colisões: normalizar é seguro e não pode violar os índices únicos.
UPDATE "users"
   SET "cpf" = regexp_replace("cpf", '\D', '', 'g')
 WHERE "cpf" IS NOT NULL
   AND "cpf" <> regexp_replace("cpf", '\D', '', 'g');

UPDATE "users"
   SET "cnpj" = regexp_replace("cnpj", '\D', '', 'g')
 WHERE "cnpj" IS NOT NULL
   AND "cnpj" <> regexp_replace("cnpj", '\D', '', 'g');

UPDATE "users"
   SET "email" = lower(trim("email"))
 WHERE "email" IS NOT NULL
   AND "email" <> lower(trim("email"));

-- Identificador alternativo de login. NULL para os usuários legados: eles
-- continuam entrando por e-mail/CPF/CNPJ e podem ter código depois.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accessCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_accessCode_key" ON "users"("accessCode");
CREATE INDEX IF NOT EXISTS "users_organizerId_idx" ON "users"("organizerId");
