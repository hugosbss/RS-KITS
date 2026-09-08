#!/usr/bin/env bash
# Serve o RS KITS na rede local em UM servidor só (porta 3001):
#   frontend estático + API + downloads na MESMA origem.
# Da máquina Windows basta abrir http://<IP_linux>:3001 no navegador.
#
# Uso:
#   bash backend/scripts/serve-lan.sh
#   bash backend/scripts/serve-lan.sh --ip 192.168.15.99   (força o IP exibido)
# =========================================================================
set -euo pipefail
cd "$(dirname "$0")/../.."

IP="${IP:-$(hostname -I 2>/dev/null | awk '{print $1}')}"
for arg in "$@"; do
  case "$arg" in
    --ip) IP_NEXT=1 ;;
    --ip=*) IP="${arg#--ip=}" ;;
    --*) ;;
  esac
  if [ "${IP_NEXT:-0}" = "1" ]; then IP="$arg"; IP_NEXT=0; fi
done

echo "==> 1. build do frontend (API relativa /api) => out/"
( cd frontend && NEXT_DESKTOP=1 npm run build >/dev/null )

echo "==> 2. copiando frontend para backend/web (servido pelo NestJS)"
rm -rf backend/web && cp -r frontend/out backend/web

echo "==> 3. backend NestJS em http://0.0.0.0:3001 (frontend + /api + /downloads)"
echo "    Windows abra:  http://$IP:3001  (login admin/admin)"
echo
( cd backend && FRONTEND_DIR="$(pwd)/web" exec node dist/src/main.js )