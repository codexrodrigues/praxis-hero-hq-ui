// Real components, isolated HTTP fixtures. No authentication/backend/publication proof.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { chromium, expect } = require(require.resolve('@playwright/test', { paths: [__dirname, path.resolve(__dirname, '../../../praxis-ui-angular/node_modules')] }));
const { install } = require('./brasa-deep-fixtures.cjs');
const out = path.resolve(__dirname, '../../docs/design/evidence/type-rhythm-2026-11-01');
fs.mkdirSync(out, { recursive: true });
const report = { kind: 'type/icon/rhythm browser proof / mocked HTTP', checks: [], measurements: [], captures: [], requests: [], businessWrites: [], pageErrors: [], fontAssets: [] };
const assetLoads = [], assets = new Set();
const base = 'http://127.0.0.1:4302';
async function shot(page, name) { await page.screenshot({ path: path.join(out, name + '.png'), animations: 'disabled' }); report.captures.push(name + '.png'); }
async function measure(page, selector) { return page.locator(selector).first().evaluate(el => { const c = getComputedStyle(el), r = el.getBoundingClientRect(); return { weight: c.fontWeight, family: c.fontFamily, size: parseFloat(c.fontSize), tracking: c.letterSpacing, lineHeight: c.lineHeight, axes: c.fontVariationSettings, x: r.x, width: r.width }; }); }
function watch(page) {
  page.on('pageerror', e => report.pageErrors.push(e.message));
  page.on('response', response => {
    const url = response.url();
    if (!url.includes('fonts.gstatic.com/s/materialsymbols') || assets.has(url)) return;
    assets.add(url);
    assetLoads.push((async () => { const bytes = await response.body(), hash = crypto.createHash('sha256').update(bytes).digest('hex'); const file = path.join('/tmp', 'hero-symbol-' + hash.slice(0, 12) + '.woff2'); fs.writeFileSync(file, bytes); report.fontAssets.push({ url, file, sha256: hash, bytes: bytes.length }); })());
  });
}
(async () => {
  const browser = await chromium.launch();
  try {
    for (const theme of ['insignia', 'brasa', 'classic', 'light-tech', 'dark-tech']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      await context.addInitScript(id => localStorage.setItem('praxis_hero_hq_theme', id), theme);
      await install(context, report);
      const page = await context.newPage(); watch(page); page.setDefaultTimeout(12000);
      await page.goto(base + '/rh/funcionarios'); await page.getByText('João Luís Rodrigues', { exact: true }).waitFor(); await page.evaluate(() => document.fonts.ready);
      const title = await measure(page, 'h1'); assert.equal(title.weight, '500', theme + ' canonical resource title');
      const kpi = await measure(page, '.praxis-kpi-card-value'); assert.equal(kpi.weight, '500', theme + ' canonical KPI');
      const header = await measure(page, '.praxis-header-label-text'); assert.equal(header.weight, '500', theme + ' table header');
      const nav = await measure(page, '.praxis-shell__nav-link:not(.active)'); assert.equal(nav.weight, '400', theme + ' navigation');
      const icon = await measure(page, '.praxis-shell__nav-link .material-symbols-outlined'); assert(icon.axes.includes('300'), theme + ' real icon axis');
      const families = await page.locator('mat-icon').evaluateAll(els => [...new Set(els.map(e => getComputedStyle(e).fontFamily))]);
      report.measurements.push({ theme, title, kpi, header, nav, icon, matIconFamilies: families });
      await page.getByRole('checkbox', { name: 'Selecionar linha 1', exact: true }).check();
      await expect(page.getByRole('row').filter({ hasText: 'João Luís Rodrigues' })).toHaveAttribute('aria-selected', 'true');
      const placeholder = page.locator('.pdx-inline-placeholder').filter({ hasText: 'Nome Completo' }).first();
      await expect.poll(() => placeholder.evaluate(el => Number(getComputedStyle(el).opacity) === 1 && el.getBoundingClientRect().width > 8)).toBe(true);
      await shot(page, theme + '-desktop');
      if (theme === 'insignia') { await page.getByRole('checkbox', { name: 'Selecionar linha 1', exact: true }).uncheck(); await page.mouse.move(1000, 100); await shot(page, 'after-insignia'); }

      await page.getByRole('button', { name: /Aparência:/ }).click(); await page.getByRole('menu').waitFor(); await shot(page, theme + '-menu'); await page.keyboard.press('Escape');
      await page.getByRole('button', { name: /Novo Colaborador/i }).first().click(); await page.locator('praxis-dynamic-form input').first().waitFor();
      await page.setViewportSize({ width: 390, height: 844 });
      const dialog = page.getByRole('dialog').last(), box = await dialog.boundingBox(); assert(box.x >= -1 && box.x + box.width <= 391);
      const field = await measure(page, 'praxis-dynamic-form input'); assert.equal(field.weight, '400'); assert(field.size >= 16);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await shot(page, theme + '-mobile-form');
      report.measurements.push({ theme, mobileField: field, dialog: box });
      report.checks.push(theme + ': canonical weights, variable symbols, selection, appearance overlay, mobile form and fit');
      await context.close();
    }
    for (const weight of [400, 600]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      await install(context, report, { globalConfig: { table: { appearance: { typography: { headerFontWeight: weight } } } } });
      const page = await context.newPage(); watch(page);
      await page.goto(base + '/rh/funcionarios'); await page.getByText('João Luís Rodrigues', { exact: true }).waitFor();
      const header = await measure(page, '.praxis-header-label-text'); assert.equal(header.weight, String(weight), 'authored header weight');
      report.measurements.push({ authoredHeaderWeight: weight, actual: header }); await context.close();
    }
    report.checks.push('authored table header weights 400/600 reach text without host masking');
    const fonts = await Promise.allSettled(assetLoads); assert(fonts.every(r => r.status === 'fulfilled'), 'font asset reads');
    assert(report.fontAssets.length > 0, 'real variable Symbol asset fetched');
    assert.deepEqual(report.pageErrors, []); assert.deepEqual(report.businessWrites, []);
    fs.writeFileSync(path.join(out, 'browser-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ checks: report.checks.length, captures: report.captures.length, errors: report.pageErrors, fontAssets: report.fontAssets.length }));
  } catch (error) {
    const page = browser.contexts()[0]?.pages()[0];
    if (page) { await page.screenshot({ path: path.join(out, 'failure.png') }); fs.writeFileSync(path.join(out, 'failure.txt'), await page.locator('body').ariaSnapshot()); }
    fs.writeFileSync(path.join(out, 'partial-report.json'), JSON.stringify({ ...report, error: String(error) }, null, 2)); throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
