import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';

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
        field: 'orderDate',
        header: 'Data do Pedido',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'quantity',
        header: 'Qtd. de Itens',
        type: 'number',
        width: '120px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'currency',
        header: 'Moeda',
        width: '100px',
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
        field: 'approvedAt',
        header: 'Aprovado Em',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'receivedAt',
        header: 'Recebido Em',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'disabledReason',
        header: 'Observações / Motivo',
        width: '220px',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  defaults: {
    openMode: 'drawer',
  },
};

export const PEDIDOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
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
          id: 'aprovadas',
          label: 'Aprovadas / Entregues',
          value: '5 Ordens',
          caption: 'Itens em expedição ou já recebidos',
          icon: 'inventory',
          tone: 'success',
        },
        {
          id: 'analise',
          label: 'Aguardando Aprovação',
          value: '3 em Análise',
          caption: 'Compliance de compras e finanças',
          icon: 'pending_actions',
          tone: 'warning',
        },
        {
          id: 'canceladas',
          label: 'Canceladas / Revogadas',
          value: '2 Pedidos',
          caption: 'Ordens reavaliadas pelo comando',
          icon: 'cancel',
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
        <div>
          <div class="domain-tag tone-supplies">
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
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Metadata-Driven CRUD Runtime -->
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

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class PedidosPageComponent implements OnInit, OnDestroy {
  protected readonly crudMetadata = PEDIDOS_CRUD_METADATA;
  protected readonly kpiDocument = signal<RichContentDocument>(PEDIDOS_KPI_DOCUMENT);

  private readonly dashboardStats = inject(DashboardStatsService);
  private kpiSub: Subscription | null = null;

  ngOnInit(): void {
    this.loadKpis();
  }

  ngOnDestroy(): void {
    this.kpiSub?.unsubscribe();
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getPedidosTacticalKpis().subscribe((kpis) => {
      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'pedidos-kpi-grid',
            items: [
              {
                id: 'ordens',
                label: 'Ordens de Compra',
                value: `${kpis.totalPedidos} Pedidos`,
                caption: 'Ciclo de suprimento em andamento',
                icon: 'local_shipping',
                tone: 'info',
              },
              {
                id: 'aprovadas',
                label: 'Aprovadas / Entregues',
                value: `${kpis.approvedOrReceived} Ordens`,
                caption: 'Itens em expedição ou já recebidos',
                icon: 'inventory',
                tone: 'success',
              },
              {
                id: 'analise',
                label: 'Aguardando Aprovação',
                value: `${kpis.draft} em Análise`,
                caption: 'Compliance de compras e finanças',
                icon: 'pending_actions',
                tone: 'warning',
              },
              {
                id: 'canceladas',
                label: 'Canceladas / Revogadas',
                value: `${kpis.cancelled} Pedidos`,
                caption: 'Ordens reavaliadas pelo comando',
                icon: 'cancel',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
