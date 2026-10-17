from pathlib import Path
import json,re
base=Path(__file__).resolve().parents[1]/"webinario/a-nova-psicologia"
config=json.loads((base/"editions.json").read_text())
assert config["current"] in config["editions"]
assert config["legacyDefault"] in config["editions"]
for edition,event in config["editions"].items():
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2}",edition)
    assert event["groupUrl"].startswith("https://chat.whatsapp.com/")
    assert event["meetUrl"].startswith("https://meet.google.com/")
p=base/"editions.js"
s=p.read_text();start=s.index("const config=");end=s.index(";\nfunction resolve",start)
p.write_text(s[:start]+"const config="+json.dumps(config,ensure_ascii=False)+s[end:])
print("editions.js regenerated; deploy site and synchronize server configuration before opening new registration")
