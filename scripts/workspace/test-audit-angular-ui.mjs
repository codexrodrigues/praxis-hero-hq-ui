#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const auditorIndex = process.argv.indexOf('--auditor');
if (auditorIndex < 0 || !process.argv[auditorIndex + 1]) throw new Error('Pass --auditor PATH');
const auditor = path.resolve(process.argv[auditorIndex + 1]);
const adapter = path.join(path.dirname(fileURLToPath(import.meta.url)), 'audit-angular-ui.mjs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'angular-audit-test-'));
const src = path.join(temp, 'src'); fs.mkdirSync(src);
const component = path.join(src, 'example.ts');
const external = path.join(src, 'external.html');
function run() {
  return spawnSync(process.execPath, [adapter, '--auditor', auditor, temp], { encoding: 'utf8' });
}
try {
  fs.writeFileSync(component, `@Component({ template: \`\n<button type="button" (click)="save()">Save</button>\n<button type="button">Missing</button>\n<button type="button" disabled>Disabled</button>\n<form novalidate><button>Submit</button></form>\n<textarea></textarea>\n\` })\nclass Example {}\n@Component({ templateUrl: './external.html' }) class External {}\n`);
  fs.writeFileSync(external, '<button type="button" (click)="save()">Save</button>\n<button type="button">Missing</button>\n');
  const original = fs.readFileSync(component, 'utf8');
  let result = run();
  assert.equal(result.status, 1, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.projectRoot, fs.realpathSync(temp));
  assert.equal(report.angularAdapter.kind, 'syntactic-only');
  assert.equal(report.angularAdapter.normalizedAngularBindings, 2);
  assert.deepEqual(report.findings.map(f => [f.ruleId, f.file, f.line]).sort(), [
    ['affordance.actionless-button', 'src/example.ts', 3],
    ['affordance.actionless-button', 'src/external.html', 2],
    ['form.textarea-resize-missing', 'src/example.ts', 6],
  ]);
  assert.equal(fs.readFileSync(component, 'utf8'), original, 'Source must remain unchanged');
  fs.writeFileSync(component, '@Component({template: `<button type="button" (click)="">Empty</button>`}) class Example {}');
  result = run(); assert.equal(result.status, 2); assert.match(result.stderr, /Empty click handler|parse error/);
  fs.writeFileSync(component, '@Component({template: `<button type="button" (click)="save(">Bad</button>`}) class Example {}');
  result = run(); assert.equal(result.status, 2); assert.match(result.stderr, /parse error/);
  fs.writeFileSync(component, '@Component({template: makeTemplate()}) class Example {}');
  result = run(); assert.equal(result.status, 2); assert.match(result.stderr, /Dynamic template/);
  fs.writeFileSync(external, '<p>Unused static file</p>');
  fs.writeFileSync(component, '@Component({template: `<button type="button" (click)="save()">Save</button>`}) class Example {}');
  result = run(); assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).summary.total, 0);
  for (const [declaration, decorator] of [
    ["import { Component as NgComponent } from '@angular/core';", 'NgComponent'],
    ["import * as core from '@angular/core';", 'core.Component'],
  ]) {
    fs.writeFileSync(component, `${declaration} @${decorator}({template: \`<button type="button">Missing</button>\`}) class Example {}`);
    result = run(); assert.equal(result.status, 1, result.stderr);
    assert.ok(JSON.parse(result.stdout).findings.some(f => f.ruleId === 'affordance.actionless-button'));
    fs.writeFileSync(component, `${declaration} @${decorator}({template: \`<button type="button" (click)="save()">Save</button>\`}) class Example {}`);
    result = run(); assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).summary.total, 0);
  }
  const menuComponent = (binding, target, imports = 'MatMenuModule') => `import { MatMenuModule } from '@angular/material/menu';
@Component({imports: [${imports}], template: \`<button type="button" [matMenuTriggerFor]="${binding}">Menu</button>${target}\`}) class Menu {}`;
  fs.writeFileSync(component, menuComponent('menu', '<mat-menu #menu="matMenu"></mat-menu>'));
  result = run(); assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).summary.total, 0);
  for (const content of [
    menuComponent('menu', '<mat-menu #menu="matMenu"></mat-menu>').replace('import { MatMenuModule }', 'import type { MatMenuModule }'),
    menuComponent('missing', '<mat-menu #menu="matMenu"></mat-menu>'),
    menuComponent('menu', '<div #menu></div>'),
    menuComponent('menu', '<mat-menu #menu="matMenu"></mat-menu>', ''),
    menuComponent('menu.child', '<mat-menu #menu="matMenu"></mat-menu>'),
  ]) {
    fs.writeFileSync(component, content);
    result = run(); assert.equal(result.status, 1, result.stderr);
    assert.ok(JSON.parse(result.stdout).findings.some(f => f.ruleId === 'affordance.actionless-button'));
  }
  fs.writeFileSync(component, menuComponent('menu(', '<mat-menu #menu="matMenu"></mat-menu>'));
  result = run(); assert.equal(result.status, 2); assert.match(result.stderr, /parse error/);
  fs.writeFileSync(component, '@Component({template: `<button type="button" (click)="save()">Save</button>`}) class Example {}');
  fs.writeFileSync(external, '<select><option>Native</option></select>');
  result = run(); assert.equal(result.status, 2); assert.ok(JSON.parse(result.stdout).findings.some(f => f.ruleId === 'ownership.native-select-undecided' && f.category === 'unresolved'));
  fs.writeFileSync(path.join(temp, 'premium-ui.json'), JSON.stringify({ sourceRoots: ['../outside'] }));
  result = run(); assert.equal(result.status, 2); assert.match(result.stderr, /outside project/);
  console.log('PASS: Angular syntax adaptation, upstream findings/lines, fail-closed cases and unchanged source');
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
