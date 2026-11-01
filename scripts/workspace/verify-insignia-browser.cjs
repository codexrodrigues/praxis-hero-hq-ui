// Focused Insígnia paint/keyboard proof; the shared deep lane covers component behavior.
// HTTP fixtures only: no backend, authentication or remote persistence claim.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, expect } = require(require.resolve('@playwright/test', { paths: [__dirname, path.resolve(__dirname, '../../../praxis-ui-angular/node_modules')] }));
const { fixtures } = require('./verify-brasa-browser.cjs');
const out = path.resolve(__dirname, process.env.HERO_EVIDENCE_DIR || '../../docs/design/evidence/insignia-2026-11-01');
fs.mkdirSync(out, { recursive: true });
const report = { kind: 'Insígnia paint and keyboard / mocked HTTP', checks: [], measurements: [], pageErrors: [] };
// Resolve modern CSS colors through Canvas, including alpha over actual ancestors.
async function paint(locator) {
  return locator.evaluate(el => {
    const ctx = document.createElement('canvas').getContext('2d');
    const rgb = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
    const over = (a, b) => [...a.slice(0, 3).map((v, i) => v * a[3] / 255 + b[i] * (1 - a[3] / 255)), 255];
    const bg = node => node ? over(rgb(getComputedStyle(node).backgroundColor), bg(node.parentElement)) : [249, 247, 241, 255];
    const lum = v => v.slice(0, 3).map(x => x / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
    const contrast = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
    const css = getComputedStyle(el), surface = bg(el);
    // Brand and command use an opaque gradient rather than background-color.
    const stops = css.backgroundImage.match(/rgba?\([^)]+\)/g) || [];
    if (css.backgroundImage !== 'none' && (stops.length < 2 || stops.some(stop => stop !== stops[0]))) throw Error('Expected a solid command gradient, got ' + css.backgroundImage);
    const gradient = stops.length ? rgb(stops[0]) : surface;
    const background = css.backgroundImage !== 'none' ? gradient : surface;
    return { color: css.color, background, contrast: contrast(rgb(css.color), background), font: css.fontFamily, size: parseFloat(css.fontSize), outline: css.outlineStyle, outlineWidth: css.outlineWidth, focusContrast: contrast(rgb(css.outlineColor), background), focused: document.activeElement === el };
  });
}
(async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await fixtures(context);
    const page = await context.newPage();
    page.on('pageerror', e => report.pageErrors.push(e.message));
    await page.goto('http://127.0.0.1:4302/rh/funcionarios');
    await page.getByText('João Luís Rodrigues', { exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'insignia');
    for (const [name, locator] of [
      ['brand', page.locator('.praxis-shell__brand-icon')],
      ['active navigation', page.locator('.praxis-shell__nav-link.active').first()],
      ['primary command', page.getByRole('button', { name: /Novo Colaborador/i }).first()],
    ]) {
      const value = await paint(locator); assert(value.contrast >= 4.5, name + JSON.stringify(value)); report.measurements.push({ name, ...value });
    }
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'desktop-theme.png') });
    report.checks.push('fresh default and brand/navigation/command contrast');
    const active = page.locator('.praxis-shell__nav-link.active').first();
    const inactive = page.locator('.praxis-shell__nav-link:not(.active)').first();
    await inactive.hover();
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'desktop-navigation-hover.png') });
    const hover = await paint(inactive); assert(hover.contrast >= 4.5); report.measurements.push({ name: 'navigation hover', ...hover });
    await page.mouse.move(1000, 100);

    await active.focus(); await page.keyboard.press('Tab');
    let focused = page.locator(':focus');
    const focus = await paint(focused); assert(focus.focused && focus.outline !== 'none' && focus.focusContrast >= 3); report.measurements.push({ name: 'sidebar keyboard focus', ...focus });
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'desktop-navigation-focus.png') });
    await page.getByRole('button', { name: 'Recolher barra lateral', exact: true }).click();
    await active.focus(); await page.keyboard.press('Tab');
    focused = page.locator(':focus'); const compact = await paint(focused); assert(compact.focusContrast >= 3 && compact.outline !== 'none');
    report.measurements.push({ name: 'collapsed sidebar keyboard focus', ...compact });
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'desktop-collapsed-navigation.png') });
    report.checks.push('keyboard focus on expanded and collapsed navigation');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload(); await page.getByText('João Luís Rodrigues', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Abrir navegação', exact: true }).click();
    const sidebar = page.locator('.praxis-shell__sidebar');
    await expect.poll(async () => (await sidebar.boundingBox()).x).toBeGreaterThanOrEqual(0);
    const sidebarBox = await sidebar.boundingBox(); assert(sidebarBox.x + sidebarBox.width <= 390);
    await active.focus(); await page.keyboard.press('Tab');
    const mobileFocus = await paint(page.locator(':focus')); assert(mobileFocus.focusContrast >= 3 && mobileFocus.outline !== 'none');
    report.measurements.push({ name: 'mobile navigation keyboard focus', ...mobileFocus });
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'mobile-navigation-focus.png') });
    await page.locator('.praxis-shell__mobile-close-btn').click();
    report.checks.push('mobile navigation opens, exposes keyboard focus and closes');
    const create = page.getByRole('button', { name: /Novo Colaborador/i }).first();
    if (await create.count()) await create.click();
    else {
      await page.getByRole('button', { name: 'Mais ações', exact: true }).first().click();
      await page.getByRole('menuitem', { name: /Novo Colaborador/i }).click();
    }
    const input = page.locator('praxis-dynamic-form input').first(); await input.waitFor();
    const font = await paint(input); report.measurements.push({ name: 'mobile input', ...font });
    assert(font.font.includes('Source Sans 3') && font.size >= 16, JSON.stringify(font));
    await input.fill('Rascunho de validação');
    const button = page.getByRole('dialog').last().getByRole('button', { name: 'Criar Colaborador', exact: true });
    assert(await button.isDisabled());
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'mobile-input-invalid-draft.png') });
    await page.getByRole('dialog').last().getByRole('textbox', { name: 'E-mail', exact: true }).fill('validacao@exemplo.invalid');
    await expect(button).toBeEnabled();
    const action = await paint(button); assert(action.contrast >= 4.5); report.measurements.push({ name: 'mobile enabled primary action', ...action });
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'mobile-primary-action.png') });
    report.checks.push('mobile input at least 16px; invalid draft blocked; valid draft action legible without submission');
    assert.deepEqual(report.pageErrors, []);
    fs.writeFileSync(path.join(out, 'insignia-paint-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
