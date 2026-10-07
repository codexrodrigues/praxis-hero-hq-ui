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
import {
  MissionBriefingDrawerComponent,
  type MissionProfile,
} from './mission-briefing-drawer.component';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';

export const MISSOES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/missoes',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'titulo',
        header: 'Título da Missão',
        width: '280px',
        sortable: true,
      },
      {
        field: 'prioridade',
        header: 'Prioridade',
        width: '140px',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status Operacional',
        width: '160px',
        sortable: true,
      },
      {
        field: 'localizacao',
        header: 'Teatro de Operações',
        width: '220px',
        sortable: true,
      },
      {
        field: 'dataInicioPrevista',
        header: 'Início Previsto',
        type: 'date',
        format: 'dd/MM/yyyy HH:mm',
        width: '180px',
        sortable: true,
      },
      {
        field: 'dataFimPrevista',
        header: 'Fim Previsto',
        type: 'date',
        format: 'dd/MM/yyyy HH:mm',
        width: '180px',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Despacho Tático',
      action: 'edit',
      openMode: 'modal',
      formId: 'missoes-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Nova Missão',
      action: 'create',
      openMode: 'modal',
      formId: 'missoes-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '920px', maxWidth: '95vw' },
  },
};

export const MISSIONS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'missions-kpi-grid',
      items: [
        {
          id: 'ativas',
          label: 'Missões Ativas em Campo',
          value: '06 Incursões',
          caption: 'Em andamento no radar operacional',
          icon: 'flight_takeoff',
          tone: 'info',
        },
        {
          id: 'sucesso',
          label: 'Taxa de Sucesso Histórica',
          value: '66,7%',
          caption: '4 missões concluídas com êxito',
          icon: 'task_alt',
          tone: 'success',
        },
        {
          id: 'planejamento',
          label: 'Em Planejamento / Briefing',
          value: '10 Missões',
          caption: 'Em preparação e briefing tático',
          icon: 'schedule',
          tone: 'warning',
        },
        {
          id: 'omega',
          label: 'Prioridade Ômega / Crítica',
          value: '10 Alertas',
          caption: 'Engajamento de prioridade crítica',
          icon: 'crisis_alert',
          tone: 'danger',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-missoes-page',
  standalone: true,
  imports: [
    CommonModule,
    PraxisCrudComponent,
    PraxisRichContent,
    MissionBriefingDrawerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-operations">
            <span class="material-symbols-outlined">military_tech</span>
            Operações & Missões Táticas
          </div>
          <h1 class="title-gradient page-title">Centro de Missões</h1>
          <p class="page-subtitle">
            Planejamento, despacho tático, coordenação de equipes em campo e diário de bordo operacional.
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
          crudId="heroes-hq-missoes-crud"
          [metadata]="crudMetadata"
          (rowClick)="onMissionRowClicked($event)"
        />
      </section>

      <!-- Mission Briefing Drawer -->
      <app-mission-briefing-drawer
        [mission]="selectedMission()"
        (close)="selectedMission.set(null)"
      />
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
      background: color-mix(in oklab, var(--operations) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--operations) 30%, transparent);
      color: var(--operations);
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

    .tone-operations { color: var(--operations); background: color-mix(in oklab, var(--operations) 14%, transparent); }
    .tone-ready { color: var(--ready); background: color-mix(in oklab, var(--ready) 14%, transparent); }
    .tone-warning { color: var(--warning); background: color-mix(in oklab, var(--warning) 14%, transparent); }
    .tone-risk { color: var(--risk); background: color-mix(in oklab, var(--risk) 14%, transparent); }

    /* KPI Bento Grid Styling */
    ::ng-deep {
      .missions-kpi-grid .prx-rich-stat-group__items,
      .missions-kpi-grid .pdx-rich-stat-group__items {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        width: 100%;
      }

      .missions-kpi-grid .prx-rich-stat-group__item,
      .missions-kpi-grid .pdx-rich-stat-group__item {
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

      .missions-kpi-grid .prx-rich-stat-group__value,
      .missions-kpi-grid .pdx-rich-stat-group__value {
        font-family: var(--font-display) !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        color: var(--foreground) !important;
        margin: 4px 0 0 !important;
      }

      .missions-kpi-grid .prx-rich-stat-group__label,
      .missions-kpi-grid .pdx-rich-stat-group__label {
        font-size: 0.68rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        color: var(--muted-foreground) !important;
      }

      .missions-kpi-grid .prx-rich-stat-group__caption,
      .missions-kpi-grid .pdx-rich-stat-group__caption {
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
export class MissoesPageComponent implements OnInit, OnDestroy {
  protected readonly crudMetadata = MISSOES_CRUD_METADATA;
  protected readonly kpiDocument = signal<RichContentDocument>(MISSIONS_KPI_DOCUMENT);
  protected readonly selectedMission = signal<MissionProfile | null>(null);

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
    this.kpiSub = this.dashboardStats.getMissionTacticalKpis().subscribe((kpis) => {
      const formattedRate = kpis.successRate.toLocaleString('pt-BR', {
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
            className: 'missions-kpi-grid',
            items: [
              {
                id: 'ativas',
                label: 'Missões Ativas em Campo',
                value: `${kpis.activeMissions < 10 ? '0' : ''}${kpis.activeMissions} Incursões`,
                caption: 'Em andamento no radar operacional',
                icon: 'flight_takeoff',
                tone: 'info',
              },
              {
                id: 'sucesso',
                label: 'Taxa de Sucesso Histórica',
                value: `${formattedRate}%`,
                caption: `${kpis.completedMissions} missões concluídas com êxito`,
                icon: 'task_alt',
                tone: 'success',
              },
              {
                id: 'planejamento',
                label: 'Em Planejamento / Briefing',
                value: `${kpis.plannedMissions < 10 ? '0' : ''}${kpis.plannedMissions} Missões`,
                caption: 'Em preparação e briefing tático',
                icon: 'schedule',
                tone: 'warning',
              },
              {
                id: 'omega',
                label: 'Prioridade Ômega / Crítica',
                value: `${kpis.criticalPriorityMissions < 10 ? '0' : ''}${kpis.criticalPriorityMissions} Alertas`,
                caption: 'Engajamento de prioridade crítica',
                icon: 'crisis_alert',
                tone: 'danger',
              },
            ],
          },
        ],
      });
    });
  }

  protected onMissionRowClicked(event: unknown): void {
    const raw = (event as any)?.row ?? (event as any)?.data ?? event;
    if (!raw || typeof raw !== 'object' || !('id' in raw)) {
      return;
    }
    const mission: MissionProfile = {
      id: raw.id,
      titulo: raw.titulo || 'Operação Tática',
      descricao: raw.descricao,
      prioridade: raw.prioridade || 'MEDIA',
      status: raw.status || 'EM_ANDAMENTO',
      localizacao: raw.localizacao || 'Setor Global',
      dataInicioPrevista: raw.dataInicioPrevista,
      dataFimPrevista: raw.dataFimPrevista,
    };
    this.selectedMission.set(mission);
  }
}
