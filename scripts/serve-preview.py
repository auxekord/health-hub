#!/usr/bin/env python3
"""Local-only artifact validation server; approximates Cloudflare static headers."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import argparse
root=Path(__file__).resolve().parents[1]/'dist'/'health-hub-demo'
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(root),**kwargs)
 def end_headers(self):
  for line in (root/'_headers').read_text().splitlines():
   if line.startswith('  '):name,value=line.strip().split(':',1);self.send_header(name,value.strip())
  super().end_headers()
parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8001);args=parser.parse_args()
ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
