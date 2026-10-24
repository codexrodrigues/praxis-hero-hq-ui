import { DestroyRef, Injectable, effect, inject, untracked } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EnterpriseRuntimeContextService, decodePageAuthoringDocument, readStrongResourceEtag,
  type PageAuthoringDocument, type UiLayoutTarget, type UiLayoutReleaseHeadReceipt } from '@praxisui/core';
import { CorporateSessionService } from './corporate-session.service';
import { PRAXIS_API_BASE_URL } from './platform.config';

// Private host projections of existing Config HTTP DTOs, not a new SDK or persistence contract.
export interface CorporatePageCreation {
  creationKey: string; pageId: string; target: UiLayoutTarget; routePath: string;
  draftId: string; draftEtag: string;
  source: { kind: 'registered-native'; sourceId: string; revision: string };
}
export interface CorporatePublishedPage {
  schemaVersion: string; pageId: string; route: string; document: PageAuthoringDocument;
  contextVersion: string; receiptEtag: string; head: UiLayoutReleaseHeadReceipt;
}
export interface CorporatePageCatalog {
  schemaVersion: string; contextVersion: string; receiptEtag: string; nextCursor: string | null;
  items: { pageId: string; rootTarget: UiLayoutTarget; route: string; title: string; icon: string; head: UiLayoutReleaseHeadReceipt }[];
}
export interface CorporatePageReceipt<T> { body: T; etag: string; }
export class CorporatePageError extends Error {
  constructor(readonly code: 'CONTEXT_REQUIRED' | 'OBSOLETE' | 'UNCERTAIN' | 'CONTRACT' | 'HTTP', readonly status = 0) { super(code); }
}
export function corporatePageId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
}
export function corporatePageTarget(pageId: string): UiLayoutTarget {
  if (!corporatePageId(pageId)) throw new CorporatePageError('CONTRACT');
  return { componentType: 'praxis-dynamic-page', componentId: pageId };
}
export function corporatePageDocument(value: unknown): PageAuthoringDocument {
  const decoded = decodePageAuthoringDocument(value);
  if (!decoded.ok) throw new CorporatePageError('CONTRACT');
  return decoded.value;
}

/** Provide beside the corporate context and SDK lifecycle client, never in the demo root. */
@Injectable()
export class CorporatePagePilotService {
  private readonly http = inject(HttpClient);
  private readonly runtime = inject(EnterpriseRuntimeContextService);
  private readonly session = inject(CorporateSessionService);
  private readonly root = `${PRAXIS_API_BASE_URL}/praxis/config/pages`;
  private revision = 0;
  private sessionGeneration = -1;
  constructor() {
    const subscription = this.runtime.contextChanges$.subscribe(() => ++this.revision);
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
    effect(() => {
      this.session.generation(); this.session.authenticated();
      untracked(() => this.synchronizeSession());
    });
  }

  /** SESSION lifetime invalidates the shared SDK snapshot, including pending lifecycle responses.
   * Also called synchronously before dispatch/resume: an asynchronous effect is not a boundary. */
  synchronizeSession(): void {
    const generation = this.session.generation();
    if (generation !== this.sessionGeneration || !this.session.authenticated() && this.runtime.snapshot !== null) {
      this.sessionGeneration = generation;
      this.runtime.invalidate();
    }
  }

  createNative(creationKey: string, title: string): Promise<CorporatePageReceipt<CorporatePageCreation>> {
    this.uuid(creationKey);
    if (!title.trim() || title.length > 160) throw new CorporatePageError('CONTRACT');
    return this.creation('POST', { creationKey, title: title.trim(),
      source: { kind: 'registered-native', sourceId: 'quickstart:corporate-page', revision: '2' } }, creationKey);
  }
  reconcile(creationKey: string): Promise<CorporatePageReceipt<CorporatePageCreation>> {
    this.uuid(creationKey);
    return this.creation('GET', undefined, creationKey);
  }
  async catalog(cursor?: string): Promise<CorporatePageReceipt<CorporatePageCatalog>> {
    const result = await this.request<CorporatePageCatalog>('GET', this.root, undefined,
      cursor ? new HttpParams().set('cursor', cursor) : undefined);
    const value = result.body;
    if (value?.schemaVersion !== 'praxis.page-catalog/v1' || !Array.isArray(value.items)
        || !(value.nextCursor === null || typeof value.nextCursor === 'string') || typeof value.receiptEtag !== 'string') throw new CorporatePageError('CONTRACT');
    this.context(value.contextVersion);
    for (const item of value.items) {
      this.uuid(item.pageId); this.route(item.pageId, item.route); this.target(item.pageId, item.rootTarget);
      this.head(item.pageId, item.head);
      if (typeof item.title !== 'string' || typeof item.icon !== 'string') throw new CorporatePageError('CONTRACT');
    }
    return result;
  }
  async published(pageId: string): Promise<CorporatePageReceipt<CorporatePublishedPage>> {
    this.uuid(pageId);
    const result = await this.request<CorporatePublishedPage>('GET', `${this.root}/${pageId}/published`);
    const value = result.body;
    if (value?.schemaVersion !== 'praxis.published-page/v1' || value.pageId !== pageId || typeof value.receiptEtag !== 'string') throw new CorporatePageError('CONTRACT');
    this.context(value.contextVersion); this.route(pageId, value.route); this.head(pageId, value.head);
    value.document = corporatePageDocument(value.document);
    return result;
  }
  private async creation(method: 'GET' | 'POST', body: unknown, creationKey: string): Promise<CorporatePageReceipt<CorporatePageCreation>> {
    const result = await this.request<CorporatePageCreation>(method, method === 'GET' ? `${this.root}/by-creation-key` : this.root,
      body, method === 'GET' ? new HttpParams().set('creationKey', creationKey) : undefined);
    const value = result.body;
    if (!value || value.creationKey !== creationKey || value.draftEtag !== result.etag) throw new CorporatePageError('CONTRACT');
    this.uuid(value.pageId); this.uuid(value.draftId); this.target(value.pageId, value.target); this.route(value.pageId, value.routePath);
    if (value.source?.kind !== 'registered-native' || value.source.sourceId !== 'quickstart:corporate-page' || value.source.revision !== '2') throw new CorporatePageError('CONTRACT');
    return result;
  }
  private async request<T>(method: 'GET' | 'POST', url: string, body?: unknown, params?: HttpParams): Promise<CorporatePageReceipt<T>> {
    this.synchronizeSession();
    const context = this.runtime.snapshot;
    if (!this.session.authenticated() || context?.state !== 'ready' || !context.effectiveContext?.contextVersion) throw new CorporatePageError('CONTEXT_REQUIRED');
    const revision = this.revision, session = this.session.generation();
    const headers = this.runtime.applyHeaders(new HttpHeaders());
    let received = false;
    try {
      const response = await firstValueFrom(this.http.request<T>(method, url, { body, params, headers, observe: 'response' }));
      received = true;
      if (revision !== this.revision || session !== this.session.generation() || !this.session.authenticated()) throw new CorporatePageError(method === 'POST' ? 'UNCERTAIN' : 'OBSOLETE');
      const rawEtag = response.headers.get('ETag');
      // Published-read HTTP validators are weak receipts; draft writes require strong validators.
      const etag = method === 'GET' && !url.endsWith('/by-creation-key')
        ? (rawEtag && /^(?:W\/)?"[^"\\\r\n]+"$/.test(rawEtag) ? rawEtag : null)
        : readStrongResourceEtag(rawEtag);
      if (!etag || response.body === null || !(method === 'POST' ? [200, 201].includes(response.status) : response.status === 200)) throw new CorporatePageError(method === 'POST' ? 'UNCERTAIN' : 'CONTRACT');
      return { body: response.body, etag };
    } catch (error) {
      if (error instanceof CorporatePageError) throw error;
      if (revision !== this.revision || session !== this.session.generation()) throw new CorporatePageError(method === 'POST' ? 'UNCERTAIN' : 'OBSOLETE');
      if (method === 'POST' && (received || error instanceof HttpErrorResponse && [0, 502, 504].includes(error.status))) throw new CorporatePageError('UNCERTAIN');
      throw new CorporatePageError('HTTP', error instanceof HttpErrorResponse ? error.status : 0);
    }
  }
  private uuid(value: unknown): void { if (!corporatePageId(value)) throw new CorporatePageError('CONTRACT'); }
  private route(pageId: string, route: unknown): void { if (route !== `/pages/${pageId}`) throw new CorporatePageError('CONTRACT'); }
  private target(pageId: string, target: UiLayoutTarget): void {
    if (target?.componentType !== 'praxis-dynamic-page' || target.componentId !== pageId) throw new CorporatePageError('CONTRACT');
  }
  private head(pageId: string, head: UiLayoutReleaseHeadReceipt): void {
    this.target(pageId, head?.rootTarget); this.uuid(head?.activeReleaseRef);
    this.uuid(head?.headEtag);
  }
  private context(version: string): void {
    if (version !== this.runtime.effectiveContext?.contextVersion) throw new CorporatePageError('OBSOLETE');
  }
}
