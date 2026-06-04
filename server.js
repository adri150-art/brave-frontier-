const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.json': 'application/json', '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  // Decode URL pour supporter les accents, espaces et apostrophes dans les noms de fichiers
  let rawUrl = req.url.split('?')[0];
  let decoded;
  try { decoded = decodeURIComponent(rawUrl); } catch(e) { decoded = rawUrl; }
  let filePath = path.join(ROOT, decoded === '/' ? 'index.html' : decoded);
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Serving on http://localhost:${PORT}`));
