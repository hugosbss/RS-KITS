# Banco de dados

O banco web usa PostgreSQL e é gerenciado pelo Prisma. O schema oficial está em backend/prisma/schema.prisma; as migrações versionadas ficam em backend/prisma/migrations/.

## Entidades

### User → users

Contas de acesso com nome, e-mail, CPF, CNPJ, código alternativo de acesso, hash de senha, perfil e telefone. E-mail, CPF, CNPJ e código de acesso são opcionais e únicos quando informados. Os perfis são ADMIN, ORGANIZADOR e OPERATOR.

organizerId cria uma relação de um organizador para vários operadores. Ao remover o organizador, o vínculo é definido como nulo. EventUser também liga usuários a eventos.

### Event → events

Armazena nome, data, local, status e versão de concorrência. Os estados são RASCUNHO, PROXIMO, EM_ANDAMENTO e FINALIZADO. A exclusão do evento remove os vínculos e atletas relacionados conforme as relações com cascata no schema.

### EventUser → event_users

Tabela de vínculo muitos-para-muitos entre eventos e usuários, com chave composta (eventId, userId) e data de associação.

### Athlete → athletes

Cada atleta pertence a um evento. O registro reúne dados de inscrição e contato (NUM, nome, kit, modalidade/distância, faixa etária, categoria especial, nascimento, sexo, equipe, cidade/UF, camiseta, CPF, celular, e-mail, notas, alertas e campos de retirada), além dos dados de entrega e estorno. version registra a versão usada no controle de concorrência.

Os dados de entrega incluem status, data, operador, observação, terceiro e identificação da pessoa que retirou. Estornos guardam data e usuário.

### Sincronização central

SyncOperation mantém idempotência das operações recebidas; SyncChange mantém o histórico incremental usado pelo cursor de pull; SyncConflict armazena conflitos pendentes e sua resolução. Essas tabelas pertencem à API central. O cliente desktop não integra esse protocolo: distribuições de evento retornam `unsupported`, enquanto o perfil limpo possui apenas um protótipo independente que envia auditoria a um serviço demonstrativo. Veja [arquitetura desktop](../desktop/architecture.md).

## Auditoria

A API grava eventos de auditoria em linhas JSON no arquivo logs/audit.log, com rotação ao atingir 10 MB, e expõe GET /api/audit. Isso não é uma tabela Prisma. A página Relatórios do frontend não consulta esse endpoint atualmente: seu histórico visível contém apenas diferenças geradas pela importação CSV na sessão ativa; na rota publicada, essas diferenças ficam somente no estado da página e não alteram os cadastros. Preserve o diretório de logs ao definir armazenamento e backup do servidor.

## Migrações

As migrações existentes cobrem usuários, eventos e atletas, campos de saúde e entrega, código de acesso e tabelas de sincronização. Consulte os diretórios SQL para os nomes e alterações exatos; esta página descreve o modelo atual, não substitui a sequência de migrações.

Para desenvolvimento, use npm run db:migrate. Em implantação, aplique as migrações existentes com npm run prisma:deploy --prefix backend. Não altere manualmente um banco implantado fora do fluxo de migração do Prisma.
