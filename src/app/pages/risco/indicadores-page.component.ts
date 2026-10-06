import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';

export const INDICADORES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'risk-management/sinistros',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'Registro',
        width: '100px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'missaoTitulo',
        header: 'Missão de Origem',
        width: '240px',
        sortable: true,
      },
      {
        field: 'descricao',
        header: 'Incidente / Dano Patrimonial',
        width: '320px',
        sortable: true,
      },
      {
        field: 'local',
        header: 'Local do Dano',
        width: '180px',
        sortable: true,
      },
      {
        field: 'severidade',
        header: 'Severidade',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'danosCivis',
        header: 'Prejuízo Civil Estimado',
        type: 'currency',
        format: 'BRL',
        width: '180px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'valorAcordo',
        header: 'Compensação Aprovada',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [],
};

export const INDICADORES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      className: 'indicadores-kpi-grid',
      items: [
        {
          id: 'passivo',
          label: 'Sinistros com Passivo',
          value: '74 Casos',
          caption: 'Histórico de acordos regulados',
          icon: 'gavel',
          tone: 'danger',
        },
        {
          id: 'total',
          label: 'Volume Total de Indenizações',
          value: 'R$ 82,4M',
          caption: 'Compensações acordadas com o judiciário',
          icon: 'payments',
          tone: 'warning',
        },
        {
          id: 'liquidadas',
          label: 'Compensações Liquidadas',
          value: 'R$ 44,1M',
          caption: '53,5% dos valores já quitados',
          icon: 'price_check',
          tone: 'success',
        },
        {
          id: 'saldo',
          label: 'Saldo em Conciliação',
          value: 'R$ 38,3M',
          caption: 'Em análise de perícia e seguros',
          icon: 'hourglass_top',
          tone: 'neutral',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-indicadores-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-risk-bg">
            <span class="material-symbols-outlined">balance</span>
            Risco & Compensações Civis
          </div>
          <h1 class="title-gradient page-title">Indicadores de Risco & Indenizações</h1>
          <p class="page-subtitle">
            Auditoria financeira de acordos regulatórios, compensação patrimonial civil e passivo securitário de missões.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface">
        <praxis-rich-content [document]="kpiDocument" />
      </section>

      <!-- Tabela CRUD Governança Canônica -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-indicadores-crud"
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

    .tone-risk-bg {
      background: color-mix(in oklab, var(--risk) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--risk) 30%, transparent);
      color: var(--risk);
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

    .tone-risk { color: var(--risk); background: color-mix(in oklab, var(--risk) 14%, transparent); }
    .tone-ready { color: var(--ready); background: color-mix(in oklab, var(--ready) 14%, transparent); }
    .tone-warning { color: var(--warning); background: color-mix(in oklab, var(--warning) 14%, transparent); }
    .tone-operations { color: var(--operations); background: color-mix(in oklab, var(--operations) 14%, transparent); }

    /* KPI Bento Grid Styling */
    ::ng-deep {
      .indicadores-kpi-grid .prx-rich-stat-group__items,
      .indicadores-kpi-grid .pdx-rich-stat-group__items {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        width: 100%;
      }

      .indicadores-kpi-grid .prx-rich-stat-group__item,
      .indicadores-kpi-grid .pdx-rich-stat-group__item {
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

      .indicadores-kpi-grid .prx-rich-stat-group__value,
      .indicadores-kpi-grid .pdx-rich-stat-group__value {
        font-family: var(--font-display) !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        color: var(--foreground) !important;
        margin: 4px 0 0 !important;
      }

      .indicadores-kpi-grid .prx-rich-stat-group__label,
      .indicadores-kpi-grid .pdx-rich-stat-group__label {
        font-size: 0.68rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        color: var(--muted-foreground) !important;
      }

      .indicadores-kpi-grid .prx-rich-stat-group__caption,
      .indicadores-kpi-grid .pdx-rich-stat-group__caption {
        font-size: 0.72rem !important;
        color: var(--muted-foreground) !important;
        margin-top: 4px !important;
      }
    }

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class IndicadoresPageComponent {
  protected readonly crudMetadata = INDICADORES_CRUD_METADATA;
  protected readonly kpiDocument = INDICADORES_KPI_DOCUMENT;
}
