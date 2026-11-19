# Instruções para agentes neste repositório

- Leia o [README](README.md) e o índice em [docs/](docs/README.md). Para a área alterada, consulte o documento correspondente em docs/.
- O repositório é um monorepo: frontend Next.js/React, backend NestJS/Prisma/PostgreSQL e aplicativo desktop Python/FastAPI/SQLite/PyWebView.
- Siga os padrões do código vizinho e mantenha contratos entre frontend e DTOs/serviços do backend alinhados.
- Preserve o escopo de evento e as permissões por perfil em toda leitura e alteração de dados.
- Mudanças no schema Prisma precisam de migração compatível. Não trate alterações do desktop como sincronizadas com a nuvem; consulte docs/desktop/architecture.md.
- Textos da interface e documentação para operadores devem seguir o português do projeto. Identificadores e nomes de código seguem as convenções existentes.
- Atualize a documentação correspondente quando mudar comportamento, comandos, estrutura de dados ou limitações do produto.
- Não rode build nem testes quando o pedido do usuário disser para não fazê-lo. Informe verificações executadas e limitações no resumo final.
