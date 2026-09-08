# SportDelivery — Guia de Setup (Fase 1)

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm

## 1. Subir infraestrutura

```bash
docker compose up -d
```

Isso inicia **PostgreSQL** (porta 5432) e **Redis** (porta 6379).

## 2. Configurar variáveis de ambiente

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

## 3. Instalar dependências

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

Ou na raiz (workspaces):

```bash
npm install
```

## 4. Banco de dados

```bash
cd backend
npx prisma migrate dev --name init
npm run prisma:seed
```

## 5. Executar em desenvolvimento

Na raiz:

```bash
npm run dev
```

Ou separadamente:

```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
cd frontend && npm run dev
```

## URLs

| Serviço   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| API       | http://localhost:3001/api    |
| Swagger   | http://localhost:3001/docs   |

## Credenciais demo (seed)

| Perfil    | E-mail                        | Senha        |
|-----------|-------------------------------|--------------|
| Admin     | admin@sportdelivery.com       | admin123     |
| Operador  | operador@sportdelivery.com    | operador123  |

## Estrutura do projeto

```text
SportDelivery/
├── backend/          # NestJS + Prisma + JWT + Swagger
├── frontend/         # Next.js 15 + Tailwind + PWA + shadcn/ui
├── docker-compose.yml
└── README.md         # Documentação completa do produto
```