# RS - KITS

Sistema de gestão de eventos esportivos, cadastro de atletas e entrega de kits. O projeto pode ser usado pelo navegador, conectado à API central, ou como aplicativo desktop para operação local.

## Índice

- [Stack e arquitetura](#stack-e-arquitetura)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Executar o projeto web](#executar-o-projeto-web)
- [Criar a build desktop e o executável Windows](#criar-a-build-desktop-e-o-executável-windows)
- [Dados e perfis do aplicativo desktop](#dados-e-perfis-do-aplicativo-desktop)
- [Telas e fluxos do sistema](#telas-e-fluxos-do-sistema)
- [Permissões](#permissões)
- [Relatórios e formatos exportados](#relatórios-e-formatos-exportados)
- [Qualidade e testes](#qualidade-e-testes)
- [Documentos complementares](#documentos-complementares)

## Stack e arquitetura

| Parte           | Tecnologias                                           | Responsabilidade                                                                            |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Frontend        | Next.js 15, React 19, TypeScript, Tailwind CSS 4, PWA | Telas web e frontend estático embutido no aplicativo desktop.                               |
| API web         | NestJS 10, TypeScript, Prisma, JWT                    | Autenticação, permissões, eventos, usuários, atletas, auditoria, relatórios e downloads.    |
| Banco web       | PostgreSQL 16                                         | Armazena os dados centrais usados pelo sistema web.                                         |
| Desktop         | Python 3.10+, FastAPI, Uvicorn, SQLite, PyWebView     | Executa a API local, mantém os dados no computador e abre a interface em uma janela nativa. |
| Empacotamento   | PyInstaller; Inno Setup 6 opcional no Windows         | Gera o executável portátil e, se instalado, um instalador Windows.                          |
| Testes frontend | Vitest, jsdom e Testing Library                       | Testes unitários e de integração das telas e dos componentes React.                         |

O frontend web chama a API pela rota `/api`. Durante o desenvolvimento, o Next.js encaminha essas chamadas para o NestJS, por padrão em `http://localhost:3001`. No desktop, o mesmo frontend é exportado como arquivos estáticos e servido pela API FastAPI local.

```text
Web:     Navegador → Next.js → /api → NestJS → PostgreSQL
Desktop: PyWebView → frontend estático → FastAPI local → SQLite do perfil
```

O projeto usa npm workspaces para instalar e executar frontend e backend a partir da raiz. O `docker-compose.yml` inicia PostgreSQL e Redis para desenvolvimento local; os dados de aplicação do backend ficam no PostgreSQL. A PWA é usada no navegador e fica desativada no modo de desenvolvimento e na build desktop.

## Estrutura do repositório

```text
frontend/                 Aplicação Next.js e componentes React
backend/                  API NestJS, Prisma, migrações e seed
desktop/                  Aplicativo Python, API FastAPI, SQLite e builds
desktop/DOWNLOADS.md      Publicação e isolamento dos executáveis de evento
SETUP.md                  Notas adicionais de configuração
TESTING.md                Convenções e detalhes da cobertura do frontend
```

## Executar o projeto web

### Pré-requisitos

- Node.js 20 ou superior e npm.
- Docker Desktop com Docker Compose, ou uma instância PostgreSQL compatível.

### Instalação e inicialização

Na raiz do repositório, execute:

```powershell
npm install
npm run docker:up
Copy-Item backend/.env.example backend/.env
```

No arquivo `backend/.env`, configure a conexão com o banco local do Docker Compose. A porta publicada pelo Compose é `5433`:

```env
DATABASE_URL="postgresql://rskits:rskits@localhost:5433/rskits?schema=public"
JWT_SECRET="substitua-por-uma-chave-forte"
JWT_EXPIRES_IN="8h"
PORT=3001
```

Aplique as migrações e crie o administrador inicial:

```powershell
npm run db:migrate
npm run db:seed
```

> **Observação:** `backend/.env.example` contém uma URL de exemplo com a porta padrão `5432`. Para usar o PostgreSQL iniciado pelo Compose deste projeto a partir do Windows, ajuste para a porta publicada `5433`, como no exemplo acima. O frontend não exige um `.env.local` para iniciar no modo web; o proxy da API usa `http://localhost:3001` por padrão. Para apontar para outra API, configure `NEXT_PUBLIC_API_PROXY` antes de iniciar o Next.js.

Inicie frontend e backend juntos:

```powershell
npm run dev
```

Endereços locais:

- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001/api](http://localhost:3001/api)
- Swagger: [http://localhost:3001/docs](http://localhost:3001/docs)

O seed cria a conta inicial `admin@rskits.com` com senha `admin123`. Essas credenciais são para desenvolvimento inicial; configure credenciais próprias antes de compartilhar ou publicar um ambiente.

Para aplicar migrações já existentes em um ambiente implantado, use `npm run prisma:deploy --prefix backend`.

## Criar a build desktop e o executável Windows

O script Windows já compila a versão estática do frontend, copia os arquivos para o pacote Python e executa o PyInstaller. Não é necessário compilar o frontend separadamente.

No Prompt de Comando:

```bat
cd /d C:\RS-KITS\desktop
build_windows.bat
```

Ou, a partir da raiz do projeto:

```bat
desktop\build_windows.bat
```

Para definir uma versão diferente da versão padrão `1.0.0`:

```bat
set RSKITS_VERSION=1.1.0 && build_windows.bat
```

O build precisa ser executado no Windows. O script instala as dependências Python declaradas em `desktop/requirements.txt`, compila o Next.js com `NEXT_DESKTOP=1`, gera o frontend estático em `frontend/out` e produz o executável com PyInstaller.

Os arquivos principais ficam em `desktop/release/windows/`:

- `RS-KITS-<versão>.exe`: executável portátil.
- `RS-KITS-<versão>.exe.json`: manifesto de compatibilidade usado pelo servidor para gerar executáveis limpos ou com dados de evento.
- `RS-KITS-Setup-<versão>.exe`: instalador opcional, criado quando o Inno Setup 6 (`ISCC.exe`) está instalado.

O Inno Setup é necessário somente para produzir o arquivo `Setup.exe`. A ausência dele não impede a geração do executável portátil. As máquinas de destino precisam do runtime WebView2 do Microsoft Edge para abrir a janela do aplicativo; o instalador pode incluir o instalador desse runtime quando o arquivo estiver disponível em `desktop/prereqs/`.

Para publicar a build no sistema web, copie o executável e o manifesto juntos para `backend/downloads/`:

```powershell
powershell -ExecutionPolicy Bypass -File backend\scripts\copy-desktop-releases.ps1
```

Se o backend estiver configurado com `DOWNLOADS_DIR`, publique os dois arquivos no diretório apontado por essa variável.

### Build desktop Linux

Em uma máquina Linux com as dependências de GTK/WebKit instaladas:

```bash
cd desktop
bash build_linux.sh
```

O script gera um executável standalone em `desktop/release/linux/`. Se `appimagetool` estiver disponível, também gera um arquivo `.AppImage`. A tela `/downloads` atualmente oferece para personalização e download o executável Windows compatível.

## Dados e perfis do aplicativo desktop

O desktop incorpora o frontend no executável e executa a API FastAPI em `127.0.0.1`, usando SQLite no perfil do usuário. A porta padrão é `19090`; se estiver ocupada, o aplicativo tenta outra porta livre. O banco não fica na pasta de instalação, portanto atualizar ou reinstalar o aplicativo não o apaga.

Na distribuição de evento, a API web incorpora ao executável um snapshot do evento escolhido, incluindo atletas, organizadores vinculados e operadores desses organizadores. No Windows, cada evento usa um perfil local próprio sob `%APPDATA%\RS-KITS\profiles\event-<hash>\`. A distribuição limpa usa um perfil separado e começa com o administrador padrão.

O snapshot representa os dados no momento em que o executável foi preparado. Entregas, estornos e edições feitos depois ficam no SQLite daquela instalação. Copiar somente o `.exe` para outro computador não transfere essas alterações locais; faça backup ou transfira o perfil operacional conforme o processo da equipe. Novas alterações feitas no sistema web exigem preparar e distribuir outro executável para atualizar o snapshot inicial.

Os executáveis de evento são isolados por ID do evento. A aplicação valida a identidade do banco local e bloqueia o uso de outro evento no mesmo perfil. A sincronização central das alterações feitas em uma distribuição de evento ainda não está implementada: o desktop preserva os dados localmente e informa que a sincronização não está disponível.

O aplicativo limpo pode criar seus próprios eventos e usuários localmente. Uma distribuição vinculada a um evento opera somente aquele evento e não deve ser usada para criar, excluir ou trocar o evento embarcado.

## Telas e fluxos do sistema

As telas abaixo correspondem às rotas da aplicação. Quando a tela trabalha com dados de evento, usa o evento selecionado e o escopo de acesso da pessoa autenticada.

### `/login` — Acesso

Permite entrar com identificador e senha. No sistema web, a autenticação é feita pela API e a sessão usa token JWT. No desktop, o login é validado contra as contas presentes no SQLite local. Após entrar, o usuário é encaminhado ao destino solicitado ou ao Dashboard. Quando a sessão web expira, a aplicação redireciona para o login.

### `/dashboard` — Visão geral

Mostra o evento selecionado, o status do evento, o total de atletas e o andamento das entregas. Inclui busca rápida por atleta, atividade recente de entregas e estornos, comparação de entregas por hora entre hoje e ontem e gráficos de distribuição dos atletas. O cartão de clima aparece quando há dados disponíveis.

### `/events` — Eventos

Tela administrativa para criar, pesquisar, filtrar, editar e excluir eventos. Os filtros usam os estados Rascunho, Próximo, Em andamento e Finalizado. O formulário registra nome, data, local e organizador vinculado. A lista também mostra a quantidade de atletas por evento e indica o evento selecionado para a operação.

Na lista de eventos, o administrador pode abrir a gestão de usuários vinculados ou iniciar o fluxo para preparar o aplicativo desktop daquele evento. A importação de atletas é feita depois de selecionar o evento que receberá os registros.

### `/import` — Importação de atletas

Disponível para administradores. Primeiro selecione o evento; depois baixe o modelo CSV ou carregue um arquivo CSV, XLS ou XLSX para ver a prévia. Revise os dados e confirme a importação.

A validação exige nome e pelo menos NUM ou CPF, e verifica duplicidades de NUM/CPF dentro da planilha. Se o mesmo atleta já existir no evento atual, ele é identificado e ignorado; a tela informa quantos registros eram existentes e quantos novos foram importados. A validação de CPF não rejeita o número apenas por ter dígitos repetidos.

A tela também oferece a geração de um backup JSON do estado local de atletas exibido pelo aplicativo.

### `/delivery` — Entrega de kits

É a tela de operação diária do evento selecionado. A busca procura por nome, número, CPF, cidade/UF ou equipe. A tabela tem rolagem e mostra NUM, nome, sexo, nascimento, cidade/UF, equipe, modalidade, kit, camiseta e status. Ela permite abrir a ficha, editar os campos disponíveis, confirmar uma entrega, estornar uma entrega ou espelhar o atleta na segunda tela. Linhas entregues aparecem em verde; linhas estornadas aparecem em amarelo. Os filtros de status permitem ver entregues ou pendentes; para ver estornados, mantenha o filtro em Todos.

**Para entregar um kit:** selecione a linha do atleta para abrir a ficha. Confira os dados, escolha retirada pelo próprio atleta ou por terceiro e confirme a entrega. Para um terceiro, informe os dados de quem está retirando. O sistema grava data/hora, usuário operador e dados do recebedor. O atalho de entrega na tabela registra a retirada pelo próprio atleta.

**Para estornar:** use a ação `Estornar Kit` na linha de um atleta entregue ou dentro da ficha. O registro muda para Estornado e guarda data/hora e usuário do estorno; os dados da entrega anterior são limpos.

**Para zerar as entregas:** abra `Utilitários` → `Zerar Entregas`, digite `ZERAR ENTREGAS` para confirmar e execute. A operação limpa o status e os campos de entrega/estorno de todos os atletas do evento. Ela não apaga o evento, os atletas ou os campos cadastrais editados.

**Para sortear um atleta:** abra `Utilitários` → `Realizar Sorteio`. Escolha Todos ou os filtros disponíveis de modalidade/categoria, faixa etária e cidade; então execute o sorteio. O vencedor é exibido na janela e a ação é registrada na auditoria quando a API está autenticada.

**Para exibir uma segunda tela:** em `Utilitários`, abra `Abrir Segunda Tela` e selecione transmissão manual ou automática. Na tabela, use `Espelhar` para escolher o atleta. A segunda tela mostra a ficha resumida para conferência com o operador; no modo automático ela acompanha a seleção feita na tela principal. No desktop, a segunda tela abre em outra janela PyWebView; no navegador, abre em outra aba/janela.

A edição disponível pela tabela altera nome, CPF, modalidade, faixa etária, equipe, camiseta e cidade/UF. Os demais campos exibidos nos relatórios não são editáveis nesse formulário.

### `/delivery/second-screen` — Segunda tela

Mostra somente as informações do atleta selecionado para que o atleta e o operador confiram os dados. A tela é atualizada a partir da tela principal e não registra entregas por conta própria.

### `/reports` — Relatórios e auditoria

Os relatórios são do evento selecionado. A aba de auditoria mostra alterações recentes com data/hora, usuário, atleta, campo, valor anterior e valor novo. As outras opções permitem exportar dados completos, gerar um modelo com atletas alterados, importar atualizações e montar uma relação de entrega com colunas escolhidas.

Para importar atualizações, use uma planilha CSV com NUM ou CPF para localizar o atleta. Campos preenchidos substituem os valores existentes; registros não localizados são contabilizados no resultado da importação.

### `/filters` — Análises por dimensão

Apresenta gráficos, totais e tabelas agregadas para modalidade/distância, equipe, cidade, camiseta, sexo, sexo e distância, faixas de idade e entregas por dia/hora/usuário. Os filtros disponíveis incluem sexo, modalidade, cidade, camiseta, idade e kit. A tela calcula as faixas etárias a partir da data de nascimento quando ela está disponível.

### `/users` — Usuários

Administradores e organizadores gerenciam pessoas vinculadas aos eventos. Selecione o evento para limitar a lista aos usuários relacionados a ele; use a busca e os filtros de perfil ou organizador para localizar uma conta. Administradores podem criar e editar organizadores, operadores e vínculos com eventos. Organizadores gerenciam os operadores vinculados à própria organização. A tela permite alterar dados da conta e senha e remover usuários conforme as permissões do perfil.

### `/downloads` — Aplicativos desktop

Disponível somente para administradores. A tela oferece duas opções:

- **Aplicativo limpo:** executável sem eventos, atletas ou usuários do evento; começa com `admin@rskits.com` / `admin123` e permite cadastrar os próprios dados localmente.
- **Aplicativo com evento:** selecione um evento para baixar um `.exe` com o snapshot correspondente de atletas e usuários vinculados.

Para aparecer como versão compatível, o servidor precisa ter uma build Windows atual e o arquivo `.exe.json` correspondente. A preparação do executável personalizado é feita pelo backend a partir dessa build base.

### `/settings` — Configurações

Central de atalhos para gestão de usuários, downloads e eventos. As ações de cadastro e vínculo são realizadas nas telas específicas; Configurações não mantém formulários independentes para esses dados. Operadores não têm acesso a essa página.

### `/` — Entrada

A rota raiz redireciona para o Dashboard. Se não houver sessão válida, a proteção de autenticação encaminha a pessoa para o login.

## Permissões

| Perfil        | Acesso principal                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Administrador | Gerencia eventos, importa atletas, gerencia usuários, acessa Downloads e opera os eventos.                                                     |
| Organizador   | Acessa os eventos vinculados e gerencia os próprios operadores e usuários dos eventos sob seu escopo. Não pode baixar executáveis.             |
| Operador      | Acessa as telas de operação e os dados do evento ao qual está vinculado. Não acessa Eventos, Importação, Usuários, Downloads ou Configurações. |

As permissões também são verificadas na API; ocultar um item do menu não é a única barreira de acesso. Os dados apresentados para organizadores e operadores respeitam os vínculos de evento e de organização.

## Relatórios e formatos exportados

Os nomes das abas usam “Excel” por compatibilidade com o uso da planilha, mas os arquivos gerados atualmente são CSV UTF-8 com separador `;`, que pode ser aberto no Excel.

| Relatório                                  | Conteúdo e saída atual                                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Relatório Analítico / alterações agrupadas | Histórico de alterações com usuário, data/hora, campo, antes e depois; exportação CSV agrupada. A impressão do navegador pode ser salva como PDF. |
| Excel - Modelo Exportação                  | CSV com os campos do modelo de exportação e somente atletas marcados como alterados.                                                              |
| Excel - Dados Full                         | CSV com dados cadastrais e de entrega/estorno de todos os atletas do evento.                                                                      |
| Excel Modelo e Exportação                  | CSV configurável para exportar alterações; também aceita CSV de atualização dos atletas.                                                          |
| Relação de Entrega                         | Escolha as colunas e gere um CSV para a operação de entrega.                                                                                      |
| Relatórios da tela Filtros                 | Gráficos e totais agregados por dimensões do evento; não são a mesma exportação detalhada da aba de auditoria.                                    |

O CSV de Dados Full inclui `NUM`, Nome Atleta, KIT, Distância, Faixa Etária, Categoria Especial, Nascimento, Sexo, Equipe, Cidade/UF, Camiseta, CPF Atleta, Cel, E-mail, Retirar KIT, Notas, Obs1, Obs2, Alerta, Nome Evento, status de entrega, data e usuário de entrega, observação da entrega, data de estorno e usuário do estorno. O Modelo Exportação inclui Num, Nome atleta, Modalidade, Nascto., Sexo, Equipe, Cidade/UF, Camiseta, CPF Atleta, Cel e Notas.

O CSV de auditoria agrupada traz timestamp, usuário, número e nome do atleta, campo alterado, valor anterior, valor novo e dispositivo. A Relação de Entrega permite selecionar os campos antes de exportar.

O relatório chamado “Linhas/Amarelo” exporta atualmente um CSV de dados, sem cores de célula. CSV não armazena formatação amarela; a cor amarela é usada na tela de entrega para identificar atletas estornados.

## Limites observados na auditoria

- Na entrega, o formulário de edição cobre nome, CPF, modalidade, faixa etária, equipe, camiseta e cidade/UF; não altera todos os campos disponíveis no cadastro do atleta.
- O reset em `Utilitários` zera dados de entrega e estorno, mas não reverte as edições cadastrais dos atletas.
- A tela de entrega não tem uma ação funcional para renomear o evento. O componente de modal existente não está ligado a um controle visível nem persiste a mudança; para alterar o nome, use a edição do evento em `/events`.
- O código contém um exportador CSV para “Linhas/Amarelo”, mas não há uma opção visível para acioná-lo na tela atual. A exportação não aplica cores de célula.
- Organizadores não podem abrir ou baixar arquivos em `/downloads`; a tela Configurações ainda pode exibir um atalho para essa rota, que responderá com acesso restrito.

## Qualidade e testes

Comandos disponíveis na raiz:

```powershell
npm run format
npm run format:check
npm run lint
npm run typecheck
npm run test:frontend
npm run test:coverage
```

O frontend usa Vitest e Testing Library. A suíte cobre rotas, componentes e fluxos de autenticação, permissões, eventos, usuários, importação, entrega/estorno/reset/sorteio, segunda tela, relatórios e downloads. `npm run test:coverage` gera o relatório em `frontend/coverage/` e verifica os limites configurados.

Esses comandos não geram a build Next.js nem o executável desktop. Para validar a janela nativa e os fluxos no Windows, abra a build resultante em uma máquina Windows.

## Documentos complementares

- [SETUP.md](SETUP.md): notas de configuração do ambiente de desenvolvimento.
- [TESTING.md](TESTING.md): detalhes de cobertura e padrão para novos testes.
- [desktop/DOWNLOADS.md](desktop/DOWNLOADS.md): publicação, personalização e isolamento dos dados dos executáveis.
