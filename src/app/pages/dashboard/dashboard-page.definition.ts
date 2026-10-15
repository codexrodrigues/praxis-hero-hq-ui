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

  const canonicalHeroBanner = DASHBOARD_PAGE_DEFINITION.widgets?.find(
    (w) => w.key === 'heroBanner',
  );
  if (!canonicalHeroBanner) {
    return persisted;
  }

  let upgraded = false;
  const nextWidgets = persisted['widgets'].map((widget: any) => {
    if (!widget || widget.key !== 'heroBanner') {
      return widget;
    }
    const nodes = widget.definition?.inputs?.document?.nodes;
    const firstNode = Array.isArray(nodes) ? nodes[0] : null;
    const media = firstNode?.media;
    if (media?.kind === 'component' && media?.componentId === 'hero-hq-tactical-radar') {
      return widget;
    }
    upgraded = true;
    return {
      ...widget,
      definition: structuredClone(canonicalHeroBanner.definition),
    };
  });

  if (!upgraded) {
    return persisted;
  }

  return {
    ...persisted,
    widgets: nextWidgets,
  };
}

