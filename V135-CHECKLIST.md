# Ih, viajei! — checklist de conclusão v135

- [x] Timeline unificada com data/horário estruturados em roteiro e reservas.
- [x] Hoje na viagem com data calculada pelo fuso disponível do destino/evento.
- [x] Google Wallet: emissão/atualização real condicionada a Issuer + Service Account.
- [x] Apple Wallet: geração real de `.pkpass` condicionada a certificados + modelo `.pass` oficial.
- [x] PWA/Service Worker e fallback offline para recursos já cacheados.
- [x] Web Push PRO com inscrição e envio via VAPID.
- [x] Central de preparação.
- [x] Conflitos com Google Routes + margem de deslocamento quando Routes está configurado.
- [x] Clima contextual no Hoje na viagem.
- [x] Assistente IA com proposta -> confirmação -> aplicação.
- [x] Monitor de voos PRO horário para reservas próximas, com notificação interna + push em mudança.
- [x] Acerto de despesas com registro de quitação no backend.
- [x] Calendário visual + exportação ICS.
- [x] Mala inteligente PRO usando Assistente IA + meteorologia, com fallback determinístico.
- [x] Central de emergência persistente.
- [x] Fuso horário como dado estruturado de eventos e cálculo contextual no Hoje.
- [x] Relatório PDF PRO.
- [x] Saúde das integrações no Admin.
- [x] Audit log conectado a ações administrativas críticas.
- [x] MFA/2FA TOTP administrativo.
- [x] DDL v135 compatível com PostgreSQL pelo adaptador de produção.
- [x] Documentação e marcadores correntes em v135.

## Ativação externa obrigatória
Apple Wallet, Google Wallet e Web Push só operam em produção após inserir as credenciais oficiais indicadas no `.env.example`. A ausência dessas credenciais não é simulada pela aplicação.

## Administração v135
- [x] Painel admin resiliente a falhas parciais de endpoints.
- [x] Estatísticas compatíveis com PostgreSQL em produção.
- [x] Lista de usuários com plano comercial e acesso efetivo.
- [x] Override administrativo de teste (1/7/30 dias ou sem prazo).
- [x] Override não altera cobrança/assinatura Mercado Pago.
- [x] Auditoria de concessão e remoção de acesso de teste.
