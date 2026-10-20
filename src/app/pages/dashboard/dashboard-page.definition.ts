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

    if (
      widget.key === 'missionsTimeline' ||
      widget.key === 'domainHub' ||
      widget.key === 'kpiProntidao' ||
      widget.key === 'kpiMissoes' ||
      widget.key === 'kpiFolha' ||
      widget.key === 'kpiRiscos'
    ) {
      const canonical = canonicalByKey.get(widget.key);
      const serialized = JSON.stringify(widget.definition ?? {});
      const isStaleTimeline =
        widget.key === 'missionsTimeline' &&
        (!serialized.includes('activeMissions.0.titulo') ||
          !serialized.includes('"markerVariant":"icon"') ||
          !serialized.includes('rocket_launch') ||
          serialized.includes('"markerColor":"accent"'));
      const isStaleDomainHub =
        widget.key === 'domainHub' && !serialized.includes('tone-cobalt');
      const isStaleKpi =
        (widget.key === 'kpiProntidao' && !serialized.includes('kpi-tone-ready')) ||
        (widget.key === 'kpiMissoes' && !serialized.includes('kpi-tone-operations')) ||
        (widget.key === 'kpiFolha' && !serialized.includes('kpi-tone-rh')) ||
        (widget.key === 'kpiRiscos' && !serialized.includes('kpi-tone-risk'));
      if (
        canonical &&
        (isStaleTimeline ||
          isStaleDomainHub ||
          isStaleKpi ||
          serialized.includes('Interceptação Orbital Completa') ||
          serialized.includes('Arsenal homologado · Telemetria de campo') ||
          serialized.includes('Atividades Recentes de Campo') ||
          serialized.includes('missões catalogadas no radar tático') ||
          serialized.includes('ocorrências de severidade alta em contenção') ||
          serialized.includes('"valueExpr":"progressValue"'))
      ) {
        upgraded = true;
        return {
          ...widget,
          definition: structuredClone(canonical.definition),
        };
      }
    }

    if (
      widget.key === 'incidentsSeverityDonut' ||
      widget.key === 'defconGaugeChart' ||
      widget.key === 'payrollChart' ||
      widget.key === 'reputationChart'
    ) {
      const canonical = canonicalByKey.get(widget.key);
      const inputs = widget.definition?.inputs;
      const cfg = inputs?.config;
      const isStaleRow14ChartHeight =
        (widget.key === 'incidentsSeverityDonut' || widget.key === 'defconGaugeChart') &&
        cfg?.sizing?.height !== 340;
      const hasLegacyLocalChart =
        Array.isArray(inputs?.data) ||
        cfg?.dataSource?.kind === 'local' ||
        inputs?.chartDocument?.source?.kind === 'derived' ||
        (widget.key === 'payrollChart' && cfg?.axes?.x?.type !== 'time') ||
        isStaleRow14ChartHeight;
      if (canonical && hasLegacyLocalChart) {
        upgraded = true;
        return {
          ...widget,
          definition: structuredClone(canonical.definition),
        };
      }
    }

    if (widget.key === 'recentIncidents') {
      const canonical = canonicalByKey.get('recentIncidents');
      const cfg = widget.definition?.inputs?.config;
      const detailItems = cfg?.behavior?.detail?.source?.inlineSchema?.items;
      const firstCardContent = detailItems?.[0]?.cards?.[0]?.content;
      const ocorridoCol = Array.isArray(cfg?.columns)
        ? cfg.columns.find((c: any) => c?.field === 'ocorridoEm')
        : null;
      const severidadeCol = Array.isArray(cfg?.columns)
        ? cfg.columns.find((c: any) => c?.field === 'severidade')
        : null;
      const mortosCol = Array.isArray(cfg?.columns)
        ? cfg.columns.find((c: any) => c?.field === 'mortos')
        : null;
      const hasFlatCardContent =
        Array.isArray(detailItems) &&
        detailItems.some((item: any) => item?.type === 'cardGrid') &&
        Array.isArray(firstCardContent) &&
        firstCardContent[0]?.type === 'metric' &&
        cfg?.localization?.currency?.code === 'BRL' &&
        ocorridoCol?.format === 'dd/MM/yyyy HH:mm' &&
        cfg?.toolbar?.appearance?.variant === 'integrated' &&
        Array.isArray(cfg?.toolbar?.filters?.quickFilters) &&
        Array.isArray(severidadeCol?.conditionalRenderers) &&
        typeof severidadeCol.conditionalRenderers[0]?.condition === 'object' &&
        Array.isArray(mortosCol?.conditionalRenderers) &&
        typeof mortosCol.conditionalRenderers[0]?.condition === 'object';
      if (canonical && !hasFlatCardContent) {
        upgraded = true;
        return {
          ...widget,
          definition: structuredClone(canonical.definition),
        };
      }
    }

    if (widget.key === 'distressSignalsList') {
      const canonical = canonicalByKey.get('distressSignalsList');
      const cfg = widget.definition?.inputs?.config;
      const firstSectionItemsExpr = String(cfg?.expansion?.sections?.[0]?.itemsExpr ?? '');
      const hasUpgradedFeed =
        cfg?.selection?.showControl === false &&
        cfg?.templating?.leading?.expr === 'crisis_alert' &&
        cfg?.templating?.iconColorMap?.['ABERTO'] === 'warn' &&
        Array.isArray(cfg?.layout?.rowLayout?.columns) &&
        cfg?.layout?.virtualScroll?.viewportHeight === '340px' &&
        cfg?.templating?.identity?.type === 'compose' &&
        cfg?.templating?.risk?.type === 'metric' &&
        Array.isArray(cfg?.rules?.itemStyles) &&
        cfg?.interaction?.expandable === true &&
        Array.isArray(cfg?.expansion?.sections) &&
        cfg.expansion.sections.length > 0 &&
        firstSectionItemsExpr.includes('${item.id}') &&
        Array.isArray(cfg?.itemActions) &&
        cfg.itemActions.some((a: any) => a?.id === 'despachar-equipe');
      if (canonical && !hasUpgradedFeed) {
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
    DASHBOARD_PAGE_DEFINITION.state &&
    (!nextState ||
      typeof nextState !== 'object' ||
      !nextState.derived?.['kpis.folhaPercent'] ||
      !Array.isArray(nextState.values?.['activeMissions']))
  ) {
    upgraded = true;
    const canonicalState = structuredClone(DASHBOARD_PAGE_DEFINITION.state);
    const existingValues =
      nextState && typeof nextState.values === 'object' && nextState.values !== null
        ? nextState.values
        : {};
    const existingDerived =
      nextState && typeof nextState.derived === 'object' && nextState.derived !== null
        ? nextState.derived
        : {};
    nextState = {
      ...canonicalState,
      ...(nextState && typeof nextState === 'object' ? nextState : {}),
      values: {
        ...canonicalState.values,
        ...existingValues,
        kpis: {
          ...(canonicalState.values?.['kpis'] ?? {}),
          ...(existingValues['kpis'] && typeof existingValues['kpis'] === 'object'
            ? existingValues['kpis']
            : {}),
        },
        activeMissions: Array.isArray(existingValues['activeMissions'])
          ? existingValues['activeMissions']
          : canonicalState.values?.['activeMissions'],
      },
      derived: {
        ...canonicalState.derived,
        ...existingDerived,
      },
    };
  }

  let nextDataSources = persisted['dataSources'];
  if (Array.isArray(DASHBOARD_PAGE_DEFINITION.dataSources)) {
    const existingList = Array.isArray(nextDataSources) ? nextDataSources : [];
    const ids = new Set(existingList.map((ds: any) => ds?.id));
    if (!ids.has('assetsStats') || !ids.has('threatsStats') || !ids.has('recentMissionsFeed')) {
      upgraded = true;
      const canonicalDs = structuredClone(DASHBOARD_PAGE_DEFINITION.dataSources);
      const canonicalIds = new Set(canonicalDs.map((ds: any) => ds?.id));
      const customDs = existingList.filter((ds: any) => ds?.id && !canonicalIds.has(ds.id));
      nextDataSources = [...canonicalDs, ...customDs];
    }
  }

  let nextDeviceLayouts = persisted['deviceLayouts'];
  if (DASHBOARD_PAGE_DEFINITION.deviceLayouts) {
    const hasTabletCanvas = Boolean(nextDeviceLayouts?.tablet?.canvas?.columns);
    const hasMobileCanvas = Boolean(nextDeviceLayouts?.mobile?.canvas?.columns);
    if (!hasTabletCanvas || !hasMobileCanvas) {
      upgraded = true;
      const canonicalDeviceLayouts = structuredClone(DASHBOARD_PAGE_DEFINITION.deviceLayouts);
      nextDeviceLayouts = {
        ...canonicalDeviceLayouts,
        ...(nextDeviceLayouts && typeof nextDeviceLayouts === 'object' ? nextDeviceLayouts : {}),
        tablet: hasTabletCanvas
          ? nextDeviceLayouts.tablet
          : canonicalDeviceLayouts.tablet,
        mobile: hasMobileCanvas
          ? nextDeviceLayouts.mobile
          : canonicalDeviceLayouts.mobile,
      };
    }
  }

  if (!upgraded) {
    return persisted;
  }

  return {
    ...persisted,
    ...(nextState !== undefined ? { state: nextState } : {}),
    ...(nextDataSources !== undefined ? { dataSources: nextDataSources } : {}),
    ...(nextDeviceLayouts !== undefined ? { deviceLayouts: nextDeviceLayouts } : {}),
    widgets: nextWidgets,
  };
}



