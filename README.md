# Ih, viajei! v14

Versão ampliada do planejador de viagens. Mantém os recursos anteriores e acrescenta mapa da viagem, exploração de lugares com dados públicos, documentos/vouchers por link, divisão de despesas, viajantes/colaboração organizada e assistente contextual baseado nos dados da viagem.

## Importante
Recursos que exigem credenciais de terceiros não usam dados fictícios. Status de voo em tempo real, envio automático de convites/e-mails, IA generativa externa e importação automática de e-mails exigem provedores/credenciais e não são simulados. A v14 oferece as respectivas áreas funcionais com dados próprios/públicos sem fingir integrações inexistentes.

## Deploy
Mantém `DB_PATH=/app/data/ihviajei.db` e o volume em `/app/data`. As tabelas novas são criadas com `CREATE TABLE IF NOT EXISTS`, preservando o banco existente.

## Testes
`npm test`
