# RS KITS

Sistema de entrega de kits para eventos esportivos, com modo web e executável desktop offline-first.

## Estrutura

- `frontend/` — interface Next.js (web e desktop)
- `backend/` — API central NestJS + Prisma (sync online)
- `desktop/` — aplicativo instalado: Python/FastAPI + SQLite + Electron

## O que já foi feito

- **Backend local (FastAPI)**: API Python em `desktop/`, banco SQLite no perfil do usuário (`%AppData%/RS-KITS` no Windows, `~/.config/RS-KITS` no Linux), migração automática do banco antigo.
- **Adapter local**: `server.py` fala o contrato do frontend (Bearer `access_token`, `/auth/register`, campos camelCase `createdAt`/`organizerId`, `distancia`/`nascimento`, vínculo `/events/{id}/organizers`, PATCH com todos os campos de entrega) — preservando o `X-Userid` legado.
- **Frontend (Next.js)**: rotas de login, dashboard, entrega de kit, segunda tela, eventos, filtros, import, relatórios e configurações. Tela de Entrega com busca, PIN, entrega/estorno, zerar entregas, sorteio com filtros, edição de atleta e segunda tela.
- **Shell Electron**: janela nativa, ícone próprio, menu, segunda tela em segundo monitor, spawn automático do backend, healthcheck, servidor estático do build do Next, auto-update configurado, dados em `RS-KITS`.
- **Build estático do Next**: `NEXT_DESKTOP=1` gera `frontend/out` com a API local embutida (`NEXT_PUBLIC_API_URL`).
- **Builders**: `desktop/build_exe.sh` (backend PyInstaller) e `desktop/build_desktop.sh` (ícones + backend + Next + electron-builder).
- **Validações**: smoke do backend passou; harness das rotas do SPA para ADMIN/OPERADOR/ORGANIZADOR sem erros; testes HTTP do adapter e boot real do Electron (backend :19090, frontend :19091) OK.
- **Registro técnico completo** em `task.md`.

## O que falta

1. **Instalador** — rodar `./build_desktop.sh` completo (PyInstaller do backend + electron-builder) e definir a **URL real de release** do auto-update (hoje placeholder).
2. **Sync com NestJS** — validar ponta a ponta `sync.py` ↔ `backend/` (fila offline → push/pull quando volta a internet).
3. **UX da tela de Entrega** — ajuste fino conforme AGENTS.md (ex.: `DeliveryEventModal` ainda não ligado ao cabeçalho; cores de status verde/amarelo já previstas).
4. **Teste em máquina limpa** — instalar o `.exe`/AppImage e conferir o fluxo offline completo: abrir → logar → importar → entregar → fechar → reabrir.

## Como rodar

- Desenvolvimento (web): `npm run dev` (NestJS :3001 + Next :3000)
- Desktop em dev: `desktop/electron` com `npm run dev` (usa `next dev` :3000) ou o static server local (:19091)
- Build do produto: `bash desktop/build_desktop.sh`