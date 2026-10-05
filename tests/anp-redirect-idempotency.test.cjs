const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const root = path.resolve(__dirname, '..');

class Storage {
  constructor(entries = {}) { this.values = new Map(Object.entries(entries)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function pageScript(relativePath) {
  const html = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/i);
  assert.ok(match, `script não encontrado em ${relativePath}`);
  return match[1];
}

async function execute({ file, lead, routerStatus = 200, metaStatus = 200, mauticStatus = 200, localStorage }) {
  const sessionStorage = new Storage({ doco_anp_lead: JSON.stringify(lead) });
  const calls = [];
  const dataLayer = [];
  const location = {
    href: `https://agenciadoco.com.br/${file.replace('/index.html', '/')}`,
    search: '',
    replace(url) { this.replacedWith = String(url); }
  };
  const document = { head: { appendChild() {} }, createElement() { return {}; } };
  const fetch = async (url, options = {}) => {
    const target = String(url);
    let body = options.body || null;
    if (typeof body === 'string' && String(options.headers?.['Content-Type'] || '').includes('json')) {
      body = JSON.parse(body);
    }
    calls.push({ url: target, body });
    const status = target.includes('/api/meta-capi')
      ? metaStatus
      : target.includes('/api/mautic-webinar-attended') ? mauticStatus : routerStatus;
    return { ok: status >= 200 && status < 300, status, type: 'basic' };
  };
  const context = {
    URL, URLSearchParams, TextEncoder, crypto: webcrypto, fetch, document, location,
    localStorage, sessionStorage, navigator: { userAgent: 'ANP automated QA' },
    setTimeout, clearTimeout, console
  };
  context.window = context;
  context.window.dataLayer = dataLayer;
  context.window.setTimeout = (fn) => setTimeout(fn, 5);
  vm.runInNewContext(pageScript(file), context, { filename: file });
  await new Promise(resolve => setTimeout(resolve, 30));
  return { calls, dataLayer, location };
}

async function verifyPage({ file, eventName, eventId, routerKey, metaKey, mauticKey, oldKey, leadKey }) {
  const lead = {
    name: 'Rubens QA', email: 'rubens.qa.20261002@example.com', phone: '5511999990002',
    stored_at: Date.now(), [leadKey]: eventId
  };
  const localStorage = new Storage({ doco_anp_lead: JSON.stringify(lead) });

  const first = await execute({ file, lead, routerStatus: 200, metaStatus: 500, localStorage });
  const event = first.dataLayer.find(item => item && item.event === eventName);
  assert.equal(event.event_id, eventId, `${eventName}: dataLayer deve usar o ID persistido`);
  assert.equal(first.calls.filter(call => call.url.includes('/api/anp-events')).length, 1);
  assert.equal(first.calls.filter(call => call.url.includes('/api/meta-capi')).length, 1);
  if (mauticKey) {
    assert.equal(first.calls.filter(call => call.url.includes('/api/mautic-webinar-attended')).length, 1);
    assert.equal(localStorage.getItem(mauticKey), eventId);
  }
  assert.equal(localStorage.getItem(routerKey), eventId);
  assert.equal(localStorage.getItem(metaKey), null);

  const second = await execute({ file, lead, routerStatus: 200, metaStatus: 200, localStorage });
  assert.equal(second.calls.filter(call => call.url.includes('/api/anp-events')).length, 0,
    `${eventName}: roteador não pode repetir após sucesso`);
  assert.equal(second.calls.filter(call => call.url.includes('/api/meta-capi')).length, 1,
    `${eventName}: Meta deve repetir após falha isolada`);
  if (mauticKey) {
    assert.equal(second.calls.filter(call => call.url.includes('/api/mautic-webinar-attended')).length, 0,
      `${eventName}: Mautic não pode repetir após sucesso`);
  }
  assert.equal(localStorage.getItem(metaKey), eventId);

  const legacyStorage = new Storage({ doco_anp_lead: JSON.stringify(lead), [oldKey]: eventId });
  const legacy = await execute({ file, lead, routerStatus: 200, metaStatus: 200, localStorage: legacyStorage });
  assert.equal(legacy.calls.filter(call => call.url.includes('/api/anp-events')).length, 0,
    `${eventName}: flag antiga deve impedir replay do roteador`);
  assert.equal(legacy.calls.filter(call => call.url.includes('/api/meta-capi')).length, 1,
    `${eventName}: flag antiga não deve ocultar possível falha da Meta`);

  if (mauticKey) {
    const retryStorage = new Storage({ doco_anp_lead: JSON.stringify(lead) });
    const failed = await execute({ file, lead, routerStatus: 200, metaStatus: 200, mauticStatus: 500, localStorage: retryStorage });
    assert.equal(failed.calls.filter(call => call.url.includes('/api/mautic-webinar-attended')).length, 1);
    assert.equal(retryStorage.getItem(mauticKey), null,
      `${eventName}: falha do Mautic não pode ser marcada como sucesso`);
    const retried = await execute({ file, lead, routerStatus: 200, metaStatus: 200, mauticStatus: 200, localStorage: retryStorage });
    assert.equal(retried.calls.filter(call => call.url.includes('/api/mautic-webinar-attended')).length, 1,
      `${eventName}: Mautic deve repetir após falha isolada`);
    assert.equal(retryStorage.getItem(mauticKey), eventId);
  }
}

(async () => {
  await verifyPage({
    file: 'webinario/a-nova-psicologia/grupo/index.html',
    eventName: 'EntrouNoGrupo', eventId: 'anp-group-stable-id',
    routerKey: 'doco_anp_group_router_sent', metaKey: 'doco_anp_group_meta_sent',
    oldKey: 'doco_anp_group_sent', leadKey: 'group_event_id'
  });
  await verifyPage({
    file: 'webinario/a-nova-psicologia/aula/index.html',
    eventName: 'ParticipouWebinario', eventId: 'anp-meet-stable-id',
    routerKey: 'doco_anp_meet_router_sent', metaKey: 'doco_anp_meet_meta_sent',
    mauticKey: 'doco_anp_meet_mautic_sent',
    oldKey: 'doco_anp_meet_sent', leadKey: 'meet_event_id'
  });
  console.log('ANP redirect tracking: idempotência por destino validada.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
