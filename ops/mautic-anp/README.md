# ANP: boas-vindas de campanha e aquecimento por segmento

Instalado no serviço `doco / mautic-doco`, no volume persistente `/var/www/html/var/anp-editions`.
O File Mount `/etc/cron.d/anp-editions` executa `run.php` a cada minuto como `www-data`.
Esta pasta contém a fonte de recuperação; o Dockerfile do site não a publica.

## Estrutura nativa do Mautic — versão 2

- **DX**: e-mail de campanha (`email_type=template`), enviado pela ação nativa `email.send.lead` do formulário standalone. Cada inscrição bem-sucedida aciona a confirmação imediatamente, sem depender de entrada/reentrada em campanha ou de cron. O conteúdo inclui o grupo de WhatsApp da edição.
- **D5, D4, D3, D2, D1, D0_09 e D0_13**: e-mails de segmento (`email_type=list`), associados exclusivamente ao segmento da edição. O envio usa `mautic:broadcasts:send --channel=email --id=ID` e as janelas de publicação nativas.
- Cada nova edição `scheduled` no registro público do site gera um segmento exclusivo, um formulário e oito cópias de e-mails. Os textos são genéricos, sem datas; o grupo e o acesso à aula vêm da edição. Os modelos estão em `emails.json`.
- As associações de cada edição ficam em `state.json`, fora da área pública. Rerodar o provisionamento não duplica objetos. Mudanças manuais nos e-mails, no segmento destinatário ou nas datas de publicação não são sobrescritas a cada execução.
- O mapa público `/media/images/anp-editions.json` contém somente IDs e nome do formulário. O site usa `/api/mautic-webinar-config` para enviar o cadastro ao formulário da edição atual.

Na edição de 07/11/2026: segmento 33, formulário 12, DX 71 e ação de envio 19. Os sete e-mails de segmento são 72–78. A campanha 36, que antes continha os oito envios, foi despublicada e preservada como histórico. A campanha antiga 35 continua pausada. Nenhum evento ou histórico de contato foi apagado.

## Conteúdo e horários

| Mensagem | Tipo | Conteúdo | Horário em Brasília | Expiração |
| --- | --- | --- | --- | --- |
| DX | Campanha, via formulário | Boas-vindas e grupo | Após cada inscrição | Fim da edição |
| D5 | Segmento | Por que agências falham com psicólogos | 14h, cinco dias antes | Meia-noite seguinte |
| D4 | Segmento | Cronograma em PDF | 14h, quatro dias antes | Meia-noite seguinte |
| D3 | Segmento | Imagem dos 985 leads em duas semanas | 14h, três dias antes | Meia-noite seguinte |
| D2 | Segmento | Saturação de mercado e spoiler visual | 14h, dois dias antes | Meia-noite seguinte |
| D1 | Segmento | Folha de estudos para baixar | 14h, um dia antes | Meia-noite seguinte |
| D0_09 | Segmento | É hoje | 9h | 13h |
| D0_13 | Segmento | Falta uma hora | 13h | 14h |

O processamento dos e-mails de segmento pode acrescentar aproximadamente um minuto ao horário, além da entrega SMTP. O transporte usa spool em memória (envio imediato). O DX não depende desse processamento periódico.

## Próximas edições e ajustes

Cadastrar a nova edição no `webinario/a-nova-psicologia/editions.json`, atualizar `current`, gerar `editions.js` com `scripts/build-webinar-editions.py` e publicar o site. O provisionamento cria o segmento e o formulário em até um ciclo do cron. Ele valida fuso `America/Sao_Paulo`, início às 14h e os links de WhatsApp e Meet. O cadastro não usa silenciosamente o segmento de outra edição se o novo formulário ainda não estiver pronto.

Para adequar um e-mail de segmento manualmente, ajustar **segmento destinatário**, **publicar em** e **despublicar em** no Mautic. Os textos permanecem genéricos. Ao reaproveitar o mesmo ID, o Mautic preserva o histórico de envio e evita reenvio a quem já o recebeu; para uma nova edição com pessoas recorrentes, duplicar o e-mail ou usar as cópias criadas pelo provisionador. Assim o histórico e os destinatários das edições não se misturam.

Para pausar um e-mail, despublicá-lo no painel. O cron respeita essa escolha. O wrapper lê tipo e janela de publicação diretamente do banco, portanto ajustes de horário feitos no Mautic são considerados no próximo ciclo. Alterações do registro de uma edição já provisionada exigem revisão explícita, detectada por hash, para evitar modificar silenciosamente os objetos existentes.

## Verificações

- `php provision.php --self-test`: cria uma edição futura dentro de transação, verifica segmento exclusivo, formulário nativo, ação DX apontando para o e-mail novo, sete associações de segmento e horários. Todos os objetos temporários são revertidos. Não executa DDL da tabela de resultados nessa transação, pois MySQL faria commit implícito; no provisionamento real o modelo oficial do Mautic cria a tabela.
- `php verify.php`: confere tipos nativos, segmento, horários, expiração, WhatsApp e estado das campanhas antigas. Executa duas vezes o **subscriber nativo instalado** do formulário, substituindo somente o modelo que entregaria ao SMTP por um capturador; verifica dois acionamentos imediatos do DX, sem enviar e-mails reais.
- O teste antigo com POST real de um contato fictício foi desativado. A confirmação funcional nativa de formulário usa `ignoreDNC=true`; não testar essa ação enviando um formulário com endereço fictício, pois supressão DNC não impede a confirmação. Usar o teste capturado de `verify.php` ou um destinatário real autorizado.
- Os e-mails de segmento respeitam as supressões de marketing. O envio e a deduplicação são geridos pelo Mautic, não por logs próprios de entrega.
- Cron, scripts e estado persistiram após redeploy. O cron lê apenas os IDs administrados por esta automação. As imagens carregam nas prévias e os materiais retornam seus tipos corretos.

Cópias privadas da migração: `before-layout-v2.json`, `provision-v1.php` e `run-v1.php`, no diretório do serviço. Nenhuma credencial é criada ou incluída no código-fonte; utiliza-se o acesso interno já existente do Mautic ao banco.
