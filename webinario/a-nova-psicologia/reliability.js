(function(root) {
  'use strict';
  const memory = new Map();
  const storage = type => ({
    getItem(key) { const id=type+key; if(memory.has(id))return memory.get(id); try { return root[type].getItem(key); } catch (_) { return null; } },
    setItem(key, value) { const id=type+key; try { root[type].setItem(key,String(value)); memory.delete(id); } catch (_) { memory.set(id,String(value)); } },
    removeItem(key) { const id=type+key; try { root[type].removeItem(key); memory.delete(id); } catch (_) { memory.set(id,null); } }
  });
  const local = storage('localStorage'), session = storage('sessionStorage');
  const consent = () => local.getItem('doco_cookie_consent') === 'granted';
  function phone(value) {
    const raw = String(value || '').trim();
    if ((raw.startsWith('+') && !raw.startsWith('+55')) || (raw.startsWith('00') && !raw.startsWith('0055'))) return '';
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('0055')) digits = digits.slice(2);
    if ((raw.startsWith('+') || raw.startsWith('00')) && ![12,13].includes(digits.length)) return '';
    if (digits.length === 10 || digits.length === 11) digits = '55' + digits;
    return /^55[1-9]\d{9,10}$/.test(digits) ? digits : '';
  }
  const email = value => /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(String(value || '').trim());
  function currentLead(edition, now = Date.now()) {
    for (const store of [session, local]) {
      try {
        const lead = JSON.parse(store.getItem('doco_anp_lead') || '{}');
        if (lead.webinar_edition === edition && Number(lead.stored_at) <= now && Number(lead.stored_at) > now - 30 * 86400000 && (email(lead.email) || phone(lead.phone))) return lead;
      } catch (_) {}
    }
    return {};
  }
  const utmKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
  function attribution(search, saved = {}) {
    if (!consent()) return {};
    const params = new URLSearchParams(search);
    return Object.fromEntries(utmKeys.map(key => [key, String(params.get(key) || saved[key] || local.getItem('doco_last_' + key) || '').slice(0, 300)]).filter(([,v]) => v && !/[\r\n@]/.test(v)));
  }
  function sourceURL(value) {
    const url = new URL(value);
    const params = attribution(url.search);
    url.search = ''; url.hash = '';
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return url.href;
  }
  function fbc(click, cookie = '', now = Date.now()) {
    // O identificador é opaco: nunca normalizar caixa, truncar ou hashear.
    if (click && /^[A-Za-z0-9_-]+$/.test(click)) return `fb.1.${now}.${click}`;
    return /^fb\.\d+\.\d{13}\.[A-Za-z0-9_-]+$/.test(cookie) ? cookie : undefined;
  }
  async function request(url, options = {}, timeout = 8000) {
    const controller = new AbortController();
    let timer;
    try {
      return await Promise.race([
        root.fetch(url, {...options, signal: controller.signal}),
        new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('request_timeout')); }, timeout); })
      ]);
    } finally { clearTimeout(timer); }
  }
  async function deadline(promise, timeout = 8000, label = 'operation_timeout') {
    let timer;
    try { return await Promise.race([promise, new Promise((_, reject) => { timer=setTimeout(()=>reject(new Error(label)),timeout); })]); }
    finally { clearTimeout(timer); }
  }
  async function registration({crm, mautic, optional = [], redirect, optionalTimeout = 8000}) {
    const results = await Promise.allSettled([deadline(Promise.resolve().then(crm),10000), deadline(Promise.resolve().then(mautic),10000)]);
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') { const error = new Error(i ? 'mautic_error' : 'datacrazy_error'); error.cause = results[i].reason; throw error; }
    }
    // Medição e destinos secundários nunca decidem o sucesso comercial.
    await deadline(Promise.allSettled(optional.map(fn => Promise.resolve().then(fn))),optionalTimeout).catch(()=>{});
    redirect();
  }
  function reminderEligible({registeredAt, now, eventAt, days, sent = false, queueHeld = true}) {
    const registration = Date.parse(registeredAt), current = Date.parse(now), event = Date.parse(eventAt);
    const due = event - days * 86400000;
    // Não recuperar lembretes vencidos: janela explícita de 15 min, inclusive retries.
    return !queueHeld && !sent && Number.isFinite(registration) && registration <= due && current >= due && current < Math.min(due + 900000, event + (days === 0 ? 900000 : 0));
  }
  function eventTime(id, now = Date.now()) {
    const key='doco_anp_event_time_'+id;
    const stored=Number(local.getItem(key));
    if (Number.isInteger(stored) && stored>0) return stored;
    const value=Math.floor(now/1000); local.setItem(key,value); return value;
  }
  const api = {local, session, consent, phone, email, currentLead, attribution, sourceURL, fbc, request, deadline, registration, reminderEligible, eventTime};
  root.ANP = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
