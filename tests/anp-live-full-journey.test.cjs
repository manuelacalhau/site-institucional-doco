const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const base = process.env.ANP_BASE_URL || 'https://agenciadoco.com.br/webinario/a-nova-psicologia';
const qa = {
  name: process.env.ANP_QA_NAME,
  email: process.env.ANP_QA_EMAIL,
  phone: process.env.ANP_QA_PHONE
};
assert.ok(qa.name && qa.email && qa.phone,
  'Defina ANP_QA_NAME, ANP_QA_EMAIL e ANP_QA_PHONE com um contato sintético já existente');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
    executablePath: process.env.CHROMIUM_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const calls = [];
  page.on('response', async response => {
    const request = response.request();
    const url = request.url();
    if (!url.includes('/api/')) return;
    let body = request.postData();
    if (body && request.headers()['content-type']?.includes('json')) {
      try { body = JSON.parse(body); } catch {}
    }
    calls.push({ url, status: response.status(), body });
  });
  await page.route('https://chat.whatsapp.com/**', route => route.abort());
  await page.route('https://meet.google.com/**', route => route.abort());

  const counts = () => ({
    datacrazy: calls.filter(call => call.url.includes('/api/datacrazy-webinar')).length,
    mauticRegistration: calls.filter(call => call.url.endsWith('/api/mautic-webinar')).length,
    metaLead: calls.filter(call => call.url.includes('/api/meta-capi') && call.body?.event_name === 'Lead').length,
    groupRouter: calls.filter(call => call.url.includes('/api/anp-events') && call.body?.event_name === 'EntrouNoGrupo').length,
    groupMeta: calls.filter(call => call.url.includes('/api/meta-capi') && call.body?.event_name === 'EntrouNoGrupo').length,
    meetRouter: calls.filter(call => call.url.includes('/api/anp-events') && call.body?.event_name === 'ParticipouWebinario').length,
    meetMeta: calls.filter(call => call.url.includes('/api/meta-capi') && call.body?.event_name === 'ParticipouWebinario').length,
    meetMautic: calls.filter(call => call.url.includes('/api/mautic-webinar-attended')).length
  });

  async function submitRegistration() {
    await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.locator('#nome').fill(qa.name);
    await page.locator('#email').fill(qa.email);
    await page.locator('#whatsapp').fill(qa.phone);
    await page.locator('#consentimento').check();
    await page.locator('#lead-form button[type="submit"]').click();
    await page.waitForFunction(() => localStorage.getItem('doco_anp_registration_sent'), null, { timeout: 20_000 });
    await page.waitForTimeout(5_000);
  }

  await submitRegistration();
  const afterFirstRegistration = counts();
  assert.deepEqual(
    { datacrazy: afterFirstRegistration.datacrazy, mautic: afterFirstRegistration.mauticRegistration, meta: afterFirstRegistration.metaLead },
    { datacrazy: 1, mautic: 1, meta: 1 },
    'Primeiro cadastro deve chamar cada integração uma vez'
  );
  assert.equal(afterFirstRegistration.groupRouter, 1);
  assert.equal(afterFirstRegistration.groupMeta, 1);

  await submitRegistration();
  await page.waitForTimeout(5_000);
  assert.deepEqual(counts(), afterFirstRegistration,
    'Reenvio do mesmo cadastro e reabertura do grupo não podem repetir destinos');

  await page.goto(`${base}/aula/`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(5_000);
  const afterFirstMeet = counts();
  assert.equal(afterFirstMeet.meetRouter, 1);
  assert.equal(afterFirstMeet.meetMeta, 1);
  assert.equal(afterFirstMeet.meetMautic, 1);

  await page.goto(`${base}/aula/`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(5_000);
  assert.deepEqual(counts(), afterFirstMeet,
    'Reabertura da aula não pode repetir roteador, Meta ou Mautic');

  for (const call of calls) {
    assert.ok(call.status >= 200 && call.status < 400,
      `${call.url} respondeu com HTTP ${call.status}`);
  }

  console.log(JSON.stringify({ afterFirstRegistration, afterFirstMeet, final: counts() }, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
