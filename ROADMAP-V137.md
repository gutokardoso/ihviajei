# Ih, viajei! — escopo consolidado v137

A v137 preserva os recursos já existentes e acrescenta a conclusão consolidada do novo escopo: Central PRO, Timeline/Hoje na viagem, preparação, conflitos, clima, sugestão de roupas/checklist, acerto de despesas, calendário ICS, PWA/offline, Wallet e Push com ativação condicionada às credenciais oficiais, saúde das integrações e auditoria administrativa.

## Regras de plano
- Gratuito e Intermediário visualizam a Central da viagem bloqueada como PRO.
- PRO acessa Central inteligente, Hoje na viagem, Timeline, clima contextual, sugestão de roupas/checklist inteligente, fusos horários, Wallet, Push, calendário e relatório/resumo.
- Nenhum recurso externo é simulado: Wallet e Push mostram estado de configuração até as credenciais oficiais serem cadastradas.

## Configurações externas ainda necessárias
Apple Wallet exige identificador de Pass Type, Team ID e certificado de assinatura. Google Wallet exige Issuer ID e Service Account. Web Push exige chaves VAPID. Esses segredos ficam somente no ambiente de produção.

## Arquitetura
A modularização deve continuar de forma incremental, sem reescrita total e sempre mantendo a suíte de regressão. Novos domínios devem sair gradualmente de `server.js` e `public/app.js` para módulos próprios.
