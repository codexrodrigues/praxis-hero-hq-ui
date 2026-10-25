import { EnterpriseRuntimeContextService, PRAXIS_ENTERPRISE_RUNTIME_CONTEXT_OPTIONS, UiLayoutLifecycleService } from '@praxisui/core';
import { CorporateNavigationService } from './corporate-navigation.service';
import { CorporatePagePilotService } from './corporate-page-pilot.service';

/** One context instance for SESSION entry, editorial lifecycle and published URL reads. */
export const CORPORATE_RUNTIME_PROVIDERS = [
  EnterpriseRuntimeContextService,
  { provide: PRAXIS_ENTERPRISE_RUNTIME_CONTEXT_OPTIONS, useValue: { includeGlobalFetchHeaders: false, errorPolicy: 'fail' } },
  UiLayoutLifecycleService,
  CorporatePagePilotService,
  CorporateNavigationService,
];
