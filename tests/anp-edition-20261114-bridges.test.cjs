const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const base='webinario/a-nova-psicologia/';
const editions=fs.readFileSync(base+'editions.js','utf8');
const bridge=fs.readFileSync(base+'bridge.js','utf8');
async function run({kind='group',consent=false,edition='2026-11-14',known=true,fail=false}={}){
 const calls=[],storage=new Map();let destination,content='';
 const location={pathname:base.startsWith('/')?base:'/'+base+(kind==='group'?'grupo/':'aula/'),search:'?edition='+edition,href:'https://agenciadoco.com.br/'+base+(kind==='group'?'grupo/':'aula/')+'?edition='+edition,replace:u=>{destination=u;}};
 const context={URL,URLSearchParams,Date,TextEncoder,crypto:webcrypto,navigator:{userAgent:'QA offline'},location,history:{replaceState(){}},setTimeout,clearTimeout,document:{querySelector:s=>s==='main'?{set textContent(v){content=v;}}:{}},ANP:{currentLead:()=>known?{email:'qa@example.com',phone:'5511000000072',name:'QA'}:{},phone:v=>v||'',sourceURL:u=>u,consent:()=>consent,attribution:()=>({}),eventTime:()=>Math.floor(Date.now()/1000),deadline:p=>p,local:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},request:async(u,o)=>{calls.push({u,body:JSON.parse(o.body)});if(fail)throw Error('offline');return {ok:true};}}};
 context.window=context;vm.runInNewContext(editions,context);await vm.runInNewContext(bridge,context);return {calls,destination,content};
}
(async()=>{
 const denied=await run();assert.match(denied.destination,/chat.whatsapp.com\/KihvjiMSxU6Hgq4yK5KCtU$/);assert.equal(denied.calls.length,1);assert.equal(denied.calls[0].u,'/api/anp-events');assert.equal(denied.calls[0].body.consent,false);
 const granted=await run({consent:true});assert.equal(granted.calls.length,2);const meta=granted.calls.find(c=>c.u==='/api/meta-capi').body;assert.equal(meta.event_name,'EntrouNoGrupo');assert.equal(meta.custom_data.webinar_edition,'2026-11-14');assert.equal(meta.event_id,granted.calls[0].body.event_id);assert.equal(meta.user_data.em[0].length,64);assert.ok(!JSON.stringify(meta).includes('qa@example.com'));
 const meet=await run({kind:'meet',consent:true});assert.equal(meet.calls.length,0,'Meet redirect must never claim attendance');assert.equal(meet.destination,'https://meet.google.com/yir-bxfr-zvv');
 const anonymous=await run({known:false,consent:true});assert.equal(anonymous.calls.length,0);assert.ok(anonymous.destination);
 const outage=await run({consent:true,fail:true});assert.ok(outage.destination,'tracking failure must not block group navigation');
 const old=await run({edition:'2026-11-07',consent:true});assert.equal(old.calls.length,0);assert.equal(old.destination,undefined);assert.match(old.content,/não está disponível/);
 console.log('PASS: 14/11 group/Meet, consent, hashed identity, shared event ID, outage navigation and expired edition isolation');
})().catch(e=>{console.error(e);process.exitCode=1;});
