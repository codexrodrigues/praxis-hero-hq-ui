// Browser consumer proof with intercepted contracts. No real SESSION/cookie/CORS/backend claim.
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium, expect } = require(require.resolve('@playwright/test', { paths: [__dirname, path.resolve(__dirname, '../../praxis-ui-angular/node_modules')] }));
const BASE = 'http://127.0.0.1:4302';
(async () => {
 const browser = await chromium.launch({ headless: true });
 const session = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
 await session.addInitScript(() => {
   window.__corporateCredentials = [];
   const matches = value => /\/(auth|api\/praxis\/runtime)\//.test(String(value));
   const nativeFetch = window.fetch;
   window.fetch = function(input, init) {
     const url = typeof input === 'string' ? input : input.url;
     if (matches(url)) window.__corporateCredentials.push(init?.credentials ?? (input instanceof Request ? input.credentials : 'same-origin'));
     return nativeFetch.apply(this, arguments);
   };
   const open = XMLHttpRequest.prototype.open, send = XMLHttpRequest.prototype.send;
   XMLHttpRequest.prototype.open = function(method, url) { this.__corporateRequest = matches(url); return open.apply(this, arguments); };
   XMLHttpRequest.prototype.send = function() { if (this.__corporateRequest) window.__corporateCredentials.push(this.withCredentials ? 'include' : 'same-origin'); return send.apply(this, arguments); };
 });
 const page = await session.newPage();
 const pageErrors = []; page.on('pageerror', e => pageErrors.push(e.name));
 let redirectLogin = false, redirectContext = false, foreignRequests = 0;
 let authenticated = false, selected = false, loginFailure = 0, failure = 0, conflict = false, logoutFailure = false, holdChoices = false, pendingChoices;
 let rawCsrf = 'fixture-session-token-1';
 const puts = [], runtimeRequests = [], authRequests = [];
 const settled = new Set(); session.on('requestfinished', r => settled.add(r)); session.on('requestfailed', r => settled.add(r));
 const context = () => ({ schemaVersion: 'praxis-enterprise-runtime-context.v1', state: selected ? 'ready' : 'selection-required', selectionVersion: selected ? 'selection-2' : 'selection-1', user: { userId: 'server.alice', displayName: 'Alice do servidor', resolvedFromServerPrincipal: true }, effectiveContext: selected ? { contextVersion: 'context-2', activeTenant: { tenantId: 'server-tenant', label: 'Organização do servidor' }, activeOrganizationId: 'server-org', environment: 'homolog', locale: 'pt-BR', timezone: null, activeProfileId: null, activeModuleKey: null, capabilities: [], authorities: [] } : null, reasonCode: null, resolvedAt: '2026-10-24T19:30:00Z' });
 await session.route('https://corporate-redirect.invalid/**', async route => {
   foreignRequests++;
   // An incorrectly following XHR would be allowed through CORS; zero requests proves the fence.
   return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': BASE,
     'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
     'Access-Control-Allow-Headers': 'content-type,x-xsrf-token,x-praxis-context-version,x-tenant-id,x-user-id' } });
 });
 await session.route('**/auth/**', async route => {
   const req = route.request(), url = new URL(req.url()); authRequests.push({ path: url.pathname, method: req.method() });
   assert.equal(req.headers()['authorization'], undefined);
   assert.equal(req.headers()['x-tenant-id'], undefined); assert.equal(req.headers()['x-user-id'], undefined);
   if (url.pathname === '/auth/login' && req.method() === 'POST') {
     if (redirectLogin) return route.fulfill({ status: 307, headers: { Location: 'https://corporate-redirect.invalid/password-target' } });
     if (loginFailure) return route.fulfill({ status: loginFailure, json: { detail: 'PRIVATE-AUTH-ERROR' } });
     assert.deepEqual(req.postDataJSON(), { username: 'fixture-operator', password: 'fixture-input-only' });
     authenticated = true; rawCsrf = 'fixture-session-token-2';
     return route.fulfill({ status: 204, headers: { 'X-XSRF-TOKEN': 'login-token-is-not-the-readback' } });
   }
   if (url.pathname === '/auth/session' && req.method() === 'GET') return route.fulfill({ status: authenticated ? 204 : 401, headers: authenticated ? { 'X-XSRF-TOKEN': rawCsrf } : {} });
   if (url.pathname === '/auth/logout' && req.method() === 'POST') {
     assert.equal(req.headers()['x-xsrf-token'], rawCsrf);
     if (logoutFailure) return route.fulfill({ status: 503 });
     authenticated = false; return route.fulfill({ status: 204 });
   }
   throw Error('Unexpected auth operation');
 });
 await session.route('**/api/**', async route => {
   const req = route.request(), url = new URL(req.url());
   if (url.pathname.startsWith('/api/praxis/runtime/')) {
     runtimeRequests.push({ path: url.pathname, method: req.method() });
     assert.equal(req.headers()['authorization'], undefined); assert.equal(req.headers()['x-tenant'], undefined);
     if (!authenticated) return route.fulfill({ status: 401 });
     if (url.pathname === '/api/praxis/runtime/context' && req.method() === 'GET') {
       assert.equal(req.headers()['x-user-id'], undefined); assert.equal(req.headers()['x-tenant-id'], undefined);
       if (failure) return route.fulfill({ status: failure, json: { code: 'PRIVATE_INTERNAL_ERROR', detail: 'do-not-render-secret' } });
       return route.fulfill({ json: context() });
     }
     if (url.pathname === '/api/praxis/runtime/context' && req.method() === 'PUT') {
       assert.equal(req.headers()['x-xsrf-token'], rawCsrf, 'Raw token from confirmed GET session');
       if (redirectContext) return route.fulfill({ status: 307, headers: { Location: 'https://corporate-redirect.invalid/csrf-target' } });
       puts.push(req.postDataJSON());
       if (conflict) return route.fulfill({ status: 409 });
       selected = true; return route.fulfill({ json: context() });
     }
     if (url.pathname.endsWith('/context/choices')) {
       if (holdChoices) { holdChoices = false; pendingChoices = route; return; }
       if (selected) {
         assert.equal(req.headers()['x-tenant-id'], 'server-tenant'); assert.equal(req.headers()['x-user-id'], 'server.alice');
         assert.equal(req.headers()['x-praxis-context-version'], 'context-2');
       }
       return route.fulfill({ json: { items: [{ choiceRef: url.searchParams.has('cursor') ? 'opaque-choice-2' : 'opaque-choice-1', label: url.searchParams.has('cursor') ? 'Operações secundárias' : 'Operações corporativas', facets: {} }], nextCursor: url.searchParams.has('cursor') ? null : 'opaque-cursor' } });
     }
     throw Error('Unexpected runtime operation');
   }
   assert.equal(url.pathname.startsWith('/api/praxis/config/pages'), false, 'Session increment does not publish pages');
   return route.fulfill({ json: req.method() === 'POST' ? { content: [], totalElements: 0 } : {} });
 });
 const assertNarrowContext = async () => {
   // Resize triggers the shell's responsive transition; do not capture the overlay mid-collapse.
   await expect(page.getByRole('button', { name: 'Fechar navegação', exact: true })).not.toBeInViewport();
   await expect.poll(() => page.getByTestId('corporate-context').evaluate(el =>
     [...el.querySelectorAll('header,h1,h2,p,button,a,input,label,form,mat-form-field,.actions,.scope-note,.confirmed')]
       .filter(child => child.getClientRects().length > 0)
       .every(child => { const box = child.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth; })
   ), { message: 'Context text and controls fit the narrow viewport even if the shell clips overflow' }).toBe(true);
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No mobile document overflow');
 };
 const enter = async () => {
   await page.getByRole('textbox', { name: 'Usuário', exact: true }).fill('fixture-operator');
   await page.getByLabel('Senha', { exact: true }).fill('fixture-input-only');
   await page.getByRole('button', { name: 'Entrar', exact: true }).click();
 };
 try {
   await page.goto(`${BASE}/workspace-corporativo`);
   await expect(page.getByTestId('session-status')).toContainText('Entre para consultar');
   const username = page.getByRole('textbox', { name: 'Usuário', exact: true });
   const password = page.getByLabel('Senha', { exact: true });
   await expect(username).toBeVisible(); await expect(password).toBeVisible();
   await expect(password).toHaveAttribute('type', 'password');
   await expect(username).toHaveValue(''); await expect(password).toHaveValue('');
   await page.screenshot({ path: '/tmp/praxis-hero-session-login.png', fullPage: true, animations: 'disabled' });
   await page.setViewportSize({ width: 390, height: 844 });
   await assertNarrowContext();
   await username.focus(); await page.keyboard.press('Tab'); await expect(password).toBeFocused();
   await page.keyboard.press('Shift+Tab'); await expect(username).toBeFocused();
   await expect(password).toHaveValue('');
   await page.screenshot({ path: '/tmp/praxis-hero-session-narrow-login.png', fullPage: true, animations: 'disabled' });
   await page.setViewportSize({ width: 1440, height: 1000 });
   for (const status of [401, 403]) {
     loginFailure = status; await enter();
     await expect(page.getByTestId('session-status')).toContainText(status === 401 ? 'Verifique suas credenciais' : 'recusada pelo servidor');
     await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('');
     await expect(page.locator('body')).not.toContainText('PRIVATE-AUTH-ERROR');
   }
   loginFailure = 0; redirectLogin = true; await enter();
   await expect(page.getByTestId('session-status')).toContainText('Não foi possível confirmar a sessão');
   assert.equal(foreignRequests, 0, 'Password307 never reaches another origin');
   redirectLogin = false; await enter();
   await expect(page.getByTestId('session-status')).toContainText('Sessão confirmada');
   await page.getByRole('button', { name: 'Carregar mais contextos' }).click();
   await expect(page.getByRole('button', { name: 'Operações secundárias', exact: true })).toBeVisible();
   await page.getByRole('button', { name: 'Operações corporativas', exact: true }).click();
   await expect(page.getByTestId('context-confirmed')).toContainText('Alice do servidor');
   assert.deepEqual(puts[0], { choiceRef: 'opaque-choice-1', expectedSelectionVersion: 'selection-1' });
   await page.reload(); await expect(page.getByTestId('context-confirmed')).toContainText('homolog');
   for (const status of [403, 503]) {
     failure = status; await page.getByRole('button', { name: 'Atualizar contextos' }).click();
     await expect(page.getByTestId('context-error')).toContainText(status === 403 ? 'não tem acesso' : 'Não foi possível confirmar');
     await expect(page.getByTestId('session-status')).toContainText('Sessão confirmada');
     await expect(page.getByTestId('context-confirmed')).toHaveCount(0);
     await expect(page.locator('body')).not.toContainText('do-not-render-secret');
   }
   failure = 0; await page.getByRole('button', { name: 'Atualizar contextos' }).click();
   conflict = true; await page.getByRole('button', { name: 'Operações corporativas', exact: true }).click();
   await expect(page.getByTestId('context-error')).toContainText('mudou em outra operação');
   assert.deepEqual(puts.at(-1), { choiceRef: 'opaque-choice-1', expectedSelectionVersion: 'selection-2' });
   conflict = false; await page.getByRole('button', { name: 'Atualizar contextos' }).click();
   redirectContext = true; await page.getByRole('button', { name: 'Operações corporativas', exact: true }).click();
   await expect(page.getByTestId('context-error')).toContainText('Não foi possível confirmar');
   assert.equal(foreignRequests, 0, 'CSRF307 never reaches another origin');
   await expect(page.getByTestId('session-status')).toContainText('Sessão confirmada');
   redirectContext = false; await page.getByRole('button', { name: 'Atualizar contextos' }).click();
   await expect(page.getByTestId('context-confirmed')).toBeVisible();
   const verifications = authRequests.length;
   await page.getByTestId('persona-switcher').click(); await page.getByTestId('persona-option-tony.stark').click();
   await page.getByTestId('persona-switcher').click(); await page.getByTestId('persona-option-nick.fury').click();
   await expect(page.getByTestId('context-confirmed')).toContainText('Alice do servidor');
   assert.equal(authRequests.length, verifications, 'Personas do not reauthenticate the corporate session');
   await page.screenshot({ path: '/tmp/praxis-p3c-context-desktop.png', fullPage: true, animations: 'disabled' });
   await page.setViewportSize({ width: 390, height: 844 });
   await assertNarrowContext();
   await page.screenshot({ path: '/tmp/praxis-p3c-context-narrow.png', fullPage: true, animations: 'disabled' });
   await page.setViewportSize({ width: 1440, height: 1000 });
   holdChoices = true; await page.getByRole('button', { name: 'Atualizar contextos' }).click();
   await expect.poll(() => !!pendingChoices).toBe(true);
   await page.getByRole('button', { name: 'Sair', exact: true }).click();
   await expect(page.getByTestId('session-status')).toContainText('Sessão encerrada neste navegador');
   await pendingChoices.fulfill({ json: { items: [{ choiceRef: 'obsolete', label: 'OBSOLETE-RESPONSE', facets: {} }], nextCursor: null } }).catch(() => {});
   await expect.poll(() => settled.has(pendingChoices.request())).toBe(true);
   await expect(page.getByTestId('context-confirmed')).toHaveCount(0);
   await expect(page.locator('body')).not.toContainText('OBSOLETE-RESPONSE');
   await enter(); await expect(page.getByTestId('context-confirmed')).toBeVisible();
   logoutFailure = true; await page.getByRole('button', { name: 'Sair', exact: true }).click();
   await expect(page.getByTestId('session-status')).toContainText('Não foi possível confirmar a saída');
   await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toHaveCount(0);
   await page.getByRole('button', { name: 'Verificar sessão' }).click();
   await expect(page.getByTestId('context-confirmed')).toBeVisible();
   logoutFailure = false;
   // A current401 invalidates the confirmed session without a local fallback.
   authenticated = false; await page.getByRole('button', { name: 'Atualizar contextos' }).click();
   await expect(page.getByTestId('session-status')).toContainText('A sessão terminou');
   await expect(page.getByTestId('context-confirmed')).toHaveCount(0);
   const credentials = await page.evaluate(() => window.__corporateCredentials);
   assert.ok(credentials.length > 0 && credentials.every(value => value === 'include'));
   const persisted = await page.evaluate(() => [...Object.values(localStorage), ...Object.values(sessionStorage)].join('|'));
   assert.equal(/fixture-input-only|fixture-session-token/.test(persisted), false);
   await page.getByRole('link', { name: 'Continuar no laboratório local' }).click(); await expect(page).toHaveURL(`${BASE}/laboratorio`);
   assert.equal(runtimeRequests.some(r => /navigation|pages/.test(r.path)), false);
   assert.deepEqual(pageErrors, []);
   console.log('PASS: intercepted session/login/logout, raw CSRF, context CAS/reload, error isolation, persona independence, late response fences, uncertain logout and local lab; no real SESSION/cookie/CORS/Neon proof.');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
