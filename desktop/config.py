"""Configurações do RS KITS Desktop.

Local dos dados do usuário (perfil), seguindo o padrão de cada SO:
  Windows -> %APPDATA%\\RS-KITS        (C:\\Users\\<user>\\AppData\\Roaming\\RS-KITS)
  macOS   -> ~/Library/Application Support/RS-KITS
  Linux   -> $XDG_CONFIG_HOME/RS-KITS (padrão ~/.config/RS-KITS)

Estrutura dentro do perfil:
  database/  -> rskits.sqlite (banco local)
  packages/  -> pacotes .rksits instalados
  logs/      -> logs do backend
  config/    -> configurações do app
  cache/     -> cache temporário
"""

import os
import sys


def _runtime_dir() -> str:
    """Pasta onde ficam recursos de runtime do executável (não os dados)."""
    if getattr(sys, "frozen", False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))


def _resource_dir() -> str:
    """Pasta dos recursos empacotados (static) — _MEIPASS quando congelado."""
    if getattr(sys, "frozen", False):
        return getattr(sys, "_MEIPASS", _runtime_dir())
    return os.path.dirname(os.path.abspath(__file__))


def _user_home_dir() -> str:
    """Pasta de perfil do usuário do aplicativo (AppData/RS-KITS)."""
    if os.environ.get("RSKITS_HOME"):
        return os.path.abspath(os.environ["RSKITS_HOME"])
    if sys.platform.startswith("win"):
        base = os.environ.get("APPDATA") or os.path.expanduser("~\\AppData\\Roaming")
        return os.path.join(base, "RS-KITS")
    if sys.platform == "darwin":
        return os.path.join(os.path.expanduser("~/Library/Application Support"), "RS-KITS")
    base = os.environ.get("XDG_CONFIG_HOME") or os.path.expanduser("~/.config")
    return os.path.join(base, "RS-KITS")


BASE_DIR = _runtime_dir()
RESOURCE_DIR = _resource_dir()
HOME_DIR = _user_home_dir()

# Em desenvolvimento (python direto), mantém os dados próximos ao código
# (desktop/sqlite) para não poluir o perfil do usuário. No executável e no
# Electron (que seta RSKITS_HOME), os dados vão para o perfil do usuário.
DATA_DIR = os.environ.get("RSKITS_DATA_DIR") or (
    os.path.join(HOME_DIR, "database") if getattr(sys, "frozen", False) or os.environ.get("RSKITS_HOME")
    else os.path.join(BASE_DIR, "sqlite")
)
DB_PATH = os.path.join(DATA_DIR, "rskits.sqlite")
PACKAGES_DIR = os.environ.get("RSKITS_PACKAGES_DIR") or (
    os.path.join(HOME_DIR, "packages") if getattr(sys, "frozen", False) or os.environ.get("RSKITS_HOME")
    else os.path.join(BASE_DIR, "packages")
)
LOGS_DIR = os.environ.get("RSKITS_LOGS_DIR") or os.path.join(HOME_DIR, "logs")
CONFIG_DIR = os.environ.get("RSKITS_CONFIG_DIR") or os.path.join(HOME_DIR, "config")
CACHE_DIR = os.environ.get("RSKITS_CACHE_DIR") or os.path.join(HOME_DIR, "cache")

STATIC_DIR = os.path.join(RESOURCE_DIR, "static")
CLOUD_DATA_DIR = os.environ.get("RSKITS_CLOUD_DATA") or os.path.join(CACHE_DIR, "cloud")

PORT = int(os.environ.get("RSKITS_PORT", "19090"))
CLOUD_URL = os.environ.get("RSKITS_CLOUD_URL", "http://127.0.0.1:19100")
TITLE = "RS KITS - Entrega de Kits"
APP_URL = f"http://127.0.0.1:{PORT}"


def ensure_dirs() -> None:
    for path in (DATA_DIR, PACKAGES_DIR, LOGS_DIR, CONFIG_DIR, CACHE_DIR, CLOUD_DATA_DIR):
        os.makedirs(path, exist_ok=True)