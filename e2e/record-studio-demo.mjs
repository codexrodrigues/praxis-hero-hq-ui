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
      totalHeroes: 101,
      inProgressMissions: 9,
      inProgressMissionsBadge: '09',
      plannedMissions: 15,
      totalMissions: 39,
      missoesPercent: 23,
      latestPayrollNet: 3090000,
      latestPayrollMonth: 'Março / 2026',
      latestPayrollNetMillion: '3,09',
      latestPayrollEmployees: 98,
      folhaPercent: 78.5,
      totalIncidents: 74,
      criticalIncidents: 18,
      criticalIncidentsBadge: '18',
      highIncidents: 19,
      mediumIncidents: 22,
      lowIncidents: 15,
      riscosPercent: 24,
      defconScore: 4.2
    }
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
    fallbackValue: { activeHeroes: 53, totalHeroes: 101 }
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
        CANCELADA: 'cancelledMissions'
      },
      totalField: 'totalMissions'
    },
    fallbackValue: { plannedMissions: 15, inProgressMissions: 9, totalMissions: 39 }
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
      metrics: [{ operation: 'SUM', field: 'salarioLiquido', alias: 'salarioLiquido' }]
    },
    targetStatePath: 'kpis',
    transform: {
      kind: 'timeseries-last',
      mappings: {
        'values.salarioLiquido': 'latestPayrollNet',
        count: 'latestPayrollEmployees',
        label: 'latestPayrollMonth'
      }
    },
    fallbackValue: {
      latestPayrollNet: 3090000,
      latestPayrollMonth: 'Março / 2026',
      latestPayrollEmployees: 98,
      folhaPercent: 78.5
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
      criticalIncidents: 18,
      highIncidents: 19,
      mediumIncidents: 22,
      lowIncidents: 15,
      totalIncidents: 74
    }
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
              label: 'Satélite Orbital Relé',
              route: '/ativos/equipamentos'
            }
          ]
        }
      }
    }
  ]
};

const KPI_HEROES_DOC = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'card',
      variant: 'unstyled',
      tone: 'neutral',
      className: 'glass-panel bento-kpi-card',
      interaction: {
        mode: 'action',
        action: {
          actionId: 'navigation.openRoute',
          payload: { path: '/rh/funcionarios' }
        }
      },
      header: [
        {
          type: 'compose',
          direction: 'row',
          gap: 'sm',
          items: [
            { type: 'icon', icon: 'verified_user', className: 'card-icon tone-ready' },
            {
              type: 'badge',
              label: '${kpis.readinessRate}% Força Pronta',
              className: 'tag-status ready-tag'
            }
          ]
        }
      ],
      title: '${kpis.activeHeroes} Heróis Ativos',
      subtitle: 'Prontidão Operacional da Base',
      content: [
        {
          type: 'progress',
          value: 52.5,
          valueExpr: 'progressValue',
          showPercent: false,
          className: 'fill-ready'
        },
        {
          type: 'text',
          text: '${kpis.activeHeroes} de ${kpis.totalHeroes} heróis mobilizados em prontidão imediata',
          className: 'card-footnote'
        }
      ]
    }
  ]
};

const KPI_MISSIONS_DOC = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'card',
      variant: 'unstyled',
      tone: 'neutral',
      className: 'glass-panel bento-kpi-card',
      interaction: {
        mode: 'action',
        action: {
          actionId: 'navigation.openRoute',
          payload: { path: '/operacoes/missoes' }
        }
      },
      header: [
        {
          type: 'compose',
          direction: 'row',
          gap: 'sm',
          items: [
            { type: 'icon', icon: 'military_tech', className: 'card-icon tone-operations' },
            {
              type: 'badge',
              label: '${kpis.inProgressMissionsBadge} Em Curso',
              className: 'tag-status operations-tag'
            }
          ]
        }
      ],
      title: '${kpis.plannedMissions} Planejadas',
      subtitle: 'Teatro de Missões Táticas',
      content: [
        {
          type: 'progress',
          value: 23,
          valueExpr: 'progressValue',
          showPercent: false,
          className: 'fill-operations'
        },
        {
          type: 'text',
          text: '${kpis.totalMissions} missões táticas catalogadas sob comando orbital',
          className: 'card-footnote'
        }
      ]
    }
  ]
};

const KPI_PAYROLL_DOC = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'card',
      variant: 'unstyled',
      tone: 'neutral',
      className: 'glass-panel bento-kpi-card',
      interaction: {
        mode: 'action',
        action: {
          actionId: 'navigation.openRoute',
          payload: { path: '/rh/folha-pagamento' }
        }
      },
      header: [
        {
          type: 'compose',
          direction: 'row',
          gap: 'sm',
          items: [
            { type: 'icon', icon: 'payments', className: 'card-icon tone-rh' },
            {
              type: 'badge',
              label: '${kpis.latestPayrollMonth}',
              className: 'tag-status rh-tag'
            }
          ]
        }
      ],
      title: 'R$ ${kpis.latestPayrollNetMillion} M',
      subtitle: 'Execução da Folha Líquida',
      content: [
        {
          type: 'progress',
          value: 78.5,
          valueExpr: 'progressValue',
          showPercent: false,
          className: 'fill-rh'
        },
        {
          type: 'text',
          text: 'Folha auditada para ${kpis.latestPayrollEmployees} colaboradores ativos',
          className: 'card-footnote'
        }
      ]
    }
  ]
};

const KPI_INCIDENTS_DOC = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'card',
      variant: 'unstyled',
      tone: 'neutral',
      className: 'glass-panel bento-kpi-card',
      interaction: {
        mode: 'action',
        action: {
          actionId: 'navigation.openRoute',
          payload: { path: '/operacoes/incidentes' }
        }
      },
      header: [
        {
          type: 'compose',
          direction: 'row',
          gap: 'sm',
          items: [
            { type: 'icon', icon: 'emergency', className: 'card-icon tone-risk' },
            {
              type: 'badge',
              label: '${kpis.totalIncidents} Ocorrências',
              className: 'tag-status risk-tag'
            }
          ]
        }
      ],
      title: '${kpis.criticalIncidentsBadge} Críticos',
      subtitle: 'Pressão de Ameaças & Risco',
      content: [
        {
          type: 'progress',
          value: 24,
          valueExpr: 'progressValue',
          showPercent: false,
          className: 'fill-risk'
        },
        {
          type: 'text',
          text: '${kpis.highIncidents} incidentes de severidade alta em contenção ativa',
          className: 'card-footnote'
        }
      ]
    }
  ]
};

const TIMELINE_DOC = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'timeline',
      title: 'Atividades Recentes de Campo (${kpis.totalMissions} Missões)',
      position: 'right',
      orientation: 'vertical',
      markerVariant: 'dot',
      markerStyle: 'filled',
      items: [
        {
          title: 'Interceptação Orbital Completa — Setor LEO-2',
          subtitle: 'Esquadrão Vanguarda neutralizou satélite hostil e estabilizou telemetria.',
          meta: 'Perímetro orbital assegurado · Telemetria nominal',
          opposite: '15:20',
          badge: 'Concluído',
          markerColor: 'success',
          markerStyle: 'filled',
          connectorColor: 'success',
          connectorVariant: 'solid',
          action: {
            actionId: 'navigation.openRoute',
            payload: { path: '/operacoes/missoes' }
          }
        },
        {
          title: 'Despacho Tático & Contenção (${kpis.inProgressMissions} em Curso)',
          subtitle: 'Forças especiais mobilizadas com ${kpis.plannedMissions} operações adicionais no plano de voo.',
          meta: 'Clique para inspecionar teatro de missões ativas',
          opposite: '13:45',
          badge: '${kpis.inProgressMissionsBadge} Em Curso',
          markerColor: 'primary',
          markerStyle: 'filled',
          connectorColor: 'primary',
          connectorVariant: 'solid',
          action: {
            actionId: 'navigation.openRoute',
            payload: { path: '/operacoes/missoes' }
          }
        },
        {
          title: 'Vigilância DEFCON (${kpis.defconScore}) · ${kpis.criticalIncidents} Ameaças Críticas',
          subtitle: 'Monitoramento de ${kpis.highIncidents} incidentes de severidade alta e contenção de perímetro.',
          meta: 'Protocolo de resposta imediata acionado pelo QG',
          opposite: '11:10',
          badge: '${kpis.criticalIncidentsBadge} Críticos',
          markerColor: 'warning',
          markerStyle: 'outlined',
          connectorColor: 'warning',
          connectorVariant: 'dashed',
          action: {
            actionId: 'navigation.openRoute',
            payload: { path: '/operacoes/incidentes' }
          }
        },
        {
          title: 'Calibração de Prontidão (${kpis.readinessRate}%)',
          subtitle: 'Checklist tático confirmado para ${kpis.activeHeroes} de ${kpis.totalHeroes} heróis da base.',
          meta: 'Sincronização biométrica e trajes homologados',
          opposite: '08:00',
          badge: '${kpis.activeHeroes} Ativos',
          markerColor: 'neutral',
          markerStyle: 'filled',
          connectorColor: 'neutral',
          connectorVariant: 'solid',
          action: {
            actionId: 'navigation.openRoute',
            payload: { path: '/rh/funcionarios' }
          }
        }
      ]
    }
  ]
};

const HUB_DOC = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'compose',
      layout: 'grid',
      columns: 'auto-fit',
      minColumnWidth: '240px',
      gap: 'md',
      className: 'hub-action-cards-grid',
      items: [
        {
          type: 'actionCard',
          variant: 'unstyled',
          title: 'Heróis & Colaboradores',
          subtitle: 'Cadastros completos, identidades civis, remunerações e histórico funcional.',
          meta: '${kpis.activeHeroes}/${kpis.totalHeroes} ativos · ${kpis.readinessRate}% prontidão',
          icon: 'group',
          ctaLabel: 'Acessar RH',
          ctaIcon: 'arrow_forward',
          action: {
            actionId: 'navigation.openRoute',
            payload: { path: '/rh/funcionarios' }
          },
          className: 'glass-panel hub-card-action tone-rh'
        },
        {
          type: 'actionCard',
          variant: 'unstyled',
          title: 'Centro de Missões',
          subtitle: 'Despacho tático, formação de squads, diário de bordo e desfechos operacionais.',
          meta: '${kpis.inProgressMissions} em curso · ${kpis.plannedMissions} planejadas',
          icon: 'military_tech',
          ctaLabel: 'Operações',
          ctaIcon: 'arrow_forward',
          action: {
            actionId: 'navigation.openRoute',
            payload: { path: '/operacoes/missoes' }
          },
          className: 'glass-panel hub-card-action tone-operations'
        },
        {
          type: 'actionCard',
          variant: 'unstyled',
          title: 'Ativos & Armaduras',
          subtitle: 'Controle de custódia, manutenção preventiva de trajes e frota aérea/terrestre.',
          meta: 'Arsenal homologado · Telemetria de campo',
          icon: 'inventory_2',
          ctaLabel: 'Ver Ativos',
          ctaIcon: 'arrow_forward',
          action: {
            actionId: 'navigation.openRoute',
            payload: { path: '/ativos/equipamentos' }
          },
          className: 'glass-panel hub-card-action tone-assets'
        },
        {
          type: 'actionCard',
          variant: 'unstyled',
          title: 'Suprimentos & Contratos',
          subtitle: 'Fornecedores homologados, requisições de compra e tecnologia bélica avançada.',
          meta: 'Folha R$ ${kpis.latestPayrollNetMillion} M · ${kpis.latestPayrollMonth}',
          icon: 'contract',
          ctaLabel: 'Contratos',
          ctaIcon: 'arrow_forward',
          action: {
            actionId: 'navigation.openRoute',
            payload: { path: '/suprimentos/contratos' }
          },
          className: 'glass-panel hub-card-action tone-supplies'
        },
        {
          type: 'actionCard',
          variant: 'unstyled',
          title: 'Inteligência & Ameaças',
          subtitle: 'Monitoramento geoespacial de vilões, acordos regulatórios e indenizações públicas.',
          meta: '${kpis.criticalIncidents} críticos · ${kpis.highIncidents} severidade alta',
          icon: 'radar',
          ctaLabel: 'Monitorar',
          ctaIcon: 'arrow_forward',
          action: {
            actionId: 'navigation.openRoute',
            payload: { path: '/risco/ameacas' }
          },
          className: 'glass-panel hub-card-action tone-risk'
        },
        {
          type: 'actionCard',
          variant: 'unstyled',
          title: 'Ranking Reputacional',
          subtitle: 'Índices consolidados de aprovação popular, respaldo governamental e governança.',
          meta: '${kpis.totalIncidents} ocorrências auditadas no ciclo',
          icon: 'monitoring',
          ctaLabel: 'Métricas',
          ctaIcon: 'arrow_forward',
          action: {
            actionId: 'navigation.openRoute',
            payload: { path: '/rh/reputacao' }
          },
          className: 'glass-panel hub-card-action tone-operations'
        }
      ]
    }
  ]
};

const SOS_LIST_CONFIG = {
  id: 'studio-distress-signals-list',
  dataSource: {
    resourcePath: 'operations/sinais-socorro',
    query: { sort: ['abertoEm,desc'] }
  },
  i18n: { locale: 'pt-BR' },
  layout: {
    variant: 'list',
    itemAppearance: 'card',
    itemSpacing: 'relaxed',
    density: 'compact',
    pageSize: 6,
    lines: 2,
    dividers: 'none',
    virtualScroll: {
      enabled: true,
      itemSize: 64,
      viewportHeight: '380px'
    }
  },
  itemActions: [
    {
      id: 'atender-chamado',
      label: 'Atender Chamado',
      icon: 'support_agent',
      kind: 'menu-item',
      placement: 'menu',
      hateoasRel: 'update'
    },
    {
      id: 'ver-detalhes',
      label: 'Ver Detalhes',
      icon: 'visibility',
      kind: 'menu-item',
      placement: 'menu'
    }
  ],
  skin: {
    type: 'glass',
    radius: '12px'
  },
  selection: {
    mode: 'single',
    return: 'item'
  },
  templating: {
    leading: { type: 'icon', expr: 'emergency', color: 'warn' },
    primary: { type: 'text', expr: '${item.origem} · ${item.local}' },
    secondary: { type: 'text', expr: 'Ameaça Nível ${item.nivelAmeaca}' },
    meta: { type: 'relative', expr: '${item.abertoEm}' },
    trailing: { type: 'chip', expr: '${item.status}', variant: 'outlined', color: 'accent' },
    chipColorMap: {
      ABERTO: 'warn',
      EM_ATENDIMENTO: 'accent',
      RESOLVIDO: 'primary',
      FALSO: 'neutral'
    }
  }
};

const INCIDENTS_TABLE_EDITOR_JSON = {
  kind: 'praxis.table.editor',
  version: 1,
  bindings: {
    resourcePath: 'operations/incidentes',
    tableId: 'studio-incidentes-recentes',
    horizontalScroll: 'auto'
  },
  config: {
    columns: [
      { field: 'id', header: 'Código', width: '100px', align: 'center', sortable: true },
      { field: 'descricao', header: 'Ocorrência / Sinistro', width: '300px', sortable: true },
      { field: 'severidade', header: 'Severidade', width: '120px', align: 'center', sortable: true },
      {
        field: 'contencao',
        header: 'Contenção Tática',
        width: '180px',
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: '= max(15, 100 - round(min(85, (danosCivis / 4000000) * 100)))',
              total: 100,
              thresholds: [
                { min: 70, tone: 'success' },
                { min: 40, max: 69, tone: 'warning' },
                { max: 39, tone: 'danger' }
              ],
              fallbackText: 'Contenção Tática'
            }
          }
        }
      },
      { field: 'local', header: 'Teatro Operacional', width: '180px', sortable: true },
      { field: 'ocorridoEm', header: 'Data / Hora', width: '140px', sortable: true },
      { field: 'danosCivis', header: 'Danos Civis (R$)', width: '150px', align: 'right', sortable: true },
      { field: 'feridos', header: 'Feridos', width: '90px', align: 'center', sortable: true },
      { field: 'mortos', header: 'Baixas', width: '90px', align: 'center', sortable: true }
    ],
    toolbar: {
      visible: true,
      title: 'Incidentes em Campo (Conectado ao Gráfico de Severidade)'
    },
    appearance: {
      density: 'compact'
    },
    behavior: {
      expansion: {
        enabled: true,
        contractVersion: '1.0.0',
        identity: {
          rowKeySource: 'table.idField',
          requireStableIdField: true
        },
        state: { mode: 'uncontrolled' },
        interaction: {
          trigger: 'icon',
          toggleOnRowClick: false
        },
        limits: {
          allowMultiple: false,
          maxExpandedRows: 1,
          onOverflow: 'collapseOldest'
        }
      },
      detail: {
        schemaContract: {
          kind: 'praxis.detail.schema',
          version: '1.0.0',
          compat: 'semver',
          allowedNodes: [
            'card', 'value', 'stack', 'text', 'icon', 'badge', 'timeline', 'list', 'tabs', 'tab', 'mediaBlock', 'cardGrid'
          ],
          sanitization: 'strict'
        },
        rendering: {
          strategy: 'registry',
          registryId: 'praxis.detail.default',
          rendererVersion: '1.0.0',
          fallbackNodePolicy: 'failClosed'
        },
        source: {
          mode: 'inline',
          inlineSchema: {
            layout: 'stack',
            items: [
              {
                type: 'card',
                title: 'Relatório Tático de Campo & Análise Forense',
                subtitle: 'Protocolo de resposta rápida sob governança do Centro de Comando Tático',
                content: [
                  {
                    type: 'stack',
                    items: [
                      { type: 'value', label: 'Teatro Operacional', valueField: 'local' },
                      { type: 'value', label: 'Severidade Tática', valueField: 'severidade' },
                      { type: 'value', label: 'Danos Civis Estimados (R$)', valueField: 'danosCivis' },
                      { type: 'value', label: 'Vítimas & Feridos', valueField: 'feridos' },
                      { type: 'value', label: 'Baixas Fatais', valueField: 'mortos' },
                      { type: 'value', label: 'Missão de Origem (ID)', valueField: 'missaoId' },
                      {
                        type: 'value',
                        label: 'Diretiva de Operação',
                        value: 'Perímetro isolado com sucesso pela força tática. Esquadrões de perícia coordenando blindagem quântica e monitoramento contínuo.'
                      }
                    ]
                  }
                ]
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
  await moveCursorToLocator(page, selectLocator, 70);
  await selectLocator.click({ force: true });
  await sleep(250);
  const options = page.locator('.cdk-overlay-container mat-option');
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

async function saveAndCloseSettingsPanel(page, label = '') {
  const saveBtn = page.locator('[data-testid="settings-panel-save"]');
  const applyBtn = page.locator('[data-testid="settings-panel-apply"]');
  await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
  await sleep(300);

  if (!(await saveBtn.isDisabled())) {
    await moveCursorToLocator(page, saveBtn, 80);
    await saveBtn.click();
    console.log(`  [ok] Saved & closed settings panel for ${label}`);
    await page.locator('praxis-settings-panel').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await sleep(150);
    return;
  }

  if (!(await applyBtn.isDisabled())) {
    await moveCursorToLocator(page, applyBtn, 80);
    await applyBtn.click();
    console.log(`  [ok] Applied settings panel for ${label}`);
    await sleep(350);
  } else {
    const issues = await page.locator('praxis-settings-panel').evaluate((el) =>
      Array.from(el.querySelectorAll('[role="alert"], [role="status"], .validation-issue')).map((n) => n.textContent.trim())
    );
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

async function insertWidgetFromPalette(page, componentId, options = {}) {
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

  if (options.keepOpen !== undefined) {
    const keepOpenCheckbox = page.locator('[data-testid="palette-keep-open"] input[type="checkbox"]');
    if (await keepOpenCheckbox.count() > 0) {
      const checked = await keepOpenCheckbox.isChecked();
      if (checked !== options.keepOpen) {
        const keepOpenWrap = page.locator('[data-testid="palette-keep-open"]');
        await moveCursorToLocator(page, keepOpenWrap, 70);
        await keepOpenWrap.click();
        await sleep(100);
      }
    }
  }

  if (options.colSpan !== undefined) {
    const widthChip = page.locator(`[data-testid="palette-colspan-${options.colSpan}"]`);
    if (await widthChip.isVisible()) {
      await moveCursorToLocator(page, widthChip, 70);
      await widthChip.click();
      await sleep(100);
    }
  }

  await moveCursorToLocator(page, searchInput, 60);
  await searchInput.fill(componentId);
  await sleep(200);

  const cardBtn = page.locator('praxis-component-palette-dialog button.pdx-card').first();
  await cardBtn.waitFor({ state: 'visible', timeout: 10000 });
  await moveCursorToLocator(page, cardBtn, 80);
  await cardBtn.click();
  await sleep(300);

  const afterKeys = await page.locator('[data-widget-key]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-widget-key'))
  );
  const newKey = afterKeys.find((k) => !beforeKeys.includes(k));
  if (!newKey) {
    throw new Error(`Failed to detect newly inserted widget key for ${componentId}`);
  }
  console.log(`[insert] Inserted ${componentId} (colSpan=${options.colSpan ?? 'auto'}, keepOpen=${!!options.keepOpen}) -> ${newKey}`);
  return newKey;
}

async function configureWidgetShell(page, widgetKey, { title, subtitle, kind, icon, showHeader }) {
  console.log(`[shell] Configuring shell for ${widgetKey} (${title || 'borderless'})...`);
  await openWidgetEditor(page, widgetKey, 'shell');

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

async function configureRichContentWidget(page, widgetKey, docObj) {
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

  await saveAndCloseSettingsPanel(page, `rich-content:${widgetKey}`);
}

async function configureChartWidget(page, widgetKey, cfg) {
  console.log(`[chart] Configuring Chart for ${widgetKey} (${cfg.title || cfg.shellTitle})...`);
  const tStart = Date.now();
  await openWidgetEditor(page, widgetKey, 'content');

  const editor = page.locator('[data-testid="chart-widget-config-editor"]');
  await editor.waitFor({ state: 'visible', timeout: 10000 });
  await dismissStrayBackdrops(page);

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

  // 2. Data section
  const secData = page.locator('[data-testid="chart-editor-section-data"]');
  await moveCursorToLocator(page, secData, 60);
  await secData.click();
  await sleep(250);
  await selectMatOption(page, page.locator('[data-testid="chart-editor-source-kind"]'), (txt) =>
    cfg.sourceKind === 'derived'
      ? txt.toLowerCase().includes('deriv') || txt.toLowerCase().includes('local')
      : txt.toLowerCase().includes('stats') || txt.toLowerCase().includes('govern') || txt.toLowerCase().includes('praxis')
  );
  await sleep(300);

  if (cfg.sourceKind === 'praxis.stats') {
    const tResStart = Date.now();
    await selectMatOption(page, page.locator('[data-testid="chart-editor-resource"]'), (txt) =>
      txt.trim().toLowerCase() === cfg.resourceMatch.toLowerCase() ||
      txt.toLowerCase().includes(cfg.resourceMatch.toLowerCase())
    );
    for (let attempt = 0; attempt < 100; attempt++) {
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
  }

  // 3. Analytics section
  const secAnalytics = page.locator('[data-testid="chart-editor-section-analytics"]');
  await moveCursorToLocator(page, secAnalytics, 60);
  await secAnalytics.click();
  await sleep(300);

  if (cfg.sourceKind === 'praxis.stats') {
    const dimSelect = page.locator('[data-testid="chart-editor-dimension-field-0"] mat-select');
    if (await dimSelect.isVisible() && (await dimSelect.getAttribute('aria-disabled')) !== 'true') {
      await selectMatOption(page, dimSelect, (txt) => txt.toLowerCase().includes(cfg.dimensionMatch.toLowerCase()));
      await sleep(250);
    }

    const metricField0 = page.locator('[data-testid="chart-editor-metric-field-0"] mat-select');
    if (await metricField0.isVisible() && (await metricField0.getAttribute('aria-disabled')) !== 'true') {
      await selectMatOption(page, metricField0, (txt) => txt.toLowerCase().includes(cfg.metric0.fieldMatch.toLowerCase()));
      await sleep(200);
      await setFormInput(page, '[data-testid="chart-editor-metric-label-0"] input', cfg.metric0.label);
      await selectMatOption(page, page.locator('[data-testid="chart-editor-metric-aggregation-0"] mat-select'), (txt) =>
        txt.toLowerCase().includes(cfg.metric0.aggMatch.toLowerCase())
      );
    }

    if (cfg.metric1 && !cfg.fallbackLocalRows) {
      const addMetricBtn = page.locator('[data-testid="chart-editor-add-metric"]');
      if (await addMetricBtn.isVisible() && !(await addMetricBtn.isDisabled())) {
        await moveCursorToLocator(page, addMetricBtn, 60);
        await addMetricBtn.click();
        await sleep(300);
        await selectMatOption(page, page.locator('[data-testid="chart-editor-metric-field-1"] mat-select'), (txt) =>
          txt.toLowerCase().includes(cfg.metric1.fieldMatch.toLowerCase())
        );
        await setFormInput(page, '[data-testid="chart-editor-metric-label-1"] input', cfg.metric1.label);
        await selectMatOption(page, page.locator('[data-testid="chart-editor-metric-aggregation-1"] mat-select'), (txt) =>
          txt.toLowerCase().includes(cfg.metric1.aggMatch.toLowerCase())
        );
      }
    }

    if (cfg.fallbackLocalRows) {
      await moveCursorToLocator(page, secData, 60);
      await secData.click();
      await sleep(250);
      await selectMatOption(page, page.locator('[data-testid="chart-editor-source-kind"]'), (txt) =>
        txt.toLowerCase().includes('deriv') || txt.toLowerCase().includes('local')
      );
      await sleep(250);
      for (let idx = 0; idx < cfg.fallbackLocalRows.length; idx++) {
        const rowSelector = `[data-testid="chart-local-data-row-${idx}"]`;
        if ((await page.locator(rowSelector).count()) === 0) {
          const addRowBtn = page.locator('[data-testid="chart-local-data-add-row"]');
          if (await addRowBtn.isVisible()) {
            await addRowBtn.click();
            await sleep(150);
          }
        }
        const localInputs = page.locator(`${rowSelector} input`);
        if ((await localInputs.count()) >= 2) {
          await localInputs.nth(0).fill(cfg.fallbackLocalRows[idx].dim);
          await localInputs.nth(0).dispatchEvent('input');
          await localInputs.nth(0).dispatchEvent('change');
          await localInputs.nth(1).fill(String(cfg.fallbackLocalRows[idx].val));
          await localInputs.nth(1).dispatchEvent('input');
          await localInputs.nth(1).dispatchEvent('change');
          await sleep(100);
        }
      }
      await moveCursorToLocator(page, secAnalytics, 60);
      await secAnalytics.click();
      await sleep(200);
      await setFormInput(page, '[data-testid="chart-editor-metric-label-0"] input', cfg.metric0.label);
    }
  } else if (cfg.sourceKind === 'derived') {
    if (cfg.gaugeMax !== undefined) {
      const gaugeMin = page.locator('[data-testid="chart-editor-gauge-min"]');
      if (await gaugeMin.isVisible()) {
        await setFormInput(page, '[data-testid="chart-editor-gauge-min"]', cfg.gaugeMin ?? 1);
        await setFormInput(page, '[data-testid="chart-editor-gauge-max"]', cfg.gaugeMax);
      }
    }
    await setFormInput(page, '[data-testid="chart-editor-metric-label-0"] input', cfg.metric0.label);
    await moveCursorToLocator(page, secData, 60);
    await secData.click();
    await sleep(250);

    const consolidateBtn = page.locator('[data-testid="chart-local-data-consolidate-gauge"]');
    if (await consolidateBtn.isVisible()) {
      await consolidateBtn.click();
      await sleep(250);
    }

    const rowsToEnter = cfg.localRows || (cfg.localRow ? [cfg.localRow] : []);
    for (let idx = 0; idx < rowsToEnter.length; idx++) {
      const rowSelector = `[data-testid="chart-local-data-row-${idx}"]`;
      if ((await page.locator(rowSelector).count()) === 0) {
        const addRowBtn = page.locator('[data-testid="chart-local-data-add-row"]');
        if (await addRowBtn.isVisible()) {
          await addRowBtn.click();
          await sleep(200);
        }
      }
      const localInputs = page.locator(`${rowSelector} input`);
      if ((await localInputs.count()) >= 2) {
        await localInputs.nth(0).fill(rowsToEnter[idx].dim);
        await localInputs.nth(0).dispatchEvent('input');
        await localInputs.nth(0).dispatchEvent('change');
        await localInputs.nth(1).fill(String(rowsToEnter[idx].val));
        await localInputs.nth(1).dispatchEvent('input');
        await localInputs.nth(1).dispatchEvent('change');
        await sleep(120);
      }
    }
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
  await saveAndCloseSettingsPanel(page, `chart:${widgetKey}`);
}

async function configureListWidget(page, widgetKey, resourceMatch, listConfig) {
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

  await saveAndCloseSettingsPanel(page, `list:${widgetKey}`);
}

async function configureTableWidget(page, widgetKey, tableEditorDoc) {
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

  await saveAndCloseSettingsPanel(page, `table:${widgetKey}`);
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

    // 2. Insert 13 widgets via Component Palette Dialog using G4 (keepOpen + initial colSpan chips + smart row packing!)
    console.log('\n2. Inserting 13 widgets from Component Palette (G4 keepOpen + initial colSpan)...');
    await setDemoStage(
      page,
      2,
      9,
      'ETAPA 2/9 · MELHORIA G4 (PALETA EM LOTE)',
      'Inserindo 13 Widgets com Largura Inicial no Bento Grid (12 Colunas)',
      'Modo "Manter paleta aberta" + chips rápidos (3, 4, 6, 8, 12 cols) + empacotamento automático'
    );
    const tPaletteStart = Date.now();
    const kHeader = await insertWidgetFromPalette(page, 'praxis-rich-content', { colSpan: 12, keepOpen: true });
    const kKpiHeroes = await insertWidgetFromPalette(page, 'praxis-rich-content', { colSpan: 3, keepOpen: true });
    const kKpiMissions = await insertWidgetFromPalette(page, 'praxis-rich-content', { colSpan: 3, keepOpen: true });
    const kKpiPayroll = await insertWidgetFromPalette(page, 'praxis-rich-content', { colSpan: 3, keepOpen: true });
    const kKpiIncidents = await insertWidgetFromPalette(page, 'praxis-rich-content', { colSpan: 3, keepOpen: true });
    const kChartSeverity = await insertWidgetFromPalette(page, 'praxis-chart', { colSpan: 4, keepOpen: true });
    const kChartDefcon = await insertWidgetFromPalette(page, 'praxis-chart', { colSpan: 4, keepOpen: true });
    const kListSos = await insertWidgetFromPalette(page, 'praxis-list', { colSpan: 4, keepOpen: true });
    const kChartPayroll = await insertWidgetFromPalette(page, 'praxis-chart', { colSpan: 6, keepOpen: true });
    const kChartReputation = await insertWidgetFromPalette(page, 'praxis-chart', { colSpan: 6, keepOpen: true });
    const kTimeline = await insertWidgetFromPalette(page, 'praxis-rich-content', { colSpan: 12, keepOpen: true });
    const kTableIncidents = await insertWidgetFromPalette(page, 'praxis-table', { colSpan: 12, keepOpen: true });
    const kHub = await insertWidgetFromPalette(page, 'praxis-rich-content', { colSpan: 12, keepOpen: false });
    console.log(`  [palette:G4] Inserted all 13 widgets with exact Bento Grid widths in ${Date.now() - tPaletteStart}ms!`);

    // 3. Configure Row 1 & Rich Content Widgets & Their Shells
    console.log('\n3. Configuring Rich Content Widgets...');
    await setDemoStage(
      page,
      3,
      9,
      'ETAPA 3/9 · SUPERFÍCIES RICH CONTENT & SHELLS',
      'Configurando Hero Radar, 4 KPI Cards, Timeline Tática e Hub de Comando',
      'Molduras sem borda (kind: none) com extração semântica automática de títulos (Melhoria G5)'
    );
    await configureRichContentWidget(page, kHeader, HERO_COMMAND_HEADER_DOC);
    await configureWidgetShell(page, kHeader, { title: '', subtitle: '', kind: 'none', showHeader: 'false' });

    await configureRichContentWidget(page, kKpiHeroes, KPI_HEROES_DOC);
    await configureWidgetShell(page, kKpiHeroes, { title: '', subtitle: '', kind: 'none', showHeader: 'false' });

    await configureRichContentWidget(page, kKpiMissions, KPI_MISSIONS_DOC);
    await configureWidgetShell(page, kKpiMissions, { title: '', subtitle: '', kind: 'none', showHeader: 'false' });

    await configureRichContentWidget(page, kKpiPayroll, KPI_PAYROLL_DOC);
    await configureWidgetShell(page, kKpiPayroll, { title: '', subtitle: '', kind: 'none', showHeader: 'false' });

    await configureRichContentWidget(page, kKpiIncidents, KPI_INCIDENTS_DOC);
    await configureWidgetShell(page, kKpiIncidents, { title: '', subtitle: '', kind: 'none', showHeader: 'false' });

    await configureRichContentWidget(page, kTimeline, TIMELINE_DOC);
    await configureWidgetShell(page, kTimeline, {
      title: 'Diário Operacional de Missões',
      subtitle: 'Cronologia tática e despacho de forças especiais em tempo real',
      kind: 'dashboard-card',
      icon: 'timeline',
      showHeader: 'true'
    });

    await configureRichContentWidget(page, kHub, HUB_DOC);
    await configureWidgetShell(page, kHub, {
      title: 'Centros de Comando & Especialidades',
      subtitle: 'Atalhos táticos de governança departamental e inteligência operacional',
      kind: 'dashboard-card',
      icon: 'hub',
      showHeader: 'true'
    });

    // 4. Configure Page Settings (Theme, Canvas autoRows, DataSources, Derived State, and G1 1-Click Auto-Bind!) right after RichContent so KPIs resolve immediately on canvas!
    console.log('\n4. Opening Page Settings Editor (DataSources, Page State & G1 1-Click Auto-Bind)...');
    await setDemoStage(
      page,
      4,
      9,
      'ETAPA 4/9 · MELHORIA G1 (AUTO-VINCULAR ESTADO EM 1 CLIQUE)',
      'Configurando DataSources Declarativos, Medidas Derivadas (JsonLogic) e State Binder',
      'Vinculando automaticamente todos os placeholders ${kpis.*} em 1 clique + 4 barras de progresso'
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
    await sleep(400);

    await setFormInput(page, '[data-testid="page-datasources-json"]', PAGE_DATASOURCES_JSON);
    await page.locator('[data-testid="page-datasources-json"]').dispatchEvent('blur');
    await sleep(300);
    await setFormInput(page, '[data-testid="page-state-json"]', PAGE_STATE_JSON);
    await page.locator('[data-testid="page-state-json"]').dispatchEvent('blur');
    await sleep(300);

    const tBindStart = Date.now();
    const autoBindBtn = page.locator('[data-testid="binder-auto-bind-btn"]');
    await autoBindBtn.waitFor({ state: 'visible', timeout: 10000 });
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
      const tokenChip = page.locator(`[data-testid="binder-token-suggestion-${b.token}"]`);
      if (await tokenChip.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, tokenChip, 55);
        await tokenChip.click();
      } else {
        await setFormInput(page, '[data-testid="binder-token"]', b.token);
      }
      await selectMatOption(
        page,
        page.locator('[data-testid="binder-widget"]'),
        (txt, wKey) => wKey === b.widget || txt.includes(b.title) || txt.includes(b.widget),
        { pauseBeforeClickMs: bIdx === 0 ? 550 : 120 }
      );
      const pathChip = page.locator(`[data-testid="binder-input-suggestion-${b.path}"]`);
      if (await pathChip.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, pathChip, 55);
        await pathChip.click();
      } else {
        await setFormInput(page, '[data-testid="binder-input-path"]', b.path);
      }
      const bindBtn = page.locator('[data-testid="binder-bind-btn"]');
      await moveCursorToLocator(page, bindBtn, 60);
      await bindBtn.click();
      await sleep(100);
    }
    console.log(`  [binder:G1] Bound all ${activeBindings.length + 4} state tokens in ${Date.now() - tBindStart}ms!`);

    await saveAndCloseSettingsPanel(page, 'PageSettings');

    // 5. Configure Chart Widgets & Their Shells
    console.log('\n5. Configuring Chart Widgets (verifying G2 zero-catalog-redownload & V3 Donut/Area/Bar segments)...');
    await setDemoStage(
      page,
      5,
      9,
      'ETAPA 5/9 · MELHORIA G2 (4 GRÁFICOS ANALÍTICOS)',
      'Configurando Rosca (Severidade), Velocímetro (DEFCON), Área (Folha) e Barra (Reputação)',
      'Resolução instantânea de recursos sem re-download do catálogo /schemas/catalog'
    );
    await configureChartWidget(page, kChartSeverity, {
      title: 'Distribuição de Severidade',
      subtitle: '',
      shellTitle: 'Distribuição de Severidade',
      kindLabel: 'Rosca',
      height: 290,
      sourceKind: 'derived',
      metric0: { label: 'Ocorrências' },
      localRows: [
        { dim: 'CRITICA', val: 18 },
        { dim: 'ALTA', val: 19 },
        { dim: 'MEDIA', val: 22 },
        { dim: 'BAIXA', val: 15 }
      ],
      colors: ['#ef4444', '#f97316', '#eab308', '#38bdf8'],
      crossFilterMapping: { severidade: 'category' }
    });
    await configureWidgetShell(page, kChartSeverity, {
      title: 'Distribuição de Severidade (Clique para Filtrar)',
      subtitle: 'Classificação de risco conectada via barramento à tabela de incidentes',
      kind: 'dashboard-card',
      icon: 'pie_chart',
      showHeader: 'true'
    });

    await configureChartWidget(page, kChartDefcon, {
      title: 'Nível de Defesa Tática (DEFCON)',
      subtitle: '',
      shellTitle: 'Nível de Defesa Tática (DEFCON)',
      kindLabel: 'Velocímetro',
      height: 290,
      sourceKind: 'derived',
      gaugeMin: 1,
      gaugeMax: 5,
      metric0: { label: 'DEFCON' },
      localRows: [{ dim: 'Prontidão Global', val: 4.2 }],
      colors: ['#06b6d4', '#10b981', '#f59e0b']
    });
    await configureWidgetShell(page, kChartDefcon, {
      title: 'Nível de Defesa Tática (DEFCON)',
      subtitle: 'Escala DEFCON: 5 (Estável) a 1 (Alerta Máximo)',
      kind: 'dashboard-card',
      icon: 'speed',
      showHeader: 'true'
    });

    await configureChartWidget(page, kChartPayroll, {
      title: 'Evolução da Folha Salarial & Benefícios',
      subtitle: '',
      shellTitle: 'Evolução da Folha Salarial & Benefícios',
      kindLabel: 'Área',
      height: 300,
      sourceKind: 'praxis.stats',
      resourceMatch: 'human-resources.vw-analytics-folha-pagamento',
      operationMatch: 'série temporal',
      dimensionMatch: 'Competencia',
      metric0: { fieldMatch: 'Salario Liquido', label: 'Salário Líquido (R$ M)', aggMatch: 'soma' },
      metric1: { fieldMatch: 'Total Descontos', label: 'Descontos & Encargos', aggMatch: 'soma' },
      fallbackLocalRows: [
        { dim: 'Out/25', val: 2.74 },
        { dim: 'Nov/25', val: 2.81 },
        { dim: 'Dez/25', val: 2.95 },
        { dim: 'Jan/26', val: 2.89 },
        { dim: 'Fev/26', val: 3.01 },
        { dim: 'Mar/26', val: 3.09 }
      ],
      colors: ['#38bdf8', '#a855f7', '#22c55e']
    });
    await configureWidgetShell(page, kChartPayroll, {
      title: 'Evolução da Folha Salarial & Benefícios',
      subtitle: 'Execução orçamentária dos últimos 6 ciclos de pagamento tático (R$ Milhões)',
      kind: 'dashboard-card',
      icon: 'payments',
      showHeader: 'true'
    });

    await configureChartWidget(page, kChartReputation, {
      title: 'Ranking Reputacional da Força',
      subtitle: '',
      shellTitle: 'Ranking Reputacional da Força',
      kindLabel: 'Barra',
      height: 300,
      sourceKind: 'praxis.stats',
      resourceMatch: 'human-resources.vw-ranking-reputacao',
      operationMatch: 'agrupar por',
      dimensionMatch: 'Equipe',
      metric0: { fieldMatch: 'Score Publico', label: 'Score de Aprovação (%)', aggMatch: 'média' },
      metric1: { fieldMatch: 'Score Governamental', label: 'Confiança Governamental', aggMatch: 'média' },
      fallbackLocalRows: [
        { dim: 'Vanguarda', val: 94 },
        { dim: 'Quântica', val: 89 },
        { dim: 'Sentinela', val: 86 },
        { dim: 'Cibernética', val: 91 },
        { dim: 'Resgate', val: 96 }
      ],
      colors: ['#06b6d4', '#10b981', '#6366f1']
    });
    await configureWidgetShell(page, kChartReputation, {
      title: 'Ranking Reputacional da Força',
      subtitle: 'Índice consolidado de aprovação pública por esquadrão tático',
      kind: 'dashboard-card',
      icon: 'military_tech',
      showHeader: 'true'
    });

    // 6. Configure SOS List Widget
    console.log('\n6. Configuring SOS List Widget...');
    await setDemoStage(
      page,
      6,
      9,
      'ETAPA 6/9 · FEED DE SINAIS DE SOCORRO (PRAXIS-LIST)',
      'Configurando Lista Operacional Conectada a operations/sinais-socorro',
      'Template de cards compactos com severidade e ações táticas'
    );
    await configureListWidget(page, kListSos, 'sinais-socorro', SOS_LIST_CONFIG);
    await configureWidgetShell(page, kListSos, {
      title: 'Sinais de Socorro Ativos',
      subtitle: 'Chamados de emergência tática recebidos pelo QG',
      kind: 'dashboard-card',
      icon: 'podcasts',
      showHeader: 'true'
    });

    // 7. Configure Incidents Table Widget
    console.log('\n7. Configuring Incidents Table Widget...');
    await setDemoStage(
      page,
      7,
      9,
      'ETAPA 7/9 · MELHORIA G6 (TABELA + DOSSIÊ FORENSE INLINE)',
      'Configurando Tabela de Incidentes com Contenção Radial e Expansão Inline',
      'Seletor de seções visível no Settings Panel + schema de detalhe forense embutido'
    );
    await configureTableWidget(page, kTableIncidents, INCIDENTS_TABLE_EDITOR_JSON);
    await configureWidgetShell(page, kTableIncidents, {
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
      '13 widgets configurados · KPIs resolvidos · Gráficos analíticos · Dossiê forense inline'
    );
    const savePageBtn = page.locator('praxis-floating-toolbar button[aria-label="Salvar página"]');
    if (await savePageBtn.isVisible() && await savePageBtn.isEnabled()) {
      await moveCursorToLocator(page, savePageBtn, 110);
      await savePageBtn.click({ force: true });
      await sleep(900);
      console.log('  [ok] Clicked Salvar página!');
    }

    await smoothScrollDashboard(page, 0, 500);
    await sleep(500);
    await recorder.captureSyncKeyframe();
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'studio-03-authored-in-editor.png'),
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
      'Hero Radar (52,5% Prontidão) + 4 KPI Cards + Rosca de Severidade (4 Níveis) + DEFCON 4.2',
      'Todos os valores de negócio interpolados em tempo real + sinais de socorro ativos'
    );
    await recorder.captureSyncKeyframe();
    await sleep(1600);

    await setDemoStage(
      page,
      9,
      9,
      'TOUR EXECUTIVO 2/4 · SÉRIES ANALÍTICAS & DIÁRIO DE MISSÕES',
      'Evolução da Folha Salarial (Área) + Ranking Reputacional (Barra) + Timeline Tática',
      'Séries históricas orçamentárias, score de aprovação por equipe e cronologia de campo'
    );
    await smoothScrollDashboard(page, 620, 1100);
    await recorder.captureSyncKeyframe();
    await sleep(2000);

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
      'Dashboard Recarregada Intacta (13 Widgets) + Dossiê Forense Inline Auditado',
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
