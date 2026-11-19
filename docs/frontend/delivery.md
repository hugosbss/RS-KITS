# Entrega de kits: comportamento atual e especificação

Esta página separa o comportamento encontrado na versão atual das solicitações registradas para o produto. A tela atual é composta pelos componentes em frontend/src/components/delivery/, com o fluxo principal em delivery.tsx; a API e a persistência ficam no domínio de eventos do backend. O arquivo delivery-shell.tsx citado em rascunhos antigos não existe nesta versão.

## Comportamento atual

- Busca e tabela do evento selecionado, rolagem e ações por atleta. O painel mostra total, entregues e pendentes; não exibe contador de estornados.
- Linhas entregues em verde e estornadas em amarelo. Os filtros diretos oferecem Entregues e Pendentes; para ver estornados, deixe o filtro em Todos.
- Ficha do atleta, entrega pelo próprio atleta ou por terceiro, estorno, segunda tela e sorteio.
- Sorteio com filtro opcional. O primeiro campo é rotulado Modalidade/Cat., mas filtra modalidade/distância. As opções atuais são fixas no código: modalidades 5KM, 10KM, 21KM e 42KM; faixas etárias 25–29, 30–34, 35–39, 40–44 e 50–54; cidades Bauru/SP, São Paulo/SP, Campinas/SP e Sorocaba/SP. Não são carregadas do evento.
- Zerar entregas exige confirmação textual e limpa dados de entrega e estorno. Não remove o atleta nem desfaz suas edições cadastrais.
- Edição direta pela tela de entrega cobre nome, CPF, modalidade, faixa etária, equipe, camiseta e cidade/UF.
- O campo de equipe na edição atual é texto livre; a interface não apresenta seleção de equipes existentes nem cadastro de uma nova equipe.
- O nome do evento pode ser editado em /events. A tela de entrega não oferece um fluxo próprio funcional para renomeá-lo.

## Requisitos registrados para a tela

A lista deve permitir localizar e selecionar atleta, abrir sua ficha e iniciar a entrega. Deve mostrar o estado pendente, entregue ou estornado. As linhas entregues ficam verdes e as estornadas amarelas. A segunda tela exibe os dados necessários para o operador e o atleta conferirem juntos.

Campos solicitados para a lista, consolidados sem o rótulo duplicado “Atleta” do rascunho original:

NUM; Nome do atleta; CPF do atleta; Sexo; Nascimento; Cidade/UF; Equipe; Distância/Modalidade; KIT; Faixa etária; Categoria especial; Camiseta; Celular; E-mail; Alerta; Retirar KIT; Data de estorno; Usuário do estorno; Status do estorno; Data de entrega; Usuário da entrega; Nome, CPF, telefone e e-mail de quem retirou.

Solicitações de operação ainda não cobertas integralmente:

- Exibir todos os campos cadastrais, de contato, retirada, entrega e estorno na lista.
- Editar todos os campos necessários do atleta, não apenas o subconjunto atual.
- Incluir o atleta em equipe existente ou criar uma equipe nova.
- Exibir também contador de estornados junto à lista; hoje só aparecem total, entregues e pendentes.
- Oferecer no próprio fluxo de entrega a alteração persistente do nome do evento, se esse atalho continuar necessário.
- Definir o alcance de “zerar todas as alterações”: a ação atual zera apenas entrega e estorno; não desfaz edições cadastrais.

## Requisitos registrados para relatórios

- Alterações recentes exportáveis.
- Alterações agrupadas por usuário, data/hora, campo e valores antes/depois.
- Relatório de linhas com todas as informações do atleta e entrega/estorno, destacando em amarelo os campos alterados.
- Modelo de exportação com apenas os atletas alterados: número, nome, modalidade, nascimento, sexo, equipe, cidade/UF, camiseta, CPF, celular e notas.
- Dados completos de atletas, evento, retirada, entrega e estorno.
- Análises por modalidade, equipe, cidade, camiseta, sexo, sexo/distância, idade e entregas por dia/hora/usuário, com filtros dimensionais.
- Faixas de idade agrupáveis de 5 em 5 ou de 10 em 10; a solicitação original também lista faixas até 20, 21–30, 31–40, 41–50, 51–60 e acima de 61 anos.
- Entregas agregadas por dia/hora e operador, com filtro por data.

A implementação atual está descrita no [README principal](../../README.md#relatórios-e-formatos-exportados). O histórico central é gravado pela API, mas a tela de Relatórios não carrega GET /api/audit. A importação CSV dessa tela apenas altera o estado em memória do próprio relatório; a página não fornece a ação de persistência, então não atualiza os cadastros. A aba Analítico e o modelo de exportação mostram somente as alterações dessa sessão. As opções chamadas “Excel” geram CSV UTF-8 separado por ponto e vírgula. CSV não preserva cor de célula. O exportador “Linhas/Amarelo” não está exposto como opção na tela atual nem aplica destaque de cor.

A tela `/filters` atualmente apresenta cartões de totais e tabelas classificáveis; não desenha gráficos. A tabela de entregas agrupa registros por dia, hora e operador, sem filtro de data. O filtro global por faixa etária usa grupos fixos de dez anos; não oferece intervalos de cinco anos.

## Segunda tela

A rota /delivery/second-screen apresenta os dados selecionados para conferência entre operador e atleta. A seleção e a entrega continuam na tela principal. A implementação atual também exibe convênio médico, tipo sanguíneo, contato de emergência, relação com o atleta e telefone de emergência; essa exposição deve ser revista como requisito de privacidade.
