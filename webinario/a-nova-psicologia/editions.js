/* Generated from webinar-editions.json; no credentials. */
(function(root){
const config={"current": "2026-10-17", "funnel": "a-nova-psicologia", "editions": {"2026-10-17": {"status": "scheduled", "timezone": "America/Sao_Paulo", "startsAt": "2026-10-17T14:00:00-03:00", "endsAt": "2026-10-17T15:30:00-03:00", "groupUrl": "https://chat.whatsapp.com/IzQCvx4bueYE0gxiTt7Ok9", "meetUrl": "https://meet.google.com/yir-bxfr-zvv"}}, "legacyDefault": "2026-10-17"};
function resolve(search="",now=Date.now()){const q=new URLSearchParams(search);const campaign=q.get("utm_campaign")||"";const dated=campaign.match(/(?:^|_)anp_(\d{4}-\d{2}-\d{2})(?:_|$)/);const id=q.get("edition")||q.get("webinar_edition")||(dated&&dated[1])||config.legacyDefault;const event=config.editions[id];return event&&event.status==="scheduled"&&now<Date.parse(event.endsAt)?{...event,id,funnel:config.funnel}:null;}
root.ANPEditions={config,resolve};if(typeof module!=="undefined"&&module.exports)module.exports=root.ANPEditions;
})(typeof window!=="undefined"?window:globalThis);
