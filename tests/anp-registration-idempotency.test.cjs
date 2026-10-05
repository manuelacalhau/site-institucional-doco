const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const html = fs.readFileSync(path.resolve(__dirname, '../webinario/a-nova-psicologia/index.html'), 'utf8');

(async () => {
  const server = http.createServer((request, response) => {
    if (request.url.startsWith('/webinario/a-nova-psicologia/grupo/')) {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end('<!doctype html><title>Grupo</title>');
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(html);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const calls = [];
  let retryMauticFailures = 1;

  await page.route('**/*', async route => {
    const request = route.request();
    const url = request.url();
    if (url.startsWith(origin)) {
      if (url.includes('/api/datacrazy-webinar')) {
        calls.push({ target: 'datacrazy', body: JSON.parse(request.postData()) });
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
      }
      if (url.includes('/api/mautic-webinar')) {
        const body = request.postData();
        calls.push({ target: 'mautic', body });
        if (body.includes('retry.qa%40example.com') && retryMauticFailures > 0) {
          retryMauticFailures -= 1;
          return route.fulfill({ status: 500, body: 'temporary failure' });
        }
        return route.fulfill({ status: 204, body: '' });
      }
      if (url.includes('/api/meta-capi')) {
        const body = JSON.parse(request.postData());
        calls.push({ target: `meta:${body.event_name}`, body });
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
      }
      return route.continue();
    }
    if (url.startsWith('https://script.google.com/')) {
      calls.push({ target: 'spreadsheet', body: request.postData() });
      return route.fulfill({ status: 200, body: '' });
    }
    return route.abort();
  });

  async function submit({
    name = 'Rubens QA',
    email = 'rubens.qa.20261002@example.com',
    phone = '+55 11 99999-0002',
    expectRedirect = true
  } = {}) {
    await page.goto(`${origin}/webinario/a-nova-psicologia/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#nome').fill(name);
    await page.locator('#email').fill(email);
    await page.locator('#whatsapp').fill(phone);
    await page.locator('#consentimento').check();
    await page.locator('#lead-form button[type="submit"]').click();
    if (expectRedirect) await page.waitForURL('**/grupo/', { timeout: 10_000 });
    else await page.locator('#lead-form [data-form-status]').filter({ hasText: 'Não foi possível' }).waitFor();
  }

  await submit();
  const firstCounts = Object.fromEntries(
    ['datacrazy', 'mautic', 'spreadsheet', 'meta:Lead'].map(target =>
      [target, calls.filter(call => call.target === target).length]
    )
  );
  assert.deepEqual(firstCounts, { datacrazy: 1, mautic: 1, spreadsheet: 1, 'meta:Lead': 1 });

  const stored = await page.evaluate(() => ({
    sent: localStorage.getItem('doco_anp_registration_sent'),
    lead: JSON.parse(localStorage.getItem('doco_anp_lead'))
  }));
  assert.equal(stored.sent, stored.lead.registration_event_id);
  assert.match(stored.sent, /^anp-lead-[a-f0-9]{48}$/);
  assert.match(stored.lead.group_event_id, /^anp-group-[a-f0-9]{48}$/);
  assert.match(stored.lead.meet_event_id, /^anp-meet-[a-f0-9]{48}$/);

  await submit();
  const secondCounts = Object.fromEntries(
    ['datacrazy', 'mautic', 'spreadsheet', 'meta:Lead'].map(target =>
      [target, calls.filter(call => call.target === target).length]
    )
  );
  assert.deepEqual(secondCounts, firstCounts,
    'Segundo envio confirmado não pode repetir integrações nem conversões');

  await submit({
    name: 'Retry QA', email: 'retry.qa@example.com', phone: '+55 11 98888-0002', expectRedirect: false
  });
  const afterFailure = Object.fromEntries(
    ['datacrazy', 'mautic', 'spreadsheet', 'meta:Lead'].map(target =>
      [target, calls.filter(call => call.target === target).length]
    )
  );
  assert.deepEqual(afterFailure, { datacrazy: 2, mautic: 2, spreadsheet: 1, 'meta:Lead': 1 },
    'Falha do Mautic não pode repetir DataCrazy nem antecipar conversões');

  await page.locator('#lead-form button[type="submit"]').click();
  await page.waitForURL('**/grupo/', { timeout: 10_000 });
  const afterRetry = Object.fromEntries(
    ['datacrazy', 'mautic', 'spreadsheet', 'meta:Lead'].map(target =>
      [target, calls.filter(call => call.target === target).length]
    )
  );
  assert.deepEqual(afterRetry, { datacrazy: 2, mautic: 3, spreadsheet: 2, 'meta:Lead': 2 },
    'Retry deve repetir apenas o destino que falhou e concluir os demais uma vez');

  console.log(JSON.stringify({ eventId: stored.sent, firstCounts, secondCounts, afterFailure, afterRetry }, null, 2));
  await browser.close();
  await new Promise(resolve => server.close(resolve));
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
