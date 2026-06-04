const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  // CORS & COOP/COEP Headers required for ffmpeg.wasm
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  // Strip query strings/hashes
  const urlPath = req.url.split('?')[0].split('#')[0];
  let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
  
  const ext = path.extname(filePath);
  let contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n\x1b[32m🚀 Server dang chay tai: \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[33m🔒 Da cau hinh COOP & COEP Headers giup ffmpeg.wasm xuat MP4 muot ma.\x1b[0m`);
  console.log(`Nhan \x1b[31mCtrl + C\x1b[0m de tat server.\n`);
});
