// Deterministic browser contract test: HTTP is mocked, never a remote database proof.
// Runs the actual HQ, Page Builder, Core runtime and ApiConfigStorage through public UI.
const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const appUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4302';
const definition = require('../src/app/pages/dashboard/dashboard-page.definition.json').dashboardPageDefinition;
const key = user => `dynamic-page:praxis-hero-hq:shield-hq:${user}:/`;
const pageFor = user => ({ widgets: ['one', 'two'].map(id => ({
  key: `${user}-${id}`, shell: { kind: 'dashboard-card', title: `${user} ${id}`, showHeader: true },
  definition: { id: 'praxis-rich-content', inputs: { document: {
    kind: 'praxis.rich-content', version: '1.0.0', nodes: [{ type: 'paragraph', text: `${user} ${id}` }],
  } } },
})) });

(async () => {
  const browser = await chromium.launch({headless:true});
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  const documents = new Map([[key('nick.fury'), pageFor('nick.fury')]]);
  const writes = [];
  const errors = [];
  let failSave = false, failLoad = false, failReset = false, conflictSave = false, revision = 1;
  page.on('pageerror', error => errors.push(error.message));
  // Block every API route so this test cannot mutate the configured proxy/backend.
  await context.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const id = url.searchParams.get('componentId');
    if (!url.pathname.endsWith('/praxis/config/ui') || !id?.startsWith('dynamic-page:')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({data: [], properties: {}}) });
    }
    const user = request.headers()['x-user-id'];
    assert.equal(id, key(user), 'HTTP identity and persistence key must have the same owner');
    const method = request.method();
    if (method === 'GET' && failLoad) return route.fulfill({status:503, body:'{}'});
    if (method === 'DELETE' && failReset) return route.fulfill({status:503, body:'{}'});
    if (method === 'PUT' && failSave) return route.fulfill({status:503, body:'{}'});
    if (method === 'PUT' && conflictSave) return route.fulfill({status:412, body:'{}'});
    if (method === 'PUT') {
      const payload = request.postDataJSON().payload;
      documents.set(id, payload); writes.push({id, payload}); revision++;
    }
    if (method === 'DELETE') { documents.delete(id); revision++; }
    const payload = documents.get(id);
    return route.fulfill({ status: method === 'GET' && !payload ? 404 : 200,
      contentType: 'application/json', headers: {etag: `"${revision}"`},
      body: JSON.stringify(payload ? {payload, scope:'user', version:revision} : {}) });
  });
  const status = page.getByTestId('dashboard-layout-status');
  async function switchUser(user) {
    await page.getByTestId('persona-switcher').click();
    await page.getByTestId(`persona-option-${user}`).click();
  }
  async function removeWidget(widgetKey) {
    const widget = page.locator(`[data-widget-key="${widgetKey}"]`).first();
    await widget.click();
    await widget.getByRole('button', {name: /Mais ações/}).click();
    await page.getByRole('menuitem', {name: /Excluir widget/}).click();
    await page.getByRole('button', {name: 'Excluir widget', exact: true}).click();
  }
  try {
    await page.goto(appUrl);
    await expect(status).toContainText('Layout personalizado salvo');
    await expect(page.locator('praxis-dashboard-page')).toHaveCount(0);
    await expect(page.locator('praxis-dynamic-page-builder')).toHaveCount(1);
    assert.equal(writes.length, 0, 'Opening a persisted layout must not write it back');
    await page.getByTestId('toggle-customization-btn').click();
    await removeWidget('nick.fury-two');
    await expect.poll(() => documents.get(key('nick.fury')).widgets.length).toBe(1);
    await expect(status).toContainText('Layout personalizado salvo');
    await page.reload();
    await expect(page.locator('[data-widget-key="nick.fury-two"]')).toHaveCount(0);
    await expect(page.locator('[data-widget-key="nick.fury-one"]')).toHaveCount(1);

    await switchUser('tony.stark');
    await expect(status).toContainText('Layout padrão');
    await expect(page.locator('[data-widget-key="nick.fury-one"]')).toHaveCount(0);
    await expect(page.getByTestId('toggle-customization-btn')).toBeEnabled();
    assert.equal(documents.has(key('tony.stark')), false);
    await switchUser('nick.fury');
    await expect(page.locator('[data-widget-key="nick.fury-one"]')).toHaveCount(1);

    await page.getByTestId('toggle-customization-btn').click();
    conflictSave = true;
    await removeWidget('nick.fury-one');
    await expect(status).toContainText('Conflito');
    assert.equal(documents.get(key('nick.fury')).widgets.length, 1);
    conflictSave = false;
    await page.getByTestId('reload-layout-btn').click();
    await expect(page.locator('[data-widget-key="nick.fury-one"]')).toHaveCount(1);
    await expect(status).toContainText('Layout personalizado salvo');

    // Retry a transient failure without discarding the intentionally empty draft.
    failSave = true;
    await removeWidget('nick.fury-one');
    await expect(status).toContainText('Não foi possível');
    assert.equal(documents.get(key('nick.fury')).widgets.length, 1);
    failSave = false;
    await page.getByTestId('retry-layout-btn').click();
    await expect.poll(() => documents.get(key('nick.fury')).widgets.length).toBe(0);
    await page.reload();
    await expect(status).toContainText('Layout personalizado salvo');
    await expect(page.locator('praxis-dynamic-page [data-widget-key]')).toHaveCount(0);

    await page.getByTestId('toggle-customization-btn').click();
    failReset = true;
    await page.getByTestId('reset-layout-btn').click();
    await expect(status).toContainText('Não foi possível');
    assert.equal(documents.has(key('nick.fury')), true);
    await expect(page.getByTestId('reset-layout-btn')).toBeDisabled();
    failReset = false;
    await page.getByTestId('reload-layout-btn').click();
    await expect(status).toContainText('Layout personalizado salvo');
    await page.getByTestId('reset-layout-btn').click();
    await expect(status).toContainText('Layout padrão');
    await expect(page.getByTestId('toggle-customization-btn')).toBeEnabled();
    assert.equal(documents.has(key('nick.fury')), false);
    await expect(page.locator(`[data-widget-key="${definition.widgets[0].key}"]`).first()).toBeVisible();

    failLoad = true;
    await page.reload();
    await expect(status).toContainText('Não foi possível');
    await expect(page.getByTestId('toggle-customization-btn')).toBeDisabled();
    failLoad = false;
    await page.getByTestId('reload-layout-btn').click();
    await expect(status).toContainText('Layout padrão');
    await page.setViewportSize({width:390,height:844});
    await expect(status).toBeVisible();
    assert.deepEqual(errors, [], 'No browser exceptions');
    console.log(JSON.stringify({result:'PASS', scope:'mocked HTTP browser contract, no database',
      cases:['builder-only','load-no-write','edit-save-reopen','persona-isolation','conflict-reload','empty-document','transient-save-retry','reset-ack-failure','load-failure','narrow-viewport'], writes:writes.length}));
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
