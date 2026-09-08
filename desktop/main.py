"""Entry point do backend do RS KITS Desktop.

Subir o backend local (FastAPI + SQLite no perfil do usuário) de forma
headless — é assim que o Electron inicia a API.

O modo com janela (PyWebView/navegador) permanece para desenvolvimento.

Uso:
    python main.py --no-window            # API headless (modo padrão p/ produto)
    python main.py                        # dev: janela nativa ou navegador
    python main.py --port 19091 --data-dir /tmp/rskits2
"""

import argparse
import logging
import os
import sys
import threading

APP_VERSION = "0.2.0"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="RS KITS Desktop")
    parser.add_argument("--port", type=int, default=None, help="Porta da API local")
    parser.add_argument("--data-dir", default=None, help="Pasta dos dados (SQLite, pacotes)")
    parser.add_argument("--logs-dir", default=None, help="Pasta de logs")
    parser.add_argument("--no-window", action="store_true", help="Não abre janela/navegador")
    parser.add_argument("--console-print", action="store_true", help="Imprime infos no console (única forma útil quando um console existe)")
    return parser.parse_args()


def setup_logging(logs_dir: str) -> None:
    os.makedirs(logs_dir, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        handlers=[
            logging.FileHandler(os.path.join(logs_dir, "backend.log"), encoding="utf-8"),
            logging.StreamHandler(),
        ],
    )


def main() -> None:
    args = parse_args()

    # Variáveis de ambiente ANTES de importar config/server (o Electron
    # também usa este mecanismo para apontar para o perfil do usuário).
    if args.port:
        os.environ.setdefault("RSKITS_PORT", str(args.port))
    if args.data_dir:
        os.environ["RSKITS_DATA_DIR"] = args.data_dir
        os.environ["RSKITS_PACKAGES_DIR"] = os.path.join(args.data_dir, "packages")

    import config
    import server

    setup_logging(args.logs_dir or config.LOGS_DIR)
    config.ensure_dirs()

    log = logging.getLogger("rskits")
    if args.console_print or args.no_window:
        print(f"RS KITS Desktop {APP_VERSION}")
        print(f"  API local  -> {config.APP_URL}/api")
        print(f"  Dados      -> {config.DB_PATH}")
        print(f"  Pacotes    -> {config.PACKAGES_DIR}")
        print(f"  Nuvem (sync) -> {config.CLOUD_URL}")
    log.info("Backend iniciando na porta %s (dados em %s)", config.PORT, config.DB_PATH)

    def run_server() -> None:
        import uvicorn

        uvicorn.run(server.app, host="127.0.0.1", port=config.PORT, log_level="warning")

    if args.no_window:
        run_server()
        return

    gui = False
    try:
        from webview import create_window, start as webview_start

        gui = True
    except Exception:
        gui = False

    import time
    import webbrowser
    from config import APP_URL, TITLE

    def open_browser() -> None:
        time.sleep(0.5)
        webbrowser.open(APP_URL)

    if gui:
        threading.Thread(target=run_server, daemon=True).start()
        try:
            window = create_window(
                title=TITLE,
                url=APP_URL,
                width=1440,
                height=900,
                min_size=(1024, 700),
                resizable=True,
                text_select=True,
            )
            webview_start(debug=False)
            return
        except Exception as exc:
            print(f"  Janela nativa indisponível ({exc}) — abrindo no navegador.")
        open_browser()
        print(f"  Navegador: {APP_URL}  (Ctrl+C para encerrar)")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            return

    print(f"  Iniciando servidor local e abrindo {APP_URL}")
    open_browser()
    try:
        run_server()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)