import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';

export const AMEACAS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'risk-management/ameacas',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'nome',
        header: 'Designação do Alvo',
        width: '240px',
        sortable: true,
      },
      {
        field: 'nivelAmeaca',
        header: 'Classificação de Risco',
        width: '180px',
        sortable: true,
      },
      {
        field: 'localizacao',
        header: 'Último Vetor Detectado',
        width: '220px',
        sortable: true,
      },
      {
        field: 'recompensa',
        header: 'Recompensa Ativa (R$)',
        type: 'currency',
        format: 'BRL',
        width: '180px',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status de Contenção',
        width: '160px',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Atualizar Inteligência',
      action: 'edit',
      openMode: 'modal',
      formId: 'ameacas-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Catalogar Nova Ameaça',
      action: 'create',
      openMode: 'modal',
      formId: 'ameacas-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '880px', maxWidth: '95vw' },
  },
};

export const AMEACAS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      className: 'ameacas-kpi-grid',
      items: [
        {
          id: 'ameacas',
          label: 'Ameaças Monitoradas',
          value: '16 Alvos',
          caption: 'Radar contínuo em frequência quântica',
          icon: 'warning',
          tone: 'danger',
        },
        {
          id: 'omega',
          label: 'Prioridade Ômega Ativa',
          value: '02 Críticas',
          caption: 'Thanos · Doutor Destino',
          icon: 'crisis_alert',
          tone: 'warning',
        },
        {
          id: 'contidos',
          label: 'Contidos / Quarentena',
          value: '09 Neutralizados',
          caption: 'Custodiados na Prisão Raft',
          icon: 'lock',
          tone: 'success',
        },
        {
          id: 'recompensas',
          label: 'Fundo Total de Recompensas',
          value: 'R$ 18,5 M',
          caption: 'Garantido pelo Acordo de Sokovia',
          icon: 'payments',
          tone: 'info',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-ameacas-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-risk">
            <span class="material-symbols-outlined">radar</span>
            Inteligência de Risco & Segurança Global
          </div>
          <h1 class="title-gradient page-title">Radar de Ameaças Globais</h1>
          <p class="page-subtitle">
            Catalogação de supervilões, anomalias dimensionais, tracking geoespacial e recompensas ativas.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface">
        <praxis-rich-content [document]="kpiDocument" />
      </section>

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-ameacas-crud"
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
    }

    .domain-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: color-mix(in oklab, var(--risk) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--risk) 30%, transparent);
      color: var(--risk);
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      span { font-size: 14px; }
    }

    .page-title {
      margin: 10px 0 0;
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-weight: 700;
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
      .ameacas-kpi-grid .prx-rich-stat-group__items,
      .ameacas-kpi-grid .pdx-rich-stat-group__items {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        width: 100%;
      }

      .ameacas-kpi-grid .prx-rich-stat-group__item,
      .ameacas-kpi-grid .pdx-rich-stat-group__item {
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

      .ameacas-kpi-grid .prx-rich-stat-group__value,
      .ameacas-kpi-grid .pdx-rich-stat-group__value {
        font-family: var(--font-display) !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        color: var(--foreground) !important;
        margin: 4px 0 0 !important;
      }

      .ameacas-kpi-grid .prx-rich-stat-group__label,
      .ameacas-kpi-grid .pdx-rich-stat-group__label {
        font-size: 0.68rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        color: var(--muted-foreground) !important;
      }

      .ameacas-kpi-grid .prx-rich-stat-group__caption,
      .ameacas-kpi-grid .pdx-rich-stat-group__caption {
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
export class AmeacasPageComponent {
  protected readonly crudMetadata = AMEACAS_CRUD_METADATA;
  protected readonly kpiDocument = AMEACAS_KPI_DOCUMENT;
}
