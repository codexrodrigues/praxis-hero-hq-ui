// Executes the actual host TypeScript with Angular HttpClient/headers and an isolated HttpBackend.
// No HTTP server, browser, stored credentials or database is involved.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
const { Subject, firstValueFrom } = require('rxjs');
const root = path.resolve(__dirname, '..');
const browserOrigin = 'http://127.0.0.1:4302';
const apiOrigin = 'https://api.example.test';
function compile(relative, imports) {
  const file = path.join(root, relative), exported = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true,
  } }).outputText;
  vm.compileFunction(code, ['exports', 'require', 'window'], { filename: file })(exported, imports, { location: { origin: browserOrigin } });
  return exported;
}
const signal = initial => {
  let value = initial;
  const read = () => value;
  read.set = next => { value = next; };
  read.update = fn => { value = fn(value); };
  read.asReadonly = () => read;
  return read;
};
const target = compile('src/app/core/corporate-session-target.ts', id => {
  assert.equal(id, './platform.config'); return { PRAXIS_API_ORIGIN: apiOrigin };
});
const libraries = (async () => { await import('@angular/compiler'); return import('@angular/common/http'); })();
async function fixture() {
  const http = await libraries;
  const pending = [], requests = [];
  const backend = { handle(request) {
    requests.push(request); const response = new Subject(); pending.push({ request, response }); return response;
  } };
  let service;
  class EnterpriseRuntimeContextService {}
  const invalidations = [];
  const runtime = { invalidate: () => invalidations.push(true) };
  const angular = { Injectable: () => type => type, signal, computed: fn => fn, inject: token => token === http.HttpBackend ? backend : token === EnterpriseRuntimeContextService ? runtime : service };
  const imports = id => {
    if (id === '@angular/core') return angular;
    if (id === '@praxisui/core') return { EnterpriseRuntimeContextService };
    if (id === '@angular/common/http') return http;
    if (id === 'rxjs') return require('rxjs');
    if (id === './platform.config') return { PRAXIS_API_ORIGIN: apiOrigin };
    if (id === './corporate-session-target') return target;
    if (id === './corporate-session.service') return { CorporateSessionService: exported.CorporateSessionService };
    throw Error(`Unexpected import: ${id}`);
  };
  const exported = compile('src/app/core/corporate-session.service.ts', imports);
  service = new exported.CorporateSessionService();
  const { corporateSessionInterceptor: interceptor } = compile('src/app/core/corporate-session.interceptor.ts', imports);
  function reply(status, headers = {}, overrideUrl) {
    const { request, response } = pending.shift();
    const url = overrideUrl ?? request.url;
    if (status >= 400) response.error(new http.HttpErrorResponse({ status, url, error: { detail: 'PRIVATE-NOT-FOR-UI' } }));
    else { response.next(new http.HttpResponse({ status, url, headers: new http.HttpHeaders(headers), body: null })); response.complete(); }
    return request;
  }
  async function authenticated(token = 'raw-current') {
    const call = service.restore(); reply(204, { 'X-XSRF-TOKEN': token }); assert.equal(await call, true);
  }
  return { http, service, interceptor, pending, requests, reply, authenticated, invalidations };
}

test('credential scope requires the exact configured origin and canonical path', () => {
  for (const url of ['/auth/login', '/auth/session', '/auth/logout', '/api/praxis/runtime', '/api/praxis/runtime/context', '/api/praxis/config/pages/x', '/api/praxis/config/ui-layouts/x', '/api/praxis/config/ai/transcriptions', '/api/praxis/config/ai/transcriptions/capabilities']) {
    assert.equal(target.corporateRequestPath(url, '', browserOrigin), url);
    assert.equal(target.corporateRequestPath(apiOrigin + url), url);
    assert.equal(target.corporateRequestPath(url), null, 'Same-origin URL is not the separately configured remote API');
  }
  for (const url of [apiOrigin + '.evil/auth/session', 'https://user:pass@api.example.test/auth/session', 'http://api.example.test/auth/session', apiOrigin + ':444/auth/session', '//api.example.test/auth/session', apiOrigin + '/auth/session/extra', apiOrigin + '/api/praxis/runtime-evil', apiOrigin + '/api/praxis/config/pages-evil', apiOrigin + '/api/praxis/config/pages%2fx', apiOrigin + '/api/praxis/config/../config/pages', apiOrigin + '/api//praxis/config/pages', apiOrigin + '/api/praxis/config/pages;param', apiOrigin + '/auth/session#x', apiOrigin + '/api/praxis/config/ai/transcriptions-evil', apiOrigin + '/api/praxis/config/ai/transcriptions/extra', apiOrigin + '/api/praxis/config/ai/status']) {
    assert.equal(target.corporateRequestPath(url), null, url);
  }
});

test('login confirms returned cookie with GET session and accepts only its raw token', async () => {
  const f = await fixture(); const call = f.service.login('operator', 'ephemeral-test-input');
  assert.equal(f.reply(204, { 'X-XSRF-TOKEN': 'login-response-not-used' }).method, 'POST');
  await Promise.resolve();
  assert.equal(f.service.authenticated(), false);
  assert.equal(f.pending[0].request.url, apiOrigin + '/auth/session');
  f.reply(204, { 'X-XSRF-TOKEN': 'raw-confirmed' }); assert.equal(await call, true);
  assert.equal(f.service.csrfToken(f.service.generation()), 'raw-confirmed');
  assert.ok(f.requests.every(r => r.withCredentials && r.redirect === 'error' && !r.headers.has('Authorization')));
});

test('missing token and foreign redirected verification fail closed with safe feedback', async () => {
  for (const [headers, url] of [[{}, undefined], [{ 'X-XSRF-TOKEN': 'foreign' }, 'https://elsewhere.test/auth/session']]) {
    const f = await fixture(); const call = f.service.restore(); f.reply(204, headers, url);
    assert.equal(await call, false); assert.equal(f.service.state(), 'unavailable');
    assert.equal(f.service.csrfToken(f.service.generation()), null);
    assert.equal(f.service.message().includes('PRIVATE'), false);
  }
});

test('401 and 403 login failures stay sanitized and do not automatically retry', async () => {
  for (const status of [401, 403, 503]) {
    const f = await fixture(); const call = f.service.login('operator', 'input'); f.reply(status);
    assert.equal(await call, false); assert.equal(f.requests.length, 1);
    assert.equal(f.service.message().includes('PRIVATE'), false);
    assert.equal(f.service.authenticated(), false);
  }
});

test('logout sends current CSRF, invalidates immediately and confirms GET session401', async () => {
  const f = await fixture(); await f.authenticated(); const oldGeneration = f.service.generation();
  const call = f.service.logout();
  assert.equal(f.service.csrfToken(oldGeneration), null);
  assert.equal(f.reply(204).headers.get('X-XSRF-TOKEN'), 'raw-current');
  await Promise.resolve(); f.reply(401); assert.equal(await call, true);
  assert.equal(f.service.state(), 'anonymous'); assert.match(f.service.message(), /Sessão encerrada neste navegador/);
});

test('logout204 without subsequent401 and failed logout are explicitly uncertain, without retries', async () => {
  for (const outcome of ['still-present', 'network-failure']) {
    const f = await fixture(); await f.authenticated(); const call = f.service.logout();
    if (outcome === 'network-failure') f.reply(503);
    else { f.reply(204); await Promise.resolve(); f.reply(204, { 'X-XSRF-TOKEN': 'must-not-recapture' }); }
    assert.equal(await call, false); assert.equal(f.service.state(), 'logout-uncertain');
    assert.equal(f.service.csrfToken(f.service.generation()), null);
    assert.equal(f.requests.length, outcome === 'network-failure' ? 2 : 3);
  }
});

test('late session completion cannot resurrect a generation invalidated by401', async () => {
  const f = await fixture(); const call = f.service.restore(); const old = f.service.generation();
  f.service.unauthorized(old); f.reply(204, { 'X-XSRF-TOKEN': 'obsolete' });
  assert.equal(await call, false); assert.equal(f.service.state(), 'anonymous');
  await f.authenticated('new'); f.service.unauthorized(old);
  assert.equal(f.service.authenticated(), true); assert.equal(f.service.csrfToken(f.service.generation()), 'new');
});

test('interceptor preserves confirmed scope/preconditions while stripping demo authority', async () => {
  const f = await fixture(); await f.authenticated(); let sent;
  const req = new f.http.HttpRequest('PUT', apiOrigin + '/api/praxis/runtime/context', { choiceRef: 'opaque' }, {
    headers: new f.http.HttpHeaders({ Authorization: 'Bearer demo', 'X-Tenant': 'demo', 'X-User': 'demo', 'X-Updated-By': 'demo', 'X-XSRF-TOKEN': 'forged',
      'X-Praxis-Context-Version': 'confirmed', 'X-Tenant-ID': 'server-tenant', 'X-User-ID': 'server-user', 'X-Env': 'lab', 'If-Match': '"etag"', 'Idempotency-Key': 'key' }),
  });
  const response = new Subject(); const call = firstValueFrom(f.interceptor(req, r => { sent = r; return response; }));
  assert.equal(sent.withCredentials, true); assert.equal(sent.redirect, 'error'); assert.equal(sent.headers.get('X-XSRF-TOKEN'), 'raw-current');
  for (const name of ['Authorization', 'X-Tenant', 'X-User', 'X-Updated-By']) assert.equal(sent.headers.has(name), false);
  for (const name of ['X-Praxis-Context-Version', 'X-Tenant-ID', 'X-User-ID', 'X-Env', 'If-Match', 'Idempotency-Key']) assert.equal(sent.headers.get(name), req.headers.get(name));
  response.next(new f.http.HttpResponse({ status: 204, headers: new f.http.HttpHeaders({ 'X-XSRF-TOKEN': 'delegated-response' }) })); response.complete(); await call;
  assert.equal(f.service.csrfToken(f.service.generation()), 'raw-current');
});

test('bootstrap strips unstamped IDs and no token or credentials are attached outside exact scope', async () => {
  const f = await fixture(); await f.authenticated();
  const requests = [new f.http.HttpRequest('GET', apiOrigin + '/api/praxis/runtime/context', { headers: new f.http.HttpHeaders({ 'X-Tenant-ID': 'demo', 'X-User-ID': 'demo', 'X-Env': 'fake' }) }),
    new f.http.HttpRequest('GET', 'https://elsewhere.test/api/praxis/runtime/context')];
  for (const [index, req] of requests.entries()) {
    let sent; f.interceptor(req, r => { sent = r; return new Subject(); });
    if (index === 0) { assert.equal(sent.withCredentials, true); assert.equal(sent.headers.keys().length, 0); }
    else assert.equal(sent, req, 'Foreign request is passed through unchanged');
  }
});

test('old401 cannot invalidate new session and403/503 do not revoke a verified session', async () => {
  const f = await fixture(); await f.authenticated(); const response = new Subject();
  const call = firstValueFrom(f.interceptor(new f.http.HttpRequest('GET', apiOrigin + '/api/praxis/runtime/context'), () => response));
  await f.authenticated('new-generation'); response.error(new f.http.HttpErrorResponse({ status: 401 })); await assert.rejects(call);
  assert.equal(f.service.authenticated(), true);
  for (const status of [403, 503]) {
    const failed = new Subject(); const read = firstValueFrom(f.interceptor(new f.http.HttpRequest('GET', apiOrigin + '/api/praxis/runtime/context'), () => failed));
    failed.error(new f.http.HttpErrorResponse({ status })); await assert.rejects(read); assert.equal(f.service.authenticated(), true);
  }
});

test('mutation without verified CSRF fails before dispatch; proxy preserves origin and validates TLS', async () => {
  const f = await fixture(); let calls = 0;
  const req = new f.http.HttpRequest('POST', apiOrigin + '/api/praxis/config/pages', {});
  await assert.rejects(firstValueFrom(f.interceptor(req, () => { calls++; return new Subject(); })), e => e.status === 401);
  assert.equal(calls, 0);
  const proxy = require('../proxy.conf.js');
  assert.deepEqual(Object.keys(proxy), ['/api', '/schemas', '/auth']);
  for (const entry of Object.values(proxy)) { assert.equal(entry.secure, true); assert.equal(entry.headers, undefined); assert.equal(entry.onProxyReq, undefined); }
});

test('auth writes stay serialized even when401 invalidates a pending authentication response', async () => {
  const f = await fixture(); const first = f.service.login('operator', 'input');
  f.service.unauthorized(f.service.generation());
  assert.equal(f.service.busy(), true);
  assert.equal(await f.service.login('other', 'input'), false);
  assert.equal(await f.service.logout(), false);
  assert.equal(f.requests.length, 1);
  f.reply(204); assert.equal(await first, false); assert.equal(f.service.busy(), false);
});

test('uncertain logout blocks new login until an explicit session verification resolves it', async () => {
  const f = await fixture(); await f.authenticated(); const logout = f.service.logout(); f.reply(503); await logout;
  assert.equal(await f.service.login('operator', 'input'), false); assert.equal(f.requests.length, 2);
  const failedCheck = f.service.restore(); f.reply(503); await failedCheck;
  assert.equal(f.service.state(), 'logout-uncertain'); assert.equal(await f.service.login('operator', 'input'), false);
  const check = f.service.restore(); f.reply(401); await check;
  const login = f.service.login('operator', 'input'); f.reply(401); await login;
  assert.equal(f.requests.length, 5);
});

test('401 while logout is pending keeps the uncertain state and login fenced after completion', async () => {
  const f = await fixture(); await f.authenticated(); const logout = f.service.logout();
  f.service.unauthorized(f.service.generation());
  assert.equal(f.service.state(), 'logout-uncertain'); assert.equal(f.service.busy(), true);
  f.reply(204); assert.equal(await logout, false); assert.equal(f.service.busy(), false);
  assert.equal(f.service.state(), 'logout-uncertain');
  assert.equal(await f.service.login('operator', 'input'), false); assert.equal(f.requests.length, 2);
});

test('scoped backend uses Fetch redirect rejection and preserves the exact legacy request/progress stream', async () => {
  const http = await libraries;
  const calls = [], corporateEvents = new Subject(), legacyEvents = new Subject();
  const corporate = { handle(request) { calls.push(['corporate', request]); return corporateEvents; } };
  const legacy = { handle(request) { calls.push(['legacy', request]); return legacyEvents; } };
  const exported = compile('src/app/core/corporate-session.backend.ts', id => {
    if (id === '@angular/common/http') return http;
    if (id === '@angular/core') return { Injectable: () => type => type, inject: token => token === http.FetchBackend ? corporate : legacy };
    if (id === './corporate-session-target') return target;
    throw Error('Unexpected backend import');
  });
  const backend = new exported.CorporateSessionBackend();
  const protectedRequest = new http.HttpRequest('POST', apiOrigin + '/auth/login', { fixture: true }, { redirect: 'follow' });
  assert.equal(backend.handle(protectedRequest), corporateEvents);
  assert.equal(calls[0][1].redirect, 'error'); assert.equal(calls[0][1].body, protectedRequest.body);
  const upload = new http.HttpRequest('POST', apiOrigin + '/api/files', { fixture: true }, { reportProgress: true });
  assert.equal(backend.handle(upload), legacyEvents); assert.equal(calls[1][1], upload); assert.equal(calls[1][1].reportProgress, true);
  const foreign = new http.HttpRequest('GET', 'https://elsewhere.test/auth/session');
  assert.equal(backend.handle(foreign), legacyEvents); assert.equal(calls[2][1], foreign);
});

test('the installed Angular FetchBackend forwards redirect:error to native fetch', async () => {
  const http = await libraries;
  const angular = await import('@angular/core');
  const originalFetch = globalThis.fetch;
  const inits = [];
  globalThis.fetch = async (_url, init) => { inits.push(init); return new Response(null, { status: 204 }); };
  const injector = angular.createEnvironmentInjector([
    http.FetchBackend,
    { provide: angular.NgZone, useValue: { runOutsideAngular: fn => fn(), run: fn => fn() } },
  ]);
  try {
    const backend = injector.get(http.FetchBackend);
    const response = await require('rxjs').lastValueFrom(backend.handle(new http.HttpRequest('GET', apiOrigin + '/auth/session', { redirect: 'error', withCredentials: true })));
    assert.equal(response.status, 204); assert.equal(inits.length, 1);
    assert.equal(inits[0].redirect, 'error'); assert.equal(inits[0].credentials, 'include');
  } finally { injector.destroy(); globalThis.fetch = originalFetch; }
});


test('voice transport preserves canonical context, uses session CSRF and removes demo authorization', async () => {
  const f = await fixture(); await f.authenticated();
  for (const [method, suffix] of [['GET', '/capabilities'], ['POST', '']]) {
    const request = new f.http.HttpRequest(method, apiOrigin + '/api/praxis/config/ai/transcriptions' + suffix, null, { headers: new f.http.HttpHeaders({
      Authorization: 'Bearer demo', 'X-Tenant-ID': 'tenant-a', 'X-User-ID': 'operator', 'X-Env': 'prod',
      'X-Praxis-Context-Version': 'current-version', 'X-XSRF-TOKEN': 'caller-token',
    }) });
    let sent;
    f.interceptor(request, next => { sent = next; return new Subject(); });
    assert.equal(sent.withCredentials, true); assert.equal(sent.redirect, 'error');
    assert.equal(sent.headers.has('Authorization'), false);
    assert.equal(sent.headers.get('X-Praxis-Context-Version'), 'current-version');
    assert.equal(sent.headers.get('X-Tenant-ID'), 'tenant-a');
    assert.equal(sent.headers.get('X-XSRF-TOKEN'), method === 'POST' ? 'raw-current' : null);
  }
});

test('session generation invalidates shared runtime synchronously, stale401 does not', async () => {
  const f = await fixture();
  const restore = f.service.restore();
  assert.equal(f.invalidations.length, 1, 'before session HTTP completes');
  f.reply(204, { 'X-XSRF-TOKEN': 'current' }); await restore;
  const generation = f.service.generation();
  f.service.unauthorized(generation);
  assert.equal(f.invalidations.length, 2);
  f.service.unauthorized(generation);
  assert.equal(f.invalidations.length, 2, 'obsolete session failure cannot clear new context');
  await f.authenticated();
  const before = f.invalidations.length;
  const logout = f.service.logout();
  assert.equal(f.invalidations.length, before + 1, 'logout invalidates before HTTP confirmation');
  f.reply(503); await logout;
});

test('root session and corporate route share the same authority through real Angular DI', async () => {
  const http = await libraries;
  const ng = await import('@angular/core');
  const core = await import('@praxisui/core');
  const providers = compile('src/app/core/corporate-runtime.providers.ts', id => {
    if (id === '@praxisui/core') return core;
    if (id === './corporate-navigation.service') return { CorporateNavigationService: class {} };
    if (id === './corporate-page-pilot.service') return { CorporatePagePilotService: class {} };
    throw Error(`Unexpected provider import: ${id}`);
  });
  const { CorporateSessionService: Session } = compile('src/app/core/corporate-session.service.ts', id => {
    if (id === '@angular/core') return ng;
    if (id === '@angular/common/http') return http;
    if (id === '@praxisui/core') return core;
    if (id === 'rxjs') return require('rxjs');
    if (id === './platform.config') return { PRAXIS_API_ORIGIN: apiOrigin };
    if (id === './corporate-session-target') return target;
    throw Error(`Unexpected service import: ${id}`);
  });
  const rootInjector = ng.createEnvironmentInjector([
    { provide: http.HttpBackend, useValue: { handle: () => { throw Error('No network expected'); } } },
    { provide: http.HttpClient, useValue: {} },
    ...providers.CORPORATE_RUNTIME_AUTHORITY_PROVIDERS,
    { provide: Session, useFactory: () => new Session() },
  ]);
  const routeInjector = ng.createEnvironmentInjector(providers.CORPORATE_RUNTIME_PROVIDERS, rootInjector);
  try {
    const runtime = rootInjector.get(core.EnterpriseRuntimeContextService);
    assert.equal(routeInjector.get(core.EnterpriseRuntimeContextService), runtime);
    assert.equal(routeInjector.get(Session), rootInjector.get(Session));
    assert.equal(runtime.options.includeGlobalFetchHeaders, false);
    assert.equal(runtime.options.errorPolicy, 'fail');
    let emissions = 0;
    const subscription = routeInjector.get(core.EnterpriseRuntimeContextService).contextChanges$.subscribe(() => emissions++);
    const session = rootInjector.get(Session);
    const before = emissions;
    session.unauthorized(session.generation());
    assert.equal(emissions, before + 1, 'route and root subscribers invalidate synchronously together');
    subscription.unsubscribe();
    assert.match(fs.readFileSync(path.join(root, 'src/app/app.config.ts'), 'utf8'), /\.\.\.CORPORATE_RUNTIME_AUTHORITY_PROVIDERS/);
  } finally { routeInjector.destroy(); rootInjector.destroy(); }
});
