"""Entry point oficial do aplicativo desktop RS KITS.

Arquitetura do produto (pasta desktop/):

    Next.js (build estático)  ->  FastAPI local (127.0.0.1)  ->  SQLite
                                        ^
                                        |
                              PyWebView (janela nativa)

Fluxo de inicialização:

    1. resolve diretórios de dados do usuário e cria a estrutura;
    2. inicializa o SQLite;
    3. sobe o FastAPI (127.0.0.1:<porta>) em thread;
    4. aguarda GET /api/health responder;
    5. abre a janela PyWebView (RS KITS) com o frontend estático;
    6. segunda tela: bridge JS (pywebview.api) abre uma segunda janela;
    7. ao fechar a janela, encerra o backend e o processo.

O aplicativo NÃO abre navegador externo em nenhuma hipótese em produção.
Se o PyWebView não estiver disponível em tempo de execução, o aplicativo
encerra com erro explícito (o build empacota o PyWebView).

Uso:
    python main.py                         # janela nativa (PyWebView)
    python main.py --no-window             # apenas a API (headless / CI / dev)
    python main.py --port 19091 --data-dir /tmp/rskits-dados
"""

import argparse
import json
import logging
import os
import sys
import threading
import time
import urllib.request

APP_VERSION = "1.0.0"
TITLE = "RS KITS"
SECOND_SCREEN_TITLE = "RS KITS — Segunda tela"
SECOND_SCREEN_PATH = "/delivery/second-screen"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="RS KITS Desktop")
    parser.add_argument("--port", type=int, default=None, help="Porta da API local")
    parser.add_argument("--data-dir", default=None, help="Pasta dos dados (SQLite, pacotes)")
    parser.add_argument("--logs-dir", default=None, help="Pasta de logs")
    parser.add_argument("--no-window", action="store_true", help="Só sobe a API local (sem janela)")
    parser.add_argument("--console-print", action="store_true",
                        help="Imprime informações básicas no console (modo dev)")
    return parser.parse_args()


def setup_logging(logs_dir: str) -> None:
    os.makedirs(logs_dir, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        handlers=[
            logging.FileHandler(os.path.join(logs_dir, "app.log"), encoding="utf-8"),
            logging.FileHandler(os.path.join(logs_dir, "backend.log"), encoding="utf-8"),
        ],
    )


def start_backend(port: int) -> threading.Thread:
    """Sobe o FastAPI local em thread e devolve a thread."""

    def _run() -> None:
        import uvicorn
        import server  # noqa: F401  (registra rotas; importa e já prepara o SQLite)

        uvicorn.run(server.app, host="127.0.0.1", port=port, log_level="warning")

    thread = threading.Thread(target=_run, name="rskits-backend", daemon=True)
    thread.start()
    return thread


def wait_for_backend(port: int, timeout: float = 30.0) -> bool:
    url = f"http://127.0.0.1:{port}/api/health"
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if response.status == 200:
                    return True
        except Exception:
            pass
        time.sleep(0.3)
    return False


def read_version() -> str:
    return os.environ.get("RSKITS_APP_VERSION") or APP_VERSION


def icon_path() -> str:
    """Ícone da janela (empacotado dentro do executável pelo build)."""
    if getattr(sys, "frozen", False):
        base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(sys.executable)))
        frozen_icon = os.path.join(base, "assets", "icon.ico" if sys.platform.startswith("win") else "icon.png")
        if os.path.exists(frozen_icon):
            return frozen_icon
    dev_icon = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "assets",
        "icon.ico" if sys.platform.startswith("win") else "icon.png",
    )
    if os.path.exists(dev_icon):
        return dev_icon
    return ""


def inject_desktop_bridge(window) -> None:
    """Injeta a ponte desktop na janela principal.

    - expõe window.rskits (compatível com a preload do antigo Electron);
    - intercepta window.open('/delivery/second-screen') para abrir a segunda
      janela PyWebView em vez de cair num navegador.
    """
    script = (
        "(function () {\n"
        "  if (window.__rskitsBridgeInstalled) return;\n"
        "  window.__rskitsBridgeInstalled = true;\n"
        "  var api = (window.pywebview && window.pywebview.api) || null;\n"
        "  window.rskits = {\n"
        "    isDesktop: true,\n"
        "    appVersion: " + json.dumps(read_version()) + ",\n"
        "    openSecondScreen: function () {\n"
        "      if (api && api.open_second_screen) api.open_second_screen();\n"
        "    }\n"
        "  };\n"
        "  var _open = window.open;\n"
        "  window.open = function (url) {\n"
        "    try {\n"
        "      var target = String(url || '');\n"
        "      if (target.indexOf(" + json.dumps(SECOND_SCREEN_PATH) + ") !== -1) {\n"
        "        if (api && api.open_second_screen) api.open_second_screen();\n"
        "        return null;\n"
        "      }\n"
        "    } catch (e) {}\n"
        "    return _open ? _open.apply(window, arguments) : null;\n"
        "  };\n"
        "})();"
    )
    try:
        window.evaluate_js(script)
    except Exception:
        # A janela ainda pode não ter exposto window.pywebview no primeiro load.
        pass


def main() -> None:
    args = parse_args()

    # Variáveis de ambiente ANTES de importar config/server.
    if args.port:
        os.environ.setdefault("RSKITS_PORT", str(args.port))
    if args.data_dir:
        os.environ["RSKITS_DATA_DIR"] = os.path.join(args.data_dir, "database")
        os.environ["RSKITS_PACKAGES_DIR"] = os.path.join(args.data_dir, "packages")
        os.environ["RSKITS_LOGS_DIR"] = os.path.join(args.data_dir, "logs")
        os.environ["RSKITS_CONFIG_DIR"] = os.path.join(args.data_dir, "config")
        os.environ["RSKITS_CACHE_DIR"] = os.path.join(args.data_dir, "cache")

    import config
    import server  # noqa: F401  (importar registra as rotas e prepara o SQLite)

    setup_logging(args.logs_dir or config.LOGS_DIR)
    config.ensure_dirs()

    log = logging.getLogger("rskits")
    log.info("RS KITS Desktop v%s iniciando", APP_VERSION)
    log.info("Sistema: %s (frozen=%s)", sys.platform, getattr(sys, "frozen", False))
    log.info("Banco: %s", config.DB_PATH)
    log.info("Pacotes: %s", config.PACKAGES_DIR)
    log.info("Porta: %s", config.PORT)

    if args.console_print:
        print(f"RS KITS Desktop {APP_VERSION}")
        print(f"  API local  -> {config.APP_URL}/api")
        print(f"  Dados      -> {config.DB_PATH}")
        print(f"  Pacotes    -> {config.PACKAGES_DIR}")

    # -------- Modo headless (sem janela): API local apenas --------
    if args.no_window:
        import uvicorn

        log.info("Backend no ar em %s/api (headless). Ctrl+C para encerrar.", config.APP_URL)
        try:
            uvicorn.run(server.app, host="127.0.0.1", port=config.PORT, log_level="warning")
        except KeyboardInterrupt:
            return
        return

    # -------- Modo gráfico: PyWebView (obrigatório) --------
    try:
        import webview
    except ImportError as exc:
        log.error("PyWebView não está disponível: %s", exc)
        if args.console_print:
            print("ERRO FATAL: PyWebView não está disponível.", file=sys.stderr)
            print("Reinstale com: pip install -r requirements.txt (pywebview incluso).",
                  file=sys.stderr)
        raise SystemExit(1) from exc

    start_backend(config.PORT)
    if not wait_for_backend(config.PORT, timeout=40.0):
        log.error("Backend local não respondeu em %s", config.APP_URL)
        raise SystemExit(1)

    log.info("Backend local OK em %s — abrindo janela PyWebView", config.APP_URL)

    webview.settings["ALLOW_DOWNLOADS"] = True
    webview.settings["OPEN_EXTERNAL_LINKS_IN_BROWSER"] = False

    state = {"second": None}

    def open_second_screen() -> None:
        second = state["second"]
        if second is not None:
            try:
                if hasattr(second, "restore"):
                    second.restore()
                return
            except Exception:
                pass
        try:
            second = webview.create_window(
                SECOND_SCREEN_TITLE,
                url=f"{config.APP_URL}{SECOND_SCREEN_PATH}",
                width=1280,
                height=800,
                min_size=(800, 600),
                resizable=True,
                background_color="#0f172a",
                text_select=True,
            )
            if second is not None:
                second.events.closed += lambda: state.__setitem__("second", None)
                state["second"] = second
        except Exception as exc:
            log.warning("Não foi possível abrir a segunda tela: %s", exc)

    class RskitsApi:
        """Bridge JS -> Python, exposta como window.pywebview.api.*"""

        def open_second_screen(self) -> None:
            open_second_screen()

    def on_loaded(window) -> None:
        inject_desktop_bridge(window)

    main_window = webview.create_window(
        TITLE,
        url=config.APP_URL,
        width=1440,
        height=900,
        min_size=(1024, 700),
        resizable=True,
        text_select=True,
        js_api=RskitsApi(),
    )

    try:
        main_window.events.loaded += on_loaded
    except Exception:
        pass

    log.info("Abrindo janela PyWebView (backend em %s)", config.APP_URL)
    webview.start(debug=False, icon=icon_path() or None)
    log.info("Janela fechada — encerrando o aplicativo.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)