# RS KITS

Sistema de entrega de kits para eventos esportivos, com modo web e executável desktop offline-first.

## Estrutura

- `frontend/` — interface Next.js (web e desktop)
- `backend/` — API central NestJS + Prisma (sync online)
- `desktop/` — aplicativo instalado: PyWebView (janela nativa) + FastAPI + SQLite

## Arquitetura do desktop

```
Next.js (frontend/out, estático)
        ↓
PyWebView (janela nativa — sem Electron, sem navegador externo)
        ↓
FastAPI local (127.0.0.1:19090) → /api/health
        ↓
SQLite (perfil do usuário, nunca na pasta de instalação)
```

- Windows: dados em `%APPDATA%\RS-KITS\` · Linux: `~/.config/RS-KITS/`
- Banco: `database/rskits.sqlite` (nunca em `Program Files`; atualizar/reinstalar não apaga dados)
- Segunda tela e bridge JS↔Python (`window.rskits` / `window.pywebview.api`) dentro do próprio app

## O que já foi feito

- **Backend local (FastAPI)**: API Python em `desktop/`, SQLite no perfil do usuário, contrato do frontend (Bearer `access_token`, campos camelCase `createdAt`/`organizerId`, `distancia`/`nascimento`).
- **Frontend (Next.js)**: login, dashboard, entrega de kit, segunda tela, eventos, filtros, import, relatórios e configurações. Entrega com busca, entrega/estorno, zerar entregas, sorteio com filtros, edição de atleta e segunda tela.
- **Shell PyWebView**: `desktop/main.py` sobe a API, injeta a ponte JS e abre a janela; `--no-window` para headless/CI.
- **Build estático**: `NEXT_DESKTOP=1` gera `frontend/out` com a API local embutida (`NEXT_PUBLIC_API_URL=http://127.0.0.1:19090/api`).
- **Builders**: `desktop/build_linux.sh` (Linux) e `desktop/build_windows.bat` + `installer_windows.iss` (Windows).
- **Downloads**: backend web serve os instaladores em `GET /api/downloads` (pasta `backend/downloads/`); o frontend em `Settings` mostra os botões Windows/Linux; o desktop também expõe a mesma rota local.
- **Pacote de evento `.rksits`**: geração/instalação separada do instalador do aplicativo (Settings → "Gerar executável (.rksits)").

## Como rodar (web / dev)

- Desenvolvimento (web): NestJS `:3001` + Next `:3000` (`npm run dev` no `backend/` e `frontend/`)
- Desktop em dev: `cd desktop && python3 main.py` (usa `../frontend/out`)

## Build do produto

- Linux: `cd desktop && bash build_linux.sh` → `release/linux/RS-KITS-<versão>.AppImage`
- Windows (em máquina Windows): `cd desktop && build_windows.bat` → `release\windows\RS-KITS-Setup-<versão>.exe`
- Publicar instaladores no web: `backend/scripts/copy-desktop-releases.sh` → `backend/downloads/`

Mais detalhes em `desktop/README.md`.