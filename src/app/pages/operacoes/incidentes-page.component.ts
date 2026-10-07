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

export const INCIDENTES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/incidentes',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'Registro',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'descricao',
        header: 'Descrição do Sinistro / Impacto',
        width: '320px',
        sortable: true,
      },
      {
        field: 'local',
        header: 'Teatro do Dano',
        width: '200px',
        sortable: true,
      },
      {
        field: 'severidade',
        header: 'Severidade',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'danosCivis',
        header: 'Prejuízo Civil (R$)',
        type: 'currency',
        format: 'BRL',
        width: '180px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'ocorridoEm',
        header: 'Data do Ocorrido',
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

export const INCIDENTES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'incidentes-kpi-grid',
      items: [
        {
          id: 'incidentes',
          label: 'Total de Ocorrências',
          value: '74 Registros',
          caption: 'Sinistros pós-combate catalogados',
          icon: 'report',
          tone: 'neutral',
        },
        {
          id: 'criticos',
          label: 'Severidade Crítica',
          value: '18 Casos Críticos',
          caption: 'Alto impacto civil e estrutural',
          icon: 'warning',
          tone: 'danger',
        },
        {
          id: 'danos',
          label: 'Volume de Danos Estimados',
          value: 'R$ 154,4M',
          caption: 'Fundos de mitigação acionados',
          icon: 'payments',
          tone: 'warning',
        },
        {
          id: 'mitigacao',
          label: 'Taxa de Mitigação',
          value: '96,2%',
          caption: 'Contenção eficaz de efeitos colaterais',
          icon: 'verified',
          tone: 'success',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-incidentes-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-operations-bg">
            <span class="material-symbols-outlined">warning</span>
            Risco & Danos Colaterais
          </div>
          <h1 class="title-gradient page-title">Incidentes Táticos & Sinistros</h1>
          <p class="page-subtitle">
            Catalogação de ocorrências pós-missão, avaliação de severidade, apuração de prejuízos civis e contenção de danos.
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
          crudId="heroes-hq-incidentes-crud"
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

    .tone-operations-bg {
      background: color-mix(in oklab, var(--operations) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--operations) 30%, transparent);
      color: var(--operations);
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
export class IncidentesPageComponent implements OnInit, OnDestroy {
  protected readonly crudMetadata = INCIDENTES_CRUD_METADATA;
  protected readonly kpiDocument = signal<RichContentDocument>(INCIDENTES_KPI_DOCUMENT);

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
    this.kpiSub = this.dashboardStats.getIncidentesTacticalKpis().subscribe((kpis) => {
      const damagesMillion = (kpis.totalCivilDamages / 1_000_000).toLocaleString('pt-BR', {
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
            className: 'incidentes-kpi-grid',
            items: [
              {
                id: 'incidentes',
                label: 'Total de Ocorrências',
                value: `${kpis.totalIncidentes} Registros`,
                caption: 'Sinistros pós-combate catalogados',
                icon: 'report',
                tone: 'neutral',
              },
              {
                id: 'criticos',
                label: 'Severidade Crítica',
                value: `${kpis.criticalIncidentes} Casos Críticos`,
                caption: 'Alto impacto civil e estrutural',
                icon: 'warning',
                tone: 'danger',
              },
              {
                id: 'danos',
                label: 'Danos Civis Estimados',
                value: `R$ ${damagesMillion}M`,
                caption: 'Fundos de mitigação acionados',
                icon: 'payments',
                tone: 'warning',
              },
              {
                id: 'mitigacao',
                label: 'Taxa de Mitigação',
                value: `${kpis.mitigationRate.toString().replace('.', ',')}%`,
                caption: 'Contenção eficaz de efeitos colaterais',
                icon: 'verified',
                tone: 'success',
              },
            ],
          },
        ],
      });
    });
  }
}
