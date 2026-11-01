# Aquecimento ANP por edição

Instalado em `doco / mautic-doco`, no volume persistente `/var/www/html/var/anp-editions`.
O File Mount persistente `/etc/cron.d/anp-editions` executa `run.php` a cada minuto como `www-data`.
Os arquivos desta pasta são fonte de recuperação; o Dockerfile do site não os publica.

## Funcionamento

- `provision.php` lê somente o registro público `webinario/a-nova-psicologia/editions.json` do site oficial, valida fuso, links e horário e cria um segmento, um formulário, uma campanha e oito cópias de e-mails para cada edição futura `scheduled`.
- O estado é gravado em `state.json`, fora da área pública. A execução repetida não duplica objetos.
- A edição inicial de 07/11/2026 reutiliza segmento 33 e formulário 12. A campanha nova é 36; e-mails 71–78. Campanhas históricas não são republicadas.
- O formulário tem uma ação nativa de inclusão no segmento exclusivo. As pessoas podem pertencer a mais de uma edição sem perder o histórico. O formulário também preserva a inclusão no segmento geral, cujo fluxo só altera segmentos.
- O mapa público `/media/images/anp-editions.json` contém apenas IDs e nome do formulário. O site consulta esse mapa pelo proxy `/api/mautic-webinar-config` e envia a inscrição ao formulário correspondente à edição atual.
- `run.php` reconstrói e processa exclusivamente as campanhas criadas por esta automação, com comandos oficiais do Mautic. O arquivo `enabled` autoriza a ativação inicial dessas campanhas. Uma campanha já ativada que for pausada no painel permanece pausada.
- Uma pessoa recebe uma sequência por edição; submissões repetidas na mesma edição não reiniciam a campanha. Inscrição em outra edição entra em outra campanha e recebe novas boas-vindas.

## Conteúdo e horários

Os oito modelos estão em `emails.json`; não têm datas no assunto nem no texto. URLs de acesso são vinculadas à edição correta. Os materiais públicos estão em `webinario/a-nova-psicologia/materiais/`.

| Mensagem | Conteúdo | Horário em Brasília | Expiração |
| --- | --- | --- | --- |
| DX | Boas-vindas | Após inscrição | Fim da edição |
| D5 | Por que agências falham com psicólogos | 14h, cinco dias antes | Meia-noite seguinte |
| D4 | Cronograma em PDF | 14h, quatro dias antes | Meia-noite seguinte |
| D3 | Imagem de 985 leads em duas semanas | 14h, três dias antes | Meia-noite seguinte |
| D2 | Saturação de mercado, com spoiler visual | 14h, dois dias antes | Meia-noite seguinte |
| D1 | Folha de estudos para baixar | 14h, um dia antes | Meia-noite seguinte |
| D0_09 | É hoje | 9h | 13h |
| D0_13 | Falta uma hora | 13h | 14h |

Todos os eventos são independentes e os e-mails têm janelas de publicação. Lembretes vencidos são ignorados pelo Mautic e não bloqueiam os seguintes. Todos usam o modo marketing para respeitar cancelamentos e supressões. O processamento periódico pode acrescentar aproximadamente um minuto ao horário, além da entrega SMTP.

## Próximas edições

Cadastrar uma nova chave ISO no registro do site, com `status=scheduled`, fuso `America/Sao_Paulo`, início às 14h, fim, grupo e Meet; atualizar `current` e gerar `editions.js` com `scripts/build-webinar-editions.py`. Publicar o site. O Mautic cria os objetos e o site passa a usar o novo formulário quando o mapa estiver pronto, em até um ciclo do cron. O cadastro falha de forma visível caso a edição ainda não tenha formulário; ele nunca usa silenciosamente um segmento de outra edição.

Alterações de uma edição já provisionada exigem revisão explícita; um hash detecta mudanças e evita alterar silenciosamente os agendamentos. Para pausar envios, despublicar a campanha correspondente no Mautic. O script não desfaz a pausa manual.

## Validações realizadas

- Auditoria dos oito assuntos, HTML, texto simples, links, horários UTC equivalentes a Brasília, expiração e cancelamento.
- Inscrição técnica pelo proxy real do site com contato fictício previamente suprimido de e-mail: segmento correto e nenhum vínculo à edição anterior.
- Ativação da campanha 36: boas-vindas processadas e corretamente suprimidas para o contato técnico; os sete lembretes agendados nas datas esperadas. Nenhum e-mail enviado ao endereço fictício.
- `php provision.php --self-test` testa uma edição futura dentro de uma transação: novo segmento, formulário nativo, campanha, oito e-mails e horários. Todos os objetos temporários são revertidos. Esse teste não cria a tabela de resultados do formulário, pois DDL no MySQL faria commit implícito; a criação da tabela é executada pelo modelo oficial do Mautic no provisionamento real.
- Reexecução idempotente e cron persistente após redeploy do contêiner.
- Imagens carregam nas prévias do Mautic e materiais respondem com os tipos de arquivo corretos.

Os scripts usam o acesso interno existente do Mautic ao banco; não contêm nem geram credenciais. Os arquivos de estado e logs ficam privados no volume da aplicação.
