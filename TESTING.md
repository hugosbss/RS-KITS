# Formatação, lint e testes

Execute na raiz do projeto após `npm ci`:

```powershell
npm run format
npm run format:check
npm run lint
npm run typecheck
npm run test:frontend
npm run test:coverage
```

Prettier formata os arquivos do frontend e backend com a configuração compartilhada `.prettierrc.json`. Artefatos gerados e dependências estão excluídos em `.prettierignore`. `npm run lint:fix` aplica as correções automáticas disponíveis; o lint dos dois projetos falha também quando existem avisos.

Os testes novos são apenas do frontend: Vitest, jsdom e Testing Library. Para executar continuamente, use `npm run test:watch --workspace frontend`. A configuração JSX dos testes é independente da configuração usada pelo Next.js.

## Cobertura

O comando gera `frontend/coverage/index.html`, `lcov.info` e `coverage-summary.json`. Abra o HTML para consultar linhas e ramificações não cobertas. O diretório é regenerável e não é versionado.

A suíte exercita todas as rotas e todos os componentes React de `frontend/src/app` e `frontend/src/components`, incluindo componentes compartilhados. Há testes de autenticação e sessão, permissões por perfil, eventos e usuários, entrega/estorno/reset/sorteio, segunda tela, filtros, importação e duplicidades, relatórios e downloads. São testes unitários e de integração em jsdom; não substituem testes de ponta a ponta no navegador ou no executável desktop.

O relatório inclui os arquivos de execução sem testes, para que a porcentagem global reflita as lacunas. Apenas testes, configuração de preparação e declarações de tipos são excluídos. A suíte exige pelo menos 80% das linhas, 78% das instruções, 75% das funções e 65% das ramificações globais. Sessão exige 90% das linhas e ramificações; validação de importação exige 95% das linhas e 90% das ramificações.

Após o Vitest, `frontend/scripts/check-component-coverage.mjs` inventaria todos os arquivos `.tsx` de telas e componentes. Arquivos novos exigem pelo menos 80% de linhas e nenhum pode ficar ausente do relatório. Há pisos temporários explícitos para cinco módulos legados: eventos (50%), usuários (65%), entrega (70%), diálogo de entrega (65%) e filtros (75%). Esses limites preservam a cobertura atual enquanto os cenários restantes são ampliados; cobertura em todas as telas não significa 100% de todos os caminhos.

## Padrão para novos testes

- Use arquivos `*.test.tsx` junto aos componentes e `*.test.ts` para serviços/utilitários. Testes de módulos relacionados podem compartilhar um arquivo, como os diálogos de entrega. A integração das rotas está em `frontend/src/test/screens.test.tsx`.
- Use os dados tipados e o estado de exemplo de `frontend/src/test/fixtures.ts`. Crie cenários separados para sucesso, validação, falha e permissões relevantes.
- Renderize componentes reais e verifique ações e resultados observáveis com Testing Library. Prefira consultas por papel/nome ou rótulo; evite snapshots e verificações de detalhes internos.
- Simule API/rede, navegação, animações externas e recursos nativos nas fronteiras. Não substitua por mocks os componentes cujo comportamento está sendo testado.
- Limpe armazenamento e restaure timers/globais alterados. `setup.ts` limpa o DOM e restaura spies e globals após cada teste.
- Não reduza os limites nem exclua código de produção para fazer os testes passarem. Amplie os cenários quando alterar comportamento.

Para executar todas as verificações do frontend de uma vez, rode `npm run quality --workspace frontend`. Esse comando verifica formatação, lint, tipos, testes e limites de cobertura.

Esses comandos não fazem a build do Next.js nem geram o executável desktop. Nenhuma nova suíte do backend foi adicionada nesta etapa.
