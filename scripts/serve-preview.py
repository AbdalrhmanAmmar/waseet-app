"""Serve the exported SPA locally, including Expo Router deep links."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path('dist').resolve()), **kwargs)

    def do_GET(self):
        path = urlparse(self.path).path.lstrip('/')
        if not path or not (Path('dist') / path).is_file():
            self.path = '/index.html'
        super().do_GET()

ThreadingHTTPServer(('127.0.0.1', 4173), Handler).serve_forever()
