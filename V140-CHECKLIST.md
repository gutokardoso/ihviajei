# Ih, viajei! — checklist de conclusão v140

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
- [x] DDL v140 compatível com PostgreSQL pelo adaptador de produção.
- [x] Documentação e marcadores correntes em v140.

## Ativação externa obrigatória
Apple Wallet, Google Wallet e Web Push só operam em produção após inserir as credenciais oficiais indicadas no `.env.example`. A ausência dessas credenciais não é simulada pela aplicação.

## Administração v140
- [x] Painel admin resiliente a falhas parciais de endpoints.
- [x] Estatísticas compatíveis com PostgreSQL em produção.
- [x] Lista de usuários com plano comercial e acesso efetivo.
- [x] Override administrativo de teste (1/7/30 dias ou sem prazo).
- [x] Override não altera cobrança/assinatura Mercado Pago.
- [x] Auditoria de concessão e remoção de acesso de teste.

## Ajustes v140
- [x] “Aplicar acesso de teste” e “Remover acesso de teste” com mesma altura, raio, espaçamento e alinhamento lado a lado.
- [x] `route_choice` permanece como dado técnico interno do mapa e não é exibido no painel administrativo do usuário.
- [x] Service Worker referencia os assets v140, evitando reaproveitamento de JS/CSS antigo.


## Ajustes visuais e meteorologia v140
- Botões Gerar checklist inteligente, Configurar emergência, Ativar notificações push e Baixar relatório PDF usam o padrão visual primário da plataforma.
- Apple Wallet e Google Wallet usam os badges fornecidos para cada carteira.
- Clima + mala inteligente lista os lugares da viagem separadamente, priorizando cidades cadastradas no orçamento e cobrindo destinos ainda não representados.
- Cada lugar apresenta sua própria meteorologia, fuso e recomendações de vestuário.

### Ajustes de UX e desempenho v140
- [x] Central abre com dados locais antes das integrações externas.
- [x] Clima e conflitos detalhados carregam progressivamente.
- [x] Checklist inteligente abre feedback imediatamente e não repete itens já cadastrados.
- [x] Acertos podem ser marcados/desmarcados como pagos e ficam riscados quando quitados.
- [x] Timeline mostra data e horário.
- [x] Exportação `.ics` usa o botão padrão da plataforma.
- [x] Card redundante “Calendário da viagem” removido.

## Mala inteligente — calendário climático
- Área renomeada de “Clima + mala inteligente” para “Mala inteligente”.
- Calendário usa exatamente o intervalo cadastrado da viagem e separa os dias por mês.
- Cada dia reserva espaço para o ícone meteorológico; o ícone só é preenchido com previsão real disponível, sem inventar clima para datas fora do alcance da API.
- Destino/local do dia é aproveitado quando disponível na previsão ou timeline.
- Recomendações de vestuário por destino continuam disponíveis e alimentam o checklist inteligente.
- CTA atualizado para “Adicione ao checklist inteligente”.
