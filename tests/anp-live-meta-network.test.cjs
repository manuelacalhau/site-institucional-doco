const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.ANP_URL ||
  'https://agenciadoco.com.br/webinario/a-nova-psicologia/?fbclid=codex_audit_20261005';

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
  const requests = [];

  page.on('request', request => {
    const url = request.url();
    if (url.includes('facebook') || url.includes('/api/meta-capi')) {
      requests.push({ url, method: request.method(), body: request.postData() });
    }
  });

  await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(4_000);

  const consent = await page.evaluate(() => localStorage.getItem('doco_cookie_consent'));
  assert.notEqual(consent, 'granted', 'Teste precisa executar sem consentimento salvo');

  const name = page.locator('form input[name="nome"]').first();
  await name.focus();
  await name.fill('Auditoria Codex');
  await name.press('Tab');
  await name.focus();
  await page.waitForTimeout(2_000);

  const capiPayloads = requests
    .filter(request => request.url.includes('/api/meta-capi'))
    .map(request => JSON.parse(request.body));
  const capiPageViews = capiPayloads.filter(payload => payload.event_name === 'PageView');
  assert.equal(capiPageViews.length, 1, 'CAPI deve receber exatamente um PageView');

  const pixelEvents = requests
    .filter(request => /facebook\.com\/tr\/?/.test(request.url))
    .map(request => {
      const params = new URL(request.url).searchParams;
      if (request.body) {
        for (const [key, value] of new URLSearchParams(request.body)) {
          if (!params.has(key)) params.set(key, value);
        }
      }
      return params;
    })
    .filter(params => params.get('id') === '815401080953791');
  const pixelPageViews = pixelEvents.filter(params => params.get('ev') === 'PageView');
  const pixelFormStarts = pixelEvents.filter(params => params.get('ev') === 'FormStart');

  if (pixelPageViews.length !== 1 || pixelFormStarts.length !== 1) {
    console.error(await page.evaluate(() => ({
      fbqType: typeof window.fbq,
      fbqLoaded: window.fbq?.loaded,
      fbqQueue: window.fbq?.queue,
      scripts: Array.from(document.scripts, script => script.src).filter(Boolean)
    })));
    console.error(JSON.stringify(requests.filter(request => request.url.includes('facebook')), null, 2));
  }

  assert.equal(pixelPageViews.length, 1, 'Pixel deve enviar exatamente um PageView');
  assert.equal(pixelFormStarts.length, 1, 'Pixel deve enviar exatamente um FormStart por página');
  assert.equal(pixelPageViews[0].get('eid'), capiPageViews[0].event_id,
    'Pixel e CAPI devem compartilhar o event_id do PageView');
  assert.match(capiPageViews[0].user_data.fbc, /^fb\.1\.\d+\.codex_audit_20261005$/,
    'fbclid deve ser convertido para _fbc no formato esperado');
  assert.equal(capiPageViews[0].user_data.fbp, undefined,
    '_fbp não deve ser enviado sem consentimento');

  console.log(JSON.stringify({
    pageViewEventId: capiPageViews[0].event_id,
    pageViewPixelCount: pixelPageViews.length,
    pageViewCapiCount: capiPageViews.length,
    formStartPixelCount: pixelFormStarts.length,
    fbc: capiPageViews[0].user_data.fbc,
    consent
  }, null, 2));

  await browser.close();
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
