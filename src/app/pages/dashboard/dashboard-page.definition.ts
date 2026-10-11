import type { WidgetPageDefinition } from '@praxisui/core';
import type { PraxisChartConfig } from '@praxisui/charts';
import type { PraxisListConfig } from '@praxisui/list';
import dashboardBundle from './dashboard-page.definition.json';

export const DASHBOARD_PAGE_DEFINITION: WidgetPageDefinition =
  dashboardBundle.dashboardPageDefinition as WidgetPageDefinition;

export const INCIDENT_SEVERITY_DONUT_CONFIG: PraxisChartConfig =
  dashboardBundle.incidentSeverityDonutConfig as PraxisChartConfig;

export const DEFCON_GAUGE_CONFIG: PraxisChartConfig =
  dashboardBundle.defconGaugeConfig as PraxisChartConfig;

export const DISTRESS_SIGNALS_LIST_CONFIG: PraxisListConfig =
  dashboardBundle.distressSignalsListConfig as PraxisListConfig;

export const PAYROLL_TREND_CHART_CONFIG: PraxisChartConfig =
  dashboardBundle.payrollTrendChartConfig as PraxisChartConfig;

export const REPUTATION_RANKING_CHART_CONFIG: PraxisChartConfig =
  dashboardBundle.reputationRankingChartConfig as PraxisChartConfig;
