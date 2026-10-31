#!/usr/bin/env python3
"""Refresh static inline-script hashes; outputs no application data."""
from pathlib import Path
import re,hashlib,base64
path=Path(__file__).resolve().parents[1]/'index.html'
source=path.read_text()
source=re.sub(r'<meta http-equiv="Content-Security-Policy" content="[^"]*">','',source)
hashes=["'sha256-"+base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()+"'" for attrs,body in re.findall(r'<script([^>]*)>(.*?)</script>',source,re.S) if 'src=' not in attrs]
policy="default-src 'self'; script-src 'self' "+' '.join(hashes)+"; style-src 'self' 'unsafe-inline'; connect-src 'self' https://world.openfoodfacts.org; img-src 'self' data:; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'"
source=source.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+policy+'">',1)
if '<meta name="referrer"' not in source:source=source.replace('<head>','<head><meta name="referrer" content="no-referrer">',1)
path.write_text(source)
print('Inline script policy refreshed.')
