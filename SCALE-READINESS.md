# Ih, viajei! — preparação para escala (v112)

## PostgreSQL
A v112 inclui ferramentas para validar a conexão e copiar, de forma transacional e sem apagar a origem, os dados do SQLite para um PostgreSQL provisionado no Railway.

1. Provisione PostgreSQL no mesmo projeto Railway.
2. Exponha `DATABASE_URL` ao serviço `ihviajei` por referência de variável do Railway. Não copie a senha para o repositório.
3. Faça backup do volume/SQLite antes da migração.
4. Execute `npm run postgres:check`.
5. Em janela de manutenção, sem novas gravações, execute `npm run migrate:postgres`.
6. Confira contagens e integridade antes do cutover.

IMPORTANTE: no runtime v112, quando `DATABASE_URL` está configurada, o servidor seleciona PostgreSQL como banco operacional. O SQLite permanece disponível como fallback somente quando `DATABASE_URL` não está configurada. A imagem Docker inclui o adaptador e o worker PostgreSQL necessários ao runtime.

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

## Correção v112 — chaves primárias compostas

A migração agora converte corretamente chaves primárias compostas do SQLite para uma única restrição `PRIMARY KEY (...)` no PostgreSQL. Isso corrige especificamente a tabela `trip_user_settings`, cuja chave é `(user_id, trip_id)`, evitando o erro `multiple primary keys ... are not allowed`. Sequências automáticas continuam sendo criadas somente para chaves primárias inteiras de uma única coluna.

## Backup e restauração PostgreSQL — v112
Quando `DATABASE_URL` está configurada, o backup automático usa `pg_dump --format=custom` e envia o arquivo `.dump` ao bucket privado `SUPABASE_BACKUP_BUCKET`. A retenção é controlada por `BACKUP_RETENTION`; o intervalo, por `BACKUP_INTERVAL_HOURS`. O estado do último backup aparece em `/api/admin/operations` e também é registrado em log JSON estruturado (`database_backup`).

A imagem Docker instala `postgresql-client`, necessário para `pg_dump` e `pg_restore`. Para restauração, primeiro obtenha um `.dump` confiável do bucket privado em uma janela de manutenção. A restauração é deliberadamente bloqueada por padrão e exige `RESTORE_CONFIRM=RESTORE_POSTGRES npm run restore:postgres -- /caminho/arquivo.dump`. Após restaurar, execute `npm run postgres:check` e testes funcionais antes de reabrir gravações. Nunca teste restore diretamente sobre produção; valide periodicamente em um banco PostgreSQL temporário.
