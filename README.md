# Ih, viajei! v21

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
- versão interna, healthcheck e pacote sincronizados em v21.

## Railway
Variáveis existentes continuam válidas: `SESSION_SECRET`, `DB_PATH`, `APP_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `GOOGLE_MAPS_API_KEY`.

O banco SQLite persistente em `/app/data` não é incluído no ZIP e não deve ser substituído no deploy.

- abas Mapa, Explorar, Documentos, Despesas e Viajantes com carregamento assíncrono aguardado e erro visível/repetível;
- Explorar filtra resultados pelo país selecionado e aplica região do Google quando disponível;
- removido Câmbio e Radar duplicado da barra autenticada;
- removido rótulo Administração geral acima do título do painel;
- Distribuição por plano corrigida para não ultrapassar o card.

## Integração v21 — Google Routes
- cálculo real de rotas pelo backend com a Routes API;
- chave separada `GOOGLE_ROUTES_API_KEY`, nunca enviada ao navegador;
- modos carro, a pé, bicicleta e transporte público;
- distância, duração e traçado real exibidos no mapa;
- rota usa os locais do Roteiro na ordem cadastrada.
