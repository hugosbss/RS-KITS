#!/usr/bin/env bash
# Copia os instaladores gerados por desktop/build_linux.sh / build_windows.bat
# para a pasta backend/downloads/, de onde o NestJS serve via GET /api/downloads.
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p backend/downloads
cp desktop/release/linux/*.AppImage backend/downloads/ 2>/dev/null || true
cp desktop/release/linux/*.deb backend/downloads/ 2>/dev/null || true
cp desktop/release/windows/RS-KITS-Setup-*.exe backend/downloads/ 2>/dev/null || true
cp desktop/release/windows/RS-KITS-*.exe backend/downloads/ 2>/dev/null || true
echo "Instaladores disponíveis no backend:"
ls -lh backend/downloads