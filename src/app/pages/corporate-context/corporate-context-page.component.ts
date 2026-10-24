import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  EnterpriseRuntimeContextService,
  type EnterpriseRuntimeContext, type EnterpriseRuntimeContextChoice,
} from '@praxisui/core';
import { CorporateSessionService } from '../../core/corporate-session.service';

@Component({
  selector: 'app-corporate-context-page',
  imports: [RouterLink, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './corporate-context-page.html',
  styleUrl: './corporate-context-page.scss',
})
export class CorporateContextPageComponent {
  private readonly runtime = inject(EnterpriseRuntimeContextService);
  readonly session = inject(CorporateSessionService);
  private readonly returnRefs = inject(ActivatedRoute).snapshot.queryParamMap;
  private resumeId(key: string): string | null {
    const value = this.returnRefs.get(key);
    return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value) ? value : null;
  }
  // These refs select a server read only. Never accept a caller-provided URL or grants.
  readonly pagesPath = this.returnRefs.get('corporateView') === 'published' && this.resumeId('corporatePageId')
    ? `/pages/${this.resumeId('corporatePageId')}` : this.returnRefs.get('corporateView') === 'groups'
      ? '/workspace-corporativo/grupos' : '/workspace-corporativo/paginas';
  readonly pagesQuery = this.pagesPath.startsWith('/pages/') ? {} : {
    pageId: this.resumeId('corporatePageId'), draftId: this.resumeId('corporateDraftId'),
    releaseId: this.resumeId('corporateReleaseId'), creationKey: this.resumeId('corporateCreationKey'), copyFrom: this.resumeId('corporateCopyFrom'),
  };
  username = '';
  password = '';
  private destroyed = false;
  private generation = 0;
  readonly context = signal<EnterpriseRuntimeContext | null>(null);
  readonly choices = signal<EnterpriseRuntimeContextChoice[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly busy = signal(false);
  readonly message = signal('');

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true; this.password = ''; ++this.generation; this.runtime.invalidate();
    });
    effect(() => {
      this.session.generation();
      const authenticated = this.session.authenticated();
      if (!authenticated) untracked(() => this.invalidate());
    });
    // Remounting a view/persona does not replace an already confirmed server session.
    void this.resume();
  }

  async resume(): Promise<void> {
    if (this.session.busy()) return;
    const ready = this.session.authenticated() || await this.session.restore();
    if (ready && !this.destroyed) await this.refresh();
  }

  async login(): Promise<void> {
    if (this.session.busy() || !this.username.trim() || !this.password) return;
    const username = this.username, password = this.password;
    this.password = '';
    this.invalidate();
    try {
      if (await this.session.login(username, password) && !this.destroyed) await this.refresh();
    } finally { this.password = ''; }
  }

  async logout(): Promise<void> {
    if (this.session.busy()) return;
    this.password = '';
    this.invalidate();
    await this.session.logout();
  }

  private invalidate(): void {
    ++this.generation;
    this.clear(); this.busy.set(false); this.runtime.invalidate();
  }

  private current(operation: number, sessionGeneration: number): boolean {
    return !this.destroyed && operation === this.generation
      && sessionGeneration === this.session.generation() && this.session.authenticated();
  }

  async refresh(): Promise<void> {
    if (!this.session.authenticated() || this.session.busy()) return;
    const sessionGeneration = this.session.generation();
    const operation = ++this.generation;
    this.clear();
    this.busy.set(true);
    try {
      const context = await this.runtime.refresh();
      if (!this.current(operation, sessionGeneration)) return;
      if (!context) throw new Error('Missing server context');
      this.context.set(context);
      const response = await this.runtime.choices({ pageSize: 20 });
      if (!this.current(operation, sessionGeneration)) return;
      this.choices.set(response.items);
      this.nextCursor.set(response.nextCursor);
    } catch (error) {
      if (this.current(operation, sessionGeneration)) this.fail(error);
    } finally {
      if (operation === this.generation) this.busy.set(false);
    }
  }

  async select(choice: EnterpriseRuntimeContextChoice): Promise<void> {
    const context = this.context();
    if (this.busy() || this.session.busy() || !this.session.authenticated() || !context || !this.choices().includes(choice)) return;
    const sessionGeneration = this.session.generation();
    const operation = ++this.generation;
    this.busy.set(true);
    this.clear();
    try {
      await this.runtime.switchContext({ choiceRef: choice.choiceRef, expectedSelectionVersion: context.selectionVersion });
      if (!this.current(operation, sessionGeneration)) return;
      // Reread the server after selection; no optimistic context or grants.
      await this.refresh();
    } catch (error) {
      if (this.current(operation, sessionGeneration)) this.fail(error);
    } finally {
      if (operation === this.generation) this.busy.set(false);
    }
  }

  async more(): Promise<void> {
    const cursor = this.nextCursor();
    if (this.busy() || this.session.busy() || !this.session.authenticated() || !cursor || !this.context()) return;
    const sessionGeneration = this.session.generation();
    const operation = this.generation;
    this.busy.set(true);
    try {
      const response = await this.runtime.choices({ cursor, pageSize: 20 });
      if (!this.current(operation, sessionGeneration)) return;
      const existing = new Set(this.choices().map(choice => choice.choiceRef));
      this.choices.update(items => [...items, ...response.items.filter(choice => !existing.has(choice.choiceRef))]);
      this.nextCursor.set(response.nextCursor);
    } catch (error) {
      if (this.current(operation, sessionGeneration)) this.fail(error);
    } finally {
      if (operation === this.generation) this.busy.set(false);
    }
  }

  private clear(): void {
    this.context.set(null); this.choices.set([]); this.nextCursor.set(null); this.message.set('');
  }

  private fail(error: unknown): void {
    this.clear(); this.runtime.invalidate();
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    this.message.set(status === 401 ? 'É necessária uma sessão autenticada no servidor. As personas da demonstração não iniciam essa sessão.'
      : status === 403 ? 'A sessão não tem acesso a este contexto. Nenhuma permissão foi concedida pela demonstração.'
      : status === 409 || status === 412 ? 'O contexto mudou em outra operação. Atualize os contextos antes de escolher novamente.'
      : 'Não foi possível confirmar o contexto no servidor. Tente novamente; nenhuma seleção local substitui essa confirmação.');
  }
}
