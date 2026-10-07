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

export const INDICADORES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'risk-intelligence/vw-indicadores-incidentes',
    idField: 'incidenteId',
  },
  table: {
    columns: [
      {
        field: 'incidenteId',
        header: 'Registro',
        width: '100px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'missao',
        header: 'Missão de Origem',
        width: '220px',
        sortable: true,
      },
      {
        field: 'descricao',
        header: 'Incidente / Dano Apurado',
        width: '280px',
        sortable: true,
      },
      {
        field: 'local',
        header: 'Local do Dano',
        width: '160px',
        sortable: true,
      },
      {
        field: 'severidade',
        header: 'Severidade',
        width: '130px',
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
        field: 'totalIndenizacoes',
        header: 'Indenizações Totais',
        type: 'currency',
        format: 'BRL',
        width: '180px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'totalPago',
        header: 'Total Indenizado',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'totalPendente',
        header: 'Saldo Pendente',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  defaults: {
    openMode: 'drawer',
  },
};

export const INDICADORES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'indicadores-kpi-grid',
      items: [
        {
          id: 'passivo',
          label: 'Sinistros com Passivo',
          value: '74 Casos',
          caption: 'Histórico de acordos regulados pelo HQ',
          icon: 'gavel',
          tone: 'danger',
        },
        {
          id: 'total',
          label: 'Volume de Indenizações',
          value: 'R$ 99,5 M',
          caption: 'Compensações acordadas com o judiciário',
          icon: 'payments',
          tone: 'warning',
        },
        {
          id: 'danos',
          label: 'Danos Civis Apurados',
          value: 'R$ 154,4 M',
          caption: 'Prejuízo material total auditado',
          icon: 'broken_image',
          tone: 'info',
        },
        {
          id: 'saldo',
          label: 'Saldo em Conciliação',
          value: 'R$ 72,8 M',
          caption: 'Em análise de perícia e fundos de seguro',
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
        <div>
          <div class="domain-tag tone-risk">
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
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Metadata-Driven CRUD Runtime -->
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

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class IndicadoresPageComponent implements OnInit, OnDestroy {
  protected readonly crudMetadata = INDICADORES_CRUD_METADATA;
  protected readonly kpiDocument = signal<RichContentDocument>(INDICADORES_KPI_DOCUMENT);

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
    this.kpiSub = this.dashboardStats.getIndicadoresRiscoTacticalKpis().subscribe((kpis) => {
      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'indicadores-kpi-grid',
            items: [
              {
                id: 'passivo',
                label: 'Sinistros com Passivo',
                value: `${kpis.totalIncidentes} Casos`,
                caption: 'Histórico de acordos regulados pelo HQ',
                icon: 'gavel',
                tone: 'danger',
              },
              {
                id: 'total',
                label: 'Volume de Indenizações',
                value: `R$ ${kpis.totalIndenizacoesMillion} M`,
                caption: `Compensações acordadas (${kpis.liquidationRate}% liquidado)`,
                icon: 'payments',
                tone: 'warning',
              },
              {
                id: 'danos',
                label: 'Danos Civis Apurados',
                value: `R$ ${kpis.totalDanosMillion} M`,
                caption: 'Prejuízo material total auditado',
                icon: 'broken_image',
                tone: 'info',
              },
              {
                id: 'saldo',
                label: 'Saldo em Conciliação',
                value: `R$ ${kpis.totalPendenteMillion} M`,
                caption: 'Em análise de perícia e fundos de seguro',
                icon: 'hourglass_top',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
