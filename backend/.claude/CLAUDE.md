# Orientações Claude Code — Backend RS-KITS

Leia [AGENTS.md](../../AGENTS.md), o [README](../../README.md), [docs/](../../docs/README.md) e [modelo do banco](../../docs/backend/database.md).

## Stack e organização

- NestJS 10, TypeScript, Prisma, PostgreSQL, JWT e class-validator/class-transformer.
- Domínios em src/<domínio>/, com controller, service, module e DTOs conforme os módulos existentes.
- Schema em prisma/schema.prisma; toda alteração estrutural acompanha uma migração Prisma.
- Testes Jest usam *.spec.ts; E2E usa test/jest-e2e.json.

## Convenções

- Valide entradas nos DTOs e mantenha o contrato consumido pelo frontend deste repositório alinhado.
- Aplique autenticação, autorização por perfil e escopo de evento no servidor; não confie apenas na interface.
- Preserve consistência de entregas, estornos, importações, controle de versão e operações de sincronização.
- A auditoria de alterações é gravada em logs/audit.log, não em uma tabela Prisma.
- A API central possui endpoints de sync que o desktop não consome. Distribuições de evento retornam unsupported; o perfil limpo tem somente um protótipo de auditoria com desktop/cloud.py, iniciado à parte, sem sincronização de atletas com a API central.
- Não registre segredos ou dados pessoais em logs. Retorne erros sem expor detalhes internos.
