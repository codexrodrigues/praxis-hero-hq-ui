import { ChangeDetectionStrategy, Component, DestroyRef, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EnterpriseRuntimeContextService, UiLayoutLifecycleService, UiLayoutLifecycleContractError,
  UiLayoutLifecycleHttpError, DynamicWidgetPageComponent, buildPublishedPageIdentity, validatePageAuthoringDocument, readStrongResourceEtag,
  type WidgetPageDefinition, type PageIdentity, type PageAuthoringDocument, type UiLayoutDraftWorkspaceReceipt, type UiLayoutReleaseReviewReceipt,
  type UiLayoutReleaseHeadReceipt, type UiLayoutLifecycleHttpReceipt } from '@praxisui/core';
import { materializeDynamicFormPageRuntimeInputs, validateDynamicFormPageWidget } from '@praxisui/dynamic-form';
import { CorporateFormEditorComponent } from './corporate-form-editor.component';
import { CorporateNavigationService } from '../../core/corporate-navigation.service';
import { CORPORATE_GROUPS_TARGET, corporateGroupsDocument, firstCorporateGroup, bindCorporatePage, type CorporateGroupsDocument } from '../../core/corporate-navigation.model';
import { CorporateSessionService } from '../../core/corporate-session.service';
import { CorporatePagePilotService, CorporatePageError, corporatePageId, corporatePageTarget,
  corporatePageDocument, type CorporatePageCatalog, type CorporatePublishedPage } from '../../core/corporate-page-pilot.service';

type Receipt<T> = UiLayoutLifecycleHttpReceipt<T>;

@Component({
  selector: 'app-corporate-pages',
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, DynamicWidgetPageComponent, CorporateFormEditorComponent],
  templateUrl: './corporate-pages.html', styleUrl: './corporate-pages.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CorporatePagesComponent {
  @ViewChild(CorporateFormEditorComponent) formEditor?: CorporateFormEditorComponent;
  readonly copyFrom = signal('');
  readonly copyOrigin = signal<CorporatePublishedPage | null>(null);
  readonly session = inject(CorporateSessionService);
  private readonly runtime = inject(EnterpriseRuntimeContextService);
  private readonly lifecycle = inject(UiLayoutLifecycleService);
  private readonly pages = inject(CorporatePagePilotService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly menu = inject(CorporateNavigationService);
  readonly groupsMode = this.route.snapshot.data['corporateGroups'] === true;
  readonly groupsDocument = signal<CorporateGroupsDocument | null>(null);
  groupId = '';
  bindingId = '';
  bindingGroupId = '';
  bindingLabel = '';
  bindingOrder = 0;
  groupOrder = 0;
  readonly publishedMode = this.route.snapshot.data['corporatePublished'] === true;
  readonly ready = signal(false);
  readonly busy = signal(false);
  readonly message = signal('');
  readonly fenced = signal(false);
  readonly pageId = signal('');
  readonly draftId = signal('');
  readonly releaseId = signal('');
  readonly creationKey = signal('');
  readonly workspace = signal<Receipt<UiLayoutDraftWorkspaceReceipt> | null>(null);
  readonly review = signal<Receipt<UiLayoutReleaseReviewReceipt> | null>(null);
  readonly head = signal<Receipt<UiLayoutReleaseHeadReceipt> | null>(null);
  readonly headAbsent = signal(false);
  readonly published = signal<CorporatePublishedPage | null>(null);
  readonly catalog = signal<CorporatePageCatalog | null>(null);
  readonly document = signal<PageAuthoringDocument | null>(null);
  readonly renderedPage = signal<WidgetPageDefinition | null>(null);
  readonly publishedIdentity = computed<PageIdentity | undefined>(() => {
    const published = this.published(); this.ready(); this.session.generation();
    const context = this.runtime.snapshot;
    return published ? buildPublishedPageIdentity(published.pageId, '/pages', {
      appId: 'quickstart-corporate-pages', tenantId: context?.effectiveContext?.activeTenant.tenantId,
      userId: context?.user.userId,
    }) : undefined;
  });
  title = '';
  reason = '';
  private epoch = 0;
  private epochSession = this.session.generation();
  private resumeAttempt = 0;
  private destroyed = false;
  private readonly commandKeys = new Map<string, string>();
  private lastQuery = '';

  constructor() {
    const destroy = inject(DestroyRef);
    this.readLocation();
    const contexts = this.runtime.contextChanges$.subscribe(() => this.invalidate());
    const params = combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(() => {
      if (this.queryIdentity() === this.lastQuery) return;
      this.invalidate();
      this.readLocation();
      void this.resume();
    });
    destroy.onDestroy(() => { this.destroyed = true; ++this.epoch; contexts.unsubscribe(); params.unsubscribe(); });
    effect(() => {
      const generation = this.session.generation(), authenticated = this.session.authenticated();
      untracked(() => {
        this.pages.synchronizeSession();
        if (generation !== this.epochSession || !authenticated) this.invalidate();
      });
    });
    void this.resume();
  }

  private invalidate(): void {
    ++this.epoch; this.epochSession = this.session.generation(); this.ready.set(false); this.busy.set(false);
    this.workspace.set(null); this.review.set(null); this.head.set(null); this.headAbsent.set(false);
    this.copyOrigin.set(null);
    this.published.set(null); this.catalog.set(null); this.document.set(null); this.renderedPage.set(null);
    this.title = ''; this.reason = ''; this.commandKeys.clear();
    this.groupsDocument.set(null); this.groupId = ''; this.bindingId = ''; this.bindingGroupId = ''; this.bindingLabel = ''; this.bindingOrder = 0;
  }
  private current(epoch: number): boolean { return !this.destroyed && epoch === this.epoch && this.epochSession === this.session.generation() && this.session.authenticated(); }

  async resume(): Promise<void> {
    if (this.destroyed || this.session.busy()) return;
    const attempt = ++this.resumeAttempt;
    this.pages.synchronizeSession();
    let generation = this.session.generation();
    if (!this.session.authenticated()) {
      const verification = this.session.restore();
      generation = this.session.generation(); // restore begins this generation synchronously, before its HTTP wait.
      if (!await verification || generation !== this.session.generation()) return;
    }
    const valid = () => !this.destroyed && attempt === this.resumeAttempt
      && generation === this.session.generation() && this.session.authenticated();
    if (!valid()) return;
    this.pages.synchronizeSession();
    try {
      // Never reuse an SDK context from a previous SESSION, even if an effect coalesced state changes.
      const context = await this.runtime.ready();
      if (!valid()) return;
      if (context?.state !== 'ready') { this.ready.set(false); return; }
      this.ready.set(true);
      this.readLocation();
      await this.reload();
    } catch { if (valid()) this.message.set('Não foi possível confirmar o contexto. Volte à entrada corporativa.'); }
  }
  private readLocation(): void {
    const params = this.route.snapshot.queryParamMap;
    this.pageId.set(this.groupsMode ? CORPORATE_GROUPS_TARGET.componentId : this.publishedMode ? this.route.snapshot.paramMap.get('pageId') ?? '' : params.get('pageId') ?? '');
    this.draftId.set(params.get('draftId') ?? ''); this.releaseId.set(params.get('releaseId') ?? '');
    this.copyFrom.set(!this.groupsMode && !this.publishedMode ? params.get('copyFrom') ?? '' : '');
    this.creationKey.set(params.get('creationKey') ?? ''); this.lastQuery = this.queryIdentity();
  }
  private queryIdentity(): string {
    return JSON.stringify([this.route.snapshot.paramMap.get('pageId'), ...['pageId', 'draftId', 'releaseId', 'creationKey', 'copyFrom'].map(key => this.route.snapshot.queryParamMap.get(key))]);
  }
  private async location(): Promise<void> {
    const queryParams = { pageId: this.pageId() || null, draftId: this.draftId() || null,
      releaseId: this.releaseId() || null, creationKey: this.creationKey() || null, copyFrom: this.copyFrom() || null };
    this.lastQuery = JSON.stringify([this.route.snapshot.paramMap.get('pageId'), queryParams.pageId, queryParams.draftId, queryParams.releaseId, queryParams.creationKey, queryParams.copyFrom]);
    await this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }
  private target() { return this.groupsMode ? CORPORATE_GROUPS_TARGET : corporatePageTarget(this.pageId()); }
  private key(operation: string, payload: unknown): string {
    const fingerprint = JSON.stringify([operation, this.pageId(), this.draftId(), payload]);
    let key = this.commandKeys.get(fingerprint);
    if (!key) { key = crypto.randomUUID(); this.commandKeys.set(fingerprint, key); }
    return key;
  }
  private async action(write: boolean, operation: (epoch: number) => Promise<void>): Promise<void> {
    if (this.busy() || !this.ready() || !this.session.authenticated() || write && this.fenced()) return;
    this.pages.synchronizeSession();
    if (!this.ready()) return;
    const epoch = this.epoch;
    this.epochSession = this.session.generation();
    this.busy.set(true); this.message.set('');
    try { await operation(epoch); }
    catch (error) {
      if (!this.current(epoch)) return;
      const status = error instanceof CorporatePageError || error instanceof UiLayoutLifecycleHttpError ? error.status : 0;
      if ([401, 403, 404].includes(status)) {
        this.workspace.set(null); this.review.set(null); this.head.set(null); this.headAbsent.set(false);
        this.copyOrigin.set(null);
        this.published.set(null); this.catalog.set(null); this.document.set(null); this.renderedPage.set(null); this.groupsDocument.set(null); this.title = '';
      }
      if (write) this.fenced.set(true); // Read/reconcile before any subsequent command; never retry automatically.
      this.message.set(this.errorMessage(error));
    } finally { if (epoch === this.epoch) this.busy.set(false); }
  }
  private errorMessage(error: unknown): string {
    const code = error instanceof CorporatePageError || error instanceof UiLayoutLifecycleContractError ? error.code : '';
    const status = error instanceof CorporatePageError || error instanceof UiLayoutLifecycleHttpError ? error.status : 0;
    if (code === 'UNCERTAIN' || code === 'COMMAND_OUTCOME_UNCERTAIN') return 'Resultado incerto. Consulte o servidor antes de qualquer novo comando; a operação não será repetida automaticamente.';
    if (status === 409 || status === 412) return 'O estado mudou no servidor. Releia o rascunho ou a revisão antes de continuar.';
    if (status === 401) return 'Sua sessão precisa ser confirmada novamente na entrada corporativa.';
    if (status === 403) return 'Sua sessão não tem permissão para esta operação.';
    if (status === 404) return 'Não encontrado neste contexto. Uma criação em andamento pode ainda não estar disponível; não recrie automaticamente.';
    if (status === 503) return 'O serviço está indisponível. Nenhuma publicação foi confirmada.';
    return 'Não foi possível confirmar esta operação. Releia o estado do servidor antes de continuar.';
  }

  async create(): Promise<void> {
    if (this.groupsMode || this.copyFrom() || this.creationKey() || this.pageId() || !this.title.trim()) return;
    await this.action(true, async epoch => {
      const title = this.title.trim();
      this.creationKey.set(crypto.randomUUID()); await this.location();
      if (!this.current(epoch)) return;
      const receipt = await this.pages.createNative(this.creationKey(), title);
      if (!this.current(epoch)) return;
      this.pageId.set(receipt.body.pageId); this.draftId.set(receipt.body.draftId);
      await this.location();
      await this.loadDraft(epoch);
      if (this.current(epoch)) this.message.set('Rascunho criado no servidor. Ele ainda não está publicado.');
    });
  }
  async copyPublished(): Promise<void> {
    const origin = this.copyOrigin(), title = this.title.trim();
    if (!origin || origin.pageId !== this.copyFrom() || !title || this.creationKey()) return;
    await this.action(true, async epoch => {
      this.creationKey.set(crypto.randomUUID()); await this.location();
      if (!this.current(epoch)) return;
      const receipt = await this.pages.copyPublished(this.creationKey(), title, origin.copySource);
      if (!this.current(epoch)) return;
      this.pageId.set(receipt.body.pageId); this.draftId.set(receipt.body.draftId);
      await this.location(); await this.loadDraft(epoch);
      if (this.current(epoch)) {
        if (this.document()?.config.navigation.length) throw new CorporatePageError('CONTRACT');
        this.message.set('Cópia criada como novo rascunho. Escolha um vínculo de menu e publique pelo fluxo editorial.');
      }
    });
  }
  async reconcile(): Promise<void> {
    await this.action(false, async epoch => {
      const receipt = await this.pages.reconcile(this.creationKey());
      if (!this.current(epoch)) return;
      if (this.copyFrom() && (receipt.body.source.kind !== 'published-page' || receipt.body.source.pageId !== this.copyFrom())) throw new CorporatePageError('CONTRACT');
      this.pageId.set(receipt.body.pageId); this.draftId.set(receipt.body.draftId);
      await this.location(); await this.loadDraft(epoch);
    });
  }
  async createGroups(): Promise<void> {
    if (!this.groupsMode || this.draftId() || this.releaseId()) return;
    await this.action(true, async epoch => {
      await this.loadHead(epoch);
      if (!this.current(epoch) || !this.headAbsent()) return;
      if (!this.creationKey()) { this.creationKey.set(crypto.randomUUID()); await this.location(); }
      const value = await this.lifecycle.createDraft(this.target(), this.creationKey());
      if (!this.current(epoch)) return;
      this.draftId.set(value.body.draft.draftRef); this.acceptDraft(value); await this.location();
      this.message.set('Rascunho do primeiro grupo criado. Salve a revisão antes de definir sua abrangência.');
    });
  }
  async reconcileGroups(): Promise<void> {
    await this.action(false, async epoch => {
      const value = await this.lifecycle.readDraftByCreationKey(this.target(), this.creationKey());
      if (!this.current(epoch)) return;
      if (value.body.rootTarget.componentType !== this.target().componentType || value.body.rootTarget.componentId !== this.target().componentId) throw new CorporatePageError('CONTRACT');
      this.draftId.set(value.body.draftRef); await this.location(); await this.loadDraft(epoch); await this.loadHead(epoch);
    });
  }
  async reload(): Promise<void> {
    await this.action(false, async epoch => {
      if (this.publishedMode) { await this.loadPublished(epoch); return; }
      if (this.pageId() && this.draftId()) await this.loadDraft(epoch);
      if (this.pageId() && this.releaseId()) await this.loadReview(epoch);
      if (this.groupsMode) await this.loadHead(epoch);
      else if (!this.pageId() && this.copyFrom()) {
        this.copyOrigin.set(null);
        const value = await this.pages.published(this.copyFrom());
        if (this.current(epoch)) { this.copyOrigin.set(value.body); this.title = `${value.body.document.config.presentation.title} — cópia`.slice(0, 160); }
      } else if (!this.pageId()) await this.loadCatalog(epoch);
    });
  }
  private async loadDraft(epoch: number): Promise<void> {
    if (!corporatePageId(this.draftId())) throw new CorporatePageError('CONTRACT');
    const value = await this.lifecycle.readDraft(this.target(), this.draftId());
    if (!this.current(epoch)) return;
    if ('status' in value) throw new CorporatePageError('CONTRACT');
    this.acceptDraft(value);
    this.fenced.set(false);
  }
  private acceptDraft(value: Receipt<UiLayoutDraftWorkspaceReceipt>): void {
    const body = value.body, target = this.target();
    if (body.draft?.draftRef !== this.draftId() || body.draft.rootTarget?.componentId !== target.componentId
        || body.draft.rootTarget.componentType !== target.componentType || body.targets?.length !== 1
        || body.targets[0].target.componentId !== target.componentId || body.targets[0].target.componentType !== target.componentType
        || !readStrongResourceEtag(value.etag)) throw new CorporatePageError('CONTRACT');
    if (this.groupsMode) {
      const document = corporateGroupsDocument(body.targets[0].working.document);
      if (document.config.groups.length > 1) throw new CorporatePageError('CONTRACT');
      this.groupsDocument.set(document); this.workspace.set(value);
      const group = document.config.groups[0];
      this.groupId = group?.id ?? (this.groupId || crypto.randomUUID());
      this.title = group?.label ?? ''; this.groupOrder = group?.order ?? 0;
      if (body.frozenReleaseRef) this.releaseId.set(body.frozenReleaseRef);
      return;
    }
    const document = corporatePageDocument(body.targets[0].working.document);
    const admitted = validatePageAuthoringDocument(document, { 'praxis-dynamic-form': validateDynamicFormPageWidget });
    const widgets = document.config.definition.widgets;
    if (!admitted.ok || document.config.presentation.icon !== 'home' || widgets.length !== 1
        || widgets[0].definition.id !== 'praxis-dynamic-form'
        || Object.keys(widgets[0].definition.inputs ?? {}).some(key => key !== 'config')) throw new CorporatePageError('CONTRACT');
    this.workspace.set(value); this.document.set(document); this.title = document.config.presentation.title;
    this.selectBinding(document.config.navigation[0]?.id ?? '');
    if (body.frozenReleaseRef) this.releaseId.set(body.frozenReleaseRef);
  }
  async saveRevision(): Promise<void> {
    const workspace = this.workspace(), original = this.groupsMode ? this.groupsDocument() : this.document();
    if (!workspace || !original || !this.title.trim() || !this.reason.trim() || this.groupsMode && !this.headAbsent()) return;
    let edited: PageAuthoringDocument | null = null;
    if (!this.groupsMode) {
      try { edited = this.formEditor?.readDocument() ?? null; if (!edited) throw new Error('Editor not ready'); }
      catch { this.message.set('Corrija o conteúdo no editor. Bindings, contexto e recursos do Form não podem mudar neste rascunho. Suas alterações continuam no editor.'); return; }
    }
    await this.action(true, async epoch => {
      let document: CorporateGroupsDocument | PageAuthoringDocument;
      if (this.groupsMode) {
        await this.loadHead(epoch);
        if (!this.current(epoch) || !this.headAbsent()) return;
        document = firstCorporateGroup(corporateGroupsDocument(original), this.groupId, this.title, this.groupOrder);
      } else {
        document = corporatePageDocument(edited);
        document.config.presentation.title = this.title.trim();
        if (this.bindingGroupId) {
          if (!this.menu.ready() || !this.menu.groups().some(group => group.id === this.bindingGroupId)) throw new CorporatePageError('CONTRACT');
          this.bindingId ||= crypto.randomUUID();
          document = bindCorporatePage(document, this.bindingId, this.bindingGroupId, this.bindingLabel, this.bindingOrder);
        }
      }
      const command = { target: this.target(), authoringDocument: document as unknown as Record<string, unknown>, reason: this.reason.trim() };
      const value = await this.lifecycle.createRevision(this.target(), this.draftId(), workspace.etag,
        { ...command, commandRef: this.key('revision', [workspace.etag, command]) });
      if (!this.current(epoch)) return;
      this.acceptDraft({ ...value, body: value.body.nextDraft });
      this.message.set('Revisão salva no servidor. A publicação continua separada.');
    });
  }
  async assign(): Promise<void> {
    const workspace = this.workspace(), context = this.runtime.effectiveContext;
    if (!workspace || !context?.activeOrganizationId || this.groupsMode && !this.headAbsent()) return;
    await this.action(true, async epoch => {
      const command = { target: this.target(), layerClass: 'ORGANIZATION' as const,
        selector: { tenant: context.activeTenant.tenantId, organization: context.activeOrganizationId },
        priority: 0, contributionKey: 'corporate-page-pilot' };
      const value = await this.lifecycle.createAssignment(this.target(), this.draftId(), workspace.etag,
        { ...command, commandRef: this.key('assignment', [workspace.etag, command]) });
      if (this.current(epoch)) { this.acceptDraft({ ...value, body: value.body.nextDraft }); this.message.set('Abrangência organizacional registrada pelo servidor.'); }
    });
  }
  async freeze(): Promise<void> {
    const workspace = this.workspace(); if (!workspace || this.groupsMode && !this.headAbsent()) return;
    await this.action(true, async epoch => {
      const value = await this.lifecycle.freezeRelease(this.target(), this.draftId(), workspace.etag,
        { commandRef: this.key('freeze', workspace.etag) });
      if (!this.current(epoch)) return;
      this.acceptDraft({ ...value, body: value.body.nextDraft });
      this.releaseId.set(value.body.release.releaseRef);
      await this.location(); await this.loadReview(epoch);
    });
  }
  private async loadReview(epoch: number): Promise<void> {
    if (!corporatePageId(this.releaseId())) throw new CorporatePageError('CONTRACT');
    const value = await this.lifecycle.readReview(this.target(), this.releaseId());
    if (!this.current(epoch)) return;
    if ('status' in value || value.body.releaseRef !== this.releaseId() || value.body.rootTarget.componentId !== this.target().componentId
        || value.body.rootTarget.componentType !== this.target().componentType || `"${value.body.reviewEtag}"` !== value.etag) throw new CorporatePageError('CONTRACT');
    this.review.set(value); this.fenced.set(false);
    await this.loadHead(epoch);
  }
  private async loadHead(epoch: number): Promise<void> {
    this.head.set(null); this.headAbsent.set(false);
    try {
      const head = await this.lifecycle.readHead(this.target());
      if (!this.current(epoch)) return;
      if ('status' in head || head.body.rootTarget.componentId !== this.target().componentId || head.body.rootTarget.componentType !== this.target().componentType
          || `"${head.body.headEtag}"` !== head.etag) throw new CorporatePageError('CONTRACT');
      this.head.set(head);
      if (this.groupsMode) this.message.set('Já existe um agregado publicado. Reutilize um grupo visível no menu; este piloto não substitui o agregado por uma lista parcial.');
    } catch (error) {
      if (this.current(epoch) && error instanceof UiLayoutLifecycleHttpError && error.status === 404) this.headAbsent.set(true);
      else throw error;
    }
  }
  async submit(): Promise<void> {
    const review = this.review(); if (!review) return;
    await this.action(true, async epoch => {
      const value = await this.lifecycle.submit(this.target(), this.releaseId(), review.etag);
      if (this.current(epoch)) { this.review.set(value); this.message.set('Release enviada para revisão. Compartilhe o link de revisão com outro ator autorizado.'); }
    });
  }
  async approve(): Promise<void> {
    const review = this.review(); if (!review || !this.reason.trim()) return;
    await this.action(true, async epoch => {
      const value = await this.lifecycle.approve(this.target(), this.releaseId(), review.etag, { reason: this.reason.trim() });
      if (this.current(epoch)) { this.review.set(value); this.message.set('Aprovação confirmada. Publicar exige uma ação separada.'); }
    });
  }
  async publish(): Promise<void> {
    const head = this.head(); if ((!head && !this.headAbsent()) || !this.reason.trim() || this.groupsMode && !this.headAbsent()) return;
    await this.action(true, async epoch => {
      const value = await this.lifecycle.publish(this.target(), head
        ? { kind: 'match', etag: head.etag } : { kind: 'first-publish' }, { releaseId: this.releaseId(), reason: this.reason.trim() });
      if (!this.current(epoch)) return;
      if (value.body.activeReleaseRef !== this.releaseId()) throw new CorporatePageError('CONTRACT');
      this.head.set(value);
      if (this.groupsMode) {
        await this.loadHead(epoch); await this.menu.refresh();
        if (this.current(epoch)) this.message.set('Primeiro agregado publicado. Atualize o menu e vincule sua página a um grupo visível.');
      } else {
        await this.loadPublished(epoch); await this.menu.refresh();
        if (this.current(epoch)) this.message.set('Publicação e leitura confirmadas pelo servidor.');
      }
    });
  }
  private async loadPublished(epoch: number): Promise<void> {
    this.published.set(null); this.document.set(null); this.renderedPage.set(null);
    const value = await this.pages.published(this.pageId());
    if (!this.current(epoch)) return;
    if (!this.publishedMode && this.releaseId() && value.body.head.activeReleaseRef !== this.releaseId()) throw new CorporatePageError('CONTRACT');
    const admitted = validatePageAuthoringDocument(value.body.document, { 'praxis-dynamic-form': validateDynamicFormPageWidget });
    if (!admitted.ok) throw new CorporatePageError('CONTRACT');
    const projection = structuredClone(admitted.value.config.definition);
    for (const widget of projection.widgets) {
      const runtime = materializeDynamicFormPageRuntimeInputs(widget.definition.inputs, value.body.pageId, widget.key);
      if (!runtime.inputs) throw new CorporatePageError('CONTRACT');
      widget.definition.inputs = runtime.inputs;
    }
    // Only the owner's transient projection enters the renderer; it never replaces stored authorship.
    this.renderedPage.set(projection);
    this.published.set(value.body); this.document.set(value.body.document);
  }
  async refreshCatalog(): Promise<void> { await this.action(false, epoch => this.loadCatalog(epoch)); }
  async more(): Promise<void> {
    const previous = this.catalog(); if (!previous?.nextCursor) return;
    await this.action(false, async epoch => {
      const value = await this.pages.catalog(previous.nextCursor!);
      if (this.current(epoch)) this.catalog.set({ ...value.body, items: [...previous.items, ...value.body.items] });
    });
  }
  private async loadCatalog(epoch: number): Promise<void> {
    const value = await this.pages.catalog(); if (this.current(epoch)) this.catalog.set(value.body);
  }
  entryParams() {
    return { corporateView: this.groupsMode ? 'groups' : this.publishedMode ? 'published' : 'editor', corporatePageId: this.pageId() || null,
      corporateDraftId: this.draftId() || null, corporateReleaseId: this.releaseId() || null, corporateCreationKey: this.creationKey() || null, corporateCopyFrom: this.copyFrom() || null };
  }
  readonly editorPath = this.groupsMode ? '/workspace-corporativo/grupos' : '/workspace-corporativo/paginas';
  selectBinding(id: string): void {
    this.bindingId = id;
    const binding = this.document()?.config.navigation.find(item => item.id === id);
    this.bindingGroupId = binding?.groupId ?? ''; this.bindingLabel = binding?.label ?? ''; this.bindingOrder = binding?.order ?? 0;
  }
  reviewParams() { return { pageId: this.pageId(), releaseId: this.releaseId() }; }
  canAuthor(): boolean { return this.runtime.effectiveContext?.capabilities.includes('ui.authoring.configure') ?? false; }
  canPublish(): boolean { return this.runtime.effectiveContext?.capabilities.includes('ui.layout.publish') ?? false; }
}
