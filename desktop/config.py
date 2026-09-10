"""Configurações do RS KITS Desktop.

Dados do usuário (perfil), seguindo o padrão de cada SO:
  Windows -> %APPDATA%\\RS-KITS        (C:\\Users\\<user>\\AppData\\Roaming\\RS-KITS)
  macOS   -> ~/Library/Application Support/RS-KITS
  Linux   -> $XDG_CONFIG_HOME/RS-KITS  (padrão ~/.config/RS-KITS)

Estrutura dentro do perfil:
  database/  -> rskits.sqlite (banco local, único)
  packages/  -> pacotes .rksits instalados
  logs/      -> app.log e backend.log
  config/    -> configurações do app
  cache/     -> cache temporário / dados de nuvem

O banco NUNCA fica na pasta de instalação (Program Files, dist/release),
mantendo os dados do usuário intactos entre atualizações/reinstalações.
"""

import os
import sys


def _resource_dir() -> str:
    """Pasta dos recursos empacotados (static, assets) — _MEIPASS quando congelado."""
    if getattr(sys, "frozen", False):
        return getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(sys.executable)))
    return os.path.dirname(os.path.abspath(__file__))


def _user_home_dir() -> str:
    """Pasta de perfil do usuário do aplicativo (%APPDATA%/RS-KITS ou ~/.config/RS-KITS)."""
    if os.environ.get("RSKITS_HOME"):
        return os.path.abspath(os.environ["RSKITS_HOME"])
    if sys.platform.startswith("win"):
        base = os.environ.get("APPDATA") or os.path.expanduser("~\\AppData\\Roaming")
        return os.path.join(base, "RS-KITS")
    if sys.platform == "darwin":
        return os.path.join(os.path.expanduser("~/Library/Application Support"), "RS-KITS")
    base = os.environ.get("XDG_CONFIG_HOME") or os.path.expanduser("~/.config")
    return os.path.join(base, "RS-KITS")


RESOURCE_DIR = _resource_dir()
HOME_DIR = _user_home_dir()

DATA_DIR = os.environ.get("RSKITS_DATA_DIR") or os.path.join(HOME_DIR, "database")
DB_PATH = os.path.join(DATA_DIR, "rskits.sqlite")
PACKAGES_DIR = os.environ.get("RSKITS_PACKAGES_DIR") or os.path.join(HOME_DIR, "packages")
LOGS_DIR = os.environ.get("RSKITS_LOGS_DIR") or os.path.join(HOME_DIR, "logs")
CONFIG_DIR = os.environ.get("RSKITS_CONFIG_DIR") or os.path.join(HOME_DIR, "config")
CACHE_DIR = os.environ.get("RSKITS_CACHE_DIR") or os.path.join(HOME_DIR, "cache")

# Release directory: pastas release/ dentro do perfil do usuário (padrão Windows:
# %APPDATA%/RS-KITS/release). Fallback para frontend/release apenas em desenvolvimento.
RELEASE_DIR = os.environ.get("RSKITS_RELEASE_DIR") or os.path.join(HOME_DIR, "release")
    """Diretório com o frontend estático servido pelo FastAPI.

    - Empacotado (frozen): pasta `static/` embutida no executável (contém o
      build do Next.js copiado pelo build/build_linux.sh, build_windows.bat).
    - Desenvolvimento (python direto): usa `frontend/out` quando existir
      (rastreado via NEXT_DESKTOP=1).
    """
    env = os.environ.get("RSKITS_STATIC_DIR")
    if env and os.path.isdir(env) and os.path.exists(os.path.join(env, "index.html")):
        return os.path.abspath(env)

    if getattr(sys, "frozen", False):
        return os.path.join(RESOURCE_DIR, "static")

    candidates = [
        os.path.join(os.path.dirname(RESOURCE_DIR), "frontend", "out"),  # build do Next.js
    ]
    for candidate in candidates:
        if os.path.isdir(candidate) and os.path.exists(os.path.join(candidate, "index.html")):
            return candidate
    return candidates[0]


STATIC_DIR = _static_dir()
RELEASE_DIR = os.environ.get("RSKITS_RELEASE_DIR") or os.path.join(RESOURCE_DIR, "release")

CLOUD_DATA_DIR = os.environ.get("RSKITS_CLOUD_DATA") or os.path.join(CACHE_DIR, "cloud")

PORT = int(os.environ.get("RSKITS_PORT", "19090"))
CLOUD_URL = os.environ.get("RSKITS_CLOUD_URL", "http://127.0.0.1:19100")
TITLE = "RS KITS - Entrega de Kits"
APP_URL = f"http://127.0.0.1:{PORT}"


def ensure_dirs() -> None:
    for path in (DATA_DIR, PACKAGES_DIR, LOGS_DIR, CONFIG_DIR, CACHE_DIR, CLOUD_DATA_DIR):
        os.makedirs(path, exist_ok=True)