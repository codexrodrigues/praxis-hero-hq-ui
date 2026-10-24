import { DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { EnterpriseRuntimeContextService, type EnterpriseRuntimeNavigationNode } from '@praxisui/core';
import { CorporateSessionService } from './corporate-session.service';
import { CorporatePagePilotService } from './corporate-page-pilot.service';
import { corporateMenuNodes } from './corporate-navigation.model';

/** Transient SDK navigation projection in the corporate route injector, never a menu registry. */
@Injectable()
export class CorporateNavigationService {
  private readonly runtime = inject(EnterpriseRuntimeContextService);
  private readonly session = inject(CorporateSessionService);
  private readonly pages = inject(CorporatePagePilotService);
  readonly groups = signal<EnterpriseRuntimeNavigationNode[]>([]);
  readonly children = signal<Record<string, EnterpriseRuntimeNavigationNode[]>>({});
  readonly cursors = signal<Record<string, string | null>>({});
  readonly rootCursor = signal<string | null>(null);
  readonly expanded = signal<string | null>(null);
  readonly busy = signal(false);
  readonly ready = signal(false);
  readonly message = signal('');
  private readonly cursorHistory = new Map<string, Set<string>>();
  private epoch = 0;
  private destroyed = false;
  constructor() {
    const subscription = this.runtime.contextChanges$.subscribe(context => {
      this.clear();
      if (context?.state === 'ready' && this.session.authenticated()) void this.refresh();
    });
    effect(() => {
      this.session.generation(); const authenticated = this.session.authenticated();
      untracked(() => { this.pages.synchronizeSession(); if (!authenticated) this.clear(); });
    });
    inject(DestroyRef).onDestroy(() => { this.destroyed = true; this.clear(); subscription.unsubscribe(); });
  }
  private clear(): void {
    ++this.epoch; this.cursorHistory.clear(); this.groups.set([]); this.children.set({}); this.cursors.set({});
    this.rootCursor.set(null); this.expanded.set(null); this.ready.set(false); this.busy.set(false); this.message.set('');
  }
  async refresh(): Promise<void> {
    this.pages.synchronizeSession(); this.clear();
    await this.load(null, null);
  }
  async moreGroups(): Promise<void> { if (this.rootCursor()) await this.load(null, this.rootCursor()); }
  async open(groupId: string): Promise<void> {
    if (this.busy() || !this.groups().some(group => group.id === groupId)) return;
    this.expanded.set(groupId); this.cursorHistory.delete(groupId);
    this.cursors.update(value => ({ ...value, [groupId]: null }));
    // Reopen always reobserves authority; remembered display data is not a grant.
    this.children.update(value => ({ ...value, [groupId]: [] }));
    await this.load(groupId, null);
  }
  async moreChildren(groupId: string): Promise<void> {
    const cursor = this.cursors()[groupId]; if (cursor) await this.load(groupId, cursor);
  }
  private async load(parent: string | null, cursor: string | null): Promise<void> {
    this.pages.synchronizeSession();
    if (this.busy() || this.destroyed || !this.session.authenticated() || this.runtime.snapshot?.state !== 'ready') return;
    const epoch = this.epoch, session = this.session.generation();
    const current = () => !this.destroyed && epoch === this.epoch && session === this.session.generation() && this.session.authenticated();
    this.busy.set(true); this.message.set('');
    try {
      const scope = parent ?? '';
      const history = this.cursorHistory.get(scope) ?? new Set<string>();
      if (cursor && history.has(cursor)) throw new Error('MENU_CURSOR_CYCLE');
      if (cursor) history.add(cursor);
      this.cursorHistory.set(scope, history);
      const response = await this.runtime.navigation({ pageSize: 20, ...(parent ? { parentRef: parent } : {}), ...(cursor ? { cursor } : {}) });
      if (!current()) return;
      if (response?.schemaVersion !== 'praxis-enterprise-runtime-navigation.v1'
          || response.contextVersion !== this.runtime.effectiveContext?.contextVersion
          || typeof response.receiptEtag !== 'string' || !response.receiptEtag.trim()
          || !Array.isArray(response.headReceipts) || !Array.isArray(response.nodes) || response.nodes.length > 20
          || !(response.nextCursor === null || typeof response.nextCursor === 'string' && response.nextCursor.length > 0 && response.nextCursor.length <= 8192)
          || response.nextCursor !== null && history.has(response.nextCursor)) throw new Error('MENU_CONTRACT');
      const nodes = corporateMenuNodes(response.nodes, parent);
      if (parent === null) {
        this.groups.set(cursor ? this.merge(this.groups(), nodes) : nodes); this.rootCursor.set(response.nextCursor);
      } else {
        this.children.update(value => ({ ...value, [parent]: cursor ? this.merge(value[parent] ?? [], nodes) : nodes }));
        this.cursors.update(value => ({ ...value, [parent]: response.nextCursor }));
      }
      this.ready.set(true);
    } catch (error) {
      if (current()) {
        this.clear();
        this.message.set(error instanceof Error && error.message === 'MENU_LIMIT'
          ? 'Este menu excedeu o limite de 200 itens por nível desta tela. A listagem foi removida para não apresentar um menu incompleto.'
          : 'Não foi possível confirmar o menu neste contexto. Atualize para consultar o servidor.');
      }
    } finally { if (current()) this.busy.set(false); }
  }
  private merge(previous: EnterpriseRuntimeNavigationNode[], next: EnterpriseRuntimeNavigationNode[]): EnterpriseRuntimeNavigationNode[] {
    if (next.some(node => previous.some(old => old.id === node.id))) throw new Error('MENU_PAGINATION');
    if (previous.length + next.length > 200) throw new Error('MENU_LIMIT');
    return [...previous, ...next];
  }
}
