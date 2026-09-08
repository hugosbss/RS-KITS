#!/usr/bin/env bash
# Compila o backend do RS KITS Desktop como executável único.
#
# Resultado:
#   dist/rskits-backend   -> backend headless (FastAPI + SQLite) que o
#                            Electron inicia (janela/console oculto).
#   dist/rskits           -> (legado) protótipo standalone que abre navegador.
#
# Onde guardar os dados quando congelado: perfil do usuário
# (AppData/Roaming/RS-KITS no Windows, ~/.config/RS-KITS no Linux) — ver
# config.py. O Electron também pode forçar via RSKITS_HOME.
set -euo pipefail
cd "$(dirname "$0")"

PY=python3
if command -v pyinstaller >/dev/null 2>&1; then
  PY="python3"
fi

echo "==> backend (windowed, para o Electron)"
"$PY" -m PyInstaller --noconfirm --clean --onefile --noconsole --name rskits-backend \
  --distpath dist --workpath /tmp/rskits-build/work --specpath /tmp/rskits-build \
  --collect-all uvicorn --collect-all fastapi \
  --add-data "$(pwd)/static:static" \
  -p . main.py

echo "==> legado standalone (console + navegador)"
"$PY" -m PyInstaller --noconfirm --clean --onefile --console --name rskits \
  --distpath dist --workpath /tmp/rskits-build/work2 --specpath /tmp/rskits-build \
  --collect-all uvicorn --collect-all fastapi \
  --add-data "$(pwd)/static:static" \
  -p . main.py

echo
echo "Prontos em $(pwd)/dist:"
ls -lh dist/rskits-backend dist/rskits
echo
echo "Para o Windows, rode no Windows (ou gere via electron-builder no próximo passo):"
echo "  dist/rskits-backend.exe"