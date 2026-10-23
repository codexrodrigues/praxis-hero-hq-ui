import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import {
  PraxisI18nService, type PageIdentity, type WidgetPageDefinition,
} from '@praxisui/core';
import { DynamicPageBuilderComponent } from '@praxisui/page-builder';
import { map } from 'rxjs';
import { VisitorWorkspaceService } from '../../core/visitor-workspace.service';
import { visitorPagePath } from '../../core/visitor-workspace.repository';
import { DASHBOARD_PAGE_DEFINITION } from '../dashboard/dashboard-page.definition';
import { createBlankWorkspaceStudioPageDefinition } from '../workspace-studio/workspace-studio-page.component';
import { visitorLocalStorageProviders } from './visitor-local-config-storage';
import { provideVisitorLabI18n } from './visitor-lab.i18n';
import type { VisitorLabDraft } from './visitor-lab-copy-action.component';

function createVisitorLabPageDefinition(): WidgetPageDefinition {
  const page = createBlankWorkspaceStudioPageDefinition();
  return { ...page, context: { pageId: 'visitor-lab', title: 'Meu laboratório', purpose: 'workspace' } };
}

@Component({
  selector: 'app-visitor-lab-editor',
  imports: [DynamicPageBuilderComponent, ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  providers: [...visitorLocalStorageProviders, provideVisitorLabI18n()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visitor-lab-editor.html',
  styleUrl: './visitor-lab.scss',
})
export class VisitorLabEditorComponent {
  readonly pageId = input<string | null>(null);
  readonly initialDraft = input<VisitorLabDraft>();
  readonly store = inject(VisitorWorkspaceService);
  private readonly i18n = inject(PraxisI18nService);
  readonly builder = viewChild(DynamicPageBuilderComponent);
  readonly page = signal<WidgetPageDefinition>(createVisitorLabPageDefinition());
  readonly busy = signal(false);
  readonly error = signal('');
  readonly savedPath = signal('');
  readonly missing = signal(false);
  readonly title = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80)] });
  readonly menu = new FormControl(this.text('defaultMenu'), { nonNullable: true, validators: [Validators.required, Validators.maxLength(60)] });
  readonly menuIcon = new FormControl('web', { nonNullable: true });
  readonly menuIcons = ['web', 'description', 'dashboard', 'assignment', 'groups', 'inventory_2'];
  readonly pagePath = visitorPagePath;
  readonly capabilities = { agentic: false, pageLifecycle: false };
  private pendingId?: string;
  private pendingSignature?: string;
  readonly identity = computed<PageIdentity>(() => {
    const [tenantId, userId] = JSON.parse(this.store.owner()) as [string, string];
    return { appId: 'praxis-hero-hq-visitor-lab', tenantId, userId,
      routePath: this.pageId() ? visitorPagePath(this.pageId()!) : '/laboratorio' };
  });

  private hydrated = false;
  constructor() {
    effect(() => {
      const id = this.pageId();
      if (this.hydrated) return;
      if (!id) {
        const draft = this.initialDraft();
        if (draft && draft.owner === this.store.owner() && draft.revision === this.store.revision()) {
          this.page.set(structuredClone(draft.definition));
          this.hydrated = true;
        }
        return;
      }
      const saved = this.store.page(id);
      if (!saved) { this.missing.set(true); return; }
      this.page.set(structuredClone(saved.definition));
      this.title.setValue(saved.title);
      const group = this.store.workspace().menus.find(group => group.items.some(item => item.pageId === id));
      if (group) {
        this.menu.setValue(group.label);
        this.menuIcon.setValue(group.items.find(item => item.pageId === id)?.icon ?? 'web');
      }
      this.missing.set(false);
      this.hydrated = true;
    });
  }
  text(key: string): string { return this.i18n.t(`visitorLab.${key}`); }

  start(kind: 'blank' | 'dashboard'): void {
    if (this.busy()) return;
    if (this.builder()?.currentPage().widgets.length && !window.confirm(this.text('confirmRestart'))) return;
    this.page.set(kind === 'dashboard' ? structuredClone(DASHBOARD_PAGE_DEFINITION) : createVisitorLabPageDefinition());
    this.pendingId = undefined;
    this.pendingSignature = undefined;
  }
  requestSave(): void {
    this.title.markAsTouched(); this.menu.markAsTouched();
    if (this.busy() || this.title.invalid || this.menu.invalid || !this.builder()?.canSaveCurrentPage()) return;
    this.builder()?.saveCurrentPage();
  }
  async save(definition: WidgetPageDefinition): Promise<void> {
    // The only save entrypoint is the builder's canonical lifecycle event.
    if (this.busy() || !this.builder()?.canSaveCurrentPage()) return;
    if (!this.title.value.trim() || !this.menu.value.trim()) { this.error.set('invalid'); return; }
    this.busy.set(true); this.error.set('');
    try {
      const signature = JSON.stringify([this.title.value.trim(), this.menu.value.trim(), this.menuIcon.value, definition]);
      if (signature !== this.pendingSignature) { this.pendingId = crypto.randomUUID(); this.pendingSignature = signature; }
      const id = this.pendingId!;
      await this.store.save({ id, title: this.title.value, menuLabel: this.menu.value, menuIcon: this.menuIcon.value, definition });
      this.savedPath.set(visitorPagePath(id));
    } catch (error: unknown) { this.error.set(this.store.errorCode(error)); }
    finally { this.busy.set(false); }
  }
  async addToMenu(id: string): Promise<void> {
    const saved = this.store.page(id);
    if (!saved) return;
    await this.action(() => this.store.save({ id: saved.id, title: saved.title, definition: saved.definition, menuLabel: this.menu.value, menuIcon: this.menuIcon.value }));
  }
  async renameMenu(id: string, label: string): Promise<void> {
    await this.action(() => this.store.renameMenu(id, label));
  }
  async removeMenu(id: string): Promise<void> {
    if (window.confirm(this.text('confirmRemoveMenu'))) await this.action(() => this.store.removeMenu(id));
  }
  async removePage(id: string): Promise<void> {
    if (!window.confirm(this.text('confirmRemove'))) return;
    await this.action(async () => {
      await this.store.removePage(id);
      if (this.savedPath() === visitorPagePath(id)) this.savedPath.set('');
    });
  }
  private async action(operation: () => Promise<void>): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true); this.error.set('');
    try { await operation(); } catch (error: unknown) { this.error.set(this.store.errorCode(error)); }
    finally { this.busy.set(false); }
  }
}

@Component({
  selector: 'app-visitor-lab-page',
  imports: [VisitorLabEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.ready()) {
      @for (scope of [viewKey()]; track scope) {
        <app-visitor-lab-editor [pageId]="pageId()" [initialDraft]="initialDraft" />
      }
    }
  `,
})
export class VisitorLabPageComponent {
  readonly store = inject(VisitorWorkspaceService);
  readonly initialDraft = (inject(Router).currentNavigation()?.extras.info as { visitorLabDraft?: VisitorLabDraft } | undefined)?.visitorLabDraft;
  private readonly route = inject(ActivatedRoute);
  readonly pageId = toSignal(this.route.paramMap.pipe(map((params) => params.get('pageId'))), { initialValue: this.route.snapshot.paramMap.get('pageId') });
  // Destroy drafts/editors on identity or route change, including A -> B -> A.
  readonly viewKey = computed(() => JSON.stringify([this.store.owner(), this.store.revision(), this.pageId()]));
}
