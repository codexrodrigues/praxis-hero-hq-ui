import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';

export const PEDIDOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'procurement/purchase-orders',
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
        field: 'contractId',
        header: 'ID Contrato',
        width: '120px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'supplierId',
        header: 'ID Fornecedor',
        width: '130px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'productId',
        header: 'ID Insumo/Item',
        width: '130px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'quantity',
        header: 'Quantidade',
        type: 'number',
        width: '120px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'currency',
        header: 'Moeda',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status da Ordem',
        width: '150px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'orderDate',
        header: 'Data do Pedido',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '150px',
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

@Component({
  selector: 'app-pedidos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent],
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

      <!-- Bento Grid de KPIs -->
      <section class="kpi-grid">
        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-supplies">
            <span class="material-symbols-outlined">local_shipping</span>
          </div>
          <p class="kpi-label">Ordens de Compra</p>
          <p class="kpi-value">10 Pedidos</p>
          <p class="kpi-detail">Ciclo de suprimento em andamento</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-warning">
            <span class="material-symbols-outlined">pending_actions</span>
          </div>
          <p class="kpi-label">Aguardando Aprovação</p>
          <p class="kpi-value">4 Ordens Draft</p>
          <p class="kpi-detail text-warning">Compliance de compras e finanças</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-ready">
            <span class="material-symbols-outlined">inventory</span>
          </div>
          <p class="kpi-label">Insumos Críticos</p>
          <p class="kpi-value">Vibranium & Grafeno</p>
          <p class="kpi-detail text-ready">Fornecedores certificados pelo HQ</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-operations">
            <span class="material-symbols-outlined">schedule</span>
          </div>
          <p class="kpi-label">Lead Time de Entrega</p>
          <p class="kpi-value">&lt; 48 Horas</p>
          <p class="kpi-detail">Prioridade tática em campo</p>
        </div>
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

    .tone-supplies { color: var(--supplies); background: color-mix(in oklab, var(--supplies) 12%, transparent); }
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
    .text-warning { color: var(--warning) !important; }

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class PedidosPageComponent {
  protected readonly crudMetadata = PEDIDOS_CRUD_METADATA;
}
