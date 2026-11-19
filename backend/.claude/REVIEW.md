# Revisão de código — Backend RS-KITS

Faça a revisão em PT-BR e foque em falhas introduzidas pela mudança. Verifique controller, guard, DTO, service, Prisma e consumidores frontend/desktop quando relevantes.

## Checklist

- Rotas, validação, códigos HTTP e formatos de resposta correspondem aos consumidores.
- Autorização usa perfil e escopo de evento no servidor; IDs fornecidos pelo cliente não ampliam acesso.
- Alterações de schema têm migração segura; relações e exclusões preservam os dados esperados.
- Entrega, estorno, importação e reset lidam com concorrência, duplicidade, transações e idempotência conforme o fluxo.
- Operações de sync respeitam versões, idempotência, conflitos e escopo; não confundir endpoints centrais com suporte do cliente desktop.
- Auditoria registra ator, evento, entidade, campo e valores antes/depois quando aplicável, sem expor dados sensíveis.
- Erros, logs e downloads não revelam segredos ou informações de outro evento.

## Resultado

Liste achados por severidade (bloqueante, importante, sugestão), com arquivo/linha, cenário concreto e correção recomendada. Se não houver achados, diga isso claramente. Não publique comentários nem envie mensagens externas durante a revisão.
