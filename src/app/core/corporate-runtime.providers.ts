import { EnterpriseRuntimeContextService, PRAXIS_ENTERPRISE_RUNTIME_CONTEXT_OPTIONS, UiLayoutLifecycleService } from '@praxisui/core';
import { CorporateNavigationService } from './corporate-navigation.service';
import { CorporatePagePilotService } from './corporate-page-pilot.service';

/** Root authority shared by session transport, voice and corporate route consumers. */
export const CORPORATE_RUNTIME_AUTHORITY_PROVIDERS = [
  EnterpriseRuntimeContextService,
  { provide: PRAXIS_ENTERPRISE_RUNTIME_CONTEXT_OPTIONS, useValue: { includeGlobalFetchHeaders: false, errorPolicy: 'fail' } },
];

/** Editorial/navigation services keep their route lifecycle, using the root authority. */
export const CORPORATE_RUNTIME_PROVIDERS = [
  UiLayoutLifecycleService,
  CorporatePagePilotService,
  CorporateNavigationService,
];
