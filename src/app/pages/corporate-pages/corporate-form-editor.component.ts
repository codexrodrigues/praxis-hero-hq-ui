import { afterNextRender, ChangeDetectionStrategy, Component, Injector, Input, ViewChild, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { type PageAuthoringDocument, validatePageAuthoringDocument } from '@praxisui/core';
import { PraxisDynamicFormConfigEditor, decodeDynamicFormPageInputs, projectDynamicFormPageEditorChanges,
  validateDynamicFormPageWidget } from '@praxisui/dynamic-form';
import { SETTINGS_PANEL_DATA } from '@praxisui/settings-panel';

/** Reuses the owner's editor and raw document projection. No preference/save writer is installed. */
@Component({
  selector: 'app-corporate-form-editor', standalone: true, imports: [NgComponentOutlet],
  template: `<p>Conteúdo admitido: campos locais de texto, texto longo, número e checkbox, e seu layout.
    O editor nativo também oferece recursos fora deste piloto: recursos de domínio, URLs, ações, regras, hooks e opções remotas não são admitidos.
    Erros locais podem ser corrigidos aqui. Se o servidor negar o salvamento, será necessário reler o rascunho e as edições não salvas poderão ser perdidas.
    Valores preenchidos não são publicados.</p>
    <ng-container *ngComponentOutlet="editorType; injector: editorInjector" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CorporateFormEditorComponent {
  private readonly parentInjector = inject(Injector);
  readonly editorType = PraxisDynamicFormConfigEditor;
  editorInjector?: Injector;
  @ViewChild(NgComponentOutlet) outlet?: NgComponentOutlet<PraxisDynamicFormConfigEditor>;
  private original?: PageAuthoringDocument;
  private baseline?: unknown;
  private generation = 0;
  @Input({ required: true }) set document(value: PageAuthoringDocument) {
    this.original = structuredClone(value); this.baseline = undefined;
    const generation = ++this.generation;
    const decoded = decodeDynamicFormPageInputs(value.config.definition.widgets[0].definition.inputs);
    if (!decoded.document) throw new Error('FORM_DOCUMENT_INVALID');
    this.editorInjector = Injector.create({ parent: this.parentInjector, providers: [
      { provide: SETTINGS_PANEL_DATA, useValue: { document: decoded.document } },
    ] });
    // Capture the mounted owner's normalization after rendering, never persisted defaults.
    afterNextRender(() => {
      if (generation === this.generation) this.baseline = structuredClone(this.outlet?.componentInstance?.getSettingsValue());
    }, { injector: this.parentInjector });
  }
  readDocument(): PageAuthoringDocument {
    const editor = this.outlet?.componentInstance;
    if (!this.original || !this.baseline || !editor || editor.isBusy$.value || !editor.isValid$.value) throw new Error('FORM_EDITOR_INVALID');
    const result = projectDynamicFormPageEditorChanges(this.original.config.definition.widgets[0].definition.inputs,
      this.baseline, editor.getSettingsValue());
    if (!result.inputs) throw new Error('FORM_ENVELOPE_CHANGED');
    const document = structuredClone(this.original);
    document.config.definition.widgets[0].definition.inputs = result.inputs;
    const admitted = validatePageAuthoringDocument(document, { 'praxis-dynamic-form': validateDynamicFormPageWidget });
    if (!admitted.ok) throw new Error('FORM_DOCUMENT_INVALID');
    return admitted.value;
  }
}
