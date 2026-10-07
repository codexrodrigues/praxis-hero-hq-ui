import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';

export const FOLHA_PAGAMENTO_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/folhas-pagamento',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'Ciclo ID',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'funcionarioNome',
        header: 'Colaborador / Herói',
        width: '260px',
        sortable: true,
      },
      {
        field: 'mes',
        header: 'Mês',
        width: '80px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'ano',
        header: 'Ano',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'salarioBruto',
        header: 'Salário Bruto',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'totalDescontos',
        header: 'Retenções Táticas',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'salarioLiquido',
        header: 'Líquido a Pagar',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status Liquidação',
        width: '150px',
        align: 'center',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Auditar Holerite',
      action: 'edit',
      openMode: 'modal',
      formId: 'folha-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Novo Lançamento',
      action: 'create',
      openMode: 'modal',
      formId: 'folha-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '840px', maxWidth: '95vw' },
  },
};

export const FOLHA_PAGAMENTO_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      className: 'folha-kpi-grid',
      items: [
        {
          id: 'volume',
          label: 'Volume Folha Mensal',
          value: 'R$ 1,42M',
          caption: 'Competência atual 03/2026',
          icon: 'account_balance_wallet',
          tone: 'info',
        },
        {
          id: 'consolidados',
          label: 'Registros Consolidados',
          value: '3.246 Ciclos',
          caption: 'Histórico fiscal e operacional',
          icon: 'receipt_long',
          tone: 'success',
        },
        {
          id: 'retencoes',
          label: 'Retenções & Encargos',
          value: 'R$ 384k',
          caption: 'Previdência, saúde e seguros',
          icon: 'savings',
          tone: 'warning',
        },
        {
          id: 'liquidacao',
          label: 'Próxima Liquidação',
          value: '28/03/2026',
          caption: 'Programada via tesouraria',
          icon: 'calendar_month',
          tone: 'neutral',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-folha-pagamento-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh-bg">
            <span class="material-symbols-outlined">payments</span>
            Pessoas & Finanças Operacionais
          </div>
          <h1 class="title-gradient page-title">Folha de Pagamento & Remuneração</h1>
          <p class="page-subtitle">
            Processamento de proventos, bônus de risco, retenções fiscais e liquidação de ciclos remuneratórios do quadro de heróis.
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
          crudId="heroes-hq-folha-pagamento-crud"
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
      .folha-kpi-grid .prx-rich-stat-group__items,
      .folha-kpi-grid .pdx-rich-stat-group__items {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        width: 100%;
      }

      .folha-kpi-grid .prx-rich-stat-group__item,
      .folha-kpi-grid .pdx-rich-stat-group__item {
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

      .folha-kpi-grid .prx-rich-stat-group__value,
      .folha-kpi-grid .pdx-rich-stat-group__value {
        font-family: var(--font-display) !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        color: var(--foreground) !important;
        margin: 4px 0 0 !important;
      }

      .folha-kpi-grid .prx-rich-stat-group__label,
      .folha-kpi-grid .pdx-rich-stat-group__label {
        font-size: 0.68rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        color: var(--muted-foreground) !important;
      }

      .folha-kpi-grid .prx-rich-stat-group__caption,
      .folha-kpi-grid .pdx-rich-stat-group__caption {
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
export class FolhaPagamentoPageComponent {
  protected readonly crudMetadata = FOLHA_PAGAMENTO_CRUD_METADATA;
  protected readonly kpiDocument = FOLHA_PAGAMENTO_KPI_DOCUMENT;
}
