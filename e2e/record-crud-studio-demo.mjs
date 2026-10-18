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
const PROXY_TARGET = process.env.PAX_PROXY_TARGET || 'https://praxis-api-quickstart.onrender.com';
const PROXY_ORIGIN = process.env.PAX_PROXY_ORIGIN || 'http://localhost:4003';
const ARTIFACT_DIR = process.env.PAX_CRUD_ARTIFACT_DIR || path.join(PROJECT_ROOT, 'test-results', 'crud-studio-demo');
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
 * - Zero auto-scaling (1:1 pixel mapping with deviceScaleFactor=1)
 * - Captures quality=100 frames via CDP Page.startScreencast + keyframe sync snapshots
 * - Encodes directly to VP8 (.webm) with -screen-content-mode 1 -sharpness 7 -qmin 0 -qmax 6 -crf 4
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
      '-deadline', 'good',
      '-cpu-used', '2',
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
      quality: 100,
      maxWidth: this.width,
      maxHeight: this.height,
      everyNthFrame: 1
    });

    this.startWallSec = performance.now() / 1000;
    const initialJpeg = await this.page.screenshot({ type: 'jpeg', quality: 100, scale: 'css' });
    this.onFrame(initialJpeg);

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
    if (this.isStopped) return;
    try {
      const jpeg = await this.page.screenshot({ type: 'jpeg', quality: 100, scale: 'css' });
      this.onFrame(jpeg);
    } catch {}
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

function ensureDevServer() {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(PROXY_TARGET);
    const server = http.createServer((req, res) => {
      const reqUrl = req.url || '/';
      if (reqUrl.startsWith('/api') || reqUrl.startsWith('/schemas')) {
        const headers = { ...req.headers, host: targetUrl.host, origin: PROXY_ORIGIN, Origin: PROXY_ORIGIN };
        const proxyReq = (targetUrl.protocol === 'https:' ? https : http).request(
          {
            protocol: targetUrl.protocol,
            hostname: targetUrl.hostname,
            port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
            method: req.method,
            path: reqUrl,
            headers,
            rejectUnauthorized: false
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
            proxyRes.pipe(res);
          }
        );
        proxyReq.on('error', (err) => {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });
        req.pipe(proxyReq);
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

async function moveCursorToLocator(page, locator, pauseMs = 95) {
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

async function setFormInput(page, selectorOrLocator, value, { pauseMs = 70 } = {}) {
  const loc = typeof selectorOrLocator === 'string'
    ? page.locator(selectorOrLocator).first()
    : selectorOrLocator.first();
  await loc.waitFor({ state: 'visible', timeout: 10000 });
  await loc.evaluate((el) => el.scrollIntoView({ block: 'nearest', inline: 'nearest' })).catch(() => {});
  await moveCursorToLocator(page, loc, pauseMs);
  await loc.fill(String(value));
  await loc.dispatchEvent('input');
  await loc.dispatchEvent('change');
  await loc.blur();
}

async function selectMatOption(page, selectLocator, optionTextOrPredicate, { pauseBeforeClickMs = 120 } = {}) {
  await selectLocator.waitFor({ state: 'visible', timeout: 10000 });
  await selectLocator.evaluate((el) => el.scrollIntoView({ block: 'nearest', inline: 'nearest' })).catch(() => {});
  await moveCursorToLocator(page, selectLocator, 80);
  await selectLocator.click({ force: true });
  await sleep(240);
  const options = page.locator('.cdk-overlay-container mat-option');
  await options.first().waitFor({ state: 'visible', timeout: 10000 });
  if (pauseBeforeClickMs > 0) {
    await sleep(pauseBeforeClickMs);
  }
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const opt = options.nth(i);
    const text = (await opt.innerText()).trim();
    const valAttr = (await opt.getAttribute('value')) || '';
    const matches = typeof optionTextOrPredicate === 'function'
      ? optionTextOrPredicate(text, valAttr)
      : text.toLowerCase().includes(String(optionTextOrPredicate).toLowerCase()) ||
        valAttr.toLowerCase() === String(optionTextOrPredicate).toLowerCase();
    if (matches) {
      await moveCursorToLocator(page, opt, 70);
      await opt.click();
      await sleep(220);
      return text;
    }
  }
  const allTexts = [];
  for (let i = 0; i < count; i++) {
    allTexts.push((await options.nth(i).innerText()).trim());
  }
  throw new Error(`Could not find mat-option matching ${optionTextOrPredicate}. Available: ${JSON.stringify(allTexts)}`);
}

async function setSlideToggle(page, selectorOrLocator, desiredChecked) {
  const toggle = typeof selectorOrLocator === 'string'
    ? page.locator(selectorOrLocator).first()
    : selectorOrLocator.first();
  await toggle.waitFor({ state: 'visible', timeout: 10000 });
  await toggle.evaluate((el) => el.scrollIntoView({ block: 'nearest', inline: 'nearest' })).catch(() => {});
  const button = toggle.locator('button[role="switch"]');
  const isChecked = (await button.getAttribute('aria-checked')) === 'true';
  if (isChecked !== desiredChecked) {
    await moveCursorToLocator(page, toggle, 80);
    await toggle.click();
    await sleep(200);
  }
}

async function dismissStrayBackdrops(page) {
  for (let i = 0; i < 4; i++) {
    const backdrop = page.locator('.cdk-overlay-transparent-backdrop.cdk-overlay-backdrop-showing');
    if ((await backdrop.count()) === 0) break;
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(150);
    if ((await backdrop.count()) > 0) {
      await backdrop.first().click({ force: true }).catch(() => {});
      await sleep(150);
    }
  }
}

async function setDemoStage(page, stepNum, totalSteps, stepBadge, title, detail) {
  await page.evaluate(
    ({ stepNum, totalSteps, stepBadge, title, detail }) => {
      const hud = document.getElementById('praxis-demo-hud');
      if (!hud) return;
      const badgeEl = hud.querySelector('.praxis-demo-badge');
      const titleEl = hud.querySelector('.praxis-demo-title');
      const detailEl = hud.querySelector('.praxis-demo-detail');
      const fillEl = hud.querySelector('.praxis-demo-progress-fill');
      if (badgeEl) badgeEl.textContent = stepBadge;
      if (titleEl) titleEl.textContent = title;
      if (detailEl) detailEl.textContent = detail;
      if (fillEl && totalSteps > 0) {
        const pct = Math.min(100, Math.max(8, Math.round((stepNum / totalSteps) * 100)));
        fillEl.style.width = `${pct}%`;
      }
    },
    { stepNum, totalSteps, stepBadge, title, detail }
  ).catch(() => {});
}

async function saveAndCloseSettingsPanel(page, label = '') {
  const saveBtn = page.locator('[data-testid="settings-panel-save"]').last();
  const applyBtn = page.locator('[data-testid="settings-panel-apply"]').last();
  await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
  await sleep(300);

  if (!(await applyBtn.isDisabled())) {
    await moveCursorToLocator(page, applyBtn, 90);
    await applyBtn.click();
    console.log(`  [ok] Applied settings panel for ${label}`);
    await sleep(450);
  }

  if (!(await saveBtn.isDisabled())) {
    await moveCursorToLocator(page, saveBtn, 90);
    await saveBtn.click();
    console.log(`  [ok] Saved & closed settings panel for ${label}`);
    await sleep(450);
    return;
  }

  const closeIcon = page.locator('[data-testid="settings-panel-close-icon"]').last();
  if (await closeIcon.isVisible()) {
    await moveCursorToLocator(page, closeIcon, 70);
    await closeIcon.click({ force: true });
    await sleep(400);
  }
}

async function connectResourceInCrudEditor(page, resourcePath) {
  const rqc = page.locator('[data-testid="crud-editor-resource-path"]');
  await rqc.waitFor({ state: 'visible', timeout: 10000 });

  // Wait up to 8s for catalog to load
  for (let i = 0; i < 40; i++) {
    const loadingCount = await rqc.locator('.pdx-quick-connect__status').count();
    const hasSelect = (await rqc.locator('mat-select').count()) > 0;
    const hasSearch = (await rqc.locator('[data-testid="quick-connect-search-input"]').count()) > 0;
    if (hasSelect || hasSearch || loadingCount === 0) break;
    await sleep(200);
  }

  const matSelect = rqc.locator('mat-select').first();
  const searchInput = rqc.locator('[data-testid="quick-connect-search-input"]').first();

  if (await matSelect.isVisible().catch(() => false)) {
    await selectMatOption(
      page,
      matSelect,
      (txt, val) =>
        txt.toLowerCase().includes('funcion') ||
        txt.toLowerCase().includes('herói') ||
        txt.toLowerCase().includes('heroi') ||
        txt.toLowerCase().includes(resourcePath.toLowerCase()) ||
        val.toLowerCase().includes(resourcePath.toLowerCase()),
      { pauseBeforeClickMs: 300 }
    );
  } else if (await searchInput.isVisible().catch(() => false)) {
    await setFormInput(page, searchInput, 'funcionarios');
    await sleep(350);
    const optBtn = rqc
      .locator('.pdx-quick-connect__option-item')
      .filter({ hasText: /funcionarios|Funcionários|Heróis/i })
      .first();
    if (await optBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, optBtn, 90);
      await optBtn.click();
      await sleep(300);
    }
  }

  // Also ensure the advanced resourcePath input has the exact canonical path
  const details = rqc.locator('details.pdx-quick-connect__advanced');
  if (await details.isVisible().catch(() => false)) {
    const isOpen = await details.evaluate((el) => el.hasAttribute('open'));
    if (!isOpen) {
      const summary = details.locator('summary');
      await moveCursorToLocator(page, summary, 70);
      await summary.click();
      await sleep(200);
    }
    const pathInput = details.locator('input[matinput]').first();
    if (await pathInput.isVisible().catch(() => false)) {
      const currentVal = await pathInput.inputValue();
      if (currentVal.trim() !== resourcePath) {
        await setFormInput(page, pathInput, resourcePath);
        await sleep(300);
      }
    }
  }
}

async function convertWebmToMp4(webmPath, mp4Path) {
  console.log(`[ffmpeg] Converting ${webmPath} -> ${mp4Path} (H.264 High Profile 1080p @ 30fps)...`);
  await new Promise((resolve, reject) => {
    const proc = spawn(
      FFMPEG_PATH,
      [
        '-y',
        '-i', webmPath,
        '-c:v', 'libx264',
        '-profile:v', 'high',
        '-pix_fmt', 'yuv420p',
        '-crf', '16',
        '-preset', 'fast',
        '-movflags', '+faststart',
        mp4Path
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg mp4 conversion exited with ${code}: ${stderr}`));
    });
  });
  console.log(`[ffmpeg] Created ${mp4Path}`);
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

    console.log('0. Pre-warming /crud-studio in a non-recorded context to eliminate initial blank frame and warm up API schemas...');
    const warmContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const warmPage = await warmContext.newPage();
    await warmPage.goto(`${BASE_URL}/crud-studio`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await warmPage.locator('[data-testid="toggle-customization-btn"]').waitFor({ state: 'visible', timeout: 15000 });
    await sleep(600);
    await warmContext.close();

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });

    await context.addInitScript(() => {
      if (!sessionStorage.getItem('__praxis_crud_demo_cleaned')) {
        sessionStorage.setItem('__praxis_crud_demo_cleaned', '1');
        for (const k of Object.keys(localStorage)) {
          if (
            k.includes('studio-funcionarios') ||
            k.includes('human-resources-funcionarios') ||
            k.includes('crud-authoring:') ||
            k.includes('crud-overrides:')
          ) {
            localStorage.removeItem(k);
          }
        }
      }

      const installDemoOverlay = () => {
        if (document.getElementById('praxis-demo-hud')) return;
        const style = document.createElement('style');
        style.textContent = `
          .cdk-overlay-backdrop,
          .cdk-overlay-dark-backdrop,
          .mat-drawer-backdrop,
          .studio-backdrop {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            background: rgba(6, 10, 20, 0.28) !important;
          }
          #praxis-demo-hud {
            position: fixed;
            bottom: 8px;
            left: 276px;
            z-index: 2147483645;
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 680px;
            max-width: 1120px;
            padding: 7px 14px 6px;
            border-radius: 12px;
            background: rgba(8, 13, 25, 0.96);
            border: 1px solid rgba(56, 189, 248, 0.55);
            box-shadow: 0 14px 36px rgba(0, 0, 0, 0.72), 0 0 22px rgba(56, 189, 248, 0.24);
            color: #f8fafc;
            font-family: Inter, system-ui, sans-serif;
            pointer-events: none;
            transition: all 0.25s ease;
          }
          #praxis-demo-hud .praxis-demo-row {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          #praxis-demo-hud .praxis-demo-badge {
            background: linear-gradient(135deg, #0284c7, #38bdf8);
            color: #082f49;
            font-weight: 800;
            font-size: 11px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: 6px;
            white-space: nowrap;
          }
          #praxis-demo-hud .praxis-demo-title {
            font-weight: 700;
            font-size: 13.5px;
            color: #f1f5f9;
            white-space: nowrap;
          }
          #praxis-demo-hud .praxis-demo-detail {
            font-size: 12px;
            color: #cbd5e1;
            border-left: 1px solid rgba(148, 163, 184, 0.35);
            padding-left: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          #praxis-demo-hud .praxis-demo-timer {
            margin-left: auto;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            font-weight: 700;
            color: #38bdf8;
            background: rgba(56, 189, 248, 0.14);
            border: 1px solid rgba(56, 189, 248, 0.35);
            padding: 3px 9px;
            border-radius: 6px;
            white-space: nowrap;
          }
          #praxis-demo-hud .praxis-demo-progress-track {
            width: 100%;
            height: 4px;
            background: rgba(148, 163, 184, 0.2);
            border-radius: 999px;
            overflow: hidden;
          }
          #praxis-demo-hud .praxis-demo-progress-fill {
            width: 10%;
            height: 100%;
            background: linear-gradient(90deg, #0ea5e9, #38bdf8, #10b981);
            border-radius: 999px;
            transition: width 0.35s ease;
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
            transition: transform 0.14s cubic-bezier(0.22, 1, 0.36, 1);
            filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.65)) drop-shadow(0 0 8px rgba(56, 189, 248, 0.55));
          }
          .praxis-click-ripple {
            position: fixed;
            width: 32px;
            height: 32px;
            margin-left: -16px;
            margin-top: -16px;
            border-radius: 50%;
            border: 2.5px solid #38bdf8;
            background: rgba(56, 189, 248, 0.32);
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

        const hud = document.createElement('div');
        hud.id = 'praxis-demo-hud';
        hud.innerHTML = `
          <div class="praxis-demo-row">
            <span class="praxis-demo-badge">ETAPA 1/8 · CRUD DO ZERO</span>
            <span class="praxis-demo-title">Estúdio CRUD (/crud-studio)</span>
            <span class="praxis-demo-detail">Autoria 100% Zero-Code & Zero-Deploy · Full HD 1080p @ 30 FPS</span>
            <span class="praxis-demo-timer" id="praxis-demo-timer">⏱ 00:00</span>
          </div>
          <div class="praxis-demo-progress-track">
            <div class="praxis-demo-progress-fill"></div>
          </div>
        `;
        document.body.appendChild(hud);

        const cursor = document.createElement('div');
        cursor.id = 'praxis-demo-cursor';
        cursor.innerHTML = `
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 3L12.5 24L15.8 15.8L24 12.5L4 3Z" fill="#38BDF8" stroke="#082F49" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="4" cy="3" r="2.5" fill="#F8FAFC"/>
          </svg>
        `;
        document.body.appendChild(cursor);

        if (!sessionStorage.getItem('__praxis_crud_demo_t0')) {
          sessionStorage.setItem('__praxis_crud_demo_t0', String(Date.now()));
        }
        setInterval(() => {
          const t0 = Number(sessionStorage.getItem('__praxis_crud_demo_t0') || Date.now());
          const sec = Math.max(0, Math.floor((Date.now() - t0) / 1000));
          const mm = String(Math.floor(sec / 60)).padStart(2, '0');
          const ss = String(sec % 60).padStart(2, '0');
          const timerEl = document.getElementById('praxis-demo-timer');
          if (timerEl) timerEl.textContent = `⏱ ${mm}:${ss}`;
          if (hud.parentNode === document.body && document.body.lastElementChild !== cursor) {
            document.body.appendChild(hud);
            document.body.appendChild(cursor);
          }
        }, 250);

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
            document.body.appendChild(ripple);
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
        document.addEventListener('DOMContentLoaded', installDemoOverlay);
      } else {
        installDemoOverlay();
      }
    });

    const page = await context.newPage();

    console.log('1. Navigating to /crud-studio (blank CRUD page)...');
    await page.goto(`${BASE_URL}/crud-studio`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('[data-testid="toggle-customization-btn"]').waitFor({ state: 'visible', timeout: 15000 });
    await page.evaluate(() => sessionStorage.setItem('__praxis_crud_demo_t0', String(Date.now())));

    await setDemoStage(
      page,
      1,
      8,
      'ETAPA 1/8 · CRUD EM BRANCO',
      'Página CRUD sem Recurso (/crud-studio)',
      'Iniciando do zero absoluto · Ativando modo de customização visual'
    );

    const videoFile = path.join(ARTIFACT_DIR, 'praxis-crud-studio-zero-deploy-demo.webm');
    const mp4File = path.join(ARTIFACT_DIR, 'praxis-crud-studio-zero-deploy-demo.mp4');
    const recorder = new HighFidelityVideoRecorder(page, videoFile, { width: 1920, height: 1080, fps: 30 });
    await recorder.start();

    await sleep(900);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-blank-crud-studio.png') });

    // Enable Customization Mode
    const toggleCustomBtn = page.locator('[data-testid="toggle-customization-btn"]');
    await moveCursorToLocator(page, toggleCustomBtn, 120);
    await toggleCustomBtn.click();
    await sleep(600);
    await recorder.captureSyncKeyframe();

    // Click "Configurar página" on PraxisResourcePage header (or empty state action)
    const configPageBtn = page.locator('[data-testid="resource-page-configure-btn"]');
    await configPageBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, configPageBtn, 120);
    await configPageBtn.click();

    const crudEditor = page.locator('[data-testid="crud-metadata-editor"]');
    await crudEditor.waitFor({ state: 'visible', timeout: 10000 });
    await sleep(500);
    await recorder.captureSyncKeyframe();

    // =========================================================================
    // STAGE 2: Connect Resource & Customize Opening Mode / Header / Actions
    // =========================================================================
    console.log('2. Connecting to human-resources/funcionarios and customizing Opening Mode & Actions...');
    await setDemoStage(
      page,
      2,
      8,
      'ETAPA 2/8 · CONEXÃO & ABERTURA',
      'Quick Connect + Modo de Abertura (Modal / Gaveta)',
      'Conectando human-resources/funcionarios e configurando apresentação modal e ações'
    );

    await connectResourceInCrudEditor(page, 'human-resources/funcionarios');
    await setFormInput(page, '[data-testid="crud-editor-resource-idField"]', 'id');
    await sleep(600);

    // Wait briefly for schema columns to resolve in background
    for (let i = 0; i < 30; i++) {
      const tableText = await page.locator('[data-testid="crud-editor-overview-table"]').innerText().catch(() => '');
      if (tableText && !tableText.startsWith('0 ')) break;
      await sleep(200);
    }
    await recorder.captureSyncKeyframe();

    // Switch to Tab 1: Opening / Defaults
    const tabDefaults = page.locator('[data-testid="crud-editor-tab-defaults"]');
    await moveCursorToLocator(page, tabDefaults, 100);
    await tabDefaults.click();
    await sleep(400);

    await selectMatOption(
      page,
      page.locator('[data-testid="crud-editor-defaults-openMode"]'),
      (txt, val) => val === 'modal' || txt.toLowerCase().includes('modal')
    );
    await setFormInput(page, '[data-testid="crud-editor-header-backLabel"]', 'Voltar ao Catálogo');
    await selectMatOption(
      page,
      page.locator('[data-testid="crud-editor-header-variant"]'),
      (txt, val) => val === 'tonal' || txt.toLowerCase().includes('tonal')
    );
    await setSlideToggle(page, '[data-testid="crud-editor-header-sticky"]', true);
    await setSlideToggle(page, '[data-testid="crud-editor-header-divider"]', true);
    await setSlideToggle(page, '[data-testid="crud-editor-modal-canMaximize"]', true);
    await setSlideToggle(page, '[data-testid="crud-editor-modal-rememberLastState"]', true);
    await setSlideToggle(page, '[data-testid="crud-editor-back-confirmOnDirty"]', true);
    await sleep(500);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-crud-resource-and-opening.png') });

    // Switch to Tab 2: Actions (inspect canonical actions)
    const tabActions = page.locator('[data-testid="crud-editor-tab-actions"]');
    await moveCursorToLocator(page, tabActions, 100);
    await tabActions.click();
    await sleep(500);
    for (const actionKey of ['create', 'view', 'edit']) {
      const header = page.locator(`[data-testid="crud-editor-action-${actionKey}-panel-header"]`);
      if (await header.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, header, 90);
        await header.click();
        await sleep(300);
      }
    }
    await sleep(400);
    await recorder.captureSyncKeyframe();

    // =========================================================================
    // STAGE 3: Author KPI Band (4 Executive Cards with Interactive Click Filters)
    // =========================================================================
    console.log('3. Authoring KPI Band with 4 interactive cards...');
    await setDemoStage(
      page,
      3,
      8,
      'ETAPA 3/8 · FAIXA DE KPIs',
      'Autoria Visual da Faixa Executiva de KPIs (PraxisKpiBand)',
      'Criando 4 indicadores semânticos com filtros interativos ao clicar'
    );

    const tabKpis = page.locator('[data-testid="crud-editor-tab-kpis"]');
    await moveCursorToLocator(page, tabKpis, 100);
    await tabKpis.click();
    await sleep(400);

    await setSlideToggle(page, '[data-testid="crud-kpi-band-enabled"]', true);

    const kpiDefinitions = [
      {
        label: 'Efetivo Tático Total',
        value: '20 Heróis',
        caption: 'Clique para exibir todo o efetivo (Limpar filtro)',
        icon: 'groups',
        variant: 'primary',
        filterMode: 'clear'
      },
      {
        label: 'Prontidão Ativa',
        value: '18 Ativos',
        caption: 'Clique para filtrar heróis ativos em campo',
        icon: 'verified_user',
        variant: 'success',
        filterMode: 'condition',
        filterField: 'ativo',
        filterValue: 'true'
      },
      {
        label: 'Reserva / Inativos',
        value: '2 Reserva',
        caption: 'Clique para filtrar agentes fora de escala',
        icon: 'person_off',
        variant: 'warning',
        filterMode: 'condition',
        filterField: 'ativo',
        filterValue: 'false'
      },
      {
        label: 'Reputação Média HQ',
        value: '96.4%',
        caption: 'Índice global de eficiência operacional',
        icon: 'military_tech',
        variant: 'primary',
        filterMode: 'none'
      }
    ];

    const addKpiBtn = page.locator('[data-testid="crud-kpi-add-card-btn"]');
    for (let i = 0; i < kpiDefinitions.length; i++) {
      const def = kpiDefinitions[i];
      await moveCursorToLocator(page, addKpiBtn, 80);
      await addKpiBtn.click();
      await sleep(220);

      await setFormInput(page, `[data-testid="crud-kpi-card-label-${i}"]`, def.label);
      await setFormInput(page, `[data-testid="crud-kpi-card-value-${i}"]`, def.value);
      await setFormInput(page, `[data-testid="crud-kpi-card-caption-${i}"]`, def.caption);
      await setFormInput(page, `[data-testid="crud-kpi-card-icon-${i}"]`, def.icon);
      await selectMatOption(
        page,
        page.locator(`[data-testid="crud-kpi-card-variant-${i}"]`),
        (txt, val) => val === def.variant || txt.toLowerCase().includes(def.variant)
      );
      await selectMatOption(
        page,
        page.locator(`[data-testid="crud-kpi-card-filter-mode-${i}"]`),
        (txt, val) => val === def.filterMode || txt.toLowerCase().includes(def.filterMode)
      );

      if (def.filterMode === 'condition') {
        await setFormInput(page, `[data-testid="crud-kpi-card-filter-field-${i}"]`, def.filterField);
        await setFormInput(page, `[data-testid="crud-kpi-card-filter-value-${i}"]`, def.filterValue);
      }
    }

    const kpiPreview = page.locator('[data-testid="crud-kpi-band-preview"]');
    if (await kpiPreview.isVisible().catch(() => false)) {
      await kpiPreview.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' })).catch(() => {});
    }
    await sleep(600);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-crud-kpi-band-authored.png') });

    // =========================================================================
    // STAGE 4: Author Filter Bar (Pinned Inline Fields + Custom Quick Filter Chips)
    // =========================================================================
    console.log('4. Authoring Filter Bar (inline fields + quick filter chips)...');
    await setDemoStage(
      page,
      4,
      8,
      'ETAPA 4/8 · BARRA DE FILTROS & CHIPS',
      'Campos Fixados (Inline Fields) + Atalhos Rápidos (Quick Filters)',
      'Fixando busca por Nome/Codinome/E-mail e criando chips de filtro rápido'
    );

    const tabFilters = page.locator('[data-testid="crud-editor-tab-filters"]');
    await moveCursorToLocator(page, tabFilters, 100);
    await tabFilters.click();
    await sleep(400);

    await setSlideToggle(page, '[data-testid="crud-filterbar-show-advanced"]', true);

    for (const inlineField of ['nomeCompleto', 'codinome', 'email']) {
      const suggestionBtn = page.locator(`[data-testid="crud-filterbar-available-field-${inlineField}"]`);
      if (await suggestionBtn.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, suggestionBtn, 80);
        await suggestionBtn.click();
        await sleep(180);
      } else {
        await setFormInput(page, '[data-testid="crud-filterbar-inline-field-input"]', inlineField);
        const addFieldBtn = page.locator('[data-testid="crud-filterbar-inline-field-add-btn"]');
        await moveCursorToLocator(page, addFieldBtn, 70);
        await addFieldBtn.click();
        await sleep(180);
      }
    }

    await selectMatOption(
      page,
      page.locator('[data-testid="crud-filterbar-quick-mode"]'),
      (txt, val) => val === 'custom' || txt.toLowerCase().includes('personaliz') || txt.toLowerCase().includes('custom')
    );

    const quickFilters = [
      { id: 'qf-all', label: 'Todos os Agentes', icon: 'groups', mode: 'clear' },
      { id: 'qf-active', label: 'Ativos em Prontidão', icon: 'bolt', mode: 'fieldEquals', field: 'ativo', value: 'true' },
      { id: 'qf-reserve', label: 'Reserva Tática', icon: 'shield', mode: 'fieldEquals', field: 'ativo', value: 'false' }
    ];

    const addQuickBtn = page.locator('[data-testid="crud-filterbar-add-quick-btn"]');
    for (let i = 0; i < quickFilters.length; i++) {
      const qf = quickFilters[i];
      await moveCursorToLocator(page, addQuickBtn, 80);
      await addQuickBtn.click();
      await sleep(220);

      await setFormInput(page, `[data-testid="crud-filterbar-quick-id-${i}"]`, qf.id);
      await setFormInput(page, `[data-testid="crud-filterbar-quick-label-${i}"]`, qf.label);
      await setFormInput(page, `[data-testid="crud-filterbar-quick-icon-${i}"]`, qf.icon);
      await selectMatOption(
        page,
        page.locator(`[data-testid="crud-filterbar-quick-condition-mode-${i}"]`),
        (txt, val) => val === qf.mode || txt.toLowerCase().includes(qf.mode.toLowerCase())
      );

      if (qf.mode === 'fieldEquals') {
        await setFormInput(page, `[data-testid="crud-filterbar-quick-field-${i}"]`, qf.field);
        await setFormInput(page, `[data-testid="crud-filterbar-quick-value-${i}"]`, qf.value);
      }
    }

    await sleep(500);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-crud-filterbar-authored.png') });

    // =========================================================================
    // STAGE 5: Customize Table Structure, Toolbar & Columns (Presets, Formats, Widths)
    // =========================================================================
    console.log('5. Customizing Table Toolbar, Behavior, and Columns...');
    await setDemoStage(
      page,
      5,
      8,
      'ETAPA 5/8 · TABELA & COLUNAS',
      'Customizando Barra de Ferramentas, Colunas, Formatação e Renderers',
      'Configurando avatar composto, chips de status, moeda e larguras das colunas'
    );

    const tabTable = page.locator('[data-testid="crud-editor-tab-table"]');
    await moveCursorToLocator(page, tabTable, 100);
    await tabTable.click();
    await sleep(450);

    await setFormInput(
      page,
      '[data-testid="table-inline-editor-toolbar-title"]',
      'Efetivo Tático S.H.I.E.L.D. — Gestão Operacional de Heróis'
    );
    await setFormInput(
      page,
      '[data-testid="table-inline-editor-toolbar-subtitle"]',
      'Catálogo governado em tempo real · KPIs interativos, filtros rápidos e formulários customizados'
    );
    await setFormInput(page, '[data-testid="table-inline-editor-toolbar-icon"]', 'shield_person');

    // Expand Columns editor via "Editar colunas do recurso" button
    const focusColumnsBtn = page.locator('[data-testid="crud-table-focus-columns-btn"]');
    if (await focusColumnsBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, focusColumnsBtn, 100);
      await focusColumnsBtn.click();
      await sleep(500);
    } else {
      const colsPanelHeader = page.locator('[data-testid="table-inline-editor-columns-panel"] mat-expansion-panel-header');
      await moveCursorToLocator(page, colsPanelHeader, 100);
      await colsPanelHeader.click();
      await sleep(500);
    }

    const colsEditor = page.locator('columns-config-editor');
    await colsEditor.waitFor({ state: 'visible', timeout: 10000 });

    const customizeColumnByField = async (fieldName, { header, width, align, dataType, composePreset }) => {
      const colItem = colsEditor
        .locator('.column-item')
        .filter({ has: page.locator('.column-field', { hasText: new RegExp(`^${fieldName}$`) }) })
        .first();
      if ((await colItem.count()) === 0) return false;

      await colItem.evaluate((el) => el.scrollIntoView({ block: 'nearest' })).catch(() => {});
      await moveCursorToLocator(page, colItem, 80);
      await colItem.click();
      await sleep(220);

      if (header) {
        await setFormInput(page, colsEditor.locator('input[name="header"]'), header);
      }
      if (width) {
        await setFormInput(page, colsEditor.locator('input[name="width"]'), width);
      }
      if (align) {
        const alignToggle = colsEditor.locator(`mat-button-toggle-group[name="align"] mat-button-toggle[value="${align}"] button`);
        if (await alignToggle.isVisible().catch(() => false)) {
          await moveCursorToLocator(page, alignToggle, 70);
          await alignToggle.click();
          await sleep(160);
        }
      }
      if (dataType) {
        const dtSelect = colsEditor.locator('mat-select[name="dataType"]');
        if (await dtSelect.isVisible().catch(() => false)) {
          await selectMatOption(page, dtSelect, (txt, val) => val === dataType || txt.toLowerCase().includes(dataType));
        }
      }
      if (composePreset) {
        const rendererPanel = colsEditor.locator('mat-expansion-panel').filter({ hasText: /Renderiza|Cell rendering|photo_filter/i }).first();
        if (await rendererPanel.isVisible().catch(() => false)) {
          const isExpanded = await rendererPanel.evaluate((el) => el.classList.contains('mat-expanded'));
          if (!isExpanded) {
            const rHeader = rendererPanel.locator('mat-expansion-panel-header');
            await moveCursorToLocator(page, rHeader, 80);
            await rHeader.click();
            await sleep(280);
          }
          const presetBtn = rendererPanel.locator('.compose-preset-actions button').filter({ hasText: composePreset }).first();
          if (await presetBtn.isVisible().catch(() => false)) {
            await moveCursorToLocator(page, presetBtn, 85);
            await presetBtn.click();
            await sleep(260);
          }
        }
      }
      return true;
    };

    await customizeColumnByField('nomeCompleto', {
      header: 'Herói / Nome Completo',
      width: '250px',
      composePreset: /Pessoa com avatar|Person with avatar/i
    });
    await customizeColumnByField('codinome', {
      header: 'Codinome Tático',
      width: '170px'
    });
    await customizeColumnByField('cargoNome', {
      header: 'Patente / Especialidade',
      width: '190px'
    });
    await customizeColumnByField('departamentoNome', {
      header: 'Divisão Operacional',
      width: '180px'
    });
    await customizeColumnByField('salario', {
      header: 'Subsídio Mensal',
      width: '150px',
      align: 'right',
      dataType: 'currency'
    });
    await customizeColumnByField('ativo', {
      header: 'Prontidão',
      width: '130px',
      align: 'center',
      composePreset: /Chip de status|Status chip/i
    });

    await sleep(500);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-crud-table-columns-authored.png') });

    // Save & close CRUD Metadata Editor
    await saveAndCloseSettingsPanel(page, 'crud-metadata-editor');

    // Wait for the live CRUD page to materialize KPI Band, Filter Bar, and Table rows
    console.log('   Waiting for live CRUD page to render KPI Band, ScopeBar, and Table rows...');
    await page.locator('praxis-crud [data-testid="crud-kpi-band"]').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first().waitFor({ state: 'visible', timeout: 20000 });
    await sleep(900);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06-crud-page-materialized.png') });

    // =========================================================================
    // STAGE 6: Customize the Dynamic Form Layout Inside the CRUD Modal
    // =========================================================================
    console.log('6. Opening CRUD form in Modal and customizing Form Layout (Sections, Columns, Visual Blocks)...');
    await setDemoStage(
      page,
      6,
      8,
      'ETAPA 6/8 · CUSTOMIZAÇÃO DO FORMULÁRIO',
      'Editor Visual de Formulário Dinâmico (PraxisDynamicFormConfigEditor)',
      'Organizando seções multi-colunas, cabeçalhos executivos e blocos visuais sem código'
    );

    // Click the Edit action on the first row (or Toolbar Create button) to open the form modal
    const firstRow = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first();
    await firstRow.waitFor({ state: 'visible', timeout: 15000 });
    await moveCursorToLocator(page, firstRow, 90);

    // Trigger 'edit' action on the first row via row action button or menu
    const editRowBtn = firstRow.locator('button[data-action-id="edit"], button[aria-label*="Editar"], button[mattooltip*="Editar"]').first();
    if (await editRowBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, editRowBtn, 90);
      await editRowBtn.click();
    } else {
      const moreMenuBtn = firstRow.locator('td.mat-column-actions button, button[aria-haspopup="menu"]').first();
      await moveCursorToLocator(page, moreMenuBtn, 90);
      await moreMenuBtn.click();
      await sleep(250);
      const editMenuItem = page.locator('.cdk-overlay-container [role="menuitem"]').filter({ hasText: /Editar|Edit/i }).first();
      await moveCursorToLocator(page, editMenuItem, 80);
      await editMenuItem.click();
    }

    // Wait for DynamicFormDialogHostComponent modal to appear
    const formDialog = page.locator('mat-dialog-container praxis-dynamic-form').first();
    await formDialog.waitFor({ state: 'visible', timeout: 15000 });
    await sleep(800);
    await recorder.captureSyncKeyframe();

    // Click the Customize Form gear button (.customize-btn) inside the modal form!
    const customizeFormBtn = formDialog.locator('button.customize-btn');
    await customizeFormBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, customizeFormBtn, 110);
    await customizeFormBtn.click();

    const formConfigEditor = page.locator('praxis-dynamic-form-config-editor');
    await formConfigEditor.waitFor({ state: 'visible', timeout: 10000 });
    await sleep(500);
    await recorder.captureSyncKeyframe();

    // Switch to the "Layout" tab in PraxisDynamicFormConfigEditor
    const layoutTab = formConfigEditor.locator('.mat-mdc-tab').filter({ hasText: /Layout/i }).first();
    await moveCursorToLocator(page, layoutTab, 100);
    await layoutTab.click();
    await sleep(500);

    const layoutEditor = formConfigEditor.locator('praxis-layout-editor');
    await layoutEditor.waitFor({ state: 'visible', timeout: 10000 });

    // Rename the first section using the inline section rename button
    const renameTrigger = layoutEditor.locator('[data-testid="section-rename-trigger"]').first();
    if (await renameTrigger.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, renameTrigger, 90);
      await renameTrigger.click();
      await sleep(200);
      const renameInput = layoutEditor.locator('[data-testid="section-rename-input"]').first();
      if (await renameInput.isVisible().catch(() => false)) {
        await renameInput.fill('Dossiê Tático & Identificação S.H.I.E.L.D.');
        await renameInput.press('Enter');
        await sleep(300);
      }
    }

    // Toggle Cozy/Regular density and borders in the layout editor toolbar to demonstrate visual controls
    const densityRegularBtn = layoutEditor.locator('mat-button-toggle[value="regular"] button').first();
    if (await densityRegularBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, densityRegularBtn, 80);
      await densityRegularBtn.click();
      await sleep(250);
    }

    // Open the first row's menu and apply a 2-column (6/6) preset or add a Callout visual block
    const firstRowActions = layoutEditor.locator('[data-testid="layout-row-actions"]').first();
    if (await firstRowActions.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, firstRowActions, 90);
      await firstRowActions.click();
      await sleep(280);
      const twoColPreset = page.locator('.cdk-overlay-container [role="menuitem"]').filter({ hasText: /6.*6|1\/2|Duas/i }).first();
      if (await twoColPreset.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, twoColPreset, 80);
        await twoColPreset.click();
        await sleep(300);
      } else {
        await page.keyboard.press('Escape');
      }
    }

    await sleep(500);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07-crud-form-layout-editor.png') });

    // Now let's also refine the form's sections in the JSON tab so every field of human-resources/funcionarios
    // is organized into 3 executive multi-column sections with a rich Callout visual block at the top!
    const jsonTab = formConfigEditor.locator('.mat-mdc-tab').filter({ hasText: /^JSON$/i }).first();
    if (await jsonTab.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, jsonTab, 90);
      await jsonTab.click();
      await sleep(400);

      const jsonTextarea = formConfigEditor.locator('form-json-config-editor textarea').first();
      if (await jsonTextarea.isVisible().catch(() => false)) {
        const rawDocText = await jsonTextarea.inputValue();
        try {
          const doc = JSON.parse(rawDocText);
          const cfg = doc.config || doc;
          const allFieldNames = (cfg.fieldMetadata || [])
            .filter((f) => !f.formHidden && f.name !== 'id')
            .map((f) => f.name);

          const pick = (candidates) => candidates.filter((c) => allFieldNames.includes(c));
          const used = new Set();
          const takeFields = (candidates) => {
            const matched = pick(candidates).filter((f) => !used.has(f));
            matched.forEach((f) => used.add(f));
            return matched;
          };

          const sec1Row1Left = takeFields(['nomeCompleto', 'codinome']);
          const sec1Row1Right = takeFields(['matricula', 'ativo']);
          const sec1Row2Left = takeFields(['email', 'telefone']);
          const sec1Row2Right = takeFields(['cpf', 'dataNascimento']);

          const sec2Row1Left = takeFields(['cargoId', 'cargoNome', 'cargo']);
          const sec2Row1Right = takeFields(['departamentoId', 'departamentoNome', 'departamento']);
          const sec2Row2Left = takeFields(['salario', 'dataAdmissao']);
          const sec2Row2Right = takeFields(['reputacao', 'nivelAcesso', 'status']);

          const remaining = allFieldNames.filter((f) => !used.has(f));
          const half = Math.ceil(remaining.length / 2);
          const sec3Left = remaining.slice(0, half);
          const sec3Right = remaining.slice(half);

          const buildTwoColRow = (id, leftFields, rightFields) => ({
            id,
            gap: 16,
            rowGap: 12,
            columns: [
              { id: `${id}-c1`, span: 6, fields: leftFields },
              { id: `${id}-c2`, span: 6, fields: rightFields }
            ].filter((c) => c.fields.length > 0)
          });

          const calloutItem = {
            kind: 'richContent',
            id: 'shield-dossier-callout',
            layout: 'block',
            document: {
              kind: 'praxis.rich-content',
              version: '1.0.0',
              nodes: [
                {
                  type: 'callout',
                  id: 'callout-hero-protocol',
                  tone: 'info',
                  icon: 'verified_user',
                  title: 'Protocolo de Credenciamento Tático S.H.I.E.L.D.',
                  message: 'Formulário customizado em runtime via Praxis Layout Editor: seções executivas em múltiplas colunas, validação reativa e persistência instantânea.'
                }
              ]
            }
          };

          const customSections = [
            {
              id: 'sec-identificacao-tatica',
              title: '1. Identificação Tática & Credenciais S.H.I.E.L.D.',
              description: 'Dados principais do agente, codinome operacional e canais diretos de acionamento',
              gapBottom: 20,
              rows: [
                {
                  id: 'row-callout-banner',
                  columns: [
                    {
                      id: 'col-callout-banner',
                      span: 12,
                      fields: [],
                      items: [calloutItem]
                    }
                  ]
                },
                buildTwoColRow('row-id-1', sec1Row1Left, sec1Row1Right),
                buildTwoColRow('row-id-2', sec1Row2Left, sec1Row2Right)
              ].filter((r) => r.columns.length > 0)
            },
            {
              id: 'sec-alocacao-operacional',
              title: '2. Alocação Operacional, Patente & Subsídio',
              description: 'Vínculo departamental, cargo tático, remuneração e data de engajamento',
              gapBottom: 20,
              rows: [
                buildTwoColRow('row-op-1', sec2Row1Left, sec2Row1Right),
                buildTwoColRow('row-op-2', sec2Row2Left, sec2Row2Right)
              ].filter((r) => r.columns.length > 0)
            }
          ];

          if (sec3Left.length > 0 || sec3Right.length > 0) {
            customSections.push({
              id: 'sec-complemento-dossie',
              title: '3. Informações Complementares & Dossiê de Campo',
              description: 'Atributos adicionais do contrato canônico do recurso',
              gapBottom: 16,
              rows: [buildTwoColRow('row-comp-1', sec3Left, sec3Right)]
            });
          }

          cfg.sections = customSections;
          await setFormInput(page, jsonTextarea, JSON.stringify(doc, null, 2));
          await sleep(400);
        } catch (err) {
          console.warn('  [warn] Could not parse/patch form JSON document:', err.message);
        }
      }

      // Switch back to Layout tab briefly to show the 3 organized multi-column sections!
      await moveCursorToLocator(page, layoutTab, 80);
      await layoutTab.click();
      await sleep(600);
      await recorder.captureSyncKeyframe();
    }

    // Save & close the Form Config Editor Settings Panel
    await saveAndCloseSettingsPanel(page, 'dynamic-form-config-editor');
    await sleep(800);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08-crud-form-customized.png') });

    // Close the Edit Form Modal
    const closeFormDialogBtn = page
      .locator('mat-dialog-container [data-testid="crud-dialog-close-btn"], mat-dialog-container button[aria-label*="Fechar"], mat-dialog-container button[aria-label*="Close"], mat-dialog-container button[mat-dialog-close]')
      .first();
    if (await closeFormDialogBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, closeFormDialogBtn, 90);
      await closeFormDialogBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await sleep(600);
    await dismissStrayBackdrops(page);

    // =========================================================================
    // STAGE 7: Full CRUD Runtime Lifecycle (KPI Filter, Quick Chips, View, Create, Edit, Delete)
    // =========================================================================
    console.log('7. Exiting Customization Mode and demonstrating full CRUD Runtime Lifecycle...');
    await setDemoStage(
      page,
      7,
      8,
      'ETAPA 7/8 · OPERAÇÃO EM RUNTIME',
      'Filtros via KPI, Quick Chips, Visualização, Criação, Edição e Exclusão',
      'Testando a página pronta em modo operacional (sem modo de edição)'
    );

    // Exit Customization Mode
    await moveCursorToLocator(page, toggleCustomBtn, 110);
    await toggleCustomBtn.click();
    await sleep(650);
    await recorder.captureSyncKeyframe();

    // 7.1 Click KPI Card #2 ("Prontidão Ativa") to filter table reactively
    const kpiCardActive = page.locator('[data-testid="crud-kpi-card-1"]');
    if (await kpiCardActive.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, kpiCardActive, 110);
      await kpiCardActive.click();
      await sleep(850);
      await recorder.captureSyncKeyframe();
    }

    // Click KPI Card #1 ("Efetivo Tático Total") to clear filter
    const kpiCardTotal = page.locator('[data-testid="crud-kpi-card-0"]');
    if (await kpiCardTotal.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, kpiCardTotal, 110);
      await kpiCardTotal.click();
      await sleep(750);
      await recorder.captureSyncKeyframe();
    }

    // 7.2 Click Quick Filter chips in ScopeBar / Filter Bar
    const quickChipReserve = page.locator('praxis-crud').locator('button, mat-chip-option, .quick-filter-chip').filter({ hasText: /Reserva Tática/i }).first();
    if (await quickChipReserve.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, quickChipReserve, 100);
      await quickChipReserve.click();
      await sleep(800);
      await recorder.captureSyncKeyframe();
    }

    const quickChipAll = page.locator('praxis-crud').locator('button, mat-chip-option, .quick-filter-chip').filter({ hasText: /Todos os Agentes/i }).first();
    if (await quickChipAll.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, quickChipAll, 100);
      await quickChipAll.click();
      await sleep(750);
      await recorder.captureSyncKeyframe();
    }

    // 7.3 Trigger VIEW action on a row
    console.log('   7.3 Demonstrating View (Visualizar) action...');
    const rowForView = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first();
    await rowForView.waitFor({ state: 'visible', timeout: 10000 });
    const viewRowBtn = rowForView.locator('button[data-action-id="view"], button[aria-label*="Visualizar"], button[mattooltip*="Visualizar"]').first();
    if (await viewRowBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, viewRowBtn, 100);
      await viewRowBtn.click();
    } else {
      const moreBtn = rowForView.locator('td.mat-column-actions button, button[aria-haspopup="menu"]').first();
      await moveCursorToLocator(page, moreBtn, 90);
      await moreBtn.click();
      await sleep(250);
      const viewItem = page.locator('.cdk-overlay-container [role="menuitem"]').filter({ hasText: /Visualizar|View|Detalh/i }).first();
      await moveCursorToLocator(page, viewItem, 80);
      await viewItem.click();
    }

    await page.locator('mat-dialog-container praxis-dynamic-form, praxis-surface-host praxis-dynamic-form').first().waitFor({ state: 'visible', timeout: 12000 }).catch(() => {});
    await sleep(900);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '09-crud-runtime-view.png') });

    await page.keyboard.press('Escape');
    await sleep(550);
    await dismissStrayBackdrops(page);

    // 7.4 Trigger CREATE action from the table toolbar ("Novo" / "Adicionar")
    console.log('   7.4 Demonstrating Create (Novo Registro) action with customized form layout...');
    const createToolbarBtn = page
      .locator('praxis-crud praxis-table-toolbar button')
      .filter({ hasText: /Novo|Adicionar|Criar|New|Add/i })
      .first();
    if (await createToolbarBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, createToolbarBtn, 110);
      await createToolbarBtn.click();
      await page.locator('mat-dialog-container praxis-dynamic-form').first().waitFor({ state: 'visible', timeout: 12000 }).catch(() => {});
      await sleep(700);

      // Fill a couple of fields in the customized Create form to demonstrate interactive layout
      const nomeInput = page.locator('mat-dialog-container praxis-dynamic-form input').first();
      if (await nomeInput.isVisible().catch(() => false)) {
        await setFormInput(page, nomeInput, 'Carol Danvers');
      }
      const secondInput = page.locator('mat-dialog-container praxis-dynamic-form input').nth(1);
      if (await secondInput.isVisible().catch(() => false)) {
        await setFormInput(page, secondInput, 'Capitã Marvel');
      }
      await sleep(700);
      await recorder.captureSyncKeyframe();

      // Close create dialog (confirming dirty guard if prompted!)
      await page.keyboard.press('Escape');
      await sleep(350);
      const dirtyConfirmBtn = page.locator('.cdk-overlay-container mat-dialog-container button').filter({ hasText: /Sair|Confirmar|Descartar|Sim|Leave/i }).first();
      if (await dirtyConfirmBtn.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, dirtyConfirmBtn, 80);
        await dirtyConfirmBtn.click();
      }
      await sleep(500);
      await dismissStrayBackdrops(page);
    }

    // 7.5 Trigger EDIT action on the first row showing the customized multi-column layout pre-populated
    console.log('   7.5 Demonstrating Edit (Editar) action with pre-populated customized layout...');
    const rowForEdit = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first();
    const editBtn2 = rowForEdit.locator('button[data-action-id="edit"], button[aria-label*="Editar"], button[mattooltip*="Editar"]').first();
    if (await editBtn2.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, editBtn2, 100);
      await editBtn2.click();
    } else {
      const moreBtn = rowForEdit.locator('td.mat-column-actions button, button[aria-haspopup="menu"]').first();
      await moveCursorToLocator(page, moreBtn, 90);
      await moreBtn.click();
      await sleep(250);
      const editItem = page.locator('.cdk-overlay-container [role="menuitem"]').filter({ hasText: /Editar|Edit/i }).first();
      await moveCursorToLocator(page, editItem, 80);
      await editItem.click();
    }

    await page.locator('mat-dialog-container praxis-dynamic-form').first().waitFor({ state: 'visible', timeout: 12000 }).catch(() => {});
    await sleep(900);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '10-crud-runtime-edit.png') });

    // Maximize the modal using the header maximize button if visible!
    const maximizeBtn = page.locator('mat-dialog-container button[aria-label*="Maximizar"], mat-dialog-container button[aria-label*="Maximize"]').first();
    if (await maximizeBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, maximizeBtn, 90);
      await maximizeBtn.click();
      await sleep(600);
      await recorder.captureSyncKeyframe();
    }

    await page.keyboard.press('Escape');
    await sleep(500);
    await dismissStrayBackdrops(page);

    // 7.6 Trigger DELETE action to showcase the governed Confirmation Dialog
    console.log('   7.6 Demonstrating Delete (Excluir) confirmation dialog...');
    const rowForDelete = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').nth(1);
    const deleteRowBtn = rowForDelete.locator('button[data-action-id="delete"], button[aria-label*="Excluir"], button[mattooltip*="Excluir"]').first();
    if (await deleteRowBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, deleteRowBtn, 100);
      await deleteRowBtn.click();
    } else {
      const moreBtn = rowForDelete.locator('td.mat-column-actions button, button[aria-haspopup="menu"]').first();
      if (await moreBtn.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, moreBtn, 90);
        await moreBtn.click();
        await sleep(250);
        const delItem = page.locator('.cdk-overlay-container [role="menuitem"]').filter({ hasText: /Excluir|Delete|Remover/i }).first();
        if (await delItem.isVisible().catch(() => false)) {
          await moveCursorToLocator(page, delItem, 80);
          await delItem.click();
        }
      }
    }

    await sleep(650);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '11-crud-runtime-delete.png') });

    const cancelDeleteBtn = page.locator('.cdk-overlay-container mat-dialog-container button').filter({ hasText: /Cancelar|Cancel|Não/i }).first();
    if (await cancelDeleteBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, cancelDeleteBtn, 90);
      await cancelDeleteBtn.click();
      await sleep(450);
    } else {
      await page.keyboard.press('Escape');
      await sleep(400);
    }

    // =========================================================================
    // STAGE 8: F5 Reload — Prove 100% Zero-Code, Zero-Deploy Persistence
    // =========================================================================
    console.log('8. Reloading page (F5) to prove 100% persistence without code or deploy...');
    await setDemoStage(
      page,
      8,
      8,
      'ETAPA 8/8 · PROVA DE PERSISTÊNCIA (F5 RELOAD)',
      'Recarregando a Página (/crud-studio) — 100% Persistido sem Deploy',
      'Conexão, KPI Band, Filtros Rápidos, Colunas Customizadas e Layout do Formulário preservados'
    );

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('praxis-crud [data-testid="crud-kpi-band"]').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first().waitFor({ state: 'visible', timeout: 20000 });

    await setDemoStage(
      page,
      8,
      8,
      'ETAPA 8/8 · PROVA DE PERSISTÊNCIA (F5 RELOAD)',
      'Página CRUD 100% Hidratada após F5 · Zero Código · Zero Deploy',
      'Abrindo o formulário pós-F5 para comprovar a persistência do layout multi-colunas'
    );
    await sleep(800);
    await recorder.captureSyncKeyframe();

    // Open Edit on row 1 after reload to prove the customized form layout also persisted!
    const postReloadRow = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first();
    const postReloadEditBtn = postReloadRow.locator('button[data-action-id="edit"], button[aria-label*="Editar"], button[mattooltip*="Editar"]').first();
    if (await postReloadEditBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, postReloadEditBtn, 100);
      await postReloadEditBtn.click();
    } else {
      const moreBtn = postReloadRow.locator('td.mat-column-actions button, button[aria-haspopup="menu"]').first();
      await moveCursorToLocator(page, moreBtn, 90);
      await moreBtn.click();
      await sleep(250);
      const editItem = page.locator('.cdk-overlay-container [role="menuitem"]').filter({ hasText: /Editar|Edit/i }).first();
      await moveCursorToLocator(page, editItem, 80);
      await editItem.click();
    }

    await page.locator('mat-dialog-container praxis-dynamic-form').first().waitFor({ state: 'visible', timeout: 12000 });
    await sleep(1000);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '12-crud-after-reload-persisted.png') });

    await page.keyboard.press('Escape');
    await sleep(700);
    await recorder.captureSyncKeyframe();

    await recorder.stop();
    await browser.close();
    browser = null;

    await convertWebmToMp4(videoFile, mp4File);
    console.log('\n================================================================');
    console.log(' [SUCCESS] Praxis CRUD Zero-Code Studio Demo Recorded!');
    console.log(` - WebM: ${videoFile}`);
    console.log(` - MP4:  ${mp4File}`);
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
