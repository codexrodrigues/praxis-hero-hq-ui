// Controlled consumer contract proof. No real backend, membership, cookie or Neon claim.
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium, expect } = require(require.resolve('@playwright/test', { paths: [__dirname, path.resolve(__dirname, '../../praxis-ui-angular/node_modules')] }));
const BASE = 'http://127.0.0.1:4302';
const EDITOR = '/workspace-corporativo/paginas';
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const pageId = id(1), draftId = id(2), releaseId = id(3), revisionId = id(4), assignmentId = id(5);
const target = { componentType: 'praxis-dynamic-page', componentId: pageId };
const seed = { kind: 'praxis.dynamic-page.editor', version: 1, config: { definition: { widgets: [
  { key: id(7), definition: { id: 'praxis-dynamic-form', inputs: { config: { title: 'Corporate page', fieldMetadata: [] } } } },
] }, presentation: { title: 'Corporate page', icon: 'home' }, navigation: [] } };
const state = { created: false, creationKey: '', draftVersion: 10, reviewVersion: 20, headVersion: 30,
  selectedRevision: null, selectedAssignment: null, frozen: false, review: 'DRAFT', published: false,
  document: structuredClone(seed), createLost: true, conflict: true, requests: [], failure: 0 };
const quote = n => `"${id(n)}"`;
const head = () => ({ rootTarget: target, activeReleaseRef: releaseId, headEtag: id(state.headVersion), updatedAt: '2026-10-24T20:00:00Z' });
const draft = () => ({ schemaVersion: 'praxis.ui-layout-draft-workspace/v1', draft: {
  draftRef: draftId, rootTarget: target, state: state.frozen ? 'RELEASED' : 'DRAFT', draftEtag: id(state.draftVersion),
  createdAt: '2026-10-24T20:00:00Z', updatedAt: '2026-10-24T20:00:00Z',
}, targets: [{ target, authoringDocumentType: seed.kind, authoringSchemaRef: 'fixture', authoringSchemaVersion: '1',
  patchSchemaRef: 'fixture', patchSchemaVersion: '1', baseline: { document: seed }, working: { document: state.document },
  selectedRevision: state.selectedRevision, selectedAssignment: state.selectedAssignment }],
  frozenReleaseRef: state.frozen ? releaseId : null, freezeCommandRef: null });
const review = () => ({ releaseRef: releaseId, rootTarget: target, state: state.review, reviewEtag: id(state.reviewVersion), submittedAt: null });
const creation = () => ({ creationKey: state.creationKey, pageId, target, routePath: `/pages/${pageId}`, draftId,
  draftEtag: quote(state.draftVersion), source: { kind: 'registered-native', sourceId: 'quickstart:corporate-page', revision: '2' } });
const contexts = [];
async function client(browser, actor) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }); contexts.push(context);
  let tenant = 'lab-a', sessionAvailable = true, holdRevision = false, heldRevision = null;
  let contextReads = 0;
  const raw = () => `fixture-${actor}-csrf`;
  const runtime = () => ({ schemaVersion: 'praxis-enterprise-runtime-context.v1', state: 'ready', selectionVersion: 'selection-1',
    user: { userId: actor, displayName: actor, resolvedFromServerPrincipal: true }, effectiveContext: {
      contextVersion: `context-${actor}-${tenant}`, activeTenant: { tenantId: tenant }, activeOrganizationId: 'org-1',
      environment: 'lab', locale: 'pt-BR', timezone: null, activeProfileId: null, activeModuleKey: null,
      capabilities: actor === 'author' ? ['ui.authoring.configure'] : actor === 'publisher' ? ['ui.layout.publish'] : [], authorities: [] }, reasonCode: null, resolvedAt: '2026-10-24T20:00:00Z' });
  await context.route('**/auth/**', route => route.fulfill({ status: sessionAvailable ? 204 : 401, headers: sessionAvailable ? { 'X-XSRF-TOKEN': raw() } : {} }));
  await context.route('**/api/**', async route => {
    const req = route.request(), url = new URL(req.url()), method = req.method(), headers = req.headers();
    if (!url.pathname.startsWith('/api/praxis/')) return route.fulfill({ json: {} });
    const corporate = ['/api/praxis/runtime', '/api/praxis/config/pages', '/api/praxis/config/ui-layouts'].some(root => url.pathname.startsWith(root));
    if (!corporate) {
      assert.equal(url.href.includes(pageId), false, 'Published runtime must not read independent per-page/child configuration');
      return route.fulfill({ json: {} });
    }
    assert.equal(headers.authorization, undefined); assert.equal(headers['x-tenant'], undefined); assert.equal(headers['x-user'], undefined);
    if (url.pathname === '/api/praxis/runtime/context') { contextReads++; return route.fulfill({ json: runtime() }); }
    if (url.pathname === '/api/praxis/runtime/navigation') return route.fulfill({ json: { schemaVersion: 'praxis-enterprise-runtime-navigation.v1', contextVersion: runtime().effectiveContext.contextVersion, receiptEtag: 'nav-receipt', headReceipts: [], nodes: [], nextCursor: null } });
    if (url.pathname.endsWith('/context/choices')) return route.fulfill({ json: { items: [], nextCursor: null } });
    assert.equal(headers['x-praxis-context-version'], runtime().effectiveContext.contextVersion);
    assert.equal(headers['x-tenant-id'], tenant); assert.equal(headers['x-user-id'], actor);
    if (method !== 'GET') assert.equal(headers['x-xsrf-token'], raw());
    const body = req.postData() ? req.postDataJSON() : null;
    state.requests.push({ actor, method, path: url.pathname, body, match: headers['if-match'], absent: headers['if-none-match'] });
    const json = (body, etag, status = 200) => route.fulfill({ status, json: body, headers: { ETag: etag } });
    if (url.pathname === '/api/praxis/config/pages' && method === 'POST') {
      assert.equal(actor, 'author'); assert.deepEqual(Object.keys(body).sort(), ['creationKey', 'source', 'title']);
      assert.deepEqual(body.source, { kind: 'registered-native', sourceId: 'quickstart:corporate-page', revision: '2' });
      assert.match(body.creationKey, /^[0-9a-f-]{36}$/);
      state.creationKey = body.creationKey; state.created = true; state.document.config.presentation.title = body.title;
      if (state.createLost) { state.createLost = false; return route.abort('failed'); }
      return json(creation(), quote(state.draftVersion), 201);
    }
    if (url.pathname.endsWith('/pages/by-creation-key')) {
      assert.equal(url.searchParams.get('creationKey'), state.creationKey);
      return json(creation(), quote(state.draftVersion));
    }
    if (url.pathname === `/api/praxis/config/pages/${pageId}/published`) {
      if (state.failure) return route.fulfill({ status: state.failure, json: { detail: 'PRIVATE_DO_NOT_RENDER' } });
      if (!state.published || tenant !== 'lab-a') return route.fulfill({ status: 404 });
      return json({ schemaVersion: 'praxis.published-page/v1', pageId, route: `/pages/${pageId}`, document: state.document,
        contextVersion: runtime().effectiveContext.contextVersion, receiptEtag: 'published-receipt', head: head(), copySource: { kind: 'published-page', pageId, releaseId, revisionId } }, 'W/"published-http"');
    }
    if (url.pathname === '/api/praxis/config/pages') return json({ schemaVersion: 'praxis.page-catalog/v1',
      contextVersion: runtime().effectiveContext.contextVersion, receiptEtag: 'catalog-receipt', nextCursor: null,
      items: state.published ? [{ pageId, rootTarget: target, route: `/pages/${pageId}`, title: state.document.config.presentation.title, icon: 'home', head: head() }] : [] }, 'W/"catalog-http"');
    assert.equal(url.searchParams.get('rootComponentType'), target.componentType);
    assert.equal(url.searchParams.get('rootComponentId'), pageId);
    if (url.pathname.endsWith(`/drafts/${draftId}`)) return actor === 'author' ? json(draft(), quote(state.draftVersion)) : route.fulfill({ status: 403 });
    if (url.pathname.endsWith('/revisions')) {
      assert.equal(actor, 'author'); assert.equal(headers['if-match'], quote(state.draftVersion));
      assert.match(body.commandRef, /^[0-9a-f-]{36}$/); assert.deepEqual(body.target, target);
      assert.deepEqual(body.authoringDocument.config.definition, seed.config.definition);
      assert.deepEqual(body.authoringDocument.config.navigation, []);
      if (state.conflict) { state.conflict = false; return route.fulfill({ status: 412 }); }
      if (holdRevision) { holdRevision = false; heldRevision = route; return; }
      state.document = body.authoringDocument; state.draftVersion++; state.selectedRevision = { revisionRef: revisionId };
      return json({ revision: { revisionRef: revisionId }, nextDraft: draft() }, quote(state.draftVersion), 201);
    }
    if (url.pathname.endsWith('/assignments')) {
      assert.equal(headers['if-match'], quote(state.draftVersion)); assert.equal(actor, 'author');
      assert.deepEqual(body.selector, { tenant: 'lab-a', organization: 'org-1' }); assert.equal(body.layerClass, 'ORGANIZATION');
      state.selectedAssignment = { assignmentRevisionRef: assignmentId }; state.draftVersion++;
      return json({ assignment: state.selectedAssignment, nextDraft: draft() }, quote(state.draftVersion), 201);
    }
    if (url.pathname.endsWith(`/drafts/${draftId}/releases`)) {
      assert.equal(headers['if-match'], quote(state.draftVersion)); assert.equal(actor, 'author');
      state.frozen = true; state.draftVersion++;
      return json({ release: { releaseRef: releaseId, rootTarget: target, memberCount: 1 }, nextDraft: draft(), review: review() }, quote(state.draftVersion), 201);
    }
    if (url.pathname.endsWith('/review')) return json(review(), quote(state.reviewVersion));
    if (url.pathname.endsWith('/release-head')) return state.published ? json(head(), quote(state.headVersion)) : state.withdrawn ? json({ ...head(), activeReleaseRef: null }, quote(state.headVersion)) : route.fulfill({ status: 404 });
    if (url.pathname.endsWith('/submit')) {
      assert.equal(actor, 'author'); assert.equal(headers['if-match'], quote(state.reviewVersion));
      state.review = 'SUBMITTED'; state.reviewVersion++; return json(review(), quote(state.reviewVersion));
    }
    if (url.pathname.endsWith('/approve')) {
      assert.equal(actor, 'publisher'); assert.equal(headers['if-match'], quote(state.reviewVersion));
      assert.ok(body.reason); state.review = 'APPROVED'; state.reviewVersion++; return json(review(), quote(state.reviewVersion));
    }
    if (url.pathname.endsWith('/release-head/publish')) {
      assert.equal(actor, 'publisher'); assert.equal(headers['if-none-match'], '*'); assert.equal(headers['if-match'], undefined);
      assert.equal(body.releaseId, releaseId); assert.equal(state.review, 'APPROVED');
      state.published = true; state.withdrawn = false; return json(head(), quote(state.headVersion));
    }
    if (url.pathname.endsWith('/release-head/rollback')) {
      assert.equal(actor, 'publisher'); assert.equal(headers['if-match'], quote(state.headVersion));
      assert.equal(state.review, 'APPROVED'); assert.ok(body.reason);
      state.headVersion++; state.published = true; state.withdrawn = false;
      return json({ ...head(), activeReleaseRef: body.releaseId }, quote(state.headVersion));
    }
    if (url.pathname.endsWith('/release-head/withdraw')) {
      assert.equal(actor, 'publisher'); assert.equal(headers['if-match'], quote(state.headVersion));
      assert.ok(body.reason);
      state.headVersion++; state.published = false; state.withdrawn = true;
      return json({ ...head(), activeReleaseRef: null }, quote(state.headVersion));
    }
    throw Error('Unexpected controlled corporate operation');
  });
  const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.name));
  return { page, errors, tenant: value => { tenant = value; }, actor: value => { actor = value; },
    session: value => { sessionAvailable = value; }, contextReads: () => contextReads,
    holdRevision: () => { holdRevision = true; }, held: () => !!heldRevision,
    releaseRevision: async () => {
      const old = draft(); old.targets[0].working = { document: { ...state.document, config: { ...state.document.config, presentation: { title: 'Resposta antiga', icon: 'home' } } } };
      await heldRevision.fulfill({ status: 201, json: { revision: { revisionRef: revisionId }, nextDraft: old }, headers: { ETag: quote(state.draftVersion) } });
      heldRevision = null;
    } };
}
(async () => {
  // The fixture is the registered source, never an editor/runtime normalization of old authorship.
  await import('@angular/compiler');
  const core = await import('@praxisui/core');
  const form = await import('@praxisui/dynamic-form');
  const original = structuredClone(seed);
  assert.equal(core.validatePageAuthoringDocument(seed, { 'praxis-dynamic-form': form.validateDynamicFormPageWidget }).ok, true);
  const widget = seed.config.definition.widgets[0];
  const projection = form.materializeDynamicFormPageRuntimeInputs(widget.definition.inputs, pageId, widget.key);
  assert.deepEqual(projection.diagnostics, []);
  assert.ok(projection.inputs);
  assert.equal(projection.inputs.configPersistenceStrategy, 'volatile');
  assert.equal(projection.inputs.formId, core.derivePageChildRuntimeId(pageId, widget.key));
  assert.deepEqual(seed, original, 'Runtime projection must not mutate registered authorship');
  const obsolete = structuredClone(seed);
  obsolete.config.definition.widgets[0].definition.inputs.config = { title: 'Corporate page', fields: [] };
  assert.equal(core.validatePageAuthoringDocument(obsolete, { 'praxis-dynamic-form': form.validateDynamicFormPageWidget }).ok, false,
    'The former source is rejected, never converted by the consumer');
  const browser = await chromium.launch({ headless: true });
  try {
    const author = await client(browser, 'author'); const page = author.page;
    await page.goto(BASE + EDITOR);
    await expect(page.getByRole('button', { name: 'Criar rascunho', exact: true })).toBeVisible();
    await page.getByLabel('Título da nova página', { exact: true }).fill('Página admitida');
    await page.getByRole('button', { name: 'Criar rascunho', exact: true }).click();
    await expect(page.getByTestId('corporate-page-message')).toContainText('Resultado incerto');
    const createCount = () => state.requests.filter(r => r.method === 'POST' && r.path === '/api/praxis/config/pages').length;
    assert.equal(createCount(), 1);
    await expect(page.getByRole('button', { name: 'Criar rascunho', exact: true })).toBeDisabled();
    assert.equal(new URL(page.url()).searchParams.get('creationKey'), state.creationKey);
    await page.getByRole('button', { name: 'Consultar criação', exact: true }).click();
    await expect(page.getByTestId('draft-state')).toHaveText('DRAFT'); assert.equal(createCount(), 1);
    await page.getByLabel('Título da página', { exact: true }).fill('Título publicado');
    await page.getByLabel('Motivo da alteração ou decisão', { exact: true }).fill('Revisão explícita da fixture');
    await page.getByRole('button', { name: 'Salvar revisão', exact: true }).click();
    await expect(page.getByTestId('corporate-page-message')).toContainText('estado mudou');
    await expect(page.getByRole('button', { name: 'Salvar revisão', exact: true })).toBeDisabled();
    assert.equal(state.requests.filter(r => r.path.endsWith('/revisions')).length, 1);
    await page.getByRole('button', { name: 'Reler estado do servidor', exact: true }).click();
    await expect(page.getByLabel('Título da página', { exact: true })).toHaveValue('Página admitida');
    await page.getByLabel('Título da página', { exact: true }).fill('Título publicado');
    await page.getByRole('button', { name: 'Salvar revisão', exact: true }).click();
    await expect(page.getByTestId('corporate-page-message')).toContainText('Revisão salva');
    const revisions = state.requests.filter(r => r.path.endsWith('/revisions'));
    assert.equal(revisions.length, 2); assert.equal(revisions[0].body.commandRef, revisions[1].body.commandRef, 'Same exact attempt retains command identity');
    // Invoke the real SESSION readback while a lifecycle response is pending; never assign grants or JS state.
    author.holdRevision();
    await page.getByLabel('Título da página', { exact: true }).fill('Resposta antiga');
    await page.getByRole('button', { name: 'Salvar revisão', exact: true }).click();
    await expect.poll(author.held).toBe(true);
    author.session(false);
    await page.evaluate(async () => {
      const component = window.ng.getComponent(document.querySelector('app-corporate-pages'));
      await component.session.restore();
    });
    await expect(page.getByTestId('draft-state')).toHaveCount(0);
    const contextReadsBefore = author.contextReads();
    author.actor('new-reader'); author.session(true);
    await page.getByRole('button', { name: 'Confirmar sessão e contexto', exact: true }).click();
    await expect(page.getByTestId('corporate-page-message')).toContainText('permissão');
    assert.ok(author.contextReads() > contextReadsBefore, 'New SESSION must fetch context rather than reuse previous actor/capabilities');
    const lateResponse = page.waitForResponse(response => response.url().includes('/revisions') && response.status() === 201);
    await author.releaseRevision(); await lateResponse;
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await expect(page.getByTestId('draft-state')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('Resposta antiga');
    author.actor('author');
    await page.evaluate(async () => {
      const component = window.ng.getComponent(document.querySelector('app-corporate-pages'));
      await component.session.restore();
    });
    await page.getByRole('button', { name: 'Confirmar sessão e contexto', exact: true }).click();
    await expect(page.getByTestId('draft-state')).toHaveText('DRAFT');
    assert.equal(state.requests.filter(r => r.path.endsWith('/revisions')).length, 3, 'No replay after SESSION replacement');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: 'Fechar navegação', exact: true })).not.toBeInViewport();
    await expect.poll(() => page.getByTestId('corporate-pages').evaluate(el =>
      [...el.querySelectorAll('h1,h2,p,a,button,input,textarea,label,mat-form-field')]
        .filter(child => child.getClientRects().length)
        .every(child => { const box = child.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth; })
    )).toBe(true);
    await page.getByLabel('Título da página', { exact: true }).focus(); await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Aplicar à organização atual', exact: true })).toBeFocused();
    await page.getByLabel('Motivo da alteração ou decisão', { exact: true }).focus();
    await page.keyboard.type('Revisão retomada'); await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Aplicar à organização atual', exact: true })).toBeFocused();
    await page.screenshot({ path: '/tmp/praxis-hero-corporate-pages-narrow.png', fullPage: true, animations: 'disabled' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Aplicar à organização atual', exact: true }).click();
    await expect(page.getByTestId('corporate-page-message')).toContainText('Abrangência');
    await page.getByRole('button', { name: 'Congelar release', exact: true }).click();
    await expect(page.getByTestId('review-state')).toHaveText('DRAFT');
    await page.getByRole('button', { name: 'Enviar para revisão', exact: true }).click();
    await expect(page.getByTestId('review-state')).toHaveText('SUBMITTED');
    await expect(page.getByRole('button', { name: 'Aprovar release identificada', exact: true })).toBeDisabled();
    const reviewUrl = await page.getByTestId('review-link').getAttribute('href');
    assert.equal(new URL(reviewUrl, BASE).searchParams.get('draftId'), null, 'Reviewer link does not demand author draft access');
    assert.equal(state.published, false, 'Submit never publishes implicitly');
    const publisher = await client(browser, 'publisher');
    await publisher.page.goto(new URL(reviewUrl, BASE).href);
    await expect(publisher.page.getByTestId('review-state')).toHaveText('SUBMITTED');
    assert.equal(state.requests.filter(r => r.actor === 'publisher' && r.path.includes('/drafts/')).length, 0);
    await publisher.page.getByLabel('Motivo da alteração ou decisão', { exact: true }).fill('Decisão explícita da fixture');
    await publisher.page.getByRole('button', { name: 'Aprovar release identificada', exact: true }).click();
    await expect(publisher.page.getByTestId('review-state')).toHaveText('APPROVED'); assert.equal(state.published, false);
    await publisher.page.getByRole('button', { name: 'Publicar release aprovada', exact: true }).click();
    await expect(publisher.page.getByTestId('published-page')).toContainText('Título publicado');
    await publisher.page.getByRole('button', { name: 'Atualizar catálogo', exact: true }).click();
    await expect(publisher.page.getByRole('link', { name: 'Título publicado', exact: true })).toHaveAttribute('href', `/pages/${pageId}`);
    await publisher.page.getByTestId('published-route').click();
    await expect(publisher.page).toHaveURL(BASE + `/pages/${pageId}`);
    await publisher.page.reload(); await expect(publisher.page.getByTestId('published-page')).toContainText('Título publicado');
    await expect(publisher.page.locator('praxis-dynamic-page praxis-dynamic-form')).toHaveCount(1);
    const publishedContextReads = publisher.contextReads();
    state.failure = 401;
    // Keep the browser and shared route injector: this must invalidate an existing SDK snapshot.
    await publisher.page.getByRole('link', { name: 'Páginas corporativas', exact: true }).click();
    await publisher.page.getByRole('link', { name: 'Título publicado', exact: true }).click();
    await expect(publisher.page.getByTestId('published-page')).toHaveCount(0);
    await expect(publisher.page.getByRole('button', { name: 'Confirmar sessão e contexto', exact: true })).toBeVisible();
    state.failure = 0; publisher.actor('author');
    await publisher.page.getByRole('button', { name: 'Confirmar sessão e contexto', exact: true }).click();
    await expect(publisher.page.getByTestId('published-page')).toContainText('Título publicado');
    assert.ok(publisher.contextReads() > publishedContextReads, '401 then new SESSION forces current actor context');
    state.failure = 403;
    await publisher.page.reload(); await expect(publisher.page.getByTestId('corporate-page-message')).toContainText('permissão');
    await expect(publisher.page.getByTestId('published-page')).toHaveCount(0);
    await expect(publisher.page.locator('body')).not.toContainText('PRIVATE_DO_NOT_RENDER');
    state.failure = 0; publisher.tenant('lab-b');
    await publisher.page.reload(); await expect(publisher.page.getByTestId('corporate-page-message')).toContainText('Não encontrado');
    await expect(publisher.page.getByTestId('published-page')).toHaveCount(0);
    // Verify browser E2E rollback and withdraw on active corporate publication
    publisher.tenant('lab-a'); publisher.actor('publisher');
    await publisher.page.goto(new URL(reviewUrl, BASE).href);
    await expect(publisher.page.getByTestId('review-state')).toHaveText('APPROVED');
    await publisher.page.evaluate(() => {
      const component = window.ng.getComponent(document.querySelector('app-corporate-pages'));
      component.head.set({ etag: '"00000000-0000-4000-8000-000000000030"', body: { rootTarget: { componentType: 'praxis-dynamic-page', componentId: '00000000-0000-4000-8000-000000000001' }, activeReleaseRef: '00000000-0000-4000-8000-000000000099', headEtag: '00000000-0000-4000-8000-000000000030', updatedAt: '2026-10-24T20:00:00Z' } });
    });
    await publisher.page.getByLabel('Motivo da alteração ou decisão', { exact: true }).fill('Reverter para release aprovada anterior');
    await publisher.page.getByTestId('rollback-release').click();
    await expect(publisher.page.getByTestId('corporate-page-message')).toContainText('Rollback confirmado');
    await publisher.page.getByTestId('withdraw-publication').click();
    await expect(publisher.page.getByTestId('corporate-page-message')).toContainText('Publicação retirada');
    await expect(publisher.page.getByTestId('withdraw-publication')).toBeDisabled();
    assert.deepEqual(author.errors, []); assert.deepEqual(publisher.errors, []);
    console.log('PASS corporate page controlled journey: uncertain creation, CAS, two actors, explicit publication, reload and denied reads');
  } finally { await Promise.all(contexts.map(context => context.close())); await browser.close(); }
})().catch(error => { console.error(error.name, error.message); process.exitCode = 1; });
