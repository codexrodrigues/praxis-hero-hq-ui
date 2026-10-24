// Run from Hero with its public lockfile: node scripts/workspace/corporate-form-owner-fixture.mjs
// No browser, storage, HTTP or database. Uses owner APIs from the installed SDK.
import '@angular/compiler';
import { DynamicFormLayoutService, projectDynamicFormPageEditorChanges, serializeDynamicFormAuthoringDocument } from '@praxisui/dynamic-form';
import { pathToFileURL } from 'node:url';
export function corporateFormOwnerFixture() {
  const seed = { kind: 'praxis.dynamic-form.editor', version: 1, config: { title: 'Corporate page', fieldMetadata: [] } };
  const layout = new DynamicFormLayoutService();
  let config = layout.normalizeConfig({ ...structuredClone(seed.config), sections: [
    { id: 'section_1', title: 'Dados locais', rows: [{ id: 'row_1', columns: [{ id: 'col_1', fields: [] }] }] },
  ] });
  for (const [name, label, controlType] of [['nome', 'Nome', 'input'], ['descricao', 'Descrição', 'textarea'], ['quantidade', 'Quantidade', 'number'], ['aceite', 'Aceite', 'checkbox']]) {
    const result = layout.insertLocalFieldById(config, { sectionId: 'section_1', rowId: 'row_1', columnId: 'col_1' },
      { name, label, controlType, source: 'local', transient: true, submitPolicy: 'omit' });
    if (!result.applied) throw new Error('Native fixture insertion failed');
    config = result.config;
  }
  const candidate = { ...structuredClone(seed), config };
  const projected = projectDynamicFormPageEditorChanges({ config: seed.config }, seed, candidate);
  const editorBaseline = serializeDynamicFormAuthoringDocument(seed);
  const editorCandidate = serializeDynamicFormAuthoringDocument(candidate);
  const projectedEditor = projectDynamicFormPageEditorChanges({ config: seed.config }, editorBaseline, editorCandidate);
  return { editorBaseline, editorCandidate, projectedEditor, sdk: '10.0.0-rc.38', producer: 'DynamicFormLayoutService.normalizeConfig/insertLocalFieldById + projectDynamicFormPageEditorChanges', seed, candidate, projected };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(corporateFormOwnerFixture(), null, 2));
