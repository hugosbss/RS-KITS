# Plano antigo de executável — arquivo

Um rascunho anterior propunha Electron, uma implementação futura de FastAPI/SQLite e sincronização eventual. Esse plano foi superado pelo aplicativo desktop implementado com PyWebView, FastAPI e SQLite local.

Use [arquitetura atual do desktop](../../desktop/architecture.md) como referência. O desktop não sincroniza cadastros com o backend central; existe apenas um protótipo de envio de auditoria no perfil limpo, e distribuições de evento retornam `unsupported`.
