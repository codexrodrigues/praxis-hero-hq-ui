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
        field: 'funcionarioId',
        header: 'Colaborador ID',
        width: '140px',
        align: 'center',
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
        field: 'dataPagamento',
        header: 'Data de Pagamento',
        type: 'date',
        width: '160px',
        align: 'center',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  defaults: {
    openMode: 'drawer',
  },
};

export const FOLHA_PAGAMENTO_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'folha-kpi-grid',
      items: [
        {
          id: 'volume',
          label: 'Volume Folha Mensal',
          value: 'R$ 3,45M',
          caption: 'Competência ativa 03/2026',
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
          value: 'R$ 868,7k',
          caption: 'Previdência, saúde e encargos',
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
        <praxis-rich-content [document]="kpiDocument()" />
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

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class FolhaPagamentoPageComponent implements OnInit, OnDestroy {
  protected readonly crudMetadata = FOLHA_PAGAMENTO_CRUD_METADATA;
  protected readonly kpiDocument = signal<RichContentDocument>(FOLHA_PAGAMENTO_KPI_DOCUMENT);

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
    this.kpiSub = this.dashboardStats.getPayrollTacticalKpis().subscribe((kpis) => {
      const grossMillion = (kpis.monthlyGrossVolume / 1_000_000).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const deductionsK = (kpis.monthlyDeductions / 1_000).toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'folha-kpi-grid',
            items: [
              {
                id: 'volume',
                label: 'Volume Folha Mensal',
                value: `R$ ${grossMillion}M`,
                caption: `Competência ativa ${kpis.activeCompetence}`,
                icon: 'account_balance_wallet',
                tone: 'info',
              },
              {
                id: 'consolidados',
                label: 'Registros Consolidados',
                value: `${kpis.totalCycles.toLocaleString('pt-BR')} Ciclos`,
                caption: 'Histórico fiscal e operacional',
                icon: 'receipt_long',
                tone: 'success',
              },
              {
                id: 'retencoes',
                label: 'Retenções & Encargos',
                value: `R$ ${deductionsK}k`,
                caption: 'Previdência, saúde e encargos',
                icon: 'savings',
                tone: 'warning',
              },
              {
                id: 'liquidacao',
                label: 'Próxima Liquidação',
                value: kpis.nextPaymentDate,
                caption: 'Programada via tesouraria',
                icon: 'calendar_month',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}

