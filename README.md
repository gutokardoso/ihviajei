# Ih, viajei! v15

Correções de estabilidade e segurança de conteúdo:
- modais fecham no X e ao clicar no backdrop;
- barra autenticada/admin fica sticky junto ao header;
- Área do viajante redundante removida do dashboard;
- Explorar lugares deixou de usar busca genérica da Wikipedia e agora usa Google Places API (New);
- sem GOOGLE_MAPS_API_KEY, a aplicação informa que a integração precisa ser configurada e não exibe resultados genéricos;
- nova viagem sempre abre com destinos limpos e exige seleção explícita.

Variável para Explorar lugares:
`GOOGLE_MAPS_API_KEY`

A API Places (New) deve estar habilitada no projeto Google Cloud associado à chave.
