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

const BASE_URL = process.env.PAX_STUDIO_DEMO_URL || 'http://127.0.0.1:4302';
const DIST_DIR = process.env.PAX_STUDIO_DIST_DIR || path.join(PROJECT_ROOT, 'dist', 'praxis-hero-hq-ui', 'browser');
const PROXY_TARGET = process.env.PAX_PROXY_TARGET || 'https://praxis-api-quickstart.onrender.com';
const PROXY_ORIGIN = process.env.PAX_PROXY_ORIGIN || 'http://localhost:4003';
const ARTIFACT_DIR = process.env.PAX_STUDIO_ARTIFACT_DIR || path.join(PROJECT_ROOT, 'test-results', 'studio-demo');
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
 * - Zero auto-scaling (no pad/crop/scale filters; 1:1 pixel mapping with deviceScaleFactor=1)
 * - Captures quality=100 frames via CDP Page.startScreencast + keyframe sync snapshots
 * - Encodes directly to VP8 (.webm) with -screen-content-mode 1 -sharpness 7 -qmin 0 -qmax 4 -crf 4
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
    const getCache = new Map();
    const server = http.createServer((req, res) => {
      const reqUrl = req.url || '/';
      if (reqUrl.startsWith('/api') || reqUrl.startsWith('/schemas')) {
        const isCacheableGet =
          req.method === 'GET' &&
          !reqUrl.startsWith('/api/praxis/config');
        if (isCacheableGet && getCache.has(reqUrl)) {
          const cached = getCache.get(reqUrl);
          res.writeHead(cached.statusCode, cached.headers);
          res.end(cached.body);
          return;
        }
        const headers = { ...req.headers, host: targetUrl.host, origin: PROXY_ORIGIN, Origin: PROXY_ORIGIN };
        if (isCacheableGet) {
          delete headers['accept-encoding'];
        }
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
            if (isCacheableGet && (proxyRes.statusCode || 200) >= 200 && (proxyRes.statusCode || 200) < 300) {
              const chunks = [];
              proxyRes.on('data', (c) => chunks.push(c));
              proxyRes.on('end', () => {
                const body = Buffer.concat(chunks);
                const cleanHeaders = { ...proxyRes.headers };
                delete cleanHeaders['transfer-encoding'];
                cleanHeaders['content-length'] = String(body.length);
                getCache.set(reqUrl, {
                  statusCode: proxyRes.statusCode || 200,
                  headers: cleanHeaders,
                  body
                });
                res.writeHead(proxyRes.statusCode || 200, cleanHeaders);
                res.end(body);
              });
              return;
            }
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
    server.listen(4302, '127.0.0.1', () => {
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

// 1. Canonical Page State & DataSources (authored into Page Settings -> Adjustments -> Page State)
const PAGE_STATE_JSON = JSON.stringify({
  values: {
    kpis: {
      readinessRate: 52.5,
      activeHeroes: 53,
      inactiveHeroes: 48,
      totalHeroes: 101,
      inProgressMissions: 9,
      inProgressMissionsBadge: '09',
      plannedMissions: 15,
      completedMissions: 22,
      pausedMissions: 4,
      cancelledMissions: 0,
      totalMissions: 50,
      missoesPercent: 30,
      latestPayrollNet: 2684945.08,
      latestPayrollGross: 3041500,
      latestPayrollMonth: '2026-10-01',
      latestPayrollNetMillion: 2.68,
      latestPayrollEmployees: 101,
      folhaPercent: 88.3,
      totalIncidents: 108,
      criticalIncidents: 23,
      criticalIncidentsBadge: '23',
      highIncidents: 30,
      mediumIncidents: 29,
      lowIncidents: 26,
      riscosPercent: 21,
      defconScore: 4.3,
      inUseAssets: 56,
      brokenAssets: 11,
      maintenanceAssets: 2,
      stockAssets: 2,
      lostAssets: 1,
      totalAssets: 72,
      confrontationThreats: 9,
      atLargeThreats: 6,
      observedThreats: 6,
      capturedThreats: 3,
      totalThreats: 24
    },
    activeMissions: [
      {
        missaoId: 1,
        titulo: 'Batalha de Nova York',
        status: 'EM_ANDAMENTO',
        statusLabel: 'Em andamento',
        prioridade: 'CRITICA',
        prioridadeLabel: 'Crítica',
        local: 'Nova York',
        ameaca: 'Thanos',
        qtdHerois: 10,
        qtdEventos: 6
      },
      {
        missaoId: 14,
        titulo: 'Operação Firewall Global II',
        status: 'EM_ANDAMENTO',
        statusLabel: 'Em andamento',
        prioridade: 'CRITICA',
        prioridadeLabel: 'Crítica',
        local: 'Global',
        ameaca: 'Skynet',
        qtdHerois: 7,
        qtdEventos: 3
      },
      {
        missaoId: 21,
        titulo: 'Patrulha em Tóquio',
        status: 'EM_ANDAMENTO',
        statusLabel: 'Em andamento',
        prioridade: 'MEDIA',
        prioridadeLabel: 'Média',
        local: 'Tóquio',
        ameaca: 'Duende Verde',
        qtdHerois: 5,
        qtdEventos: 3
      },
      {
        missaoId: 26,
        titulo: 'Bloqueio Coluano',
        status: 'EM_ANDAMENTO',
        statusLabel: 'Em andamento',
        prioridade: 'CRITICA',
        prioridadeLabel: 'Crítica',
        local: 'Metrópolis',
        ameaca: 'Brainiac',
        qtdHerois: 9,
        qtdEventos: 7
      }
    ]
  },
  derived: {
    readinessRate: {
      dependsOn: ['kpis.activeHeroes', 'kpis.totalHeroes'],
      compute: {
        kind: 'json-logic',
        expression: {
          if: [
            { '>': [{ var: 'state.kpis.totalHeroes' }, 0] },
            {
              round: [
                { '*': [{ '/': [{ var: 'state.kpis.activeHeroes' }, { var: 'state.kpis.totalHeroes' }] }, 100] },
                1
              ]
            },
            0
          ]
        }
      }
    },
    missoesPercent: {
      dependsOn: ['kpis.plannedMissions', 'kpis.totalMissions'],
      compute: {
        kind: 'json-logic',
        expression: {
          if: [
            { '>': [{ var: 'state.kpis.totalMissions' }, 0] },
            {
              round: [
                { '*': [{ '/': [{ var: 'state.kpis.plannedMissions' }, { var: 'state.kpis.totalMissions' }] }, 100] },
                0
              ]
            },
            0
          ]
        }
      }
    },
    folhaPercent: {
      dependsOn: ['kpis.latestPayrollNet', 'kpis.latestPayrollGross'],
      compute: {
        kind: 'json-logic',
        expression: {
          if: [
            { '>': [{ var: 'state.kpis.latestPayrollGross' }, 0] },
            {
              round: [
                { '*': [{ '/': [{ var: 'state.kpis.latestPayrollNet' }, { var: 'state.kpis.latestPayrollGross' }] }, 100] },
                1
              ]
            },
            0
          ]
        }
      }
    },
    riscosPercent: {
      dependsOn: ['kpis.criticalIncidents', 'kpis.totalIncidents'],
      compute: {
        kind: 'json-logic',
        expression: {
          if: [
            { '>': [{ var: 'state.kpis.totalIncidents' }, 0] },
            {
              round: [
                { '*': [{ '/': [{ var: 'state.kpis.criticalIncidents' }, { var: 'state.kpis.totalIncidents' }] }, 100] },
                0
              ]
            },
            0
          ]
        }
      }
    },
    inProgressMissionsBadge: {
      dependsOn: ['kpis.inProgressMissions'],
      compute: {
        kind: 'json-logic',
        expression: {
          if: [
            { '<': [{ var: 'state.kpis.inProgressMissions' }, 10] },
            { cat: ['0', { var: 'state.kpis.inProgressMissions' }] },
            { cat: ['', { var: 'state.kpis.inProgressMissions' }] }
          ]
        }
      }
    },
    criticalIncidentsBadge: {
      dependsOn: ['kpis.criticalIncidents'],
      compute: {
        kind: 'json-logic',
        expression: {
          if: [
            { '<': [{ var: 'state.kpis.criticalIncidents' }, 10] },
            { cat: ['0', { var: 'state.kpis.criticalIncidents' }] },
            { cat: ['', { var: 'state.kpis.criticalIncidents' }] }
          ]
        }
      }
    },
    latestPayrollNetMillion: {
      dependsOn: ['kpis.latestPayrollNet'],
      compute: {
        kind: 'json-logic',
        expression: {
          if: [
            { '>': [{ var: 'state.kpis.latestPayrollNet' }, 0] },
            { round: [{ '/': [{ var: 'state.kpis.latestPayrollNet' }, 1000000] }, 2] },
            0
          ]
        }
      }
    },
    defconScore: {
      dependsOn: ['kpis.criticalIncidents', 'kpis.totalIncidents'],
      compute: {
        kind: 'json-logic',
        expression: {
          if: [
            { '>': [{ var: 'state.kpis.totalIncidents' }, 0] },
            {
              max: [
                1,
                {
                  min: [
                    5,
                    {
                      round: [
                        { '-': [5, { '*': [{ '/': [{ var: 'state.kpis.criticalIncidents' }, { var: 'state.kpis.totalIncidents' }] }, 3.3] }] },
                        1
                      ]
                    }
                  ]
                }
              ]
            },
            5
          ]
        }
      }
    }
  }
}, null, 2);

const PAGE_DATASOURCES_JSON = JSON.stringify([
  {
    id: 'heroesStats',
    kind: 'stats-query',
    resourcePath: 'human-resources/funcionarios/stats/group-by',
    method: 'POST',
    query: {
      filter: {},
      field: 'ativo',
      metrics: [{ operation: 'COUNT', alias: 'total' }]
    },
    targetStatePath: 'kpis',
    transform: {
      kind: 'group-by-map',
      mappings: { true: 'activeHeroes', false: 'inactiveHeroes' },
      totalField: 'totalHeroes'
    },
    fallbackValue: { activeHeroes: 53, inactiveHeroes: 48, totalHeroes: 101 }
  },
  {
    id: 'missionsStats',
    kind: 'stats-query',
    resourcePath: 'operations/vw-resumo-missoes/stats/group-by',
    method: 'POST',
    query: {
      filter: {},
      field: 'status',
      metrics: [{ operation: 'COUNT', alias: 'total' }]
    },
    targetStatePath: 'kpis',
    transform: {
      kind: 'group-by-map',
      mappings: {
        PLANEJADA: 'plannedMissions',
        EM_ANDAMENTO: 'inProgressMissions',
        CONCLUIDA: 'completedMissions',
        PAUSADA: 'pausedMissions',
        CANCELADA: 'cancelledMissions'
      },
      totalField: 'totalMissions'
    },
    fallbackValue: {
      plannedMissions: 15,
      inProgressMissions: 9,
      completedMissions: 22,
      pausedMissions: 4,
      cancelledMissions: 0,
      totalMissions: 50
    }
  },
  {
    id: 'payrollStats',
    kind: 'stats-query',
    resourcePath: 'human-resources/vw-analytics-folha-pagamento/stats/timeseries',
    method: 'POST',
    query: {
      filter: {},
      field: 'competencia',
      granularity: 'MONTH',
      metrics: [
        { operation: 'SUM', field: 'salarioLiquido', alias: 'salarioLiquido' },
        { operation: 'SUM', field: 'salarioBruto', alias: 'salarioBruto' }
      ]
    },
    targetStatePath: 'kpis',
    transform: {
      kind: 'timeseries-last',
      mappings: {
        'values.salarioLiquido': 'latestPayrollNet',
        'values.salarioBruto': 'latestPayrollGross',
        count: 'latestPayrollEmployees',
        label: 'latestPayrollMonth'
      }
    },
    fallbackValue: {
      latestPayrollNet: 2684945.08,
      latestPayrollGross: 3041500,
      latestPayrollMonth: '2026-10-01',
      latestPayrollEmployees: 101
    }
  },
  {
    id: 'incidentsStats',
    kind: 'stats-query',
    resourcePath: 'risk-intelligence/vw-indicadores-incidentes/stats/group-by',
    method: 'POST',
    query: {
      filter: {},
      field: 'severidade',
      metrics: [{ operation: 'COUNT', alias: 'total' }]
    },
    targetStatePath: 'kpis',
    transform: {
      kind: 'group-by-map',
      mappings: {
        CRITICA: 'criticalIncidents',
        ALTA: 'highIncidents',
        MEDIA: 'mediumIncidents',
        BAIXA: 'lowIncidents'
      },
      totalField: 'totalIncidents'
    },
    fallbackValue: {
      criticalIncidents: 23,
      highIncidents: 30,
      mediumIncidents: 29,
      lowIncidents: 26,
      totalIncidents: 108
    }
  },
  {
    id: 'assetsStats',
    kind: 'stats-query',
    resourcePath: 'assets/equipamentos/stats/group-by',
    method: 'POST',
    query: {
      filter: {},
      field: 'status',
      metrics: [{ operation: 'COUNT', alias: 'total' }]
    },
    targetStatePath: 'kpis',
    transform: {
      kind: 'group-by-map',
      mappings: {
        EM_USO: 'inUseAssets',
        QUEBRADO: 'brokenAssets',
        MANUTENCAO: 'maintenanceAssets',
        ESTOQUE: 'stockAssets',
        PERDIDO: 'lostAssets'
      },
      totalField: 'totalAssets'
    },
    fallbackValue: {
      inUseAssets: 56,
      brokenAssets: 11,
      maintenanceAssets: 2,
      stockAssets: 2,
      lostAssets: 1,
      totalAssets: 72
    }
  },
  {
    id: 'threatsStats',
    kind: 'stats-query',
    resourcePath: 'risk-intelligence/ameacas/stats/group-by',
    method: 'POST',
    query: {
      filter: {},
      field: 'status',
      metrics: [{ operation: 'COUNT', alias: 'total' }]
    },
    targetStatePath: 'kpis',
    transform: {
      kind: 'group-by-map',
      mappings: {
        CONFRONTO: 'confrontationThreats',
        LIVRE: 'atLargeThreats',
        EM_OBSERVACAO: 'observedThreats',
        CAPTURADO: 'capturedThreats'
      },
      totalField: 'totalThreats'
    },
    fallbackValue: {
      confrontationThreats: 9,
      atLargeThreats: 6,
      observedThreats: 6,
      capturedThreats: 3,
      totalThreats: 24
    }
  },
  {
    id: 'recentMissionsFeed',
    kind: 'remote-resource',
    resourcePath: 'operations/vw-resumo-missoes/filter?page=0&size=4',
    method: 'POST',
    query: {
      status: 'EM_ANDAMENTO'
    },
    targetStatePath: 'activeMissions',
    transform: {
      kind: 'path',
      path: 'content'
    },
    fallbackValue: [
      {
        missaoId: 1,
        titulo: 'Batalha de Nova York',
        status: 'EM_ANDAMENTO',
        statusLabel: 'Em andamento',
        prioridade: 'CRITICA',
        prioridadeLabel: 'Crítica',
        local: 'Nova York',
        ameaca: 'Thanos',
        qtdHerois: 10,
        qtdEventos: 6
      },
      {
        missaoId: 14,
        titulo: 'Operação Firewall Global II',
        status: 'EM_ANDAMENTO',
        statusLabel: 'Em andamento',
        prioridade: 'CRITICA',
        prioridadeLabel: 'Crítica',
        local: 'Global',
        ameaca: 'Skynet',
        qtdHerois: 7,
        qtdEventos: 3
      },
      {
        missaoId: 21,
        titulo: 'Patrulha em Tóquio',
        status: 'EM_ANDAMENTO',
        statusLabel: 'Em andamento',
        prioridade: 'MEDIA',
        prioridadeLabel: 'Média',
        local: 'Tóquio',
        ameaca: 'Duende Verde',
        qtdHerois: 5,
        qtdEventos: 3
      },
      {
        missaoId: 26,
        titulo: 'Bloqueio Coluano',
        status: 'EM_ANDAMENTO',
        statusLabel: 'Em andamento',
        prioridade: 'CRITICA',
        prioridadeLabel: 'Crítica',
        local: 'Metrópolis',
        ameaca: 'Brainiac',
        qtdHerois: 9,
        qtdEventos: 7
      }
    ]
  }
], null, 2);

// 2. Canonical RichContentDocument payloads
const HERO_COMMAND_HEADER_DOC = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'card',
      variant: 'unstyled',
      tone: 'neutral',
      orientation: 'horizontal',
      className: 'glass-panel hero-executive-banner bg-grid',
      header: [
        {
          type: 'compose',
          direction: 'row',
          gap: 'sm',
          items: [
            {
              type: 'compose',
              direction: 'row',
              gap: 'xs',
              className: 'status-pill ready-pill',
              items: [
                { type: 'icon', icon: 'verified_user' },
                { type: 'badge', label: '100% Zero-Deploy Studio Runtime' }
              ]
            },
            {
              type: 'compose',
              direction: 'row',
              gap: 'xs',
              className: 'status-pill cobalt-pill',
              items: [
                { type: 'icon', icon: 'auto_awesome' },
                { type: 'badge', label: 'Praxis Page Builder 10.0 · Autoria Visual' }
              ]
            }
          ]
        }
      ],
      title: 'Laboratório Tático Orbital — Vanguard Studio',
      subtitle: 'Painel executivo de comando construído 100% em runtime a partir de um canvas em branco usando os editores visuais do Praxis Page Builder, conectando radar tático, KPIs derivados, telemetria analítica e dossiê forense sem deploy.',
      content: [],
      actions: [
        {
          type: 'actionButton',
          label: 'Esquadrão & Heróis',
          icon: 'group',
          variant: 'raised',
          color: 'primary',
          action: {
            actionId: 'navigation.openRoute',
            payload: { path: '/rh/funcionarios' }
          }
        },
        {
          type: 'actionButton',
          label: 'Teatro de Missões',
          icon: 'military_tech',
          variant: 'stroked',
          action: {
            actionId: 'navigation.openRoute',
            payload: { path: '/operacoes/missoes' }
          }
        },
        {
          type: 'actionButton',
          label: 'Risco & Ameaças',
          icon: 'radar',
          variant: 'stroked',
          action: {
            actionId: 'navigation.openRoute',
            payload: { path: '/risco/ameacas' }
          }
        }
      ],
      media: {
        kind: 'component',
        componentId: 'hero-hq-tactical-radar',
        placement: 'trailing',
        verticalAlign: 'center',
        componentInputs: {
          speed: 'normal',
          interactive: true,
          palette: 'theme',
          maxRange: 120,
          label: 'IFF · PRONTIDÃO ${kpis.readinessRate}%',
          contacts: [
            {
              id: 'TRK-01',
              bearing: 42,
              range: 0.48,
              heading: 135,
              classification: 'friendly',
              label: 'Heróis Ativos (${kpis.activeHeroes})',
              route: '/rh/funcionarios'
            },
            {
              id: 'TRK-02',
              bearing: 118,
              range: 0.72,
              heading: 290,
              classification: 'warning',
              label: 'Riscos Altos (${kpis.highIncidents})',
              route: '/operacoes/incidentes'
            },
            {
              id: 'TRK-03',
              bearing: 215,
              range: 0.34,
              heading: 45,
              classification: 'friendly',
              label: 'Missões Ativas (${kpis.inProgressMissions})',
              route: '/operacoes/missoes'
            },
            {
              id: 'TRK-04',
              bearing: 308,
              range: 0.56,
              heading: 120,
              classification: 'critical',
              label: 'Ameaças Críticas (${kpis.criticalIncidents})',
              route: '/risco/ameacas'
            },
            {
              id: 'TRK-05',
              bearing: 348,
              range: 0.84,
              heading: 195,
              classification: 'neutral',
              label: 'Ativos em Campo (${kpis.inUseAssets})',
              route: '/ativos/equipamentos'
            }
          ]
        }
      }
    }
  ]
};

const KPI_HEROES_DOC = {
  "kind": "praxis.rich-content",
  "version": "1.0.0",
  "nodes": [
    {
      "type": "card",
      "variant": "unstyled",
      "tone": "neutral",
      "className": "glass-panel bento-kpi-card kpi-tone-ready",
      "interaction": {
        "mode": "action",
        "action": {
          "actionId": "navigation.openRoute",
          "payload": {
            "path": "/rh/funcionarios"
          }
        }
      },
      "header": [
        {
          "type": "compose",
          "direction": "row",
          "gap": "sm",
          "items": [
            {
              "type": "icon",
              "icon": "verified_user",
              "className": "card-icon tone-ready"
            },
            {
              "type": "badge",
              "label": "${kpis.readinessRate}% Força",
              "className": "tag-status ready-tag"
            }
          ]
        }
      ],
      "title": "${kpis.activeHeroes} Ativos",
      "subtitle": "Prontidão Operacional",
      "content": [
        {
          "type": "progress",
          "valueExpr": "progressValue | round:1 | default:0",
          "showPercent": false,
          "className": "fill-ready"
        },
        {
          "type": "text",
          "text": "${kpis.activeHeroes} de ${kpis.totalHeroes} heróis prontos para ação",
          "className": "card-footnote"
        }
      ]
    }
  ]
};

const KPI_MISSIONS_DOC = {
  "kind": "praxis.rich-content",
  "version": "1.0.0",
  "nodes": [
    {
      "type": "card",
      "variant": "unstyled",
      "tone": "neutral",
      "className": "glass-panel bento-kpi-card kpi-tone-operations",
      "interaction": {
        "mode": "action",
        "action": {
          "actionId": "navigation.openRoute",
          "payload": {
            "path": "/operacoes/missoes"
          }
        }
      },
      "header": [
        {
          "type": "compose",
          "direction": "row",
          "gap": "sm",
          "items": [
            {
              "type": "icon",
              "icon": "military_tech",
              "className": "card-icon tone-operations"
            },
            {
              "type": "badge",
              "label": "${kpis.inProgressMissionsBadge} Em Curso",
              "className": "tag-status operations-tag"
            }
          ]
        }
      ],
      "title": "${kpis.plannedMissions} Planejadas",
      "subtitle": "Missões Operacionais",
      "content": [
        {
          "type": "progress",
          "valueExpr": "progressValue | round:0 | default:0",
          "showPercent": false,
          "className": "fill-operations"
        },
        {
          "type": "text",
          "text": "${kpis.inProgressMissions} em curso · ${kpis.completedMissions} concluídas de ${kpis.totalMissions} missões",
          "className": "card-footnote"
        }
      ]
    }
  ]
};

const KPI_PAYROLL_DOC = {
  "kind": "praxis.rich-content",
  "version": "1.0.0",
  "nodes": [
    {
      "type": "card",
      "variant": "unstyled",
      "tone": "neutral",
      "className": "glass-panel bento-kpi-card kpi-tone-rh",
      "interaction": {
        "mode": "action",
        "action": {
          "actionId": "navigation.openRoute",
          "payload": {
            "path": "/rh/folha-pagamento"
          }
        }
      },
      "header": [
        {
          "type": "compose",
          "direction": "row",
          "gap": "sm",
          "items": [
            {
              "type": "icon",
              "icon": "payments",
              "className": "card-icon tone-rh"
            },
            {
              "type": "badge",
              "label": "${kpis.folhaPercent}% Líquido",
              "className": "tag-status rh-tag"
            }
          ]
        }
      ],
      "title": "R$ ${kpis.latestPayrollNetMillion} M",
      "subtitle": "Execução da Folha",
      "content": [
        {
          "type": "progress",
          "valueExpr": "progressValue | round:1 | default:0",
          "showPercent": false,
          "className": "fill-rh"
        },
        {
          "type": "text",
          "text": "Folha de ${kpis.latestPayrollEmployees} colaboradores · Comp. ${kpis.latestPayrollMonth}",
          "className": "card-footnote"
        }
      ]
    }
  ]
};

const KPI_INCIDENTS_DOC = {
  "kind": "praxis.rich-content",
  "version": "1.0.0",
  "nodes": [
    {
      "type": "card",
      "variant": "unstyled",
      "tone": "neutral",
      "className": "glass-panel bento-kpi-card kpi-tone-risk",
      "interaction": {
        "mode": "action",
        "action": {
          "actionId": "navigation.openRoute",
          "payload": {
            "path": "/operacoes/incidentes"
          }
        }
      },
      "header": [
        {
          "type": "compose",
          "direction": "row",
          "gap": "sm",
          "items": [
            {
              "type": "icon",
              "icon": "emergency",
              "className": "card-icon tone-risk"
            },
            {
              "type": "badge",
              "label": "${kpis.totalIncidents} Incidentes",
              "className": "tag-status risk-tag"
            }
          ]
        }
      ],
      "title": "${kpis.criticalIncidentsBadge} Críticos",
      "subtitle": "Ameaças & Incidentes",
      "content": [
        {
          "type": "progress",
          "valueExpr": "progressValue | round:0 | default:0",
          "showPercent": false,
          "className": "fill-risk"
        },
        {
          "type": "text",
          "text": "${kpis.riscosPercent}% críticos · ${kpis.highIncidents} de severidade alta em ${kpis.totalIncidents} ocorrências",
          "className": "card-footnote"
        }
      ]
    }
  ]
};

const TIMELINE_DOC = {
  "kind": "praxis.rich-content",
  "version": "1.0.0",
  "nodes": [
    {
      "type": "timeline",
      "title": "Teatro Operacional Ativo · ${kpis.inProgressMissions} em curso de ${kpis.totalMissions} missões",
      "position": "right",
      "orientation": "vertical",
      "itemLayout": "split",
      "markerVariant": "icon",
      "markerStyle": "soft",
      "items": [
        {
          "title": "${activeMissions.0.titulo} · ${activeMissions.0.local} (${kpis.inProgressMissions} em Curso)",
          "subtitle": "Alvo tático: ${activeMissions.0.ameaca} · ${activeMissions.0.qtdHerois} heróis mobilizados em ${activeMissions.0.qtdEventos} eventos (${kpis.completedMissions}/${kpis.totalMissions} concluídas · ${kpis.inUseAssets}/${kpis.totalAssets} ativos em suporte).",
          "meta": "Missão #${activeMissions.0.missaoId} · Status: ${activeMissions.0.statusLabel}",
          "opposite": "#${activeMissions.0.missaoId}",
          "badge": "${activeMissions.0.prioridadeLabel} · ${kpis.inProgressMissionsBadge} Ativas",
          "badgeTone": "danger",
          "markerColor": "error",
          "markerStyle": "soft",
          "connectorColor": "error",
          "connectorVariant": "solid",
          "action": {
            "actionId": "navigation.openRoute",
            "payload": {
              "path": "/operacoes/missoes"
            }
          },
          "icon": "radar"
        },
        {
          "title": "${activeMissions.1.titulo} · ${activeMissions.1.local} (${kpis.plannedMissions} Planejadas)",
          "subtitle": "Alvo tático: ${activeMissions.1.ameaca} · ${activeMissions.1.qtdHerois} heróis mobilizados em ${activeMissions.1.qtdEventos} eventos (${kpis.pausedMissions} em espera tática).",
          "meta": "Missão #${activeMissions.1.missaoId} · Status: ${activeMissions.1.statusLabel}",
          "opposite": "#${activeMissions.1.missaoId}",
          "badge": "${activeMissions.1.prioridadeLabel} · #${activeMissions.1.missaoId}",
          "badgeTone": "info",
          "markerColor": "info",
          "markerStyle": "soft",
          "connectorColor": "info",
          "connectorVariant": "solid",
          "action": {
            "actionId": "navigation.openRoute",
            "payload": {
              "path": "/operacoes/missoes"
            }
          },
          "icon": "rocket_launch"
        },
        {
          "title": "${activeMissions.2.titulo} · ${activeMissions.2.local} (Prontidão ${kpis.readinessRate}%)",
          "subtitle": "Alvo tático: ${activeMissions.2.ameaca} · ${activeMissions.2.qtdHerois} heróis mobilizados em ${activeMissions.2.qtdEventos} eventos (${kpis.activeHeroes}/${kpis.totalHeroes} heróis prontos).",
          "meta": "Missão #${activeMissions.2.missaoId} · Status: ${activeMissions.2.statusLabel}",
          "opposite": "#${activeMissions.2.missaoId}",
          "badge": "${activeMissions.2.prioridadeLabel} · #${activeMissions.2.missaoId}",
          "badgeTone": "warning",
          "markerColor": "warning",
          "markerStyle": "outlined",
          "connectorColor": "warning",
          "connectorVariant": "dashed",
          "action": {
            "actionId": "navigation.openRoute",
            "payload": {
              "path": "/operacoes/missoes"
            }
          },
          "icon": "shield"
        },
        {
          "title": "${activeMissions.3.titulo} · ${activeMissions.3.local} (DEFCON ${kpis.defconScore})",
          "subtitle": "Alvo tático: ${activeMissions.3.ameaca} · ${activeMissions.3.qtdHerois} heróis mobilizados em ${activeMissions.3.qtdEventos} eventos (${kpis.criticalIncidents} incidentes críticos).",
          "meta": "Missão #${activeMissions.3.missaoId} · Status: ${activeMissions.3.statusLabel}",
          "opposite": "#${activeMissions.3.missaoId}",
          "badge": "${activeMissions.3.prioridadeLabel} · ${kpis.criticalIncidentsBadge} Críticos",
          "badgeTone": "success",
          "markerColor": "success",
          "markerStyle": "soft",
          "connectorColor": "success",
          "connectorVariant": "solid",
          "action": {
            "actionId": "navigation.openRoute",
            "payload": {
              "path": "/operacoes/missoes"
            }
          },
          "icon": "verified"
        }
      ]
    }
  ]
};

const HUB_DOC = {
  "kind": "praxis.rich-content",
  "version": "1.0.0",
  "nodes": [
    {
      "type": "compose",
      "layout": "grid",
      "columns": "auto-fit",
      "minColumnWidth": "240px",
      "gap": "md",
      "className": "hub-action-cards-grid",
      "items": [
        {
          "type": "actionCard",
          "variant": "unstyled",
          "title": "Heróis & Colaboradores",
          "subtitle": "Cadastros completos, identidades civis, remunerações e histórico funcional.",
          "meta": "${kpis.activeHeroes}/${kpis.totalHeroes} ativos · ${kpis.readinessRate}% prontidão",
          "icon": "group",
          "ctaLabel": "Acessar RH",
          "ctaIcon": "arrow_forward",
          "action": {
            "actionId": "navigation.openRoute",
            "payload": {
              "path": "/rh/funcionarios"
            }
          },
          "className": "glass-panel hub-card-action tone-rh"
        },
        {
          "type": "actionCard",
          "variant": "unstyled",
          "title": "Centro de Missões",
          "subtitle": "Despacho tático, formação de squads, diário de bordo e desfechos operacionais.",
          "meta": "${kpis.inProgressMissions} em curso · ${kpis.plannedMissions} planejadas",
          "icon": "military_tech",
          "ctaLabel": "Operações",
          "ctaIcon": "arrow_forward",
          "action": {
            "actionId": "navigation.openRoute",
            "payload": {
              "path": "/operacoes/missoes"
            }
          },
          "className": "glass-panel hub-card-action tone-operations"
        },
        {
          "type": "actionCard",
          "variant": "unstyled",
          "title": "Ativos & Armaduras",
          "subtitle": "Controle de custódia, manutenção preventiva de trajes e frota aérea/terrestre.",
          "meta": "${kpis.inUseAssets}/${kpis.totalAssets} em uso · ${kpis.maintenanceAssets} manutenção",
          "icon": "inventory_2",
          "ctaLabel": "Ver Ativos",
          "ctaIcon": "arrow_forward",
          "action": {
            "actionId": "navigation.openRoute",
            "payload": {
              "path": "/ativos/equipamentos"
            }
          },
          "className": "glass-panel hub-card-action tone-assets"
        },
        {
          "type": "actionCard",
          "variant": "unstyled",
          "title": "Suprimentos & Contratos",
          "subtitle": "Fornecedores homologados, requisições de compra e tecnologia bélica avançada.",
          "meta": "Folha R$ ${kpis.latestPayrollNetMillion} M · ${kpis.latestPayrollMonth}",
          "icon": "contract",
          "ctaLabel": "Contratos",
          "ctaIcon": "arrow_forward",
          "action": {
            "actionId": "navigation.openRoute",
            "payload": {
              "path": "/suprimentos/contratos"
            }
          },
          "className": "glass-panel hub-card-action tone-supplies"
        },
        {
          "type": "actionCard",
          "variant": "unstyled",
          "title": "Inteligência & Ameaças",
          "subtitle": "Monitoramento geoespacial de vilões, acordos regulatórios e indenizações públicas.",
          "meta": "${kpis.confrontationThreats}/${kpis.totalThreats} em confronto · ${kpis.criticalIncidents} críticos",
          "icon": "radar",
          "ctaLabel": "Monitorar",
          "ctaIcon": "arrow_forward",
          "action": {
            "actionId": "navigation.openRoute",
            "payload": {
              "path": "/risco/ameacas"
            }
          },
          "className": "glass-panel hub-card-action tone-risk"
        },
        {
          "type": "actionCard",
          "variant": "unstyled",
          "title": "Ranking Reputacional",
          "subtitle": "Índices consolidados de aprovação popular, respaldo governamental e governança.",
          "meta": "${kpis.totalIncidents} ocorrências auditadas no ciclo",
          "icon": "monitoring",
          "ctaLabel": "Métricas",
          "ctaIcon": "arrow_forward",
          "action": {
            "actionId": "navigation.openRoute",
            "payload": {
              "path": "/rh/reputacao"
            }
          },
          "className": "glass-panel hub-card-action tone-cobalt"
        }
      ]
    }
  ]
};

const SOS_LIST_CONFIG = {
  "id": "studio-distress-signals-list",
  "dataSource": {
    "resourcePath": "operations/sinais-socorro",
    "query": {
      "sort": [
        "abertoEm,desc"
      ]
    }
  },
  "i18n": {
    "locale": "pt-BR"
  },
  "layout": {
    "variant": "list",
    "itemAppearance": "card",
    "itemSpacing": "default",
    "density": "comfortable",
    "pageSize": 6,
    "lines": 2,
    "dividers": "none",
    "rowLayout": {
      "type": "grid",
      "gap": "10px",
      "align": "center",
      "columns": [
        {
          "slot": "leading",
          "width": "40px",
          "align": "center",
          "justify": "center"
        },
        {
          "slot": "identity",
          "minWidth": "0px",
          "width": "1fr",
          "align": "center"
        },
        {
          "slot": "risk",
          "width": "96px",
          "align": "center",
          "justify": "center"
        },
        {
          "slot": "trailing",
          "width": "216px",
          "align": "center",
          "justify": "end"
        }
      ]
    },
    "virtualScroll": {
      "enabled": false,
      "itemSize": 68,
      "viewportHeight": "340px"
    }
  },
  "itemActions": [
    {
      "id": "despachar-equipe",
      "label": "Despachar Equipe Tática",
      "icon": "send",
      "kind": "icon",
      "color": "warn",
      "placement": "trailing",
      "showIf": {
        "==": [
          {
            "var": "item.status"
          },
          "ABERTO"
        ]
      }
    },
    {
      "id": "atender-chamado",
      "label": "Atender Chamado",
      "icon": "support_agent",
      "kind": "menu-item",
      "placement": "menu",
      "hateoasRel": "update"
    },
    {
      "id": "ver-detalhes",
      "label": "Ver Detalhes",
      "icon": "visibility",
      "kind": "menu-item",
      "placement": "menu"
    }
  ],
  "skin": {
    "type": "glass",
    "radius": "12px"
  },
  "selection": {
    "mode": "single",
    "showControl": false,
    "return": "item"
  },
  "rules": {
    "itemStyles": [
      {
        "id": "critical-open-signal",
        "condition": {
          "and": [
            {
              ">=": [
                {
                  "var": "item.nivelAmeaca"
                },
                4
              ]
            },
            {
              "==": [
                {
                  "var": "item.status"
                },
                "ABERTO"
              ]
            }
          ]
        },
        "tone": "danger"
      },
      {
        "id": "in-progress-signal",
        "condition": {
          "==": [
            {
              "var": "item.status"
            },
            "EM_ATENDIMENTO"
          ]
        },
        "tone": "warning"
      },
      {
        "id": "resolved-signal",
        "condition": {
          "==": [
            {
              "var": "item.status"
            },
            "RESOLVIDO"
          ]
        },
        "tone": "success"
      }
    ],
    "slotOverrides": [
      {
        "id": "leading-resolved-icon",
        "slot": "leading",
        "condition": {
          "==": [
            {
              "var": "item.status"
            },
            "RESOLVIDO"
          ]
        },
        "template": {
          "type": "icon",
          "expr": "verified",
          "color": "success"
        }
      },
      {
        "id": "leading-in-progress-icon",
        "slot": "leading",
        "condition": {
          "==": [
            {
              "var": "item.status"
            },
            "EM_ATENDIMENTO"
          ]
        },
        "template": {
          "type": "icon",
          "expr": "shield",
          "color": "warning"
        }
      },
      {
        "id": "leading-false-alarm-icon",
        "slot": "leading",
        "condition": {
          "==": [
            {
              "var": "item.status"
            },
            "FALSO"
          ]
        },
        "template": {
          "type": "icon",
          "expr": "block",
          "color": "neutral"
        }
      }
    ]
  },
  "templating": {
    "leading": {
      "type": "icon",
      "expr": "crisis_alert",
      "color": "danger"
    },
    "identity": {
      "type": "compose",
      "props": {
        "compose": {
          "direction": "column",
          "gap": "2px",
          "items": [
            {
              "type": "text",
              "expr": "${item.origem} · ${item.local}",
              "class": "primary"
            },
            {
              "type": "text",
              "expr": "Chamado #${item.id} · ${item.abertoEm|relative:pt-BR}",
              "class": "secondary"
            }
          ]
        }
      }
    },
    "primary": {
      "type": "text",
      "expr": "${item.origem} · ${item.local}"
    },
    "secondary": {
      "type": "text",
      "expr": "Ameaça Nível ${item.nivelAmeaca}"
    },
    "risk": {
      "type": "metric",
      "expr": "Nível ${item.nivelAmeaca}",
      "props": {
        "metric": {
          "label": "AMEAÇA",
          "valueExpr": "Nível ${item.nivelAmeaca}",
          "caption": "${item.nivelAmeaca|map:5=Crítico,4=Alto,3=Moderado,2=Baixo,1=Mínimo,0=Nulo}",
          "captionPosition": "below-progress",
          "toneExpr": "${item.nivelAmeaca|map:5=danger,4=danger,3=warning,2=positive,1=positive,0=neutral}",
          "align": "center",
          "progress": {
            "valueExpr": "${item.nivelAmeaca}",
            "max": 5
          }
        }
      }
    },
    "meta": {
      "type": "relative",
      "expr": "${item.abertoEm}"
    },
    "trailing": {
      "type": "chip",
      "expr": "${item.status}",
      "variant": "outlined",
      "color": "warning"
    },
    "chipColorMap": {
      "ABERTO": "danger",
      "EM_ATENDIMENTO": "warning",
      "RESOLVIDO": "success",
      "FALSO": "neutral"
    },
    "iconColorMap": {
      "ABERTO": "danger",
      "EM_ATENDIMENTO": "warning",
      "RESOLVIDO": "success",
      "FALSO": "neutral"
    }
  },
  "interaction": {
    "expandable": true,
    "expandTrigger": "row+icon",
    "expandMode": "single",
    "expandPlacement": "trailing"
  },
  "expansion": {
    "rendering": {
      "shell": "attached",
      "columns": 1,
      "padding": "12px 16px"
    },
    "sections": [
      {
        "id": "tactical-telemetry",
        "title": "Dossiê de Telemetria & Resposta Tática",
        "type": "key-value",
        "itemsExpr": "[{\"key\":\"Protocolo\",\"value\":\"#${item.id}\"},{\"key\":\"Origem do Sinal\",\"value\":\"${item.origem}\"},{\"key\":\"Setor / Teatro\",\"value\":\"${item.local}\"},{\"key\":\"Nível de Ameaça\",\"value\":\"Nível ${item.nivelAmeaca} / 5\"},{\"key\":\"Recebido em\",\"value\":\"${item.abertoEm|datetime:pt-BR:short}\"},{\"key\":\"Status Operacional\",\"value\":\"${item.status|map:ABERTO=Aberto — Despacho Imediato;EM_ATENDIMENTO=Em Atendimento;RESOLVIDO=Resolvido;FALSO=Alarme Falso}\"}]"
      }
    ]
  }
};

const INCIDENTS_TABLE_EDITOR_JSON = {
  "kind": "praxis.table.editor",
  "version": 1,
  "bindings": {
    "resourcePath": "operations/incidentes",
    "tableId": "studio-incidentes-recentes",
    "horizontalScroll": "auto"
  },
  "config": {
    "columns": [
      {
        "field": "id",
        "header": "Código",
        "width": "100px",
        "align": "center",
        "sortable": true
      },
      {
        "field": "descricao",
        "header": "Ocorrência / Sinistro",
        "width": "300px",
        "sortable": true
      },
      {
        "field": "severidade",
        "header": "Severidade",
        "width": "132px",
        "align": "center",
        "sortable": true,
        "valueMapping": {
          "CRITICA": "Crítica",
          "ALTA": "Alta",
          "MEDIA": "Média",
          "BAIXA": "Baixa"
        },
        "renderer": {
          "type": "chip",
          "chip": {
            "textField": "severidade",
            "variant": "soft",
            "color": "primary",
            "icon": "shield"
          }
        },
        "conditionalRenderers": [
          {
            "condition": {
              "==": [
                {
                  "var": "severidade"
                },
                "CRITICA"
              ]
            },
            "renderer": {
              "type": "chip",
              "chip": {
                "text": "Crítica",
                "variant": "soft",
                "color": "warn",
                "icon": "gpp_bad"
              }
            }
          },
          {
            "condition": {
              "==": [
                {
                  "var": "severidade"
                },
                "ALTA"
              ]
            },
            "renderer": {
              "type": "chip",
              "chip": {
                "text": "Alta",
                "variant": "soft",
                "color": "accent",
                "icon": "warning"
              }
            }
          },
          {
            "condition": {
              "==": [
                {
                  "var": "severidade"
                },
                "MEDIA"
              ]
            },
            "renderer": {
              "type": "chip",
              "chip": {
                "text": "Média",
                "variant": "soft",
                "color": "primary",
                "icon": "shield"
              }
            }
          },
          {
            "condition": {
              "==": [
                {
                  "var": "severidade"
                },
                "BAIXA"
              ]
            },
            "renderer": {
              "type": "chip",
              "chip": {
                "text": "Baixa",
                "variant": "outlined",
                "color": "basic",
                "icon": "verified_user"
              }
            }
          }
        ]
      },
      {
        "field": "contencao",
        "header": "Contenção Tática",
        "width": "180px",
        "renderer": {
          "type": "microVisualization",
          "microVisualization": {
            "visualization": {
              "kind": "radial",
              "surface": "table-cell",
              "valueExpr": "= max(15, 100 - round(min(85, (danosCivis / 4000000) * 100)))",
              "total": 100,
              "thresholds": [
                {
                  "min": 70,
                  "tone": "success"
                },
                {
                  "min": 40,
                  "max": 69,
                  "tone": "warning"
                },
                {
                  "max": 39,
                  "tone": "danger"
                }
              ],
              "fallbackText": "Contenção Tática"
            }
          }
        }
      },
      {
        "field": "local",
        "header": "Teatro Operacional",
        "width": "180px",
        "sortable": true
      },
      {
        "field": "ocorridoEm",
        "header": "Data / Hora",
        "type": "date",
        "format": "dd/MM/yyyy HH:mm",
        "width": "155px",
        "sortable": true
      },
      {
        "field": "danosCivis",
        "header": "Danos Civis (R$)",
        "type": "currency",
        "width": "150px",
        "align": "right",
        "sortable": true
      },
      {
        "field": "feridos",
        "header": "Feridos",
        "width": "90px",
        "align": "center",
        "sortable": true
      },
      {
        "field": "mortos",
        "header": "Baixas",
        "width": "90px",
        "align": "center",
        "sortable": true,
        "conditionalRenderers": [
          {
            "condition": {
              ">": [
                {
                  "var": "mortos"
                },
                0
              ]
            },
            "renderer": {
              "type": "badge",
              "badge": {
                "textField": "mortos",
                "variant": "soft",
                "color": "warn",
                "icon": "emergency"
              }
            }
          },
          {
            "condition": {
              "==": [
                {
                  "var": "mortos"
                },
                0
              ]
            },
            "renderer": {
              "type": "badge",
              "badge": {
                "text": "0",
                "variant": "soft",
                "color": "success",
                "icon": "verified_user"
              }
            }
          }
        ]
      }
    ],
    "toolbar": {
      "visible": true,
      "appearance": {
        "variant": "integrated",
        "density": "compact"
      },
      "filters": {
        "enabled": true,
        "showQuickFilters": true,
        "quickFilters": [
          {
            "id": "all",
            "label": "Todos",
            "icon": "apps",
            "filter": {}
          },
          {
            "id": "critica",
            "label": "Crítica",
            "icon": "gpp_bad",
            "filter": {
              "severidade": "CRITICA"
            }
          },
          {
            "id": "alta",
            "label": "Alta",
            "icon": "warning",
            "filter": {
              "severidade": "ALTA"
            }
          },
          {
            "id": "media",
            "label": "Média",
            "icon": "shield",
            "filter": {
              "severidade": "MEDIA"
            }
          }
        ]
      }
    },
    "appearance": {
      "density": "compact"
    },
    "localization": {
      "locale": "pt-BR",
      "currency": {
        "code": "BRL",
        "symbol": "R$",
        "position": "before",
        "spacing": true,
        "precision": 0
      }
    },
    "behavior": {
      "expansion": {
        "enabled": true,
        "contractVersion": "1.0.0",
        "identity": {
          "rowKeySource": "table.idField",
          "requireStableIdField": true
        },
        "state": {
          "mode": "uncontrolled"
        },
        "interaction": {
          "trigger": "icon",
          "toggleOnRowClick": false
        },
        "limits": {
          "allowMultiple": false,
          "maxExpandedRows": 1,
          "onOverflow": "collapseOldest"
        }
      },
      "detail": {
        "schemaContract": {
          "kind": "praxis.detail.schema",
          "version": "1.0.0",
          "compat": "semver",
          "allowedNodes": [
            "card",
            "value",
            "stack",
            "text",
            "icon",
            "badge",
            "compose",
            "metric",
            "progress",
            "richContent",
            "timeline",
            "list",
            "tabs",
            "tab",
            "mediaBlock",
            "cardGrid"
          ],
          "sanitization": "strict"
        },
        "rendering": {
          "strategy": "registry",
          "registryId": "praxis.detail.default",
          "rendererVersion": "1.0.0",
          "fallbackNodePolicy": "failClosed"
        },
        "source": {
          "mode": "inline",
          "inlineSchema": {
            "layout": "stack",
            "items": [
              {
                "type": "cardGrid",
                "title": "DOSSIÊ TÁTICO DE CAMPO & ANÁLISE FORENSE",
                "subtitle": "Protocolo de resposta rápida sob governança do Centro de Comando Tático",
                "columns": 3,
                "minCardWidth": 250,
                "cards": [
                  {
                    "title": "Contexto & Teatro Operacional",
                    "subtitle": "Geolocalização e vínculo de missão",
                    "variant": "outlined",
                    "tone": "primary",
                    "size": "sm",
                    "density": "compact",
                    "content": [
                      {
                        "type": "metric",
                        "label": "Teatro Operacional",
                        "valueExpr": "${row.local | default:Setor em varredura}",
                        "captionExpr": "Ocorrência #${row.id} · Missão #${row.missaoId | default:N/A}",
                        "icon": "location_on",
                        "tone": "primary"
                      },
                      {
                        "type": "compose",
                        "direction": "row",
                        "gap": "xs",
                        "items": [
                          {
                            "type": "badge",
                            "labelExpr": "SEVERIDADE ${row.severidade}",
                            "icon": "gpp_bad",
                            "tone": "danger",
                            "visibleWhen": {
                              "in": [
                                {
                                  "var": "row.severidade"
                                },
                                [
                                  "CRITICA",
                                  "CRÍTICA"
                                ]
                              ]
                            }
                          },
                          {
                            "type": "badge",
                            "labelExpr": "SEVERIDADE ${row.severidade}",
                            "icon": "warning",
                            "tone": "warning",
                            "visibleWhen": {
                              "===": [
                                {
                                  "var": "row.severidade"
                                },
                                "ALTA"
                              ]
                            }
                          },
                          {
                            "type": "badge",
                            "labelExpr": "SEVERIDADE ${row.severidade}",
                            "icon": "shield",
                            "tone": "info",
                            "visibleWhen": {
                              "in": [
                                {
                                  "var": "row.severidade"
                                },
                                [
                                  "MEDIA",
                                  "MÉDIA",
                                  "BAIXA"
                                ]
                              ]
                            }
                          },
                          {
                            "type": "badge",
                            "labelExpr": "MISSÃO #${row.missaoId | default:N/A}",
                            "icon": "radar",
                            "tone": "neutral"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "title": "Impacto Humano & Contenção",
                    "subtitle": "Triagem médica e cordão de isolamento",
                    "variant": "outlined",
                    "tone": "warning",
                    "size": "sm",
                    "density": "compact",
                    "content": [
                      {
                        "type": "metric",
                        "label": "Vítimas & Feridos em Atendimento",
                        "valueExpr": "${row.feridos | default:0 | number} feridos",
                        "captionExpr": "${row.mortos | default:0 | number} baixas fatais confirmadas",
                        "icon": "medical_services",
                        "tone": "warning"
                      },
                      {
                        "type": "compose",
                        "direction": "row",
                        "gap": "xs",
                        "items": [
                          {
                            "type": "badge",
                            "label": "ALERTA DE BAIXAS",
                            "icon": "emergency",
                            "tone": "danger",
                            "visibleWhen": {
                              ">": [
                                {
                                  "var": "row.mortos"
                                },
                                0
                              ]
                            }
                          },
                          {
                            "type": "badge",
                            "label": "ZERO BAIXAS FATAIS",
                            "icon": "verified_user",
                            "tone": "success",
                            "visibleWhen": {
                              "===": [
                                {
                                  "var": "row.mortos"
                                },
                                0
                              ]
                            }
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "title": "Auditoria & Impacto Patrimonial",
                    "subtitle": "Estimativa pericial e registro cronológico",
                    "variant": "outlined",
                    "tone": "info",
                    "size": "sm",
                    "density": "compact",
                    "content": [
                      {
                        "type": "metric",
                        "label": "Danos Civis Estimados",
                        "valueExpr": "${row.danosCivis | default:0 | currency}",
                        "captionExpr": "Registro: ${row.ocorridoEm | dateTime}",
                        "icon": "account_balance_wallet",
                        "tone": "info"
                      },
                      {
                        "type": "badge",
                        "label": "PERÍMETRO ISOLADO · AUDITORIA ATIVA",
                        "icon": "policy",
                        "tone": "primary"
                      }
                    ]
                  }
                ]
              },
              {
                "type": "richContent",
                "document": {
                  "kind": "praxis.rich-content",
                  "version": "1.0.0",
                  "nodes": [
                    {
                      "type": "callout",
                      "tone": "info",
                      "icon": "security",
                      "title": "Síntese Forense & Diretiva de Contenção",
                      "messageExpr": "${row.descricao} — Perímetro isolado pela força tática no setor ${row.local} (Missão #${row.missaoId | default:N/A}). Esquadrões de perícia coordenando blindagem e monitoramento contínuo."
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    }
  }
};

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function moveCursorToLocator(page, locator, pauseMs = 90) {
  try {
    const box = await locator.boundingBox();
    if (!box) return;
    const x = Math.round(box.x + Math.min(box.width / 2, 120));
    const y = Math.round(box.y + Math.min(box.height / 2, 32));
    await page.evaluate(({ x, y }) => {
      if (window.__praxisMoveCursor) window.__praxisMoveCursor(x, y, true);
    }, { x, y });
    if (pauseMs > 0) await sleep(pauseMs);
  } catch {
    // ignore if element detached
  }
}

async function setFormInput(page, selector, value) {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: 'visible', timeout: 10000 });
  await moveCursorToLocator(page, loc, 60);
  await loc.fill(String(value));
  await loc.dispatchEvent('input');
  await loc.dispatchEvent('change');
  await loc.blur();
}

async function selectMatOption(page, selectLocator, optionTextOrPredicate, { pauseBeforeClickMs = 0 } = {}) {
  await selectLocator.waitFor({ state: 'visible', timeout: 10000 });
  for (let w = 0; w < 100; w++) {
    if ((await selectLocator.getAttribute('aria-disabled')) !== 'true') break;
    await sleep(150);
  }
  await selectLocator.scrollIntoViewIfNeeded().catch(() => {});
  await moveCursorToLocator(page, selectLocator, 70);
  const options = page.locator('.cdk-overlay-container mat-option');
  for (let openAttempt = 0; openAttempt < 3; openAttempt++) {
    await selectLocator.click({ force: true });
    try {
      await options.first().waitFor({ state: 'visible', timeout: 3500 });
      break;
    } catch {
      await sleep(200);
    }
  }
  await options.first().waitFor({ state: 'visible', timeout: 10000 });
  if (pauseBeforeClickMs > 0) {
    await sleep(pauseBeforeClickMs);
  }
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const opt = options.nth(i);
    const text = (await opt.innerText()).trim();
    const widgetKey = (await opt.getAttribute('data-widget-key')) || '';
    const matches = typeof optionTextOrPredicate === 'function'
      ? optionTextOrPredicate(text, widgetKey)
      : text.toLowerCase().includes(String(optionTextOrPredicate).toLowerCase()) ||
        widgetKey.toLowerCase() === String(optionTextOrPredicate).toLowerCase();
    if (matches) {
      await opt.scrollIntoViewIfNeeded().catch(() => {});
      await sleep(80);
      await moveCursorToLocator(page, opt, 60);
      await opt.click();
      await sleep(200);
      return text;
    }
  }
  const allTexts = [];
  for (let i = 0; i < count; i++) {
    allTexts.push((await options.nth(i).innerText()).trim());
  }
  throw new Error(`Could not find mat-option matching ${optionTextOrPredicate}. Available: ${JSON.stringify(allTexts)}`);
}

async function selectRichFieldOption(page, selectLocator, targetCodeOrLabel) {
  await selectLocator.waitFor({ state: 'visible', timeout: 10000 });
  for (let w = 0; w < 100; w++) {
    if ((await selectLocator.getAttribute('aria-disabled')) !== 'true') break;
    await sleep(150);
  }
  if ((await selectLocator.getAttribute('aria-disabled')) === 'true') {
    throw new Error(`mat-select remained aria-disabled=true when trying to select "${targetCodeOrLabel}"`);
  }
  await selectLocator.scrollIntoViewIfNeeded().catch(() => {});
  await moveCursorToLocator(page, selectLocator, 70);
  const options = page.locator('.cdk-overlay-container mat-option');
  for (let openAttempt = 0; openAttempt < 3; openAttempt++) {
    await selectLocator.click({ force: true });
    try {
      await options.first().waitFor({ state: 'visible', timeout: 3500 });
      break;
    } catch {
      await sleep(200);
    }
  }
  await options.first().waitFor({ state: 'visible', timeout: 10000 });
  const needle = String(targetCodeOrLabel).trim().toLowerCase();

  const items = await options.evaluateAll((els) =>
    els.map((el, idx) => {
      const code = el.querySelector('.editor-rich-option__code')?.textContent?.trim() || '';
      const label = el.querySelector('.editor-rich-option__label')?.textContent?.trim() || '';
      const codeParts = code.split('·').map((s) => s.trim().toLowerCase()).filter(Boolean);
      return { idx, code, label, codeLower: code.toLowerCase(), labelLower: label.toLowerCase(), codeParts };
    })
  );

  let match = items.find(
    (it) => it.codeLower === needle || it.labelLower === needle || it.codeParts.includes(needle)
  );
  if (!match) {
    match = items.find(
      (it) => (it.codeLower && it.codeLower.includes(needle)) || (it.labelLower && it.labelLower.includes(needle))
    );
  }

  if (!match) {
    throw new Error(
      `Could not find rich field mat-option matching "${targetCodeOrLabel}". Available: ${JSON.stringify(
        items.map((it) => ({ code: it.code, label: it.label }))
      )}`
    );
  }

  const opt = options.nth(match.idx);
  await opt.scrollIntoViewIfNeeded().catch(() => {});
  await sleep(100);
  await moveCursorToLocator(page, opt, 60);
  await opt.click();
  await sleep(250);
  if ((await options.count()) > 0) {
    await opt.click({ force: true }).catch(() => {});
    await sleep(150);
  }
  return match.label || match.code;
}

async function saveAndCloseSettingsPanel(page, label = '') {
  const saveBtn = page.locator('[data-testid="settings-panel-save"]');
  const applyBtn = page.locator('[data-testid="settings-panel-apply"]');
  await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
  for (let w = 0; w < 50; w++) {
    if (!(await saveBtn.isDisabled())) break;
    await sleep(200);
  }
  await sleep(200);

  if (!(await saveBtn.isDisabled())) {
    await moveCursorToLocator(page, saveBtn, 80);
    await saveBtn.click();
    console.log(`  [ok] Saved & closed settings panel for ${label}`);
    await page.locator('praxis-settings-panel').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await sleep(150);
    return;
  }

  const issues = await page.locator('praxis-settings-panel').evaluate((el) =>
    Array.from(el.querySelectorAll('[role="alert"], [role="status"], .validation-issue')).map((n) => n.textContent.trim())
  );
  if (label.startsWith('chart:')) {
    throw new Error(`[Dashboard API Integration Audit] Save button disabled for ${label}! Validation issues: ${JSON.stringify(issues)}`);
  }

  if (!(await applyBtn.isDisabled())) {
    await moveCursorToLocator(page, applyBtn, 80);
    await applyBtn.click();
    console.log(`  [ok] Applied settings panel for ${label}`);
    await sleep(350);
  } else {
    console.log(`  [warn] Save & Apply disabled for ${label} (issues: ${JSON.stringify(issues)}), closing...`);
  }

  const closeIcon = page.locator('[data-testid="settings-panel-close-icon"]');
  if (await closeIcon.isVisible()) {
    await moveCursorToLocator(page, closeIcon, 70);
    await closeIcon.click({ force: true });
    await sleep(600);
  }
  const dialogConfirmBtn = page.locator('.cdk-overlay-container mat-dialog-container [mat-dialog-actions] button').last();
  if (await dialogConfirmBtn.isVisible()) {
    await dialogConfirmBtn.click({ force: true });
    await sleep(500);
  }
  for (let i = 0; i < 20; i++) {
    if (!(await page.locator('praxis-settings-panel').isVisible())) break;
    await sleep(100);
  }
  await sleep(150);
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

async function openWidgetEditor(page, widgetKey, mode = 'content') {
  await dismissStrayBackdrops(page);
  const dialogConfirmBtn = page.locator('.cdk-overlay-container mat-dialog-container [mat-dialog-actions] button').last();
  if (await dialogConfirmBtn.isVisible()) {
    await dialogConfirmBtn.click();
    await sleep(300);
  }

  const closeIcon = page.locator('[data-testid="settings-panel-close-icon"]');
  if (await closeIcon.isVisible()) {
    await closeIcon.click({ force: true });
    await sleep(350);
    if (await dialogConfirmBtn.isVisible()) {
      await dialogConfirmBtn.click();
      await sleep(350);
    }
    await page.locator('praxis-settings-panel').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  const btnSelector = mode === 'shell'
    ? `[data-widget-key="${widgetKey}"] [data-testid="dynamic-widget-shell-settings"]`
    : `[data-widget-key="${widgetKey}"] [data-testid="dynamic-widget-component-settings"]`;

  const expectedInsidePanel = mode === 'shell'
    ? '[data-testid="widget-shell-identity"]'
    : 'praxis-settings-panel';

  for (let attempt = 0; attempt < 5; attempt++) {
    await dismissStrayBackdrops(page);
    const item = page.locator(`[data-widget-key="${widgetKey}"]`);
    await item.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }));
    await sleep(200);
    const box = await item.boundingBox();
    await moveCursorToLocator(page, item, 70);
    await item.click({
      position: box ? { x: Math.min(80, Math.max(32, Math.floor(box.width / 2))), y: Math.min(48, Math.max(28, Math.floor(box.height / 2))) } : { x: 48, y: 36 },
      force: true
    });
    await sleep(300);
    await dismissStrayBackdrops(page);

    const btn = page.locator(btnSelector).first();
    if (await btn.isVisible()) {
      await moveCursorToLocator(page, btn, 70);
      await btn.click({ force: true });
      for (let w = 0; w < 15; w++) {
        await sleep(150);
        if (await page.locator(expectedInsidePanel).isVisible()) break;
      }
    }
    if (await page.locator(expectedInsidePanel).isVisible()) {
      break;
    }
  }

  await page.locator(expectedInsidePanel).waitFor({ state: 'visible', timeout: 10000 });
  await dismissStrayBackdrops(page);
}

async function insertWidgetsBatchFromPalette(page, batchSpecs, recorder = null) {
  const beforeKeys = await page.locator('[data-widget-key]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-widget-key'))
  );
  const dialog = page.locator('praxis-component-palette-dialog');
  if (!(await dialog.isVisible())) {
    const addBtn = page.locator('praxis-floating-toolbar button[aria-label="Inserir componente"]');
    await addBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, addBtn, 90);
    await addBtn.click();
  }

  const searchInput = page.locator('[data-testid="component-palette-search"]');
  await searchInput.waitFor({ state: 'visible', timeout: 10000 });

  const batchToggle = page.locator('[data-testid="palette-batch-mode-toggle"]');
  await batchToggle.waitFor({ state: 'visible', timeout: 10000 });
  if ((await batchToggle.getAttribute('aria-pressed')) !== 'true') {
    await moveCursorToLocator(page, batchToggle, 80);
    await batchToggle.click();
    await sleep(180);
  }

  let currentColSpan = null;
  let currentComponentId = null;

  for (let i = 0; i < batchSpecs.length; i++) {
    const spec = batchSpecs[i];
    if (spec.colSpan !== undefined && spec.colSpan !== currentColSpan) {
      const widthChip = page.locator(`[data-testid="palette-colspan-${spec.colSpan}"]`);
      if (await widthChip.isVisible()) {
        await moveCursorToLocator(page, widthChip, 55);
        await widthChip.click();
        await sleep(80);
        currentColSpan = spec.colSpan;
      }
    }

    if (spec.id !== currentComponentId) {
      await moveCursorToLocator(page, searchInput, 45);
      await searchInput.fill(spec.id);
      await sleep(140);
      currentComponentId = spec.id;
    }

    const cardBtn = page.locator('praxis-component-palette-dialog button.pdx-card').first();
    await cardBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, cardBtn, 55);
    await cardBtn.click();
    await sleep(110);
  }

  const stagingTray = page.locator('[data-testid="palette-staging-tray"]');
  await stagingTray.waitFor({ state: 'visible', timeout: 10000 });
  const queuedCoords = await page.locator('[data-testid="palette-queued-coords"]').evaluateAll((els) =>
    els.map((el) => el.textContent.trim())
  );
  console.log(`  [palette:batch] Staging tray queued ${queuedCoords.length} items: ${queuedCoords.join(' | ')}`);

  await sleep(350);
  if (recorder) {
    await recorder.captureSyncKeyframe();
  }
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'frame-1080p30-batch-staging-tray.png'),
    scale: 'css'
  });
  await sleep(450);

  const commitBatchBtn = page.locator('[data-testid="component-palette-commit-batch"]');
  await commitBatchBtn.waitFor({ state: 'visible', timeout: 10000 });
  await moveCursorToLocator(page, commitBatchBtn, 110);
  await commitBatchBtn.click();
  await dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  await sleep(400);

  const afterKeys = await page.locator('[data-widget-key]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-widget-key'))
  );
  const newKeys = afterKeys.filter((k) => !beforeKeys.includes(k));
  if (newKeys.length !== batchSpecs.length) {
    throw new Error(`Expected ${batchSpecs.length} newly inserted widgets from batch commit, got ${newKeys.length}`);
  }
  return newKeys;
}

async function applyContentAndSwitchToShellInDrawer(page, widgetKey, label = '') {
  const applyBtn = page.locator('[data-testid="settings-panel-apply"]');
  await applyBtn.waitFor({ state: 'visible', timeout: 10000 });
  for (let w = 0; w < 45; w++) {
    if (!(await applyBtn.isDisabled())) break;
    await sleep(150);
  }
  if (!(await applyBtn.isDisabled())) {
    await moveCursorToLocator(page, applyBtn, 70);
    await applyBtn.click();
    console.log(`  [ok] Applied content in-place for ${label} (keeping drawer open for Card/Shell tab)`);
    await sleep(240);
  }
  const widgetModeTab = page.locator('[data-testid="settings-panel-mode-widget"]');
  if (await widgetModeTab.isVisible().catch(() => false)) {
    await moveCursorToLocator(page, widgetModeTab, 75);
    await widgetModeTab.click();
    for (let w = 0; w < 20; w++) {
      await sleep(120);
      if (await page.locator('[data-testid="widget-shell-identity"]').isVisible().catch(() => false)) {
        return true;
      }
    }
  }
  return false;
}

async function configureWidgetShell(page, widgetKey, { title, subtitle, kind, icon, showHeader }, { alreadyInShellTab = false } = {}) {
  console.log(`[shell] Configuring shell for ${widgetKey} (${title || 'borderless'})...`);
  if (!alreadyInShellTab || !(await page.locator('[data-testid="widget-shell-identity"]').isVisible().catch(() => false))) {
    await openWidgetEditor(page, widgetKey, 'shell');
  }

  const identity = page.locator('[data-testid="widget-shell-identity"]');
  await identity.waitFor({ state: 'visible', timeout: 10000 });

  const inputs = identity.locator('input');
  if (title !== undefined) {
    await inputs.nth(0).fill(title);
    await inputs.nth(0).dispatchEvent('input');
  }
  if (subtitle !== undefined) {
    await inputs.nth(1).fill(subtitle);
    await inputs.nth(1).dispatchEvent('input');
  }

  const headerOpts = page.locator('[data-testid="widget-shell-header-options"]');
  const selects = headerOpts.locator('mat-select');
  if (kind) {
    await selectMatOption(page, selects.nth(0), (txt) =>
      kind === 'none'
        ? txt.toLowerCase().includes('somente') || txt.toLowerCase().includes('sem') || txt.toLowerCase().includes('none')
        : txt.toLowerCase().includes('moldura') || txt.toLowerCase().includes('card') || txt.toLowerCase().includes('painel')
    );
  }
  if (icon !== undefined) {
    const iconInput = headerOpts.locator('input').first();
    await iconInput.fill(icon);
    await iconInput.dispatchEvent('input');
  }
  if (showHeader) {
    await selectMatOption(page, selects.nth(1), (txt) => {
      const t = txt.toLowerCase();
      if (showHeader === 'false') return t.includes('ocult') || t.includes('hide') || t.includes('false') || t.includes('nunca');
      if (showHeader === 'true') return t.includes('sempre') || t.includes('always') || t.includes('show') || t.includes('exibir');
      return t.includes('auto');
    });
  }

  await saveAndCloseSettingsPanel(page, `shell:${widgetKey}`);
}

async function configureRichContentWidget(page, widgetKey, docObj, shellConfig = null) {
  console.log(`[rich-content] Configuring RichContent for ${widgetKey}...`);
  await openWidgetEditor(page, widgetKey, 'content');

  const jsonTab = page.locator('[data-testid="rich-content-json-tab"]');
  await jsonTab.waitFor({ state: 'visible', timeout: 10000 });
  await moveCursorToLocator(page, jsonTab, 70);
  await jsonTab.click();
  await sleep(250);

  const textarea = page.locator('textarea[name="rich-content-document"]');
  await textarea.waitFor({ state: 'visible', timeout: 10000 });
  await moveCursorToLocator(page, textarea, 60);
  await textarea.fill(JSON.stringify(docObj, null, 2));
  await textarea.dispatchEvent('input');
  await textarea.dispatchEvent('change');
  await sleep(300);

  if (shellConfig) {
    const switched = await applyContentAndSwitchToShellInDrawer(page, widgetKey, `rich-content:${widgetKey}`);
    await configureWidgetShell(page, widgetKey, shellConfig, { alreadyInShellTab: switched });
  } else {
    await saveAndCloseSettingsPanel(page, `rich-content:${widgetKey}`);
  }
}

async function configureChartWidget(page, widgetKey, cfg, shellConfig = null) {
  console.log(`[chart] Configuring Chart for ${widgetKey} (${cfg.title || cfg.shellTitle})...`);
  const tStart = Date.now();
  await openWidgetEditor(page, widgetKey, 'content');

  const editor = page.locator('[data-testid="chart-widget-config-editor"]');
  await editor.waitFor({ state: 'visible', timeout: 10000 });
  await dismissStrayBackdrops(page);

  if (cfg.sourceKind !== 'praxis.stats') {
    throw new Error(`[Dashboard API Integration Audit] Chart ${widgetKey} must use sourceKind='praxis.stats', got '${cfg.sourceKind}'`);
  }
  if (cfg.localRows || cfg.localRow || cfg.fallbackLocalRows) {
    throw new Error(`[Dashboard API Integration Audit] Chart ${widgetKey} is forbidden from using static localRows/fallbackLocalRows.`);
  }

  // 1. General section
  const secGen = page.locator('[data-testid="chart-editor-section-general"]');
  await moveCursorToLocator(page, secGen, 60);
  await secGen.click();
  await sleep(200);
  await setFormInput(page, '[data-testid="chart-editor-title-input"]', cfg.title ?? '');
  const genInputs = editor.locator('praxis-chart-config-editor input');
  if ((await genInputs.count()) >= 3) {
    await genInputs.nth(2).fill(cfg.subtitle ?? '');
    await genInputs.nth(2).dispatchEvent('input');
    await genInputs.nth(2).dispatchEvent('change');
  }

  const generalSelects = editor.locator('praxis-chart-config-editor mat-select');
  await selectMatOption(page, generalSelects.nth(0), (txt) => txt.toLowerCase().includes(cfg.kindLabel.toLowerCase()));

  // 2. Data section — strictly governed praxis.stats
  const secData = page.locator('[data-testid="chart-editor-section-data"]');
  await moveCursorToLocator(page, secData, 60);
  await secData.click();
  await sleep(250);
  await selectMatOption(page, page.locator('[data-testid="chart-editor-source-kind"]'), (txt) =>
    txt.toLowerCase().includes('stats') || txt.toLowerCase().includes('govern') || txt.toLowerCase().includes('praxis')
  );
  await sleep(300);

  const tResStart = Date.now();
  await selectRichFieldOption(page, page.locator('[data-testid="chart-editor-resource"]'), cfg.resourceMatch);
  await sleep(250);
  for (let attempt = 0; attempt < 120; attempt++) {
    const resolving = await page.locator('[data-testid="chart-editor-resolving-resource"]').count();
    const opDisabled = await page.locator('[data-testid="chart-editor-operation"]').getAttribute('aria-disabled');
    if (resolving === 0 && opDisabled !== 'true') break;
    await sleep(150);
  }
  console.log(`  [chart:G2] Resolved resource "${cfg.resourceMatch}" in ${Date.now() - tResStart}ms`);
  await selectMatOption(page, page.locator('[data-testid="chart-editor-operation"]'), (txt) =>
    txt.toLowerCase().includes(cfg.operationMatch.toLowerCase())
  );
  await sleep(350);

  if (cfg.granularityMatch) {
    const dataSelects = editor.locator('praxis-chart-config-editor mat-select');
    if ((await dataSelects.count()) >= 4) {
      await selectMatOption(page, dataSelects.nth(3), (txt) =>
        txt.toLowerCase().includes(cfg.granularityMatch.toLowerCase())
      );
      await sleep(200);
    }
  }

  // 3. Analytics section
  const secAnalytics = page.locator('[data-testid="chart-editor-section-analytics"]');
  await moveCursorToLocator(page, secAnalytics, 60);
  await secAnalytics.click();
  await sleep(350);

  if (cfg.gaugeMax !== undefined) {
    const gaugeMin = page.locator('[data-testid="chart-editor-gauge-min"]');
    if (await gaugeMin.isVisible()) {
      await setFormInput(page, '[data-testid="chart-editor-gauge-min"]', cfg.gaugeMin ?? 0);
      await setFormInput(page, '[data-testid="chart-editor-gauge-max"]', cfg.gaugeMax);
    }
  }

  const dimSelect = page.locator('[data-testid="chart-editor-dimension-field-0"] mat-select');
  await selectRichFieldOption(page, dimSelect, cfg.dimensionMatch);
  await sleep(250);

  const metricField0 = page.locator('[data-testid="chart-editor-metric-field-0"] mat-select');
  await selectRichFieldOption(page, metricField0, cfg.metric0.fieldMatch);
  await sleep(200);
  await setFormInput(page, '[data-testid="chart-editor-metric-label-0"] input', cfg.metric0.label);
  await selectMatOption(page, page.locator('[data-testid="chart-editor-metric-aggregation-0"] mat-select'), (txt) =>
    txt.toLowerCase().includes(cfg.metric0.aggMatch.toLowerCase())
  );

  if (cfg.metric1) {
    const addMetricBtn = page.locator('[data-testid="chart-editor-add-metric"]');
    await addMetricBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, addMetricBtn, 60);
    await addMetricBtn.click();
    await sleep(300);
    await selectRichFieldOption(page, page.locator('[data-testid="chart-editor-metric-field-1"] mat-select'), cfg.metric1.fieldMatch);
    await setFormInput(page, '[data-testid="chart-editor-metric-label-1"] input', cfg.metric1.label);
    await selectMatOption(page, page.locator('[data-testid="chart-editor-metric-aggregation-1"] mat-select'), (txt) =>
      txt.toLowerCase().includes(cfg.metric1.aggMatch.toLowerCase())
    );
  }

  // 4. Appearance section (set custom palette)
  if (cfg.colors) {
    const secApp = page.locator('[data-testid="chart-editor-section-appearance"]');
    await moveCursorToLocator(page, secApp, 60);
    await secApp.click();
    await sleep(250);
    const appSelects = editor.locator('praxis-chart-config-editor mat-select');
    await selectMatOption(page, appSelects.nth(1), (txt) =>
      txt.toLowerCase().includes('custom') || txt.toLowerCase().includes('personaliz') || txt.toLowerCase().includes('cores')
    );
    await sleep(200);
    const colorsArea = editor.locator('praxis-chart-config-editor textarea').first();
    if (await colorsArea.isVisible()) {
      await colorsArea.fill(cfg.colors.join(', '));
      await colorsArea.dispatchEvent('input');
      await colorsArea.dispatchEvent('change');
    }
  }

  // 5. Events section
  if (cfg.crossFilterMapping) {
    const secEvt = page.locator('[data-testid="chart-editor-section-events"]');
    await moveCursorToLocator(page, secEvt, 60);
    await secEvt.click();
    await sleep(250);
    await selectMatOption(page, page.locator('[data-testid="chart-editor-event-crossFilter-action"]'), (txt) =>
      txt.toLowerCase().includes('emit')
    );
    await sleep(200);
    const mappingText = Object.entries(cfg.crossFilterMapping)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    await setFormInput(
      page,
      '[data-testid="chart-editor-event-crossFilter-mapping"]',
      mappingText
    );
  }

  console.log(`  [chart] Configured ${widgetKey} in ${Date.now() - tStart}ms`);
  if (shellConfig) {
    const switched = await applyContentAndSwitchToShellInDrawer(page, widgetKey, `chart:${widgetKey}`);
    await configureWidgetShell(page, widgetKey, shellConfig, { alreadyInShellTab: switched });
  } else {
    await saveAndCloseSettingsPanel(page, `chart:${widgetKey}`);
  }
}

async function configureListWidget(page, widgetKey, resourceMatch, listConfig, shellConfig = null) {
  console.log(`[list] Configuring List for ${widgetKey}...`);
  await openWidgetEditor(page, widgetKey, 'content');

  const editor = page.locator('[data-testid="list-widget-config-editor"]');
  await editor.waitFor({ state: 'visible', timeout: 10000 });

  const resourceSelect = editor.locator('[data-testid="list-widget-resource-select"]');
  if (await resourceSelect.isVisible()) {
    await selectMatOption(page, resourceSelect, (txt) => txt.toLowerCase().includes(resourceMatch.toLowerCase()));
    await sleep(400);
  }

  const jsonTab = editor.locator('.mat-mdc-tab', { hasText: 'JSON' });
  await moveCursorToLocator(page, jsonTab, 60);
  await jsonTab.click();
  await sleep(300);

  const jsonArea = editor.locator('textarea.json-textarea');
  await jsonArea.waitFor({ state: 'visible', timeout: 10000 });
  await jsonArea.fill(JSON.stringify(listConfig, null, 2));
  await jsonArea.dispatchEvent('input');
  await sleep(450);

  const applyJsonBtn = editor.locator('button', { hasText: 'Aplicar JSON' });
  if (await applyJsonBtn.isEnabled()) {
    await moveCursorToLocator(page, applyJsonBtn, 70);
    await applyJsonBtn.click();
    await sleep(250);
  }

  if (shellConfig) {
    const switched = await applyContentAndSwitchToShellInDrawer(page, widgetKey, `list:${widgetKey}`);
    await configureWidgetShell(page, widgetKey, shellConfig, { alreadyInShellTab: switched });
  } else {
    await saveAndCloseSettingsPanel(page, `list:${widgetKey}`);
  }
}

async function configureTableWidget(page, widgetKey, tableEditorDoc, shellConfig = null) {
  console.log(`[table] Configuring Table for ${widgetKey}...`);
  await openWidgetEditor(page, widgetKey, 'content');

  const editor = page.locator('[data-testid="table-widget-config-editor"]');
  await editor.waitFor({ state: 'visible', timeout: 10000 });

  // Verify G6: .editor-section-selector is visible inside Settings Panel!
  const sectionSelectorVisible = await editor.locator('.editor-section-selector').isVisible();
  console.log(`  [table:G6] Section selector visible in Settings Panel: ${sectionSelectorVisible}`);

  const sourceSelect = editor.locator('[data-testid="table-widget-config-source"]');
  if (await sourceSelect.isVisible()) {
    await selectMatOption(page, sourceSelect, (txt) =>
      txt.toLowerCase().includes('definida') ||
      txt.toLowerCase().includes('página') ||
      txt.toLowerCase().includes('input') ||
      txt.toLowerCase().includes('explícit')
    );
    await sleep(250);
  }

  const jsonTab = editor.locator('.mat-mdc-tab', { hasText: 'JSON' }).first();
  await moveCursorToLocator(page, jsonTab, 60);
  await jsonTab.evaluate((el) => el.click());
  await sleep(350);

  const jsonArea = editor.locator('[data-testid="table-json-textarea"]');
  await jsonArea.waitFor({ state: 'visible', timeout: 10000 });
  await jsonArea.fill(JSON.stringify(tableEditorDoc, null, 2));
  await jsonArea.dispatchEvent('input');
  await sleep(450);

  const applyJsonBtn = editor.locator('[data-testid="table-json-apply"]');
  if (await applyJsonBtn.isEnabled()) {
    await moveCursorToLocator(page, applyJsonBtn, 70);
    await applyJsonBtn.click();
    await sleep(300);
  }

  if (shellConfig) {
    const switched = await applyContentAndSwitchToShellInDrawer(page, widgetKey, `table:${widgetKey}`);
    await configureWidgetShell(page, widgetKey, shellConfig, { alreadyInShellTab: switched });
  } else {
    await saveAndCloseSettingsPanel(page, `table:${widgetKey}`);
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

async function smoothScrollDashboard(page, targetScrollTop, durationMs = 900) {
  await page.evaluate(
    async ({ targetScrollTop, durationMs }) => {
      const scroller =
        Array.from(document.querySelectorAll('.page-canvas, .studio-canvas, main, .app-content, body, html')).find(
          (el) => el.scrollHeight > el.clientHeight + 40
        ) || document.scrollingElement || document.documentElement;
      const start = scroller.scrollTop;
      const delta = targetScrollTop - start;
      const steps = Math.max(20, Math.round(durationMs / 33));
      const stepWait = Math.max(16, Math.floor(durationMs / steps));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        scroller.scrollTop = start + delta * ease;
        await new Promise((r) => setTimeout(r, stepWait));
      }
    },
    { targetScrollTop, durationMs }
  ).catch(() => {});
}

/**
 * Dashboard API Integration Audit — Live Runtime Verification Session
 * Guarantees that 100% of widgets in the authored dashboard use governed API DataSources
 * or state bindings, with ZERO static local datasets (source.kind='derived' / inputs.data).
 */
async function runDashboardApiIntegrationAudit(page, expectedWidgets) {
  console.log('\n================================================================');
  console.log(' [Dashboard API Integration Audit] Executando Auditoria de Integração...');
  console.log('================================================================');
  await setDemoStage(
    page,
    9,
    9,
    'DASHBOARD API INTEGRATION AUDIT · ZERO STATIC DATA',
    'Auditando Contratos dos 13 Widgets: 100% Conectados a APIs Governadas (/stats & /filter)',
    'Zero source.kind="derived" · Zero inputs.data estáticos · 7 DataSources ativos'
  );

  // Wait up to 12s for all 4 praxis-chart widgets to finish loading remote stats
  for (let w = 0; w < 60; w++) {
    const loadingCount = await page.locator('praxis-chart .praxis-chart-state-loading').count();
    if (loadingCount === 0) break;
    await sleep(200);
  }
  await sleep(400);

  const auditResult = await page.evaluate(() => {
    const violations = [];
    const verified = [];
    let snapshot = null;

    for (const key of Object.keys(localStorage)) {
      if (key.includes('comando-studio') || key.includes('tactical-command-studio')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key));
          const candidate =
            parsed?.payload || parsed?.value || parsed?.data || parsed?.config || parsed;
          if (candidate && Array.isArray(candidate.widgets)) {
            snapshot = candidate;
            break;
          }
        } catch {}
      }
    }

    if (!snapshot) {
      const builderEl = document.querySelector('praxis-dynamic-page-builder, praxis-dynamic-page');
      const comp = builderEl && window.ng && typeof window.ng.getComponent === 'function'
        ? window.ng.getComponent(builderEl)
        : null;
      const liveDef =
        (typeof comp?.effectiveConfig === 'function' ? comp.effectiveConfig() : comp?.effectiveConfig) ||
        (typeof comp?.config === 'function' ? comp.config() : comp?.config);
      if (liveDef && Array.isArray(liveDef.widgets)) {
        snapshot = liveDef;
      }
    }

    if (!snapshot) {
      return { ok: false, violations: ['Snapshot persistido do dashboard não encontrado em localStorage nem no componente ativo'], verified };
    }

    const dsIds = (snapshot.dataSources || []).map((ds) => ds.id);
    const requiredDs = [
      'heroesStats',
      'missionsStats',
      'payrollStats',
      'incidentsStats',
      'assetsStats',
      'threatsStats',
      'recentMissionsFeed'
    ];
    for (const id of requiredDs) {
      if (!dsIds.includes(id)) {
        violations.push(`DataSource obrigatório ausente: ${id}`);
      }
    }
    verified.push(`DataSources da página: ${dsIds.length}/7 ativos (${dsIds.join(', ')})`);

    for (const widget of snapshot.widgets || []) {
      const wKey = widget.key || widget.id;
      const compId = widget.definition?.id;
      const inputs = widget.definition?.inputs || {};

      if (compId === 'praxis-chart') {
        const docSourceKind = inputs.chartDocument?.source?.kind;
        const cfgSourceKind = inputs.config?.dataSource?.query?.sourceKind;
        const cfgDataSourceKind = inputs.config?.dataSource?.kind;
        const resourcePath = inputs.config?.dataSource?.resourcePath || inputs.chartDocument?.source?.resource;
        const dimField = inputs.chartDocument?.dimensions?.[0]?.field;

        if (docSourceKind === 'derived' || cfgDataSourceKind === 'local') {
          violations.push(`Gráfico ${wKey} usa fonte estática/derivada (docSourceKind=${docSourceKind}, dataSource.kind=${cfgDataSourceKind})`);
        }
        if (Array.isArray(inputs.data) && inputs.data.length > 0) {
          violations.push(`Gráfico ${wKey} possui inputs.data estático (${inputs.data.length} registros)`);
        }
        if (!dimField || dimField === 'category') {
          violations.push(`Gráfico ${wKey} permaneceu com dimensão padrão inválida (${dimField})`);
        }
        if (docSourceKind !== 'praxis.stats' && cfgSourceKind !== 'praxis.stats') {
          violations.push(`Gráfico ${wKey} não está vinculado a praxis.stats`);
        } else {
          verified.push(`Gráfico ${wKey} -> praxis.stats (${resourcePath}, dim=${dimField})`);
        }

        // Also inspect live rendered DOM of this chart widget!
        const domEl = document.querySelector(`[data-widget-key="${wKey}"] praxis-chart`);
        if (!domEl) {
          violations.push(`Gráfico ${wKey} não encontrado no DOM`);
        } else {
          const errEl = domEl.querySelector('.praxis-chart-state-error');
          const emptyEl = domEl.querySelector('.praxis-chart-state-empty');
          const canvasEl = domEl.querySelector('canvas');
          if (errEl) {
            violations.push(`Gráfico ${wKey} renderizou estado de erro no DOM: ${errEl.textContent.trim()}`);
          } else if (emptyEl) {
            violations.push(`Gráfico ${wKey} renderizou estado vazio no DOM: ${emptyEl.textContent.trim()}`);
          } else if (!canvasEl) {
            violations.push(`Gráfico ${wKey} não possui <canvas> ECharts renderizado no DOM`);
          } else {
            verified.push(`Gráfico ${wKey} DOM -> <canvas> ECharts renderizado ao vivo sem erros/vazio`);
          }
        }
      } else if (compId === 'praxis-list') {
        const listRes = inputs.config?.dataSource?.resourcePath || inputs.resourcePath;
        if (!listRes) {
          violations.push(`Lista ${wKey} sem resourcePath governado`);
        } else {
          verified.push(`Lista ${wKey} -> ${listRes}`);
        }
      } else if (compId === 'praxis-table') {
        const tableRes = inputs.resourcePath || inputs.config?.resourcePath;
        if (!tableRes) {
          violations.push(`Tabela ${wKey} sem resourcePath governado`);
        } else {
          verified.push(`Tabela ${wKey} -> ${tableRes}`);
        }
      } else if (compId === 'praxis-rich-content') {
        const serialized = JSON.stringify(inputs.document || {});
        if (!/\$\{(kpis|activeMissions)\.[^}]+\}/.test(serialized)) {
          violations.push(`RichContent ${wKey} não possui interpolação dinâmica \${kpis.*} ou \${activeMissions.*}`);
        } else {
          verified.push(`RichContent ${wKey} -> vinculado a telemetria viva (\${kpis.*} / \${activeMissions.*})`);
        }
      }
    }

    return {
      ok: violations.length === 0 && (snapshot.widgets || []).length === 13,
      widgetCount: (snapshot.widgets || []).length,
      violations,
      verified
    };
  });

  for (const v of auditResult.verified) {
    console.log(`  [AUDIT PASS] ${v}`);
  }
  if (!auditResult.ok) {
    for (const err of auditResult.violations) {
      console.error(`  [AUDIT FAIL] ${err}`);
    }
    throw new Error(`[Dashboard API Integration Audit] Falhou com ${auditResult.violations.length} violação(ões)!`);
  }
  console.log(` [SUCESSO] Dashboard API Integration Audit aprovado (${auditResult.widgetCount} widgets, 0 dados estáticos, 4/4 gráficos renderizados)!`);
  console.log('================================================================\n');
}

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const serverChild = await ensureDevServer();
  try {
    // Launch Chromium locked at 1920x1080 with 1:1 device scale factor (zero auto-scaling)
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--window-size=1920,1080',
        '--force-device-scale-factor=1',
        '--high-dpi-support=1'
      ]
    });

    console.log('0. Pre-warming /comando-studio in a non-recorded context to eliminate initial blank frame...');
    const warmContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const warmPage = await warmContext.newPage();
    await warmPage.goto(`${BASE_URL}/comando-studio`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await warmPage.locator('[data-testid="toggle-customization-btn"]').waitFor({ state: 'visible', timeout: 15000 });
    await sleep(600);
    await warmContext.close();

    // Create 1:1 1080p context WITHOUT Playwright's low-bitrate 25fps recordVideo
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });

    await context.addInitScript(() => {
      if (!sessionStorage.getItem('__praxis_demo_cleaned')) {
        sessionStorage.setItem('__praxis_demo_cleaned', '1');
        for (const k of Object.keys(localStorage)) {
          if (k.includes('comando-studio') || k.includes('tactical-command-studio')) {
            localStorage.removeItem(k);
          }
        }
      }

      const installDemoOverlay = () => {
        if (document.getElementById('praxis-demo-hud')) return;
        const style = document.createElement('style');
        style.textContent = `
          /* Keep canvas & HUD crystal clear in 1080p even when Settings Panel / CDK overlay is open */
          .cdk-overlay-backdrop,
          .cdk-overlay-dark-backdrop,
          .mat-drawer-backdrop,
          .studio-backdrop {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            background: rgba(6, 10, 20, 0.26) !important;
          }
          /* Prevent unconfigured praxis-list placeholder from wrapping 1 char per line */
          praxis-list, praxis-list * {
            word-break: normal !important;
            overflow-wrap: break-word !important;
          }
          #praxis-demo-hud {
            position: fixed;
            bottom: 8px;
            left: 276px;
            z-index: 2147483645;
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 660px;
            max-width: 1080px;
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
            width: 11%;
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
            <span class="praxis-demo-badge">ETAPA 1/9 · CANVAS EM BRANCO</span>
            <span class="praxis-demo-title">Laboratório Tático Orbital (/comando-studio)</span>
            <span class="praxis-demo-detail">Autoria 100% Zero-Deploy · Full HD 1080p @ 30 FPS (1:1)</span>
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

        if (!sessionStorage.getItem('__praxis_demo_t0')) {
          sessionStorage.setItem('__praxis_demo_t0', String(Date.now()));
        }
        setInterval(() => {
          const t0 = Number(sessionStorage.getItem('__praxis_demo_t0') || Date.now());
          const sec = Math.max(0, Math.floor((Date.now() - t0) / 1000));
          const mm = String(Math.floor(sec / 60)).padStart(2, '0');
          const ss = String(sec % 60).padStart(2, '0');
          const timerEl = document.getElementById('praxis-demo-timer');
          if (timerEl) timerEl.textContent = `⏱ ${mm}:${ss}`;
          // Keep HUD and cursor as last children of body so CDK overlays never obscure them
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

    console.log('1. Navigating to /comando-studio (single clean load BEFORE starting 30fps recorder)...');
    await page.goto(`${BASE_URL}/comando-studio`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('[data-testid="toggle-customization-btn"]').waitFor({ state: 'visible', timeout: 15000 });
    await page.evaluate(() => sessionStorage.setItem('__praxis_demo_t0', String(Date.now())));
    await setDemoStage(
      page,
      1,
      9,
      'ETAPA 1/9 · CANVAS EM BRANCO',
      'Rota /comando-studio (0 Widgets)',
      'Ativando modo de customização visual do Praxis Page Builder'
    );

    const targetVideoPath = path.join(ARTIFACT_DIR, 'studio-autoria-zero-deploy-demo-1080p-30fps.webm');
    const recorder = new HighFidelityVideoRecorder(page, targetVideoPath, {
      width: 1920,
      height: 1080,
      fps: 30
    });
    await recorder.start();

    const tExperimentStart = Date.now();
    await sleep(900);

    const initialWidgetCount = await page.locator('[data-widget-key]').count();
    console.log(`Initial widget count on /comando-studio: ${initialWidgetCount}`);

    // Enter Customization Mode
    const toggleBtn = page.locator('[data-testid="toggle-customization-btn"]');
    await toggleBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, toggleBtn, 120);
    await toggleBtn.click();
    await sleep(600);

    // 2. Insert all 13 widgets in a single atomic batch via Component Palette Staging Tray!
    console.log('\n2. Queuing and inserting all 13 widgets via Component Palette Batch Staging Tray...');
    await setDemoStage(
      page,
      2,
      9,
      'ETAPA 2/9 · MONTAGEM EM LOTE (STAGING TRAY 12 COLUNAS)',
      'Selecionando os 13 Widgets na Bandeja de Montagem com Coordenadas Pré-Calculadas (L·C)',
      'Zero "vai e volta": empacotamento automático em 12 colunas e inserção atômica em 1 clique'
    );
    const tPaletteStart = Date.now();
    const [
      kHeader,
      kKpiHeroes,
      kKpiMissions,
      kKpiPayroll,
      kKpiIncidents,
      kChartSeverity,
      kChartDefcon,
      kListSos,
      kChartPayroll,
      kChartReputation,
      kTimeline,
      kTableIncidents,
      kHub
    ] = await insertWidgetsBatchFromPalette(
      page,
      [
        { id: 'praxis-rich-content', colSpan: 12 },
        { id: 'praxis-rich-content', colSpan: 3 },
        { id: 'praxis-rich-content', colSpan: 3 },
        { id: 'praxis-rich-content', colSpan: 3 },
        { id: 'praxis-rich-content', colSpan: 3 },
        { id: 'praxis-chart', colSpan: 4 },
        { id: 'praxis-chart', colSpan: 4 },
        { id: 'praxis-list', colSpan: 4 },
        { id: 'praxis-chart', colSpan: 6 },
        { id: 'praxis-chart', colSpan: 6 },
        { id: 'praxis-rich-content', colSpan: 12 },
        { id: 'praxis-table', colSpan: 12 },
        { id: 'praxis-rich-content', colSpan: 12 }
      ],
      recorder
    );
    console.log(`  [palette:batch] Atomically inserted all 13 widgets into Bento Grid in ${Date.now() - tPaletteStart}ms!`);

    // 3. Configure Row 1 & Rich Content Widgets & Their Shells (In-Drawer Conteúdo -> Aplicar -> Card!)
    console.log('\n3. Configuring Rich Content Widgets & Shells in single continuous drawer sessions...');
    await setDemoStage(
      page,
      3,
      9,
      'ETAPA 3/9 · EDIÇÃO CONTÍNUA NO DRAWER (CONTEÚDO → CARD)',
      'Configurando Hero Radar, 4 KPI Cards, Timeline Tática e Hub sem Fechar/Reabrir o Drawer',
      'Transição direta Conteúdo → Aplicar → Card + navegação visual ordenada (L·C) no cabeçalho'
    );
    await configureRichContentWidget(page, kHeader, HERO_COMMAND_HEADER_DOC, {
      title: '',
      subtitle: '',
      kind: 'none',
      showHeader: 'false'
    });

    await configureRichContentWidget(page, kKpiHeroes, KPI_HEROES_DOC, {
      title: '',
      subtitle: '',
      kind: 'none',
      showHeader: 'false'
    });

    await configureRichContentWidget(page, kKpiMissions, KPI_MISSIONS_DOC, {
      title: '',
      subtitle: '',
      kind: 'none',
      showHeader: 'false'
    });

    await configureRichContentWidget(page, kKpiPayroll, KPI_PAYROLL_DOC, {
      title: '',
      subtitle: '',
      kind: 'none',
      showHeader: 'false'
    });

    await configureRichContentWidget(page, kKpiIncidents, KPI_INCIDENTS_DOC, {
      title: '',
      subtitle: '',
      kind: 'none',
      showHeader: 'false'
    });

    await configureRichContentWidget(page, kTimeline, TIMELINE_DOC, {
      title: 'Diário Operacional de Missões',
      subtitle: 'Cronologia tática e despacho de forças especiais em tempo real',
      kind: 'dashboard-card',
      icon: 'timeline',
      showHeader: 'true'
    });

    await configureRichContentWidget(page, kHub, HUB_DOC, {
      title: 'Centros de Comando & Especialidades',
      subtitle: 'Atalhos táticos de governança departamental e inteligência operacional',
      kind: 'dashboard-card',
      icon: 'hub',
      showHeader: 'true'
    });

    // 4. Configure Page Settings (Guided Composer, Theme, Canvas autoRows, DataSources -> Auto-Sync State Keys, Derived State, Auto-Bind & CSP-Safe Pipes!)
    console.log('\n4. Opening Page Settings Editor (Guided Composer, DataSources -> State Sync, Derived State, Auto-Bind & CSP-Safe Pipes)...');
    await setDemoStage(
      page,
      4,
      9,
      'ETAPA 4/9 · DATASOURCES → PAGE STATE SYNC + PIPES CSP-SAFE & AUTO-BIND',
      'Sincronizando Chaves de Estado dos DataSources, Medidas Derivadas, Pipes CSP-safe e Auto-Bind',
      'Vinculando 38 placeholders em 1 clique + pipes declarativos (| default:0 | round:1) com prévia ao vivo'
    );
    await dismissStrayBackdrops(page);
    const pageSettingsBtn = page.locator('praxis-floating-toolbar button[aria-label="Configurações da página"]');
    await moveCursorToLocator(page, pageSettingsBtn, 90);
    await pageSettingsBtn.click();
    await sleep(500);

    const themeBtn = page.locator('[data-testid="studio-visual"] [data-theme-preset]').first();
    if (await themeBtn.isVisible()) {
      await moveCursorToLocator(page, themeBtn, 70);
      await themeBtn.click();
      await sleep(200);
    }

    const studioTabs = page.locator('.studio-tabs > .mat-mdc-tab-header .mat-mdc-tab');
    await moveCursorToLocator(page, studioTabs.nth(1), 70);
    await studioTabs.nth(1).click();
    await sleep(450);

    // Highlight the Guided Collection Screen Composer card in Layout templates tab
    const guidedComposerCard = page.locator('[data-testid="collection-screen-composer"]');
    if (await guidedComposerCard.isVisible().catch(() => false)) {
      const summary = guidedComposerCard.locator('summary').first();
      await moveCursorToLocator(page, summary, 100);
      await summary.click();
      await sleep(450);
      await recorder.captureSyncKeyframe();
    }

    await moveCursorToLocator(page, studioTabs.nth(3), 70);
    await studioTabs.nth(3).click();
    await sleep(500);

    const innerEditorTabs = page.locator('.studio-panel > .editor-tabs > .mat-mdc-tab-header .mat-mdc-tab');
    await moveCursorToLocator(page, innerEditorTabs.nth(0), 70);
    await innerEditorTabs.nth(0).click();
    await sleep(300);
    const autoRowsSelect = page.locator('.studio-panel mat-select').last();
    if (await autoRowsSelect.isVisible()) {
      await selectMatOption(page, autoRowsSelect, (txt) => txt.toLowerCase().includes('conteúdo') || txt.toLowerCase().includes('content'));
      await sleep(250);
    }

    await moveCursorToLocator(page, innerEditorTabs.nth(4), 70);
    await innerEditorTabs.nth(4).click();
    await sleep(450);

    await setFormInput(page, '[data-testid="page-datasources-json"]', PAGE_DATASOURCES_JSON);
    await page.locator('[data-testid="page-datasources-json"]').dispatchEvent('blur');
    await sleep(250);

    const syncFromDsBtn = page.locator('[data-testid="page-state-sync-from-datasources"]');
    if (await syncFromDsBtn.isVisible().catch(() => false)) {
      await syncFromDsBtn.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await moveCursorToLocator(page, syncFromDsBtn, 95);
      await syncFromDsBtn.click();
      await sleep(250);
      console.log('  [state:sync] Triggered page-state-sync-from-datasources to initialize targetStatePath keys!');
    }

    await setFormInput(page, '[data-testid="page-state-json"]', PAGE_STATE_JSON);
    await page.locator('[data-testid="page-state-json"]').dispatchEvent('blur');
    await sleep(300);

    const tBindStart = Date.now();
    const autoBindBtn = page.locator('[data-testid="binder-auto-bind"], [data-testid="binder-auto-bind-btn"]').first();
    await autoBindBtn.waitFor({ state: 'visible', timeout: 10000 });
    await autoBindBtn.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await sleep(200);
    const autoBindText = await autoBindBtn.innerText();
    console.log(`  [binder:G1] Found Auto-Bind button: "${autoBindText.trim()}"`);
    await moveCursorToLocator(page, autoBindBtn, 120);
    await autoBindBtn.click();
    await sleep(800);
    const binderMsg = await page.locator('[data-testid="binder-status-message"]').innerText().catch(() => '');
    const activeBindings = await page.locator('[data-testid="active-widget-state-bindings"] li').evaluateAll((els) =>
      els.map((el) => el.textContent.trim().replace(/\s+/g, ' '))
    );
    console.log(`  [binder:G1] Auto-Bind result message: "${binderMsg.trim()}" (active bindings in list: ${activeBindings.length})`);

    const progressValueBindings = [
      { widget: kKpiHeroes, title: 'Efetivo em Prontidão', path: 'context.progressValue', token: '{{state.kpis.readinessRate}}' },
      { widget: kKpiMissions, title: 'Teatro de Operações Ativas', path: 'context.progressValue', token: '{{state.kpis.missoesPercent}}' },
      { widget: kKpiPayroll, title: 'Execução da Folha Líquida', path: 'context.progressValue', token: '{{state.kpis.folhaPercent}}' },
      { widget: kKpiIncidents, title: 'Pressão de Ameaças & Risco', path: 'context.progressValue', token: '{{state.kpis.riscosPercent}}' }
    ];
    for (let bIdx = 0; bIdx < progressValueBindings.length; bIdx++) {
      const b = progressValueBindings[bIdx];
      await selectMatOption(
        page,
        page.locator('[data-testid="binder-widget"]'),
        (txt, wKey) => wKey === b.widget || txt.includes(b.title) || txt.includes(b.widget),
        { pauseBeforeClickMs: bIdx === 0 ? 500 : 120 }
      );
      const pathChip = page.locator(`[data-testid="binder-input-suggestion-${b.path}"]`);
      if (await pathChip.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, pathChip, 55);
        await pathChip.click();
      } else {
        await setFormInput(page, '[data-testid="binder-input-path"]', b.path);
      }
      const tokenChip = page.locator(`[data-testid="binder-token-suggestion-${b.token}"]`);
      if (await tokenChip.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, tokenChip, 55);
        await tokenChip.click();
      } else {
        await setFormInput(page, '[data-testid="binder-token"]', b.token);
      }

      // Showcase the CSP-safe declarative pipe chips & live simulated preview!
      const defaultPipeChip = page.locator('[data-testid="binder-pipe-chip-| default:0"]');
      if (await defaultPipeChip.isVisible().catch(() => false)) {
        await defaultPipeChip.evaluate((el) => el.scrollIntoView({ block: 'center' }));
        await moveCursorToLocator(page, defaultPipeChip, 85);
        await defaultPipeChip.click();
        await sleep(220);
      }
      if (bIdx === 0) {
        const roundPipeChip = page.locator('[data-testid="binder-pipe-chip-| round:1"]');
        if (await roundPipeChip.isVisible().catch(() => false)) {
          await moveCursorToLocator(page, roundPipeChip, 95);
          await roundPipeChip.click();
          await sleep(320);
        }
        const livePreview = await page.locator('[data-testid="binder-live-preview"]').innerText().catch(() => '');
        console.log(`  [binder:pipes] Live simulated preview after clicking CSP-safe pipe chips: "${livePreview.trim()}"`);
        await recorder.captureSyncKeyframe();
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frame-1080p30-binder-pipes.png') });
        await sleep(450);
      }

      const bindBtn = page.locator('[data-testid="binder-apply"], [data-testid="binder-bind-btn"]').first();
      await moveCursorToLocator(page, bindBtn, 60);
      await bindBtn.click();
      await sleep(140);
    }
    console.log(`  [binder:G1] Bound all ${activeBindings.length + 4} state tokens in ${Date.now() - tBindStart}ms!`);

    await saveAndCloseSettingsPanel(page, 'PageSettings');

    // 5. Configure Chart Widgets & Their Shells — 100% Governed praxis.stats APIs (Zero Static Data & In-Drawer Shell Switching!)
    console.log('\n5. Configuring Chart Widgets & Shells in continuous drawer sessions (100% praxis.stats APIs)...');
    await setDemoStage(
      page,
      5,
      9,
      'ETAPA 5/9 · 4 GRÁFICOS 100% PRAXIS.STATS (CONTEÚDO → CARD)',
      'Configurando Rosca (Severidade), Velocímetro (Prontidão), Área (Folha) e Barra (Missões)',
      '100% conectados a endpoints /stats governados · Zero dados locais estáticos e zero buckets nulos'
    );
    await configureChartWidget(
      page,
      kChartSeverity,
      {
        title: 'Distribuição de Severidade',
        subtitle: '',
        shellTitle: 'Distribuição de Severidade',
        kindLabel: 'Rosca',
        height: 340,
        sourceKind: 'praxis.stats',
        resourceMatch: 'risk-intelligence.vw-indicadores-incidentes',
        operationMatch: 'agrupar por',
        dimensionMatch: 'severidade',
        metric0: { fieldMatch: 'count', label: 'Ocorrências', aggMatch: 'contagem' },
        colors: ['#ef4444', '#f97316', '#eab308', '#38bdf8'],
        crossFilterMapping: { severidade: 'severidade' }
      },
      {
        title: 'Distribuição de Severidade (Clique para Filtrar)',
        subtitle: 'Classificação de risco conectada via barramento à tabela de incidentes',
        kind: 'dashboard-card',
        icon: 'pie_chart',
        showHeader: 'true'
      }
    );

    await configureChartWidget(
      page,
      kChartDefcon,
      {
        title: 'Nível de Defesa Tática (DEFCON)',
        subtitle: '',
        shellTitle: 'Nível de Defesa Tática (DEFCON)',
        kindLabel: 'Velocímetro',
        height: 340,
        sourceKind: 'praxis.stats',
        resourceMatch: 'human-resources.vw-ranking-reputacao',
        operationMatch: 'agrupar por',
        dimensionMatch: 'equipe',
        gaugeMin: 0,
        gaugeMax: 100,
        metric0: { fieldMatch: 'scorePublico', label: 'Índice de Defesa (%)', aggMatch: 'média' },
        colors: ['#06b6d4', '#10b981', '#f59e0b']
      },
      {
        title: 'Nível de Defesa Tática (DEFCON)',
        subtitle: 'Índice consolidado de prontidão e respaldo operacional em tempo real (0 a 100%)',
        kind: 'dashboard-card',
        icon: 'speed',
        showHeader: 'true'
      }
    );

    await configureChartWidget(
      page,
      kChartPayroll,
      {
        title: 'Evolução da Folha Salarial & Benefícios',
        subtitle: '',
        shellTitle: 'Evolução da Folha Salarial & Benefícios',
        kindLabel: 'Área',
        height: 320,
        sourceKind: 'praxis.stats',
        resourceMatch: 'human-resources.vw-analytics-folha-pagamento',
        operationMatch: 'série temporal',
        granularityMatch: 'mês',
        dimensionMatch: 'competencia',
        metric0: { fieldMatch: 'salarioLiquido', label: 'Salário Líquido (R$)', aggMatch: 'soma' },
        metric1: { fieldMatch: 'totalDescontos', label: 'Descontos & Encargos', aggMatch: 'soma' },
        colors: ['#38bdf8', '#a855f7', '#22c55e']
      },
      {
        title: 'Evolução da Folha Salarial & Benefícios',
        subtitle: 'Execução orçamentária dos últimos ciclos de pagamento tático via /stats/timeseries',
        kind: 'dashboard-card',
        icon: 'payments',
        showHeader: 'true'
      }
    );

    await configureChartWidget(
      page,
      kChartReputation,
      {
        title: 'Mobilização Tática & Eventos por Missão',
        subtitle: '',
        shellTitle: 'Mobilização Tática & Eventos por Missão',
        kindLabel: 'Barra',
        height: 320,
        sourceKind: 'praxis.stats',
        resourceMatch: 'operations.vw-resumo-missoes',
        operationMatch: 'agrupar por',
        dimensionMatch: 'status',
        metric0: { fieldMatch: 'qtdHerois', label: 'Efetivo Mobilizado', aggMatch: 'soma' },
        metric1: { fieldMatch: 'qtdEventos', label: 'Eventos Táticos', aggMatch: 'soma' },
        colors: ['#06b6d4', '#10b981', '#6366f1']
      },
      {
        title: 'Mobilização Tática & Eventos por Missão',
        subtitle: 'Efetivo alocado e telemetria de eventos por status operacional via /stats/group-by',
        kind: 'dashboard-card',
        icon: 'military_tech',
        showHeader: 'true'
      }
    );

    // 6. Configure SOS List Widget (In-Drawer Conteúdo -> Card!)
    console.log('\n6. Configuring SOS List Widget...');
    await setDemoStage(
      page,
      6,
      9,
      'ETAPA 6/9 · FEED DE SINAIS DE SOCORRO (PRAXIS-LIST)',
      'Configurando Lista Operacional Conectada a operations/sinais-socorro',
      'Template de cards compactos com severidade e transição direta Conteúdo → Card'
    );
    await configureListWidget(page, kListSos, 'sinais-socorro', SOS_LIST_CONFIG, {
      title: 'Sinais de Socorro Ativos',
      subtitle: 'Chamados de emergência tática recebidos pelo QG',
      kind: 'dashboard-card',
      icon: 'podcasts',
      showHeader: 'true'
    });

    // 7. Configure Incidents Table Widget (In-Drawer Conteúdo -> Card!)
    console.log('\n7. Configuring Incidents Table Widget...');
    await setDemoStage(
      page,
      7,
      9,
      'ETAPA 7/9 · TABELA + DOSSIÊ FORENSE INLINE',
      'Configurando Tabela de Incidentes com Contenção Radial e Expansão Inline',
      'Seletor de seções visível no Settings Panel + transição direta Conteúdo → Card'
    );
    await configureTableWidget(page, kTableIncidents, INCIDENTS_TABLE_EDITOR_JSON, {
      title: 'Monitoramento de Incidentes & Ameaças Recentes',
      subtitle: 'Feed operacional com telemetria tática, contenção radial e dossiê forense inline',
      kind: 'dashboard-card',
      icon: 'emergency',
      showHeader: 'true'
    });

    // 8. Connect Donut Chart (crossFilter) -> Incidents Table (queryContext) via Connection Editor
    console.log('\n8. Wiring Cross-Filter Connection via Connection Editor...');
    await setDemoStage(
      page,
      8,
      9,
      'ETAPA 8/9 · MELHORIAS G5 & G6 (EDITOR DE CONEXÕES)',
      'Conectando Gráfico de Severidade (crossFilter) → Tabela de Incidentes (queryContext)',
      'Rótulos amigáveis nos nós + fechamento limpo sem sobreposição da barra flutuante'
    );
    const connToggle = page.locator('[data-testid="page-builder-connections-toggle"]');
    await connToggle.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, connToggle, 90);
    await connToggle.click();
    await sleep(600);

    const newConnBtn = page.locator('[data-testid="page-builder-connections-new"]');
    await newConnBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, newConnBtn, 90);
    await newConnBtn.click();
    await sleep(400);

    const sourceSelect = page.locator('[data-testid="page-builder-connections-draft-source"]');
    const targetSelect = page.locator('[data-testid="page-builder-connections-draft-target"]');

    const sourceOptions = await sourceSelect.locator('option').evaluateAll((opts) =>
      opts.map((o) => ({ value: o.value, text: o.textContent.trim() }))
    );
    const sourceMatch =
      sourceOptions.find((o) => o.value.includes(kChartSeverity) && o.value.includes('crossFilter')) ||
      sourceOptions.find((o) => o.value.includes(kChartSeverity) && o.value !== '') ||
      sourceOptions.find((o) => o.value.includes('crossFilter'));
    const sourceVal = sourceMatch ? sourceMatch.value : '';
    console.log(`  Source port option: ${sourceVal} (from ${sourceOptions.length} options)`);

    if (sourceVal) {
      await moveCursorToLocator(page, sourceSelect, 70);
      await sourceSelect.selectOption(sourceVal);
      await sourceSelect.dispatchEvent('change');
      await sleep(400);

      const targetOptions = await targetSelect.locator('option').evaluateAll((opts) =>
        opts.map((o) => ({ value: o.value, text: o.textContent.trim() }))
      );
      const targetMatch =
        targetOptions.find((o) => o.value.includes(kTableIncidents) && o.value.includes('queryContext')) ||
        targetOptions.find((o) => o.value.includes(kTableIncidents) && o.value !== '') ||
        targetOptions.find((o) => o.value.includes('queryContext'));
      const targetVal = targetMatch ? targetMatch.value : '';
      console.log(`  Target port option: ${targetVal} (from ${targetOptions.length} options)`);

      if (targetVal) {
        await moveCursorToLocator(page, targetSelect, 70);
        await targetSelect.selectOption(targetVal);
        await targetSelect.dispatchEvent('change');
        await sleep(400);
        const applyDraftBtn = page.locator('[data-testid="page-builder-connections-draft-apply"]');
        if (await applyDraftBtn.isEnabled()) {
          await moveCursorToLocator(page, applyDraftBtn, 90);
          await applyDraftBtn.click();
          await sleep(450);
          console.log('  [ok] Applied connection between Donut Chart and Incidents Table!');
        } else {
          await page.locator('[data-testid="page-builder-connections-draft-cancel"]').click();
          await sleep(300);
        }
      } else {
        await page.locator('[data-testid="page-builder-connections-draft-cancel"]').click();
        await sleep(300);
      }
    } else {
      console.warn('  [warn] Could not find matching source port option!');
      await page.locator('[data-testid="page-builder-connections-draft-cancel"]').click();
      await sleep(300);
    }

    const closeConnBtn = page.locator('[data-testid="page-builder-connections-close"]');
    if (await closeConnBtn.isVisible()) {
      await moveCursorToLocator(page, closeConnBtn, 90);
      await closeConnBtn.click();
      await sleep(400);
      console.log('  [connections:G6] Closed Connection Editor cleanly via close button (no toolbar overlap)!');
    }

    // 9. Save page via Floating Toolbar
    const totalElapsedSec = ((Date.now() - tExperimentStart) / 1000).toFixed(1);
    console.log(`\n9. Saving page via Floating Toolbar (Total authoring elapsed: ${totalElapsedSec}s)...`);
    await setDemoStage(
      page,
      9,
      9,
      `ETAPA 9/9 · SALVAMENTO & TOUR EXECUTIVO (${totalElapsedSec}s)`,
      'Salvando Layout Personalizado e Iniciando Tour Guiado pelo Bento Grid',
      '13 widgets configurados · KPIs resolvidos · Gráficos 100% API · Dossiê forense inline'
    );
    const savePageBtn = page.locator('praxis-floating-toolbar button[aria-label="Salvar página"]');
    if (await savePageBtn.isVisible() && await savePageBtn.isEnabled()) {
      await moveCursorToLocator(page, savePageBtn, 110);
      await savePageBtn.click({ force: true });
      await sleep(900);
      console.log('  [ok] Clicked Salvar página!');
    }

    // Run the mandatory "Dashboard API Integration Audit" session on the authored snapshot!
    await runDashboardApiIntegrationAudit(page, {
      kHeader,
      kKpiHeroes,
      kKpiMissions,
      kKpiPayroll,
      kKpiIncidents,
      kChartSeverity,
      kChartDefcon,
      kListSos,
      kChartPayroll,
      kChartReputation,
      kTimeline,
      kTableIncidents,
      kHub
    });

    await smoothScrollDashboard(page, 0, 500);
    await sleep(500);
    await recorder.captureSyncKeyframe();
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'studio-03-authored-in-editor.png'),
      scale: 'css'
    });
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'frame-1080p30-editing-sharp.png'),
      scale: 'css'
    });

    // Exit customization mode
    await moveCursorToLocator(page, toggleBtn, 110);
    await toggleBtn.click();
    await sleep(1800);
    await smoothScrollDashboard(page, 0, 400);
    await sleep(1000);
    await recorder.captureSyncKeyframe();

    const statusText = await page.locator('[data-testid="dashboard-layout-status"]').innerText();
    console.log(`Layout status after authoring: ${statusText}`);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'studio-04-executive-dashboard-view.png'),
      scale: 'css'
    });

    // 10. Guided Executive Camera Tour across the 5 Bento Grid rows!
    console.log('\n10. Running Guided Executive Camera Tour across all 5 Bento Grid rows...');
    await setDemoStage(
      page,
      9,
      9,
      'TOUR EXECUTIVO 1/4 · RADAR TÁTICO, KPIS & TELEMETRIA',
      'Hero Radar (52,5% Prontidão) + 4 KPI Cards + Rosca de Severidade + Velocímetro Tático',
      'Todos os valores de negócio e gráficos alimentados em tempo real pelas APIs /stats e /filter'
    );
    await recorder.captureSyncKeyframe();
    await sleep(1600);

    await setDemoStage(
      page,
      9,
      9,
      'TOUR EXECUTIVO 2/4 · SÉRIES ANALÍTICAS & DIÁRIO DE MISSÕES',
      'Evolução da Folha Salarial (Área) + Ranking Reputacional (Barra) + Timeline Tática',
      'Séries históricas multi-métrica via /stats/timeseries e /stats/group-by + missões ativas'
    );
    await smoothScrollDashboard(page, 620, 1100);
    await sleep(500);
    await recorder.captureSyncKeyframe();
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'frame-1080p30-tour-row2.png'),
      scale: 'css'
    });
    await sleep(1500);

    await setDemoStage(
      page,
      9,
      9,
      'TOUR EXECUTIVO 3/4 · TABELA FORENSE INLINE & HUB DE COMANDO',
      'Tabela de Incidentes Conectada + Expansão de Dossiê Forense Inline + Hub Tático',
      'Inspecionando dossiê forense embutido na primeira linha da tabela de incidentes'
    );
    await smoothScrollDashboard(page, 1340, 1100);
    await recorder.captureSyncKeyframe();
    await sleep(900);

    const expandBtnBefore = page.locator('praxis-table button[aria-label*="Expandir"], praxis-table button[data-testid*="expand"]').first();
    if (await expandBtnBefore.isVisible()) {
      await expandBtnBefore.scrollIntoViewIfNeeded();
      await sleep(400);
      await moveCursorToLocator(page, expandBtnBefore, 140);
      await expandBtnBefore.click();
      await sleep(2400);
      await recorder.captureSyncKeyframe();
      console.log('  [ok] Expanded first row in Incidents Table during Tour 3/4!');
    }

    // 11. Verify persistence across full page reload!
    console.log('\n11. Reloading /comando-studio to verify zero-deploy persistence...');
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('[data-testid="toggle-customization-btn"]').waitFor({ state: 'visible', timeout: 15000 });
    for (let w = 0; w < 40; w++) {
      const bodyTxt = await page.locator('body').innerText().catch(() => '');
      const wCount = await page.locator('[data-widget-key]').count().catch(() => 0);
      if (!bodyTxt.includes('Carregando configuração') && wCount >= 13) break;
      await sleep(250);
    }
    await sleep(1000);
    await recorder.captureSyncKeyframe();

    await setDemoStage(
      page,
      9,
      9,
      'TOUR EXECUTIVO 4/4 · PERSISTÊNCIA ZERO-DEPLOY VERIFICADA',
      'Dashboard Recarregada Intacta (13 Widgets) + Dashboard API Integration Audit Aprovado',
      `Autoria completa em ${totalElapsedSec}s · Full HD 1080p @ 30 FPS (Escala 1:1)`
    );

    const persistedCount = await page.locator('[data-widget-key]').count();
    const persistedStatus = await page.locator('[data-testid="dashboard-layout-status"]').innerText();
    console.log(`Persisted widget count after reload: ${persistedCount}`);
    console.log(`Persisted layout status after reload: ${persistedStatus}`);

    await smoothScrollDashboard(page, 1340, 1000);
    await sleep(900);
    const expandBtnAfter = page.locator('praxis-table button[aria-label*="Expandir"], praxis-table button[data-testid*="expand"]').first();
    if (await expandBtnAfter.isVisible()) {
      await expandBtnAfter.scrollIntoViewIfNeeded();
      await sleep(500);
      await moveCursorToLocator(page, expandBtnAfter, 140);
      await expandBtnAfter.click();
      await sleep(2200);
      await recorder.captureSyncKeyframe();
      console.log('  [ok] Expanded first row in Incidents Table after reload!');
    }

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'studio-05-reloaded-with-forensic-expansion.png'),
      scale: 'css'
    });

    await smoothScrollDashboard(page, 0, 1100);
    await sleep(1800);
    await recorder.captureSyncKeyframe();

    await recorder.stop();
    await context.close();
    await browser.close();

    const stat = fs.statSync(targetVideoPath);
    console.log(`\n[video] Saved 1080p@30fps demonstration video to: ${targetVideoPath} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);

    console.log('\nDone!');
  } finally {
    stopDevServer(serverChild);
  }
}

main().catch((err) => {
  console.error('Fatal error in record-studio-demo.mjs:', err);
  process.exit(1);
});
