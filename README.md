# Ih, viajei! v6
**Sua viagem na palma da mão.**

Esta é a primeira versão com backend e banco de dados reais. Não há contas demo, cotações inventadas ou ofertas fictícias.

## O que já é real
- Cadastro e login multiusuário com sessão persistida no servidor.
- Senhas protegidas com `scrypt` + salt individual; a senha em texto puro nunca é gravada.
- Banco SQLite com usuários, sessões, viagens, compras e alertas.
- Cada consulta de dados é vinculada ao usuário autenticado.
- Múltiplas viagens e metas por moeda.
- Carteira e registro de compras; o VET é calculado pelo backend (`total em R$ / moeda comprada`).
- Alertas de limite salvos no banco (o disparo automático ainda exige um serviço agendado/canal de notificação).
- Painel administrativo real, habilitado somente para usuário com `role=admin`.
- Cotação de referência EUR/USD/GBP/CHF → BRL obtida em tempo real pela API Frankfurter (dados de referência do BCE). Se a fonte estiver indisponível, o sistema informa indisponibilidade e não inventa valor.
- Comparador comercial não exibe parceiros falsos: ele só deverá listar ofertas quando APIs/contratos reais forem integrados.

## Requisitos
Node.js 22.5 ou superior. O projeto não depende de pacotes npm de terceiros.

## Rodar localmente
1. Copie `.env.example` para `.env`.
2. Ajuste `APP_ORIGIN=http://localhost:3000`.
3. Opcionalmente configure `ADMIN_EMAIL`, `ADMIN_PASSWORD` (mínimo 10 caracteres) e `ADMIN_NAME` antes do primeiro boot.
4. Execute `npm start`.
5. Abra `http://localhost:3000`.

O banco é criado automaticamente em `data/ihviajei.db` (ou no caminho definido em `DB_PATH`).

## Testes
Execute `npm test`. O teste cria um banco temporário e valida cadastro, sessão, isolamento por autenticação, viagem, compra/VET e alerta.

## Correção v6 — Railway + SQLite
A v6 corrige a inicialização do SQLite em volume persistente no Railway. O container não força mais o usuário `node`, evitando incompatibilidade de UID/GID com volumes recém-montados. Antes de abrir o SQLite, o servidor agora cria o diretório quando necessário, verifica leitura/escrita e realiza uma gravação de teste. Se o volume não estiver acessível, o log informa `DB_PATH`, diretório, UID e o erro real.

Configuração recomendada no Railway: `DB_PATH=/app/data/ihviajei.db` e Volume Mount Path `/app/data`.

## Produção
**GitHub Pages não executa esta versão**, pois agora existe backend. O GitHub continua adequado para versionar o código, mas a aplicação deve ser implantada em um host que execute Node.js/Docker e mantenha armazenamento persistente para o banco.

Para Docker: copie `.env.example` para `.env`, ajuste `APP_ORIGIN` para o domínio HTTPS público, defina o administrador e rode `docker compose up -d --build`. O volume `ihviajei_data` preserva o banco.

Em produção, use HTTPS obrigatório e faça backup periódico do volume/banco. Para escala horizontal/múltiplas instâncias, migre a camada de dados de SQLite para PostgreSQL antes de distribuir a aplicação entre vários servidores.

## O que depende de fornecedores externos
Venda de moeda, ofertas/VET de instituições, pagamentos, WhatsApp/e-mail/push e execução automática dos alertas exigem contratos, credenciais e APIs dos respectivos fornecedores. Esses itens não são simulados nesta versão.

Versão: **ihviajei-v6**


## Novidades v6
Dashboard ampliado, página detalhada por viagem, orçamento, roteiro, reservas, checklist, Radar EUR/USD baseado no histórico de 30 dias e correção do vínculo automático de compras à primeira viagem. As tabelas novas são criadas automaticamente sem apagar o banco existente.
