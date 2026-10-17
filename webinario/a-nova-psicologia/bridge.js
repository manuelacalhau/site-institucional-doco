(async function () {
  'use strict';
  const config = ANPEditions.resolve(location.search || new URL(location.href).search);
  if (!config) { document.querySelector('main').textContent='Esta edição não está disponível. Consulte a equipe da doco para saber sobre os próximos encontros.'; return; }
  const edition = config.id;
  const kind = location.pathname.includes('/grupo/') ? 'group' : 'meet';
  const destination = kind === 'group' ? config.groupUrl : config.meetUrl;
  const link = document.querySelector('[data-edition-link]'); if(link) link.href=destination;
  let redirected = false;
  const redirect = () => { if (!redirected) { redirected = true; location.replace(destination); } };
  // A navegação nunca depende de cookies, hash ou medição.
  const timer = setTimeout(redirect, 4500);
  try {
    // A ponte do Meet não comprova presença e não deve atualizar CRM/Mautic como presença.
    if (kind === 'meet') return;
    const lead = ANP.currentLead(edition);
    const cleanURL = ANP.sourceURL(location.href);
    if (cleanURL !== location.href) history.replaceState(null, '', cleanURL);
    // Sem identidade atual verificável, encaminhe sem atribuir evento a outra turma.
    if (!lead.email && !ANP.phone(lead.phone)) return;
    const eventName = 'EntrouNoGrupo';
    const eventId = `anp-group-${edition}-${typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now()+'-'+Math.random().toString(36).slice(2)}`;
    if (!eventId) return;
    const contact = {name: String(lead.name || '').slice(0,200),email: String(lead.email || '').trim().toLowerCase(),phone:ANP.phone(lead.phone)};
    const attribution = ANP.attribution(location.search, lead.attribution);
    const semantics = kind === 'group' ? 'whatsapp_group_redirect' : 'google_meet_redirect';
    const key = suffix => `doco_anp_${kind}_${suffix}`;
    const already = suffix => ANP.local.getItem(key(suffix)) === eventId;
    const mark = suffix => ANP.local.setItem(key(suffix),eventId);
    const jobs = [];
    if (!already('router_accepted') && !already('router_sent') && !already('sent')) jobs.push(ANP.request('/api/anp-events',{
      method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,
      body:JSON.stringify({event_name:eventName,event_id:eventId,event_time:ANP.eventTime(eventId),webinar_edition:edition,source:'website',source_url:cleanURL,consent:ANP.consent(),event_semantics:semantics,contact,...attribution})
    },3500).then(response=>{if(!response.ok)throw new Error('router_error');mark('router_accepted');}).catch(()=>mark('router_pending')));
    if (ANP.consent() && !already('meta_sent')) jobs.push((async()=>{
      const hash = async value => Array.from(new Uint8Array(await ANP.deadline(crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)),2500,'hash_timeout')),b=>b.toString(16).padStart(2,'0')).join('');
      const user = {em:contact.email?[await hash(contact.email)]:undefined,ph:contact.phone?[await hash(contact.phone)]:undefined,external_id:[await hash('anp-person|'+(contact.email||contact.phone))],client_user_agent:navigator.userAgent};
      if (!ANP.consent()) return;
      const response = await ANP.request('/api/meta-capi',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({event_name:eventName,event_id:eventId,event_time:ANP.eventTime(eventId),action_source:'website',event_source_url:cleanURL,user_data:user,custom_data:{content_name:'A nova psicologia',funnel:'a-nova-psicologia',webinar_edition:edition,measurement_consent:true,funnel_stage:semantics}})},3500);
      if(!response.ok)throw new Error('meta_error');mark('meta_sent');
    })().catch(()=>mark('meta_pending')));
    await Promise.allSettled(jobs);
  } finally { clearTimeout(timer); redirect(); }
})();
