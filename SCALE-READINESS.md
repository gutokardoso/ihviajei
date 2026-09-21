# Ih, viajei! — preparação para escala (v107)

## PostgreSQL
A v107 inclui ferramentas para validar a conexão e copiar, de forma transacional e sem apagar a origem, os dados do SQLite para um PostgreSQL provisionado no Railway.

1. Provisione PostgreSQL no mesmo projeto Railway.
2. Exponha `DATABASE_URL` ao serviço `ihviajei` por referência de variável do Railway. Não copie a senha para o repositório.
3. Faça backup do volume/SQLite antes da migração.
4. Execute `npm run postgres:check`.
5. Em janela de manutenção, sem novas gravações, execute `npm run migrate:postgres`.
6. Confira contagens e integridade antes do cutover.

IMPORTANTE: o servidor v107 continua usando SQLite como banco operacional. A ferramenta desta versão faz a cópia segura e valida a infraestrutura PostgreSQL, mas não troca silenciosamente o driver do servidor. O cutover do runtime exige a refatoração das consultas síncronas `node:sqlite` para consultas assíncronas PostgreSQL. Fazer isso sem o banco Railway provisionado e sem um ensaio com os dados reais criaria um risco desnecessário de indisponibilidade. O SQLite permanece como rollback.

## Observabilidade
Todas as chamadas `fetch` do backend são instrumentadas sem registrar URL completa, headers, tokens, payloads ou documentos. São agregados: serviço, quantidade, falhas, status, latência média/máxima e último horário. Serviços reconhecidos: Supabase, Google APIs (Places/Routes), AeroDataBox, OpenAI, Brevo, Resend, Frankfurter, AwesomeAPI, BCB e Open-Meteo.

`GET /api/admin/operations` é restrito a administrador e retorna o snapshot operacional. `GET /api/health` retorna apenas estado básico, versão, uptime e indicação de configuração do PostgreSQL.

Os logs de chamadas externas são JSON estruturado no stdout e podem ser coletados pelo Railway ou por uma plataforma de observabilidade. Nenhuma chave de API, cookie, senha, corpo de e-mail ou documento é incluído nesses eventos.

## Antes de múltiplas réplicas
- concluir o cutover do runtime para PostgreSQL;
- mover rate limiting para Redis/serviço compartilhado;
- usar observabilidade centralizada (Railway logs ou APM) para agregar réplicas;
- validar backup/restauração do PostgreSQL;
- manter webhooks idempotentes.
