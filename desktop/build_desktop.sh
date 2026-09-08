#!/usr/bin/env bash
# =========================================================================
# Build do produto desktop RS KITS:
#   Electron (janela/ícone/2ª tela/installer) + Next.js (interface) + FastAPI
#   (backend local, SQLite no perfil do usuário).
#
# Resultados:
#   desktop/electron/release/   -> instalador (Setup .exe / AppImage / .deb)
#   desktop/dist/rskits-backend -> binário backend interno
#
# Uso:
#   bash desktop/build_desktop.sh
#   bash desktop/build_desktop.sh --skip-next   (reusa frontend/out pronto)
#   bash desktop/build_desktop.sh --win         (gera Installer Windows - NSIS)
# =========================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

SKIP_NEXT=0
TARGET_ARGS=()
for arg in "$@"; do
  case "$arg" in
    --skip-next) SKIP_NEXT=1 ;;
    --win) TARGET_ARGS=(--win nsis) ;;
    *) TARGET_ARGS+=("$arg") ;;
  esac
done

echo "==> 1. ícones"
python3 desktop/scripts/gen-icon.py --out desktop/electron/assets

echo "==> 2. backend local (FastAPI + SQLite) => dist/rskits-backend"
bash desktop/build_exe.sh >/dev/null

if [ "$SKIP_NEXT" = "0" ]; then
  echo "==> 3. build estático do Next.js => frontend/out (API local :19090)"
  ( cd frontend && NEXT_DESKTOP=1 NEXT_PUBLIC_API_URL=http://127.0.0.1:19090/api npm run build )
fi

# Remove fluxos NTFS (Mark of the Web) que vazam como arquivos "nome:Zone.Identifier".
# Tais nomes são ilegais no Windows e fazem a extração falhar com 0x80070057.
echo "==> 3.5. limpar lixo de download (Zone.Identifier) em public/ e out/"
find frontend/public frontend/out -name "*:Zone.Identifier" -delete 2>/dev/null || true

echo "==> 4. Electron (package + instalador)"
( cd desktop/electron && npm install --no-audit --no-fund && npm run dist ${TARGET_ARGS[@]+"${TARGET_ARGS[@]}"} )

echo
echo "Pronto! Instaladores em desktop/electron/release/:"
ls -lh desktop/electron/release || true