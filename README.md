# Ih, viajei! v8
**Sua viagem na palma da mão.**

Aplicação Node.js com autenticação real, SQLite persistente e planejamento de viagens por usuário.

## v8 — revisão funcional
- Corrige o acesso de **Abrir planejamento** e demais ações dos cartões sob a política de segurança do navegador.
- Mantém o menu público no header e a **Área do viajante** em uma faixa separada.
- Página individual de viagem com **Visão geral, Orçamento, Roteiro, Reservas e Checklist**.
- Orçamento por categoria, roteiro com data/local/observações, reservas e checklist persistidos no banco.
- Carteira da viagem, progresso da meta cambial e contagem até o embarque.
- Seleção automática da primeira viagem ao registrar compra de moeda.
- Radar EUR/BRL e USD/BRL com histórico real: prioriza **PTAX/Banco Central do Brasil** e usa Frankfurter/BCE como contingência. Nenhum valor é inventado quando as fontes falham.
- Booking do Câmbio consulta o **Ranking do VET do Banco Central** e exibe instituições, VET médio histórico e número de operações do mês de referência disponível. O ranking é histórico e não representa oferta atual.
- Login com opções claras **Entrar** e **Criar conta**.
- Botões de atualização com estado visual de carregamento.

## Banco e Railway
O banco é criado em `data/ihviajei.db` ou no caminho de `DB_PATH`. No Railway, mantenha:
- `DB_PATH=/app/data/ihviajei.db`
- Volume Mount Path `/app/data`

A v8 usa `CREATE TABLE IF NOT EXISTS`, portanto as novas estruturas não apagam usuários, viagens ou compras já existentes.

## Rodar localmente
1. Copie `.env.example` para `.env`.
2. Ajuste `APP_ORIGIN=http://localhost:3000`.
3. Configure `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_NAME` se desejar criar o administrador inicial.
4. Rode `npm start`.
5. Abra `http://localhost:3000`.

## Testes
`npm test` valida autenticação, sessão, viagem detalhada, orçamento, roteiro, reservas, checklist, compra/VET e alertas.

## Produção
GitHub Pages não executa o backend. Use o GitHub para versionamento e o Railway (ou outro host Node.js) para a aplicação. Em escala horizontal, migre SQLite para PostgreSQL.

Venda efetiva de moeda, pagamentos e disparos automáticos de WhatsApp/e-mail/push continuam dependendo de fornecedores/credenciais. A plataforma não simula ofertas comerciais atuais.

Versão: **ihviajei-v8**
