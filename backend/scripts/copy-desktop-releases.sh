#!/usr/bin/env bash
# Copia os instaladores gerados por desktop/build_desktop.sh para a pasta
# backend/downloads/, de onde o NestJS serve via GET /api/downloads.
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p backend/downloads
cp desktop/electron/release/*.AppImage backend/downloads/ 2>/dev/null || true
cp desktop/electron/release/*_amd64.deb backend/downloads/ 2>/dev/null || true
cp desktop/electron/release/*-win.zip backend/downloads/ 2>/dev/null || true
echo "Instaladores disponíveis no backend:"
ls -lh backend/downloads