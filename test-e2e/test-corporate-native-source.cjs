// Cross-owner gate: validate the actual Quickstart native source with the installed public SDK.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
(async () => {
  assert.ok(process.argv[2], 'Pass the reviewed Quickstart checkout root explicitly');
  const file = path.join(path.resolve(process.argv[2]), 'src/main/java/com/example/praxis/apiquickstart/config/QuickstartPageDocuments.java');
  const source = fs.readFileSync(file, 'utf8');
  const document = name => {
    const match = source.match(new RegExp(`\\b${name} = mapper\\.readTree\\("""([\\s\\S]*?)"""\\)`));
    assert.ok(match, `Native ${name} text block must be found; never substitute a fixture`);
    return JSON.parse(match[1]);
  };
  const page = document('page'), child = document('child'), groups = document('groups');
  assert.match(source, /SOURCE_REVISION = "2"/);
  const original = structuredClone(page);
  await import('@angular/compiler');
  const core = await import('@praxisui/core');
  const form = await import('@praxisui/dynamic-form');
  assert.equal(core.validatePageAuthoringDocument(page, { 'praxis-dynamic-form': form.validateDynamicFormPageWidget }).ok, true);
  const widget = page.config.definition.widgets[0];
  assert.deepEqual(widget.definition.inputs.config, child.config);
  assert.deepEqual(child.config.fieldMetadata, []);
  assert.equal('fields' in child.config, false);
  assert.deepEqual(groups.config.groups, []);
  const pageId = '10000000-0000-4000-8000-000000000001';
  const result = form.materializeDynamicFormPageRuntimeInputs(widget.definition.inputs, pageId, widget.key);
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.inputs.configPersistenceStrategy, 'volatile');
  assert.equal(result.inputs.formId, core.derivePageChildRuntimeId(pageId, widget.key));
  assert.deepEqual(page, original, 'Authorship must stay immutable');
  console.log(JSON.stringify({ result: 'PASS', sourceSha256: createHash('sha256').update(source).digest('hex'), sdk: { core: JSON.parse(fs.readFileSync(path.join(path.dirname(require.resolve('@praxisui/core/package.json')), 'package.json'), 'utf8')).version, form: JSON.parse(fs.readFileSync(require.resolve('@praxisui/dynamic-form/package.json'), 'utf8')).version }, nativeSource: 'quickstart:corporate-page@2', scope: 'No browser/backend/DB/Neon' }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
