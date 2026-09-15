# Ih, viajei! — v2

**Sua viagem na palma da mão.**

## O que há nesta versão
- Home pública.
- Criar conta e entrar (simulados localmente para validação do protótipo).
- Área individual do viajante.
- Múltiplas viagens por usuário.
- Metas cambiais por viagem.
- Carteira com registro de compras e cálculo de preço médio.
- Dashboard individual.
- Radar de euro/dólar demonstrativo.
- Comparador por VET demonstrativo.
- Alertas personalizados.
- Perfil e preferências.
- Layout responsivo.

## Teste rápido
Abra `index.html` ou publique os arquivos na raiz do GitHub Pages.

Conta demonstrativa: `demo@ihviajei.com` / `demo123`.

> **Não use senha real.** A autenticação da v2 é um protótipo em `localStorage`, não uma autenticação segura de produção.

## Próxima etapa obrigatória para produção
GitHub Pages pode continuar servindo o front-end, mas contas reais exigem autenticação e banco no servidor. A migração recomendada deve incluir: tabela de usuários/perfis, viagens, compras, alertas e parceiros; autenticação com e-mail verificado; recuperação de senha; políticas de acesso por usuário (row-level security ou equivalente); validação server-side; rate limiting; logs/auditoria; backups; consentimentos e rotinas LGPD.

A v2 deliberadamente **não** simula segurança de produção nem executa operações de câmbio. Cotações, Radar e ofertas exibidas são demonstrativos até integração com fontes e instituições autorizadas.
