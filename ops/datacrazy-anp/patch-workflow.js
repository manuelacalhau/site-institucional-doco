// Run inside the n8n service. Only the specified ANP workflow is read/written.
const fs=require('fs');const assert=require('assert');
const dir=process.argv[2]||'/home/node/.n8n/anp-tags-20261107';
const w=JSON.parse(fs.readFileSync(dir+'/before.json'))[0];
assert.equal(w.id,'62Ox0C99dlPAaQWY');
const tag='c3452032-405a-4464-b783-ddae26e8e7f3';
const get=id=>{const n=w.nodes.find(n=>n.id===id);assert(n,'Missing node '+id);return n;};
const norm=get('normalize-webinar-lead');
assert(norm.parameters.jsCode.includes('const edition=text(input.webinar_edition,10);'));
norm.parameters.jsCode=norm.parameters.jsCode.replace('const edition=text(input.webinar_edition,10);',"const edition=text(input.webinar_edition,10)||'2026-11-07';").replace('webinar_edition:edition||null,search:',"webinar_edition:edition,requiredTagIds:edition==='2026-11-07'?['"+tag+"']:[],search:");
const unwrapping=`const findLead=(value,id)=>{
 if(!value||typeof value!=='object')return null;
 if(String(value.id||'')===String(id))return value;
 if(Array.isArray(value)){for(const row of value){const found=findLead(row,id);if(found)return found;}}
 else for(const key of ['data','result','items','leads','results','content','rows']){const found=findLead(value[key],id);if(found)return found;}
 return null;
};
const tagIds=value=>{
 if(!value)return [];
 if(Array.isArray(value))return value.flatMap(tagIds);
 if(typeof value==='string')return /^[0-9a-f-]{36}$/i.test(value)?[value]:[];
 if(typeof value==='object')return tagIds(value.id||value.tagId||value.tag||value.data||[]);
 return [];
};\n`;
const mergeCode=unwrapping+`const base=$('Preparar criação ou atualização').first().json;
const lead=findLead($json,base.leadId);if(!lead)throw new Error('Não foi possível ler o cadastro existente completo');
const existingTagIds=[...new Set(tagIds(lead.tags))];
const mergedTagIds=[...new Set([...existingTagIds,...base.requiredTagIds])];
return [{json:{...base,currentNotes:String(lead.notes||''),existingTagIds,mergedTagIds}}];`;
const verifyCode=unwrapping+`const resolved=$('Lead resolvido').first().json;
const base=$('Preparar criação ou atualização').first().json;
const lead=findLead($json,resolved.leadId);if(!lead)throw new Error('DataCrazy não confirmou o cadastro gravado');
const actualTagIds=[...new Set(tagIds(lead.tags))];
const previous=base.leadExists?$('Mesclar dados e preservar tags').first().json.existingTagIds:[];
const expected=[...new Set([...resolved.requiredTagIds,...previous])];
if(expected.some(id=>!actualTagIds.includes(id)))throw new Error('DataCrazy não confirmou a tag da edição ou a preservação das tags anteriores');
return [{json:{...resolved,tag_ids_verified:actualTagIds,edition_tag_verified:resolved.requiredTagIds.length>0}}];`;
const cloneHttp=(id,name,url,position)=>{const n=JSON.parse(JSON.stringify(get('search-lead')));n.id=id;n.name=name;n.position=position;n.parameters.url=url;return n;};
const readFull=cloneHttp('read-existing-lead-full','Ler cadastro existente completo','=https://api.g1.datacrazy.io/api/v1/leads/{{ $json.leadId }}',[1000,-200]);
const merge={id:'merge-existing-tags',name:'Mesclar dados e preservar tags',type:'n8n-nodes-base.code',typeVersion:2,parameters:{jsCode:mergeCode},position:[1220,-200]};
const readWritten=cloneHttp('read-lead-after-upsert','Conferir lead gravado','=https://api.g1.datacrazy.io/api/v1/leads/{{ $json.leadId }}',[1650,0]);
const verify={id:'verify-edition-tag',name:'Confirmar tag da edição',type:'n8n-nodes-base.code',typeVersion:2,parameters:{jsCode:verifyCode},position:[1870,0]};
for(const n of [readFull,merge,readWritten,verify]){assert(!w.nodes.some(x=>x.id===n.id));w.nodes.push(n);}
get('update-lead').parameters.body="={{ JSON.stringify({name:$json.name,email:$json.email || undefined,phone:$json.phone || undefined,notes:($json.notes && !$json.currentNotes.includes($json.notes)) ? [$json.currentNotes,$json.notes].filter(Boolean).join('\\n') : $json.currentNotes,tags:$json.mergedTagIds.map(id=>({id}))}) }}";
get('create-lead').parameters.body="={{ JSON.stringify({name:$json.name,email:$json.email || undefined,phone:$json.phone || undefined,notes:$json.notes,tags:$json.requiredTagIds.length ? $json.requiredTagIds.map(id=>({id})) : undefined}) }}";
const link=name=>({node:name,type:'main',index:0});
w.connections['Lead já existe?'].main[0]=[link(readFull.name)];
w.connections[readFull.name]={main:[[link(merge.name)]]};w.connections[merge.name]={main:[[link('Atualizar lead existente')]]};
w.connections['Lead resolvido']={main:[[link(readWritten.name)]]};w.connections[readWritten.name]={main:[[link(verify.name)]]};w.connections[verify.name]={main:[[link('Buscar negócios do lead')]]};
for(const id of ['success-created','success-existing']){const n=get(id);n.parameters.jsCode=n.parameters.jsCode.replace('ok:true,',"ok:true,webinar_edition:$('Lead resolvido').first().json.webinar_edition,edition_tag_verified:$('Confirmar tag da edição').first().json.edition_tag_verified,tag_ids:$('Confirmar tag da edição').first().json.tag_ids_verified,");}
for(const n of w.nodes)if(n.parameters.jsCode)new Function('$json','$','$input',n.parameters.jsCode);
const execute=(code,json,fixtures={})=>new Function('$json','$','$input',code)(json,name=>({first:()=>({json:fixtures[name]})}),{all:()=>[{json}]})[0].json;
const input={name:'QA integração ANP',email:'qa-anp-20261107@example.com',phone:'5511000000071',webinar_edition:'2026-11-07',source_url:'https://agenciadoco.com.br/webinario/a-nova-psicologia/'};
const normalized=execute(norm.parameters.jsCode,{body:input});assert.deepEqual(normalized.requiredTagIds,[tag]);assert.equal(normalized.webinar_edition,'2026-11-07');assert.deepEqual(execute(norm.parameters.jsCode,{body:{...input,webinar_edition:undefined}}).requiredTagIds,[tag]);assert.deepEqual(execute(norm.parameters.jsCode,{body:{...input,webinar_edition:'2026-10-31'}}).requiredTagIds,[]);
const prior='c424ebb6-d7f3-4ad8-8a6f-9d67f222543b';const base={...normalized,leadExists:true,leadId:'qa-existing',currentNotes:'incomplete list notes'};
const merged=execute(mergeCode,{id:'qa-existing',notes:'Historical notes',tags:[{id:prior},{id:tag}]},{'Preparar criação ou atualização':base});assert.equal(merged.currentNotes,'Historical notes');assert.deepEqual(merged.mergedTagIds,[prior,tag]);
const body=(id,json)=>JSON.parse(new Function('$json','return ('+get(id).parameters.body.replace(/^=\{\{\s*/,'').replace(/\s*\}\}$/,'')+');')(json));
const patch=body('update-lead',merged);assert(patch.notes.startsWith('Historical notes\n'));assert.deepEqual(patch.tags,[{id:prior},{id:tag}]);assert.deepEqual(body('create-lead',normalized).tags,[{id:tag}]);
const resolved={...normalized,leadId:'qa-existing'};const fixtures={'Lead resolvido':resolved,'Preparar criação ou atualização':base,'Mesclar dados e preservar tags':merged};
assert.equal(execute(verifyCode,{id:'qa-existing',tags:[{id:prior},{id:tag}]},fixtures).edition_tag_verified,true);
assert.throws(()=>execute(verifyCode,{id:'qa-existing',tags:[{id:prior}]},fixtures),/não confirmou a tag/);assert.throws(()=>execute(verifyCode,{id:'qa-existing',tags:[{id:tag}]},fixtures),/não confirmou a tag/);
const phoneMatch=execute(get('prepare-upsert').parameters.jsCode,{data:[{id:'qa-existing',name:'QA',email:'old@example.com',phone:input.phone}]},{'Validar e normalizar inscrição':normalized,'Buscar lead no DataCrazy':{data:[]}});assert.equal(phoneMatch.leadId,'qa-existing');
assert.equal(w.nodes.length,20);assert.deepEqual(w.connections['Lead já existe?'].main[1],[link('Criar lead no DataCrazy')]);
fs.writeFileSync(dir+'/after.json',JSON.stringify([w]));
console.log('PASS current edition tagging, no-tag historical edition, create and existing/phone-match paths, complete notes and tag union, no duplicate tag, fail-closed persisted-tag verification. Workflow prepared with 20 nodes.');
