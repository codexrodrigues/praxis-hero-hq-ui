import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';

export const CONTRATOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'supply-chain/contratos',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'numeroContrato',
        header: 'Nº do Contrato',
        width: '180px',
        sortable: true,
      },
      {
        field: 'fornecedorNome',
        header: 'Fornecedor / Fabricante',
        width: '260px',
        sortable: true,
      },
      {
        field: 'objeto',
        header: 'Objeto / Escopo de Fornecimento',
        width: '320px',
        sortable: true,
      },
      {
        field: 'valorTotal',
        header: 'Valor Global (R$)',
        type: 'currency',
        format: 'BRL',
        width: '180px',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status Contratual',
        width: '160px',
        sortable: true,
      },
      {
        field: 'dataFim',
        header: 'Vigência Até',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '160px',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Auditar Acordo',
      action: 'edit',
      openMode: 'modal',
      formId: 'contratos-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Novo Contrato',
      action: 'create',
      openMode: 'modal',
      formId: 'contratos-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '920px', maxWidth: '95vw' },
  },
};

export const CONTRATOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      className: 'contratos-kpi-grid',
      items: [
        {
          id: 'vigentes',
          label: 'Contratos Vigentes',
          value: '12 Ativos',
          caption: 'Indústrias Stark, Pym Tech e Oscorp',
          icon: 'description',
          tone: 'info',
        },
        {
          id: 'compliance',
          label: 'Compliance & SLAs',
          value: '99,1%',
          caption: 'Entregas dentro do prazo tático',
          icon: 'verified',
          tone: 'success',
        },
        {
          id: 'renovacao',
          label: 'Em Renovação Trimestral',
          value: '03 Contratos',
          caption: 'Aditivos de fornecimento de vibranium',
          icon: 'event_repeat',
          tone: 'warning',
        },
        {
          id: 'volume',
          label: 'Volume Anual Contratado',
          value: 'R$ 42,0 M',
          caption: 'Orçamento aprovado para 2026',
          icon: 'attach_money',
          tone: 'neutral',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-contratos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-supplies">
            <span class="material-symbols-outlined">contract</span>
            Suprimentos & Aquisições Estratégicas
          </div>
          <h1 class="title-gradient page-title">Fornecedores & Contratos</h1>
          <p class="page-subtitle">
            Gestão de parceiros industriais, acordos de nível de serviço, peças de reposição e contratos corporativos.
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
          crudId="heroes-hq-contratos-crud"
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
      background: color-mix(in oklab, var(--supplies) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--supplies) 30%, transparent);
      color: var(--supplies);
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

    .tone-supplies { color: var(--supplies); background: color-mix(in oklab, var(--supplies) 14%, transparent); }
    .tone-ready { color: var(--ready); background: color-mix(in oklab, var(--ready) 14%, transparent); }
    .tone-warning { color: var(--warning); background: color-mix(in oklab, var(--warning) 14%, transparent); }
    .tone-operations { color: var(--operations); background: color-mix(in oklab, var(--operations) 14%, transparent); }

    /* KPI Bento Grid Styling */
    ::ng-deep {
      .contratos-kpi-grid .prx-rich-stat-group__items,
      .contratos-kpi-grid .pdx-rich-stat-group__items {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        width: 100%;
      }

      .contratos-kpi-grid .prx-rich-stat-group__item,
      .contratos-kpi-grid .pdx-rich-stat-group__item {
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

      .contratos-kpi-grid .prx-rich-stat-group__value,
      .contratos-kpi-grid .pdx-rich-stat-group__value {
        font-family: var(--font-display) !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        color: var(--foreground) !important;
        margin: 4px 0 0 !important;
      }

      .contratos-kpi-grid .prx-rich-stat-group__label,
      .contratos-kpi-grid .pdx-rich-stat-group__label {
        font-size: 0.68rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        color: var(--muted-foreground) !important;
      }

      .contratos-kpi-grid .prx-rich-stat-group__caption,
      .contratos-kpi-grid .pdx-rich-stat-group__caption {
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
export class ContratosPageComponent {
  protected readonly crudMetadata = CONTRATOS_CRUD_METADATA;
  protected readonly kpiDocument = CONTRATOS_KPI_DOCUMENT;
}
