# Auditoria de segurança de produção — v140

Data: 20/09/2026

## Endurecimento aplicado nesta versão

- Sessões: cookie HttpOnly, SameSite=Lax, Secure forçado em produção HTTPS; validade padrão reduzida para 14 dias (máximo 30); tokens de sessão armazenados somente como SHA-256; limite de 10 sessões por usuário; expiração limpa automaticamente.
- CSRF/origem: requisições mutáveis rejeitam `Sec-Fetch-Site: cross-site` e continuam validando `Origin` quando presente. O webhook de reservas permanece autenticado por segredo dedicado.
- Headers: HSTS em produção, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP, CORP e X-Permitted-Cross-Domain-Policies. A CSP existente continua ativa nos arquivos estáticos.
- Rate limiting: limite global por IP para API, limite adicional para administração e limite específico para upload, além dos limites já existentes de login, cadastro, recuperação de senha, suporte e webhook.
- Uploads: 8 MB, somente PDF/JPEG/PNG, validação de MIME e assinatura binária (magic bytes), caminho aleatório por usuário/viagem e leitura autorizada por usuário.
- Administração: endpoints continuam exigindo sessão autenticada + `role=admin`; foi adicionado rate limit administrativo.
- Logs/PII: removido e-mail do log de falha de alertas e corpo de erro do provedor de e-mail. E-mails brutos de reservas são apagados assim que deixam de ser necessários, inclusive quando não há usuário correspondente.
- Tokens: verificação de e-mail, redefinição de senha, alteração de e-mail e convites têm expiração; tokens são armazenados por hash e limpos periodicamente. Redefinir senha invalida todas as sessões.
- Dependências: o backend não possui dependências npm de runtime; usa módulos nativos do Node.js. Isso reduz a superfície de supply-chain.

## Pontos que ainda exigem operação segura antes de pagamentos

1. Colocar o domínio exclusivamente atrás de HTTPS e manter Cloudflare/Railway atualizados.
2. Rotacionar periodicamente `SESSION_SECRET`/segredos externos, chaves Supabase, Brevo, OpenAI, RapidAPI e segredo do Worker; nunca armazená-los no repositório.
3. Para pagamentos, não confiar no retorno do navegador: o plano/assinatura deve ser ativado somente por webhook assinado do provedor, com idempotência e validação do valor/produto.
4. Ativar MFA para contas administrativas e, idealmente, exigir reautenticação para ações destrutivas de administração.
5. Migrar o rate limiting em memória para Redis/serviço compartilhado antes de múltiplas réplicas; o limite atual é por instância.
6. Migrar SQLite para PostgreSQL antes de escala/múltiplas réplicas e manter backups testados com restauração periódica.
7. Configurar monitoramento de erros/auditoria sem payloads sensíveis e alertas para picos de 401/403/429/5xx.
8. Revisar a CSP para remover `unsafe-inline` quando o frontend for refatorado para scripts/estilos com nonce ou arquivos externos.
9. Executar teste de intrusão externo antes de processar pagamentos reais e repetir após mudanças relevantes em autenticação, colaboração, uploads ou checkout.

## Classificação

A v140 está mais endurecida para testes com usuários, mas a entrada em produção com pagamentos deve aguardar os itens operacionais acima, especialmente webhook de pagamento assinado/idempotente, MFA administrativo, monitoramento e teste de intrusão.
