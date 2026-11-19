# Arquitetura do aplicativo desktop

## Componentes

1. Next.js gera o frontend estático em frontend/out.
2. FastAPI serve os arquivos estáticos e oferece a API local em 127.0.0.1.
3. PyWebView abre a aplicação em uma janela nativa e integra a segunda tela.
4. SQLite guarda os dados operacionais no perfil do usuário, fora do diretório de instalação.

## Perfis e isolamento

O aplicativo limpo permite administrar dados locais próprios. Um executável preparado para evento incorpora um snapshot e usa um perfil associado ao ID desse evento. A aplicação verifica o vínculo do banco e bloqueia a troca para outro evento no mesmo perfil. Downloads posteriores do mesmo evento podem acrescentar dados sem substituir alterações e entregas locais.

Não existe fusão automática de perfis locais divergentes. Para transferir o histórico, preserve o perfil operacional junto com o executável.

## Sincronização

A API web possui endpoints e tabelas para operações, alterações incrementais e conflitos, mas o desktop não usa esse protocolo do backend NestJS. Em uma distribuição vinculada a evento, `desktop/sync.py` retorna `unsupported` para push e pull. No perfil limpo, existe um protótipo que, quando o serviço é iniciado à parte, envia somente registros de auditoria para `desktop/cloud.py`, uma demonstração independente que grava os payloads localmente; não envia o estado dos atletas ao backend central.

Mesmo no perfil limpo, o pull apenas registra o horário da consulta e devolve a resposta ao chamador; não aplica atletas ou outras alterações recebidas ao SQLite. Portanto, as mudanças operacionais continuam locais e não há sincronização funcional de cadastros com a API web.

## Segunda tela

A janela principal pode abrir a ficha do atleta em outra janela PyWebView. A tela secundária exibe dados para conferência e acompanha a seleção configurada na tela principal. Ela não realiza a entrega por conta própria.

## Empacotamento

Os scripts em desktop/ compilam o frontend estático e empacotam a API local, recursos e ícones com PyInstaller. A build deve ser feita no sistema operacional de destino. O Inno Setup 6 é opcional para criar o instalador Windows.
