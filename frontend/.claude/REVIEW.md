# Revisão de código — Frontend RS-KITS

Faça a revisão em PT-BR e foque em falhas introduzidas pela mudança. Confira a cadeia rota → componente → serviço → API e leia o código relacionado antes de afirmar um problema.

## Checklist

- O contrato de rota, método, payload e resposta corresponde ao controller e DTO em backend/.
- Consultas e mutações respeitam evento selecionado, perfil e estados de carregamento/erro.
- Entregas, estornos, reset e edições só são confirmados após persistência bem-sucedida; ações destrutivas têm confirmação e bloqueiam envio duplicado.
- A segunda tela mostra somente os dados necessários para conferência.
- Exportações correspondem ao formato e às colunas documentadas. CSV não preserva cores de célula.
- A interface mantém acessibilidade, textos PT-BR, componentes compartilhados e padrões de teste do repositório.
- Não presuma que a sincronização do desktop esteja funcional.

## Resultado

Liste achados por severidade (bloqueante, importante, sugestão), com arquivo/linha, cenário concreto e correção recomendada. Se não houver achados, diga isso claramente. Não publique comentários nem envie mensagens externas durante a revisão.
