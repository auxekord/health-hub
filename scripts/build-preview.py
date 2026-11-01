#!/usr/bin/env python3
"""Build the reviewed hybrid Phase 2 app with fictional data and no import reader."""
from pathlib import Path
import re,json,hashlib,base64,zipfile,shutil,subprocess
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'dist/health-hub-demo';KEY='healthhub-demo-phase2-hybrid-v2'
paths=['index.html','manifest.webmanifest','sw.js','icon.svg','app/model.js','app/data-safety.js','app/privacy-ui.js','app/privacy.css','app/phase2.js','app/phase2.css','app/restaurants.js','app/demo.js','app/bootstrap.js','app/demo.css','_headers','robots.txt']
files={p:(ROOT/p).read_text() for p in paths if p not in ['app/demo.js','app/bootstrap.js','app/demo.css','_headers','robots.txt']}
for name in ['demo.js','bootstrap.js','demo.css']:files['app/'+name]=(ROOT/'preview'/name).read_text()
html=files['index.html'].replace('Powered by Open Food Facts. Search results require an internet connection.','Fictional local products only. No external food service is contacted.');html=html.replace('<script src="app/data-safety.js">','<script src="app/demo.js"></script><script src="app/data-safety.js">',1).replace('</body>','<script src="app/bootstrap.js"></script></body>').replace('</head>','<link rel="stylesheet" href="app/demo.css"></head>').replace('<title>Health Hub — The Daily Pulse</title>','<title>Health Hub — Demo Preview</title>')
a=html.index('async function searchLive(){');b=html.index('\nfunction renderLiveLog()',a)
html=html[:a]+'''async function searchLive(){const q=$('liveQuery').value.trim().toLowerCase();liveProducts=window.HealthHubDemo.products.filter(p=>!q||p.product_name.toLowerCase().includes(q)).map(productData);$('liveStatus').textContent='Fictional local demo products only. External search disabled.';renderLiveResults();}
'''+html[b:]
html=html.replace("const LIVE_ENDPOINT='https://world.openfoodfacts.org/cgi/search.pl';","const LIVE_ENDPOINT=null;").replace("source:'Open Food Facts'","source:'Fictional demo estimate; not official nutrition'")
# There is no file reader in any generated import path, including legacy callbacks.
a=html.index("$('import').addEventListener('change'");b=html.index('\nconst LIVE_ENDPOINT',a)
html=html[:a]+"$('import').addEventListener('change',e=>{e.target.value='';window.HealthHubPrivacy.importFile()});\n"+html[b:]
html=html.replace('health-hub-16-backup.json','health-hub-demo-fictional-backup.json')
files['index.html']=html
privacy=files['app/privacy-ui.js'];a=privacy.index('  async function importFile(');b=privacy.index('  $("privacy-profile-form")',a)
privacy=privacy[:a]+'''  async function importFile(){message('Personal backup imports are disabled in this fictional demo.');return false;}
'''+privacy[b:];privacy=privacy.replace("'health-hub-16-backup.json'","'health-hub-demo-fictional-backup.json'").replace('"health-hub-16-backup.json"','"health-hub-demo-fictional-backup.json"')
# Keep imports disabled across every subsequent render, not only startup.
privacy=privacy.replace('$("import").disabled =','$("import").disabled = true ||')
files['app/privacy-ui.js']=privacy
store=files['app/data-safety.js'];a=store.index('  const defaults =');b=store.index('  function jsonTree',a)
files['app/data-safety.js']=store[:a]+'  const defaults=()=>window.HealthHubDemo.initialState();\n'+store[b:]
for name in files:files[name]=files[name].replace('healthhub-v5',KEY)
manifest=json.loads(files['manifest.webmanifest']);manifest.update(name='Health Hub — Demo Preview',short_name='HH Demo',id='./demo-preview');files['manifest.webmanifest']=json.dumps(manifest,indent=2)+'\n'
worker=files['sw.js'].replace("'health-hub-'","'health-hub-demo-'").replace("'health-hub-phase2-hybrid-1'","'health-hub-demo-hybrid-2'")
a=worker.index('const SHELL =');b=worker.index(';',a)
shell=['./']+['./'+p for p in paths if p not in ['sw.js','_headers','robots.txt']]
files['sw.js']=worker[:a]+'const SHELL = '+json.dumps(shell)+worker[b:]
html=re.sub(r'<meta http-equiv="Content-Security-Policy" content="[^"]*">','',files['index.html'])
hashes=["'sha256-"+base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()+"'" for attrs,body in re.findall(r'<script([^>]*)>(.*?)</script>',html,re.S) if 'src=' not in attrs]
policy="default-src 'self'; script-src 'self' "+' '.join(hashes)+"; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'"
files['index.html']=html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+policy+'">',1)
files['_headers']='/*\n  Content-Security-Policy: '+policy+"; frame-ancestors 'none'"+'\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: no-store\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n'
files['robots.txt']='User-agent: *\nDisallow: /\n'
combined='\n'.join(files.values());old=subprocess.check_output(['git','show','3d7b2e5:index.html'],cwd=ROOT,text=True)
medical=re.findall(r'while using ([^<.]+)',old)
recipe=r'<script[^>]*id="recipes"[^>]*>(.*?)</script>'
checks={'production_namespace_absent':'healthhub-v5' not in combined,'unsafe_legacy_renderer_absent':'data-delete="${l.id}"' not in combined,'backup_file_reader_absent':not re.search(r'await\s+(?:f|file)\.text\(\)|FileReader|readAsText',combined),'known_medical_wording_absent':all(x.lower() not in combined.lower() for x in medical),'demographic_defaults_absent':not re.search(r'heightCm\s*:|weightLb\s*:|\bage\s*:',combined),'production_hostname_absent':'auxekord.github.io' not in combined,'external_food_endpoint_absent':'openfoodfacts.org' not in combined,'credential_patterns_absent':not re.search(r'gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bAKIA[A-Z0-9]{16}\b',combined),'recipe_json_unchanged':re.search(recipe,old,re.S)[1]==re.search(recipe,files['index.html'],re.S)[1],'recipe_count_139':len(json.loads(re.search(recipe,files['index.html'],re.S)[1]))==139}
if not all(checks.values()):raise RuntimeError('Build rejected: '+','.join(k for k,v in checks.items() if not v))
assert sorted(files)==sorted(paths)
if OUT.is_symlink() or (ROOT/'dist').is_symlink():raise RuntimeError('Unsafe output path')
if OUT.exists():shutil.rmtree(OUT)
for name,content in files.items():p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(content)
art=ROOT/'artifacts';art.mkdir(exist_ok=True);archive=art/'health-hub-phase2-demo.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for name in paths:
  item=zipfile.ZipInfo(name,date_time=(2020,1,1,0,0,0));item.compress_type=zipfile.ZIP_DEFLATED;item.external_attr=0o644<<16;z.writestr(item,files[name].encode())
report={'output_directory':str(OUT),'files':[{'path':n,'bytes':len(files[n].encode()),'sha256':hashlib.sha256(files[n].encode()).hexdigest()} for n in paths],'total_bytes':sum(len(v.encode()) for v in files.values()),'zip_bytes':archive.stat().st_size,'archive_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'checks':checks,'manual_review_required':True}
(art/'preview-verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['total_bytes','zip_bytes','archive_sha256','checks']},indent=2))
