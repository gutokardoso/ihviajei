# Ih, viajei! v49

**Sua viagem na palma da mão.**

Versão de consolidação construída sobre o v16 anexado, preservando as decisões já aprovadas e corrigindo regressões identificadas na auditoria.

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
