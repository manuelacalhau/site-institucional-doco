import fs from "node:fs";
import path from "node:path";

const siteRoot = path.resolve(import.meta.dirname, "..");
const vaultRoot = path.resolve(siteRoot, "..", "Agência doco - Codex");
const obsidianDir = path.join(vaultRoot, "01_Agencia", "Marketing", "SEO", "Blog");
const today = "2026-06-19";

const posts = [
  {
    title: "Como conseguir pacientes para psicólogo: um plano além das indicações",
    slug: "como-conseguir-pacientes-para-psicologo",
    category: "Captação",
    keyword: "como conseguir pacientes para psicólogo",
    secondary: ["captar pacientes para psicologia", "agenda cheia para psicólogos"],
    meta: "Veja como conseguir pacientes para psicólogo com posicionamento, presença digital, conversão ética e uma jornada de decisão bem organizada.",
    summary: "Um plano prático para construir demanda, confiança e agendamentos sem depender de uma única ação de marketing.",
    urgency: "A agenda parece depender de sorte porque não existe um processo contínuo entre ser encontrado, gerar confiança e facilitar o agendamento.",
    promise: "transformar ações dispersas em um sistema de aquisição responsável e mensurável",
    mistakes: ["tentar estar em todos os canais ao mesmo tempo", "copiar a comunicação de outros profissionais", "medir apenas seguidores e alcance", "investir em anúncios antes de corrigir a página e o atendimento"],
    actions: ["definir com clareza quem deve encontrar o trabalho", "organizar Google, site e Instagram como pontos complementares", "criar um caminho simples até o contato", "acompanhar contatos, agendamentos e comparecimentos"],
    metrics: ["contatos qualificados", "taxa de agendamento", "tempo de resposta", "comparecimento à primeira consulta"],
  },
  {
    title: "Marketing para psicólogos: guia ético para construir uma agenda previsível",
    slug: "marketing-para-psicologos",
    category: "Marketing",
    keyword: "marketing para psicólogos",
    secondary: ["marketing digital para psicólogos", "agência de marketing para psicólogos"],
    meta: "Entenda como fazer marketing para psicólogos com ética, posicionamento, canais integrados e métricas que ajudam a construir uma agenda previsível.",
    summary: "O que realmente importa para comunicar valor, escolher canais e transformar visibilidade em decisões informadas.",
    urgency: "O profissional produz conteúdo e testa ferramentas, mas não sabe quais ações contribuem de fato para novos atendimentos.",
    promise: "usar marketing como organização da comunicação e da jornada, não como exposição vazia",
    mistakes: ["confundir marketing com postagem diária", "prometer resultados clínicos", "falar de forma genérica para todos", "trocar de estratégia antes de reunir dados"],
    actions: ["formular um posicionamento específico", "escolher canais conforme intenção e capacidade", "construir ativos próprios como site e lista", "revisar a jornada depois de cada campanha"],
    metrics: ["origem dos contatos", "qualidade das conversas", "taxa de avanço até o agendamento", "custo por paciente quando houver mídia"],
  },
  {
    title: "Como captar pacientes particulares sem transformar a clínica em um comércio",
    slug: "como-captar-pacientes-particulares",
    category: "Captação",
    keyword: "como captar pacientes particulares",
    secondary: ["como atrair pacientes para terapia", "aumentar pacientes na clínica"],
    meta: "Aprenda como captar pacientes particulares com comunicação ética, diferenciação, presença digital e um processo de agendamento sem pressão comercial.",
    summary: "Uma abordagem responsável para aumentar a procura particular sem reduzir a decisão do paciente a uma venda agressiva.",
    urgency: "A comunicação não demonstra por que o atendimento particular pode fazer sentido, então a conversa fica restrita ao preço.",
    promise: "explicar valor e adequação com clareza, preservando a autonomia de quem busca atendimento",
    mistakes: ["esconder informações básicas até o WhatsApp", "usar urgência artificial", "tentar convencer pessoas sem aderência", "tratar toda objeção como resistência a ser vencida"],
    actions: ["descrever abordagem, público e formato de atendimento", "antecipar dúvidas frequentes no site", "qualificar o contato com perguntas respeitosas", "criar acompanhamento administrativo sem insistência"],
    metrics: ["proporção de contatos alinhados", "agendamentos por origem", "objeções recorrentes", "retenção administrativa inicial"],
  },
  {
    title: "Como parar de depender de indicações para manter a agenda do consultório",
    slug: "como-parar-de-depender-de-indicacoes",
    category: "Previsibilidade",
    keyword: "como parar de depender de indicações",
    secondary: ["como conseguir pacientes sem indicação", "previsibilidade de pacientes"],
    meta: "Descubra como parar de depender de indicações ao criar canais próprios, demanda recorrente e uma jornada que transforma interesse em agendamento.",
    summary: "Indicações continuam valiosas, mas deixam de ser o único motor quando a clínica constrói canais que podem ser acompanhados e melhorados.",
    urgency: "A agenda oscila porque o profissional não controla quando será lembrado ou recomendado por terceiros.",
    promise: "diversificar a entrada de pacientes sem abandonar a reputação construída por indicações",
    mistakes: ["desvalorizar as indicações existentes", "apostar tudo em um novo canal", "esperar resultado imediato de SEO", "não registrar a origem dos contatos"],
    actions: ["mapear como as indicações atuais acontecem", "fortalecer presença no Google", "publicar conteúdo pesquisável", "testar mídia paga apenas com uma base de conversão pronta"],
    metrics: ["participação de cada canal", "novos contatos por mês", "conversão por origem", "concentração de demanda"],
  },
  {
    title: "Site para psicólogos: o que uma página precisa ter para gerar confiança",
    slug: "site-para-psicologos",
    category: "Presença digital",
    keyword: "site para psicólogos",
    secondary: ["site profissional para psicólogo", "criação de site para psicólogos"],
    meta: "Saiba o que um site para psicólogos precisa ter para transmitir confiança, esclarecer o atendimento, aparecer no Google e facilitar o agendamento.",
    summary: "Estrutura, conteúdo e experiência para que o site ajude o paciente a compreender o atendimento antes de entrar em contato.",
    urgency: "O site existe, mas funciona como cartão de visitas genérico e não reduz as dúvidas que impedem o próximo passo.",
    promise: "transformar a página em um ponto de consideração e ação dentro da jornada do paciente",
    mistakes: ["abrir com frases abstratas", "esconder o público atendido", "usar blocos longos sem hierarquia", "deixar o contato difícil no celular"],
    actions: ["criar uma proposta clara na primeira dobra", "explicar para quem é o atendimento", "apresentar abordagem e processo", "usar chamadas para ação simples e visíveis"],
    metrics: ["cliques no contato", "profundidade de leitura", "páginas de entrada", "conversão por dispositivo"],
  },
  {
    title: "Google Ads para psicólogos: quando anunciar e como evitar desperdício",
    slug: "google-ads-para-psicologos",
    category: "Tráfego pago",
    keyword: "Google Ads para psicólogos",
    secondary: ["tráfego pago para psicólogos", "anúncios para psicólogos"],
    meta: "Veja como estruturar Google Ads para psicólogos, escolher buscas relevantes, preparar a página e medir agendamentos sem desperdiçar investimento.",
    summary: "Um guia para conectar intenção de busca, anúncio, página e atendimento em vez de avaliar a campanha apenas por cliques.",
    urgency: "A campanha pode gerar cliques e contatos, mas a verba se perde quando a mensagem, a página ou o atendimento não sustentam a decisão.",
    promise: "avaliar mídia paga como parte da jornada completa e não como uma fonte automática de pacientes",
    mistakes: ["usar palavras-chave amplas sem controle", "enviar todo tráfego para a página inicial", "não configurar conversões", "julgar a campanha antes de revisar os termos de busca"],
    actions: ["separar campanhas por intenção", "criar páginas coerentes com cada busca", "usar negativas para reduzir desperdício", "medir contato qualificado e agendamento"],
    metrics: ["termos de busca relevantes", "custo por contato qualificado", "taxa de conversão da página", "agendamentos atribuídos"],
  },
  {
    title: "Instagram para psicólogos: como gerar confiança sem postar todos os dias",
    slug: "instagram-para-psicologos",
    category: "Conteúdo",
    keyword: "Instagram para psicólogos",
    secondary: ["conteúdo para psicólogos", "como conseguir pacientes pelo Instagram"],
    meta: "Organize o Instagram para psicólogos com posicionamento, conteúdo útil e um caminho claro até o contato, sem depender de postagem diária.",
    summary: "O perfil pode apoiar confiança e consideração mesmo sem transformar o profissional em influenciador ou refém do algoritmo.",
    urgency: "O profissional publica muito, mas o perfil não explica rapidamente quem atende, como trabalha e qual é o próximo passo.",
    promise: "fazer do Instagram uma etapa coerente da jornada, com menos volume e mais intenção",
    mistakes: ["medir sucesso apenas por curtidas", "produzir temas sem relação com o posicionamento", "deixar a bio genérica", "usar chamadas apelativas"],
    actions: ["organizar bio e destaques", "definir pilares de conteúdo", "criar posts que respondam dúvidas reais", "conectar o perfil a uma página ou contato claro"],
    metrics: ["visitas qualificadas ao perfil", "cliques no link", "conversas iniciadas", "temas que geram dúvidas relevantes"],
  },
  {
    title: "Google Meu Negócio para psicólogos: guia para aparecer nas buscas locais",
    slug: "google-meu-negocio-para-psicologos",
    category: "SEO local",
    keyword: "Google Meu Negócio para psicólogos",
    secondary: ["SEO local para psicólogos", "aparecer no Google como psicólogo"],
    meta: "Aprenda a organizar o Google Meu Negócio para psicólogos, melhorar a presença local, transmitir confiança e transformar buscas em contatos.",
    summary: "Como fortalecer o perfil da clínica no Google com informações consistentes, reputação e uma experiência útil para quem pesquisa.",
    urgency: "Pessoas próximas procuram atendimento, mas encontram um perfil incompleto, inconsistente ou sem sinais suficientes de confiança.",
    promise: "tornar a presença local mais clara e útil sem recorrer a atalhos ou avaliações artificiais",
    mistakes: ["criar categorias pouco precisas", "manter horários desatualizados", "duplicar perfis", "comprar avaliações ou incentivar relatos clínicos"],
    actions: ["completar dados essenciais", "alinhar nome, endereço e contato", "publicar fotos profissionais do espaço quando aplicável", "responder avaliações com cuidado e sem revelar vínculo clínico"],
    metrics: ["visualizações em buscas locais", "ações no perfil", "ligações e cliques", "consistência das informações"],
  },
  {
    title: "Funil de vendas para psicólogos: da descoberta ao primeiro agendamento",
    slug: "funil-de-vendas-para-psicologos",
    category: "Jornada",
    keyword: "funil de vendas para psicólogos",
    secondary: ["jornada do paciente na psicologia", "processo de captação de pacientes"],
    meta: "Entenda o funil de vendas para psicólogos e organize alcance, confiança, contato e agendamento com ética em toda a jornada do paciente.",
    summary: "Uma tradução responsável do funil para serviços de psicologia, com foco em informação, autonomia e redução de atritos.",
    urgency: "Cada canal funciona isoladamente e ninguém consegue identificar em qual etapa as oportunidades estão sendo perdidas.",
    promise: "usar o funil como mapa de diagnóstico, sem tratar pacientes como números ou pressionar decisões",
    mistakes: ["copiar funis de produtos digitais", "confundir acompanhamento com insistência", "olhar apenas o topo", "ignorar comparecimento e experiência"],
    actions: ["mapear Alcance, Atração, Consideração, Ação e Apologia", "definir sinais observáveis por etapa", "encontrar o gargalo principal", "priorizar melhorias com impacto e esforço"],
    metrics: ["alcance qualificado", "avanço entre etapas", "agendamentos", "comparecimento e reputação"],
  },
  {
    title: "SEO para psicólogos: como ser encontrado no Google com conteúdo útil",
    slug: "seo-para-psicologos",
    category: "SEO",
    keyword: "SEO para psicólogos",
    secondary: ["blog para psicólogos", "otimização de site para psicólogos"],
    meta: "Aprenda SEO para psicólogos: pesquisa de palavras-chave, estrutura do site, conteúdo útil, autoridade e métricas para crescer no Google.",
    summary: "Um plano sustentável para responder buscas reais, fortalecer autoridade temática e atrair pessoas alinhadas ao atendimento.",
    urgency: "O site publica textos, mas não possui arquitetura, intenção de busca nem consistência suficiente para construir visibilidade orgânica.",
    promise: "criar um ativo de aquisição de longo prazo baseado em utilidade, contexto e confiança",
    mistakes: ["escrever apenas sobre temas amplos", "repetir palavras-chave artificialmente", "publicar sem links internos", "esperar resultado imediato"],
    actions: ["mapear intenções de busca", "organizar páginas de serviço e clusters", "produzir conteúdo aprofundado", "acompanhar indexação e consultas"],
    metrics: ["páginas indexadas", "consultas relevantes", "cliques orgânicos", "contatos originados no Google"],
  },
];

const esc = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const words = (value) => value.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
const listHtml = (items) => `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
const listMd = (items) => items.map((item) => `- ${item}`).join("\n");

function buildSections(post) {
  const [a1, a2, a3, a4] = post.actions;
  const [m1, m2, m3, m4] = post.metrics;
  return [
    {h: `O que está por trás da busca por ${post.keyword}`, p: [
      `${post.urgency} Esse é o problema invisível por trás de muitas tentativas frustradas: existe atividade, mas não existe continuidade entre os pontos de contato.`,
      `Quando uma pessoa procura atendimento, ela raramente decide a partir de um único conteúdo. Ela pode descobrir o profissional no Google, conferir o Instagram, visitar o site, comparar alternativas e só então iniciar uma conversa. Se cada ponto apresenta uma mensagem diferente, a confiança precisa ser reconstruída a cada etapa.`,
      `Por isso, ${post.keyword} não deve ser tratado como uma técnica isolada. A pergunta mais útil é como ${post.promise}. Essa mudança de perspectiva ajuda a enxergar o caminho inteiro, identificar o gargalo e evitar que mais esforço apenas amplifique uma falha já existente.`]},
    {h: `Como ${post.keyword} funciona na jornada do paciente`, p: [
      `A Gestão de Jornada organiza a decisão em cinco etapas: Alcance, Atração, Consideração, Ação e Apologia. Alcance significa aparecer para pessoas com possível aderência. Atração é comunicar relevância. Consideração é oferecer contexto para uma comparação informada. Ação reduz atritos no contato e no agendamento. Apologia observa experiência, reputação e indicação.`,
      `O tema deste artigo atravessa mais de uma etapa. ${a1[0].toUpperCase() + a1.slice(1)} melhora a base; ${a2} conecta canais; ${a3} reduz incertezas; e ${a4} permite aprender com o que acontece. A sequência importa porque o gargalo pode estar antes ou depois do canal que recebe mais atenção.`,
      `Esse modelo não transforma cuidado em uma linha de produção. Ele cria critérios para observar a comunicação e a experiência administrativa sem interferir na autonomia, na avaliação profissional ou no processo clínico.`]},
    {h: "Diagnóstico: descubra o gargalo antes de executar", p: [
      `Comece registrando como os contatos chegam, o que perguntam e em qual ponto deixam de avançar. Não é necessário montar uma infraestrutura complexa. Uma planilha consistente já pode revelar padrões que a memória não mostra.`,
      `Depois, percorra a jornada como se fosse alguém que ainda não conhece o trabalho. A proposta fica clara em poucos segundos? É possível entender público, formato e localização? O caminho até o contato funciona no celular? A resposta inicial acolhe e orienta? Cada resposta negativa é uma hipótese, não uma sentença.`,
      `Priorize hipóteses usando impacto, confiança e esforço. Uma bio confusa ou um botão quebrado pode merecer atenção antes de uma campanha nova. A disciplina está em corrigir primeiro o ponto com melhor relação entre benefício provável e trabalho necessário.`], bullets: ["Liste os canais atuais e o papel de cada um.", "Registre as principais dúvidas recebidas.", "Identifique onde há silêncio, abandono ou retrabalho.", "Escolha uma melhoria por vez e defina como observá-la."]},
    {h: "Plano prático de implementação em quatro frentes", p: [
      `A primeira frente é clareza. ${a1[0].toUpperCase() + a1.slice(1)} exige uma mensagem que ajude o leitor a reconhecer adequação sem promessas clínicas. Especifique temas, formato, abordagem e limites de maneira compreensível.`,
      `A segunda frente é consistência. ${a2[0].toUpperCase() + a2.slice(1)} evita que o paciente encontre versões contraditórias do mesmo trabalho. Nome, descrição, especialidade, local e chamadas para ação devem conversar entre si.`,
      `A terceira frente é redução de atrito. ${a3[0].toUpperCase() + a3.slice(1)} significa responder dúvidas relevantes antes que elas virem barreiras. Isso inclui carregamento rápido, linguagem legível, navegação simples e uma transição respeitosa para o atendimento administrativo.`,
      `A quarta frente é aprendizagem. ${a4[0].toUpperCase() + a4.slice(1)} transforma experiência em melhoria. Acompanhe os dados por períodos suficientes e registre mudanças. Sem histórico, toda oscilação parece exigir uma nova estratégia.`]},
    {h: "Erros que parecem produtividade, mas atrasam o resultado", p: [
      `O primeiro erro é aumentar volume antes de definir direção. Mais publicações, mais anúncios ou mais ferramentas não corrigem uma proposta difícil de compreender. O segundo é alterar várias partes ao mesmo tempo; quando tudo muda, não é possível saber o que contribuiu para o resultado.`,
      `Também é comum comparar métricas sem contexto. Alcance, seguidores e cliques podem indicar distribuição, mas não provam qualidade do contato nem agendamento. O dado precisa responder a uma pergunta de negócio e ser lido ao lado de sinais qualitativos.`,
      `No caso de ${post.keyword}, evite especialmente: ${post.mistakes.join("; ")}. Esses atalhos criam movimento, mas reduzem a capacidade de diagnóstico.`], bullets: post.mistakes},
    {h: "Métricas que ajudam a tomar decisões", p: [
      `Métrica útil é aquela que muda uma decisão. Para este tema, acompanhe ${m1}, ${m2}, ${m3} e ${m4}. Os números devem ser observados por origem e período, sempre que possível, para evitar conclusões baseadas em casos isolados.`,
      `Combine indicadores de quantidade e qualidade. Muitos contatos com baixa aderência podem indicar problema de mensagem ou segmentação. Poucos contatos muito alinhados podem sugerir uma base promissora com alcance insuficiente. Conversas numerosas sem agendamento apontam para uma investigação diferente.`,
      `Não existe uma taxa universal que determine sucesso para toda clínica. Especialidade, cidade, formato, preço, capacidade e maturidade dos canais alteram o contexto. O objetivo é construir uma linha de base própria e melhorar de forma responsável.`]},
    {h: "Comunicação ética durante todo o processo", p: [
      `Marketing de serviços psicológicos precisa preservar dignidade, privacidade e autonomia. Evite promessa de cura, garantia de resultado, diagnóstico em conteúdo e exploração sensacionalista de sofrimento. A comunicação pode ser específica sem pressionar.`,
      `Clareza significa explicar como o atendimento funciona, para quem pode fazer sentido e qual é o próximo passo administrativo. Não significa antecipar conclusão clínica. Também exige cuidado com depoimentos, avaliações e respostas públicas para não revelar ou sugerir vínculo terapêutico.`,
      `Quando houver dúvida sobre regras profissionais, consulte orientações oficiais e busque revisão adequada. Estratégia não substitui responsabilidade técnica.`]},
    {h: "Um roteiro de 30, 60 e 90 dias", p: [
      `Nos primeiros 30 dias, faça o diagnóstico. Organize canais, mensagem, dados básicos e principais atritos. Corrija problemas objetivos, como links, informações inconsistentes, páginas lentas ou ausência de resposta administrativa definida.`,
      `Entre 31 e 60 dias, implemente uma frente de aquisição e uma de conversão. A combinação evita gerar demanda para uma jornada despreparada. Documente hipóteses, datas e indicadores antes de iniciar.`,
      `Entre 61 e 90 dias, compare o período com a linha de base. Mantenha o que demonstrou coerência, ajuste o que produziu sinais parciais e encerre testes sem aderência. Transforme aprendizados em um backlog priorizado, em vez de começar novamente do zero.`], bullets: [a1, a2, a3, a4]},
    {h: "Perguntas para revisar cada etapa da jornada", p: [
      `No Alcance, pergunte se a mensagem chega a pessoas com possível aderência e se os canais escolhidos combinam com a intenção de busca. Na Atração, verifique se o conteúdo explica relevância sem usar medo ou promessa.`,
      `Na Consideração, observe se site, perfil e informações públicas ajudam a compreender diferenças, abordagem e formato. Na Ação, teste o contato no celular, o tempo de resposta e a clareza das orientações administrativas.`,
      `Na Apologia, revise experiência, consistência de comunicação e reputação com extremo cuidado ético. O objetivo não é solicitar exposição de pacientes, mas garantir que processos administrativos sejam respeitosos e confiáveis.`,
      `Ao responder essas perguntas, registre evidências. “Acho que o Instagram não funciona” é uma impressão. “O perfil recebeu visitas, mas o link teve poucos cliques durante oito semanas” é uma observação que pode orientar uma hipótese.`]},
    {h: "Como transformar o plano em rotina", p: [
      `Uma estratégia só melhora quando vira rotina observável. Reserve um momento semanal para revisar contatos, dúvidas recebidas, canais de origem e pequenos atritos percebidos no atendimento administrativo. Essa revisão não precisa ser longa; precisa ser consistente.`,
      `Separe o que é manutenção do que é experimento. Manutenção inclui atualizar horários, responder mensagens, conferir links, revisar informações públicas e garantir que o site continue claro. Experimento é uma mudança com hipótese, prazo e métrica definida, como testar uma nova página, reorganizar uma campanha ou publicar uma sequência de conteúdos sobre uma dúvida recorrente.`,
      `Também vale proteger a agenda de execução. Sem um bloco definido para melhoria da jornada, tudo vira urgência do dia e o marketing volta a depender de improviso. O método ajuda justamente a reduzir essa sensação de apagar incêndios, colocando cada ação dentro de uma sequência compreensível.`,
      `Para ${post.keyword}, a rotina ideal combina leitura de dados, escuta das dúvidas reais e revisão ética da comunicação. Assim, crescimento deixa de ser uma aposta em uma grande virada e passa a ser a soma de ajustes bem escolhidos.`]},
    {h: "Quando buscar ajuda especializada", p: [
      `Ajuda externa pode fazer sentido quando há muitos canais, dados contraditórios, investimento sem aprendizado ou falta de tempo para executar prioridades. O papel de uma consultoria não é impor mais tarefas, mas melhorar o diagnóstico e a sequência das decisões.`,
      `Na Gestão de Jornada, o ponto de partida é mapear o caminho completo e localizar gargalos. A partir daí, atividades de mídia, conteúdo, página, SEO, posicionamento ou processo comercial entram conforme a prioridade, e não como uma lista fixa de entregas.`,
      `Esse cuidado é especialmente importante em ${post.keyword}, porque uma ação isolada pode parecer correta e ainda falhar por causa do contexto ao redor.`]},
  ];
}

function buildFaq(post) {
  return [
    [`${post.keyword} funciona para quem está começando?`, "Sim, desde que o plano respeite capacidade, posicionamento e maturidade dos canais. Começar com uma base simples e mensurável costuma ser mais útil do que tentar executar tudo."],
    ["Quanto tempo leva para perceber resultado?", "O prazo varia conforme canal, demanda, região, oferta e ponto de partida. SEO tende a exigir mais tempo; correções de contato podem produzir sinais antes. Evite garantias universais."],
    ["É preciso investir em anúncios?", "Não necessariamente. Mídia paga é uma opção de alcance, não a estratégia inteira. Ela deve entrar quando mensagem, página, medição e atendimento conseguem sustentar o tráfego."],
    ["Como manter a comunicação ética?", "Explique serviço, processo e adequação com clareza, sem prometer cura, diagnosticar em conteúdo, explorar sofrimento ou pressionar a decisão."],
    ["Qual métrica deve ser acompanhada primeiro?", `Comece pela métrica mais próxima do gargalo observado. Neste tema, vale acompanhar ${post.metrics.join(", ")}.`],
    ["O que a Gestão de Jornada acrescenta?", "Ela conecta aquisição, mensagem, consideração, contato e experiência, ajudando a priorizar o ponto que limita o resultado em vez de otimizar apenas um canal."],
  ];
}

function illustration(post, index) {
  const labels = ["ALCANCE", "ATRAÇÃO", "CONSIDERAÇÃO", "AÇÃO", "APOLOGIA"];
  const cards = labels.map((label, i) => `<g transform="translate(${90 + i * 210} ${255 + (i % 2) * 52})"><rect width="174" height="112" rx="22" fill="#0B1220" stroke="#FFAE5F" stroke-opacity="${0.22 + i * 0.08}"/><text x="87" y="48" text-anchor="middle" fill="#FFAE5F" font-family="Arial" font-size="13" font-weight="700">0${i + 1}</text><text x="87" y="76" text-anchor="middle" fill="#E7F0FF" font-family="Arial" font-size="12" font-weight="700">${label}</text></g>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="788" viewBox="0 0 1400 788" role="img" aria-labelledby="title desc"><title id="title">${esc(post.title)}</title><desc id="desc">Ilustração abstrata da jornada do paciente em cinco etapas.</desc><defs><radialGradient id="g"><stop stop-color="#FF8600" stop-opacity=".32"/><stop offset="1" stop-color="#030712" stop-opacity="0"/></radialGradient><pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M72 0H0V72" fill="none" stroke="#94A3B8" stroke-opacity=".08"/></pattern></defs><rect width="1400" height="788" fill="#030712"/><rect width="1400" height="788" fill="url(#grid)"/><circle cx="${250 + index * 83}" cy="180" r="360" fill="url(#g)"/><text x="90" y="118" fill="#FFAE5F" font-family="Arial" font-size="18" font-weight="700" letter-spacing="3">AGÊNCIA DOCO · ${esc(post.category.toUpperCase())}</text><text x="90" y="174" fill="#F8FBFF" font-family="Arial" font-size="34" font-weight="700">${esc(post.keyword)}</text><path d="M177 423 C390 510 690 374 1085 476" fill="none" stroke="#FFAE5F" stroke-opacity=".4" stroke-width="3" stroke-dasharray="10 12"/>${cards}<text x="90" y="706" fill="#8EA3BF" font-family="Arial" font-size="18">Clareza, método e uma jornada organizada.</text></svg>`;
}

function articleHtml(post, index) {
  const sections = buildSections(post);
  const faq = buildFaq(post);
  const sectionHtml = sections.map((section) => `<h2>${esc(section.h)}</h2>${section.p.map((p) => `<p>${esc(p)}</p>`).join("")}${section.bullets ? listHtml(section.bullets) : ""}`).join("");
  const faqHtml = `<h2>Perguntas frequentes sobre ${esc(post.keyword)}</h2>${faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}`;
  const content = `<p><strong>${esc(post.keyword)}</strong> é uma busca comum entre profissionais que querem crescer sem abandonar o cuidado ético. O desafio é que ações isoladas raramente resolvem a agenda quando a jornada do paciente permanece fragmentada.</p><p>${esc(post.summary)} Neste guia, você encontrará um diagnóstico, um plano de implementação, erros a evitar, métricas e perguntas para adaptar a estratégia à realidade da clínica.</p><div class="article-callout">${esc(post.urgency)} A prioridade é encontrar o gargalo antes de aumentar o volume.</div>${sectionHtml}<h2>Conclusão: organize a jornada antes de fazer mais</h2><p>${esc(post.keyword)} se torna uma estratégia mais consistente quando cada canal tem uma função e os resultados são acompanhados além das métricas de vaidade. O caminho não exige executar tudo de uma vez. Exige clareza para escolher o próximo passo.</p><p>A Gestão de Jornada ajuda a mapear Alcance, Atração, Consideração, Ação e Apologia, criando um backlog de melhorias priorizado por impacto, confiança e esforço.</p>${faqHtml}`;
  const estimatedMinutes = Math.max(10, Math.ceil(words(content) / 210));
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(post.title)} | Agência doco</title><meta name="description" content="${esc(post.meta)}"><meta name="theme-color" content="#030712"><link rel="canonical" href="https://agenciadoco.com.br/blog/${post.slug}.html"><link rel="icon" href="../assets/favicon.png" type="image/png"><link rel="stylesheet" href="../styles.css"><script src="../app.js" defer></script><script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"Article",headline:post.title,description:post.meta,datePublished:today,dateModified:today,author:{"@type":"Organization",name:"Agência doco"},publisher:{"@type":"Organization",name:"Agência doco"},mainEntityOfPage:`https://agenciadoco.com.br/blog/${post.slug}.html`})}</script></head>
<body><a class="skip-link" href="#conteudo">Ir para o conteúdo</a><header class="site-header"><div class="container nav-shell"><a class="brand" href="../index.html" aria-label="Agência doco, página inicial"><img src="../assets/logo-doco-branca.png" alt="Agência doco" width="473" height="130"></a><nav class="nav-links" data-menu data-open="false" aria-label="Navegação principal"><a href="../index.html">Home</a><a href="../sobre.html">Sobre nós</a><a href="../produtos.html">Produtos</a><a href="../blog.html" aria-current="page">Blog</a></nav><a class="nav-cta" href="https://cal.com/manuela-calhau-tyivji/consultoria-gratuita">Analisar minha jornada</a><button class="menu-button" type="button" aria-label="Abrir menu" aria-expanded="false" data-menu-button><span></span></button></div></header>
<main id="conteudo"><header class="container page-hero reveal"><span class="eyebrow">${esc(post.category)}</span><h1>${esc(post.title)}</h1><p class="article-meta">Agência doco · 19 de junho de 2026 · ${estimatedMinutes} minutos</p></header><figure class="container article-cover reveal"><img src="../assets/blog/${post.slug}/imagem-principal.svg" alt="Ilustração da jornada aplicada a ${esc(post.keyword)}" width="1400" height="788"><figcaption>Ilustração original: Agência doco</figcaption></figure><div class="container article-layout"><article class="article-body reveal">${content}</article><aside class="article-aside glass reveal"><span class="eyebrow">Diagnóstico gratuito</span><h3>Descubra onde sua jornada perde oportunidades.</h3><p>Responda ao quiz e identifique qual etapa merece atenção primeiro.</p><a class="button small" href="https://quiz.agenciadoco.com.br/">Diagnosticar meu funil ↗</a></aside></div></main>
<footer class="site-footer"><div class="container footer-grid"><div class="footer-brand"><img src="../assets/logo-doco-branca.png" alt="Agência doco" width="473" height="130"><p>Ajudamos psicólogos a crescer organizando e otimizando toda a jornada de decisão dos seus pacientes.</p></div><div class="footer-column"><strong>Navegue</strong><a href="../sobre.html">Sobre nós</a><a href="../produtos.html">Produtos</a><a href="../blog.html">Blog</a></div><div class="footer-column"><strong>Experiências</strong><a href="https://gestaodejornada.agenciadoco.com.br/">Gestão de Jornada</a><a href="https://quiz.agenciadoco.com.br/">Diagnóstico de funil</a></div></div><div class="container footer-bottom"><span>© <span data-year></span> Agência doco.</span><span>Clareza, método e comunicação responsável.</span></div></footer></body></html>`;
}

function articleMarkdown(post) {
  const sections = buildSections(post);
  const faq = buildFaq(post);
  const body = sections.map((section) => `## ${section.h}\n\n${section.p.join("\n\n")}${section.bullets ? `\n\n${listMd(section.bullets)}` : ""}`).join("\n\n");
  const faqMd = faq.map(([q, a]) => `### ${q}\n\n${a}`).join("\n\n");
  return `---\ntitle: "${post.title}"\ndescription: "${post.meta}"\nslug: "${post.slug}"\nkeyword: "${post.keyword}"\nsecondary_keywords: ["${post.secondary.join('", "')}"]\ncategory: "${post.category}"\nstatus: publicado\ncreated: ${today}\nupdated: ${today}\nimage: "/assets/blog/${post.slug}/imagem-principal.svg"\nalt_text: "Ilustração da jornada aplicada a ${post.keyword}"\n---\n\n# ${post.title}\n\n**${post.keyword}** é uma busca comum entre profissionais que querem crescer sem abandonar o cuidado ético. O desafio é que ações isoladas raramente resolvem a agenda quando a jornada do paciente permanece fragmentada.\n\n${post.summary} Neste guia, você encontrará um diagnóstico, um plano de implementação, erros a evitar, métricas e perguntas para adaptar a estratégia à realidade da clínica.\n\n> ${post.urgency} A prioridade é encontrar o gargalo antes de aumentar o volume.\n\n${body}\n\n## Conclusão: organize a jornada antes de fazer mais\n\n${post.keyword} se torna uma estratégia mais consistente quando cada canal tem uma função e os resultados são acompanhados além das métricas de vaidade. O caminho não exige executar tudo de uma vez. Exige clareza para escolher o próximo passo.\n\nA Gestão de Jornada ajuda a mapear Alcance, Atração, Consideração, Ação e Apologia, criando um backlog de melhorias priorizado por impacto, confiança e esforço.\n\n## FAQ\n\n${faqMd}\n\n## Links Internos\n\n- [Gestão de Jornada](https://gestaodejornada.agenciadoco.com.br/)\n- [Diagnóstico de funil](https://quiz.agenciadoco.com.br/)\n- [Produtos da Agência doco](https://agenciadoco.com.br/produtos.html)\n- [Blog da Agência doco](https://agenciadoco.com.br/blog.html)\n- [Sobre a Agência doco](https://agenciadoco.com.br/sobre.html)\n\n## Checklist SEO\n\n- [x] Palavra-chave no H1, introdução, H2 e conclusão\n- [x] Meta title e meta description\n- [x] Slug amigável\n- [x] FAQ e CTA\n- [x] Estrutura EEAT e exemplos práticos\n- [x] Schema Article\n- [x] Texto alternativo da imagem\n\n## Observações de Publicação\n\nIlustração original da Agência doco. Artigo integrado ao site institucional em ${today}.\n`;
}

fs.mkdirSync(obsidianDir, {recursive: true});
for (const [index, post] of posts.entries()) {
  const assetDir = path.join(siteRoot, "assets", "blog", post.slug);
  fs.mkdirSync(assetDir, {recursive: true});
  fs.writeFileSync(path.join(assetDir, "imagem-principal.svg"), illustration(post, index));
  fs.writeFileSync(path.join(siteRoot, "blog", `${post.slug}.html`), articleHtml(post, index));
  fs.writeFileSync(path.join(obsidianDir, `${post.title}.md`), articleMarkdown(post));
}

const cards = posts.map((post) => `<article class="blog-card glass reveal"><time datetime="${today}">${esc(post.category)} · leitura aprofundada</time><a class="arrow-link" href="blog/${post.slug}.html" aria-label="Ler ${esc(post.title)}">↗</a><img class="blog-card-image" src="assets/blog/${post.slug}/imagem-principal.svg" alt="Ilustração sobre ${esc(post.keyword)}" width="1400" height="788" loading="lazy"><h3>${esc(post.title)}</h3><p>${esc(post.summary)}</p></article>`).join("\n      ");
const indexPath = path.join(siteRoot, "blog.html");
const indexHtml = fs.readFileSync(indexPath, "utf8").replace(/<!-- GENERATED_BLOG_POSTS_START -->[\s\S]*?<!-- GENERATED_BLOG_POSTS_END -->/, `<!-- GENERATED_BLOG_POSTS_START -->\n      ${cards}\n      <!-- GENERATED_BLOG_POSTS_END -->`);
fs.writeFileSync(indexPath, indexHtml);

const sitemapUrls = ["", "sobre.html", "produtos.html", "blog.html", "blog/jornada-do-paciente.html", "blog/trafego-nao-resolve.html", "blog/marketing-etico.html", ...posts.map((post) => `blog/${post.slug}.html`)];
fs.writeFileSync(path.join(siteRoot, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls.map((url) => `\n  <url><loc>https://agenciadoco.com.br/${url}</loc><lastmod>${today}</lastmod></url>`).join("")}\n</urlset>\n`);

const report = posts.map((post) => ({slug: post.slug, htmlWords: words(articleHtml(post, 0)), markdownWords: words(articleMarkdown(post))}));
console.log(JSON.stringify(report, null, 2));
