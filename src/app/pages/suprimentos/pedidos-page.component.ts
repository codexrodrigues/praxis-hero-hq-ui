import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';

export const PEDIDOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'supply-chain/pedidos',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'ID',
        width: '80px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'numeroPedido',
        header: 'Ordem de Compra',
        width: '180px',
        sortable: true,
      },
      {
        field: 'fornecedorNome',
        header: 'Fornecedor Parceiro',
        width: '260px',
        sortable: true,
      },
      {
        field: 'insumo',
        header: 'Material / Insumo Tático',
        width: '240px',
        sortable: true,
      },
      {
        field: 'quantidade',
        header: 'Qtd.',
        type: 'number',
        width: '120px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'valorTotal',
        header: 'Montante (R$)',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status de Expedição',
        width: '160px',
        align: 'center',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Revisar Ordem',
      action: 'edit',
      openMode: 'modal',
      formId: 'pedidos-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Novo Pedido de Compra',
      action: 'create',
      openMode: 'modal',
      formId: 'pedidos-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '840px', maxWidth: '95vw' },
  },
};

export const PEDIDOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      className: 'pedidos-kpi-grid',
      items: [
        {
          id: 'ordens',
          label: 'Ordens de Compra',
          value: '10 Pedidos',
          caption: 'Ciclo de suprimento em andamento',
          icon: 'local_shipping',
          tone: 'info',
        },
        {
          id: 'aprovacao',
          label: 'Aguardando Aprovação',
          value: '4 Ordens Draft',
          caption: 'Compliance de compras e finanças',
          icon: 'pending_actions',
          tone: 'warning',
        },
        {
          id: 'insumos',
          label: 'Insumos Críticos',
          value: 'Vibranium & Grafeno',
          caption: 'Fornecedores certificados pelo HQ',
          icon: 'inventory',
          tone: 'success',
        },
        {
          id: 'leadTime',
          label: 'Lead Time de Entrega',
          value: '< 48 Horas',
          caption: 'Prioridade tática em campo',
          icon: 'schedule',
          tone: 'neutral',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-pedidos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-supplies-bg">
            <span class="material-symbols-outlined">shopping_cart</span>
            Suprimentos & Aquisições Táticas
          </div>
          <h1 class="title-gradient page-title">Pedidos de Compra & Insumos</h1>
          <p class="page-subtitle">
            Gestão de ordens de suprimentos estratégicos, peças de reposição de armaduras e matéria-prima para protótipos de alta energia.
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
          crudId="heroes-hq-pedidos-crud"
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

    .tone-supplies-bg {
      background: color-mix(in oklab, var(--supplies) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--supplies) 30%, transparent);
      color: var(--supplies);
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

    .tone-supplies { color: var(--supplies); background: color-mix(in oklab, var(--supplies) 14%, transparent); }
    .tone-ready { color: var(--ready); background: color-mix(in oklab, var(--ready) 14%, transparent); }
    .tone-warning { color: var(--warning); background: color-mix(in oklab, var(--warning) 14%, transparent); }
    .tone-operations { color: var(--operations); background: color-mix(in oklab, var(--operations) 14%, transparent); }

    /* KPI Bento Grid Styling */
    ::ng-deep {
      .pedidos-kpi-grid .prx-rich-stat-group__items,
      .pedidos-kpi-grid .pdx-rich-stat-group__items {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        width: 100%;
      }

      .pedidos-kpi-grid .prx-rich-stat-group__item,
      .pedidos-kpi-grid .pdx-rich-stat-group__item {
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

      .pedidos-kpi-grid .prx-rich-stat-group__value,
      .pedidos-kpi-grid .pdx-rich-stat-group__value {
        font-family: var(--font-display) !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        color: var(--foreground) !important;
        margin: 4px 0 0 !important;
      }

      .pedidos-kpi-grid .prx-rich-stat-group__label,
      .pedidos-kpi-grid .pdx-rich-stat-group__label {
        font-size: 0.68rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        color: var(--muted-foreground) !important;
      }

      .pedidos-kpi-grid .prx-rich-stat-group__caption,
      .pedidos-kpi-grid .pdx-rich-stat-group__caption {
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
export class PedidosPageComponent {
  protected readonly crudMetadata = PEDIDOS_CRUD_METADATA;
  protected readonly kpiDocument = PEDIDOS_KPI_DOCUMENT;
}
