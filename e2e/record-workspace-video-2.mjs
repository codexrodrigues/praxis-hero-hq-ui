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

const BASE_URL = process.env.PAX_CRUD_DEMO_URL || 'http://127.0.0.1:4305';
const DIST_DIR = process.env.PAX_STUDIO_DIST_DIR || path.join(PROJECT_ROOT, 'dist', 'praxis-hero-hq-ui', 'browser');
const PROXY_ORIGIN = process.env.PAX_PROXY_ORIGIN || 'http://localhost:4200';
const ARTIFACT_DIR = process.env.PAX_CRUD_ARTIFACT_DIR || path.join(PROJECT_ROOT, 'test-results', 'workspace-video-2');
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
  '.ttf': 'font/ttf',
};

function checkUrl(url, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      res.resume();
      resolve(res.statusCode && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function resolveProxyTarget() {
  if (process.env.PAX_PROXY_TARGET) {
    return process.env.PAX_PROXY_TARGET;
  }
  const localAlive = await checkUrl('http://127.0.0.1:8088/schemas/catalog');
  if (localAlive) {
    console.log('[video-2] Using local backend http://127.0.0.1:8088');
    return 'http://127.0.0.1:8088';
  }
  console.log('[video-2] Local backend not detected on :8088, falling back to https://praxis-api-quickstart.onrender.com');
  return 'https://praxis-api-quickstart.onrender.com';
}

/**
 * Direct Single-Pass Full HD (1920x1080) @ 30 FPS Video Recorder
 * Clean screen recording — zero informational HUD or callout cards!
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
      this.outputFile,
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
      everyNthFrame: 1,
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
    surfaces: [],
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

function ensureDevServer(proxyTarget) {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(proxyTarget);
    const cachedGetJsonByUrl = new Map();
    const cachedPostByKey = new Map();
    const inMemoryUserConfigs = new Map();

    const server = http.createServer((req, res) => {
      const reqUrl = req.url || '/';
      const cleanReqPath = reqUrl.split('?')[0];
      const method = (req.method || 'GET').toUpperCase();

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
                          .map((rec, idx) => {
                            const numericId = Number(rec.id);
                            // Ensure a visible mix of Sim (true) and Não (false) in the first rows so both domain badges shine!
                            const defaultAtivo = idx === 2 || idx === 6 ? false : !Number.isNaN(numericId) ? numericId % 5 !== 0 : Boolean(rec.ativo);
                            return { ...rec, ativo: defaultAtivo };
                          });
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
            }
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
    const port = Number(new URL(BASE_URL).port || 4305);
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

async function moveCursorToLocator(page, locator, pauseMs = 140) {
  try {
    await locator.evaluate((el) => el.scrollIntoView({ block: 'nearest', inline: 'nearest' })).catch(() => {});
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

async function demoClick(page, locator, pauseAfterMs = 420) {
  await locator.waitFor({ state: 'attached', timeout: 12000 });
  await locator.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' })).catch(() => {});
  await locator.waitFor({ state: 'visible', timeout: 12000 });
  await moveCursorToLocator(page, locator, 160);
  await locator.click();
  if (pauseAfterMs > 0) await sleep(pauseAfterMs);
}

async function setFormInput(page, selectorOrLocator, value, { pauseMs = 120, pauseAfterMs = 360 } = {}) {
  const loc = typeof selectorOrLocator === 'string'
    ? page.locator(selectorOrLocator).first()
    : selectorOrLocator.first();
  await loc.waitFor({ state: 'attached', timeout: 10000 });
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' })).catch(() => {});
  await loc.waitFor({ state: 'visible', timeout: 10000 });
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
  if (pauseAfterMs > 0) await sleep(pauseAfterMs);
}

async function hoverAcrossTableRows(page, durationMs = 5500) {
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
      await moveCursorToLocator(page, expandBtn, 110);
      await expandBtn.click();
      await sleep(360);
    }
  }
}

async function collapseSidebarIfExpanded(page) {
  const collapseBtn = page.locator('button.praxis-shell__collapse-btn[aria-expanded="true"]').first();
  if (await collapseBtn.isVisible().catch(() => false)) {
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
  await sleep(300);

  if (!(await saveBtn.isDisabled())) {
    await moveCursorToLocator(page, saveBtn, 140);
    await saveBtn.click();
    console.log(`  [ok] Saved & closed settings panel for ${label}`);
    await sleep(750);
    return;
  }

  if (!(await applyBtn.isDisabled())) {
    await moveCursorToLocator(page, applyBtn, 140);
    await applyBtn.click();
    console.log(`  [ok] Applied settings panel for ${label}`);
    await sleep(600);
  }

  const closeIcon = page.locator('[data-testid="settings-panel-close-icon"], [data-testid="settings-panel-close"]').last();
  if (await closeIcon.isVisible().catch(() => false)) {
    await moveCursorToLocator(page, closeIcon, 100);
    await closeIcon.click({ force: true });
    await sleep(450);
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
    await changeBtn.click();
    await sleep(320);
  } else if (await collectionTrigger.isVisible().catch(() => false)) {
    await collectionTrigger.click();
    await sleep(320);
  }

  const overlayPanel = page.locator('.pdx-material-select-panel, .pdx-collection-overlay').first();
  if (await overlayPanel.isVisible().catch(() => false)) {
    const overlaySearch = overlayPanel.locator('input').first();
    if (await overlaySearch.isVisible().catch(() => false)) {
      await overlaySearch.fill(slug);
      await sleep(360);
    }
    const overlayOpt = overlayPanel
      .locator('.pdx-material-select-option-button')
      .filter({ hasText: matchRegex })
      .first();
    if (await overlayOpt.isVisible().catch(() => false)) {
      await overlayOpt.click();
      await sleep(420);
    }
  } else if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill(slug);
    await sleep(380);
    const optBtn = rqc
      .locator('.pdx-quick-connect__option-item')
      .filter({ hasText: matchRegex })
      .first();
    if (await optBtn.isVisible().catch(() => false)) {
      await optBtn.click();
      await sleep(380);
    }
  }
}

async function openColumnsEditor(page) {
  const configureResourceBtn = page.locator('[data-testid="resource-page-configure-btn"]').first();
  if (await configureResourceBtn.isVisible().catch(() => false)) {
    await demoClick(page, configureResourceBtn, 650);
  } else {
    const tableSettingsBtn = page.locator('[data-testid="table-settings-trigger"]').first();
    await tableSettingsBtn.waitFor({ state: 'visible', timeout: 15000 });
    await demoClick(page, tableSettingsBtn, 650);
  }

  const crudEditor = page.locator('[data-testid="crud-metadata-editor"]');
  await crudEditor.waitFor({ state: 'visible', timeout: 15000 });
  await expandActiveSettingsPanel(page);
  await sleep(300);

  // Switch to the Tabela tab inside crud-metadata-editor
  const tableTabSpan = crudEditor.locator('[data-testid="crud-editor-tab-table"]').first();
  if (!(await tableTabSpan.isVisible().catch(() => false))) {
    // Scroll the mat-tab-header right if needed
    const paginationAfter = crudEditor.locator('.mat-mdc-tab-header-pagination-after').first();
    if (await paginationAfter.isVisible().catch(() => false)) {
      await paginationAfter.click().catch(() => {});
      await sleep(250);
    }
  }
  const tableTabMdc = crudEditor
    .locator('.mdc-tab')
    .filter({ has: page.locator('[data-testid="crud-editor-tab-table"]') })
    .first();
  if (await tableTabMdc.isVisible().catch(() => false)) {
    await demoClick(page, tableTabMdc, 600);
  } else {
    await tableTabSpan.click({ force: true });
    await sleep(600);
  }

  // Click "Editar colunas do recurso" OR expand the Columns expansion panel directly
  const focusColumnsBtn = crudEditor.locator('[data-testid="crud-table-focus-columns-btn"]').first();
  const columnsPanel = crudEditor.locator('[data-testid="table-inline-editor-columns-panel"]').first();

  if (await focusColumnsBtn.isVisible().catch(() => false)) {
    await demoClick(page, focusColumnsBtn, 650);
  }

  // Ensure the expansion panel is expanded
  if (await columnsPanel.isVisible().catch(() => false)) {
    const isExpanded = await columnsPanel.evaluate((el) => el.classList.contains('mat-expanded')).catch(() => false);
    if (!isExpanded) {
      const header = columnsPanel.locator('mat-expansion-panel-header').first();
      await demoClick(page, header, 650);
    }
  }

  const columnsEditor = crudEditor.locator('columns-config-editor').first();
  await columnsEditor.waitFor({ state: 'visible', timeout: 15000 });
  await sleep(300);
  return columnsEditor;
}

function getColumnItemByField(page, fieldName) {
  return page
    .locator('columns-config-editor .columns-list mat-list-item.column-item')
    .filter({
      has: page.locator('.column-field', {
        hasText: new RegExp(`^\\s*${fieldName}\\s*$`),
      }),
    })
    .first();
}

async function selectColumnByField(page, fieldName) {
  const item = getColumnItemByField(page, fieldName);
  await item.waitFor({ state: 'visible', timeout: 10000 });
  await demoClick(page, item, 450);
  return item;
}

async function setColumnVisibilityInList(page, fieldName, visible) {
  const item = getColumnItemByField(page, fieldName);
  await item.waitFor({ state: 'visible', timeout: 10000 });
  const checkbox = item.locator('mat-checkbox.visibility-checkbox').first();
  const isChecked = await checkbox.evaluate((el) => el.classList.contains('mat-mdc-checkbox-checked'));
  if (isChecked !== visible) {
    await demoClick(page, checkbox, 380);
  }
}

async function expandColumnSubPanelByIcon(page, iconName) {
  const panel = page
    .locator('columns-config-editor .column-editor mat-expansion-panel')
    .filter({
      has: page.locator('mat-expansion-panel-header mat-icon', {
        hasText: new RegExp(`^\\s*${iconName}\\s*$`),
      }),
    })
    .first();
  await panel.waitFor({ state: 'visible', timeout: 10000 });
  const isExpanded = await panel.evaluate((el) => el.classList.contains('mat-expanded'));
  if (!isExpanded) {
    const header = panel.locator('mat-expansion-panel-header').first();
    await demoClick(page, header, 520);
  }
  return panel;
}

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const proxyTarget = await resolveProxyTarget();
  const server = await ensureDevServer(proxyTarget);
  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--window-size=1920,1080',
        '--force-device-scale-factor=1',
        '--high-dpi-support=1',
      ],
    });

    console.log('0. Pre-warming schemas and endpoints in a non-recorded context (<10ms proxy cache)...');
    const warmContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const warmPage = await warmContext.newPage();
    await warmPage.goto(`${BASE_URL}/workspace-studio`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await warmPage.locator('[data-testid="toggle-customization-btn"]').waitFor({ state: 'visible', timeout: 15000 });
    await warmPage.evaluate(async () => {
      try {
        const resPath = '/api/human-resources/funcionarios';
        await fetch('/schemas/catalog').catch(() => null);
        await Promise.all([
          fetch(`${resPath}/filter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          }).catch(() => null),
          fetch(`${resPath}/filter?size=10&page=0&includeLinks=true`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          }).catch(() => null),
          fetch(`${resPath}/all`).catch(() => null),
          fetch(`${resPath}/capabilities`).catch(() => null),
          fetch(`${resPath}/actions`).catch(() => null),
          fetch(`${resPath}/surfaces`).catch(() => null),
          fetch(`/schemas/filtered?path=${encodeURIComponent(resPath + '/all')}&operation=get&schemaType=response`).catch(() => null),
          fetch(`/schemas/filtered?path=${encodeURIComponent(resPath + '/filter')}&operation=post&schemaType=request`).catch(() => null),
          fetch(`/schemas/filtered?path=${encodeURIComponent(resPath)}&operation=post&schemaType=request`).catch(() => null),
          fetch(`/schemas/filtered?path=${encodeURIComponent(resPath + '/{id}')}&operation=put&schemaType=request`).catch(() => null),
          fetch(`/schemas/filtered?path=${encodeURIComponent(resPath + '/{id}')}&operation=get&schemaType=response`).catch(() => null),
        ]);
        await fetch('/api/praxis/config/ui/__reset__', { method: 'POST' }).catch(() => null);
      } catch {}
    });
    await sleep(300);
    await warmContext.close();

    // =========================================================================
    // Create the context and pre-stage the Workspace de Recurso (Funcionários)
    // BEFORE starting the video recorder so 00:00 begins directly on Funcionários!
    // =========================================================================
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });

    await context.addInitScript(() => {
      try {
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

    console.log('1. Pre-staging Workspace de Recurso bound to human-resources/funcionarios BEFORE starting video...');
    await page.goto(`${BASE_URL}/workspace-studio`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('[data-testid="toggle-customization-btn"]').waitFor({ state: 'visible', timeout: 15000 });
    await collapseSidebarIfExpanded(page);

    const toggleCustomBtn = page.locator('[data-testid="toggle-customization-btn"]');
    await toggleCustomBtn.click();
    await sleep(450);

    const insertComponentBtn = page
      .locator('praxis-floating-toolbar button[aria-label="Inserir componente"], praxis-floating-toolbar button[aria-label="Insert component"]')
      .first();
    await insertComponentBtn.waitFor({ state: 'visible', timeout: 10000 });
    await insertComponentBtn.click();

    const paletteDialog = page.locator('praxis-component-palette-dialog');
    await paletteDialog.waitFor({ state: 'visible', timeout: 10000 });
    const paletteSearch = paletteDialog.locator('[data-testid="component-palette-search"]');
    await paletteSearch.fill('Workspace de Recurso');
    await sleep(350);

    const workspaceCard = paletteDialog
      .locator('button.pdx-card')
      .filter({ hasText: /Workspace de Recurso|praxis-crud/i })
      .first();
    await workspaceCard.waitFor({ state: 'visible', timeout: 10000 });
    await workspaceCard.click();
    await sleep(600);

    const configPageBtn = page
      .locator('praxis-crud praxis-empty-state-card button, [data-testid="resource-page-configure-btn"]')
      .first();
    await configPageBtn.waitFor({ state: 'visible', timeout: 10000 });
    await configPageBtn.click();

    const crudEditor = page.locator('[data-testid="crud-metadata-editor"]');
    await crudEditor.waitFor({ state: 'visible', timeout: 10000 });
    await expandActiveSettingsPanel(page);
    await connectResourceInCrudEditor(page, 'human-resources/funcionarios');
    await sleep(400);
    await saveAndCloseSettingsPanel(page, 'prestage-funcionarios');

    await page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first().waitFor({ state: 'visible', timeout: 20000 });
    await sleep(400);

    // Exit customization mode before starting the video so 00:00 matches the exact final operational state of Video 1
    await toggleCustomBtn.click();
    await sleep(500);

    // Park cursor near center-top of the table before starting the recorder
    await page.evaluate(() => {
      if (window.__praxisMoveCursor) window.__praxisMoveCursor(640, 260, false);
    });
    await sleep(300);

    // =========================================================================
    // START FULL HD 30FPS RECORDING AT 00:00 ON THE BASELINE FUNCIONÁRIOS TABLE
    // =========================================================================
    console.log('2. Starting Video 2 recording at 00:00 on baseline Funcionários table...');
    const videoFile = path.join(ARTIFACT_DIR, 'praxis-workspace-video-2-colunas-intencionais.webm');
    const recorder = new HighFidelityVideoRecorder(page, videoFile, { width: 1920, height: 1080, fps: 30 });
    await recorder.start();

    await sleep(2200);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-baseline-funcionarios-00s.png') });

    // Enter customization mode cleanly on camera
    await demoClick(page, toggleCustomBtn, 600);

    // =========================================================================
    // ACT 1: CELL COMPOSITION (`Colaborador` = Avatar + Nome Completo + #Código)
    // =========================================================================
    console.log('3. Act 1: Cell Composition on Colaborador (Avatar + Nome Completo + #Código)...');
    await openColumnsEditor(page);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-columns-editor-opened.png') });

    // Select `nomeCompleto`
    await selectColumnByField(page, 'nomeCompleto');

    // Rename header to `Colaborador`
    const headerInput = page.locator('columns-config-editor .column-editor input[name="header"]').first();
    await setFormInput(page, headerInput, 'Colaborador');

    // Expand `Renderização da célula` (`photo_filter` icon)
    const renderPanel = await expandColumnSubPanelByIcon(page, 'photo_filter');
    await sleep(300);

    // Click preset `Pessoa com avatar`
    const personAvatarPresetBtn = renderPanel
      .locator('.compose-preset-actions button')
      .filter({ hasText: /Pessoa com avatar|Person with avatar/i })
      .first();
    await demoClick(page, personAvatarPresetBtn, 600);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-act1-preset-person-avatar.png') });

    // Hide standalone `Foto` (`avatarUrl`) column in one click via `[data-testid="compose-hide-secondary-column"]`
    const hideAvatarColBtn = renderPanel.locator('[data-testid="compose-hide-secondary-column"]').first();
    if (await hideAvatarColBtn.isVisible().catch(() => false)) {
      await demoClick(page, hideAvatarColBtn, 520);
    }

    // Click `Adicionar texto` (`addComposeItem('text')`) to append `#Código` (`id`)
    const addTextItemBtn = renderPanel
      .locator('.compose-item-actions button')
      .filter({ hasText: /Adicionar texto|Add text/i })
      .first();
    await demoClick(page, addTextItemBtn, 520);

    // In `selectedCompose.type === 'value'`, find the value item editor container via XPath ancestor of `[data-testid="compose-value-prefix"]`
    const prefixInput = renderPanel.locator('[data-testid="compose-value-prefix"]').first();
    await prefixInput.waitFor({ state: 'visible', timeout: 10000 });
    const valueItemEditor = prefixInput.locator('xpath=ancestor::div[contains(@style,"grid-template-columns")][1]');
    const valueItemSelects = valueItemEditor.locator('mat-select');
    const fieldSelect = valueItemSelects.nth(0);
    await demoClick(page, fieldSelect, 380);
    const idOption = page
      .locator('.cdk-overlay-container mat-option')
      .filter({ hasText: /Código|\(id\)|\bid\b/i })
      .first();
    await demoClick(page, idOption, 450);

    // Fill Prefix with `#`
    await setFormInput(page, prefixInput, '#');

    // Set Emphasis (`Hierarquia visual`) to `Secundária` (`subtle`)
    const emphasisSelect = valueItemSelects.nth(2);
    await demoClick(page, emphasisSelect, 350);
    const subtleOption = page
      .locator('.cdk-overlay-container mat-option')
      .filter({ hasText: /Secundária|Suave|Subtle/i })
      .first();
    await demoClick(page, subtleOption, 420);

    // Hide standalone `Código` (`id`) column in one click via `[data-testid="compose-hide-secondary-column"]`
    const hideIdColBtn = renderPanel.locator('[data-testid="compose-hide-secondary-column"]').first();
    if (await hideIdColBtn.isVisible().catch(() => false)) {
      await demoClick(page, hideIdColBtn, 520);
    }

    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-act1-compose-configured.png') });

    // Click `Aplicar` inside Renderização da célula
    const applyRendererBtn = renderPanel
      .locator('.renderer-actions button')
      .filter({ hasText: /Aplicar|Apply/i })
      .first();
    if ((await applyRendererBtn.isVisible().catch(() => false)) && (await applyRendererBtn.isEnabled().catch(() => false))) {
      await demoClick(page, applyRendererBtn, 450);
    }

    // Save & inspect the table after Act 1 so the viewer immediately sees `Colaborador` (Avatar + Nome + #Código)
    await saveAndCloseSettingsPanel(page, 'act1-compose-colaborador');
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-act1-result-colaborador-table.png') });
    await hoverAcrossTableRows(page, 4500);

    // =========================================================================
    // ACT 2: CALCULATED COLUMNS (`fx` Visual Formula Builder)
    //   2A. `Lotação & Cargo` = Concatenação (`departamentoNome` + ' • ' + `cargoNome`)
    //   2B. Reveal `Salário` + Create `Projeção Anual` = Cálculo Numérico (`salario * 12`, Moeda)
    // =========================================================================
    console.log('4. Act 2A: Calculated Column "Lotação & Cargo" (Concatenação)...');
    await openColumnsEditor(page);

    // Select `nomeCompleto` (`Colaborador`) so the new calculated column is inserted right next to `Colaborador`
    await selectColumnByField(page, 'nomeCompleto');

    const addCalculatedBtn = page.locator('columns-config-editor button.add-column-fab').first();
    await demoClick(page, addCalculatedBtn, 550);

    // Header: `Lotação & Cargo`
    await setFormInput(page, headerInput, 'Lotação & Cargo');

    // Configure Visual Formula Builder -> Concatenação de Campos
    const formulaBuilder = page.locator('columns-config-editor visual-formula-builder').first();
    await formulaBuilder.waitFor({ state: 'visible', timeout: 10000 });

    const formulaTypeSelect = formulaBuilder.locator('.formula-type-select mat-select').first();
    await demoClick(page, formulaTypeSelect, 380);
    const concatOption = page
      .locator('.cdk-overlay-container mat-option')
      .filter({ hasText: /Concatena/i })
      .first();
    await demoClick(page, concatOption, 420);

    // Select fields (`departamentoNome` FIRST, then `cargoNome` so order is Departamento • Cargo) in multi-select
    const fieldsMultiSelect = formulaBuilder.locator('.parameters-card .parameter-field').nth(0).locator('mat-select').first();
    await demoClick(page, fieldsMultiSelect, 420);

    const deptoOption = page
      .locator('.cdk-overlay-container mat-option')
      .filter({ hasText: /departamentoNome/i })
      .first();
    await demoClick(page, deptoOption, 350);

    const cargoOption = page
      .locator('.cdk-overlay-container mat-option')
      .filter({ hasText: /cargoNome/i })
      .first();
    await demoClick(page, cargoOption, 350);

    // Close multi-select overlay via backdrop click so focus doesn't jump to toggle buttons
    const overlayBackdrop = page.locator('.cdk-overlay-backdrop.cdk-overlay-backdrop-showing').first();
    if (await overlayBackdrop.isVisible().catch(() => false)) {
      await overlayBackdrop.click({ force: true });
    } else {
      await page.keyboard.press('Escape');
    }
    await sleep(320);

    // Fill separator `' • '`
    const separatorInput = formulaBuilder.locator('.parameters-card .parameter-field').nth(1).locator('input').first();
    await setFormInput(page, separatorInput, ' • ');
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06-act2a-formula-lotacao-cargo.png') });

    // Hide standalone `cargoNome` and `departamentoNome` columns in the list
    await setColumnVisibilityInList(page, 'cargoNome', false);
    await setColumnVisibilityInList(page, 'departamentoNome', false);

    // -------------------------------------------------------------------------
    // Act 2B: Reveal `Salário` (`salario`) and create `Projeção Anual` (`salario * 12`)
    // -------------------------------------------------------------------------
    console.log('5. Act 2B: Reveal Salário & create Calculated Column "Projeção Anual" (salario * 12)...');
    await setColumnVisibilityInList(page, 'salario', true);
    await selectColumnByField(page, 'salario');

    await demoClick(page, addCalculatedBtn, 550);
    await setFormInput(page, headerInput, 'Projeção Anual');

    // Set Data Type (`mat-form-field.data-type-input mat-select`) to `Moeda` (`currency`)
    const dataTypeSelect = page.locator('columns-config-editor .column-editor mat-form-field.data-type-input mat-select').first();
    await demoClick(page, dataTypeSelect, 380);
    const currencyOption = page
      .locator('.cdk-overlay-container mat-option')
      .filter({ hasText: /Moeda|Currency/i })
      .first();
    await demoClick(page, currencyOption, 420);

    // Formula Type: `Cálculo Numérico` (`arithmetic`)
    await demoClick(page, formulaTypeSelect, 380);
    const arithmeticOption = page
      .locator('.cdk-overlay-container mat-option')
      .filter({ hasText: /Cálculo Numérico|Arithmetic/i })
      .first();
    await demoClick(page, arithmeticOption, 420);

    // Operand 1 (Campo): ensure mode toggle is `field` (`Campo`) and select `salario`
    const paramFields = formulaBuilder.locator('.parameters-card .parameter-field');
    const operand1Field = paramFields.nth(0);
    const operand1FieldToggle = operand1Field.locator('mat-button-toggle[value="field"]').first();
    if (await operand1FieldToggle.isVisible().catch(() => false)) {
      const isFieldSelected = await operand1FieldToggle.evaluate((el) => el.classList.contains('mat-button-toggle-checked')).catch(() => false);
      if (!isFieldSelected) {
        await demoClick(page, operand1FieldToggle, 320);
      }
    }
    const operand1Select = operand1Field.locator('mat-select').first();
    await demoClick(page, operand1Select, 380);
    const salarioOption = page
      .locator('.cdk-overlay-container mat-option')
      .filter({ hasText: /Salário|salario/i })
      .first();
    await demoClick(page, salarioOption, 420);

    // Operator: `Multiplicação (×)`
    const operatorSelect = paramFields.nth(1).locator('mat-select').first();
    await demoClick(page, operatorSelect, 360);
    const multiplyOption = page
      .locator('.cdk-overlay-container mat-option')
      .filter({ hasText: /Multiplicação|×|\*/i })
      .first();
    await demoClick(page, multiplyOption, 400);

    // Operand 2: switch mode toggle to `Valor` (`literal`) and enter `12`
    const operand2Field = paramFields.nth(2);
    const literalToggle = operand2Field.locator('mat-button-toggle[value="literal"]').first();
    await demoClick(page, literalToggle, 360);

    const literalNumberInput = operand2Field.locator('.literal-input-container input[type="number"]').first();
    await setFormInput(page, literalNumberInput, '12');
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07-act2b-formula-projecao-anual.png') });

    // Save & inspect the table after Act 2 so viewer sees `Lotação & Cargo`, `Salário`, and `Projeção Anual`
    await saveAndCloseSettingsPanel(page, 'act2-calculated-columns');
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08-act2-result-calculated-columns-table.png') });
    await hoverAcrossTableRows(page, 4800);

    // =========================================================================
    // ACT 3: CONDITIONAL OVERRIDES ON STATUS CHIPS (`Ativo` -> Badges de Domínio)
    // =========================================================================
    console.log('6. Act 3: Conditional Overrides on "Ativo" column...');
    await openColumnsEditor(page);
    await selectColumnByField(page, 'ativo');

    const rulesPanel = await expandColumnSubPanelByIcon(page, 'rule');
    await sleep(350);

    const generateBadgesBtn = rulesPanel.locator('[data-testid="override-generate-domain-badges"]').first();
    await generateBadgesBtn.waitFor({ state: 'visible', timeout: 10000 });
    await demoClick(page, generateBadgesBtn, 600);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '09-act3-generated-domain-badges.png') });

    // Customize Rule 1 (`Sim` / `true`): variant `filled`, color `success`, icon `verified`
    const overrideItems = rulesPanel.locator('.cond-ov-item');
    await demoClick(page, overrideItems.nth(0), 380);

    const badgeVariantSelect = rulesPanel.locator('[data-testid="override-badge-variant"]').first();
    await demoClick(page, badgeVariantSelect, 350);
    const filledOption = page
      .locator('.cdk-overlay-container mat-option')
      .filter({ hasText: /Preenchido|Filled/i })
      .first();
    await demoClick(page, filledOption, 380);

    const badgeColorInput = rulesPanel.locator('[data-testid="override-badge-color"]').first();
    await setFormInput(page, badgeColorInput, 'success');

    const badgeIconInput = rulesPanel.locator('[data-testid="override-badge-icon"]').first();
    await setFormInput(page, badgeIconInput, 'verified');

    // Customize Rule 2 (`Não` / `false`): variant `soft`, color `danger`, icon `pause_circle`
    if ((await overrideItems.count()) > 1) {
      await demoClick(page, overrideItems.nth(1), 380);

      await demoClick(page, badgeVariantSelect, 350);
      const softOption = page
        .locator('.cdk-overlay-container mat-option')
        .filter({ hasText: /Suave|Soft/i })
        .first();
      await demoClick(page, softOption, 380);

      await setFormInput(page, badgeColorInput, 'danger');
      await setFormInput(page, badgeIconInput, 'pause_circle');
    }

    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '10-act3-configured-domain-badges.png') });

    // Save & close Settings Panel
    await saveAndCloseSettingsPanel(page, 'act3-conditional-badges');
    await sleep(600);

    // Exit Customization Mode so the final frames show the clean operational Workspace
    await moveCursorToLocator(page, toggleCustomBtn, 140);
    await toggleCustomBtn.click({ force: true, timeout: 10000 }).catch(() => {});
    await sleep(1000);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '11-final-transformed-funcionarios.png') });

    // Hover gently across the transformed rows so the viewer can admire the final table
    await hoverAcrossTableRows(page, 6500);
    await recorder.captureSyncKeyframe();

    await recorder.stop();
    await browser.close();
    browser = null;

    const mp4File = path.join(ARTIFACT_DIR, 'praxis-workspace-video-2-colunas-intencionais.mp4');
    console.log('7. Transcoding WebM to H.264 MP4 for universal LinkedIn/player compatibility...');
    await new Promise((resolve, reject) => {
      const mp4Proc = spawn(
        FFMPEG_PATH,
        [
          '-y',
          '-i', videoFile,
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '16',
          '-pix_fmt', 'yuv420p',
          '-r', '30',
          mp4File,
        ],
        { stdio: ['ignore', 'ignore', 'pipe'] }
      );
      mp4Proc.stderr.on('data', () => {});
      mp4Proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg mp4 transcode exited with code ${code}`));
      });
    }).catch((e) => console.warn('[warn] MP4 transcode skipped:', e.message));

    console.log('\n================================================================');
    console.log(' [SUCCESS] Video 2 (Colunas Intencionais - Clean, No Info Cards) Recorded!');
    console.log(` - WebM: ${videoFile}`);
    if (fs.existsSync(mp4File)) console.log(` - MP4:  ${mp4File}`);
    console.log('================================================================\n');
  } catch (err) {
    if (browser) {
      const contexts = browser.contexts();
      for (const ctx of contexts) {
        for (const p of ctx.pages()) {
          if (!p.isClosed()) {
            await p.screenshot({ path: path.join(ARTIFACT_DIR, '99-error-debug.png') }).catch(() => {});
          }
        }
      }
    }
    throw err;
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
