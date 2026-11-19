# Publicação de downloads Windows

A tela /downloads é restrita a administradores. Ela oferece o executável limpo ou uma distribuição com snapshot de um evento e seus usuários vinculados.

## Gerar e publicar

Gere a build Windows em uma máquina Windows:

    cd desktop
    build_windows.bat

A build produz o executável portátil e o manifesto JSON correspondente. Copie ambos para a pasta configurada no backend:

    powershell -ExecutionPolicy Bypass -File backend/scripts/copy-desktop-releases.ps1

Quando o servidor usa DOWNLOADS_DIR, publique os dois arquivos nesse diretório. O manifesto declara as versões de dados e isolamento aceitas pelo backend. Builds incompatíveis precisam ser regeneradas; não ajuste o manifesto para mascarar a incompatibilidade.

O Inno Setup 6 é opcional e não participa da personalização dos dados do evento.

## Perfil local

Na primeira abertura, o desktop valida o snapshot e associa o perfil ao evento. O diretório Windows padrão segue %APPDATA%/RS-KITS/profiles/event-<hash>. O mesmo evento reutiliza seu perfil e preserva alterações, credenciais, entregas e estornos locais.

Se houver mais de um banco candidato para um evento, o sistema não escolhe ou funde os bancos automaticamente: indique o perfil correto ao iniciar o executável. Um evento empacotado não pode ser trocado por outro evento no mesmo perfil.

## Limites operacionais

- O snapshot não inclui edições feitas depois da distribuição.
- Copiar apenas o executável não transfere o banco local.
- Para executáveis vinculados a evento, push e pull de `desktop/sync.py` retornam `unsupported`; alterações ficam locais. O perfil limpo tem um protótipo separado que, se `desktop/cloud.py` for iniciado à parte, envia apenas registros de auditoria para esse serviço demonstrativo, não para o backend central, e não aplica dados recebidos no pull.
- A porta padrão é 19090, com escolha de porta livre quando necessário.
- Uma mesma base local não deve ser aberta simultaneamente por duas instâncias.

Consulte [arquitetura desktop](architecture.md) para os limites completos do perfil e da sincronização.
