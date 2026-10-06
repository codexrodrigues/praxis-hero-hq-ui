import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PraxisChartComponent, type PraxisChartConfig } from '@praxisui/charts';
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';

export const REPUTACAO_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/reputacao',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'Ranking',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'heroiNome',
        header: 'Identidade Operacional',
        width: '260px',
        sortable: true,
      },
      {
        field: 'scorePublico',
        header: 'Aprovação Pública (%)',
        type: 'number',
        width: '180px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'scoreGovernamental',
        header: 'Confiança Governamental (%)',
        type: 'number',
        width: '220px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'scoreGeral',
        header: 'Score Consolidado (%)',
        type: 'number',
        width: '180px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'dataAuditoria',
        header: 'Última Amostragem',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '160px',
        align: 'center',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [],
};

export const REPUTACAO_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      className: 'reputacao-kpi-grid',
      items: [
        {
          id: 'topHero',
          label: 'Herói #1 no Ranking',
          value: 'Carol Danvers',
          caption: '91,5% de média global consolidada',
          icon: 'trophy',
          tone: 'success',
        },
        {
          id: 'aprovacao',
          label: 'Aprovação Civil Média',
          value: '86,8%',
          caption: '+4,2% no último trimestre',
          icon: 'trending_up',
          tone: 'info',
        },
        {
          id: 'confianca',
          label: 'Confiança Institucional',
          value: '91,2%',
          caption: 'Chancela de reguladores civis',
          icon: 'verified',
          tone: 'neutral',
        },
        {
          id: 'monitorados',
          label: 'Quadro Monitorado',
          value: '101 Heróis',
          caption: 'Cobertura integral de todas as equipes',
          icon: 'groups',
          tone: 'warning',
        },
      ],
    },
  ],
};

export const REPUTACAO_CHART_CONFIG: PraxisChartConfig = {
  id: 'reputacao-top7-chart',
  type: 'bar',
  title: 'Top 7 Heróis - Avaliação Reputacional Comparativa',
  subtitle: 'Aprovação civil e confiança institucional consolidadas',
  sizing: { mode: 'fixed', height: 320 },
  dataSource: {
    kind: 'local',
    items: [
      { heroi: 'Carol Danvers', civil: 88, governo: 95 },
      { heroi: 'Caio Vargas', civil: 83, governo: 99 },
      { heroi: 'Diana Cross', civil: 94, governo: 86 },
      { heroi: 'Sena Korr', civil: 84, governo: 96 },
      { heroi: 'Tony Stark', civil: 86, governo: 92 },
      { heroi: 'Enzo Santos', civil: 95, governo: 83 },
      { heroi: 'Yuri Quinn', civil: 85, governo: 93 },
    ],
  },
  axes: {
    x: { field: 'heroi', type: 'category', label: 'Herói' },
    y: {
      type: 'value',
      label: 'Score (%)',
      min: 70,
      max: 100,
    },
  },
  series: [
    {
      id: 'civil',
      name: 'Aprovação Civil',
      type: 'bar',
      metric: { field: 'civil', aggregation: 'sum' },
      color: '#06b6d4',
    },
    {
      id: 'governo',
      name: 'Confiança Governo',
      type: 'bar',
      metric: { field: 'governo', aggregation: 'sum' },
      color: '#10b981',
    },
  ],
};

@Component({
  selector: 'app-reputacao-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisChartComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh-bg">
            <span class="material-symbols-outlined">military_tech</span>
            Governança & Relações Públicas
          </div>
          <h1 class="title-gradient page-title">Ranking de Reputação & Confiança</h1>
          <p class="page-subtitle">
            Monitoramento de índices de aceitação pública e chancela governamental consolidados via view analítica canônica da Praxis.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface">
        <praxis-rich-content [document]="kpiDocument" />
      </section>

      <!-- Visual Chart Surface -->
      <section class="glass-panel chart-surface">
        <praxis-chart [config]="chartConfig" height="340px" />
      </section>

      <!-- Canonical Metadata-Driven CRUD Runtime (Inspect-Only View) -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-reputacao-crud"
          [metadata]="crudMetadata"
        />
      </section>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1540px;
      margin: 0 auto;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      flex-wrap: wrap;
    }

    .domain-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;

      span { font-size: 14px; }
    }

    .tone-rh-bg {
      background: color-mix(in oklab, var(--rh) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--rh) 30%, transparent);
      color: var(--rh);
    }

    .page-title {
      margin: 10px 0 0;
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-weight: 700;
      line-height: 1.15;
    }

    .page-subtitle {
      margin: 8px 0 0;
      font-size: 0.88rem;
      color: var(--muted-foreground);
      max-width: 720px;
    }

    .tone-rh { color: var(--rh); background: color-mix(in oklab, var(--rh) 12%, transparent); }
    .tone-ready { color: var(--ready); background: color-mix(in oklab, var(--ready) 14%, transparent); }
    .tone-warning { color: var(--warning); background: color-mix(in oklab, var(--warning) 14%, transparent); }
    .tone-operations { color: var(--operations); background: color-mix(in oklab, var(--operations) 14%, transparent); }

    /* KPI Bento Grid Styling */
    ::ng-deep {
      .reputacao-kpi-grid .prx-rich-stat-group__items,
      .reputacao-kpi-grid .pdx-rich-stat-group__items {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        width: 100%;
      }

      .reputacao-kpi-grid .prx-rich-stat-group__item,
      .reputacao-kpi-grid .pdx-rich-stat-group__item {
        border-radius: 16px !important;
        padding: 18px !important;
        border: 1px solid var(--border) !important;
        background: color-mix(in oklab, var(--card) 60%, transparent) !important;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        flex-direction: column;
        transition: transform 0.2s ease, border-color 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          border-color: color-mix(in oklab, var(--primary) 40%, var(--border));
        }
      }

      .reputacao-kpi-grid .prx-rich-stat-group__value,
      .reputacao-kpi-grid .pdx-rich-stat-group__value {
        font-family: var(--font-display) !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        color: var(--foreground) !important;
        margin: 4px 0 0 !important;
      }

      .reputacao-kpi-grid .prx-rich-stat-group__label,
      .reputacao-kpi-grid .pdx-rich-stat-group__label {
        font-size: 0.68rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        color: var(--muted-foreground) !important;
      }

      .reputacao-kpi-grid .prx-rich-stat-group__caption,
      .reputacao-kpi-grid .pdx-rich-stat-group__caption {
        font-size: 0.72rem !important;
        color: var(--muted-foreground) !important;
        margin-top: 4px !important;
      }
    }

    .chart-surface {
      border-radius: 18px;
      padding: 24px;
      overflow: hidden;
    }

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class ReputacaoPageComponent {
  protected readonly crudMetadata = REPUTACAO_CRUD_METADATA;
  protected readonly chartConfig = REPUTACAO_CHART_CONFIG;
  protected readonly kpiDocument = REPUTACAO_KPI_DOCUMENT;
}
