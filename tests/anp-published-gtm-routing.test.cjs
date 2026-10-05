const assert = require('node:assert/strict');
const fs = require('node:fs');

const sourcePath = process.env.GTM_JS_PATH;
assert.ok(sourcePath, 'Defina GTM_JS_PATH com o arquivo gtm.js publicado');

const source = fs.readFileSync(sourcePath, 'utf8');
const marker = 'var data = ';
const start = source.indexOf(marker);
assert.notEqual(start, -1, 'Objeto data do GTM não encontrado');

const objectStart = source.indexOf('{', start + marker.length);
let depth = 0;
let inString = false;
let escaped = false;
let objectEnd = -1;

for (let i = objectStart; i < source.length; i += 1) {
  const char = source[i];
  if (inString) {
    if (escaped) escaped = false;
    else if (char === '\\') escaped = true;
    else if (char === '"') inString = false;
    continue;
  }
  if (char === '"') inString = true;
  else if (char === '{') depth += 1;
  else if (char === '}') {
    depth -= 1;
    if (depth === 0) {
      objectEnd = i + 1;
      break;
    }
  }
}

assert.notEqual(objectEnd, -1, 'Fim do objeto data do GTM não encontrado');
const data = JSON.parse(source.slice(objectStart, objectEnd));
const resource = data.resource;

assert.ok(resource.version, 'Versão publicada do GTM ausente');
assert.equal(resource.macros[11].vtp_name, 'event_id', 'Macro 11 deve ler event_id');
assert.equal(resource.macros[12].vtp_value, 'G-RG32CHXX2P', 'ID GA4 inesperado');
assert.equal(resource.macros[4].vtp_value, '815401080953791', 'Pixel Meta inesperado');

const pagePathPredicate = resource.predicates.findIndex(predicate =>
  predicate.function === '_cn' && predicate.arg1 === '/webinario/a-nova-psicologia/'
);
const pageViewPredicate = resource.predicates.findIndex(predicate =>
  predicate.function === '_eq' && predicate.arg1 === 'gtm.js'
);
const leadPredicate = resource.predicates.findIndex(predicate =>
  predicate.function === '_eq' && predicate.arg1 === 'generate_lead'
);
const formStartPredicate = resource.predicates.findIndex(predicate =>
  predicate.function === '_eq' && predicate.arg1 === 'form_start'
);

function ruleFor(...predicates) {
  return resource.rules.find(rule => {
    const condition = rule.find(item => item[0] === 'if');
    return condition && predicates.every(predicate => condition.slice(1).includes(predicate));
  });
}

function operation(rule, name) {
  const entry = rule.find(item => item[0] === name);
  return entry ? entry.slice(1) : [];
}

const webinarPageView = ruleFor(pagePathPredicate, pageViewPredicate);
assert.ok(webinarPageView, 'Regra específica de PageView do webinário ausente');
assert.ok(operation(webinarPageView, 'block').includes(3),
  'PageView Meta genérico deve ser bloqueado no webinário');
assert.equal(operation(webinarPageView, 'add').filter(index => index === 3).length, 0,
  'PageView Meta genérico não pode ser adicionado no webinário');

const webinarLead = ruleFor(pagePathPredicate, leadPredicate);
assert.ok(webinarLead, 'Regra específica de Lead do webinário ausente');
const leadTags = operation(webinarLead, 'add').map(index => resource.tags[index]);
const metaLeadTags = leadTags.filter(tag => tag.vtp_standardEventName === 'Lead');
assert.equal(metaLeadTags.length, 1, 'O webinário deve disparar exatamente uma tag Meta Lead');
assert.deepEqual(metaLeadTags[0].vtp_eventId, ['macro', 11],
  'Meta Lead deve compartilhar o event_id do dataLayer/CAPI');
assert.equal(leadTags.filter(tag => tag.vtp_eventName === 'generate_lead').length, 1,
  'O webinário deve disparar exatamente um evento GA4 generate_lead');

const webinarFormStart = ruleFor(pagePathPredicate, formStartPredicate);
assert.ok(webinarFormStart, 'Regra específica de FormStart do webinário ausente');
const formStartTags = operation(webinarFormStart, 'add').map(index => resource.tags[index]);
assert.equal(formStartTags.filter(tag => tag.function === '__cvt_5RM3Q').length, 0,
  'FormStart do GTM não pode criar um segundo disparo Meta');

console.log(`GTM publicado v${resource.version}: roteamento ANP sem duplicação validado.`);
