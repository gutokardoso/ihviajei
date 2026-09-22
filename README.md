## v139 — Central PRO e operação completa

- Card de meta cambial em Próximos passos agora leva a Registrar compra de moeda com viagem/moeda preenchidas.
- Cobrança recorrente real via Mercado Pago: mensal/anual, webhook assinado, status, renovação, inadimplência, cancelamento e troca de plano.
- O plano pago só é efetivado após a assinatura ficar `authorized` no Mercado Pago; cancelamento rebaixa para Gratuito quando não existe outra assinatura autorizada.

# Ih, viajei! — v139

**Sua viagem na palma da mão.**

Versão v139 consolidada a partir da base de produção imediatamente anterior, preservando as decisões aprovadas e concluindo as pendências identificadas na auditoria.


## v102 — meta cambial individual por participante

- Cada participante de viagem compartilhada possui sua própria meta cambial.
- A meta do proprietário não é herdada pelos convidados.
- Convidados podem definir ou alterar a própria meta sem afetar os demais viajantes.
- O progresso usa apenas as compras e a meta do usuário conectado.

## v101 — permissões reais de colaboração

- Participantes com **Somente visualizar** agora recebem interface realmente somente leitura: formulários e ações de editar/remover ficam indisponíveis.
- A interface informa claramente que o titular precisa mudar a permissão para **Pode editar** para liberar alterações.
- As ações de alteração no frontend também têm uma segunda validação de permissão antes de chamar a API.

## v99 — participantes por e-mail e limpeza do cadastro antigo
- remove permanentemente o participante legado **Lincon** dos dados persistidos da viagem, inclusive referências antigas de divisão de despesas;
- restaura a deduplicação de participantes usando o **e-mail** como identificador principal;
- um colaborador aceito com o mesmo e-mail de um cadastro manual aparece apenas uma vez em Participantes;
- a limpeza é idempotente e também é aplicada ao banco SQLite persistente no deploy.

## v98 — gerenciamento de convites
- convites pendentes agora exibem **Reenviar** e **Cancelar**;
- cancelar invalida imediatamente o link antigo e remove o convite da lista;
- reenviar gera um novo link com validade renovada e invalida o link anterior;
- somente o titular da viagem pode executar essas ações.

## v94 — convite de colaboração
- ao abrir um convite, a plataforma verifica se o e-mail convidado já possui conta;
- sem conta, orienta a criar cadastro e mantém o e-mail do convite preenchido no fluxo;
- com conta existente, direciona para entrar na plataforma;
- após autenticação — ou após confirmar o e-mail de uma conta recém-criada — o convite pendente é aceito e a viagem compartilhada é aberta automaticamente;
- usuário já autenticado com o e-mail convidado aceita o convite diretamente;
- convites inválidos ou expirados continuam bloqueados.

## Mantido e consolidado
- navegação autenticada em faixa separada abaixo do header;
- logo volta para a home, sem botão redundante “Início”;
- login com “Entrar” e “Criar conta”;
- viagem individual com Visão geral, Orçamento, Roteiro, Reservas, Checklist, Mapa, Explorar, Documentos, Despesas, Viajantes e Assistente;
- Orçamento com País/Local, Categoria, Cidade, Descrição e Valor;
- Roteiro com País/Estado, Local, datas exibidas em DD/MM/AAAA e observações em marcadores;
- aba atual preservada depois de salvar itens;
- Booking do Câmbio com dados reais e links de instituições quando identificadas;
- administrador geral não cria viagens;
- Google Maps real usando `GOOGLE_MAPS_API_KEY`;
- mapa usa pontos do roteiro e locais salvos;
- Explorar usa Google Places no navegador com a chave protegida por referenciador HTTP, evitando o uso incorreto da chave de navegador em chamadas REST do servidor;
- nenhuma resposta fictícia no Assistente: enquanto a API real de IA não estiver configurada/validada, a interface informa isso claramente.

## Correções v18
- removida a opção “Sem viagem” do registro de compra de moeda;
- registro de compra fica associado a uma viagem;
- `APP_ORIGIN` continua suportado e o próprio host atual também é aceito, evitando quebra de POST ao migrar para o domínio próprio; `APP_ORIGINS` pode receber origens adicionais separadas por vírgula;
- versão interna, healthcheck e pacote sincronizados em v27.

## Railway
Variáveis existentes continuam válidas: `SESSION_SECRET`, `DB_PATH`, `APP_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `GOOGLE_MAPS_API_KEY`.

O banco SQLite persistente em `/app/data` não é incluído no ZIP e não deve ser substituído no deploy.

- abas Mapa, Explorar, Documentos, Despesas e Viajantes com carregamento assíncrono aguardado e erro visível/repetível;
- Explorar filtra resultados pelo país selecionado e aplica região do Google quando disponível;
- removido Câmbio e Radar duplicado da barra autenticada;
- removido rótulo Administração geral acima do título do painel;
- Distribuição por plano corrigida para não ultrapassar o card.

## Integração Google Routes
- cálculo real de rotas pelo backend com a Routes API;
- chave separada `GOOGLE_ROUTES_API_KEY`, nunca enviada ao navegador;
- modos carro, a pé, bicicleta e transporte público;
- distância, duração e traçado real exibidos no mapa;
- rota usa os locais do Roteiro na ordem cadastrada.

## v27 — edição de conteúdos
- Orçamento, Roteiro, Reservas, Checklist, Documentos, Despesas e Viajantes exibem ações **Editar** e **Remover**.
- A edição altera o registro existente, sem exigir exclusão e recriação.
- Ao editar um item do Orçamento, a despesa vinculada em “Divisão de despesas” também é sincronizada; se a divisão for removida, a despesa automática vinculada é removida.
- Ao editar um acompanhante em Viajantes, o nome também é atualizado na lista oficial de acompanhantes da viagem e passa a ser usado nos seletores futuros.
- Endpoints de atualização são protegidos por usuário, como os endpoints de criação e remoção.
- Testes automatizados cobrem atualização de orçamento, roteiro, reserva, checklist e trip-tools.

## v29 — identidade visual
- paleta atualizada para azul-marinho `#0B2D4F`, azul-petróleo `#00A4B4`, coral `#FF6B5B`, creme `#FFF9F2` e cinza `#E5E7EB`;
- tipografia da interface preparada para Poppins com fallbacks nativos compatíveis;
- botões principais em azul-petróleo, CTAs de destaque em coral e cantos arredondados;
- cartões, formulários, modais, navegação, estados ativos e mapa harmonizados com a nova identidade;
- identidade aplicada sem alterar fluxos, dados ou integrações existentes.


## v31 — documentos privados no Supabase Storage
- integração alinhada às novas Secret API Keys do Supabase (`SUPABASE_SECRET_KEY`);
- bucket privado `trip-documents`, sem URL pública permanente;
- upload de PDF/JPG/PNG até 8 MB pelo backend;
- caminho isolado por usuário e viagem (`users/{user}/trips/{trip}/...`);
- visualização/baixa somente após autenticação e validação do proprietário no backend;
- exclusão remove também o objeto do Storage;
- compatibilidade temporária mantida com a variável legada `SUPABASE_SERVICE_ROLE_KEY`.


## v32 — tipografia, visualização e Radar na home
- Tipografia visual padronizada sem negrito em toda a interface.
- Imagens de documentos ajustadas integralmente ao modal, sem barra de rolagem.
- Radar EUR/BRL e USD/BRL adicionado abaixo do hero da página inicial, sem botões de atualização.
- Cards do Radar na home são links para Câmbio e recebem contorno azul-petróleo no hover.


## v36 — visualização integral de documentos
- Imagens no modal agora são redimensionadas proporcionalmente para caber integralmente na área visível, sem corte e sem barra de rolagem.


## v39
- Seletor de moedas pode ser reaberto com um clique, sem limpar a seleção.
- USD (Estados Unidos) é carregado por padrão ao abrir Câmbio.


## v39
- Integração real de status de voos com AeroDataBox via RapidAPI, usando `RAPIDAPI_KEY` somente no backend.
- Consulta por número do voo e data dentro de Reservas, com origem, destino, horários, terminal, portão e status quando fornecidos pela fonte.
- Tratamento de indisponibilidade, voo não encontrado e limite da API sem expor a chave ao navegador.

## v41
- Orçamento ganhou o campo **Reserva realizada**. Ao marcar, o item cria automaticamente uma reserva vinculada usando Categoria → Tipo, Cidade → Fornecedor, Descrição → Confirmação e Valor estimado → Valor.
- A edição mantém orçamento e reserva vinculada sincronizados; ao desmarcar, remove somente a reserva vinculada. Ao remover o orçamento, a reserva vinculada também é removida.


## v41 — Assistente com IA
- Integração real do Assistente com a OpenAI Responses API pelo backend.
- Modelo padrão: `gpt-5.6-luna` (configurável por `OPENAI_MODEL`).
- O contexto inclui dados da viagem do usuário: roteiro, orçamento, reservas, checklist, compras de moeda e dados complementares.
- A `OPENAI_API_KEY` permanece somente no servidor.
- Conversa curta mantida no navegador e enviada com limite ao backend.


## v43 — Assistente conectado às integrações da viagem
- O Assistente resolve automaticamente hotéis e outros lugares pelo Google Places usando os dados já cadastrados na viagem.
- Perguntas sobre restaurantes próximos usam a localização real do hotel e resultados reais do Google Places.
- Perguntas de rota podem usar o Google Routes com os pontos cadastrados no roteiro.
- O usuário não precisa informar manualmente um endereço quando a plataforma consegue resolvê-lo pelas integrações configuradas.


## v44 — Google Places / Nearby Search
- Nearby Search do Assistente usa a chave de servidor `GOOGLE_PLACES_API_KEY`, com fallback para a chave Maps somente por compatibilidade.
- requisição `places:searchNearby` alinhada ao Places API (New), com `includedTypes`, círculo de 1,8 km, FieldMask e limite válido.
- respostas de Text Search e Nearby Search passam por um normalizador único e tolerante a campos opcionais ausentes.
- testes automatizados cobrem o corpo/cabeçalhos do Nearby Search e o processamento de respostas reais no formato Places API (New).


## v45 — Assistente visual
- Recomendações de restaurantes em cartões com foto, culinária, avaliação, faixa de preço, endereço e distância.
- Mapa integrado com hospedagem e restaurantes numerados.
- Resposta textual curta, sem Markdown/links duplicados quando houver resultados estruturados do Google Places.
- Fotos e dados continuam vindo do Google Places real.


## Correção v46
- Evita cache de arquivos estáticos após deploy para garantir que o navegador carregue o JavaScript da mesma versão do backend.
- Corrige o caso em que o backend v45 retornava `ui` com restaurantes, mas o navegador ainda executava o `app.js` anterior e mostrava apenas a introdução textual.

## v49 — correção real de atualização do frontend
- Corrigido o cache-busting que a v46 dizia aplicar, mas não estava presente no HTML entregue.
- `style.css` e `app.js` agora são requisitados com `?v=47`, forçando Cloudflare/navegador a buscar o frontend novo após o deploy.
- Mantidos os cards visuais de restaurantes, fotos do Places, faixa de preço, distância e mapa da v45/v46.


## v51 — respostas visuais para qualquer descoberta de lugares
- Pontos turísticos, atrações, museus, parques, lojas, farmácias, mercados e outras indicações passam pelo Google Places e são exibidos em cartões + mapa.
- Perguntas como “Indique pontos turísticos em Madrid” não podem mais cair em lista textual da IA quando o Places retornar resultados.
- `place_search` agora é convertido para a mesma UI visual usada em recomendações próximas à hospedagem.


## v52 — histórico persistente e ações a partir das sugestões
- histórico do Assistente persistido no SQLite por usuário e por viagem;
- conversa reaparece após refresh, novo login ou outro dispositivo;
- botão “Limpar conversa” remove apenas o histórico daquela viagem;
- resultados visuais podem ser salvos em “Mapa e lugares” ou adicionados ao Roteiro;
- comandos naturais como “Adicione o Museu do Prado ao meu roteiro” e “Salve o Restaurante X” executam a ação sem depender de texto livre da IA;
- quando “esse/essa” for ambíguo entre vários cartões, o Assistente pede o nome ou número em vez de escolher arbitrariamente;
- botões nos próprios cartões oferecem “Salvar lugar” e “Adicionar ao roteiro”.


## v53 — sincronização de versão e auditoria do pacote
- versão do README, `package.json`, healthcheck e mensagem de inicialização sincronizadas em v53;
- `style.css` e `app.js` usam `?v=53` para evitar frontend antigo após deploy;
- estrutura de produção preservada com os arquivos web dentro de `public/`, conforme o servidor Node espera;
- pacote final sem banco SQLite, WAL/SHM, `node_modules`, `.env`, caches ou resíduos de teste.


## v58

- Corrigido caractere de controle invisível (backspace) que havia sido inserido acidentalmente em uma expressão regular de `server.js` e podia causar falha no processamento pelo upload web do GitHub.
- Pacote auditado para caracteres de controle, resíduos SQLite, arquivos temporários e integridade do ZIP.
- Funcionalidades da v54 preservadas.


## v54
- Corrige a rolagem do Assistente para não sobrepor o header.
- Adiciona Guias de viagem ao menu público, busca e grade de até 12 guias.
- Adiciona página detalhada de guia com capa, publicação, introdução, seções expansíveis e cards.
- Adiciona cadastro persistente de guias pelo administrador.


## v61
- Administração de usuários: plano deixa de ser editável diretamente na tabela.
- Novas ações Visualizar, Editar e Excluir.
- Editar permite alterar nome, e-mail e plano com validação no servidor.
- Visualizar reúne viagens e dados cadastrados do viajante em modo somente leitura.
- Refinado o alinhamento vertical da seta do submenu Cadastrar.


## v63
- Endpoint autenticado `POST /api/email/reservas` para receber e-mails do Cloudflare Email Worker.
- Validação do segredo `IHVIAJEI_RESERVAS_SECRET` com comparação segura.
- Armazenamento persistente do e-mail recebido e associação ao usuário quando o remetente corresponde ao e-mail cadastrado.


## v65
- Cada viagem recebe um endereço exclusivo de importação de reservas (`res-...@ihviajei.com.br`).
- O backend identifica a viagem pelo destinatário, sem depender do e-mail do remetente.
- A área Reservas mostra o endereço exclusivo e um botão para copiá-lo.
- Endereços antigos enviados ao `reservas@` continuam com o fluxo de compatibilidade da v63.
- Para os endereços exclusivos funcionarem, o Catch-all do Cloudflare Email Routing deve enviar para o Worker `ihviajei-reservas`.


## v69
- Importação automática de reservas agora ignora mensagens de falha de entrega e só cadastra e-mails com sinais suficientes de uma reserva real.
- Leitura MIME aprimorada para mensagens encaminhadas, multipart, HTML, quoted-printable e base64, priorizando o conteúdo original encaminhado.


## v71
- Backup automático consistente do SQLite com `VACUUM INTO`, compatível com o modo WAL.
- Envio do snapshot para o bucket privado `database-backups` do Supabase usando apenas a credencial do backend.
- Primeiro backup após o boot e novos backups a cada 24 horas por padrão.
- Retenção automática dos 14 snapshots mais recentes por padrão.
- Arquivo temporário local é removido após cada tentativa de upload.
- Configuração opcional por `SUPABASE_BACKUP_BUCKET`, `BACKUP_INTERVAL_HOURS`, `BACKUP_RETENTION` e `BACKUP_START_DELAY_MS`.


## v71 — monitoramento automático de alertas de câmbio
- Verificação automática no servidor a cada 60 minutos (configurável por `ALERT_CHECK_MINUTES`, mínimo 15).
- Cotação real com fallback Frankfurter → AwesomeAPI.
- Disparo somente na entrada da condição e rearme quando a cotação sai dela, evitando repetição.
- Histórico persistente em `alert_events`.
- Envio externo por e-mail via Resend (`RESEND_API_KEY`) ou Brevo (`BREVO_API_KEY`); sem provedor configurado, o disparo fica registrado internamente.
- Remetente configurável em `ALERT_FROM_EMAIL`.


## v74 — gráfico interativo, compras removíveis e ajustes da home

- Gráfico de histórico cambial com tooltip de data/valor e linha vertical no hover.
- Exclusão real de compras de moeda, restrita ao proprietário.
- Textos e preços da home atualizados.
- Rodapé público adaptado à identidade Ih, viajei!.


## v74 — CTAs conscientes da sessão

- CTAs de acesso/cadastro não exibem mais login ou criação de conta quando a sessão já está autenticada.
- Usuário autenticado recebe a informação de que já está conectado e é direcionado para seu painel/Minhas viagens.
- Fluxos deslogados continuam abrindo Entrar ou Criar conta normalmente.


## v76 — e-mail de boas-vindas via Brevo

- Integração do cadastro de novos usuários com a API transacional do Brevo.
- Remetente centralizado pelas variáveis `BREVO_SENDER_EMAIL` e `BREVO_SENDER_NAME`.
- E-mail de boas-vindas envia nome, e-mail e plano cadastrado, com acesso à plataforma.
- A senha nunca é enviada ou armazenada em texto aberto.
- Falha temporária do provedor de e-mail não desfaz nem bloqueia a criação da conta.
- Alertas cambiais e formulário de suporte passam a reutilizar a configuração central do remetente Brevo.


## v77 — Meu perfil
- O botão **Meu perfil** foi adicionado ao menu privado entre **Minhas viagens** e **Sair**.
- **Excluir conta** passou a ser submenu de **Meu perfil** e mantém a confirmação segura e exclusão definitiva implementadas na v76.


## v79 — Meu perfil: plano e senha
- Adicionados **Alterar plano**, **Alterar senha** e mantido **Excluir conta** no submenu **Meu perfil**.
- Alterar plano consulta os planos reais do backend e encaminha planos pagos ao checkout configurado.
- Alterar senha exige a senha atual, mínimo de 10 caracteres e confirmação da nova senha.

## v82 — confirmação de e-mail
- Novos cadastros não entram automaticamente no painel.
- O Brevo envia um botão **Confirmar meu cadastro** com token criptograficamente aleatório, armazenado apenas como hash e válido por 24 horas.
- A conta só é ativada após o clique; então a sessão é criada e o usuário é redirecionado ao painel já autenticado.
- Login de conta ainda não confirmada é bloqueado. Usuários já existentes permanecem confirmados na migração.


## v84 — valores dos alertas de câmbio
- O campo de valor do alerta aceita decimal no padrão brasileiro, como `6,25`, sem as setas nativas do campo numérico.
- Valores usuais são exibidos como moeda brasileira (`R$ 10,00`, `R$ 6,25`) e cotações muito pequenas preservam até quatro casas decimais.
- O e-mail de alerta usa a mesma formatação monetária brasileira.


## v84
- Compras de moeda agora podem ser editadas em modal completo e removidas.
- A Carteira da viagem consolida compras por moeda e mostra total acumulado, total investido e preço médio ponderado.
- O VET é recalculado automaticamente ao editar uma compra.


## v85 — padronização dos botões de câmbio

- Os botões Editar e Remover das compras de moeda usam o mesmo padrão visual e hover dos itens de orçamento.
- O botão Excluir dos alertas de câmbio foi renomeado para Remover e usa o mesmo padrão visual do botão Remover.


## v86 — contato e suporte
- Resultado do envio de contato agora aparece em modal separado, nunca dentro do formulário.
- Envio pelo Brevo usa remetente de suporte separado do destinatário de contato, evitando envio do mesmo endereço para ele próprio.
- Reply-To continua apontando para o e-mail informado pelo usuário.


## v88 — correção do destinatário do suporte no Brevo
- O destinatário do formulário Contato e suporte agora inclui `name`, exigido pela API do Brevo.
- Mantidos remetente de suporte, Reply-To do usuário e modal independente de resultado.


## v89 — aviso de segurança após alteração de senha
- Envio automático pelo Brevo de **“Sua senha foi alterada no Ih, viajei!”** após uma troca de senha concluída com sucesso.
- O aviso é enviado tanto na alteração feita dentro da conta quanto após o fluxo **Esqueci minha senha**.
- O e-mail informa data e horário da alteração, nunca exibe a senha e orienta a redefinição imediata caso o usuário não reconheça a mudança.
- Uma eventual indisponibilidade do provedor de e-mail é registrada no servidor, mas não desfaz uma alteração de senha que já foi concluída com segurança.


## v90 — Dados da conta e alteração segura de e-mail
- Minha conta agora permite editar nome, telefone e e-mail, exigindo a senha atual para salvar.
- A troca de e-mail só é efetivada após confirmação por link enviado ao novo endereço, com validade de 30 minutos e uso único.
- Após a confirmação, o endereço antigo recebe um aviso de segurança sobre a alteração.
- Mensagens de sucesso e erro usam o modal padrão da plataforma.


## v92 — edição da conta em modal separado
- O modal **Minha conta** voltou ao formato de consulta, sem campos editáveis expostos diretamente.
- Adicionado botão **Editar** ao lado do título **Minha conta**, seguindo o padrão visual dos botões de edição já existentes.
- O botão abre um modal separado com nome, telefone, e-mail e senha atual para confirmar alterações.
- O fluxo seguro de confirmação do novo e-mail e o aviso ao endereço antigo continuam preservados.


## Banco principal (v118)

Quando `DATABASE_URL` está definida, a aplicação usa PostgreSQL como banco principal em tempo de execução. `DB_PATH` permanece disponível apenas para compatibilidade/rollback e para a migração manual; novos dados da aplicação não são gravados no SQLite. Sem `DATABASE_URL`, o modo SQLite continua disponível para desenvolvimento local. O endpoint `/api/health` informa `database: postgres` ou `database: sqlite`.

## Novidades v118
- Reservas importadas por e-mail com validação objetiva, confiança e estado “aguardando revisão” antes do cadastro quando houver ambiguidade ou campos importantes ausentes.
- Revisão/edição e descarte de importações pendentes na aba Reservas.
- Visão geral com Próximos passos dinâmicos: acontecimentos do roteiro, checklist pendente, meta cambial, reservas sem confirmação e importações aguardando revisão.

## Ajuste visual v118
- Área Próximos passos refeita para corresponder à referência aprovada, com cabeçalho, botão Ver todos, linhas coloridas, ícones, metadados laterais e setas.


### Checkout transparente Mercado Pago
Defina `MERCADOPAGO_PUBLIC_KEY` junto com `MERCADOPAGO_ACCESS_TOKEN` e `MERCADOPAGO_WEBHOOK_SECRET`. Os dados do cartão são tokenizados pelo MercadoPago.js e a assinatura é criada pelo backend via `/preapproval`.

## v139 — Central inteligente da viagem
A v139 consolida o próximo estágio do produto sem duplicar os módulos existentes: Timeline/Hoje na viagem, preparação, conflitos com Routes quando disponível, clima e sugestão de roupas/checklist, acerto de despesas, calendário visual/ICS, PWA/offline, emissão Wallet e Web Push condicionados às credenciais oficiais. Os recursos inteligentes desta central são PRO e aparecem bloqueados nos planos inferiores. Apple Wallet, Google Wallet e Web Push exigem credenciais oficiais externas no ambiente; a plataforma expõe o estado de configuração sem simular emissão.

Também foram adicionadas estruturas para auditoria administrativa e saúde das integrações. A documentação e os marcadores internos desta entrega usam v139.

## v139 — conclusão do escopo PRO
A v139 transforma a base anterior em fluxos operacionais: Timeline usa horário estruturado; Hoje na viagem respeita fuso detectado; conflitos consultam Google Routes quando configurado; mala inteligente combina Assistente IA e meteorologia; ações do Assistente passam por proposta e confirmação; Central de Emergência persiste dados; acertos podem ser registrados; há calendário visual + ICS e relatório PDF.

Wallet: Google Wallet cria/atualiza Generic Class/Object e gera link oficial quando o emissor está configurado. Apple Wallet gera `.pkpass` assinado quando certificados e o modelo `.pass` oficial estão configurados. Web Push usa VAPID e o monitor de voos PRO verifica reservas próximas de hora em hora, notificando mudanças detectadas.

Admin: 2FA TOTP, audit log e painel de saúde foram conectados. As tabelas v139 são criadas pelo mesmo bootstrap DDL tanto em SQLite quanto em PostgreSQL através do adaptador de produção.

Integrações externas não são simuladas: sem credenciais válidas, os controles permanecem em estado de configuração pendente.

## v139 — Administração operacional e acesso de teste
O painel administrativo foi endurecido para que uma falha isolada de saúde/auditoria/estatísticas não deixe usuários e gráficos vazios. As estatísticas deixaram de depender de funções de data exclusivas do SQLite e agora funcionam de forma compatível com o PostgreSQL de produção.

Administradores podem conceder **acesso de teste** Gratuito, Intermediário ou PRO por 1, 7, 30 dias ou sem prazo. O override não altera nem cancela a assinatura comercial do Mercado Pago: `plan` continua sendo a fonte comercial e `test_plan` apenas determina o entitlement efetivo enquanto estiver válido. Toda concessão/remoção é registrada no audit log.

## v139 — desempenho e usabilidade da Central PRO
A Central da viagem passa a abrir primeiro com dados locais e carrega clima e análise detalhada de deslocamentos em segundo plano. O checklist inteligente abre feedback imediatamente, consulta IA/meteorologia sem bloquear a interface e remove sugestões que já estejam no checklist. A Timeline exibe data e horário por evento. O acerto entre viajantes permite marcar/desmarcar pagamentos, preservando o estado e exibindo itens quitados riscados. O card redundante “Calendário da viagem” foi removido; a exportação `.ics` permanece como ação no padrão visual da plataforma.
