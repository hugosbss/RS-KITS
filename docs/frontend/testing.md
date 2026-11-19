# Qualidade e testes

Os comandos são executados na raiz do repositório depois de npm install.

## Frontend

    npm run format:check
    npm run lint --workspace frontend
    npm run typecheck --workspace frontend
    npm run test:frontend
    npm run test:coverage

Para aplicar formatação e correções automáticas disponíveis:

    npm run format
    npm run lint:fix --workspace frontend

O frontend usa Vitest, jsdom e Testing Library. npm run test:watch --workspace frontend inicia o modo interativo. npm run quality --workspace frontend executa formatação, lint, tipos e cobertura.

O lint do frontend aplica a regra `no-alert`, que impede chamadas nativas a `alert`, `confirm` e `prompt`. Mensagens e confirmações devem usar os componentes da interface. Os testes de sorteio e importação de atualizações verificam a exibição dos erros na tela e a limpeza da mensagem ao corrigir filtros ou tentar novamente.

A cobertura é gravada em frontend/coverage/ e não é versionada. A suíte inclui rotas e componentes, com cenários de autenticação, permissões, eventos, usuários, importação, entrega e estorno, segunda tela, relatórios e downloads. A checagem percorre telas e componentes `.tsx` em `src/app` e `src/components` (exceto arquivos de teste), exige cobertura de linhas de 80% por padrão para cada arquivo e mantém limites específicos menores para alguns componentes legados.

## Backend

    npm test --prefix backend
    npm run test:e2e --prefix backend
    npm run lint --workspace backend
    npm run typecheck --workspace backend

Os testes unitários usam Jest; o comando E2E usa backend/test/jest-e2e.json. A cobertura e os arquivos testados dependem da configuração Jest no backend/package.json.

## Desktop

Os testes Python ficam em desktop/ e não são executados pelos scripts npm da raiz. Instale os requisitos de desenvolvimento e execute:

    python -m pip install -r desktop/requirements-dev.txt
    python -m unittest discover -s desktop -p "test_*.py" -v

A validação da janela nativa e do instalador ainda depende de execução no sistema operacional de destino.

## Convenções para novos testes

- Frontend: mantenha os arquivos *.test.ts ou *.test.tsx próximos do código testado, seguindo o padrão já existente na pasta.
- Backend: use a convenção Jest configurada no pacote, atualmente *.spec.ts.
- Teste o resultado observável e os fluxos relevantes; simule serviços externos nas fronteiras.
- Não reduza os limites de cobertura nem exclua código de produção apenas para acomodar uma mudança.
- Este documento descreve comandos e configuração. A execução de testes deve acompanhar o escopo de cada alteração e ser informada no resumo do trabalho.
