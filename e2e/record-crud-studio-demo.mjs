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
            <span class="praxis-demo-badge">ETAPA 1/9 · CRUD DO ZERO</span>
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

    console.log('1. Navigating to /crud-studio (100% blank CRUD page)...');
    await page.goto(`${BASE_URL}/crud-studio`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('[data-testid="toggle-customization-btn"]').waitFor({ state: 'visible', timeout: 15000 });
    await page.evaluate(() => sessionStorage.setItem('__praxis_crud_demo_t0', String(Date.now())));

    await setDemoStage(
      page,
      1,
      9,
      'ETAPA 1/9 · PÁGINA 100% EM BRANCO',
      'Estúdio CRUD (/crud-studio) — Zero Código & Zero Metadados Iniciais',
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

    // Click "Configurar CRUD" on Empty State card (or resource-page-configure-btn if header exists)
    const configPageBtn = page
      .locator('praxis-crud praxis-empty-state-card button, [data-testid="resource-page-configure-btn"]')
      .first();
    await configPageBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, configPageBtn, 120);
    await configPageBtn.click();

    const crudEditor = page.locator('[data-testid="crud-metadata-editor"]');
    await crudEditor.waitFor({ state: 'visible', timeout: 10000 });
    await sleep(500);
    await recorder.captureSyncKeyframe();

    // =========================================================================
    // STAGE 2: Connect Resource & Customize Page Header / Opening Mode / Actions
    // =========================================================================
    console.log('2. Connecting to human-resources/funcionarios and customizing Page Header, Opening Mode & Actions...');
    await setDemoStage(
      page,
      2,
      9,
      'ETAPA 2/9 · CONEXÃO, CABEÇALHO & AÇÕES',
      'Quick Connect + Cabeçalho Executivo + Modo Modal & Ações Governadas',
      'Configurando título/subtítulo/domínio da página, endpoint REST e formulários modais'
    );

    await connectResourceInCrudEditor(page, 'human-resources/funcionarios');
    await setFormInput(page, '[data-testid="crud-editor-resource-idField"]', 'id');

    // Configure Executive Page Header directly inside the Connection tab (I1)
    await setFormInput(page, '[data-testid="crud-editor-page-title"]', 'Comando de Efetivo Operacional');
    await setFormInput(
      page,
      '[data-testid="crud-editor-page-subtitle"]',
      'Gestão integrada de agentes, prontidão tática, credenciais S.H.I.E.L.D. e subsídios em tempo real.'
    );
    await setFormInput(page, '[data-testid="crud-editor-page-domain-label"]', 'HUMAN RESOURCES • ZERO-CODE STUDIO');
    await sleep(500);

    // Wait briefly for schema columns to resolve in background
    for (let i = 0; i < 30; i++) {
      const tableText = await page.locator('[data-testid="crud-editor-overview-table"]').innerText().catch(() => '');
      if (tableText && !tableText.startsWith('0 ')) break;
      await sleep(150);
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
    await setSlideToggle(page, '[data-testid="crud-editor-modal-startMaximized"]', true);
    await setSlideToggle(page, '[data-testid="crud-editor-modal-rememberLastState"]', true);
    await setSlideToggle(page, '[data-testid="crud-editor-back-confirmOnDirty"]', true);
    await sleep(500);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-crud-resource-and-opening.png') });

    // Switch to Tab 2: Actions — bind create, view, and edit to the shared modal form ('studio-funcionarios-form') (I4)
    const tabActions = page.locator('[data-testid="crud-editor-tab-actions"]');
    await moveCursorToLocator(page, tabActions, 100);
    await tabActions.click();
    await sleep(450);
    for (const actionKey of ['create', 'view', 'edit']) {
      const panel = page.locator(`[data-testid="crud-editor-action-${actionKey}-panel"]`).first();
      const header = page.locator(`[data-testid="crud-editor-action-${actionKey}-panel-header"]`).first();
      if (await panel.isVisible().catch(() => false)) {
        const isExpanded = await panel.evaluate((el) => el.classList.contains('mat-expanded')).catch(() => false);
        if (!isExpanded && (await header.isVisible().catch(() => false))) {
          await moveCursorToLocator(page, header, 80);
          await header.click();
          await sleep(280);
        }
      }
      const formIdInput = page.locator(`[data-testid="crud-editor-action-${actionKey}-formId"]`).first();
      await formIdInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      if (await formIdInput.isVisible().catch(() => false)) {
        await setFormInput(page, formIdInput, 'studio-funcionarios-form', { pauseMs: 65 });
        await sleep(220);
      }
    }
    await sleep(450);
    await recorder.captureSyncKeyframe();

    // =========================================================================
    // STAGE 3: Author KPI Band (4 Executive Cards with Live /stats/group-by Telemetry & Click Filters)
    // =========================================================================
    console.log('3. Authoring KPI Band with live /stats/group-by telemetry and 4 interactive cards...');
    await setDemoStage(
      page,
      3,
      9,
      'ETAPA 3/9 · FAIXA DE KPIs VIVA',
      'Autoria Visual da Faixa Executiva de KPIs (PraxisKpiBand + /stats/group-by)',
      'Conectando telemetria viva (byKey / totalCount) e filtros interativos ao clicar'
    );

    const tabKpis = page.locator('[data-testid="crud-editor-tab-kpis"]');
    await moveCursorToLocator(page, tabKpis, 100);
    await tabKpis.click();
    await sleep(400);

    await setSlideToggle(page, '[data-testid="crud-kpi-band-enabled"]', true);

    const autoConnectKpiBtn = page.locator('[data-testid="crud-kpi-band-autoconnect-btn"]');
    if (await autoConnectKpiBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, autoConnectKpiBtn, 90);
      await autoConnectKpiBtn.click();
      await sleep(250);
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
      await moveCursorToLocator(page, addKpiBtn, 80);
      await addKpiBtn.click();
      await sleep(220);

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
      9,
      'ETAPA 4/9 · BARRA DE FILTROS & CHIPS',
      'Campos Fixados (Inline Fields) + Atalhos Rápidos (Quick Filters)',
      'Fixando busca por Nome/Codinome/E-mail no ScopeBar e criando chips de filtro rápido'
    );

    const tabFilters = page.locator('[data-testid="crud-editor-tab-filters"]');
    await moveCursorToLocator(page, tabFilters, 100);
    await tabFilters.click();
    await sleep(400);

    await setSlideToggle(page, '[data-testid="crud-filterbar-show-advanced"]', true);

    for (const inlineField of ['nomeCompleto', 'codinome', 'cargoNome', 'email']) {
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
      { id: 'qf-all', label: 'Todos os Agentes', icon: 'groups', mode: 'clear', modeMatch: /Todos|limpar filtro|Limpar filtros|Exibir todos|clear/i },
      { id: 'qf-active', label: 'Ativos em Prontidão', icon: 'bolt', mode: 'fieldEquals', modeMatch: /Campo igual|Igualdade|fieldEquals/i, field: 'ativo', value: 'true' },
      { id: 'qf-reserve', label: 'Reserva Tática', icon: 'shield', mode: 'fieldEquals', modeMatch: /Campo igual|Igualdade|fieldEquals/i, field: 'ativo', value: 'false' }
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
        (txt) => qf.modeMatch.test(txt)
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
      9,
      'ETAPA 5/9 · TABELA & COLUNAS',
      'Customizando Barra de Ferramentas, Colunas, Formatação Moeda e Renderers',
      'Configurando avatar composto, chips de status, Subsídio Mensal (R$) e larguras'
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

      // Ensure visibility checkbox is explicitly checked (I3 — especially for 'salario')
      const visCheckboxInput = colItem.locator('mat-checkbox.visibility-checkbox input[type="checkbox"]').first();
      if ((await visCheckboxInput.count()) > 0 && !(await visCheckboxInput.isChecked().catch(() => true))) {
        const checkboxTarget = colItem.locator('mat-checkbox.visibility-checkbox').first();
        await moveCursorToLocator(page, checkboxTarget, 65);
        await checkboxTarget.click();
        await sleep(160);
      }

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
          await selectMatOption(page, dtSelect, (txt, val) => val === dataType || /moeda|currency/i.test(txt) || txt.toLowerCase().includes(dataType));
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
      width: '260px',
      composePreset: /Pessoa com avatar|Person with avatar/i
    });
    await customizeColumnByField('codinome', {
      header: 'Codinome Tático',
      width: '170px'
    });
    await customizeColumnByField('cargoNome', {
      header: 'Patente / Especialidade',
      width: '200px'
    });
    await customizeColumnByField('departamentoNome', {
      header: 'Divisão Operacional',
      width: '190px'
    });
    await customizeColumnByField('salario', {
      header: 'Subsídio Mensal',
      width: '160px',
      align: 'right',
      dataType: 'currency'
    });
    await customizeColumnByField('ativo', {
      header: 'Prontidão',
      width: '140px',
      align: 'center',
      composePreset: /Chip de status|Status chip/i
    });

    // Hide noisy raw columns so the executive table fits 100% in 1080p
    const columnsToHide = ['fotoPerfilUrl', 'avatarUrl', 'foto', 'id', 'estadoCivil', 'cpf', 'telefone', 'email', 'dataNascimento', 'cargoId', 'departamentoId'];
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
          await moveCursorToLocator(page, checkboxTarget, 60);
          await checkboxTarget.click();
          await sleep(120);
        }
      }
    }

    await sleep(500);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-crud-table-columns-authored.png') });

    // Save & close CRUD Metadata Editor
    await saveAndCloseSettingsPanel(page, 'crud-metadata-editor');

    // Wait for the live CRUD page to materialize Executive Header, KPI Band, ScopeBar + Inline Filters, and Table rows
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
    await sleep(600);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06-crud-page-materialized.png') });

    // =========================================================================
    // STAGE 6: Customize the Dynamic Form Layout Inside the CRUD Modal (All 3 Sections in 2 Columns)
    // =========================================================================
    console.log('6. Opening CRUD form in Modal and customizing Form Layout (All 3 Sections in 2 Columns)...');
    await setDemoStage(
      page,
      6,
      9,
      'ETAPA 6/9 · CUSTOMIZAÇÃO DO FORMULÁRIO',
      'Editor Visual de Formulário Dinâmico (PraxisDynamicFormConfigEditor)',
      'Renomeando as 3 seções e aplicando preset de 2 Colunas (6/6) em todas elas'
    );

    // Click the Edit action on the first row to open the form modal
    const firstRow = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first();
    await firstRow.waitFor({ state: 'visible', timeout: 15000 });
    await moveCursorToLocator(page, firstRow, 90);

    const editRowBtn = firstRow
      .locator('td.praxis-actions-cell button.praxis-icon-btn:not([disabled])')
      .nth(1);
    await editRowBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, editRowBtn, 95);
    await editRowBtn.click();

    // Wait for DynamicFormDialogHostComponent modal and form to finish loading
    const formDialog = page.locator('mat-dialog-container praxis-dynamic-form').first();
    await formDialog.waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('mat-dialog-container praxis-dynamic-form form.praxis-dynamic-form').first().waitFor({ state: 'visible', timeout: 15000 });
    await sleep(500);
    await recorder.captureSyncKeyframe();

    // Click the Customize Form gear button (.config-button) inside the modal form
    const customizeFormBtn = formDialog
      .locator('button.config-button, button[aria-label*="Configurar formulário"], button.customize-btn')
      .first();
    await customizeFormBtn.waitFor({ state: 'visible', timeout: 15000 });
    await moveCursorToLocator(page, customizeFormBtn, 110);
    await customizeFormBtn.click();

    const formConfigEditor = page.locator('praxis-dynamic-form-config-editor');
    await formConfigEditor.waitFor({ state: 'visible', timeout: 10000 });
    await sleep(450);
    await recorder.captureSyncKeyframe();

    // Switch to the "Layout" tab in PraxisDynamicFormConfigEditor
    const layoutTab = formConfigEditor.locator('.mat-mdc-tab').filter({ hasText: /Layout/i }).first();
    await moveCursorToLocator(page, layoutTab, 100);
    await layoutTab.click();
    await sleep(450);

    const layoutEditor = formConfigEditor.locator('praxis-layout-editor');
    await layoutEditor.waitFor({ state: 'visible', timeout: 10000 });

    // Collapse the right-side available fields palette if open so all 3 sections have maximum canvas room
    const collapsePaletteBtn = layoutEditor.locator('button.collapse-toggle[aria-label*="Colapsar"]').first();
    if (await collapsePaletteBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, collapsePaletteBtn, 70);
      await collapsePaletteBtn.click();
      await sleep(200);
    }

    // Rename all 3 sections and apply 2-column preset ("Duas Colunas 1/1") to each section (I4)
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

      // 1) Rename section
      const renameTrigger = sectionCard.locator('[data-testid="section-rename-trigger"]').first();
      if (await renameTrigger.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, renameTrigger, 80);
        await renameTrigger.click();
        await sleep(180);
        const renameInput = sectionCard.locator('[data-testid="section-rename-input"]').first();
        if (await renameInput.isVisible().catch(() => false)) {
          await renameInput.fill(sectionTitles[secIdx]);
          await renameInput.press('Enter');
          await sleep(240);
        }
      }

      // 2) Apply 2-column preset to the entire section via section menu -> "Presets de seção…" -> "Duas Colunas 1/1"
      const directPreset2Col = sectionCard.locator('[data-testid="layout-preset-2col"]').first();
      if (await directPreset2Col.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, directPreset2Col, 80);
        await directPreset2Col.click();
        await sleep(250);
      } else {
        const sectionMenuBtn = sectionCard.locator('button.section-menu-btn').first();
        if (await sectionMenuBtn.isVisible().catch(() => false)) {
          await moveCursorToLocator(page, sectionMenuBtn, 75);
          await sectionMenuBtn.click();
          await sleep(220);
          const presetsMenuItem = page
            .locator('.cdk-overlay-container [role="menuitem"]')
            .filter({ hasText: /Presets de se/i })
            .first();
          if (await presetsMenuItem.isVisible().catch(() => false)) {
            await moveCursorToLocator(page, presetsMenuItem, 75);
            await presetsMenuItem.click();
            await sleep(260);
            const twoColSectionPreset = page
              .locator('praxis-section-preset-picker button.preset-btn')
              .filter({ hasText: /Duas Colunas 1\/1|2 colunas/i })
              .first();
            if (await twoColSectionPreset.isVisible().catch(() => false)) {
              await moveCursorToLocator(page, twoColSectionPreset, 80);
              await twoColSectionPreset.click();
              await sleep(280);
            } else {
              await page.keyboard.press('Escape');
            }
          } else {
            await page.keyboard.press('Escape');
          }
        }
      }
    }

    // Scroll back to top of layout editor to showcase the 2-column sections
    await layoutEditor.locator('praxis-section-configurator').first().evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' })).catch(() => {});
    await sleep(450);
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
      await moveCursorToLocator(page, closeFormDialogBtn, 90);
      await closeFormDialogBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await sleep(550);
    await dismissStrayBackdrops(page);

    // =========================================================================
    // STAGE 7: Full CRUD Runtime Lifecycle (KPI Filter, Quick Chips, View, Create, Edit, Delete)
    // =========================================================================
    console.log('7. Exiting Customization Mode and demonstrating full CRUD Runtime Lifecycle...');
    await setDemoStage(
      page,
      7,
      9,
      'ETAPA 7/9 · OPERAÇÃO EM RUNTIME',
      'Filtros via KPI, Quick Chips, Visualização, Criação, Edição e Exclusão',
      'Testando a página pronta em modo operacional (sem modo de edição)'
    );

    // Exit Customization Mode
    await moveCursorToLocator(page, toggleCustomBtn, 110);
    await toggleCustomBtn.click();
    await sleep(600);
    await recorder.captureSyncKeyframe();

    // 7.1 Click KPI Card #2 ("Prontidão Ativa") to filter table reactively
    const kpiCardActive = page.locator('praxis-crud praxis-kpi-band .praxis-kpi-card').nth(1);
    if (await kpiCardActive.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, kpiCardActive, 110);
      await kpiCardActive.click();
      await sleep(750);
      await recorder.captureSyncKeyframe();
    }

    // Click KPI Card #1 ("Efetivo Tático Total") to clear filter
    const kpiCardTotal = page.locator('praxis-crud praxis-kpi-band .praxis-kpi-card').nth(0);
    if (await kpiCardTotal.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, kpiCardTotal, 110);
      await kpiCardTotal.click();
      await sleep(700);
      await recorder.captureSyncKeyframe();
    }

    // 7.2 Click Quick Filter chips in ScopeBar
    const quickChipReserve = page.locator('praxis-scope-bar button, praxis-crud button, praxis-crud mat-chip-option, .quick-filter-chip').filter({ hasText: /Reserva Tática/i }).first();
    if (await quickChipReserve.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, quickChipReserve, 100);
      await quickChipReserve.click();
      await sleep(700);
      await recorder.captureSyncKeyframe();
    }

    const quickChipAll = page.locator('praxis-scope-bar button, praxis-crud button, praxis-crud mat-chip-option, .quick-filter-chip').filter({ hasText: /Todos os Agentes/i }).first();
    if (await quickChipAll.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, quickChipAll, 100);
      await quickChipAll.click();
      await sleep(700);
      await recorder.captureSyncKeyframe();
    }

    // 7.3 Trigger VIEW action on a row (inline button nth(0) = Visualizar) — now opens with 2-column layout!
    console.log('   7.3 Demonstrating View (Visualizar) action with 2-column customized layout...');
    const rowForView = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first();
    await rowForView.waitFor({ state: 'visible', timeout: 10000 });
    const viewRowBtn = rowForView
      .locator('td.praxis-actions-cell button.praxis-icon-btn:not([disabled])')
      .nth(0);
    await viewRowBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, viewRowBtn, 100);
    await viewRowBtn.click();

    await page.locator('mat-dialog-container praxis-dynamic-form form.praxis-dynamic-form').first().waitFor({ state: 'visible', timeout: 15000 });
    await sleep(750);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '09-crud-runtime-view.png') });

    await page.keyboard.press('Escape');
    await sleep(500);
    await dismissStrayBackdrops(page);

    // 7.4 Trigger CREATE action from the table toolbar ("Novo" / "Criar") — now opens with 2-column layout!
    console.log('   7.4 Demonstrating Create (Novo Registro) action with customized 2-column form layout...');
    const createToolbarBtn = page
      .locator('praxis-crud praxis-table-toolbar button:not([disabled])')
      .filter({ hasText: /Novo|Adicionar|Criar|New|Add/i })
      .first();
    if (await createToolbarBtn.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, createToolbarBtn, 110);
      await createToolbarBtn.click();
      await page.locator('mat-dialog-container praxis-dynamic-form form.praxis-dynamic-form').first().waitFor({ state: 'visible', timeout: 15000 });
      await sleep(500);

      // Fill a couple of fields in the customized Create form to demonstrate interactive layout
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
      await sleep(650);
      await recorder.captureSyncKeyframe();

      // Close create dialog (confirming dirty guard if prompted!)
      await page.keyboard.press('Escape');
      await sleep(350);
      const dirtyConfirmBtn = page.locator('.cdk-overlay-container mat-dialog-container button').filter({ hasText: /Sair|Confirmar|Descartar|Sim|Leave/i }).first();
      if (await dirtyConfirmBtn.isVisible().catch(() => false)) {
        await moveCursorToLocator(page, dirtyConfirmBtn, 80);
        await dirtyConfirmBtn.click();
      }
      await sleep(450);
      await dismissStrayBackdrops(page);
    }

    // 7.5 Trigger EDIT action on the first row showing the customized multi-column layout pre-populated
    console.log('   7.5 Demonstrating Edit (Editar) action with pre-populated customized layout...');
    const rowForEdit = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first();
    const editBtn2 = rowForEdit
      .locator('td.praxis-actions-cell button.praxis-icon-btn:not([disabled])')
      .nth(1);
    await editBtn2.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, editBtn2, 100);
    await editBtn2.click();

    await page.locator('mat-dialog-container praxis-dynamic-form form.praxis-dynamic-form').first().waitFor({ state: 'visible', timeout: 15000 });
    await sleep(750);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '10-crud-runtime-edit.png') });

    await page.keyboard.press('Escape');
    await sleep(500);
    await dismissStrayBackdrops(page);

    // 7.6 Trigger DELETE action to showcase the governed Confirmation Dialog
    console.log('   7.6 Demonstrating Delete (Excluir) confirmation dialog...');
    const rowForDelete = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').nth(1);
    const moreBtn = rowForDelete
      .locator('td.praxis-actions-cell button.praxis-more-btn:not([disabled]), td.praxis-actions-cell button[aria-haspopup="menu"]:not([disabled])')
      .first();
    await moreBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, moreBtn, 95);
    await moreBtn.click();
    await sleep(280);
    const delItem = page.locator('.cdk-overlay-container [role="menuitem"]').filter({ hasText: /Excluir|Delete|Remover/i }).first();
    await delItem.waitFor({ state: 'visible', timeout: 10000 });
    await moveCursorToLocator(page, delItem, 85);
    await delItem.click();

    const confirmDialog = page.locator('.cdk-overlay-container mat-dialog-container').first();
    await confirmDialog.waitFor({ state: 'visible', timeout: 10000 });
    await sleep(500);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '11-crud-runtime-delete.png') });

    const cancelDeleteBtn = confirmDialog.locator('button').filter({ hasText: /Cancelar|Cancel|Não/i }).first();
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
      9,
      'ETAPA 8/9 · PROVA DE PERSISTÊNCIA (F5 RELOAD)',
      'Recarregando a Página (/crud-studio) — 100% Persistido sem Deploy',
      'Cabeçalho Executivo, KPI Band, ScopeBar, Colunas e Layout do Formulário preservados'
    );

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('praxis-crud praxis-kpi-band .praxis-kpi-card').first().waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first().waitFor({ state: 'visible', timeout: 20000 });

    await setDemoStage(
      page,
      8,
      9,
      'ETAPA 8/9 · PROVA DE PERSISTÊNCIA (F5 RELOAD)',
      'Página CRUD 100% Hidratada após F5 · Zero Código · Zero Deploy',
      'Cabeçalho executivo, filtros inline no ScopeBar, coluna Subsídio Mensal (R$) e KPIs ativos'
    );
    await sleep(900);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '12-crud-after-reload-persisted.png') });

    // =========================================================================
    // STAGE 9: Final Guided Executive Tour (~25s — 4 Acts with Visual Spotlight)
    // =========================================================================
    console.log('9. Running Final Executive Tour (~25s) showcasing all constructed deliverables...');

    const setTourSpotlight = async (selector, badgeText, titleText, subtitleText) => {
      await page.evaluate(({ sel, badge, title, sub }) => {
        let styleEl = document.getElementById('praxis-tour-spotlight-style');
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'praxis-tour-spotlight-style';
          styleEl.textContent = `
            .praxis-tour-highlight {
              outline: 2.5px solid #38bdf8 !important;
              outline-offset: 4px !important;
              box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.18), 0 12px 32px rgba(2, 132, 199, 0.35) !important;
              border-radius: 12px !important;
              transition: outline 0.25s ease, box-shadow 0.25s ease !important;
            }
            #praxis-tour-callout {
              position: fixed;
              top: 18px;
              right: 28px;
              z-index: 2147483644;
              max-width: 460px;
              padding: 12px 18px;
              border-radius: 14px;
              background: linear-gradient(135deg, rgba(8, 15, 30, 0.96), rgba(15, 23, 42, 0.96));
              border: 1.5px solid rgba(56, 189, 248, 0.65);
              box-shadow: 0 18px 42px rgba(0, 0, 0, 0.75), 0 0 24px rgba(56, 189, 248, 0.28);
              color: #f8fafc;
              font-family: Inter, system-ui, sans-serif;
              pointer-events: none;
            }
            #praxis-tour-callout .tour-badge {
              display: inline-block;
              font-size: 10.5px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: #082f49;
              background: linear-gradient(135deg, #38bdf8, #22d3ee);
              padding: 3px 9px;
              border-radius: 999px;
              margin-bottom: 6px;
            }
            #praxis-tour-callout .tour-title {
              font-size: 15px;
              font-weight: 800;
              color: #f8fafc;
              margin-bottom: 4px;
            }
            #praxis-tour-callout .tour-sub {
              font-size: 12.5px;
              line-height: 1.45;
              color: #cbd5e1;
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
          document.body.appendChild(callout);
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
      9,
      9,
      'ETAPA 9/9 · TOUR EXECUTIVO (ATO I/IV)',
      'Cabeçalho Executivo + KPI Band Semântica + ScopeBar com Filtros Inline',
      'Identidade de domínio, telemetria /stats/group-by ao vivo e busca inline (Nome, Codinome, E-mail)'
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
    await sleep(2000);
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
    await sleep(2200);
    await recorder.captureSyncKeyframe();

    await setTourSpotlight(
      'praxis-scope-bar',
      'ATO I · SCOPEBAR & FILTROS INLINE',
      'Quick Filter Chips + Campos Fixados',
      'Atalhos rápidos (Todos, Ativos, Reserva) e filtros inline (Nome Completo, Codinome, E-mail) + Filtros Avançados.'
    );
    const scopeBarLoc = page.locator('praxis-scope-bar').first();
    if (await scopeBarLoc.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, scopeBarLoc, 100);
    }
    await sleep(2300);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '13-tour-act1-header-kpis-scopebar.png') });

    // ATO II — Grade Corporativa com Colunas Compostas & Moeda R$ (~6s)
    await setDemoStage(
      page,
      9,
      9,
      'ETAPA 9/9 · TOUR EXECUTIVO (ATO II/IV)',
      'Grade Corporativa com Colunas Compostas, Chips Semânticos e Moeda (R$)',
      'Herói com Avatar, Codinome Tático, Patente, Divisão, Subsídio Mensal (R$ 41.000,00) e Prontidão'
    );
    await setTourSpotlight(
      'praxis-crud praxis-table',
      'ATO II · GRADE CORPORATIVA GOVERNADA',
      'Colunas Compostas & Formatação Moeda (BRL)',
      'Renderizador Pessoa com Avatar, Subsídio Mensal alinhado à direita (R$ 41.000,00) e Chip de Prontidão.'
    );
    const firstTableRow = page.locator('praxis-crud praxis-table tbody tr.mat-mdc-row').first();
    if (await firstTableRow.isVisible().catch(() => false)) {
      await moveCursorToLocator(page, firstTableRow, 100);
    }
    await sleep(3000);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '14-tour-act2-corporate-table.png') });
    await sleep(2500);

    // ATO III — Dossiê Modal em 2 Colunas (Visualização e Edição com contrato OpenAPI) (~6.5s)
    await setDemoStage(
      page,
      9,
      9,
      'ETAPA 9/9 · TOUR EXECUTIVO (ATO III/IV)',
      'Dossiê Modal em 2 Colunas — 3 Seções Executivas Governadas por OpenAPI',
      'Layout em 2 colunas (6/6) persistido nas 3 seções para Criação, Visualização e Edição'
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
      await sleep(3200);
      await recorder.captureSyncKeyframe();
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '15-tour-act3-modal-dossier-2col.png') });

      // Scroll inside form dialog to show sections 2 and 3 in 2 columns
      await page.evaluate(() => {
        const sections = document.querySelectorAll('mat-dialog-container praxis-dynamic-form .praxis-form-section, mat-dialog-container praxis-dynamic-form section');
        if (sections.length > 1) {
          sections[sections.length - 1].scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      });
      await sleep(2500);
      await recorder.captureSyncKeyframe();

      await page.keyboard.press('Escape');
      await sleep(500);
      await dismissStrayBackdrops(page);
    }

    // ATO IV — Quadro-Resumo Final Zero-Code / Zero-Deploy (~6s)
    await setDemoStage(
      page,
      9,
      9,
      'ETAPA 9/9 · RESUMO EXECUTIVO (ATO IV/IV)',
      'Praxis Platform — Entregáveis 100% Zero-Code & Zero-Deploy Concluídos',
      'Da página 100% em branco ao CRUD executivo completo com persistência imediata'
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
        background: rgba(6, 11, 24, 0.76);
        font-family: Inter, system-ui, sans-serif;
        animation: fadeInSummary 0.35s ease-out forwards;
      `;
      overlay.innerHTML = `
        <div style="
          width: 920px;
          padding: 36px 42px;
          border-radius: 20px;
          background: linear-gradient(145deg, rgba(10, 18, 36, 0.98), rgba(15, 23, 42, 0.98));
          border: 1.5px solid rgba(56, 189, 248, 0.65);
          box-shadow: 0 28px 72px rgba(0, 0, 0, 0.85), 0 0 40px rgba(56, 189, 248, 0.25);
          color: #f8fafc;
        ">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 18px;">
            <span style="
              background: linear-gradient(135deg, #0284c7, #38bdf8);
              color: #082f49;
              font-weight: 800;
              font-size: 11.5px;
              letter-spacing: 0.08em;
              padding: 5px 12px;
              border-radius: 999px;
              text-transform: uppercase;
            ">PRAXIS METADATA-DRIVEN PLATFORM · ZERO-CODE STUDIO</span>
            <span style="color: #10b981; font-weight: 700; font-size: 13px;">● 100% PERSISTIDO SEM DEPLOY</span>
          </div>
          <h2 style="margin: 0 0 8px; font-size: 26px; font-weight: 800; color: #f8fafc;">
            Comando de Efetivo Operacional — Construído do Zero em Tempo Real
          </h2>
          <p style="margin: 0 0 24px; font-size: 14.5px; color: #94a3b8;">
            Toda a superfície operacional foi configurada ao vivo a partir de uma rota 100% em branco, governada pelos contratos OpenAPI + x-ui do backend Praxis.
          </p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;">
            <div style="padding: 14px 16px; border-radius: 12px; background: rgba(30, 41, 59, 0.65); border: 1px solid rgba(56, 189, 248, 0.28);">
              <div style="font-weight: 700; font-size: 13.5px; color: #38bdf8; margin-bottom: 4px;">✓ Cabeçalho Executivo & Conexão</div>
              <div style="font-size: 12.5px; color: #cbd5e1;">Título, Subtítulo, Badge de Domínio e Quick Connect RESTful configurados sem código.</div>
            </div>
            <div style="padding: 14px 16px; border-radius: 12px; background: rgba(30, 41, 59, 0.65); border: 1px solid rgba(16, 185, 129, 0.32);">
              <div style="font-weight: 700; font-size: 13.5px; color: #34d399; margin-bottom: 4px;">✓ KPI Band & Telemetria Viva</div>
              <div style="font-size: 12.5px; color: #cbd5e1;">4 indicadores semânticos alimentados por /stats/group-by com cálculo de prontidão (81,6%) e clique para filtrar.</div>
            </div>
            <div style="padding: 14px 16px; border-radius: 12px; background: rgba(30, 41, 59, 0.65); border: 1px solid rgba(56, 189, 248, 0.28);">
              <div style="font-weight: 700; font-size: 13.5px; color: #38bdf8; margin-bottom: 4px;">✓ ScopeBar, Quick Chips & Grade R$</div>
              <div style="font-size: 12.5px; color: #cbd5e1;">Filtros inline (Nome, Codinome, E-mail), Avatar Composto, Chip de Status e Subsídio Mensal em Moeda (R$).</div>
            </div>
            <div style="padding: 14px 16px; border-radius: 12px; background: rgba(30, 41, 59, 0.65); border: 1px solid rgba(16, 185, 129, 0.32);">
              <div style="font-weight: 700; font-size: 13.5px; color: #34d399; margin-bottom: 4px;">✓ Dossiê Modal em 2 Colunas</div>
              <div style="font-size: 12.5px; color: #cbd5e1;">3 seções renomeadas e distribuídas em 2 colunas (6/6) compartilhadas entre Criar, Visualizar e Editar.</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    });
    await sleep(5500);
    await recorder.captureSyncKeyframe();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '16-tour-act4-executive-summary.png') });

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
