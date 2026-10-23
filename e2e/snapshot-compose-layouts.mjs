// Captura screenshots desktop/narrow das tabelas com layouts compose (media object / duas linhas).
// Serve o build local (dist) e faz proxy de /api para o backend (local :8088 ou Render).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Playwright pode estar instalado só no workspace praxis-ui-angular (mesma regra dos roteiros de vídeo).
const require = createRequire(
  fs.existsSync(path.join(ROOT, 'node_modules', 'playwright', 'package.json'))
    ? path.join(ROOT, 'package.json')
    : path.join(ROOT, '..', 'praxis-ui-angular', 'package.json'),
);
const { chromium } = require('playwright');
const DIST = path.join(ROOT, 'dist', 'praxis-hero-hq-ui', 'browser');
const OUT = process.env.PAX_SNAPSHOT_DIR || path.join(ROOT, 'test-results', 'compose-layouts');
const PORT = 4306;
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const configs = new Map();

function alive(url) {
  return new Promise((r) => {
    const req = http.get(url, (res) => { res.resume(); r(res.statusCode < 500); });
    req.on('error', () => r(false));
    req.setTimeout(2500, () => { req.destroy(); r(false); });
  });
}

const target = new URL((await alive('http://127.0.0.1:8088/schemas/catalog')) ? 'http://127.0.0.1:8088' : 'https://praxis-api-quickstart.onrender.com');
console.log('[snapshot] backend', target.origin);

const server = http.createServer((req, res) => {
  const p = (req.url || '/').split('?')[0];
  if (p.startsWith('/api/praxis/config/ui')) {
    // Config de UI em memória: garante que o metadata canônico das páginas seja usado.
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const key = req.url;
      if (req.method === 'GET') {
        if (!configs.has(key)) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'content-type': 'application/json' }); return res.end(configs.get(key));
      }
      configs.set(key, Buffer.concat(chunks).toString('utf8'));
      res.writeHead(200, { 'content-type': 'application/json' }); res.end('{}');
    });
    return;
  }
  if (p.startsWith('/api/') || p.startsWith('/schemas')) {
    const client = target.protocol === 'https:' ? https : http;
    // Remove Origin/Referer locais: o backend rejeita (403 CORS) origens fora da allowlist.
    const { origin, referer, ...headers } = req.headers;
    const up = client.request({ hostname: target.hostname, port: target.port || (target.protocol === 'https:' ? 443 : 80), path: req.url, method: req.method, headers: { ...headers, host: target.host } }, (r) => {
      res.writeHead(r.statusCode || 502, r.headers); r.pipe(res);
    });
    up.on('error', () => { res.writeHead(502); res.end(); });
    req.pipe(up);
    return;
  }
  let file = path.join(DIST, p);
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch();
const routes = [['funcionarios', '/rh/funcionarios'], ['missao-participantes', '/operacoes/missao-participantes']];
for (const [name, route] of routes) {
  for (const [label, width] of [['desktop', 1600], ['narrow', 760]]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
    page.on('response', (r) => { if (r.url().includes('/api/') && r.status() >= 400) console.log('[snapshot] HTTP', r.status(), r.request().method(), r.url()); });
    page.on('requestfailed', (r) => console.log('[snapshot] FAILED', r.url(), r.failure()?.errorText));
    await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.pfx-cell-compose', { timeout: 120000 }).catch(() => console.log(`[snapshot] no compose cell on ${route}`));
    await page.waitForTimeout(2500);
    if (process.env.PAX_DEBUG_COMPOSE === '1') {
      const info = await page.evaluate(() => {
        const el = document.querySelector('.pfx-cell-compose.dir-media');
        if (!el) return null;
        const cs = getComputedStyle(el);
        return {
          display: cs.display, rows: cs.gridTemplateRows, h: el.getBoundingClientRect().height,
          td: el.closest('td')?.getBoundingClientRect().height,
          kids: [...el.children].map((c) => ({ cls: c.className, h: c.getBoundingClientRect().height, row: getComputedStyle(c).gridRow })),
        };
      });
      console.log('[snapshot] debug', JSON.stringify(info));
    }
    const file = path.join(OUT, `compose-${name}-${label}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log('[snapshot]', file);
    await page.close();
  }
}
await browser.close();
server.close();
