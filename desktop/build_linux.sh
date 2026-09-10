#!/usr/bin/env bash
# =============================================================================
# Build LINUX do RS KITS Desktop.
#
# Pipeline:
#   Next.js (NEXT_DESKTOP=1) -> frontend/out
#       -> build/static (copiado)
#       -> PyInstaller (erro se PyWebView não estiver instalado)
#       -> dist/RS-KITS (executável único, janela nativa)
#       -> AppImage (RS-KITS-<versão>.AppImage) se appimagetool estiver disponível
#
# Resultado em desktop/release/linux/.
#
# Uso:
#   bash build_linux.sh            # versão do arquivo build.py/__version__ (1.0.0)
#   RSKITS_VERSION=1.1.0 bash build_linux.sh
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

VERSION="${RSKITS_VERSION:-1.0.0}"
PY="${RSKITS_PYTHON:-python3}"
# Só usa o .venv local se ele tiver pip e pywebview instalados.
if [ -x ".venv/bin/python" ] \
   && ".venv/bin/python" -m pip --version >/dev/null 2>&1 \
   && ".venv/bin/python" -c "import webview" >/dev/null 2>&1; then
  PY=".venv/bin/python"
fi

echo "==> 1. dependências (pywebview NÃO pode faltar — o build falha sem ele)"
# --break-system-packages: Python "externally managed" do Debian/Ubuntu (PEP 668).
"$PY" -m pip install --break-system-packages -r requirements.txt

echo "==> 2. ícones (PNG)"
mkdir -p build/assets
"$PY" scripts/gen-icon.py --out build/assets

echo "==> 3. build estático do Next.js => frontend/out"
( cd ../frontend && NEXT_DESKTOP=1 NEXT_PUBLIC_API_URL=http://127.0.0.1:19090/api npm run build )

echo "==> 4. copiando frontend/out => build/static"
rm -rf build/static
cp -r ../frontend/out build/static
# Remove fluxos NTFS (Zone.Identifier) que vazam como arquivos ilegais.
find build/static -name "*:Zone.Identifier" -delete 2>/dev/null || true

echo "==> 5. PyInstaller (onefile, janela nativa, sem console)"
rm -rf dist release/linux build/pyi-work
"$PY" -m PyInstaller --noconfirm --clean --log-level=WARN --workpath build/pyi-work --distpath dist rskits.spec

if [ ! -f "dist/RS-KITS" ]; then
  echo "ERRO: PyInstaller não gerou dist/RS-KITS" >&2
  exit 1
fi

mkdir -p release/linux

# -----------------------------------------------------------------------------
# 6. AppImage (opcional — usa appimagetool se disponível)
# -----------------------------------------------------------------------------
APPIMAGETOOL=$(command -v appimagetool || true)
if [ -z "$APPIMAGETOOL" ] && [ -x ./appimagetool ]; then
  APPIMAGETOOL=./appimagetool
fi
if [ -z "$APPIMAGETOOL" ] && [ -n "${DOWNLOAD_APPIMAGE_TOOL:-}" ] && [ -x ../appimagetool ]; then
  APPIMAGETOOL=../appimagetool
fi

APPNAME="RS KITS"
APPDIR="build/AppDir-$VERSION"
rm -rf "$APPDIR"
mkdir -p "$APPDIR/usr/bin" "$APPDIR/usr/share/applications" "$APPDIR/usr/share/icons/hicolor/256x256/apps"

cp dist/RS-KITS "$APPDIR/usr/bin/rs-kits"
cp build/assets/icon.png "$APPDIR/usr/share/icons/hicolor/256x256/apps/rs-kits.png"
cp build/assets/icon.png "$APPDIR/RS-KITS.png"

cat > "$APPDIR/usr/bin/rskits-start" <<EOF
#!/bin/sh
# AppRun simplificado: executa o binário empacotado (que já contém o frontend).
exec "\$(dirname "\$0")/rs-kits" "\$@"
EOF
chmod +x "$APPDIR/usr/bin/rskits-start"

cat > "$APPDIR/rs-kits.desktop" <<EOF
[Desktop Entry]
Name=RS KITS
Comment=Entrega de Kits (offline-first)
Exec=rs-kits
Icon=rs-kits
Terminal=false
Type=Application
Categories=Office;Utility;
StartupWMClass=RS KITS
EOF

cat > "$APPDIR/AppRun" <<EOF
#!/bin/sh
exec "\$(dirname "\$0")/usr/bin/rs-kits" "\$@"
EOF
chmod +x "$APPDIR/AppRun"
cp "$APPDIR/rs-kits.desktop" "$APPDIR/usr/share/applications/rs-kits.desktop"

if [ -n "$APPIMAGETOOL" ]; then
  echo "==> 6. gerando AppImage (appimagetool)"
  "$APPIMAGETOOL" "$APPDIR" "release/linux/RS-KITS-$VERSION.AppImage"
  chmod +x "release/linux/RS-KITS-$VERSION.AppImage"
else
  echo "==> 6. appimagetool ausente -> mantendo binário standalone"
  cp dist/RS-KITS "release/linux/RS-KITS-$VERSION"
  chmod +x "release/linux/RS-KITS-$VERSION"
  echo "    (instale o appimagetool e rode o script novamente para gerar o .AppImage)"
fi

echo
echo "Pronto! Artefato Linux em desktop/release/linux/:"
ls -lh release/linux/