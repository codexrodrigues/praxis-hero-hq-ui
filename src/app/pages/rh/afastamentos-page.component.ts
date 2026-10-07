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

export const AFASTAMENTOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/ferias-afastamentos',
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
        field: 'tipo',
        header: 'Tipo de Licença / Ausência',
        width: '180px',
        align: 'left',
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
        field: 'dataInicio',
        header: 'Início da Vigência',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '150px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'dataFim',
        header: 'Término Previsto',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '150px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'observacoes',
        header: 'Observações / Parecer Operacional',
        width: '320px',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  defaults: {
    openMode: 'drawer',
  },
};

export const AFASTAMENTOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'afastamentos-kpi-grid',
      items: [
        {
          id: 'ciclos',
          label: 'Total de Registros',
          value: '111 Registros',
          caption: 'Férias regulamentares e licenças',
          icon: 'history',
          tone: 'neutral',
        },
        {
          id: 'criticos',
          label: 'Casos Críticos / Graves',
          value: '51 Ocorrências',
          caption: 'Trauma de combate e regeneração',
          icon: 'health_and_safety',
          tone: 'danger',
        },
        {
          id: 'padrao',
          label: 'Licenças Padrão',
          value: '60 Registros',
          caption: 'Descanso e suporte preventivo',
          icon: 'event_available',
          tone: 'info',
        },
        {
          id: 'dias',
          label: 'Dias em Recuperação',
          value: '1.204 Dias',
          caption: 'Total acumulado em afastamento',
          icon: 'calendar_month',
          tone: 'warning',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-afastamentos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh-bg">
            <span class="material-symbols-outlined">event_busy</span>
            Gestão de Pessoas & Disponibilidade
          </div>
          <h1 class="title-gradient page-title">Férias & Afastamentos Táticos</h1>
          <p class="page-subtitle">
            Controle de períodos de descanso regulamentar, licenças médicas de recuperação pós-combate e escalas de substituição.
          </p>
        </div>
      </header>

      <!-- Bento Grid de KPIs via RichContent Canonical -->
      <section class="kpi-surface">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Tabela CRUD Governança Canônica -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-afastamentos-crud"
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
export class AfastamentosPageComponent implements OnInit, OnDestroy {
  protected readonly crudMetadata = AFASTAMENTOS_CRUD_METADATA;
  protected readonly kpiDocument = signal<RichContentDocument>(AFASTAMENTOS_KPI_DOCUMENT);

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
    this.kpiSub = this.dashboardStats.getAfastamentosTacticalKpis().subscribe((kpis) => {
      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'afastamentos-kpi-grid',
            items: [
              {
                id: 'ciclos',
                label: 'Total de Registros',
                value: `${kpis.totalRecords.toLocaleString('pt-BR')} Registros`,
                caption: 'Férias regulamentares e licenças',
                icon: 'history',
                tone: 'neutral',
              },
              {
                id: 'criticos',
                label: 'Casos Críticos / Graves',
                value: `${kpis.criticalCases.toLocaleString('pt-BR')} Ocorrências`,
                caption: 'Trauma de combate e regeneração',
                icon: 'health_and_safety',
                tone: 'danger',
              },
              {
                id: 'padrao',
                label: 'Licenças Padrão',
                value: `${kpis.standardLeaves.toLocaleString('pt-BR')} Registros`,
                caption: 'Descanso e suporte preventivo',
                icon: 'event_available',
                tone: 'info',
              },
              {
                id: 'dias',
                label: 'Dias em Recuperação',
                value: `${kpis.totalDaysAway.toLocaleString('pt-BR')} Dias`,
                caption: 'Total acumulado em afastamento',
                icon: 'calendar_month',
                tone: 'warning',
              },
            ],
          },
        ],
      });
    });
  }
}
