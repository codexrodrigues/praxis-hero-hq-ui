import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  CurrencyPipe,
  DatePipe,
  DecimalPipe,
  LowerCasePipe,
  PercentPipe,
  TitleCasePipe,
  UpperCasePipe,
} from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import {
  API_URL,
  type ApiUrlConfig,
  GenericCrudService,
  provideGlobalConfig,
  provideGlobalConfigReady,
  provideGlobalConfigSeed,
  providePraxisLoadingDefaults,
  withPraxisHttpLoading,
} from '@praxisui/core';
import { providePraxisDynamicFieldsCore } from '@praxisui/dynamic-fields';
import { providePraxisCharts, providePraxisChartsI18n } from '@praxisui/charts';
import { providePraxisDynamicFormMetadata } from '@praxisui/dynamic-form';
import { providePraxisTableMetadata } from '@praxisui/table';
import { routes } from './app.routes';
import { GLOBAL_CONFIG_SEED, PRAXIS_API_BASE_URL } from './core/platform.config';

const API_URL_VALUE: ApiUrlConfig = {
  default: { baseUrl: PRAXIS_API_BASE_URL },
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
              ? localStorage.getItem('pax.api.tenant') || 'demo'
              : 'demo';
          const cloned = req.clone({
            setHeaders: {
              'X-Tenant-ID': tenant,
              'X-Tenant': tenant,
            },
          });
          return next(cloned);
        },
      ]),
    ),
    ...providePraxisDynamicFieldsCore(),
    providePraxisDynamicFormMetadata(),
    providePraxisTableMetadata(),
    ...providePraxisCharts(),
    ...providePraxisChartsI18n({ locale: 'pt-BR', fallbackLocale: 'pt-BR' }),
    ...providePraxisLoadingDefaults(),
    { provide: API_URL, useValue: API_URL_VALUE },
    GenericCrudService,
    provideGlobalConfig(GLOBAL_CONFIG_SEED),
    provideGlobalConfigSeed(GLOBAL_CONFIG_SEED),
    provideGlobalConfigReady(),
    DatePipe,
    DecimalPipe,
    CurrencyPipe,
    PercentPipe,
    UpperCasePipe,
    LowerCasePipe,
    TitleCasePipe,
    provideEnvironmentInitializer(() => {
      (globalThis as any).PAX_FETCH_HEADERS = () => {
        if (typeof window === 'undefined') {
          return {};
        }

        const tenant = localStorage.getItem('pax.api.tenant') || 'demo';
        const token = localStorage.getItem('pax.api.token') || '';
        const headers: Record<string, string> = {
          'X-Tenant-ID': tenant,
          'X-Tenant': tenant,
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
