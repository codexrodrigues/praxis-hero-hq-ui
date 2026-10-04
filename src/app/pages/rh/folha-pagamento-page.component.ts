import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';

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
        header: 'ID',
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
        field: 'mes',
        header: 'Mês',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'funcionarioId',
        header: 'ID Colaborador',
        width: '130px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'dataPagamento',
        header: 'Data de Pagamento',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '160px',
        sortable: true,
      },
      {
        field: 'salarioBruto',
        header: 'Salário Bruto (R$)',
        type: 'currency',
        format: 'BRL',
        width: '170px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'totalDescontos',
        header: 'Descontos (R$)',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'salarioLiquido',
        header: 'Salário Líquido (R$)',
        type: 'currency',
        format: 'BRL',
        width: '170px',
        align: 'right',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Revisar Folha',
      action: 'edit',
      openMode: 'modal',
      formId: 'folhas-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Lançar Folha Individual',
      action: 'create',
      openMode: 'modal',
      formId: 'folhas-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '880px', maxWidth: '95vw' },
  },
};

@Component({
  selector: 'app-folha-pagamento-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent],
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

      <!-- Bento Grid de KPIs -->
      <section class="kpi-grid">
        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-rh">
            <span class="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <p class="kpi-label">Volume Folha Mensal</p>
          <p class="kpi-value">R$ 1,42M</p>
          <p class="kpi-detail">Competência atual 03/2026</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-ready">
            <span class="material-symbols-outlined">receipt_long</span>
          </div>
          <p class="kpi-label">Registros Consolidados</p>
          <p class="kpi-value">3.246 Ciclos</p>
          <p class="kpi-detail text-ready">Histórico fiscal e operacional</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-warning">
            <span class="material-symbols-outlined">savings</span>
          </div>
          <p class="kpi-label">Retenções & Encargos</p>
          <p class="kpi-value">R$ 384k</p>
          <p class="kpi-detail text-warning">Previdência, saúde e seguros</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-operations">
            <span class="material-symbols-outlined">calendar_month</span>
          </div>
          <p class="kpi-label">Próxima Liquidação</p>
          <p class="kpi-value">28/03/2026</p>
          <p class="kpi-detail">Programada via tesouraria</p>
        </div>
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
    .text-warning { color: var(--warning) !important; }

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class FolhaPagamentoPageComponent {
  protected readonly crudMetadata = FOLHA_PAGAMENTO_CRUD_METADATA;
}
