const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'webinario/a-nova-psicologia/index.html'), 'utf8');
const editions = require('../webinario/a-nova-psicologia/editions.js');
const now = Date.parse('2026-10-26T18:00:00-03:00');
const api = {
  ...editions,
  resolve: search => editions.resolve(search, now),
  resolveCurrent: () => editions.resolveCurrent(now)
};
assert.equal(api.resolve(''), null, 'historical unversioned bridges stay closed');
assert.equal(api.resolveCurrent().id, '2026-10-31');
assert.equal(api.resolve('?edition=2026-10-17'), null);
assert.equal(editions.resolveCurrent(Date.parse('2026-10-31T15:30:00-03:00')), null);
const head = html.slice(html.indexOf('    window.dataLayer ='), html.indexOf('\n  </script>', html.indexOf('    window.dataLayer =')));
const pageView = html.slice(html.indexOf('    const pageViewEventId = window.docoTracking.pageViewEventId;'), html.indexOf('\n    const sendMetaCapiLead ='));
function run({ granted = false, search = '' } = {}) {
  const scripts = [], calls = [], listeners = {};
  const values = new Map(granted ? [['doco_cookie_consent', 'granted']] : []);
  const context = {
    URLSearchParams, Date, crypto: {randomUUID: () => 'fixture'},
    ANPEditions: api,
    ANP: {consent: () => values.get('doco_cookie_consent') === 'granted',
      local: {getItem: key => values.get(key)}, fbc: () => undefined,
      attribution: () => values.get('doco_cookie_consent') === 'granted' ? {utm_source: 'fixture'} : {}},
    document: {createElement: () => ({dataset: {}}), head: {appendChild: el => scripts.push(el.src)}},
    window: {location: {search}, addEventListener: (event, handler) => {listeners[event] = handler;}},
    hasMeasurementConsent: () => values.get('doco_cookie_consent') === 'granted',
    webinarConfig: api.resolveCurrent(), trackingContext: {webinar_edition: '2026-10-31'}, attribution: {},
    sendMetaCapiEvent: async event => calls.push(event), reportCapiError: () => assert.fail('CAPI should succeed')
  };
  vm.runInNewContext(head, context);
  vm.runInNewContext(pageView, context);
  return {context, scripts, calls, grant() {
    values.set('doco_cookie_consent', 'granted');
    context.window.docoTracking.load();
    listeners['doco:measurement-consent']();
  }};
}
for (const search of ['', '?utm_campaign=anp_2026-10-17', '?edition=2026-10-17']) {
  const r = run({search});
  assert.equal(r.scripts.length, 0, 'consent denied: no Pixel or GTM');
  assert.equal(r.calls.length, 0, 'consent denied: no CAPI');
  r.grant(); r.grant();
  assert.equal(r.scripts.filter(s => s.includes('fbevents.js')).length, 1);
  assert.equal(r.scripts.filter(s => s.includes('gtm.js')).length, 1);
  assert.equal(r.calls.length, 1, 'one server PageView after accepting consent');
  const events = r.context.window.fbq.queue.filter(c => c[0] === 'track' && c[1] === 'PageView');
  assert.equal(events.length, 1);
  assert.equal(events[0][2].webinar_edition, '2026-10-31');
  assert.equal(events[0][3].eventID, r.calls[0].eventId, 'Pixel and CAPI share deduplication ID');
}
const editionsSource = fs.readFileSync(path.join(root, 'webinario/a-nova-psicologia/editions.js'), 'utf8');
for (const pathname of ['/webinario/a-nova-psicologia/', '/webinario/a-nova-psicologia/grupo/']) {
  const browser = {window: {location: {pathname}}, URLSearchParams, encodeURIComponent, Date};
  vm.runInNewContext(editionsSource, browser);
  const resolved = browser.window.ANPEditions.resolve('?utm_campaign=anp_2026-10-17', now);
  if (pathname.endsWith('/grupo/')) assert.equal(resolved, null, 'old bridges do not change edition');
  else assert.equal(resolved.id, '2026-10-31', 'published GTM resolver reads current landing edition');
}
const r = run({granted: true}); r.grant();
assert.equal(r.calls.length, 1, 'saved consent: PageView once');
assert.equal(r.scripts.length, 2);
console.log('PASS: current edition, legacy links, expiry, denied/saved/late consent, single Pixel/GTM load and Pixel/CAPI deduplication.');
