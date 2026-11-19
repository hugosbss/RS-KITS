# Orientações Claude Code — Frontend RS-KITS

Leia as instruções de [AGENTS.md](../../AGENTS.md), o [README](../../README.md) e o índice [docs/](../../docs/README.md). Para entrega, consulte [docs/frontend/delivery.md](../../docs/frontend/delivery.md).

## Stack e organização

- Next.js 15 App Router, React 19, TypeScript e Tailwind CSS 4.
- Rotas em src/app; componentes por domínio em src/components; componentes reutilizáveis em src/components/ui; serviços e tipos em src/services e src/types.
- A aplicação também produz arquivos estáticos para o desktop quando NEXT_DESKTOP=1.
- A API web pertence ao backend deste mesmo monorepositório. Confira controller, DTO e serviço correspondentes quando alterar uma chamada ou payload.

## Convenções

- Siga os componentes, estilos e organização do domínio vizinho. Use os tokens de tema existentes e mantenha textos da interface em PT-BR.
- Mantenha estados de carregamento, vazio e erro; represente falhas de gravação sem indicar sucesso.
- Trate permissões e escopo do evento conforme a API; ocultar uma ação no frontend não substitui autorização no servidor.
- Proteja dados pessoais na ficha pública/segunda tela e em mensagens de erro ou logs.
- Distingua os perfis desktop: distribuições de evento retornam unsupported; o perfil limpo tem somente um protótipo de auditoria com desktop/cloud.py, iniciado à parte, sem sincronização de atletas com a API central.
- Os testes frontend usam Vitest e Testing Library; os comandos atuais estão em [docs/frontend/testing.md](../../docs/frontend/testing.md).
