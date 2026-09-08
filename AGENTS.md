Pegue o contexto do projeto, lêia os arquivos .MD e entenda sobre, preciso atualizar um pouco mais a minha tela de Entrega de Kit, preciso que você faça apenas isso por hora:

* Tela de entrega de Kits deve ter as opções de: 

ESTORNAR Entrega do Kit 
Alterar Nome do Evento/Prova 
Zerar Todas as Alterações e Todas as Entregas de Kits 

*Realizar SORTEIO* (com ou sem filtro, categoria,faixa de idade, cidade)

Na tela também deve conter abaixo da seção de busca do atleta para entrega do kit, uma lista ou tabela exibindo todos os atletas do evento atual contendo as informações:

deve ser exibido: 

NUM, Nome, Atleta, CPF, Atleta, Sexo, Nascimento, CidadeUF, Equipe, Distância, KIT, Faixa Etaria, Categoria Especial, Camiseta, Cel, Email, Alerta, Retirar KIT, Data Estorno, Usuário, Estorno, Data Entrega, Usuário Entrega, Nome Entrega, CPF Entrega, Fone Entrega, Email Entrega.

Podendo ser possível alterar qualquer informação do atleta, incluir em equipe existente ou criar nova e também realizar o estorno da entrega do kit, caso necessário.

Deve ter um botão também para exibir uma segunda tela mostrando apenas as informações do atleta selecionado para o operador e para a segunda tela onde o atleta pode ver as infomações dele e conferir com o operador se esta correto.

Deve ter uma linha contendo o status e informações como:
Pendentes de entega, Entregues, ou um bloco ao lado da lista de nomes, a lista deve ter uma rolagem para baixo e deve ser possível selecionar o atleta e abrir a mesma tela de informações para realizar a entrega do kit.

Na lista os Entregues devem ser exibidos em verde e os Estornados em amarelo.

Ao finalizar não precisa fazer a build, apenas atualize o código para mim. O arquivo é:  frontend/src/components/delivery/delivery-shell.tsx

A idéia é ter um sistema moderno de entrega de Kits. Se houver dúvidas me questione, mas siga o padrão do projeto e a tecnologia utilizada.


Aqui será necessário ter os relatórios de:

Alterações - Estático - Alterações realizadas no sistema, recente, podendo ser extraido em Excel, PDF, CSV, etc.

Relatórios de Alterações - Excel - Agrupado = Exibir o que foi alterado no sistema, por quem, quando e o que foi alterado, exibir o antes / Depois.

Relatórios de Alterações - Excel - Linhas/Amarelo = Nesse relatório é exibido todas as informações: 

NUM	Nome Atleta	KIT	Distância	Faixa Etaria	Categoria Especial	Nascimento	Sexo	Equipe	Cidade/UF	Camiseta	CPF Atleta	Cel	E-mail	Retirar KIT	Notas	Obs1	Obs2	Alerta	Nome Evento	status_entrega	data_entrega	usuario_entrega	obs_entrega	data_estorno	usuario_estorno

E é exibido em cores, onde o amarelo é o que foi alterado, e o que não foi alterado é exibido na cor normal da fonte.

Relatórios de Alterações - Excel - Modelo Exportação = Nesse relatório é exibido todas as informações:

Num	Nome atleta	Modalidade	Nascto.	Sexo	Equipe	Cidade / UF	Camiseta	CPF Atleta	Cel	Notas
Apenas de atletas que sofreram alterações.

Relatórios Dados Full - Excel = Nesse relatório é exportado todos os dados do sistema como:

NUM	Nome Atleta	KIT	Distância	Faixa Etaria	Categoria Especial	Nascimento	Sexo	Equipe	Cidade/UF	Camiseta	CPF Atleta	Cel	E-mail	Retirar KIT	Notas	Obs1	Obs2	Alerta	Nome Evento	status_entrega	data_entrega	usuario_entrega	obs_entrega	data_estorno	usuario_estorno


Relatório - Tabela Dinâmica

Rel - Modalidade > Deve exibir graficos/dashboards e as diferentes modalidades, podendo filtrar por sexo, idade, cidade, camiseta, etc.
Rel - Equipe > Exibir em graficos/dashboards e as diferentes equipes, podendo filtrar por sexo, idade, cidade, camiseta, etc.
Rel - Cidade > Exibir em graficos/dashboards e as diferentes cidades, podendo filtrar por sexo, idade, cidade, camiseta, etc.
Rel - Camiseta > Exibir em graficos/dashboards e os diferentes tamanhos de camisetas, podendo filtrar.
Rel - Sexo > Exibir total de atletas por sexo, podendo filtrar por idade, cidade, etc.
Rel - Sexo e Distancia > Deve mostrar o total de atletas por sexo, distancia, evento, cidade e exibir total de cada podendo ser filtrado.

Rel - Idade > Exibir em gráficos as faixas de idade podendo ser filtradas de 10 em 10, 5 em 5:
Iniciando em:
Até 20 anos
De 21 anos até 30 Anos
De 31 anos até 40 Anos
De 41 anos até 50 Anos
De 51 anos até 60 Anos
Mais de 61 Anos

Rel - Entregas (Dia/Hora/Usuário) > Exibir em gráficos ou dashboards Dia/Hora - Usuário/Operador - Total.
Rel - Entregas (Dia/Hora) > Total de entregas por Dia/Hora podendo filtrar por data.



* Tela de entrega de Kits deve ter as opções de: 

ESTORNAR Entrega do Kit 
Alterar Nome do Evento/Prova 
Zerar Todas as Alterações e Todas as Entregas de Kits 

*Realizar SORTEIO*
Na tela também deve conter abaixo da seção de busca do atleta para entrega do kit, uma lista ou tabela exibindo todos os atletas do evento atual contendo as informações:

deve ser exibido: 

NUM, Nome, Atleta, CPF, Atleta, Sexo, Nascimento, CidadeUF, Equipe, Distância, KIT, Faixa Etaria, Categoria Especial, Camiseta, Cel, Email, Alerta, Retirar KIT, Data Estorno, Usuário, Estorno, Data Entrega, Usuário Entrega, Nome Entrega, CPF Entrega, Fone Entrega, Email Entrega.

Podendo ser possível alterar qualquer informação do atleta, incluir em equipe existente ou criar nova e também realizar o estorno da entrega do kit, caso necessário.

Deve ter um botão também para exibir uma segunda tela mostrando apenas as informações do atleta selecionado para o operador e para a segunda tela onde o atleta pode ver as infomações dele e conferir com o operador se esta correto.

Deve ter uma linha contendo o status e informações como:
Pendentes de entega, Entregues, ou um bloco ao lado da lista de nomes, a lista deve ter uma rolagem para baixo e deve ser possível selecionar o atleta e abrir a mesma tela de informações para realizar a entrega do kit.

Na lista os Entregues devem ser exibidos em verde e os Estornados em amarelo.