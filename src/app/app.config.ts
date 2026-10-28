import { PRAXIS_ASSISTANT_VOICE_INPUT_MODE } from '@praxisui/ai';
import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  importProvidersFrom,
  inject,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import {
  FetchBackend,
  HttpBackend,
  HttpErrorResponse,
  HttpEvent,
  HttpHeaders,
  HttpInterceptorFn,
  HttpResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  CurrencyPipe,
  DatePipe,
  DecimalPipe,
  LowerCasePipe,
  PercentPipe,
  TitleCasePipe,
  UpperCasePipe,
  registerLocaleData,
} from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';

registerLocaleData(localePt, 'pt-BR');
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import {
  API_CONFIG_STORAGE_OPTIONS,
  type ApiConfigStorageOptions,
  API_URL,
  type ApiUrlConfig,
  ASYNC_CONFIG_STORAGE,
  ApiConfigStorage,
  ComponentMetadataRegistry,
  GenericCrudService,
  GlobalActionService,
  LoadingContext,
  LoadingOrchestrator,
  PRAXIS_LOADING_CTX,
  provideGlobalConfig,
  provideGlobalConfigReady,
  providePraxisDynamicPageMetadata,
  providePraxisFooterLinksMetadata,
  providePraxisHeroBannerMetadata,
  providePraxisLegalNoticeMetadata,
  providePraxisLoadingDefaults,
  providePraxisRelatedResourceOutletMetadata,
  providePraxisRichTextBlockMetadata,
  providePraxisUserContextSummaryMetadata,
  withPraxisHttpLoading,
} from '@praxisui/core';
import { providePraxisDynamicFieldsCore } from '@praxisui/dynamic-fields';
import {
  providePraxisCharts,
  providePraxisChartsI18n,
  providePraxisChartsMetadata,
} from '@praxisui/charts';
import { providePraxisCrudMetadata } from '@praxisui/crud';
import {
  providePraxisDialogMetadata,
  providePraxisDialogGlobalActions,
  providePraxisQuickViewDialogPresenter,
  providePraxisSurfaceGlobalActions,
} from '@praxisui/dialog';
import {
  PraxisDynamicForm,
  providePraxisDynamicFormMetadata,
  providePraxisFilterFormMetadata,
} from '@praxisui/dynamic-form';
import { providePraxisExpansionMetadata } from '@praxisui/expansion';
import { providePraxisFilesUploadMetadata } from '@praxisui/files-upload';
import { providePraxisMetadataEditorMetadata } from '@praxisui/metadata-editor';
import { AI_BACKEND_STORAGE_OPTIONS } from '@praxisui/ai';
import {
  PAGE_BUILDER_AGENTIC_AUTHORING_OPTIONS,
  providePraxisPageBuilderMetadata,
} from '@praxisui/page-builder';
import {
  PRAXIS_RICH_BLOCK_PRESETS,
  providePraxisQuickViewRichContentRenderer,
  providePraxisRichContentMetadata,
  type RichBlockPresetDefinition,
} from '@praxisui/rich-content';
import {
  GLOBAL_CONFIG_DYNAMIC_FORM_COMPONENT,
  providePraxisSettingsPanelBridge,
  providePraxisSurfaceDrawerBridge,
} from '@praxisui/settings-panel';
import { providePraxisStepperMetadata } from '@praxisui/stepper';
import { providePraxisTableMetadata, providePraxisAnalyticalDrawerSchemas } from '@praxisui/table';
import { providePraxisTabsMetadata } from '@praxisui/tabs';
import { providePraxisListMetadata } from '@praxisui/list';
import { HERO_HQ_ANALYTICAL_DRAWER_SCHEMAS } from './core/analytical-drawer-schemas.catalog';
import { HERO_TACTICAL_RADAR_METADATA } from './pages/dashboard/hero-tactical-radar.component';
import { reconcilePersistedDashboardPage } from './pages/dashboard/dashboard-page.definition';
import { routes } from './app.routes';
import { GLOBAL_CONFIG_SEED, PRAXIS_API_BASE_URL } from './core/platform.config';
import { corporateSessionInterceptor } from './core/corporate-session.interceptor';
import { CorporateSessionBackend } from './core/corporate-session.backend';
import { CORPORATE_RUNTIME_AUTHORITY_PROVIDERS } from './core/corporate-runtime.providers';
import { corporateRequestPath, demoApiRequest } from './core/corporate-session-target';

const API_URL_VALUE: ApiUrlConfig = {
  default: {
    baseUrl: PRAXIS_API_BASE_URL,
    trustedOrigins: [
      'http://localhost:8088',
      'http://127.0.0.1:8088',
      'http://praxis-api-quickstart.onrender.com',
      'https://praxis-api-quickstart.onrender.com',
    ],
  },
};

interface CachedStatsEntry {
  expiresAt: number;
  stream$: Observable<HttpEvent<unknown>>;
}

const statsRequestCache = new Map<string, CachedStatsEntry>();
const STATS_DEDUPE_TTL_MS = 2500;

function isDomainMutationRequest(method: string, url: string): boolean {
  const upper = method.toUpperCase();
  if (upper !== 'POST' && upper !== 'PUT' && upper !== 'PATCH' && upper !== 'DELETE') {
    return false;
  }
  if (!url.includes('/api/') || url.includes('/praxis/config/')) {
    return false;
  }
  const cleanUrl = url.split('?')[0];
  return !(
    cleanUrl.endsWith('/filter') ||
    cleanUrl.endsWith('/filter/cursor') ||
    cleanUrl.includes('/stats/') ||
    cleanUrl.endsWith('/evaluation') ||
    cleanUrl.endsWith('/locate') ||
    cleanUrl.endsWith('/by-ids')
  );
}

const praxisStatsDedupeInterceptor: HttpInterceptorFn = (req, next) => {
  const cleanUrl = req.url.split('?')[0];

  if (isDomainMutationRequest(req.method, req.url)) {
    return next(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          statsRequestCache.clear();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('praxis:hero-hq:telemetry-dirty'));
          }
        }
      }),
    );
  }

  if (req.method !== 'POST' || !cleanUrl.endsWith('/stats/group-by')) {
    return next(req);
  }

  const tenant = req.headers.get('X-Tenant-ID') || 'shield-hq';
  const user = req.headers.get('X-User-ID') || 'nick.fury';
  const rawBody = req.body && typeof req.body === 'object' ? (req.body as Record<string, any>) : null;
  const isSimpleCountGroupBy =
    rawBody &&
    typeof rawBody['field'] === 'string' &&
    (!rawBody['filter'] || Object.keys(rawBody['filter']).length === 0) &&
    !rawBody['limit'] &&
    Array.isArray(rawBody['metrics']) &&
    rawBody['metrics'].length === 1 &&
    rawBody['metrics'][0]?.operation === 'COUNT';
  const bodyKey = isSimpleCountGroupBy
    ? `count-by:${rawBody['field']}`
    : typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body ?? {});
  const cacheKey = `${tenant}|${user}|${req.url}|${bodyKey}`;
  const now = Date.now();
  const cached = statsRequestCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.stream$;
  }

  const stream$ = next(req).pipe(
    tap({
      error: () => {
        statsRequestCache.delete(cacheKey);
      },
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  statsRequestCache.set(cacheKey, {
    expiresAt: now + STATS_DEDUPE_TTL_MS,
    stream$,
  });

  return stream$;
};

const praxisDashboardSnapshotReconcileInterceptor: HttpInterceptorFn = (req, next) => {
  if (
    !demoApiRequest(req.url) || corporateRequestPath(req.url) !== null ||
    req.method !== 'GET' ||
    !req.url.includes('/praxis/config/ui') ||
    !req.urlWithParams.includes('dynamic-page:')
  ) {
    return next(req);
  }

  return next(req).pipe(
    map((event) => {
      if (!(event instanceof HttpResponse) || !event.body || typeof event.body !== 'object') {
        return event;
      }
      const body = event.body as Record<string, any>;
      if (body['payload'] && typeof body['payload'] === 'object') {
        const reconciledPayload = reconcilePersistedDashboardPage(body['payload']);
        if (reconciledPayload !== body['payload']) {
          return event.clone({
            body: {
              ...body,
              payload: reconciledPayload,
            },
          });
        }
      } else if (Array.isArray(body['widgets'])) {
        const reconciledBody = reconcilePersistedDashboardPage(body);
        if (reconciledBody !== body) {
          return event.clone({
            body: reconciledBody,
          });
        }
      }
      return event;
    }),
  );
};

const praxisApiLoadingBridgeInterceptor: HttpInterceptorFn = (req, next) => {
  const orchestrator = inject(LoadingOrchestrator);

  if (req.context.get(PRAXIS_LOADING_CTX)) {
    return next(req);
  }

  const isPraxisResource = req.url.includes('/api/') || req.url.includes('/schemas/');
  if (!isPraxisResource) {
    return next(req);
  }

  const isSchema = req.url.includes('/schemas');
  const ctx: LoadingContext = {
    scope: {
      componentType: 'HttpClient',
      componentId: 'praxis-api-bridge',
      routeKey: req.url,
    },
    phase: isSchema ? 'schema' : 'data',
    label: isSchema ? 'Carregando esquemas governados...' : 'Sincronizando dados táticos...',
    blocking: false,
  };

  orchestrator.begin(ctx);
  return next(req).pipe(
    finalize(() => {
      orchestrator.end(ctx);
    }),
  );
};

const praxisSimulatedSessionConfigFallbackInterceptor: HttpInterceptorFn = (req, next) => {
  if (!demoApiRequest(req.url) || corporateRequestPath(req.url) !== null || !req.url.includes('/praxis/config/ui') || typeof localStorage === 'undefined') {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      const errorCode =
        typeof error.error === 'object' && error.error !== null
          ? (error.error as Record<string, unknown>)['code']
          : undefined;
      if (errorCode !== 'SESSION_REQUIRED') {
        return throwError(() => error);
      }

      const tenant = req.headers.get('X-Tenant-ID') || 'shield-hq';
      const user = req.headers.get('X-User-ID') || 'nick.fury';
      let componentId = req.params.get('componentId') || '';
      if (!componentId) {
        try {
          const parsed = new URL(req.urlWithParams, 'http://localhost');
          componentId = parsed.searchParams.get('componentId') || 'default';
        } catch {
          componentId = 'default';
        }
      }
      const storageKey = `praxis:ui-config-sim:${tenant}:${user}:${componentId}`;

      if (req.method === 'GET') {
        const raw = localStorage.getItem(storageKey);
        if (!raw) {
          return throwError(
            () =>
              new HttpErrorResponse({
                status: 404,
                statusText: 'Not Found',
                url: req.urlWithParams,
                error: { message: 'Not found in simulated persona config store' },
              }),
          );
        }
        try {
          const record = JSON.parse(raw) as {
            payload: unknown;
            scope: string;
            version: number;
            etag: string;
          };
          return of(
            new HttpResponse({
              status: 200,
              url: req.urlWithParams,
              headers: new HttpHeaders({ ETag: record.etag || `W/"${record.version || 1}"` }),
              body: record,
            }),
          );
        } catch {
          return throwError(() => error);
        }
      }

      if (req.method === 'PUT' || req.method === 'POST') {
        let existingVersion = 0;
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as { version?: number };
            existingVersion = Number(parsed?.version ?? 0) || 0;
          } catch {
            existingVersion = 0;
          }
        }
        const incomingBody =
          typeof req.body === 'string'
            ? (JSON.parse(req.body) as Record<string, unknown>)
            : ((req.body ?? {}) as Record<string, unknown>);
        const payload =
          incomingBody && typeof incomingBody === 'object' && 'payload' in incomingBody
            ? incomingBody['payload']
            : incomingBody;
        const nextVersion = existingVersion + 1;
        const nextEtag = `W/"${nextVersion}"`;
        const record = {
          payload,
          scope: 'user',
          version: nextVersion,
          etag: nextEtag,
        };
        localStorage.setItem(storageKey, JSON.stringify(record));
        return of(
          new HttpResponse({
            status: 200,
            url: req.urlWithParams,
            headers: new HttpHeaders({ ETag: nextEtag }),
            body: record,
          }),
        );
      }

      if (req.method === 'DELETE') {
        localStorage.removeItem(storageKey);
        return of(
          new HttpResponse({
            status: 204,
            url: req.urlWithParams,
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    ...CORPORATE_RUNTIME_AUTHORITY_PROVIDERS,
    { provide: PRAXIS_ASSISTANT_VOICE_INPUT_MODE, useValue: 'governed-transcription' },
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(
      withPraxisHttpLoading(),
      withInterceptors([
        corporateSessionInterceptor,
        (req, next) => {
          // Corporate runtime identity belongs to the server session, never to
          // the demo persona or its synthetic bearer token. Core owns context headers.
          if (corporateRequestPath(req.url) !== null || !demoApiRequest(req.url)) return next(req);
          const tenant =
            typeof localStorage !== 'undefined'
              ? localStorage.getItem('pax.api.tenant') || 'shield-hq'
              : 'shield-hq';
          const user =
            typeof localStorage !== 'undefined'
              ? localStorage.getItem('praxis.demoUserId') ||
                localStorage.getItem('pax.api.user') ||
                'nick.fury'
              : 'nick.fury';
          const token =
            typeof localStorage !== 'undefined'
              ? localStorage.getItem('pax.api.token')
              : null;
          const headers: Record<string, string> = {
            'X-Tenant-ID': tenant,
            'X-Tenant': tenant,
            'X-User-ID': user,
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          const cloned = req.clone({
            setHeaders: headers,
          });
          return next(cloned);
        },
        praxisStatsDedupeInterceptor,
        praxisSimulatedSessionConfigFallbackInterceptor,
        praxisDashboardSnapshotReconcileInterceptor,
        praxisApiLoadingBridgeInterceptor,
      ]),
    ),
    FetchBackend,
    { provide: HttpBackend, useClass: CorporateSessionBackend },
    ...providePraxisDynamicFieldsCore(),
    providePraxisCrudMetadata(),
    providePraxisTableMetadata(),
    providePraxisAnalyticalDrawerSchemas(HERO_HQ_ANALYTICAL_DRAWER_SCHEMAS),
    providePraxisChartsMetadata(),
    providePraxisListMetadata(),
    providePraxisDynamicFormMetadata(),
    providePraxisFilterFormMetadata(),
    providePraxisRichContentMetadata(),
    providePraxisQuickViewRichContentRenderer(),
    {
      provide: PRAXIS_RICH_BLOCK_PRESETS,
      useValue: [
        {
          ref: {
            kind: 'rich-block',
            namespace: 'praxis.operations',
            presetId: 'distress-signal-briefing',
            version: '1.0.0',
          },
          label: 'Dossiê Tático de Sinal de Socorro',
          description: 'Resumo executivo somente-leitura para triagem rápida de sinais de socorro.',
          document: {
            kind: 'praxis.rich-content',
            version: '1.0.0',
            nodes: [
              {
                type: 'callout',
                tone: 'warning',
                icon: 'crisis_alert',
                titleExpr: 'Protocolo #${row.id} · Nível de Ameaça ${row.nivelAmeaca}',
                messageExpr:
                  'Sinal emitido por ${row.origem} no teatro operacional ${row.local}. Status atual: ${row.status}.',
              },
              {
                type: 'keyValueList',
                layout: 'stacked',
                items: [
                  { label: 'Origem do Sinal', valueExpr: '${row.origem}', icon: 'podcasts' },
                  { label: 'Setor / Localização', valueExpr: '${row.local}', icon: 'location_on' },
                  {
                    label: 'Status Operacional',
                    valueExpr: '${row.status}',
                    badgeExpr: 'Nível ${row.nivelAmeaca}',
                    icon: 'shield',
                  },
                ],
              },
            ],
          },
        } satisfies RichBlockPresetDefinition,
      ],
    },
    providePraxisTabsMetadata(),
    providePraxisExpansionMetadata(),
    providePraxisStepperMetadata(),
    providePraxisHeroBannerMetadata(),
    providePraxisUserContextSummaryMetadata(),
    providePraxisRelatedResourceOutletMetadata(),
    providePraxisRichTextBlockMetadata(),
    providePraxisFooterLinksMetadata(),
    providePraxisLegalNoticeMetadata(),
    providePraxisDynamicPageMetadata(),
    providePraxisFilesUploadMetadata(),
    providePraxisMetadataEditorMetadata(),
    providePraxisDialogMetadata(),
    providePraxisDialogGlobalActions(),
    providePraxisQuickViewDialogPresenter(),
    providePraxisSurfaceGlobalActions(),
    providePraxisPageBuilderMetadata(),
    ...providePraxisCharts(),
    ...providePraxisChartsI18n({ locale: 'pt-BR', fallbackLocale: 'pt-BR' }),
    ...providePraxisSettingsPanelBridge(),
    {
      provide: GLOBAL_CONFIG_DYNAMIC_FORM_COMPONENT,
      useValue: PraxisDynamicForm,
    },
    ...providePraxisSurfaceDrawerBridge(),
    ...providePraxisLoadingDefaults(),
    importProvidersFrom(MatDialogModule),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
    { provide: API_URL, useValue: API_URL_VALUE },
    GenericCrudService,
    GlobalActionService,
    provideGlobalConfig(GLOBAL_CONFIG_SEED),
    provideGlobalConfigReady(),
    {
      provide: ASYNC_CONFIG_STORAGE,
      useExisting: ApiConfigStorage,
    },
    {
      provide: API_CONFIG_STORAGE_OPTIONS,
      useValue: {
        baseUrl: `${PRAXIS_API_BASE_URL}/praxis/config/ui`,
        errorPolicy: 'fail',
      headersFactory: () => {
          if (typeof localStorage === 'undefined') {
            return {
              'X-User-ID': 'nick.fury',
              'X-Tenant-ID': 'shield-hq',
              'X-Tenant': 'shield-hq',
              'X-Env': 'local',
            };
          }
          const user =
            localStorage.getItem('praxis.demoUserId') ||
            localStorage.getItem('pax.api.user') ||
            'nick.fury';
          const tenant =
            localStorage.getItem('pax.api.tenant') ||
            'shield-hq';
          return {
            'X-User-ID': user,
            'X-Tenant-ID': tenant,
            'X-Tenant': tenant,
            'X-Env': 'local',
          };
        },
      } as ApiConfigStorageOptions,
    },
    {
      provide: AI_BACKEND_STORAGE_OPTIONS,
      useValue: {
        headersFactory: () => {
          if (typeof localStorage === 'undefined') {
            return {
              'X-User-ID': 'nick.fury',
              'X-Tenant-ID': 'shield-hq',
              'X-Tenant': 'shield-hq',
              'X-Env': 'local',
            };
          }
          const user =
            localStorage.getItem('praxis.demoUserId') ||
            localStorage.getItem('pax.api.user') ||
            'nick.fury';
          const tenant =
            localStorage.getItem('pax.api.tenant') ||
            'shield-hq';
          return {
            'X-User-ID': user,
            'X-Tenant-ID': tenant,
            'X-Tenant': tenant,
            'X-Env': 'local',
          };
        },
      },
    },
    {
      provide: PAGE_BUILDER_AGENTIC_AUTHORING_OPTIONS,
      useValue: {
        baseUrl: `${PRAXIS_API_BASE_URL}/praxis/config/ai/authoring`,
        headersFactory: () => {
          if (typeof localStorage === 'undefined') {
            return {
              'X-User-ID': 'nick.fury',
              'X-Tenant-ID': 'shield-hq',
              'X-Tenant': 'shield-hq',
              'X-Env': 'local',
            };
          }
          const user =
            localStorage.getItem('praxis.demoUserId') ||
            localStorage.getItem('pax.api.user') ||
            'nick.fury';
          const tenant =
            localStorage.getItem('pax.api.tenant') ||
            'shield-hq';
          return {
            'X-User-ID': user,
            'X-Tenant-ID': tenant,
            'X-Tenant': tenant,
            'X-Env': 'local',
          };
        },
      },
    },
    DatePipe,
    DecimalPipe,
    CurrencyPipe,
    PercentPipe,
    UpperCasePipe,
    LowerCasePipe,
    TitleCasePipe,
    provideEnvironmentInitializer(() => {
      inject(ComponentMetadataRegistry).register(HERO_TACTICAL_RADAR_METADATA);

      (globalThis as any).PAX_FETCH_HEADERS = () => {
        if (typeof window === 'undefined') {
          return {};
        }

        const tenant = localStorage.getItem('pax.api.tenant') || 'shield-hq';
        const user =
          localStorage.getItem('praxis.demoUserId') ||
          localStorage.getItem('pax.api.user') ||
          'nick.fury';
        const token = localStorage.getItem('pax.api.token') || '';
        const headers: Record<string, string> = {
          'X-Tenant-ID': tenant,
          'X-Tenant': tenant,
          'X-User-ID': user,
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
      };
    }),
  ],
};

