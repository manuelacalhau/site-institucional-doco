# Tag automática ANP 07/11 no Datacrazy

Workflow n8n: `62Ox0C99dlPAaQWY`, **DataCrazy — Webinário A Nova Psicologia — Formulário**.
Entrada do site: `POST /api/datacrazy-webinar`, proxy para `datacrazy-webinar-lead-v1`.
Tag: **ANP 07/11**, ID `c3452032-405a-4464-b783-ddae26e8e7f3`.

## Regra

- Cadastros da edição `2026-11-07` recebem a tag. A edição ausente usa a edição atual 07/11 como padrão deste endpoint exclusivo do webinário; edições históricas explícitas não recebem a tag nova.
- A identificação continua por e-mail exato e telefone normalizado, antes de criar outro contato.
- Antes de atualizar um lead existente, lê-se seu cadastro completo por ID, para preservar tags e anotações que podem não estar completas na listagem de busca.
- O PATCH envia a união sem duplicatas das tags atuais e da tag da edição. O POST já cria o lead com a tag.
- Após criar/atualizar, uma nova leitura por ID confirma a tag e a preservação das tags anteriores. Só depois o fluxo procura/cria o negócio e retorna `ok:true`.
- Falha ao gravar ou confirmar a tag interrompe a confirmação; não há sucesso silencioso sem a tag.
- O pipeline, as etapas, os negócios existentes e as credenciais foram preservados. A etapa nunca retrocede no caminho existente.
- A resposta inclui `webinar_edition`, `edition_tag_verified` e `tag_ids`, além dos IDs do lead e negócio.

## Recuperação e validação

Backup privado no serviço n8n: `/home/node/.n8n/anp-tags-20261107/before.json`; versão preparada em `after.json`.
`patch-workflow.js` aplica a alteração a esse backup exato e executa testes locais com dados fictícios antes de gravar `after.json`. Não contém nem exporta credenciais; os nós HTTP adicionais reutilizam as referências já existentes no workflow.

Testes do patch: edição atual e padrão, edição histórica, POST com tag, atualização por telefone, união de tags sem duplicação, preservação de anotações, erro quando falta a tag e erro quando uma tag anterior desaparece.

A publicação usa os comandos oficiais de importação/publicação do n8n e reinício para carregar a versão ativa. O teste de integração chama apenas o endpoint de CRM; não submete o formulário completo nem aciona Mautic, Meta ou WhatsApp. Contatos técnicos devem permanecer claramente identificados como QA.

Referência oficial da estrutura de atualização: https://docs.datacrazy.io/api-reference/leads/atualizar-lead

Para uma próxima edição, criar sua tag exclusiva e adicionar o mapeamento da edição antes de publicar o site. Nunca renomear a tag histórica de outra edição nem aplicar a nova tag indiscriminadamente à base de outros funis.

## Resultado da verificação em produção — 01/11/2026

Três chamadas pelo proxy real do site retornaram HTTP 200 e `edition_tag_verified:true`:

1. Novo contato técnico: tag ANP 07/11 presente e um negócio criado em Inscrito.
2. Mesmo telefone com e-mail atualizado: mesmos IDs de contato e negócio, sem recriação; tag Teste e anotação de preservação mantidas.
3. Contato técnico anterior, sem a tag nova: recebeu ANP 07/11 e manteve Teste, anotações de 31/10 e o negócio existente.

A confirmação foi cruzada pelo conector Datacrazy após os requests: uma ocorrência do telefone técnico, um negócio por contato e ambas as tags preservadas. A captura no CRM mostra apenas os dois contatos técnicos, não leads comerciais. Nenhuma inscrição completa do Mautic foi submetida nesses testes.
