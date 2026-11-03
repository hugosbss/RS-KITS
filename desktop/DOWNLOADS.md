# Downloads Windows

A aba `/downloads` é exclusiva de administradores e oferece o aplicativo limpo ou com evento, atletas, organizadores e seus operadores. Organizadores e operadores não acessam a página nem as APIs de download. O backend incorpora um snapshot do banco ao executável portátil. O usuário recebe apenas um `.exe`.

## Publicação

Gere uma nova build executando `desktop\build_windows.bat`. Ela produz `RS-KITS-<versão>.exe` e `RS-KITS-<versão>.exe.json`.

Na raiz do projeto, publique os dois arquivos:

```powershell
powershell -ExecutionPolicy Bypass -File backend\scripts\copy-desktop-releases.ps1
```

Se o servidor usa `DOWNLOADS_DIR`, copie ambos para essa pasta. O manifesto precisa declarar `embeddedDataVersion: 1` e `eventIsolationVersion: 1`; o backend não personaliza builds anteriores sem a proteção de isolamento. Não edite o manifesto de um executável antigo para fazê-lo passar: gere uma nova build. O Inno Setup é opcional e não participa da personalização do evento.

## Dados locais

Na primeira abertura, o desktop verifica SHA-256, identidade do evento e dos atletas, importa os dados em uma transação e vincula o banco ao evento. O perfil é estável por ID de evento em `%APPDATA%/RS-KITS/profiles/event-<hash-do-evento>`. Downloads posteriores do mesmo evento reutilizam esse banco e acrescentam novos atletas/usuários, preservando registros existentes, credenciais, edições locais, entregas e estornos. Dados removidos do snapshot não são excluídos do banco operacional.

Se houver exatamente um perfil antigo `event-<hash>-<snapshot>` com banco, ele é reutilizado diretamente, sem mover/copiar nem sobrescrever dados. Se houver vários, a abertura é bloqueada: escolha explicitamente o banco operacional usando `RS-KITS.exe --data-dir "C:\caminho\do\perfil"` (a pasta deve conter `database/rskits.sqlite`). Não há seleção por data nem fusão automática de bancos divergentes. Overrides de diretório também passam pela verificação do vínculo do banco ao evento.

Uma distribuição de evento não aceita criar/excluir o evento vinculado nem instalar pacotes de outro evento. O aplicativo genérico/limpo continua permitindo administrar seus próprios eventos. Builds genéricas não procuram pacotes em Downloads/Desktop por padrão; a compatibilidade antiga exige a opção explícita `RSKITS_AUTO_IMPORT_PACKAGES=1`.

Cada processo reserva seu próprio listener local. A porta preferida é 19090; se estiver ocupada, usa uma porta livre. Uma porta explícita ocupada gera erro. O frontend desktop usa `/api` na origem da própria janela, e a verificação de saúde confere tanto a instância quanto o evento. O mesmo banco não pode ser aberto simultaneamente por duas instâncias novas: o bloqueio é liberado pelo sistema operacional ao encerrar o processo.

Entrega, estorno e edição só aparecem como concluídos após resposta de gravação bem-sucedida. Falhas ficam visíveis e permitem nova tentativa. Não há indicação de sucesso baseada apenas no cache do navegador. A sincronização central das distribuições de evento retorna explicitamente `unsupported` até existir um cliente compatível com o protocolo central; não confirma envio nem modifica o banco local.

O perfil `clean` inicia apenas com `admin@rskits.com / admin123` e preserva os cadastros feitos posteriormente. Perfis antigos não são apagados. Distribuições incorporadas não buscam pacotes antigos em Downloads ou na Área de Trabalho.

As requisições do frontend desktop incluem o identificador da instância confirmado na inicialização. Uma janela antiga ou ligada a outro processo recebe erro antes de acessar dados. Feche e substitua as versões anteriores: elas não possuem o bloqueio de banco implementado nesta versão.

Copiar somente o executável para outra máquina transporta o snapshot incorporado, não as entregas ou alterações feitas posteriormente no SQLite local. Preserve o perfil operacional junto com seu backup para transferir esse histórico.

## Validação sem build

Na raiz:

```powershell
python -m pip install -r desktop/requirements-dev.txt
python -m unittest discover -s desktop -p "test_*.py" -v
```

Os testes usam bancos temporários e verificam importação, credenciais, reabertura, duplicidades e compatibilidade com o leitor PyInstaller quando há um executável local disponível. Uma nova build ainda precisa ser aberta no Windows para validar a janela e o fluxo completo.
