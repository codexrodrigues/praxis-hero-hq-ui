import type { WidgetPageDefinition } from '@praxisui/core';
import dashboardBundle from './dashboard-page.definition.json';

export const DASHBOARD_PAGE_DEFINITION: WidgetPageDefinition =
  dashboardBundle.dashboardPageDefinition as WidgetPageDefinition;

/**
 * Reconciles a persisted dashboard snapshot in-memory so legacy pre-radar
 * `heroBanner` widgets (e.g., `media.kind === 'icon'`) automatically upgrade
 * to the canonical `hero-hq-tactical-radar` component while preserving any
 * user-customized widgets and canvas layout positions.
 */
export function reconcilePersistedDashboardPage<T extends Record<string, any> | null | undefined>(
  persisted: T,
): T {
  if (!persisted || typeof persisted !== 'object' || !Array.isArray(persisted['widgets'])) {
    return persisted;
  }

  const canonicalByKey = new Map(
    (DASHBOARD_PAGE_DEFINITION.widgets ?? []).map((w) => [w.key, w]),
  );

  let upgraded = false;
  const nextWidgets = persisted['widgets'].map((widget: any) => {
    if (!widget || typeof widget.key !== 'string') {
      return widget;
    }

    if (widget.key === 'heroBanner') {
      const canonical = canonicalByKey.get('heroBanner');
      const nodes = widget.definition?.inputs?.document?.nodes;
      const firstNode = Array.isArray(nodes) ? nodes[0] : null;
      const media = firstNode?.media;
      const trk05 = Array.isArray(media?.componentInputs?.contacts)
        ? media.componentInputs.contacts.find((c: any) => c?.id === 'TRK-05')
        : null;
      const hasRadarMedia =
        media?.kind === 'component' && media?.componentId === 'hero-hq-tactical-radar';
      const hasLiveTrk05 = !trk05 || String(trk05.label ?? '').includes('${inUseAssets}');
      if (canonical && (!hasRadarMedia || !hasLiveTrk05)) {
        upgraded = true;
        return {
          ...widget,
          definition: structuredClone(canonical.definition),
        };
      }
      return widget;
    }

    if (widget.key === 'missionsTimeline' || widget.key === 'domainHub') {
      const canonical = canonicalByKey.get(widget.key);
      const serialized = JSON.stringify(widget.definition ?? {});
      if (
        canonical &&
        (serialized.includes('Interceptação Orbital Completa') ||
          serialized.includes('Arsenal homologado · Telemetria de campo'))
      ) {
        upgraded = true;
        return {
          ...widget,
          definition: structuredClone(canonical.definition),
        };
      }
    }

    return widget;
  });

  let nextState = persisted['state'];
  if (
    nextState &&
    typeof nextState === 'object' &&
    !nextState.derived?.['kpis.folhaPercent'] &&
    DASHBOARD_PAGE_DEFINITION.state
  ) {
    upgraded = true;
    nextState = structuredClone(DASHBOARD_PAGE_DEFINITION.state);
  }

  let nextDataSources = persisted['dataSources'];
  if (Array.isArray(nextDataSources) && Array.isArray(DASHBOARD_PAGE_DEFINITION.dataSources)) {
    const ids = new Set(nextDataSources.map((ds: any) => ds?.id));
    if (!ids.has('assetsStats') || !ids.has('threatsStats')) {
      upgraded = true;
      nextDataSources = structuredClone(DASHBOARD_PAGE_DEFINITION.dataSources);
    }
  }

  if (!upgraded) {
    return persisted;
  }

  return {
    ...persisted,
    ...(nextState !== undefined ? { state: nextState } : {}),
    ...(nextDataSources !== undefined ? { dataSources: nextDataSources } : {}),
    widgets: nextWidgets,
  };
}


