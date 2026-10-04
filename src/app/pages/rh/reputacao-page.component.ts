import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisChartComponent, type PraxisChartConfig } from '@praxisui/charts';

export const REPUTACAO_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/vw-ranking-reputacao',
    idField: 'funcionarioId',
  },
  table: {
    columns: [
      {
        field: 'posicao',
        header: 'Posição',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'nomeCompleto',
        header: 'Herói / Colaborador',
        width: '240px',
        sortable: true,
      },
      {
        field: 'codinome',
        header: 'Codinome Tático',
        width: '180px',
        sortable: true,
      },
      {
        field: 'equipe',
        header: 'Equipe / Squad',
        width: '180px',
        sortable: true,
      },
      {
        field: 'scorePublico',
        header: 'Aprovação Civil (%)',
        type: 'number',
        width: '150px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'scoreGovernamental',
        header: 'Confiança Governo (%)',
        type: 'number',
        width: '150px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'media',
        header: 'Índice Global (%)',
        type: 'number',
        width: '140px',
        align: 'center',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [],
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
  imports: [CommonModule, PraxisCrudComponent, PraxisChartComponent],
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

      <!-- Bento Grid de KPIs -->
      <section class="kpi-grid">
        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-ready">
            <span class="material-symbols-outlined">trophy</span>
          </div>
          <p class="kpi-label">Herói #1 no Ranking</p>
          <p class="kpi-value">Carol Danvers</p>
          <p class="kpi-detail text-ready">91,5% de média global consolidada</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-rh">
            <span class="material-symbols-outlined">trending_up</span>
          </div>
          <p class="kpi-label">Aprovação Civil Média</p>
          <p class="kpi-value">86,8%</p>
          <p class="kpi-detail">+4,2% no último trimestre</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-operations">
            <span class="material-symbols-outlined">verified</span>
          </div>
          <p class="kpi-label">Confiança Institucional</p>
          <p class="kpi-value">91,2%</p>
          <p class="kpi-detail">Chancela de reguladores civis</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-warning">
            <span class="material-symbols-outlined">groups</span>
          </div>
          <p class="kpi-label">Quadro Monitorado</p>
          <p class="kpi-value">101 Heróis</p>
          <p class="kpi-detail">Cobertura integral de todas as equipes</p>
        </div>
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

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      padding: 18px;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
    }

    .kpi-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      span { font-size: 22px; }
    }

    .tone-rh { color: var(--rh); background: color-mix(in oklab, var(--rh) 12%, transparent); }
    .tone-ready { color: var(--ready); background: color-mix(in oklab, var(--ready) 12%, transparent); }
    .tone-warning { color: var(--warning); background: color-mix(in oklab, var(--warning) 12%, transparent); }
    .tone-operations { color: var(--operations); background: color-mix(in oklab, var(--operations) 12%, transparent); }

    .kpi-label {
      margin: 0;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted-foreground);
    }

    .kpi-value {
      margin: 4px 0 0;
      font-family: var(--font-display);
      font-size: 1.6rem;
      font-weight: 700;
    }

    .kpi-detail {
      margin: 4px 0 0;
      font-size: 0.72rem;
      color: var(--muted-foreground);
    }

    .text-ready { color: var(--ready) !important; }

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
}
