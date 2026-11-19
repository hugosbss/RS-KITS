# Configuração do ambiente

O RS-KITS é um monorepositório npm com frontend Next.js, API NestJS e aplicativo desktop Python. Este guia cobre o ambiente web local; o [guia desktop](../desktop/README.md) descreve execução e empacotamento do aplicativo.

## Pré-requisitos

- Node.js 20 ou superior e npm.
- Docker Desktop com Docker Compose, ou PostgreSQL compatível.
- Python 3.10 ou superior apenas para executar ou empacotar o desktop.

## Banco e variáveis de ambiente

Na raiz do repositório, inicie a infraestrutura local:

    npm run docker:up

O Docker Compose publica PostgreSQL na porta 5433 e Redis na 6379. O backend usa PostgreSQL. Redis é iniciado pela composição de desenvolvimento.

Copie o exemplo de ambiente do backend:

    cp backend/.env.example backend/.env

No PowerShell, use:

    Copy-Item backend/.env.example backend/.env

Para o PostgreSQL do Compose, configure DATABASE_URL com a porta 5433:

    DATABASE_URL="postgresql://rskits:rskits@localhost:5433/rskits?schema=public"
    JWT_SECRET="substitua-por-uma-chave-forte"
    JWT_EXPIRES_IN="8h"
    PORT=3001

O arquivo de exemplo usa a porta PostgreSQL padrão 5432; ajuste-a para 5433 ao usar o Compose deste projeto. O frontend não precisa de .env.local para iniciar. NEXT_PUBLIC_API_PROXY é opcional quando a API não estiver em http://localhost:3001.

## Instalação e banco

Instale as dependências a partir da raiz:

    npm install

Aplique as migrações de desenvolvimento e crie a conta inicial:

    npm run db:migrate
    npm run db:seed

O seed cria admin@rskits.com com senha admin123 em um banco novo. Troque a senha antes de compartilhar ou publicar o ambiente. Para aplicar migrações existentes em um ambiente implantado, use npm run prisma:deploy --prefix backend.

## Executar

Inicie frontend e API juntos:

    npm run dev

- Frontend: http://localhost:3000
- API: http://localhost:3001/api

O backend atual não configura interface Swagger/OpenAPI.

Também é possível iniciar cada serviço separadamente:

    npm run start:dev --prefix backend
    npm run dev --prefix frontend

## Encerrar a infraestrutura

    npm run docker:down

Esse comando para os contêineres. Os volumes do PostgreSQL e Redis são mantidos pelo Compose.
