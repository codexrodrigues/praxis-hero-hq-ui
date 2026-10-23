import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  EnterpriseRuntimeContextService, PRAXIS_ENTERPRISE_RUNTIME_CONTEXT_OPTIONS,
  type EnterpriseRuntimeContext, type EnterpriseRuntimeContextChoice,
} from '@praxisui/core';
import { AuthSimulationService } from '../../core/auth-simulation.service';

@Component({
  selector: 'app-corporate-context-page',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  providers: [EnterpriseRuntimeContextService, {
    provide: PRAXIS_ENTERPRISE_RUNTIME_CONTEXT_OPTIONS,
    useValue: { includeGlobalFetchHeaders: false, errorPolicy: 'fail' },
  }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './corporate-context-page.html',
  styleUrl: './corporate-context-page.scss',
})
export class CorporateContextPageComponent {
  private readonly runtime = inject(EnterpriseRuntimeContextService);
  private readonly auth = inject(AuthSimulationService);
  private generation = 0;
  readonly context = signal<EnterpriseRuntimeContext | null>(null);
  readonly choices = signal<EnterpriseRuntimeContextChoice[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly busy = signal(false);
  readonly message = signal('');

  constructor() {
    inject(DestroyRef).onDestroy(() => { ++this.generation; this.runtime.invalidate(); });
    effect(() => {
      this.auth.identityRevision();
      // A demo persona is never a server principal or an authorization grant.
      void this.refresh();
    });
  }

  async refresh(): Promise<void> {
    const operation = ++this.generation;
    this.clear();
    this.busy.set(true);
    try {
      const context = await this.runtime.refresh();
      if (operation !== this.generation) return;
      if (!context) throw new Error('Missing server context');
      this.context.set(context);
      const response = await this.runtime.choices({ pageSize: 20 });
      if (operation !== this.generation) return;
      this.choices.set(response.items);
      this.nextCursor.set(response.nextCursor);
    } catch (error) {
      if (operation === this.generation) this.fail(error);
    } finally {
      if (operation === this.generation) this.busy.set(false);
    }
  }

  async select(choice: EnterpriseRuntimeContextChoice): Promise<void> {
    const context = this.context();
    if (this.busy() || !context || !this.choices().includes(choice)) return;
    const operation = ++this.generation;
    this.busy.set(true);
    this.clear();
    try {
      await this.runtime.switchContext({ choiceRef: choice.choiceRef, expectedSelectionVersion: context.selectionVersion });
      if (operation !== this.generation) return;
      // Reread the server after selection; no optimistic context or grants.
      await this.refresh();
    } catch (error) {
      if (operation === this.generation) this.fail(error);
    } finally {
      if (operation === this.generation) this.busy.set(false);
    }
  }

  async more(): Promise<void> {
    const cursor = this.nextCursor();
    if (this.busy() || !cursor || !this.context()) return;
    const operation = this.generation;
    this.busy.set(true);
    try {
      const response = await this.runtime.choices({ cursor, pageSize: 20 });
      if (operation !== this.generation) return;
      const existing = new Set(this.choices().map(choice => choice.choiceRef));
      this.choices.update(items => [...items, ...response.items.filter(choice => !existing.has(choice.choiceRef))]);
      this.nextCursor.set(response.nextCursor);
    } catch (error) {
      if (operation === this.generation) this.fail(error);
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
