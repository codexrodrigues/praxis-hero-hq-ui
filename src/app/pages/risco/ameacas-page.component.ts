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

export const AMEACAS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'risk-intelligence/ameacas',
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
        field: 'nome',
        header: 'Designação da Ameaça',
        width: '220px',
        sortable: true,
      },
      {
        field: 'classe',
        header: 'Classe Tática',
        width: '150px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'planeta',
        header: 'Origem Planetária',
        width: '160px',
        sortable: true,
      },
      {
        field: 'nivel',
        header: 'Nível de Perigo',
        type: 'number',
        width: '130px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status de Contenção',
        width: '160px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'recompensa',
        header: 'Recompensa Fixada',
        type: 'currency',
        format: 'BRL',
        width: '180px',
        align: 'right',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  defaults: {
    openMode: 'drawer',
  },
};

export const AMEACAS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
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
          id: 'confronto',
          label: 'Em Confronto Ativo',
          value: '6 em Combate',
          caption: 'Esquadrões mobilizados em solo',
          icon: 'crisis_alert',
          tone: 'warning',
        },
        {
          id: 'contidos',
          label: 'Contidos / Prisão Raft',
          value: '3 Neutralizados',
          caption: 'Custodiados em estase de força',
          icon: 'lock',
          tone: 'success',
        },
        {
          id: 'recompensas',
          label: 'Fundo Total de Recompensas',
          value: 'R$ 12,1 M',
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
        <praxis-rich-content [document]="kpiDocument()" />
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

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class AmeacasPageComponent implements OnInit, OnDestroy {
  protected readonly crudMetadata = AMEACAS_CRUD_METADATA;
  protected readonly kpiDocument = signal<RichContentDocument>(AMEACAS_KPI_DOCUMENT);

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
    this.kpiSub = this.dashboardStats.getAmeacasTacticalKpis().subscribe((kpis) => {
      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'ameacas-kpi-grid',
            items: [
              {
                id: 'ameacas',
                label: 'Ameaças Monitoradas',
                value: `${kpis.totalAmeacas} Alvos`,
                caption: 'Radar contínuo em frequência quântica',
                icon: 'warning',
                tone: 'danger',
              },
              {
                id: 'confronto',
                label: 'Em Confronto Ativo',
                value: `${kpis.confrontation} em Combate`,
                caption: 'Esquadrões mobilizados em solo',
                icon: 'crisis_alert',
                tone: 'warning',
              },
              {
                id: 'contidos',
                label: 'Contidos / Prisão Raft',
                value: `${kpis.contained} Neutralizados`,
                caption: 'Custodiados em estase de força',
                icon: 'lock',
                tone: 'success',
              },
              {
                id: 'recompensas',
                label: 'Fundo Total de Recompensas',
                value: `R$ ${kpis.totalBountyMillion} M`,
                caption: 'Garantido pelo Acordo de Sokovia',
                icon: 'payments',
                tone: 'info',
              },
            ],
          },
        ],
      });
    });
  }
}
