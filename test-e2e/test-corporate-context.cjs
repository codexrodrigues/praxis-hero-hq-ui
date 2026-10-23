const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium, expect } = require(require.resolve('@playwright/test', { paths: [__dirname, path.resolve(__dirname, '../../praxis-ui-angular/node_modules')] }));
const BASE = 'http://127.0.0.1:4302';
(async () => {
 const browser = await chromium.launch({ headless: true });
 const session = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
 await session.addInitScript(() => {
   window.__runtimeCredentials = [];
   const nativeFetch = window.fetch;
   window.fetch = function(input, init) {
     const url = typeof input === 'string' ? input : input.url;
     if (url.includes('/praxis/runtime/')) window.__runtimeCredentials.push(init?.credentials ?? (input instanceof Request ? input.credentials : 'same-origin'));
     return nativeFetch.apply(this, arguments);
   };
   const open = XMLHttpRequest.prototype.open, send = XMLHttpRequest.prototype.send;
   XMLHttpRequest.prototype.open = function(method, url) { this.__runtimeRequest = String(url).includes('/praxis/runtime/'); return open.apply(this, arguments); };
   XMLHttpRequest.prototype.send = function() { if (this.__runtimeRequest) window.__runtimeCredentials.push(this.withCredentials ? 'include' : 'same-origin'); return send.apply(this, arguments); };
 });
 const page = await session.newPage();
 const pageErrors = []; page.on('pageerror', e => pageErrors.push(e.message));
 let selected = false, failure = 0, conflict = false, holdChoices = false, pendingChoices;
 const puts = [], runtimeRequests = [];
 const settled = new Set();
 session.on('requestfinished', request => settled.add(request));
 session.on('requestfailed', request => settled.add(request));
 const context = () => ({ schemaVersion: 'praxis-enterprise-runtime-context.v1', state: selected ? 'ready' : 'selection-required', selectionVersion: selected ? 'selection-2' : 'selection-1', user: { userId: 'server.alice', displayName: 'Alice do servidor', resolvedFromServerPrincipal: true }, effectiveContext: selected ? { contextVersion: 'context-2', activeTenant: { tenantId: 'server-tenant', label: 'Organização do servidor' }, activeOrganizationId: 'server-org', environment: 'homolog', locale: 'pt-BR', timezone: null, activeProfileId: null, activeModuleKey: null, capabilities: [], authorities: [] } : null, reasonCode: null, resolvedAt: '2026-10-23T19:30:00Z' });
 await session.route('**/api/**', async route => {
   const req = route.request(), url = new URL(req.url());
   if (url.pathname.startsWith('/api/praxis/runtime/')) {
     runtimeRequests.push({ url: url.pathname, headers: req.headers() });
     assert.equal(req.headers()['authorization'], undefined, 'No synthetic persona bearer on runtime');
     assert.equal(req.headers()['x-tenant'], undefined, 'No duplicate demo tenant header');
     if (url.pathname === '/api/praxis/runtime/context' && req.method() === 'GET') {
       assert.equal(req.headers()['x-user-id'], undefined, 'Bootstrap cannot send persona identity');
       assert.equal(req.headers()['x-tenant-id'], undefined, 'Bootstrap cannot send persona tenant');
       if (failure) return route.fulfill({ status: failure, json: { code: 'PRIVATE_INTERNAL_ERROR', detail: 'do-not-render-secret' } });
       return route.fulfill({ json: context() });
     }
     if (url.pathname === '/api/praxis/runtime/context' && req.method() === 'PUT') {
       puts.push(req.postDataJSON());
       if (conflict) return route.fulfill({ status: 409, json: { code: 'STALE_SELECTION' } });
       selected = true; return route.fulfill({ json: context() });
     }
     if (url.pathname.endsWith('/context/choices')) {
       if (holdChoices) { holdChoices = false; pendingChoices = route; return; }
       if (selected) {
         assert.equal(req.headers()['x-tenant-id'], 'server-tenant', 'Server-confirmed scope survives interceptor');
         assert.equal(req.headers()['x-user-id'], 'server.alice');
         assert.equal(req.headers()['x-praxis-context-version'], 'context-2');
       }
       return route.fulfill({ json: { items: [{ choiceRef: url.searchParams.has('cursor') ? 'opaque-choice-2' : 'opaque-choice-1', label: url.searchParams.has('cursor') ? 'Operações secundárias' : 'Operações corporativas', facets: {} }], nextCursor: url.searchParams.has('cursor') ? null : 'opaque-cursor' } });
     }
     throw new Error(`Unexpected runtime endpoint: ${req.method()} ${url.pathname}`);
   }
   return route.fulfill({ json: req.method() === 'POST' ? { content: [], totalElements: 0 } : {} });
 });
 try {
   await page.goto(`${BASE}/workspace-corporativo`);
   await expect(page.getByRole('heading', { name: 'Seu contexto de trabalho' })).toBeVisible();
   await page.getByRole('button', { name: 'Carregar mais contextos' }).click();
   await expect(page.getByRole('button', { name: 'Operações secundárias' })).toBeVisible();
   await page.getByRole('button', { name: 'Operações corporativas', exact: true }).click();
   await expect(page.getByTestId('context-confirmed')).toContainText('Alice do servidor');
   await expect(page.getByTestId('context-confirmed')).toContainText('Organização do servidor');
   assert.deepEqual(puts[0], { choiceRef: 'opaque-choice-1', expectedSelectionVersion: 'selection-1' });
   await page.reload();
   await expect(page.getByTestId('context-confirmed')).toContainText('homolog');
   await page.screenshot({ path: '/tmp/praxis-p3c-context-desktop.png', fullPage: true });
   conflict = true;
   await page.getByRole('button', { name: 'Operações corporativas', exact: true }).click();
   await expect(page.getByTestId('context-error')).toContainText('mudou em outra operação');
   await expect(page.getByTestId('context-confirmed')).toHaveCount(0);
   assert.deepEqual(puts[1], { choiceRef: 'opaque-choice-1', expectedSelectionVersion: 'selection-2' });
   conflict = false;
   for (const status of [401, 403, 503]) {
     failure = status;
     await page.getByRole('button', { name: 'Atualizar contextos' }).click();
     await expect(page.getByTestId('context-error')).toContainText(status === 401 ? 'sessão autenticada' : status === 403 ? 'não tem acesso' : 'Não foi possível confirmar');
     await expect(page.getByTestId('context-confirmed')).toHaveCount(0);
     await expect(page.getByRole('button', { name: 'Operações corporativas', exact: true })).toHaveCount(0);
     await expect(page.locator('body')).not.toContainText('do-not-render-secret');
   }
   await page.setViewportSize({ width: 390, height: 844 });
   await expect(page.getByRole('button', { name: 'Fechar navegação', exact: true })).not.toBeInViewport();
   assert.ok(await page.getByTestId('corporate-context').evaluate(el => [...el.querySelectorAll('header,h1,p,button,a,.actions,.scope-note')].every(child => { const box = child.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth; })), 'Mobile text and action bounds fit the viewport, even when the shell clips overflow');
   await page.screenshot({ path: '/tmp/praxis-p3c-context-narrow.png', fullPage: true });
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No mobile document overflow');
   await page.setViewportSize({ width: 1440, height: 1000 });
   failure = 0; holdChoices = true;
   await page.getByRole('button', { name: 'Atualizar contextos' }).click();
   await expect.poll(() => !!pendingChoices).toBe(true);
   await page.getByTestId('persona-switcher').click();
   await page.getByTestId('persona-option-tony.stark').click();
   await expect(page.getByRole('button', { name: 'Operações corporativas', exact: true })).toBeVisible();
   await page.getByTestId('persona-switcher').click();
   await page.getByTestId('persona-option-nick.fury').click();
   await expect(page.getByRole('button', { name: 'Operações corporativas', exact: true })).toBeVisible();
   await pendingChoices.fulfill({ json: { items: [{ choiceRef: 'obsolete', label: 'OBSOLETE-A', facets: {} }], nextCursor: null } }).catch(() => {});
   await expect(page.getByTestId('corporate-context')).toHaveCount(1);
   await expect(page).toHaveURL(`${BASE}/workspace-corporativo`);
   await expect(page.getByRole('button', { name: 'Atualizar contextos' })).toBeEnabled();
   await expect.poll(() => settled.has(pendingChoices.request())).toBe(true);
   await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
   await expect(page.locator('body')).not.toContainText('OBSOLETE-A');
   const credentials = await page.evaluate(() => window.__runtimeCredentials);
   assert.ok(credentials.length > 0 && credentials.every(value => value === 'include'), 'Runtime requests explicitly include session credentials');
   await page.getByRole('link', { name: 'Continuar no laboratório local' }).click();
   await expect(page).toHaveURL(`${BASE}/laboratorio`);
   assert.equal(runtimeRequests.filter(r => /navigation|pages/.test(r.url)).length, 0, 'Context entry does not claim page publication/navigation adoption');
   assert.deepEqual(pageErrors, []);
   console.log('PASS: actual published SDK context/choices/CAS -> server-confirmed headers -> reload -> pagination -> 409/401/403/503 -> no raw errors/demo claims -> persona A/B/A obsolete callback -> local lab remains available; desktop/narrow. APIs intercepted; no real corporate HTTP/Neon proof.');
 } catch (error) {
   await page.screenshot({ path: '/tmp/praxis-p3c-context-failure.png', fullPage: true });
   require('node:fs').writeFileSync('/tmp/praxis-p3c-context-failure.html', await page.content());
   throw error;
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
