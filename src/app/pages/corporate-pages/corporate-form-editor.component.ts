import { afterNextRender, ChangeDetectionStrategy, Component, Injector, Input, ViewChild, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { type PageAuthoringDocument, validatePageAuthoringDocument } from '@praxisui/core';
import { PraxisDynamicFormConfigEditor, decodeDynamicFormPageInputs, projectDynamicFormPageEditorChanges,
  validateDynamicFormPageWidget } from '@praxisui/dynamic-form';
import { validateTablePageWidget } from '@praxisui/table';
import { SETTINGS_PANEL_DATA } from '@praxisui/settings-panel';

/** Reuses the owner's editor and raw document projection. No preference/save writer is installed. */
@Component({
  selector: 'app-corporate-form-editor', standalone: true, imports: [NgComponentOutlet],
  template: `<p class="editor-scope-note">Conteúdo admitido: campos locais de texto, texto longo, número e checkbox, e seu layout.
    O editor nativo também oferece recursos fora deste piloto: recursos de domínio, URLs, ações, regras, hooks e opções remotas não são admitidos.
    Erros locais podem ser corrigidos aqui. Se o servidor negar o salvamento, será necessário reler o rascunho e as edições não salvas poderão ser perdidas.
    Valores preenchidos não são publicados.</p>
    <div class="editor-surface"><ng-container *ngComponentOutlet="editorType; injector: editorInjector" /></div>`,
  styles: [`:host{display:block;min-width:0;max-width:100%}.editor-scope-note{margin:0 0 14px;padding:12px 14px;border-radius:10px;font-size:.86rem;line-height:1.5;color:var(--muted-foreground,var(--mat-sys-on-surface-variant));background:var(--muted,var(--mat-sys-surface-container));border:1px solid var(--border,var(--mat-sys-outline-variant))}.editor-surface{padding:12px;border-radius:12px;background:var(--background,var(--mat-sys-surface));border:1px solid var(--border,var(--mat-sys-outline-variant))}:host ::ng-deep *{min-width:0;max-width:100%;box-sizing:border-box}:host ::ng-deep .mat-button-toggle-group{display:flex;flex-wrap:wrap;width:100%}:host ::ng-deep .mat-button-toggle-button,:host ::ng-deep .mat-button-toggle-label-content{white-space:normal;overflow-wrap:anywhere;line-height:1.25}`],
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
    const formWidgets = value.config.definition.widgets.filter(w => w.definition.id === 'praxis-dynamic-form');
    if (formWidgets.length !== 1) throw new Error('FORM_DOCUMENT_INVALID');
    const formWidget = formWidgets[0];
    const decoded = decodeDynamicFormPageInputs(formWidget?.definition.inputs);
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
    const formIndex = this.original.config.definition.widgets.findIndex(w => w.definition.id === 'praxis-dynamic-form');
    if (formIndex < 0 || this.original.config.definition.widgets.filter(w => w.definition.id === 'praxis-dynamic-form').length !== 1) throw new Error('FORM_DOCUMENT_INVALID');
    const targetIndex = formIndex;
    const result = projectDynamicFormPageEditorChanges(this.original.config.definition.widgets[targetIndex].definition.inputs,
      this.baseline, editor.getSettingsValue());
    if (!result.inputs) throw new Error('FORM_ENVELOPE_CHANGED');
    const document = structuredClone(this.original);
    document.config.definition.widgets[targetIndex].definition.inputs = result.inputs;
    const admitted = validatePageAuthoringDocument(document, {
      'praxis-dynamic-form': validateDynamicFormPageWidget,
      'praxis-table': validateTablePageWidget,
    });
    if (!admitted.ok) throw new Error('FORM_DOCUMENT_INVALID');
    return admitted.value;
  }
}
