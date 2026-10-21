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
      quality: 92,
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
  return String(text || '').replace(/https?:\/\/praxis-api-quickstart\.onrender\.com/gi, BASE_URL);
}

function buildFastRowCapabilitiesSnapshot(id) {
  const numericId = Number.isNaN(Number(id)) ? id : Number(id);
  const basePath = `/api/human-resources/funcionarios/${numericId}`;
  return {
    resourceKey: 'human-resources.funcionarios',
    resourcePath: '/api/human-resources/funcionarios',
    resourceId: numericId,
    scope: 'ITEM',
    canonicalOperations: {
      create: true,
      view: true,
      edit: true,
      delete: true,
      filter: true,
      cursor: true,
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
        resourceKey: 'human-resources.funcionarios',
        resourcePath: '/api/human-resources/funcionarios',
        group: 'human-resources',
        kind: 'VIEW',
        scope: 'ITEM',
        title: 'Ficha detalhada',
        description: 'Visualização em leitura da ficha funcional e lotação do colaborador.',
        intent: 'read-only-projection',
        operationId: 'getById',
        method: 'GET',
        path: '/api/human-resources/funcionarios/{id}',
        schemaId: null,
        schemaUrl: null,
        availability: { allowed: true, reason: null, metadata: { scope: 'ITEM' } },
        order: 20,
        tags: ['detail', 'profile'],
        _links: { self: { href: `${ BASE_URL }${ basePath }` } },
      },
      {
        id: 'edit',
        resourceKey: 'human-resources.funcionarios',
        resourcePath: '/api/human-resources/funcionarios',
        group: 'human-resources',
        kind: 'FORM',
        scope: 'ITEM',
        title: 'Editar perfil',
        description: 'Atualização contextual dos dados cadastrais e organizacionais do funcionário.',
        intent: 'edit',
        operationId: 'update',
        method: 'PUT',
        path: '/api/human-resources/funcionarios/{id}',
        schemaId: 'a03dc6fc4785ccca1c4ab596244f12e6ad3bb6ebbd42014c24596f7b9529fd75',
        schemaUrl: `${ BASE_URL }/schemas/filtered?path=/api/human-resources/funcionarios/{id}&operation=put&schemaType=request`,
        availability: { allowed: true, reason: null, metadata: { scope: 'ITEM' } },
        order: 30,
        tags: ['crud', 'item'],
        _links: {
          update: { href: `${ BASE_URL }${ basePath }` },
          schema: {
            href: `${ BASE_URL }/schemas/filtered?path=%2Fapi%2Fhuman-resources%2Ffuncionarios%2F%7Bid%7D&operation=put&schemaType=request`,
          },
        },
      },
    ],
    actions: [],
    _links: {
      self: { href: `${ BASE_URL }${ basePath }/capabilities` },
      item: { href: `${ BASE_URL }${ basePath }` },
      collection: { href: `${ BASE_URL }/api/human-resources/funcionarios/all` },
      surfaces: { href: `${ BASE_URL }${ basePath }/surfaces` },
      actions: { href: `${ BASE_URL }${ basePath }/actions` },
    },
  };
}

function buildFastRowActionsCatalog(id) {
  const numericId = Number.isNaN(Number(id)) ? id : Number(id);
  const basePath = `/api/human-resources/funcionarios/${numericId}`;
  return {
    resourceKey: 'human-resources.funcionarios',
    resourcePath: '/api/human-resources/funcionarios',
    resourceId: numericId,
    group: 'human-resources',
    actions: [],
    _links: {
      self: { href: `${ BASE_URL }${ basePath }/actions` },
      item: { href: `${ BASE_URL }${ basePath }` },
      capabilities: { href: `${ BASE_URL }${ basePath }/capabilities` },
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
    const createdFuncionarios = [];
    const updatedFuncionarios = new Map();
    const deletedFuncionarioIds = new Set();
    const cachedFuncionariosById = new Map();
    const cachedGetJsonByUrl = new Map();
    const cachedPostOptionsByKey = new Map();
    let cachedBaseFuncionariosRows = null;
    let cachedFilterEnvelopeTemplate = null;

    const applyOverlayToRecord = (rec) => {
      if (!rec || typeof rec !== 'object') return rec;
      const idKey = String(rec.id ?? '');
      const patch = updatedFuncionarios.get(idKey);
      const numericId = Number(rec.id);
      const defaultAtivo = !Number.isNaN(numericId) ? numericId % 5 !== 0 : Boolean(rec.ativo);
      const itemBase = `${BASE_URL}/api/human-resources/funcionarios/${idKey}`;
      const base = {
        ...rec,
        ativo: defaultAtivo,
        _links: rec._links || {
          self: { href: itemBase },
          update: { href: itemBase },
          delete: { href: itemBase },
          capabilities: { href: `${itemBase}/capabilities` },
          surfaces: { href: `${itemBase}/surfaces` },
          actions: { href: `${itemBase}/actions` },
        },
      };
      return patch ? { ...base, ...patch } : base;
    };

    const matchesFilterCriteria = (row, criteria) => {
      if (!criteria || typeof criteria !== 'object') return true;
      for (const [rawKey, rawVal] of Object.entries(criteria)) {
        if (rawVal === undefined || rawVal === null || rawVal === '') continue;
        if (rawKey === 'page' || rawKey === 'size' || rawKey === 'sort' || rawKey === 'includeLinks') continue;
        if (rawKey === 'ativo') {
          const wantBool =
            typeof rawVal === 'boolean'
              ? rawVal
              : String(rawVal).toLowerCase() === 'true';
          if (Boolean(row.ativo) !== wantBool) return false;
          continue;
        }
        if (rawKey === 'departamentoId' || rawKey === 'cargoId') {
          if (Number(row[rawKey]) !== Number(rawVal)) return false;
          continue;
        }
        const rowVal = String(row[rawKey] ?? '').toLowerCase();
        const needle = String(rawVal).trim().toLowerCase();
        if (needle && !rowVal.includes(needle)) {
          return false;
        }
      }
      return true;
    };

    const server = http.createServer((req, res) => {
      const reqUrl = req.url || '/';
      const cleanReqPath = reqUrl.split('?')[0];
      const method = (req.method || 'GET').toUpperCase();

      if (reqUrl.startsWith('/api') || reqUrl.startsWith('/schemas')) {
        const bodyChunks = [];
        req.on('data', (chunk) => bodyChunks.push(chunk));
        req.on('end', () => {
          const reqBodyBuf = Buffer.concat(bodyChunks);
          const reqBodyText = reqBodyBuf.toString('utf8');
          let parsedReqBody = null;
          if (reqBodyText) {
            try {
              parsedReqBody = JSON.parse(reqBodyText);
            } catch {}
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
          if (
            method === 'POST' &&
            cleanReqPath.includes('/options/') &&
            cachedPostOptionsByKey.has(postCacheKey)
          ) {
            const cachedBuf = cachedPostOptionsByKey.get(postCacheKey);
            res.writeHead(200, {
              'Content-Type': 'application/json; charset=utf-8',
              'Content-Length': String(cachedBuf.length),
            });
            res.end(cachedBuf);
            return;
          }

          // Fast local response for item-level row discovery (capabilities & actions)
          const itemCapMatch = cleanReqPath.match(/^\/api\/human-resources\/funcionarios\/([^/]+)\/(capabilities|actions)$/);
          if (method === 'GET' && itemCapMatch) {
            const [, itemId, subResource] = itemCapMatch;
            const bodyObj =
              subResource === 'capabilities'
                ? buildFastRowCapabilitiesSnapshot(itemId)
                : buildFastRowActionsCatalog(itemId);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(bodyObj));
            return;
          }

          if (cleanReqPath === '/api/human-resources/funcionarios/stats/group-by') {
            const activeExtra = createdFuncionarios.filter((item) => !deletedFuncionarioIds.has(String(item.id))).length;
            const deletedCount = deletedFuncionarioIds.size;
            const totalCount = Math.max(0, 98 + activeExtra - deletedCount);
            const activeCount = Math.max(0, 80 + activeExtra - deletedCount);
            const inactiveCount = Math.max(0, totalCount - activeCount);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(
              JSON.stringify({
                status: 'success',
                data: {
                  field: parsedReqBody?.field || 'ativo',
                  totalCount,
                  byKey: {
                    true: activeCount,
                    false: inactiveCount,
                  },
                  buckets: [
                    { key: 'true', label: 'Ativos', count: activeCount, value: activeCount, values: { total: activeCount } },
                    { key: 'false', label: 'Inativos', count: inactiveCount, value: inactiveCount, values: { total: inactiveCount } },
                  ],
                },
              }),
            );
            return;
          }

          // Fast in-memory response (< 10ms) for POST /api/human-resources/funcionarios/filter once seeded
          if (
            method === 'POST' &&
            cleanReqPath === '/api/human-resources/funcionarios/filter' &&
            Array.isArray(cachedBaseFuncionariosRows) &&
            cachedFilterEnvelopeTemplate
          ) {
            const existingIds = new Set(cachedBaseFuncionariosRows.map((item) => String(item?.id)));
            const activeCreated = createdFuncionarios
              .filter((item) => !deletedFuncionarioIds.has(String(item.id)) && !existingIds.has(String(item.id)))
              .map(applyOverlayToRecord);
            const activeBase = cachedBaseFuncionariosRows
              .filter((item) => !deletedFuncionarioIds.has(String(item?.id)) && !isGarbageTestFuncionario(item))
              .map(applyOverlayToRecord);
            const fullList = [...activeCreated, ...activeBase];
            const criteria =
              parsedReqBody?.filter && typeof parsedReqBody.filter === 'object'
                ? parsedReqBody.filter
                : parsedReqBody;
            const filteredRows = fullList.filter((row) => matchesFilterCriteria(row, criteria));
            const clonedEnvelope = JSON.parse(JSON.stringify(cachedFilterEnvelopeTemplate));
            const targetNode =
              clonedEnvelope?.data && Array.isArray(clonedEnvelope.data.content)
                ? clonedEnvelope.data
                : clonedEnvelope;
            targetNode.content = filteredRows.slice(0, 25);
            const hasActiveCriteria =
              criteria &&
              typeof criteria === 'object' &&
              Object.keys(criteria).some(
                (k) =>
                  !['page', 'size', 'sort', 'includeLinks'].includes(k) &&
                  criteria[k] !== undefined &&
                  criteria[k] !== null &&
                  criteria[k] !== '',
              );
            targetNode.totalElements = hasActiveCriteria
              ? filteredRows.length
              : Math.max(filteredRows.length, 98 + activeCreated.length - deletedFuncionarioIds.size);
            targetNode.numberOfElements = targetNode.content.length;
            const outBuf = Buffer.from(JSON.stringify(clonedEnvelope), 'utf8');
            res.writeHead(200, {
              'Content-Type': 'application/json; charset=utf-8',
              'Content-Length': String(outBuf.length),
            });
            res.end(outBuf);
            return;
          }

          // Handle direct synthetic mutations on /api/human-resources/funcionarios
          const singleMatch = cleanReqPath.match(/^\/api\/human-resources\/funcionarios\/([^/]+)$/);
          const singleSegment = singleMatch ? singleMatch[1] : null;
          const isReservedSegment =
            singleSegment &&
            ['all', 'filter', 'options', 'by-ids', 'stats', 'capabilities', 'actions', 'surfaces', 'schemas'].includes(
              singleSegment.toLowerCase(),
            );

          if (method === 'POST' && cleanReqPath === '/api/human-resources/funcionarios') {
            const payload = parsedReqBody && typeof parsedReqBody === 'object' ? parsedReqBody : {};
            const newId = 950 + createdFuncionarios.length + 1;
            const itemBase = `${BASE_URL}/api/human-resources/funcionarios/${newId}`;
            const created = {
              id: newId,
              nomeCompleto: payload.nomeCompleto || 'Helena Vasconcelos',
              cpf: payload.cpf || '418.920.317-44',
              email: payload.email || 'helena.vasconcelos@praxis.io',
              telefone: payload.telefone || '(11) 99812-4401',
              dataNascimento: payload.dataNascimento || '1991-04-15',
              cargoId: payload.cargoId ?? 1,
              cargoNome: payload.cargoNome || 'Arquiteta de Plataforma Staff',
              departamentoId: payload.departamentoId ?? 1,
              departamentoNome: payload.departamentoNome || 'Engenharia de Plataforma',
              salario: payload.salario != null ? Number(payload.salario) : 22800,
              dataAdmissao: payload.dataAdmissao || '2025-02-01',
              ativo: payload.ativo !== undefined ? Boolean(payload.ativo) : true,
              avatarUrl: payload.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&q=80',
              ...payload,
              _links: {
                self: { href: itemBase },
                update: { href: itemBase },
                delete: { href: itemBase },
                capabilities: { href: `${itemBase}/capabilities` },
                surfaces: { href: `${itemBase}/surfaces` },
                actions: { href: `${itemBase}/actions` },
              },
            };
            created.id = newId;
            createdFuncionarios.unshift(created);
            cachedFuncionariosById.set(String(newId), created);
            res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(created));
            return;
          }

          if ((method === 'PUT' || method === 'PATCH') && singleSegment && !isReservedSegment) {
            const idKey = String(singleSegment);
            const payload = parsedReqBody && typeof parsedReqBody === 'object' ? parsedReqBody : {};
            const prev = updatedFuncionarios.get(idKey) || cachedFuncionariosById.get(idKey) || {};
            const merged = { ...prev, ...payload, id: Number.isNaN(Number(idKey)) ? idKey : Number(idKey) };
            updatedFuncionarios.set(idKey, merged);
            cachedFuncionariosById.set(idKey, merged);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(merged));
            return;
          }

          if (method === 'DELETE' && singleSegment && !isReservedSegment) {
            const idKey = String(singleSegment);
            deletedFuncionarioIds.add(idKey);
            cachedFuncionariosById.delete(idKey);
            res.writeHead(204);
            res.end();
            return;
          }

          if (method === 'GET' && singleSegment && !isReservedSegment) {
            const idKey = String(singleSegment);
            const createdHit = createdFuncionarios.find((item) => String(item.id) === idKey);
            const cachedHit = createdHit || cachedFuncionariosById.get(idKey);
            if (cachedHit) {
              const resolvedRecord = applyOverlayToRecord(cachedHit);
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ status: 'success', data: resolvedRecord, ...resolvedRecord }));
              return;
            }
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
                  cleanReqPath.includes('/funcionarios');

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
                    } else if (cleanReqPath === '/api/human-resources/funcionarios/all') {
                      const rows = Array.isArray(json?.data)
                        ? json.data
                        : Array.isArray(json)
                          ? json
                          : [];
                      if (rows.length > 0) {
                        const cleaned = rows
                          .filter((item) => !isGarbageTestFuncionario(item))
                          .map(applyOverlayToRecord);
                        cachedBaseFuncionariosRows = cleaned;
                        for (const row of cleaned) {
                          if (row && row.id != null) {
                            cachedFuncionariosById.set(String(row.id), row);
                          }
                        }
                      }
                    } else if (cleanReqPath === '/api/human-resources/funcionarios/filter') {
                      const targetNode = json?.data && Array.isArray(json.data.content) ? json.data : json;
                      if (targetNode && Array.isArray(targetNode.content)) {
                        const existingIds = new Set(targetNode.content.map((item) => String(item?.id)));
                        const activeCreated = createdFuncionarios
                          .filter((item) => !deletedFuncionarioIds.has(String(item.id)) && !existingIds.has(String(item.id)))
                          .map(applyOverlayToRecord);
                        const cleanedBackendRows = targetNode.content.filter(
                          (item) => !deletedFuncionarioIds.has(String(item?.id)) && !isGarbageTestFuncionario(item),
                        );
                        if (!cachedBaseFuncionariosRows || cleanedBackendRows.length > cachedBaseFuncionariosRows.length) {
                          cachedBaseFuncionariosRows = cleanedBackendRows.map(applyOverlayToRecord);
                        }
                        if (!cachedFilterEnvelopeTemplate) {
                          cachedFilterEnvelopeTemplate = JSON.parse(JSON.stringify(json));
                        }
                        const removedGarbageCount = targetNode.content.length - cleanedBackendRows.length;
                        const mergedList = [
                          ...activeCreated,
                          ...cleanedBackendRows.map(applyOverlayToRecord),
                        ];
                        for (const row of mergedList) {
                          if (row && row.id != null) {
                            cachedFuncionariosById.set(String(row.id), row);
                          }
                        }
                        targetNode.content = mergedList;
                        if (typeof targetNode.totalElements === 'number') {
                          targetNode.totalElements = Math.max(
                            mergedList.length,
                            targetNode.totalElements + activeCreated.length - removedGarbageCount,
                          );
                        }
                      }
                    } else if (method === 'GET' && singleSegment && !isReservedSegment) {
                      if (json?.data && typeof json.data === 'object') {
                        json.data = applyOverlayToRecord(json.data);
                        if (json.data?.id != null) {
                          cachedFuncionariosById.set(String(json.data.id), json.data);
                        }
                      } else {
                        json = applyOverlayToRecord(json);
                        if (json?.id != null) {
                          cachedFuncionariosById.set(String(json.id), json);
                        }
                      }
                    }

                    const outBuf = Buffer.from(JSON.stringify(json), 'utf8');
                    if (
                      (proxyRes.statusCode || 200) < 300 &&
                      method === 'GET' &&
                      (reqUrl.startsWith('/schemas') ||
                        cleanReqPath.includes('/capabilities') ||
                        cleanReqPath.includes('/surfaces') ||
                        cleanReqPath.includes('/actions') ||
                        cleanReqPath.includes('/options'))
                    ) {
                      cachedGetJsonByUrl.set(reqUrl, outBuf);
                    }
                    if (
                      (proxyRes.statusCode || 200) < 300 &&
                      method === 'POST' &&
                      cleanReqPath.includes('/options/')
                    ) {
                      cachedPostOptionsByKey.set(postCacheKey, outBuf);
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
  const openAutocomplete = page.locator('.mat-mdc-autocomplete-panel.mat-mdc-autocomplete-visible');
  if (await openAutocomplete.count().catch(() => 0)) {
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(60);
  }
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

async function expandActiveSettingsPanel(page) {
  const expandBtn = page.locator('[data-testid="settings-panel-toggle-expand"]').last();
  if (await expandBtn.isVisible().catch(() => false)) {
    const isExpanded = await expandBtn.getAttribute('aria-expanded').catch(() => 'false');
    if (isExpanded !== 'true') {
      await moveCursorToLocator(page, expandBtn, 85);
      await expandBtn.click();
      await sleep(320);
    }
  }
}

async function collapseSidebarIfExpanded(page) {
  const collapseBtn = page.locator('button.praxis-shell__collapse-btn[aria-expanded="true"]').first();
  if (await collapseBtn.isVisible().catch(() => false)) {
    await moveCursorToLocator(page, collapseBtn, 85);
    await collapseBtn.click();
    await sleep(300);
  }
}

async function saveAndCloseSettingsPanel(page, label = '') {
  await dismissStrayBackdrops(page);
  const saveBtn = page.locator('[data-testid="settings-panel-save"]').last();
  const applyBtn = page.locator('[data-testid="settings-panel-apply"]').last();
  await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
  await sleep(300);

  if (!(await saveBtn.isDisabled())) {
    await moveCursorToLocator(page, saveBtn, 90);
    await saveBtn.click();
    console.log(`  [ok] Saved & closed settings panel for ${label}`);
    await sleep(500);
    return;
  }

  if (!(await applyBtn.isDisabled())) {
    await moveCursorToLocator(page, applyBtn, 90);
    await applyBtn.click();
    console.log(`  [ok] Applied settings panel for ${label}`);
    await sleep(450);
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
    const hasTrigger = (await rqc.locator('.pdx-material-collection-trigger, [data-testid="quick-connect-change-resource-btn"]').count()) > 0;
    const hasSearch = (await rqc.locator('[data-testid="quick-connect-search-input"]').count()) > 0;
    if ((hasTrigger || hasSearch) && loadingCount === 0) break;
    await sleep(200);
  }

  const changeBtn = rqc.locator('[data-testid="quick-connect-change-resource-btn"]').first();
  const collectionTrigger = rqc.locator('button.pdx-material-collection-trigger[role="combobox"]').first();
  const searchInput = rqc.locator('[data-testid="quick-connect-search-input"]').first();

  if (await changeBtn.isVisible().catch(() => false)) {
    await moveCursorToLocator(page, changeBtn, 90);
    await changeBtn.click();
    await sleep(260);
  } else if (await collectionTrigger.isVisible().catch(() => false)) {
    await moveCursorToLocator(page, collectionTrigger, 90);
    await collectionTrigger.click();
    await sleep(260);
  }

  const overlayPanel = page.locator('.pdx-material-select-panel, .pdx-collection-overlay').first();
  if (await overlayPanel.isVisible().catch(() => false)) {
    const overlaySearch = overlayPanel.locator('input').first();
    if (await overlaySearch.isVisible().catch(() => false)) {
      await setFormInput(page, overlaySearch, 'funcionarios');
      await sleep(260);
    }
    const overlayOpt = overlayPanel
      .locator('.pdx-material-select-option-button')
      .filter({ hasText: /funcionarios|Funcionários|Heróis/i })
      .first();
    if (await overlayOpt.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, overlayOpt, 90);
      await overlayOpt.click();
      await sleep(320);
    }
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

  // Fallback to advanced route input ONLY if no catalog resource card was resolved
  const selectedCard = rqc.locator('[data-testid="quick-connect-selected-card"]').first();
  if (!(await selectedCard.isVisible().catch(() => false))) {
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
}

async function convertWebmToMp4(webmPath, mp4Path) {
  if (FFMPEG_PATH.includes('ms-playwright')) {
    console.log(`[ffmpeg] Playwright minimal ffmpeg detected (${FFMPEG_PATH}); keeping native 1080p@30fps VP8 .webm artifact.`);
    return;
  }
  console.log(`[ffmpeg] Converting ${webmPath} -> ${mp4Path} (H.264 High Profile 1080p @ 30fps)...`);
  await new Promise((resolve) => {
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
      if (code === 0) {
        console.log(`[ffmpeg] Created ${mp4Path}`);
      } else {
        console.warn(`[ffmpeg] Skipping optional MP4 conversion (exit ${code}): ${stderr.split('\n')[0]}`);
      }
      resolve();
    });
  });
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

    console.log('0. Pre-warming /rh/funcionarios and /crud-studio in a non-recorded context to populate proxy memory cache (<10ms responses)...');
    const warmContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const warmPage = await warmContext.newPage();
    // Fetch /all directly so cachedBaseFuncionariosRows is populated in the local proxy
    await warmPage.goto(`${BASE_URL}/crud-studio`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await warmPage.locator('[data-testid="toggle-customization-btn"]').waitFor({ state: 'visible', timeout: 15000 });
    await warmPage.evaluate(async () => {
      try {
        await Promise.all([
          fetch('/api/human-resources/funcionarios/all'),
          fetch('/api/human-resources/funcionarios/capabilities').catch(() => null),
          fetch('/api/human-resources/cargos/options/filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          }).catch(() => null),
          fetch('/api/human-resources/departamentos/options/filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          }).catch(() => null),
          fetch('/schemas/filtered?path=/api/human-resources/funcionarios/all&operation=get&schemaType=response').catch(() => null),
          fetch('/schemas/filtered?path=/api/human-resources/funcionarios/filter&operation=post&schemaType=request').catch(() => null),
          fetch('/schemas/filtered?path=/api/human-resources/funcionarios&operation=post&schemaType=request').catch(() => null),
          fetch('/schemas/filtered?path=/api/human-resources/funcionarios/{id}&operation=put&schemaType=request').catch(() => null),
          fetch('/schemas/filtered?path=/api/human-resources/funcionarios/{id}&operation=get&schemaType=response').catch(() => null)
        ]);
      } catch {
        // ignore pre-warm errors
      }
    });
    // Also visit /rh/funcionarios briefly to ensure all Angular lazy chunks & table/form bundles are warm
    await warmPage.goto(`${BASE_URL}/rh/funcionarios`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await warmPage.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    await sleep(400);
    await warmContext.close();

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });

    await context.addInitScript(() => {
      // Force Aurora theme ('light-tech') across initial load and F5 reloads
      try {
        localStorage.setItem('praxis_hero_hq_theme', 'light-tech');
        document.documentElement.dataset.theme = 'light-tech';
        document.documentElement.classList.remove('dark');
      } catch {}

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
          #praxis-demo-hud {
            position: fixed;
            bottom: 8px;
            left: 24px;
            transform: none;
            z-index: 2147483645;
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 560px;
            max-width: 780px;
            padding: 7px 15px 6px;
            border-radius: 13px;
            background: rgba(255, 255, 255, 0.96);
            border: 1.5px solid rgba(2, 132, 199, 0.42);
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(255, 255, 255, 0.85) inset;
            color: #0f172a;
            font-family: Inter, system-ui, sans-serif;
            pointer-events: none;
            transition: all 0.25s ease;
          }
          #praxis-demo-hud .praxis-demo-row {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          #praxis-demo-hud .praxis-demo-badge {
            background: linear-gradient(135deg, #0284c7, #0d9488);
            color: #ffffff;
            font-weight: 800;
            font-size: 10.5px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            padding: 3.5px 9px;
            border-radius: 7px;
            white-space: nowrap;
          }
          #praxis-demo-hud .praxis-demo-title {
            font-weight: 800;
            font-size: 13px;
            color: #0f172a;
            white-space: nowrap;
          }
          #praxis-demo-hud .praxis-demo-detail {
            font-size: 11.5px;
            color: #475569;
            border-left: 1.5px solid rgba(148, 163, 184, 0.45);
            padding-left: 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          #praxis-demo-hud .praxis-demo-timer {
            margin-left: auto;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11.5px;
            font-weight: 700;
            color: #0369a1;
            background: rgba(2, 132, 199, 0.1);
            border: 1px solid rgba(2, 132, 199, 0.28);
            padding: 2.5px 8px;
            border-radius: 6px;
            white-space: nowrap;
          }
          #praxis-demo-hud .praxis-demo-progress-track {
            width: 100%;
            height: 3.5px;
            background: rgba(148, 163, 184, 0.22);
            border-radius: 999px;
            overflow: hidden;
          }
          #praxis-demo-hud .praxis-demo-progress-fill {
            width: 10%;
            height: 100%;
            background: linear-gradient(90deg, #0284c7, #0d9488, #10b981);
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

        const hud = document.createElement('div');
        hud.id = 'praxis-demo-hud';
        hud.innerHTML = `
          <div class="praxis-demo-row">
            <span class="praxis-demo-badge">ETAPA 1/8 · TEMA AURORA & PÁGINA VAZIA</span>
            <span class="praxis-demo-title">Estúdio CRUD (/crud-studio)</span>
            <span class="praxis-demo-detail">Autoria Progressiva Zero-Code & Zero-Deploy · Full HD 1080p @ 30 FPS</span>
            <span class="praxis-demo-timer" id="praxis-demo-timer">⏱ 00:00</span>
          </div>
          <div class="praxis-demo-progress-track">
            <div class="praxis-demo-progress-fill"></div>
          </div>
        `;
        topLayer.appendChild(hud);

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

        const observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            for (const node of m.addedNodes) {
              if (
                node &&
                node.nodeType === 1 &&
                (node.classList?.contains('cdk-overlay-popover') ||
                  node.classList?.contains('cdk-overlay-pane') ||
                  node.querySelector?.('.cdk-overlay-popover, .cdk-overlay-pane, mat-dialog-container, praxis-settings-panel'))
              ) {
                setTimeout(promoteTopLayer, 15);
                setTimeout(promoteTopLayer, 120);
                break;
              }
            }
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });

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
          promoteTopLayer();
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
        document.addEventListener('DOMContentLoaded', installDemoOverlay);
      } else {
        installDemoOverlay();
      }
    });

    const page = await context.newPage();

    console.log('1. Navigating to /crud-studio in Aurora theme (100% blank CRUD page)...');
    await page.goto(`${BASE_URL}/crud-studio`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('[data-testid="toggle-customization-btn"]').waitFor({ state: 'visible', timeout: 15000 });
    await page.evaluate(() => sessionStorage.setItem('__praxis_crud_demo_t0', String(Date.now())));

    await setDemoStage(
      page,
      1,
      8,
      'ETAPA 1/8 · TEMA AURORA & PÁGINA EM BRANCO',
      'Estúdio CRUD (/crud-studio) — Zero Código & Zero Metadados Iniciais',
      'Demonstrando seletor de Tema Aurora, ampliando o canvas e ativando modo de autoria'
    );

    const videoFile = path.join(ARTIFACT_DIR, 'praxis-crud-studio-zero-deploy-demo.webm');
    const mp4File = path.join(ARTIFACT_DIR, 'praxis-crud-studio-zero-deploy-demo.mp4');
    const recorder = new HighFidelityVideoRecorder(page, videoFile, { width: 1920, height: 1080, fps: 30 });
    await recorder.start();

    await sleep(600);
    await recorder.captureSyncKeyframe();

    // Explicitly showcase selecting the Aurora theme from the workspace Appearance menu
    const appearanceBtn = page.locator('button[title="Aparência do workspace"], button[aria-label*="Aparência"]').first();
    if (await appearanceBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, appearanceBtn, 95);
      await appearanceBtn.click();
      await sleep(320);
      const auroraOption = page.locator('.cdk-overlay-container [role="menuitemradio"]').filter({ hasText: /Aurora/i }).first();
      if (await auroraOption.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, auroraOption, 90);
        await auroraOption.click();
        await sleep(350);
      } else {
        await page.keyboard.press('Escape');
      }
    }

    // Collapse the left navigation sidebar so the CRUD page & expanded editors get maximum horizontal canvas
    await collapseSidebarIfExpanded(page);
    await sleep(350);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-blank-crud-studio.png') });

    // Enable Customization Mode
    const toggleCustomBtn = page.locator('[data-testid="toggle-customization-btn"]');
    await moveCursorToLocator(page, toggleCustomBtn, 110);
    await toggleCustomBtn.click();
    await sleep(500);
    await recorder.captureSyncKeyframe();

    // Click "Configurar metadados" on Empty State card
    const configPageBtn = page
      .locator('praxis-crud praxis-empty-state-card button, [data-testid="resource-page-configure-btn"]')
      .first();
    await configPageBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, configPageBtn, 110);
    await configPageBtn.click();

    const crudEditor = page.locator('[data-testid="crud-metadata-editor"]');
    await crudEditor.waitFor({ state: 'visible', timeout: 10000 });
    await sleep(350);

    // Expand the CRUD Metadata Editor so all tabs and controls are shown in full width
    await expandActiveSettingsPanel(page);
    await recorder.captureSyncKeyframe();

    // =========================================================================
    // STAGE 2: Quick Win First — Connect Resource, Set Executive Header & Materialize Zero-Config Table Immediately!
    // =========================================================================
    console.log('2. Connecting to human-resources/funcionarios and materializing the Zero-Config live table immediately...');
    await setDemoStage(
      page,
      2,
      8,
      'ETAPA 2/8 · CONEXÃO RÁPIDA & TABELA ZERO-CONFIG',
      'Quick Connect RESTful + Cabeçalho Executivo → Materialização Imediata da Grade',
      'Conectando ao recurso human-resources/funcionarios: colunas e formatos nascem prontos do DTO'
    );

    await connectResourceInCrudEditor(page, 'human-resources/funcionarios');
    await setFormInput(page, '[data-testid="crud-editor-resource-idField"]', 'id');

    // Configure Executive Page Header directly inside the Connection tab
    await setFormInput(page, '[data-testid="crud-editor-page-title"]', 'Comando de Efetivo Operacional');
    await setFormInput(
      page,
      '[data-testid="crud-editor-page-subtitle"]',
      'Gestão integrada de agentes, prontidão tática, credenciais S.H.I.E.L.D. e subsídios em tempo real.'
    );
    await setFormInput(page, '[data-testid="crud-editor-page-domain-label"]', 'HUMAN RESOURCES • ZERO-CODE STUDIO');
    await sleep(400);

    // Wait briefly for schema columns to resolve in background
    for (let i = 0; i < 30; i++) {
      const tableText = await page.locator('[data-testid="crud-editor-overview-table"]').innerText().catch(() => '');
      if (tableText && !tableText.startsWith('0 ')) break;
      await sleep(150);
    }
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02a-crud-connection-maximized.png') });

    // Briefly open the full-width Resource Lookup Picker via "Trocar recurso" to capture the open lookup evidence
    const changeResourceBtn = page.locator('[data-testid="quick-connect-change-resource-btn"]').first();
    if (await changeResourceBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, changeResourceBtn, 80);
      await changeResourceBtn.click();
      await sleep(280);
      await recorder.captureSyncKeyframe();
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '02a-crud-connection-lookup-open.png') });
      await changeResourceBtn.click();
      await sleep(220);
    }

    // SAVE & CLOSE IMMEDIATELY so the viewer sees the Zero-Config populated table in seconds!
    await saveAndCloseSettingsPanel(page, 'crud-metadata-editor-initial-connect');
    await page.locator('.praxis-resource-page__header').first().waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first().waitFor({ state: 'visible', timeout: 20000 });
    await setDemoStage(
      page,
      2,
      8,
      'ETAPA 2/8 · TABELA ZERO-CONFIG EM SEGUNDOS!',
      'Grade Viva Derivada 100% do DTO (Código #194, Foto Avatar, Datas e Status)',
      'Sem configurar colunas manualmente: Foto circular, Código inteiro (#194), Datas (dd/MM/yyyy) e Status'
    );
    await sleep(1200);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02b-crud-live-table-first-materialization.png') });

    // =========================================================================
    // STAGE 3: Re-open Expanded Editor -> Curate Columns, Reveal LGPD Salary (already BRL!) & Status Chip
    // =========================================================================
    console.log('3. Re-opening expanded editor to curate Executive Columns and reveal governed BRL Salary column...');
    await setDemoStage(
      page,
      3,
      8,
      'ETAPA 3/8 · CURADORIA DE COLUNAS & GOVERNANÇA',
      'Editor de Colunas Expandido — Exibindo Subsídio Mensal (R$ do DTO) e Chip de Prontidão',
      'A coluna Salário (oculta por padrão via LGPD) já traz formatação BRL automática do backend'
    );

    const reopenCrudEditorBtn = page.locator('[data-testid="resource-page-configure-btn"]').first();
    await reopenCrudEditorBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, reopenCrudEditorBtn, 100);
    await reopenCrudEditorBtn.click();
    await crudEditor.waitFor({ state: 'visible', timeout: 10000 });
    await sleep(320);
    await expandActiveSettingsPanel(page);

    const tabTable = page.locator('[data-testid="crud-editor-tab-table"]');
    await moveCursorToLocator(page, tabTable, 95);
    await tabTable.click();
    await sleep(400);

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
      await moveCursorToLocator(page, focusColumnsBtn, 95);
      await focusColumnsBtn.click();
      await sleep(450);
    } else {
      const colsPanelHeader = page.locator('[data-testid="table-inline-editor-columns-panel"] mat-expansion-panel-header');
      await moveCursorToLocator(page, colsPanelHeader, 95);
      await colsPanelHeader.click();
      await sleep(450);
    }

    const colsEditor = page.locator('columns-config-editor');
    await colsEditor.waitFor({ state: 'visible', timeout: 10000 });

    const customizeColumnByField = async (fieldName, { header, width, align, dataType, currencyCode, composePreset }) => {
      const colItem = colsEditor
        .locator('.column-item')
        .filter({ has: page.locator('.column-field', { hasText: new RegExp(`^${fieldName}$`) }) })
        .first();
      if ((await colItem.count()) === 0) return false;

      await colItem.evaluate((el) => el.scrollIntoView({ block: 'nearest' })).catch(() => {});

      const visCheckboxInput = colItem.locator('mat-checkbox.visibility-checkbox input[type="checkbox"]').first();
      if ((await visCheckboxInput.count()) > 0 && !(await visCheckboxInput.isChecked().catch(() => true))) {
        const checkboxTarget = colItem.locator('mat-checkbox.visibility-checkbox').first();
        await moveCursorToLocator(page, checkboxTarget, 65);
        await checkboxTarget.click();
        await sleep(150);
      }

      await moveCursorToLocator(page, colItem, 75);
      await colItem.click();
      await sleep(200);

      if (header) {
        await setFormInput(page, colsEditor.locator('input[name="header"]'), header);
      }
      if (width) {
        await setFormInput(page, colsEditor.locator('input[name="width"]'), width);
      }
      if (align) {
        const alignToggle = colsEditor.locator(`mat-button-toggle-group[name="align"] mat-button-toggle[value="${align}"] button`);
        if (await alignToggle.isVisible().catch(() => false)) {
          await moveCursorToLocator(page, alignToggle, 65);
          await alignToggle.click();
          await sleep(150);
        }
      }
      if (dataType) {
        const dtSelect = colsEditor.locator('mat-select[name="dataType"]');
        if (await dtSelect.isVisible().catch(() => false)) {
          await selectMatOption(page, dtSelect, (txt, val) => val === dataType || /moeda|currency/i.test(txt) || txt.toLowerCase().includes(dataType));
        }
      }
      if (currencyCode) {
        const formatterPanel = colsEditor.locator('mat-expansion-panel').filter({ hasText: /Formata|Display formatting/i }).first();
        if (await formatterPanel.isVisible().catch(() => false)) {
          const isExpanded = await formatterPanel.evaluate((el) => el.classList.contains('mat-expanded'));
          if (!isExpanded) {
            const fHeader = formatterPanel.locator('mat-expansion-panel-header');
            await moveCursorToLocator(page, fHeader, 75);
            await fHeader.click();
            await sleep(240);
          }
          const currencySelect = formatterPanel.locator('mat-select').first();
          if (await currencySelect.isVisible().catch(() => false)) {
            await selectMatOption(page, currencySelect, (txt, val) => val === currencyCode || /BRL|Real Brasileiro/i.test(txt));
            await sleep(200);
          }
        }
      }
      if (composePreset) {
        const rendererPanel = colsEditor.locator('mat-expansion-panel').filter({ hasText: /Renderiza|Cell rendering|photo_filter/i }).first();
        if (await rendererPanel.isVisible().catch(() => false)) {
          const isExpanded = await rendererPanel.evaluate((el) => el.classList.contains('mat-expanded'));
          if (!isExpanded) {
            const rHeader = rendererPanel.locator('mat-expansion-panel-header');
            await moveCursorToLocator(page, rHeader, 75);
            await rHeader.click();
            await sleep(250);
          }
          const presetBtn = rendererPanel.locator('.compose-preset-actions button').filter({ hasText: composePreset }).first();
          if (await presetBtn.isVisible().catch(() => false)) {
            await moveCursorToLocator(page, presetBtn, 80);
            await presetBtn.click();
            await sleep(240);
          }
        }
      }
      return true;
    };

    // Keep 'id' (#194) and 'avatarUrl' (Foto circular avatar) from DTO, curate headers/widths,
    // and reveal 'salario' (which already brings type='currency' and format='BRL|symbol|2' from FuncionarioDTO!)
    await customizeColumnByField('id', {
      header: 'Cód.',
      width: '105px'
    });
    await customizeColumnByField('avatarUrl', {
      header: 'Foto',
      width: '92px'
    });
    await customizeColumnByField('nomeCompleto', {
      header: 'Herói / Nome Completo',
      width: '230px'
    });
    await customizeColumnByField('codinome', {
      header: 'Codinome Tático',
      width: '160px'
    });
    await customizeColumnByField('cargoNome', {
      header: 'Patente & Especialidade',
      width: '220px'
    });
    await customizeColumnByField('departamentoNome', {
      header: 'Divisão Operacional',
      width: '215px'
    });
    await customizeColumnByField('dataAdmissao', {
      header: 'Admissão',
      width: '125px'
    });
    await customizeColumnByField('salario', {
      header: 'Subsídio Mensal',
      width: '165px',
      align: 'right'
    });
    await customizeColumnByField('ativo', {
      header: 'Prontidão',
      width: '130px',
      align: 'center',
      composePreset: /Chip de status|Status chip/i
    });

    // Hide auxiliary contact/FK columns so the executive table fits 100% cleanly in 1080p alongside Código (#194) and Foto (Avatar)
    const columnsToHide = ['estadoCivil', 'cpf', 'telefone', 'email', 'dataNascimento', 'cargoId', 'departamentoId'];
    for (const hideField of columnsToHide) {
      const colItem = colsEditor
        .locator('.column-item')
        .filter({ has: page.locator('.column-field', { hasText: new RegExp(`^${hideField}$`, 'i') }) })
        .first();
      if ((await colItem.count()) > 0) {
        const visCheckbox = colItem.locator('mat-checkbox.visibility-checkbox input[type="checkbox"]').first();
        if ((await visCheckbox.count()) > 0 && (await visCheckbox.isChecked().catch(() => false))) {
          await colItem.evaluate((el) => el.scrollIntoView({ block: 'nearest' })).catch(() => {});
          const checkboxTarget = colItem.locator('mat-checkbox.visibility-checkbox').first();
          await moveCursorToLocator(page, checkboxTarget, 55);
          await checkboxTarget.click();
          await sleep(110);
        }
      }
    }

    await sleep(450);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-crud-table-columns-authored.png') });

    // Save & close so the viewer immediately sees the curated Corporate Table with #194, Avatar, Admissão, R$ and Status Chips!
    await saveAndCloseSettingsPanel(page, 'crud-table-columns-refined');
    await page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first().waitFor({ state: 'visible', timeout: 20000 });
    await sleep(950);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05b-crud-table-refined-live.png') });

    // =========================================================================
    // STAGE 4: Add Live Telemetry KPI Band (/stats/group-by), ScopeBar & Modal/Form Actions
    // =========================================================================
    console.log('4. Re-opening expanded editor to author KPI Band, Filter Bar (ScopeBar), Modal Opening and Form Actions...');
    await setDemoStage(
      page,
      4,
      8,
      'ETAPA 4/8 · KPIs, SCOPEBAR & ABERTURA MODAL',
      'Telemetria Viva (/stats/group-by) + Quick Filter Chips + Abertura Modal Maximizada',
      'Configurando 4 cards executivos de KPI, filtros rápidos e vínculo com o Dossiê Modal'
    );

    await moveCursorToLocator(page, reopenCrudEditorBtn, 95);
    await reopenCrudEditorBtn.click();
    await crudEditor.waitFor({ state: 'visible', timeout: 10000 });
    await sleep(320);
    await expandActiveSettingsPanel(page);

    // Switch to Tab: Opening / Defaults (configure Modal Maximized)
    const tabDefaults = page.locator('[data-testid="crud-editor-tab-defaults"]');
    await moveCursorToLocator(page, tabDefaults, 90);
    await tabDefaults.click();
    await sleep(350);

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
    await setSlideToggle(page, '[data-testid="crud-editor-modal-startMaximized"]', true);
    await setSlideToggle(page, '[data-testid="crud-editor-modal-rememberLastState"]', true);
    await setSlideToggle(page, '[data-testid="crud-editor-back-confirmOnDirty"]', true);
    await sleep(300);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-crud-resource-and-opening.png') });

    // Switch to Tab: Actions — bind create, view, and edit to 'studio-funcionarios-form'
    const tabActions = page.locator('[data-testid="crud-editor-tab-actions"]');
    await moveCursorToLocator(page, tabActions, 90);
    await tabActions.click();
    await sleep(350);
    for (const actionKey of ['create', 'view', 'edit']) {
      const panel = page.locator(`[data-testid="crud-editor-action-${actionKey}-panel"]`).first();
      const header = page.locator(`[data-testid="crud-editor-action-${actionKey}-panel-header"]`).first();
      if (await panel.isVisible().catch(() => false)) {
        const isExpanded = await panel.evaluate((el) => el.classList.contains('mat-expanded')).catch(() => false);
        if (!isExpanded && (await header.isVisible().catch(() => false))) {
          await moveCursorToLocator(page, header, 75);
          await header.click();
          await sleep(220);
        }
      }
      const formIdInput = page.locator(`[data-testid="crud-editor-action-${actionKey}-formId"]`).first();
      await formIdInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      if (await formIdInput.isVisible().catch(() => false)) {
        await setFormInput(page, formIdInput, 'studio-funcionarios-form', { pauseMs: 55 });
        await sleep(180);
      }
    }
    await sleep(300);
    await recorder.captureSyncKeyframe();

    const tabKpis = page.locator('[data-testid="crud-editor-tab-kpis"]');
    await moveCursorToLocator(page, tabKpis, 95);
    await tabKpis.click();
    await sleep(380);

    await setSlideToggle(page, '[data-testid="crud-kpi-band-enabled"]', true);

    const autoConnectKpiBtn = page.locator('[data-testid="crud-kpi-band-autoconnect-btn"]');
    if (await autoConnectKpiBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, autoConnectKpiBtn, 85);
      await autoConnectKpiBtn.click();
      await sleep(240);
    }
    await setFormInput(page, '[data-testid="crud-kpi-band-groupby-field"]', 'ativo');

    const kpiDefinitions = [
      {
        label: 'Efetivo Tático Total',
        value: '0',
        valueExpr: '${totalCount} | number',
        caption: 'Clique para exibir todo o efetivo (Limpar filtro)',
        captionExpr: 'Quadro total: ${totalCount | number} heróis · Limpar filtro',
        icon: 'groups',
        variantMatch: /Primário|Primary/i,
        filterMode: 'clear',
        filterModeMatch: /Limpar filtros|Exibir todos|clear/i
      },
      {
        label: 'Prontidão Ativa',
        value: '0',
        valueExpr: '${byKey.true} | default:0 | number',
        caption: 'Clique para filtrar heróis ativos em campo',
        captionExpr: '${((byKey.true / totalCount) * 100) | round:1}% em exercício · Filtrar ativos',
        icon: 'verified_user',
        variantMatch: /Sucesso|Success/i,
        filterMode: 'condition',
        filterModeMatch: /Aplicar critério|condition/i,
        filterField: 'ativo',
        filterValue: 'true'
      },
      {
        label: 'Reserva / Inativos',
        value: '0',
        valueExpr: '${byKey.false} | default:0 | number',
        caption: 'Clique para filtrar agentes fora de escala',
        captionExpr: 'Agentes fora de escala · Filtrar reserva',
        icon: 'person_off',
        variantMatch: /Atenção|Warning/i,
        filterMode: 'condition',
        filterModeMatch: /Aplicar critério|condition/i,
        filterField: 'ativo',
        filterValue: 'false'
      },
      {
        label: 'Taxa de Prontidão HQ',
        value: '0%',
        valueExpr: '${((byKey.true / totalCount) * 100) | round:1}%',
        caption: 'Índice global de eficiência operacional',
        captionExpr: '${byKey.true | default:0} de ${totalCount | default:0} operadores mobilizáveis',
        icon: 'military_tech',
        variantMatch: /Primário|Primary/i,
        filterMode: 'none',
        filterModeMatch: /Apenas informativo|sem filtro|none/i
      }
    ];

    const addKpiBtn = page.locator('[data-testid="crud-kpi-add-card-btn"]');
    for (let i = 0; i < kpiDefinitions.length; i++) {
      const def = kpiDefinitions[i];
      await moveCursorToLocator(page, addKpiBtn, 75);
      await addKpiBtn.click();
      await sleep(200);

      await setFormInput(page, `[data-testid="crud-kpi-card-label-${i}"]`, def.label);
      await setFormInput(page, `[data-testid="crud-kpi-card-value-${i}"]`, def.value);
      await setFormInput(page, `[data-testid="crud-kpi-card-value-expr-${i}"]`, def.valueExpr);
      await setFormInput(page, `[data-testid="crud-kpi-card-caption-${i}"]`, def.caption);
      await setFormInput(page, `[data-testid="crud-kpi-card-caption-expr-${i}"]`, def.captionExpr);
      await setFormInput(page, `[data-testid="crud-kpi-card-icon-${i}"]`, def.icon);
      await selectMatOption(
        page,
        page.locator(`[data-testid="crud-kpi-card-variant-${i}"]`),
        (txt) => def.variantMatch.test(txt)
      );
      await selectMatOption(
        page,
        page.locator(`[data-testid="crud-kpi-card-filter-mode-${i}"]`),
        (txt) => def.filterModeMatch.test(txt)
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
    await sleep(550);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-crud-kpi-band-authored.png') });

    // Switch to Tab: Filters (Inline Fields + Quick Filter Chips)
    const tabFilters = page.locator('[data-testid="crud-editor-tab-filters"]');
    await moveCursorToLocator(page, tabFilters, 95);
    await tabFilters.click();
    await sleep(380);

    await setSlideToggle(page, '[data-testid="crud-filterbar-show-advanced"]', true);

    for (const inlineField of ['nomeCompleto', 'cargoNome', 'email']) {
      const suggestionBtn = page.locator(`[data-testid="crud-filterbar-available-field-${inlineField}"]`);
      if (await suggestionBtn.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, suggestionBtn, 75);
        await suggestionBtn.click();
        await sleep(170);
      } else {
        await setFormInput(page, '[data-testid="crud-filterbar-inline-field-input"]', inlineField);
        const addFieldBtn = page.locator('[data-testid="crud-filterbar-inline-field-add-btn"]');
        await moveCursorToLocator(page, addFieldBtn, 65);
        await addFieldBtn.click();
        await sleep(170);
      }
    }

    await selectMatOption(
      page,
      page.locator('[data-testid="crud-filterbar-quick-mode"]'),
      (txt, val) => val === 'custom' || txt.toLowerCase().includes('personaliz') || txt.toLowerCase().includes('custom')
    );

    const quickFilters = [
      { id: 'qf-all', label: 'Todos os Agentes', icon: 'groups', mode: 'clear', modeMatch: /Todos|limpar filtro|Limpar filtros|Exibir todos|clear/i },
      { id: 'qf-active', label: 'Ativos em Prontidão', icon: 'bolt', mode: 'fieldEquals', modeMatch: /Campo igual|Igualdade|fieldEquals/i, field: 'ativo', value: 'true' },
      { id: 'qf-reserve', label: 'Reserva Tática', icon: 'shield', mode: 'fieldEquals', modeMatch: /Campo igual|Igualdade|fieldEquals/i, field: 'ativo', value: 'false' }
    ];

    const addQuickBtn = page.locator('[data-testid="crud-filterbar-add-quick-btn"]');
    for (let i = 0; i < quickFilters.length; i++) {
      const qf = quickFilters[i];
      await moveCursorToLocator(page, addQuickBtn, 75);
      await addQuickBtn.click();
      await sleep(200);

      await setFormInput(page, `[data-testid="crud-filterbar-quick-id-${i}"]`, qf.id);
      await setFormInput(page, `[data-testid="crud-filterbar-quick-label-${i}"]`, qf.label);
      await setFormInput(page, `[data-testid="crud-filterbar-quick-icon-${i}"]`, qf.icon);
      await selectMatOption(
        page,
        page.locator(`[data-testid="crud-filterbar-quick-condition-mode-${i}"]`),
        (txt) => qf.modeMatch.test(txt)
      );

      if (qf.mode === 'fieldEquals') {
        await setFormInput(page, `[data-testid="crud-filterbar-quick-field-${i}"]`, qf.field);
        await setFormInput(page, `[data-testid="crud-filterbar-quick-value-${i}"]`, qf.value);
      }
    }

    await sleep(450);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-crud-filterbar-authored.png') });

    // Save & close CRUD Metadata Editor to materialize KPI Band + ScopeBar above the refined Table!
    await saveAndCloseSettingsPanel(page, 'crud-metadata-editor-kpis-and-filters');

    console.log('   Waiting for live CRUD page to render Header, KPI Band, ScopeBar, and Table rows...');
    await page.locator('praxis-crud praxis-kpi-band .praxis-kpi-card').first().waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first().waitFor({ state: 'visible', timeout: 20000 });
    await page
      .locator('praxis-crud praxis-table tbody tr.mat-mdc-row')
      .first()
      .locator('td.praxis-actions-cell button[aria-label*="Editar"]:not([disabled]), td.praxis-actions-cell button[aria-label*="Edit"]:not([disabled])')
      .first()
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => {});
    await sleep(750);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06-crud-page-materialized.png') });

    // =========================================================================
    // STAGE 5: Customize the Dynamic Form Layout Inside the CRUD Modal (Expanded Flat-Section Editor + Layout Scope)
    // =========================================================================
    console.log('5. Opening CRUD form in Modal and customizing Form Layout in Expanded Flat-Section Editor...');
    await setDemoStage(
      page,
      5,
      8,
      'ETAPA 5/8 · EDITOR DE FORMULÁRIO EXPANDIDO',
      'Flat Sections + Escopo Compartilhado entre Modos + 3 Seções em 2 Colunas (6/6)',
      'Configurando escopo compartilhado (Criar, Editar e Visualizar) e layout em 2 colunas'
    );

    const firstRow = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first();
    await firstRow.waitFor({ state: 'visible', timeout: 15000 });
    await moveCursorToLocator(page, firstRow, 85);

    const editRowBtn = firstRow
      .locator('td.praxis-actions-cell button.praxis-icon-btn:not([disabled])')
      .nth(1);
    await editRowBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, editRowBtn, 90);
    await editRowBtn.click();

    const formDialog = page.locator('mat-dialog-container praxis-dynamic-form').first();
    await formDialog.waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('mat-dialog-container praxis-dynamic-form form.praxis-dynamic-form').first().waitFor({ state: 'visible', timeout: 15000 });
    await sleep(450);
    await recorder.captureSyncKeyframe();

    const customizeFormBtn = formDialog
      .locator('button.config-button, button[aria-label*="Configurar formulário"], button.customize-btn')
      .first();
    await customizeFormBtn.waitFor({ state: 'visible', timeout: 15000 });
    await moveCursorToLocator(page, customizeFormBtn, 100);
    await customizeFormBtn.click();

    const formConfigEditor = page.locator('praxis-dynamic-form-config-editor');
    await formConfigEditor.waitFor({ state: 'visible', timeout: 10000 });
    await sleep(350);

    // Expand the Form Config Editor Settings Panel to showcase all tabs & controls in wide view
    await expandActiveSettingsPanel(page);
    await recorder.captureSyncKeyframe();

    // Switch to the "Layout" tab in PraxisDynamicFormConfigEditor
    const layoutTab = formConfigEditor.locator('.mat-mdc-tab').filter({ hasText: /Layout/i }).first();
    await moveCursorToLocator(page, layoutTab, 95);
    await layoutTab.click();
    await sleep(400);

    // Highlight the new Layout Scope Control ("Compartilhar entre Criar, Editar e Visualizar" vs "Somente neste modo")
    const layoutScopeToggle = formConfigEditor.locator('[data-testid="layout-scope-toggle"]').first();
    if (await layoutScopeToggle.isVisible().catch(() => false)) {
      const modeOnlyToggleBtn = layoutScopeToggle.locator('mat-button-toggle[value="mode-only"] button').first();
      const sharedToggleBtn = layoutScopeToggle.locator('mat-button-toggle[value="shared"] button').first();
      if (await modeOnlyToggleBtn.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, modeOnlyToggleBtn, 95);
        await modeOnlyToggleBtn.click();
        await sleep(450);
        await recorder.captureSyncKeyframe();
      }
      if (await sharedToggleBtn.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, sharedToggleBtn, 95);
        await sharedToggleBtn.click();
        await sleep(450);
        await recorder.captureSyncKeyframe();
      }
    }

    const layoutEditor = formConfigEditor.locator('praxis-layout-editor');
    await layoutEditor.waitFor({ state: 'visible', timeout: 10000 });

    const collapsePaletteBtn = layoutEditor.locator('button.collapse-toggle[aria-label*="Colapsar"]').first();
    if (await collapsePaletteBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, collapsePaletteBtn, 70);
      await collapsePaletteBtn.click();
      await sleep(200);
    }

    const sectionTitles = [
      '1. Dossiê Tático & Canais S.H.I.E.L.D.',
      '2. Identificação Civil & Credenciais Operacionais',
      '3. Lotação, Patente & Subsídio Tático'
    ];

    for (let secIdx = 0; secIdx < sectionTitles.length; secIdx++) {
      const sectionCard = layoutEditor.locator('praxis-section-configurator').nth(secIdx);
      if ((await sectionCard.count()) === 0) continue;

      await sectionCard.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' })).catch(() => {});
      await sleep(200);

      const renameTrigger = sectionCard.locator('[data-testid="section-rename-trigger"]').first();
      if (await renameTrigger.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, renameTrigger, 75);
        await renameTrigger.click();
        await sleep(170);
        const renameInput = sectionCard.locator('[data-testid="section-rename-input"]').first();
        if (await renameInput.isVisible().catch(() => false)) {
          await renameInput.fill(sectionTitles[secIdx]);
          await renameInput.press('Enter');
          await sleep(220);
        }
      }

      const directPreset2Col = sectionCard.locator('[data-testid="layout-preset-2col"]').first();
      if (await directPreset2Col.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, directPreset2Col, 75);
        await directPreset2Col.click();
        await sleep(240);
      } else {
        const sectionMenuBtn = sectionCard.locator('button.section-menu-btn').first();
        if (await sectionMenuBtn.isVisible().catch(() => false)) {
          await moveCursorToLocator(page, sectionMenuBtn, 75);
          await sectionMenuBtn.click();
          await sleep(200);
          const presetsMenuItem = page
            .locator('.cdk-overlay-container [role="menuitem"]')
            .filter({ hasText: /Presets de se/i })
            .first();
          if (await presetsMenuItem.isVisible().catch(() => false)) {
            await moveCursorToLocator(page, presetsMenuItem, 75);
            await presetsMenuItem.click();
            await sleep(240);
            const twoColSectionPreset = page
              .locator('praxis-section-preset-picker button.preset-btn')
              .filter({ hasText: /Duas Colunas 1\/1|2 colunas/i })
              .first();
            if (await twoColSectionPreset.isVisible().catch(() => false)) {
              await moveCursorToLocator(page, twoColSectionPreset, 75);
              await twoColSectionPreset.click();
              await sleep(260);
            } else {
              await page.keyboard.press('Escape');
            }
          } else {
            await page.keyboard.press('Escape');
          }
        }
      }
    }

    // Scroll back to top of layout editor to showcase the flat sections and layout scope banner
    await page.evaluate(() => {
      document
        .querySelectorAll('.settings-panel-body, .mat-mdc-tab-body-content, .layout-editor-container')
        .forEach((sc) => {
          sc.scrollTop = 0;
        });
      const scopeCard = document.querySelector('praxis-dynamic-form-config-editor .scope-card');
      if (scopeCard) {
        scopeCard.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
    await sleep(600);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07-crud-form-layout-editor.png') });

    // Save & close the Form Config Editor Settings Panel
    await saveAndCloseSettingsPanel(page, 'dynamic-form-config-editor');
    await formConfigEditor.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.locator('mat-dialog-container praxis-dynamic-form form.praxis-dynamic-form').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    await sleep(750);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08-crud-form-customized.png') });

    // Close the Edit Form Modal
    const closeFormDialogBtn = page
      .locator('mat-dialog-container [data-testid="crud-dialog-close-btn"], mat-dialog-container button[aria-label*="Fechar"], mat-dialog-container button[aria-label*="Close"], mat-dialog-container button[mat-dialog-close]')
      .first();
    if (await closeFormDialogBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, closeFormDialogBtn, 85);
      await closeFormDialogBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await sleep(500);
    await dismissStrayBackdrops(page);

    // =========================================================================
    // STAGE 6: Full CRUD Runtime Lifecycle (KPI Filter, Quick Chips, View, Create, Edit, Delete)
    // =========================================================================
    console.log('6. Exiting Customization Mode and demonstrating full CRUD Runtime Lifecycle...');
    await setDemoStage(
      page,
      6,
      8,
      'ETAPA 6/8 · OPERAÇÃO EM RUNTIME',
      'Filtros via KPI, Quick Chips, Visualização, Criação, Edição e Exclusão',
      'Testando a página pronta em modo operacional (Visualizar e Criar herdam o layout em 2 colunas)'
    );

    await moveCursorToLocator(page, toggleCustomBtn, 100);
    await toggleCustomBtn.click({ force: true, timeout: 10000 }).catch(() => {});
    await sleep(550);
    await recorder.captureSyncKeyframe();

    // 6.1 Click KPI Card #2 ("Prontidão Ativa") to filter table reactively
    const kpiCardActive = page.locator('praxis-crud praxis-kpi-band .praxis-kpi-card').nth(1);
    if (await kpiCardActive.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, kpiCardActive, 100);
      await kpiCardActive.click({ force: true, timeout: 10000 }).catch(() => {});
      await sleep(700);
      await recorder.captureSyncKeyframe();
    }

    // Click KPI Card #1 ("Efetivo Tático Total") to clear filter
    const kpiCardTotal = page.locator('praxis-crud praxis-kpi-band .praxis-kpi-card').nth(0);
    if (await kpiCardTotal.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, kpiCardTotal, 100);
      await kpiCardTotal.click({ force: true, timeout: 10000 }).catch(() => {});
      await sleep(650);
      await recorder.captureSyncKeyframe();
    }

    // 6.2 Click Quick Filter chips in ScopeBar
    const quickChipReserve = page.locator('praxis-scope-bar button, praxis-crud button, praxis-crud mat-chip-option, .quick-filter-chip').filter({ hasText: /Reserva Tática/i }).first();
    if (await quickChipReserve.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, quickChipReserve, 95);
      await quickChipReserve.click({ force: true, timeout: 10000 }).catch(() => {});
      await sleep(650);
      await recorder.captureSyncKeyframe();
    }

    const quickChipAll = page.locator('praxis-scope-bar button, praxis-crud button, praxis-crud mat-chip-option, .quick-filter-chip').filter({ hasText: /Todos os Agentes/i }).first();
    if (await quickChipAll.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, quickChipAll, 95);
      await quickChipAll.click({ force: true, timeout: 10000 }).catch(() => {});
      await sleep(650);
      await recorder.captureSyncKeyframe();
    }

    // 6.3 Trigger VIEW action on a row — opens with 2-column layout inherited via shared scope!
    console.log('   6.3 Demonstrating View (Visualizar) action with 2-column customized layout...');
    const rowForView = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first();
    await rowForView.waitFor({ state: 'visible', timeout: 10000 });
    const viewRowBtn = rowForView
      .locator('td.praxis-actions-cell button.praxis-icon-btn:not([disabled])')
      .nth(0);
    await viewRowBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, viewRowBtn, 95);
    await viewRowBtn.click();

    await page.locator('mat-dialog-container praxis-dynamic-form form.praxis-dynamic-form').first().waitFor({ state: 'visible', timeout: 15000 });
    await sleep(750);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '09-crud-runtime-view.png') });

    await page.keyboard.press('Escape');
    await sleep(450);
    await dismissStrayBackdrops(page);

    // 6.4 Trigger CREATE action from the table toolbar ("Criar") — opens with 2-column layout!
    console.log('   6.4 Demonstrating Create (Novo Registro) action with customized 2-column form layout...');
    const createToolbarBtn = page
      .locator('praxis-crud praxis-table-toolbar button:not([disabled])')
      .filter({ hasText: /Novo|Adicionar|Criar|New|Add/i })
      .first();
    if (await createToolbarBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, createToolbarBtn, 100);
      await createToolbarBtn.click();
      await page.locator('mat-dialog-container praxis-dynamic-form form.praxis-dynamic-form').first().waitFor({ state: 'visible', timeout: 15000 });
      await sleep(450);

      const firstInput = page.locator('mat-dialog-container praxis-dynamic-form input:not([disabled])').first();
      if (await firstInput.isVisible().catch(() => false)) {
        await setFormInput(page, firstInput, 'carol.danvers@shield.gov');
      }
      const secondInput = page.locator('mat-dialog-container praxis-dynamic-form input:not([disabled])').nth(1);
      if (await secondInput.isVisible().catch(() => false)) {
        await setFormInput(page, secondInput, '+55 11 99888-7766');
      }
      const thirdInput = page.locator('mat-dialog-container praxis-dynamic-form input:not([disabled])').nth(2);
      if (await thirdInput.isVisible().catch(() => false)) {
        await setFormInput(page, thirdInput, 'Carol Danvers (Capitã Marvel)');
      }
      await sleep(600);
      await recorder.captureSyncKeyframe();

      await page.keyboard.press('Escape');
      await sleep(320);
      // Ensure the Create Form Modal is completely closed before proceeding
      for (let closeAttempt = 0; closeAttempt < 4; closeAttempt++) {
        if ((await page.locator('.cdk-overlay-container mat-dialog-container').count()) === 0) break;
        const dirtyConfirmBtn = page.locator('.cdk-overlay-container mat-dialog-container button').filter({ hasText: /Sair|Confirmar|Descartar|Sim|Leave/i }).first();
        if (await dirtyConfirmBtn.isVisible().catch(() => false)) {
          await moveCursorToLocator(page, dirtyConfirmBtn, 70);
          await dirtyConfirmBtn.click({ force: true });
          await sleep(320);
          continue;
        }
        const closeModalBtn = page.locator('.cdk-overlay-container mat-dialog-container button[data-testid="crud-dialog-close-btn"], .cdk-overlay-container mat-dialog-container button[aria-label*="Fechar"], .cdk-overlay-container mat-dialog-container button[aria-label*="Close"], .cdk-overlay-container mat-dialog-container button[mat-dialog-close]').first();
        if (await closeModalBtn.isVisible().catch(() => false)) {
          await moveCursorToLocator(page, closeModalBtn, 70);
          await closeModalBtn.click({ force: true });
          await sleep(320);
          continue;
        }
        await page.keyboard.press('Escape').catch(() => {});
        await sleep(300);
      }
      await sleep(350);
      await dismissStrayBackdrops(page);
    }

    // 6.5 Trigger EDIT action on the first row showing the customized multi-column layout pre-populated
    console.log('   6.5 Demonstrating Edit (Editar) action with pre-populated customized layout...');
    const rowForEdit = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first();
    const editBtn2 = rowForEdit
      .locator('td.praxis-actions-cell button.praxis-icon-btn:not([disabled])')
      .nth(1);
    if (await editBtn2.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, editBtn2, 95);
      await editBtn2.click({ force: true });

      await page.locator('mat-dialog-container praxis-dynamic-form form.praxis-dynamic-form').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
      await sleep(700);
      await recorder.captureSyncKeyframe();
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '10-crud-runtime-edit.png') });

      await page.keyboard.press('Escape');
      await sleep(450);
      await dismissStrayBackdrops(page);
    }

    // 6.6 Trigger DELETE action to showcase the governed Confirmation Dialog
    console.log('   6.6 Demonstrating Delete (Excluir) confirmation dialog...');
    const rowForDelete = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').nth(1);
    const moreBtn = rowForDelete
      .locator('td.praxis-actions-cell button.praxis-more-btn:not([disabled]), td.praxis-actions-cell button[aria-haspopup="menu"]:not([disabled])')
      .first();
    if (await moreBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, moreBtn, 90);
      await moreBtn.click({ force: true });
      await sleep(260);
      const delItem = page.locator('.cdk-overlay-container [role="menuitem"]').filter({ hasText: /Excluir|Delete|Remover/i }).first();
      if (await delItem.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, delItem, 80);
        await delItem.click({ force: true });

        const confirmDialog = page.locator('.cdk-overlay-container mat-dialog-container').first();
        await confirmDialog.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
        await sleep(480);
        await recorder.captureSyncKeyframe();
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '11-crud-runtime-delete.png') });

        const cancelDeleteBtn = confirmDialog.locator('button').filter({ hasText: /Cancelar|Cancel|Não/i }).first();
        if (await cancelDeleteBtn.isVisible().catch(() => false)) {
          await moveCursorToLocator(page, cancelDeleteBtn, 85);
          await cancelDeleteBtn.click({ force: true });
          await sleep(400);
        } else {
          await page.keyboard.press('Escape');
          await sleep(380);
        }
      }
    }

    // =========================================================================
    // STAGE 7: F5 Reload — Prove 100% Zero-Code, Zero-Deploy Persistence
    // =========================================================================
    console.log('7. Reloading page (F5) to prove 100% persistence without code or deploy...');
    await setDemoStage(
      page,
      7,
      8,
      'ETAPA 7/8 · PROVA DE PERSISTÊNCIA (F5 RELOAD)',
      'Recarregando a Página (/crud-studio) — 100% Persistido sem Deploy',
      'Tema Aurora, Cabeçalho Executivo, KPI Band, ScopeBar, Grade R$ e Layout em 2 Colunas preservados'
    );

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('praxis-crud praxis-kpi-band .praxis-kpi-card').first().waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first().waitFor({ state: 'visible', timeout: 20000 });
    await collapseSidebarIfExpanded(page);

    await setDemoStage(
      page,
      7,
      8,
      'ETAPA 7/8 · PROVA DE PERSISTÊNCIA (F5 RELOAD)',
      'Página CRUD 100% Hidratada após F5 · Zero Código · Zero Deploy',
      'Cabeçalho executivo, filtros inline (Nome Civil, Cargo, E-mail), Subsídio Mensal (R$) e KPIs ativos'
    );
    await sleep(850);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '12-crud-after-reload-persisted.png') });

    // =========================================================================
    // STAGE 8: Final Guided Executive Tour (~25s — 4 Acts with Aurora Visual Spotlight)
    // =========================================================================
    console.log('8. Running Final Executive Tour (~25s) showcasing all constructed deliverables...');

    const setTourSpotlight = async (selector, badgeText, titleText, subtitleText) => {
      await page.evaluate(({ sel, badge, title, sub }) => {
        let styleEl = document.getElementById('praxis-tour-spotlight-style');
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'praxis-tour-spotlight-style';
          styleEl.textContent = `
            .praxis-tour-highlight {
              outline: 2.5px solid #0284c7 !important;
              outline-offset: 4px !important;
              box-shadow: 0 0 0 6px rgba(2, 132, 199, 0.16), 0 12px 32px rgba(2, 132, 199, 0.22) !important;
              border-radius: 12px !important;
              transition: outline 0.25s ease, box-shadow 0.25s ease !important;
            }
            #praxis-tour-callout {
              position: fixed;
              bottom: 74px;
              left: 68px;
              z-index: 2147483644;
              max-width: 460px;
              padding: 14px 20px;
              border-radius: 16px;
              background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.98));
              border: 1.5px solid rgba(2, 132, 199, 0.55);
              box-shadow: 0 20px 44px rgba(15, 23, 42, 0.18), 0 0 24px rgba(2, 132, 199, 0.14);
              color: #0f172a;
              font-family: Inter, system-ui, sans-serif;
              pointer-events: none;
            }
            #praxis-tour-callout .tour-badge {
              display: inline-block;
              font-size: 10.5px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: #ffffff;
              background: linear-gradient(135deg, #0284c7, #0d9488);
              padding: 3px 10px;
              border-radius: 999px;
              margin-bottom: 6px;
            }
            #praxis-tour-callout .tour-title {
              font-size: 15px;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 4px;
            }
            #praxis-tour-callout .tour-sub {
              font-size: 12.5px;
              line-height: 1.45;
              color: #334155;
            }
          `;
          document.head.appendChild(styleEl);
        }
        document.querySelectorAll('.praxis-tour-highlight').forEach((el) => el.classList.remove('praxis-tour-highlight'));
        if (sel) {
          const target = document.querySelector(sel);
          if (target) {
            target.classList.add('praxis-tour-highlight');
            target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
        let callout = document.getElementById('praxis-tour-callout');
        if (!badge && !title) {
          if (callout) callout.remove();
          return;
        }
        if (!callout) {
          callout = document.createElement('div');
          callout.id = 'praxis-tour-callout';
          const host = document.getElementById('praxis-demo-toplayer') || document.body;
          const cursorEl = document.getElementById('praxis-demo-cursor');
          if (cursorEl && cursorEl.parentNode === host) {
            host.insertBefore(callout, cursorEl);
          } else {
            host.appendChild(callout);
          }
        }
        callout.innerHTML = `
          <div class="tour-badge">${badge}</div>
          <div class="tour-title">${title}</div>
          <div class="tour-sub">${sub}</div>
        `;
      }, { sel: selector, badge: badgeText, title: titleText, sub: subtitleText });
    };

    // ATO I — Cabeçalho Executivo + Faixa de KPIs Semânticos + ScopeBar com Quick Filter Chips e Filtros Inline (~6.5s)
    await setDemoStage(
      page,
      8,
      8,
      'ETAPA 8/8 · TOUR EXECUTIVO (ATO I/IV)',
      'Cabeçalho Executivo + KPI Band Semântica + ScopeBar com Filtros Inline',
      'Identidade de domínio, telemetria /stats/group-by ao vivo e busca inline (Nome Civil, Cargo e E-mail)'
    );
    await setTourSpotlight(
      '.praxis-resource-page__header',
      'ATO I · CABEÇALHO & TELEMETRIA VIVA',
      'Comando de Efetivo Operacional',
      'Cabeçalho executivo criado via Studio + 4 cards de KPI conectados ao endpoint /stats/group-by.'
    );
    const headerLoc = page.locator('.praxis-resource-page__header').first();
    if (await headerLoc.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, headerLoc, 100);
    }
    await sleep(1900);
    await recorder.captureSyncKeyframe();

    await setTourSpotlight(
      'praxis-kpi-band',
      'ATO I · FAIXA DE KPIs INTERATIVA',
      'Telemetria em Tempo Real (81,6% Prontidão)',
      'Expressões declarativas avaliadas com SafeExpressionEvaluator + filtro reativo ao clicar.'
    );
    const kpiRateCard = page.locator('praxis-crud praxis-kpi-band .praxis-kpi-card').nth(3);
    if (await kpiRateCard.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, kpiRateCard, 100);
    }
    await sleep(2100);
    await recorder.captureSyncKeyframe();

    await setTourSpotlight(
      'praxis-scope-bar',
      'ATO I · SCOPEBAR & FILTROS INLINE',
      'Quick Filter Chips + Campos Fixados',
      'Atalhos rápidos (Todos, Ativos, Reserva) e filtros inline (Nome Civil, Cargo e E-mail) + Filtros Avançados.'
    );
    const scopeBarLoc = page.locator('praxis-scope-bar').first();
    if (await scopeBarLoc.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, scopeBarLoc, 100);
    }
    await sleep(2200);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '13-tour-act1-header-kpis-scopebar.png') });

    // ATO II — Grade Corporativa Zero-Config + Curadoria & Moeda R$ (~5.5s)
    await setDemoStage(
      page,
      8,
      8,
      'ETAPA 8/8 · TOUR EXECUTIVO (ATO II/IV)',
      'Grade Corporativa com Herança @UISchema Zero-Config, Avatar e Moeda (R$)',
      'Código (#194), Foto Avatar, Admissão (dd/MM/yyyy), Subsídio Mensal (R$ 41.000,00) e Chip de Prontidão'
    );
    await setTourSpotlight(
      'praxis-crud praxis-table',
      'ATO II · GRADE CORPORATIVA GOVERNADA',
      'Herança Canônica @UISchema & Curadoria Studio',
      'Código (#194), Foto circular, Admissão (dd/MM/yyyy) e Moeda BRL (R$) projetados automaticamente do DTO.'
    );
    const firstTableRow = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first();
    if (await firstTableRow.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, firstTableRow, 100);
    }
    await sleep(2800);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '14-tour-act2-corporate-table.png') });
    await sleep(2200);

    // ATO III — Dossiê Modal em 2 Colunas (Visualização e Edição com contrato OpenAPI) (~6s)
    await setDemoStage(
      page,
      8,
      8,
      'ETAPA 8/8 · TOUR EXECUTIVO (ATO III/IV)',
      'Dossiê Modal em 2 Colunas — 3 Seções Executivas Governadas por OpenAPI',
      'Layout em 2 colunas (6/6) persistido e compartilhado entre Criação, Visualização e Edição'
    );
    await setTourSpotlight(null, '', '', '');

    const tourEditBtn = firstTableRow
      .locator('td.praxis-actions-cell button.praxis-icon-btn:not([disabled])')
      .nth(1);
    if (await tourEditBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, tourEditBtn, 95);
      await tourEditBtn.click();
      await page.locator('mat-dialog-container praxis-dynamic-form form.praxis-dynamic-form').first().waitFor({ state: 'visible', timeout: 15000 });
      await setTourSpotlight(
        'mat-dialog-container',
        'ATO III · DOSSIÊ MODAL EM 2 COLUNAS',
        '3 Seções Executivas · Layout 2 Colunas (6/6)',
        '1. Dossiê Tático & Canais S.H.I.E.L.D. · 2. Identificação Civil · 3. Lotação, Patente & Subsídio.'
      );
      await sleep(3000);
      await recorder.captureSyncKeyframe();
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '15-tour-act3-modal-dossier-2col.png') });

      await page.evaluate(() => {
        const sections = document.querySelectorAll('mat-dialog-container praxis-dynamic-form .praxis-form-section, mat-dialog-container praxis-dynamic-form section');
        if (sections.length > 1) {
          sections[sections.length - 1].scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      });
      await sleep(2300);
      await recorder.captureSyncKeyframe();

      await page.keyboard.press('Escape');
      await sleep(450);
      await dismissStrayBackdrops(page);
    }

    // ATO IV — Quadro-Resumo Final Zero-Code / Zero-Deploy em Estilo Aurora (~5.5s)
    await setDemoStage(
      page,
      8,
      8,
      'ETAPA 8/8 · RESUMO EXECUTIVO (ATO IV/IV)',
      'Praxis Platform — Entregáveis 100% Zero-Code & Zero-Deploy Concluídos',
      'Da página em branco à Grade Viva em segundos e evolução progressiva completa'
    );
    await setTourSpotlight(null, '', '', '');

    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.id = 'praxis-final-summary-card';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 2147483640;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(15, 23, 42, 0.42);
        font-family: Inter, system-ui, sans-serif;
        animation: fadeInSummary 0.35s ease-out forwards;
      `;
      overlay.innerHTML = `
        <div style="
          width: 940px;
          padding: 36px 42px;
          border-radius: 22px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.99), rgba(241, 245, 249, 0.98));
          border: 1.5px solid rgba(2, 132, 199, 0.45);
          box-shadow: 0 28px 72px rgba(15, 23, 42, 0.25), 0 0 36px rgba(2, 132, 199, 0.14);
          color: #0f172a;
        ">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 18px;">
            <span style="
              background: linear-gradient(135deg, #0284c7, #0d9488);
              color: #ffffff;
              font-weight: 800;
              font-size: 11.5px;
              letter-spacing: 0.08em;
              padding: 5px 12px;
              border-radius: 999px;
              text-transform: uppercase;
            ">PRAXIS METADATA-DRIVEN PLATFORM · ZERO-CODE STUDIO · TEMA AURORA</span>
            <span style="color: #059669; font-weight: 800; font-size: 13px;">● 100% PERSISTIDO SEM DEPLOY</span>
          </div>
          <h2 style="margin: 0 0 8px; font-size: 26px; font-weight: 800; color: #0f172a;">
            Comando de Efetivo Operacional — Construído Progressivamente em Tempo Real
          </h2>
          <p style="margin: 0 0 24px; font-size: 14.5px; color: #475569;">
            Tabela viva materializada nos primeiros segundos via Quick Connect e enriquecida em camadas com editores expandidos, sem código e sem deploy.
          </p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;">
            <div style="padding: 14px 16px; border-radius: 14px; background: rgba(248, 250, 252, 0.95); border: 1px solid rgba(2, 132, 199, 0.28);">
              <div style="font-weight: 800; font-size: 13.5px; color: #0284c7; margin-bottom: 4px;">✓ Quick Connect & Projeção Zero-Config</div>
              <div style="font-size: 12.5px; color: #334155;">Código (#194), Foto Avatar, Admissão (dd/MM/yyyy) e 98 registros reais projetados direto do DTO.</div>
            </div>
            <div style="padding: 14px 16px; border-radius: 14px; background: rgba(248, 250, 252, 0.95); border: 1px solid rgba(13, 148, 136, 0.28);">
              <div style="font-weight: 800; font-size: 13.5px; color: #0d9488; margin-bottom: 4px;">✓ Curadoria de Colunas & Moeda BRL (R$)</div>
              <div style="font-size: 12.5px; color: #334155;">Subsídio Mensal herdando BRL do @UISchema, Chip de Prontidão e ocultação de colunas auxiliares.</div>
            </div>
            <div style="padding: 14px 16px; border-radius: 14px; background: rgba(248, 250, 252, 0.95); border: 1px solid rgba(2, 132, 199, 0.28);">
              <div style="font-weight: 800; font-size: 13.5px; color: #0284c7; margin-bottom: 4px;">✓ KPI Band Viva & ScopeBar</div>
              <div style="font-size: 12.5px; color: #334155;">4 indicadores conectados a /stats/group-by (81,6% prontidão), Quick Chips e filtros inline.</div>
            </div>
            <div style="padding: 14px 16px; border-radius: 14px; background: rgba(248, 250, 252, 0.95); border: 1px solid rgba(13, 148, 136, 0.28);">
              <div style="font-weight: 800; font-size: 13.5px; color: #0d9488; margin-bottom: 4px;">✓ Editor Flat Sections & Escopo por Modo</div>
              <div style="font-size: 12.5px; color: #334155;">3 seções em 2 colunas (6/6) com escopo compartilhado entre Criar, Visualizar e Editar.</div>
            </div>
          </div>
        </div>
      `;
      const host = document.getElementById('praxis-demo-toplayer') || document.body;
      const hudEl = document.getElementById('praxis-demo-hud');
      if (hudEl && hudEl.parentNode === host) {
        host.insertBefore(overlay, hudEl);
      } else {
        host.appendChild(overlay);
      }
    });
    await sleep(5200);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '16-tour-act4-executive-summary.png') });

    await recorder.stop();
    await browser.close();
    browser = null;

    await convertWebmToMp4(videoFile, mp4File);
    console.log('\n================================================================');
    console.log(' [SUCCESS] Praxis CRUD Zero-Code Studio Demo (Aurora Theme) Recorded!');
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
