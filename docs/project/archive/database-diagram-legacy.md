# Diagrama de banco antigo — arquivo

Este diagrama é um rascunho anterior e não corresponde ao schema Prisma atual. Use [documentação vigente do banco](../../backend/database.md).

---

# Diagrama de Relacionamentos do Banco de Dados - RS KITS

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │  EventUser  │       │    Event    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ userId (PK) │       │ id (PK)     │
│ name        │       │ eventId (PK)│──────►│ name        │
│ email       │       │ assignedAt  │       │ date        │
│ cpf         │       └─────────────┘       │ place       │
│ cnpj        │                             │ status      │
│ passwordHash│                             └──────┬──────┘
│ role        │                                    │
│ phone       │                                    │ 1
│ organizerId │                                    │ N
│ createdAt   │                                    ▼
│ updatedAt   │                             ┌──────────────┐
└──────┬──────┘                             │   Athlete    │
       │                                    ├──────────────┤
       │ 1:N (auto-rel)                     │ id (PK)      │
       ▼                                    │ eventId (FK) │
┌─────────────┐                             │ num          │
│   User      │                             │ nomeAtleta   │
│ (operators) │                             │ kit          │
└─────────────┘                             │ distancia    │
                                            │ fxEtaria     │
                                            │ categEspecial│
                                            │ nascto       │
                                            │ nascimento   │
                                            │ sexo         │
                                            │ equipe       │
                                            │ cidadeUf     │
                                            │ camiseta     │
                                            │ cpfAtleta    │
                                            │ cel          │
                                            │ email        │
                                            │ quemVaiRetirar│
                                            │ notas        │
                                            │ obs1         │
                                            │ obs2         │
                                            │ alerta       │
                                            │ nomeEvento   │
                                            │ contato      │
                                            │ grauParentesco│
                                            │ celularContato│
                                            │ pin          │
                                            │ itensAdicionais│
                                            │ convenioMedico│
                                            │ tipoSanguineo │
                                            │ contatoEmergencia│
                                            │ relacaoAtleta │
                                            │ telefoneEmergencia│
                                            │ createdAt    │
                                            │ updatedAt    │
                                            └──────────────┘
```

**Cardinalidades:**
- `User` 1:N `EventUser` — um usuário pode ser vinculado a vários eventos
- `Event` 1:N `EventUser` — um evento pode ter vários organizadores
- `User` 1:N `User` (auto-relacionamento via `organizerId`) — organizador tem vários operadores
- `Event` 1:N `Athlete` — um evento tem vários atletas (cascade delete)