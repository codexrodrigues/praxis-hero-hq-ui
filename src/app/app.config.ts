import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import {
  HttpEvent,
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
import { Observable, finalize, map, shareReplay, tap } from 'rxjs';

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
  provideGlobalConfigSeed,
  providePraxisLoadingDefaults,
  providePraxisRelatedResourceOutletMetadata,
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
  providePraxisSurfaceGlobalActions,
} from '@praxisui/dialog';
import { providePraxisDynamicFormMetadata } from '@praxisui/dynamic-form';
import { providePraxisPageBuilderMetadata } from '@praxisui/page-builder';
import { providePraxisRichContentMetadata } from '@praxisui/rich-content';
import {
  providePraxisSettingsPanelBridge,
  providePraxisSurfaceDrawerBridge,
} from '@praxisui/settings-panel';
import { providePraxisTableMetadata, providePraxisAnalyticalDrawerSchemas } from '@praxisui/table';
import { providePraxisTabsMetadata } from '@praxisui/tabs';
import { providePraxisListMetadata } from '@praxisui/list';
import { HERO_HQ_ANALYTICAL_DRAWER_SCHEMAS } from './core/analytical-drawer-schemas.catalog';
import { HERO_TACTICAL_RADAR_METADATA } from './pages/dashboard/hero-tactical-radar.component';
import { reconcilePersistedDashboardPage } from './pages/dashboard/dashboard-page.definition';
import { routes } from './app.routes';
import { GLOBAL_CONFIG_SEED, PRAXIS_API_BASE_URL } from './core/platform.config';

const API_URL_VALUE: ApiUrlConfig = {
  default: { baseUrl: PRAXIS_API_BASE_URL },
};

interface CachedStatsEntry {
  expiresAt: number;
  stream$: Observable<HttpEvent<unknown>>;
}

const statsRequestCache = new Map<string, CachedStatsEntry>();
const STATS_DEDUPE_TTL_MS = 2500;

const praxisStatsDedupeInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'POST' || !req.url.endsWith('/stats/group-by')) {
    return next(req);
  }

  const tenant = req.headers.get('X-Tenant-ID') || 'shield-hq';
  const user = req.headers.get('X-User-ID') || 'nick.fury';
  const bodyKey = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
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

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(
      withPraxisHttpLoading(),
      withInterceptors([
        (req, next) => {
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
        praxisDashboardSnapshotReconcileInterceptor,
        praxisApiLoadingBridgeInterceptor,
      ]),
    ),
    ...providePraxisDynamicFieldsCore(),
    providePraxisDynamicFormMetadata(),
    providePraxisTableMetadata(),
    providePraxisAnalyticalDrawerSchemas(HERO_HQ_ANALYTICAL_DRAWER_SCHEMAS),
    providePraxisListMetadata(),
    providePraxisCrudMetadata(),
    providePraxisRelatedResourceOutletMetadata(),
    providePraxisTabsMetadata(),
    providePraxisDialogMetadata(),
    providePraxisDialogGlobalActions(),
    providePraxisSurfaceGlobalActions(),
    providePraxisRichContentMetadata(),
    providePraxisChartsMetadata(),
    providePraxisPageBuilderMetadata(),
    ...providePraxisCharts(),
    ...providePraxisChartsI18n({ locale: 'pt-BR', fallbackLocale: 'pt-BR' }),
    ...providePraxisSettingsPanelBridge(),
    ...providePraxisSurfaceDrawerBridge(),
    ...providePraxisLoadingDefaults(),
    importProvidersFrom(MatDialogModule),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: API_URL, useValue: API_URL_VALUE },
    GenericCrudService,
    GlobalActionService,
    provideGlobalConfig(GLOBAL_CONFIG_SEED),
    provideGlobalConfigSeed(GLOBAL_CONFIG_SEED),
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
            'X-Env': 'local',
          };
        },
      } as ApiConfigStorageOptions,
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
