import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const MONOREPO_ROOT = path.resolve(PROJECT_ROOT, '..');

const require = createRequire(
  fs.existsSync(path.join(PROJECT_ROOT, 'node_modules', 'playwright', 'package.json'))
    ? path.join(PROJECT_ROOT, 'package.json')
    : path.join(MONOREPO_ROOT, 'praxis-ui-angular', 'package.json')
);
const { chromium } = require('playwright');

const BASE_URL = process.env.PAX_CRUD_DEMO_URL || 'http://127.0.0.1:4304';
const DIST_DIR = process.env.PAX_STUDIO_DIST_DIR || path.join(PROJECT_ROOT, 'dist', 'praxis-hero-hq-ui', 'browser');
const PROXY_TARGET = process.env.PAX_PROXY_TARGET || 'http://127.0.0.1:8088';
const PROXY_ORIGIN = process.env.PAX_PROXY_ORIGIN || 'http://localhost:4200';
const ARTIFACT_DIR = process.env.PAX_CRUD_ARTIFACT_DIR || path.join(PROJECT_ROOT, 'test-results', 'workspace-video-1');
const FFMPEG_PATH =
  process.env.FFMPEG_PATH ||
  path.join(
    process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
    'ms-playwright',
    'ffmpeg-1011',
    process.platform === 'win32' ? 'ffmpeg-win64.exe' : 'ffmpeg-linux'
  );
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

/**
 * Direct Single-Pass Full HD (1920x1080) @ 30 FPS Video Recorder
 * Clean screen recording — no informational HUD or callout cards!
 */
class HighFidelityVideoRecorder {
  constructor(page, outputFile, { width = 1920, height = 1080, fps = 30 } = {}) {
    this.page = page;
    this.outputFile = outputFile;
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.cdp = null;
    this.ffmpeg = null;
    this.isStopped = false;
    this.lastFrameBuffer = null;
    this.startWallSec = 0;
    this.totalFramesQueued = 0;
    this.writeChain = Promise.resolve();
    this.totalFramesWritten = 0;
    this.heartbeatTimer = null;
  }

  async start() {
    if (process.env.PAX_SKIP_VIDEO === '1') {
      this.isStopped = true;
      return;
    }
    const args = [
      '-loglevel', 'error',
      '-f', 'image2pipe',
      '-avioflags', 'direct',
      '-fpsprobesize', '0',
      '-probesize', '32',
      '-analyzeduration', '0',
      '-c:v', 'mjpeg',
      '-r', String(this.fps),
      '-i', 'pipe:0',
      '-y',
      '-an',
      '-r', String(this.fps),
      '-c:v', 'libvpx',
      '-pix_fmt', 'yuv420p',
      '-screen-content-mode', '1',
      '-sharpness', '7',
      '-qmin', '0',
      '-qmax', '6',
      '-crf', '4',
      '-b:v', '18M',
      '-minrate', '8M',
      '-maxrate', '24M',
      '-bufsize', '36M',
      '-max-intra-rate', '0',
      '-overshoot-pct', '100',
      '-deadline', 'realtime',
      '-cpu-used', '6',
      '-threads', '4',
      '-g', String(this.fps * 2),
      this.outputFile
    ];

    this.ffmpeg = spawn(FFMPEG_PATH, args, { stdio: ['pipe', 'ignore', 'pipe'] });
    this.ffmpeg.stderr.on('data', (chunk) => {
      console.error('[ffmpeg]', chunk.toString());
    });

    this.cdp = await this.page.context().newCDPSession(this.page);
    this.cdp.on('Page.screencastFrame', (payload) => {
      this.cdp.send('Page.screencastFrameAck', { sessionId: payload.sessionId }).catch(() => {});
      const buf = Buffer.from(payload.data, 'base64');
      this.onFrame(buf);
    });

    await this.cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 94,
      maxWidth: this.width,
      maxHeight: this.height,
      everyNthFrame: 1
    });

    this.startWallSec = performance.now() / 1000;

    this.heartbeatTimer = setInterval(() => {
      if (!this.isStopped && this.lastFrameBuffer) {
        this.onFrame(this.lastFrameBuffer);
      }
    }, Math.floor(1000 / this.fps));
  }

  onFrame(buffer) {
    if (this.isStopped || !this.ffmpeg) return;
    const nowSec = performance.now() / 1000;

    if (!this.lastFrameBuffer) {
      this.lastFrameBuffer = buffer;
      this.totalFramesQueued = 1;
      const firstFrame = buffer;
      this.writeChain = this.writeChain.then(async () => {
        if (this.ffmpeg?.stdin?.writable) {
          await new Promise((res) => this.ffmpeg.stdin.write(firstFrame, res));
          this.totalFramesWritten++;
        }
      });
      return;
    }

    const targetFrames = Math.max(1, Math.floor((nowSec - this.startWallSec) * this.fps));
    const repeatCount = Math.max(0, targetFrames - this.totalFramesQueued);
    this.lastFrameBuffer = buffer;

    if (repeatCount > 0) {
      this.totalFramesQueued += repeatCount;
      const frameToWrite = buffer;
      this.writeChain = this.writeChain.then(async () => {
        for (let i = 0; i < repeatCount; i++) {
          if (!this.ffmpeg?.stdin?.writable) break;
          await new Promise((res) => this.ffmpeg.stdin.write(frameToWrite, res));
          this.totalFramesWritten++;
        }
      });
    }
  }

  async captureSyncKeyframe() {
    if (this.isStopped || !this.lastFrameBuffer) return;
    this.onFrame(this.lastFrameBuffer);
  }

  async stop() {
    if (this.isStopped) return;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    await this.captureSyncKeyframe();
    this.isStopped = true;
    try {
      await this.cdp?.send('Page.stopScreencast');
    } catch {}
    await this.writeChain;
    await new Promise((resolve) => {
      if (!this.ffmpeg) return resolve();
      this.ffmpeg.once('close', resolve);
      this.ffmpeg.stdin.end();
    });
    console.log(`[recorder] Finalized ${this.outputFile} (${this.totalFramesWritten} frames @ ${this.fps} fps)`);
  }
}

function normalizeCapabilitiesPayload(node) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) {
    return node.map(normalizeCapabilitiesPayload);
  }
  const copy = { ...node };
  if (
    copy.availability &&
    typeof copy.availability === 'object' &&
    copy.availability.allowed === false
  ) {
    copy.availability = {
      ...copy.availability,
      allowed: true,
      reason: null,
    };
  }
  if (copy.create === false) copy.create = true;
  if (copy.update === false) copy.update = true;
  if (copy.edit === false) copy.edit = true;
  if (copy.delete === false) copy.delete = true;
  for (const key of Object.keys(copy)) {
    if (key !== 'availability' && copy[key] && typeof copy[key] === 'object') {
      copy[key] = normalizeCapabilitiesPayload(copy[key]);
    }
  }
  return copy;
}

function rewriteRenderHrefs(text) {
  return String(text || '')
    .replace(/https?:\/\/praxis-api-quickstart\.onrender\.com/gi, BASE_URL)
    .replace(/http:\/\/localhost:8088/gi, BASE_URL)
    .replace(/http:\/\/127\.0\.0\.1:8088/gi, BASE_URL);
}

function buildFastItemCapabilitiesSnapshot(resourcePath, id) {
  const numericId = Number.isNaN(Number(id)) ? id : Number(id);
  const basePath = `${resourcePath}/${numericId}`;
  const group = resourcePath.split('/')[2] || 'core';
  const resourceName = resourcePath.split('/')[3] || 'item';
  const resourceKey = `${group}.${resourceName}`;
  return {
    resourceKey,
    resourcePath,
    resourceId: numericId,
    group,
    canonicalOperations: {
      create: true,
      edit: true,
      delete: true,
      view: true,
      filter: true,
      all: true,
      byIds: true,
      export: true,
      statsGroupBy: true,
      statsTimeSeries: true,
      statsDistribution: true,
      options: true,
      optionSources: true,
    },
    operations: {
      view: {
        id: 'view',
        supported: true,
        scope: 'ITEM',
        preferredMethod: 'GET',
        preferredRel: 'self',
        availability: {
          allowed: true,
          reason: null,
          metadata: { scope: 'ITEM' },
        },
      },
      edit: {
        id: 'edit',
        supported: true,
        scope: 'ITEM',
        preferredMethod: 'PUT',
        preferredRel: 'update',
        availability: {
          allowed: true,
          reason: null,
          metadata: { scope: 'ITEM' },
        },
      },
      delete: {
        id: 'delete',
        supported: true,
        scope: 'ITEM',
        preferredMethod: 'DELETE',
        preferredRel: 'delete',
        availability: {
          allowed: true,
          reason: null,
          metadata: { scope: 'ITEM' },
        },
      },
    },
    surfaces: [
      {
        id: 'view',
        resourceKey,
        resourcePath,
        group,
        kind: 'VIEW',
        scope: 'ITEM',
        title: 'Ficha detalhada',
        description: 'Visualização em leitura do registro.',
        intent: 'read-only-projection',
        operationId: 'getById',
        method: 'GET',
        path: `${resourcePath}/{id}`,
        schemaId: null,
        schemaUrl: null,
        availability: { allowed: true, reason: null, metadata: { scope: 'ITEM' } },
        order: 20,
        tags: ['detail', 'profile'],
        _links: { self: { href: `${BASE_URL}${basePath}` } },
      },
      {
        id: 'edit',
        resourceKey,
        resourcePath,
        group,
        kind: 'FORM',
        scope: 'ITEM',
        title: 'Editar registro',
        description: 'Atualização contextual dos dados do registro.',
        intent: 'edit',
        operationId: 'update',
        method: 'PUT',
        path: `${resourcePath}/{id}`,
        schemaId: 'item-edit-schema',
        schemaUrl: `${BASE_URL}/schemas/filtered?path=${encodeURIComponent(resourcePath + '/{id}')}&operation=put&schemaType=request`,
        availability: { allowed: true, reason: null, metadata: { scope: 'ITEM' } },
        order: 30,
        tags: ['crud', 'item'],
        _links: {
          update: { href: `${BASE_URL}${basePath}` },
          schema: {
            href: `${BASE_URL}/schemas/filtered?path=${encodeURIComponent(resourcePath + '/{id}')}&operation=put&schemaType=request`,
          },
        },
      },
    ],
    actions: [],
    _links: {
      self: { href: `${BASE_URL}${basePath}/capabilities` },
      item: { href: `${BASE_URL}${basePath}` },
      collection: { href: `${BASE_URL}${resourcePath}/all` },
      surfaces: { href: `${BASE_URL}${basePath}/surfaces` },
      actions: { href: `${BASE_URL}${basePath}/actions` },
    },
  };
}

function buildFastItemActionsCatalog(resourcePath, id) {
  const numericId = Number.isNaN(Number(id)) ? id : Number(id);
  const basePath = `${resourcePath}/${numericId}`;
  const group = resourcePath.split('/')[2] || 'core';
  const resourceName = resourcePath.split('/')[3] || 'item';
  const resourceKey = `${group}.${resourceName}`;
  return {
    resourceKey,
    resourcePath,
    resourceId: numericId,
    group,
    actions: [],
    _links: {
      self: { href: `${BASE_URL}${basePath}/actions` },
      item: { href: `${BASE_URL}${basePath}` },
      capabilities: { href: `${BASE_URL}${basePath}/capabilities` },
    },
  };
}

function isGarbageTestFuncionario(rec) {
  const name = String(rec?.nomeCompleto || '').trim();
  return /^Certificacao Visual Angular/i.test(name) || /^Praxis E2E Delete/i.test(name);
}

function ensureDevServer() {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(PROXY_TARGET);
    const cachedGetJsonByUrl = new Map();
    const cachedPostByKey = new Map();
    const inMemoryUserConfigs = new Map();

    const server = http.createServer((req, res) => {
      const reqUrl = req.url || '/';
      const cleanReqPath = reqUrl.split('?')[0];
      const method = (req.method || 'GET').toUpperCase();

      // Intercept /api/praxis/config/ui in-memory so every recording run starts 100% clean (zero flash at 00:00!)
      if (cleanReqPath.startsWith('/api/praxis/config/ui')) {
        const bodyChunks = [];
        req.on('data', (chunk) => bodyChunks.push(chunk));
        req.on('end', () => {
          const reqBodyText = Buffer.concat(bodyChunks).toString('utf8');
          if (cleanReqPath === '/api/praxis/config/ui/__reset__') {
            inMemoryUserConfigs.clear();
            res.writeHead(204);
            res.end();
            return;
          }
          if (method === 'GET') {
            if (inMemoryUserConfigs.has(reqUrl)) {
              const saved = inMemoryUserConfigs.get(reqUrl);
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(saved);
            } else {
              res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ status: 'not_found' }));
            }
            return;
          }
          if (method === 'PUT' || method === 'POST') {
            inMemoryUserConfigs.set(reqUrl, reqBodyText || '{}');
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(reqBodyText || '{}');
            return;
          }
          if (method === 'DELETE') {
            inMemoryUserConfigs.delete(reqUrl);
            res.writeHead(204);
            res.end();
            return;
          }
        });
        return;
      }

      if (reqUrl.startsWith('/api') || reqUrl.startsWith('/schemas')) {
        const bodyChunks = [];
        req.on('data', (chunk) => bodyChunks.push(chunk));
        req.on('end', () => {
          const reqBodyBuf = Buffer.concat(bodyChunks);
          const reqBodyText = reqBodyBuf.toString('utf8');

          // Fast local response for item-level row discovery (capabilities & actions) across all 3 resources
          const itemCapMatch = cleanReqPath.match(
            /^(\/api\/(?:human-resources\/funcionarios|risk-intelligence\/ameacas|human-resources\/folhas-pagamento))\/([^/]+)\/(capabilities|actions)$/
          );
          if (method === 'GET' && itemCapMatch) {
            const [, resBase, itemId, subResource] = itemCapMatch;
            const bodyObj =
              subResource === 'capabilities'
                ? buildFastItemCapabilitiesSnapshot(resBase, itemId)
                : buildFastItemActionsCatalog(resBase, itemId);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(bodyObj));
            return;
          }

          // Fast local response from GET cache for schemas, capabilities, surfaces, actions, options
          if (method === 'GET' && cachedGetJsonByUrl.has(reqUrl)) {
            const cachedBuf = cachedGetJsonByUrl.get(reqUrl);
            res.writeHead(200, {
              'Content-Type': 'application/json; charset=utf-8',
              'Content-Length': String(cachedBuf.length),
            });
            res.end(cachedBuf);
            return;
          }

          const postCacheKey = `${reqUrl}|${reqBodyText}`;
          if (method === 'POST' && cachedPostByKey.has(postCacheKey)) {
            const cachedBuf = cachedPostByKey.get(postCacheKey);
            res.writeHead(200, {
              'Content-Type': 'application/json; charset=utf-8',
              'Content-Length': String(cachedBuf.length),
            });
            res.end(cachedBuf);
            return;
          }

          const headers = {
            ...req.headers,
            host: targetUrl.host,
            origin: PROXY_ORIGIN,
            Origin: PROXY_ORIGIN,
            'accept-encoding': 'identity',
          };
          if (reqBodyBuf.length > 0) {
            headers['content-length'] = String(reqBodyBuf.length);
          } else {
            delete headers['content-length'];
          }

          const proxyReq = (targetUrl.protocol === 'https:' ? https : http).request(
            {
              protocol: targetUrl.protocol,
              hostname: targetUrl.hostname,
              port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
              method: req.method,
              path: reqUrl,
              headers,
              rejectUnauthorized: false,
            },
            (proxyRes) => {
              const resChunks = [];
              proxyRes.on('data', (chunk) => resChunks.push(chunk));
              proxyRes.on('end', () => {
                const rawBuf = Buffer.concat(resChunks);
                const contentType = String(proxyRes.headers['content-type'] || '');
                const isJson =
                  contentType.includes('json') ||
                  cleanReqPath.includes('/capabilities') ||
                  cleanReqPath.includes('/actions') ||
                  cleanReqPath.includes('/surfaces') ||
                  reqUrl.startsWith('/schemas');

                if (isJson && rawBuf.length > 0) {
                  try {
                    const rewrittenText = rewriteRenderHrefs(rawBuf.toString('utf8'));
                    let json = JSON.parse(rewrittenText);
                    if (
                      cleanReqPath.includes('/capabilities') ||
                      cleanReqPath.includes('/actions') ||
                      cleanReqPath.includes('/surfaces')
                    ) {
                      json = normalizeCapabilitiesPayload(json);
                    } else if (cleanReqPath === '/api/human-resources/funcionarios/filter') {
                      const targetNode = json?.data && Array.isArray(json.data.content) ? json.data : json;
                      if (targetNode && Array.isArray(targetNode.content)) {
                        targetNode.content = targetNode.content
                          .filter((item) => !isGarbageTestFuncionario(item))
                          .map((rec) => {
                            const numericId = Number(rec.id);
                            const defaultAtivo = !Number.isNaN(numericId) ? numericId % 5 !== 0 : Boolean(rec.ativo);
                            return { ...rec, ativo: defaultAtivo };
                          });
                      }
                    } else if (cleanReqPath === '/api/risk-intelligence/ameacas/filter') {
                      const targetNode = json?.data && Array.isArray(json.data.content) ? json.data : json;
                      if (targetNode && Array.isArray(targetNode.content)) {
                        const demoLevels = [9, 8, 10, 7, 5, 4, 8, 6, 3, 9];
                        targetNode.content = targetNode.content.map((rec, idx) => ({
                          ...rec,
                          nivel: demoLevels[idx % demoLevels.length],
                        }));
                      }
                    }

                    const outBuf = Buffer.from(JSON.stringify(json), 'utf8');
                    if ((proxyRes.statusCode || 200) < 300 && method === 'GET') {
                      cachedGetJsonByUrl.set(reqUrl, outBuf);
                    }
                    if ((proxyRes.statusCode || 200) < 300 && method === 'POST') {
                      cachedPostByKey.set(postCacheKey, outBuf);
                    }
                    const outHeaders = { ...proxyRes.headers };
                    delete outHeaders['content-encoding'];
                    delete outHeaders['transfer-encoding'];
                    outHeaders['content-length'] = String(outBuf.length);
                    res.writeHead(proxyRes.statusCode || 200, outHeaders);
                    res.end(outBuf);
                    return;
                  } catch {
                    // Fallback to raw buffer if JSON parse fails
                  }
                }

                const outHeaders = { ...proxyRes.headers };
                delete outHeaders['transfer-encoding'];
                outHeaders['content-length'] = String(rawBuf.length);
                res.writeHead(proxyRes.statusCode || 200, outHeaders);
                res.end(rawBuf);
              });
            },
          );
          proxyReq.on('error', (err) => {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          });
          if (reqBodyBuf.length > 0) {
            proxyReq.write(reqBodyBuf);
          }
          proxyReq.end();
        });
        return;
      }

      const cleanPath = decodeURIComponent(reqUrl.split('?')[0]);
      let filePath = path.join(DIST_DIR, cleanPath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, 'index.html');
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_MAP[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });

    server.on('error', reject);
    const port = Number(new URL(BASE_URL).port || 4304);
    server.listen(port, '127.0.0.1', () => {
      console.log(`[server] In-process SPA & API proxy server listening at ${BASE_URL} (serving ${DIST_DIR})`);
      resolve(server);
    });
  });
}

function stopDevServer(server) {
  try {
    if (server && typeof server.close === 'function') {
      server.close();
    }
  } catch {}
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function moveCursorToLocator(page, locator, pauseMs = 110) {
  try {
    const box = await locator.boundingBox();
    if (!box) return;
    const x = Math.round(box.x + Math.min(box.width / 2, 130));
    const y = Math.round(box.y + Math.min(box.height / 2, 28));
    await page.evaluate(({ x, y }) => {
      if (window.__praxisMoveCursor) window.__praxisMoveCursor(x, y, true);
    }, { x, y });
    if (pauseMs > 0) await sleep(pauseMs);
  } catch {
    // ignore if element detached
  }
}

async function hoverAcrossTableRows(page, durationMs = 6800) {
  const rows = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row');
  const count = await rows.count().catch(() => 0);
  if (count === 0) {
    await sleep(durationMs);
    return;
  }
  const steps = Math.min(4, count);
  const stepWait = Math.floor(durationMs / (steps + 1));
  await sleep(stepWait);
  for (let i = 0; i < steps; i++) {
    const row = rows.nth(i);
    try {
      const box = await row.boundingBox();
      if (box) {
        const x = Math.round(box.x + Math.min(box.width * 0.45, 520));
        const y = Math.round(box.y + box.height / 2);
        await page.evaluate(({ x, y }) => {
          if (window.__praxisMoveCursor) window.__praxisMoveCursor(x, y, false);
        }, { x, y });
      }
    } catch {}
    await sleep(stepWait);
  }
}

async function setFormInput(page, selectorOrLocator, value, { pauseMs = 90 } = {}) {
  const loc = typeof selectorOrLocator === 'string'
    ? page.locator(selectorOrLocator).first()
    : selectorOrLocator.first();
  await loc.waitFor({ state: 'visible', timeout: 10000 });
  await loc.evaluate((el) => el.scrollIntoView({ block: 'nearest', inline: 'nearest' })).catch(() => {});
  await moveCursorToLocator(page, loc, pauseMs);
  await loc.fill(String(value));
  await loc.dispatchEvent('input');
  await loc.dispatchEvent('change');
  const openAutocomplete = page.locator('.mat-mdc-autocomplete-panel.mat-mdc-autocomplete-visible');
  if (await openAutocomplete.count().catch(() => 0)) {
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(60);
  }
  await loc.blur();
}

async function dismissStrayBackdrops(page) {
  for (let i = 0; i < 4; i++) {
    const backdrop = page.locator('.cdk-overlay-transparent-backdrop.cdk-overlay-backdrop-showing');
    const autocomplete = page.locator('.mat-mdc-autocomplete-panel.mat-mdc-autocomplete-visible');
    if ((await backdrop.count()) === 0 && (await autocomplete.count()) === 0) break;
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(150);
    if ((await backdrop.count()) > 0) {
      await backdrop.first().click({ force: true }).catch(() => {});
      await sleep(150);
    }
  }
}

async function expandActiveSettingsPanel(page) {
  const expandBtn = page.locator('[data-testid="settings-panel-toggle-expand"]').last();
  if (await expandBtn.isVisible().catch(() => false)) {
    const isExpanded = await expandBtn.getAttribute('aria-expanded').catch(() => 'false');
    if (isExpanded !== 'true') {
      await moveCursorToLocator(page, expandBtn, 95);
      await expandBtn.click();
      await sleep(320);
    }
  }
}

async function collapseSidebarIfExpanded(page) {
  const collapseBtn = page.locator('button.praxis-shell__collapse-btn[aria-expanded="true"]').first();
  if (await collapseBtn.isVisible().catch(() => false)) {
    await moveCursorToLocator(page, collapseBtn, 95);
    await collapseBtn.click();
    await sleep(320);
  }
}

async function saveAndCloseSettingsPanel(page, label = '') {
  await dismissStrayBackdrops(page);
  const saveBtn = page.locator('[data-testid="settings-panel-save"]').last();
  const applyBtn = page.locator('[data-testid="settings-panel-apply"]').last();
  await saveBtn.waitFor({ state: 'visible', timeout: 10000 });

  for (let i = 0; i < 40; i++) {
    const saveDisabled = await saveBtn.isDisabled().catch(() => true);
    const applyDisabled = await applyBtn.isDisabled().catch(() => true);
    if (!saveDisabled || !applyDisabled) break;
    await sleep(200);
  }
  await sleep(260);

  if (!(await saveBtn.isDisabled())) {
    await moveCursorToLocator(page, saveBtn, 110);
    await saveBtn.click();
    console.log(`  [ok] Saved & closed settings panel for ${label}`);
    await sleep(500);
    return;
  }

  if (!(await applyBtn.isDisabled())) {
    await moveCursorToLocator(page, applyBtn, 110);
    await applyBtn.click();
    console.log(`  [ok] Applied settings panel for ${label}`);
    await sleep(450);
  }

  const closeIcon = page.locator('[data-testid="settings-panel-close-icon"]').last();
  if (await closeIcon.isVisible()) {
    await moveCursorToLocator(page, closeIcon, 80);
    await closeIcon.click({ force: true });
    await sleep(400);
  }
}

async function connectResourceInCrudEditor(page, resourcePath) {
  const rqc = page.locator('[data-testid="crud-editor-resource-path"]');
  await rqc.waitFor({ state: 'visible', timeout: 10000 });

  const slug = String(resourcePath || '').split('/').filter(Boolean).pop() || resourcePath;
  const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matchRegex = new RegExp(escapedSlug, 'i');

  for (let i = 0; i < 40; i++) {
    const loadingCount = await rqc.locator('.pdx-quick-connect__status').count();
    const hasTrigger = (await rqc.locator('.pdx-material-collection-trigger, [data-testid="quick-connect-change-resource-btn"]').count()) > 0;
    const hasSearch = (await rqc.locator('[data-testid="quick-connect-search-input"]').count()) > 0;
    if ((hasTrigger || hasSearch) && loadingCount === 0) break;
    await sleep(200);
  }

  const changeBtn = rqc.locator('[data-testid="quick-connect-change-resource-btn"]').first();
  const collectionTrigger = rqc.locator('button.pdx-material-collection-trigger[role="combobox"]').first();
  const searchInput = rqc.locator('[data-testid="quick-connect-search-input"]').first();

  if (await changeBtn.isVisible().catch(() => false)) {
    await moveCursorToLocator(page, changeBtn, 110);
    await changeBtn.click();
    await sleep(320);
  } else if (await collectionTrigger.isVisible().catch(() => false)) {
    await moveCursorToLocator(page, collectionTrigger, 110);
    await collectionTrigger.click();
    await sleep(320);
  }

  const overlayPanel = page.locator('.pdx-material-select-panel, .pdx-collection-overlay').first();
  if (await overlayPanel.isVisible().catch(() => false)) {
    const overlaySearch = overlayPanel.locator('input').first();
    if (await overlaySearch.isVisible().catch(() => false)) {
      await setFormInput(page, overlaySearch, slug);
      await sleep(360);
    }
    const overlayOpt = overlayPanel
      .locator('.pdx-material-select-option-button')
      .filter({ hasText: matchRegex })
      .first();
    if (await overlayOpt.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, overlayOpt, 120);
      await overlayOpt.click();
      await sleep(420);
    }
  } else if (await searchInput.isVisible().catch(() => false)) {
    await setFormInput(page, searchInput, slug);
    await sleep(380);
    const optBtn = rqc
      .locator('.pdx-quick-connect__option-item')
      .filter({ hasText: matchRegex })
      .first();
    if (await optBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, optBtn, 120);
      await optBtn.click();
      await sleep(380);
    }
  }

  const selectedCard = rqc.locator('[data-testid="quick-connect-selected-card"]').first();
  const cardText = (await selectedCard.innerText().catch(() => '')) || '';
  console.log(`  [connectResourceInCrudEditor] target=${resourcePath}, cardVisible=${await selectedCard.isVisible().catch(() => false)}, cardText=${JSON.stringify(cardText)}`);
  if (!(await selectedCard.isVisible().catch(() => false)) || !matchRegex.test(cardText)) {
    const details = rqc.locator('details.pdx-quick-connect__advanced');
    if (await details.isVisible().catch(() => false)) {
      const isOpen = await details.evaluate((el) => el.hasAttribute('open'));
      if (!isOpen) {
        const summary = details.locator('summary');
        await moveCursorToLocator(page, summary, 80);
        await summary.click();
        await sleep(220);
      }
      const pathInput = details.locator('input[matinput]').first();
      if (await pathInput.isVisible().catch(() => false)) {
        const currentVal = await pathInput.inputValue();
        if (currentVal.trim() !== resourcePath) {
          await setFormInput(page, pathInput, resourcePath);
          await sleep(320);
        }
      }
    }
  }
}

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const server = await ensureDevServer();
  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--window-size=1920,1080',
        '--force-device-scale-factor=1',
        '--high-dpi-support=1'
      ]
    });

    console.log('0. Pre-warming schemas and endpoints in a non-recorded context (<10ms proxy cache)...');
    const warmContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const warmPage = await warmContext.newPage();
    await warmPage.goto(`${BASE_URL}/workspace-studio`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await warmPage.locator('[data-testid="toggle-customization-btn"]').waitFor({ state: 'visible', timeout: 15000 });
    await warmPage.evaluate(async () => {
      try {
        const resources = [
          '/api/human-resources/funcionarios',
          '/api/risk-intelligence/ameacas',
          '/api/human-resources/folhas-pagamento'
        ];
        await fetch('/schemas/catalog').catch(() => null);
        for (const resPath of resources) {
          await Promise.all([
            fetch(`${resPath}/filter`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            }).catch(() => null),
            fetch(`${resPath}/filter?size=10&page=0&includeLinks=true`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            }).catch(() => null),
            fetch(`${resPath}/all`).catch(() => null),
            fetch(`${resPath}/capabilities`).catch(() => null),
            fetch(`${resPath}/actions`).catch(() => null),
            fetch(`${resPath}/surfaces`).catch(() => null),
            fetch(`/schemas/filtered?path=${encodeURIComponent(resPath + '/all')}&operation=get&schemaType=response`).catch(() => null),
            fetch(`/schemas/filtered?path=${encodeURIComponent(resPath + '/filter')}&operation=post&schemaType=request`).catch(() => null),
            fetch(`/schemas/filtered?path=${encodeURIComponent(resPath)}&operation=post&schemaType=request`).catch(() => null),
            fetch(`/schemas/filtered?path=${encodeURIComponent(resPath + '/{id}')}&operation=put&schemaType=request`).catch(() => null),
            fetch(`/schemas/filtered?path=${encodeURIComponent(resPath + '/{id}')}&operation=get&schemaType=response`).catch(() => null)
          ]);
        }
        // Reset any in-memory UI config so the recorded context starts 100% blank!
        await fetch('/api/praxis/config/ui/__reset__', { method: 'POST' }).catch(() => null);
      } catch {}
    });
    await sleep(300);
    await warmContext.close();

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });

    await context.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('praxis_hero_hq_theme', 'light-tech');
        document.documentElement.dataset.theme = 'light-tech';
        document.documentElement.classList.remove('dark');
      } catch {}

      // Install ONLY the clean pointer cursor & click ripple (NO information cards, NO HUD, NO banners!)
      const installCleanCursorOverlay = () => {
        if (document.getElementById('praxis-demo-cursor')) return;
        const style = document.createElement('style');
        style.textContent = `
          .cdk-overlay-backdrop,
          .cdk-overlay-dark-backdrop,
          .mat-drawer-backdrop,
          .studio-backdrop {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            background: rgba(15, 23, 42, 0.22) !important;
          }
          #praxis-demo-toplayer {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: transparent !important;
            pointer-events: none !important;
            overflow: visible !important;
            z-index: 2147483647 !important;
          }
          #praxis-demo-toplayer::backdrop {
            background: transparent !important;
            pointer-events: none !important;
          }
          #praxis-demo-cursor {
            position: fixed;
            top: 0;
            left: 0;
            width: 28px;
            height: 28px;
            pointer-events: none;
            z-index: 2147483647;
            transform: translate3d(960px, 540px, 0);
            transition: transform 0.16s cubic-bezier(0.22, 1, 0.36, 1);
            filter: drop-shadow(0 4px 10px rgba(15, 23, 42, 0.35)) drop-shadow(0 0 8px rgba(2, 132, 199, 0.45));
          }
          .praxis-click-ripple {
            position: fixed;
            width: 34px;
            height: 34px;
            margin-left: -17px;
            margin-top: -17px;
            border-radius: 50%;
            border: 2.5px solid #0284c7;
            background: rgba(2, 132, 199, 0.24);
            pointer-events: none;
            z-index: 2147483646;
            animation: praxisRippleAnim 0.5s ease-out forwards;
          }
          @keyframes praxisRippleAnim {
            0% { transform: scale(0.35); opacity: 1; }
            100% { transform: scale(2.35); opacity: 0; }
          }
        `;
        document.head.appendChild(style);

        const topLayer = document.createElement('div');
        topLayer.id = 'praxis-demo-toplayer';
        topLayer.setAttribute('popover', 'manual');
        document.body.appendChild(topLayer);
        try {
          topLayer.showPopover();
        } catch {}

        const cursor = document.createElement('div');
        cursor.id = 'praxis-demo-cursor';
        cursor.innerHTML = `
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 3L12.5 24L15.8 15.8L24 12.5L4 3Z" fill="#0284C7" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round"/>
            <circle cx="4" cy="3" r="2.5" fill="#0D9488"/>
          </svg>
        `;
        topLayer.appendChild(cursor);

        const promoteTopLayer = () => {
          try {
            if (topLayer.isConnected && typeof topLayer.showPopover === 'function') {
              topLayer.hidePopover();
              topLayer.showPopover();
            }
          } catch {}
        };

        const observer = new MutationObserver(() => {
          setTimeout(promoteTopLayer, 20);
        });
        observer.observe(document.body, { childList: true, subtree: true });

        window.__praxisMoveCursor = (x, y, showRipple = false) => {
          const c = document.getElementById('praxis-demo-cursor');
          if (c) {
            c.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
          }
          if (showRipple) {
            const ripple = document.createElement('div');
            ripple.className = 'praxis-click-ripple';
            ripple.style.left = `${Math.round(x)}px`;
            ripple.style.top = `${Math.round(y)}px`;
            (document.getElementById('praxis-demo-toplayer') || document.body).appendChild(ripple);
            setTimeout(() => ripple.remove(), 520);
          }
        };

        document.addEventListener(
          'click',
          (e) => {
            if (!e.clientX && !e.clientY) return;
            window.__praxisMoveCursor(e.clientX, e.clientY, true);
          },
          true
        );
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installCleanCursorOverlay);
      } else {
        installCleanCursorOverlay();
      }
    });

    const page = await context.newPage();
    page.on('pageerror', (err) => console.error('[pageerror]', err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.error('[console.error]', msg.text());
    });

    console.log('1. Navigating to /workspace-studio (100% blank Page Builder canvas BEFORE starting recorder)...');
    await page.goto(`${BASE_URL}/workspace-studio`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('[data-testid="toggle-customization-btn"]').waitFor({ state: 'visible', timeout: 15000 });

    // Collapse the left navigation sidebar BEFORE recording starts so 00:00 is a clean, spacious blank canvas
    await collapseSidebarIfExpanded(page);
    await sleep(400);

    const videoFile = path.join(ARTIFACT_DIR, 'praxis-workspace-video-1-efeito-camaleao.webm');
    const recorder = new HighFidelityVideoRecorder(page, videoFile, { width: 1920, height: 1080, fps: 30 });
    await recorder.start();

    // Hold 1.5s on the 100% blank page so the viewer clearly sees it starts from nothing
    await sleep(1500);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-blank-canvas-00s.png') });

    // Enable Customization Mode on the blank Page Builder canvas
    const toggleCustomBtn = page.locator('[data-testid="toggle-customization-btn"]');
    await moveCursorToLocator(page, toggleCustomBtn, 140);
    await toggleCustomBtn.click();
    await sleep(800);
    await recorder.captureSyncKeyframe();

    // Open Component Palette Dialog ("Inserir componente")
    const insertComponentBtn = page
      .locator('praxis-floating-toolbar button[aria-label="Inserir componente"], praxis-floating-toolbar button[aria-label="Insert component"]')
      .first();
    await insertComponentBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, insertComponentBtn, 140);
    await insertComponentBtn.click();

    const paletteDialog = page.locator('praxis-component-palette-dialog');
    await paletteDialog.waitFor({ state: 'visible', timeout: 10000 });
    await sleep(450);

    // Search for "Workspace de Recurso" in the Component Palette
    const paletteSearch = paletteDialog.locator('[data-testid="component-palette-search"]');
    await setFormInput(page, paletteSearch, 'Workspace de Recurso');
    await sleep(550);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-palette-workspace-de-recurso.png') });

    // Click the "Workspace de Recurso" card to insert it onto the 12-column canvas
    const workspaceCard = paletteDialog
      .locator('button.pdx-card')
      .filter({ hasText: /Workspace de Recurso|praxis-crud/i })
      .first();
    await workspaceCard.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, workspaceCard, 140);
    await workspaceCard.click();
    await sleep(900);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-workspace-empty-state.png') });

    // =========================================================================
    // RESOURCE 1/3: Pessoas & RH (human-resources/funcionarios)
    // =========================================================================
    console.log('2. Connecting Resource 1/3: human-resources/funcionarios (Avatars, #ID, Dates, Status)...');
    const configPageBtn = page
      .locator('praxis-crud praxis-empty-state-card button, [data-testid="resource-page-configure-btn"]')
      .first();
    await configPageBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, configPageBtn, 140);
    await configPageBtn.click();

    const crudEditor = page.locator('[data-testid="crud-metadata-editor"]');
    await crudEditor.waitFor({ state: 'visible', timeout: 10000 });
    await sleep(400);
    await expandActiveSettingsPanel(page);

    await connectResourceInCrudEditor(page, 'human-resources/funcionarios');
    await sleep(600);
    await recorder.captureSyncKeyframe();
    await saveAndCloseSettingsPanel(page, 'resource-1-funcionarios');

    await page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first().waitFor({ state: 'visible', timeout: 20000 });
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-resource-1-funcionarios.png') });

    // Give the viewer ~7 seconds to inspect Funcionários (Foto Avatar, Código #194, Datas, Chips)
    await hoverAcrossTableRows(page, 7000);
    await recorder.captureSyncKeyframe();

    // =========================================================================
    // RESOURCE 2/3: Inteligência de Risco com Microchart Radial (risk-intelligence/ameacas)
    // =========================================================================
    console.log('3. Switching to Resource 2/3: risk-intelligence/ameacas (Radial Microchart + Class/Status Chips + BRL Bounty)...');
    const reopenForRes2 = page.locator('[data-testid="resource-page-configure-btn"]').first();
    await reopenForRes2.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, reopenForRes2, 140);
    await reopenForRes2.click();
    await crudEditor.waitFor({ state: 'visible', timeout: 10000 });
    await sleep(400);
    await expandActiveSettingsPanel(page);

    await connectResourceInCrudEditor(page, 'risk-intelligence/ameacas');
    await sleep(600);
    await recorder.captureSyncKeyframe();
    await saveAndCloseSettingsPanel(page, 'resource-2-ameacas');

    await page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first().waitFor({ state: 'visible', timeout: 20000 });
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-resource-2-ameacas-microchart-radial.png') });

    // Give the viewer ~7.5 seconds to inspect Ameaças (Radial Microchart on Nível, Chips, Planeta, Recompensa R$)
    await hoverAcrossTableRows(page, 7500);
    await recorder.captureSyncKeyframe();

    // =========================================================================
    // RESOURCE 3/3: Folhas de Pagamento com Microchart Bullet + Moeda BRL (human-resources/folhas-pagamento)
    // =========================================================================
    console.log('4. Switching to Resource 3/3: human-resources/folhas-pagamento (Financial BRL + Bullet Microchart)...');
    const reopenForRes3 = page.locator('[data-testid="resource-page-configure-btn"]').first();
    await reopenForRes3.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, reopenForRes3, 140);
    await reopenForRes3.click();
    await crudEditor.waitFor({ state: 'visible', timeout: 10000 });
    await sleep(400);
    await expandActiveSettingsPanel(page);

    await connectResourceInCrudEditor(page, 'human-resources/folhas-pagamento');
    await sleep(600);
    await recorder.captureSyncKeyframe();
    await saveAndCloseSettingsPanel(page, 'resource-3-folhas-pagamento');

    await page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first().waitFor({ state: 'visible', timeout: 20000 });
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06-resource-3-folhas-pagamento-microchart-bullet.png') });

    // Give the viewer ~5.5 seconds to inspect Folhas de Pagamento, then exit Customization Mode cleanly
    await hoverAcrossTableRows(page, 5500);

    // Exit Customization Mode so the final frames show the clean operational Workspace
    await moveCursorToLocator(page, toggleCustomBtn, 140);
    await toggleCustomBtn.click({ force: true, timeout: 10000 }).catch(() => {});
    await sleep(2800);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07-final-operational-workspace.png') });

    await recorder.stop();
    await browser.close();
    browser = null;

    console.log('\n================================================================');
    console.log(' [SUCCESS] Video 1 (Efeito Camaleão - Clean, No Info Cards) Recorded!');
    console.log(` - WebM: ${videoFile}`);
    console.log('================================================================\n');
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    stopDevServer(server);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
