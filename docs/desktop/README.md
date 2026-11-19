# RS-KITS Desktop

Aplicativo de operação local com frontend Next.js exportado como arquivos estáticos, API FastAPI, banco SQLite e janela nativa PyWebView. Os dados operacionais ficam no perfil local do usuário.

Para detalhes técnicos e limites de sincronização, consulte [arquitetura](architecture.md). Para gerar e publicar executáveis, consulte [downloads](downloads.md).

## Dados locais

Os perfis ficam fora da pasta de instalação: no Windows, `%APPDATA%/RS-KITS/`; no macOS, `~/Library/Application Support/RS-KITS/`; no Linux, `$XDG_CONFIG_HOME/RS-KITS/` ou `~/.config/RS-KITS/` quando a variável não está definida. `RSKITS_HOME` pode substituir a pasta base e `RSKITS_DATA_DIR` pode definir separadamente a pasta do SQLite. Uma distribuição de evento usa um perfil isolado pelo ID do evento.

Copiar o executável transfere o snapshot incorporado na geração, mas não as edições, entregas e estornos gravados depois no SQLite local. Faça backup do perfil operacional para preservar ou transferir esse histórico.

## Executar via Python

Na pasta desktop/, instale os requisitos:

    python -m pip install -r requirements.txt

Gere o frontend estático e inicie o aplicativo. No Linux/macOS:

    cd ../frontend
    NEXT_DESKTOP=1 npm run build
    cd ../desktop
    python main.py

No PowerShell, defina a variável antes do build:

    $env:NEXT_DESKTOP = "1"
    npm run build --prefix frontend
    python desktop/main.py

Para iniciar somente a API local:

    python main.py --no-window

Para usar parâmetros de desenvolvimento:

    python main.py --no-window --port 19091 --data-dir /tmp/rskits-dados --console-print

A porta padrão é 19090. Se estiver ocupada, o servidor escolhe uma porta livre; uma porta informada explicitamente que já esteja ocupada causa erro.

## Dependências nativas

- Windows: Microsoft Edge WebView2 Runtime.
- Linux: GTK3 e WebKitGTK; os pacotes dependem da distribuição.
- macOS: WebKit fornecido pelo sistema.

Em produção a interface abre na janela PyWebView. O modo --no-window é destinado ao servidor local e desenvolvimento.

## Builds

O PyInstaller deve ser executado na plataforma de destino. Para Linux:

    cd desktop
    bash build_linux.sh

Para Windows, execute build_windows.bat dentro de desktop/. O Inno Setup 6 é opcional e gera o instalador; sem ele ainda é possível gerar o executável portátil.

| Caminho | Responsabilidade |
| --- | --- |
| desktop/main.py | Inicializa API, janela PyWebView e segunda tela. |
| desktop/server.py | API FastAPI local e serviço dos arquivos estáticos. |
| desktop/database.py | SQLite, dados locais e inicialização do perfil. |
| desktop/config.py | Diretórios, perfil, porta e caminhos de build. |
| desktop/package_builder.py | Gera pacotes de evento para distribuição. |
| desktop/sync.py e desktop/cloud.py | No perfil limpo, protótipo de envio de registros de auditoria para o serviço demonstrativo, que precisa ser iniciado à parte; em distribuições de evento, push e pull retornam `unsupported`. Não implementa sincronização de atletas com o backend NestJS. |

## Testes do desktop

Com os requisitos de desenvolvimento instalados, execute na raiz:

    python -m pip install -r desktop/requirements-dev.txt
    python -m unittest discover -s desktop -p "test_*.py" -v
