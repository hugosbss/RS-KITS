"use strict";
/* Mini servidor estático HTTP (stdlib) usado pelo Electron para servir o
   build estático do Next.js e a segunda tela. Sem dependências externas. */

const http = require("http");
const fs = require("fs");
const path = require("path");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

function safeJoin(root, rel) {
  const target = path.normalize(path.join(root, rel));
  return target.startsWith(root) ? target : null;
}

function startStaticServer(roots, port) {
  const rootsNorm = roots.map((r) => path.resolve(r));
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      if (urlPath === "/") urlPath = "/index.html";
      const candidates = [];
      for (const root of rootsNorm) {
        const abs = safeJoin(root, urlPath);
        if (abs) candidates.push(abs);
      }
      let found = null;
      for (const abs of candidates) {
        try {
          if (fs.statSync(abs).isFile()) { found = abs; break; }
          if (fs.statSync(abs).isDirectory()) {
            const idx = path.join(abs, "index.html");
            if (fs.statSync(idx).isFile()) { found = idx; break; }
          }
        } catch {
          /* tenta próximo root */
        }
      }
      if (!found) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 não encontrado");
        return;
      }
      const ext = path.extname(found).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
      });
      fs.createReadStream(found).pipe(res);
    });
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

module.exports = { startStaticServer, safeJoin };