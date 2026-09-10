# -*- mode: python ; coding: utf-8 -*-
"""Spec do PyInstaller para o RS KITS Desktop (PyWebView + FastAPI + SQLite).

Usada pelos scripts:
    build_windows.bat   (Windows)
    build_linux.sh      (Linux)

Pré-requisito: a pasta build/static deve conter o frontend estático
(frontend/out) e build/assets os ícones (gerados por scripts/gen-icon.py),
ver os scripts de build.

Produto: executável único (onefile) — RS-KITS.exe (Windows) / RS-KITS (Linux),
janela nativa PyWebView, sem console.
"""

import os
import sys

from PyInstaller.utils.hooks import collect_all, collect_submodules

SPEC_BUILD_DIR = os.environ.get("RSKITS_SPEC_BUILD", os.path.join(SPECPATH, "build"))
STATIC_DIR = os.environ.get("RSKITS_SPEC_STATIC", os.path.join(SPEC_BUILD_DIR, "static"))
# Ícones gerados pelos scripts em build/assets (gen-icon.py --out build/assets).
ASSETS_DIR = os.environ.get("RSKITS_SPEC_ASSETS", os.path.join(SPEC_BUILD_DIR, "assets"))

datas = []
binaries = []
hiddenimports = []

# Frontend estático (build do Next.js) embutido em static/
if os.path.isdir(STATIC_DIR):
    datas.append((STATIC_DIR, "static"))
    print(f"[spec] frontend estático embutido: {STATIC_DIR}")
else:
    print(f"[spec] ATENCAO: pasta de static nao encontrada em {STATIC_DIR}")

# Ícones (janela em runtime)
if os.path.isdir(ASSETS_DIR):
    for entry in sorted(os.listdir(ASSETS_DIR)):
        full = os.path.join(ASSETS_DIR, entry)
        if os.path.isfile(full):
            datas.append((full, "assets"))
    print(f"[spec] icones embutidos de {ASSETS_DIR}")

# FastAPI + uvicorn (mesma técnica do build anterior)
for package in ("uvicorn", "fastapi"):
    tmp = collect_all(package)
    datas += tmp[0]
    binaries += tmp[1]
    hiddenimports += tmp[2]

# PyWebView — colhe todos os backends disponíveis para o SO de destino.
hiddenimports += collect_submodules("webview")
if sys.platform.startswith("win"):
    hiddenimports += ["webview.platforms.edgechromium", "webview.platforms.winforms"]
    # edgechromium usa clr_loader/pythonnet para carregar o WebView2
    try:
        tmp = collect_all("clr_loader")
        datas += tmp[0]
        hiddenimports += tmp[2]
    except Exception:
        pass
else:
    hiddenimports += ["webview.platforms.gtk"]

# webview pode invocar janelas em threads/multiprocessing
hiddenimports += ["multiprocessing", "threading"]

a = Analysis(
    ["main.py"],
    pathex=[SPECPATH],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter.test", "unittest", "pydoc_data"],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

window_icon = os.path.join(ASSETS_DIR, "icon.ico" if sys.platform.startswith("win") else "icon.png")
exe_icon = window_icon if os.path.exists(window_icon) else None

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="RS-KITS",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=exe_icon,
)