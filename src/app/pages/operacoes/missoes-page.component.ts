import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
        field: 'id',
        header: 'Cód.',
        width: '80px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'titulo',
        header: 'Título da Missão',
        width: '250px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'ameacaNome',
        header: 'Ameaça / Alvo Tático',
        width: '160px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'prioridade',
        header: 'Prioridade',
        width: '120px',
        align: 'center',
        sortable: true,
        filterable: true,
      },
      {
        field: 'status',
        header: 'Status Operacional',
        width: '150px',
        align: 'center',
        sortable: true,
        filterable: true,
      },
      {
        field: 'progresso',
        header: 'Prontidão Operacional',
        width: '180px',
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'bullet',
              surface: 'table-cell',
              valueExpr: '= min(95, max(25, round(row.id * 2.8)))',
              target: 80,
              total: 100,
              tone: 'info',
              fallbackText: 'Prontidão',
            },
          },
        },
      },
      {
        field: 'local',
        header: 'Teatro de Operações',
        width: '170px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'inicioPrev',
        header: 'Início Previsto',
        type: 'date',
        format: 'dd/MM/yyyy HH:mm',
        width: '160px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'fimPrev',
        header: 'Fim Previsto',
        type: 'date',
        format: 'dd/MM/yyyy HH:mm',
        width: '160px',
        sortable: true,
        filterable: true,
      },
    ],
    toolbar: {
      visible: true,
      filters: {
        enabled: true,
        showAdvancedButton: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Missões', icon: 'military_tech', filter: {} },
          { id: 'ativas', label: 'Em Andamento', icon: 'flight_takeoff', filter: { status: 'EM_ANDAMENTO' } },
          { id: 'omega', label: 'Prioridade Ômega', icon: 'crisis_alert', filter: { prioridade: 'CRITICA' } },
          { id: 'planejamento', label: 'Em Planejamento', icon: 'schedule', filter: { status: 'PLANEJADA' } },
        ],
      },
    },
    behavior: {
      filtering: {
        enabled: true,
        columnFilters: {
          enabled: true,
        },
        advancedFilters: {
          enabled: true,
          settings: {
            showAdvanced: true,
            alwaysVisibleFields: ['titulo', 'status', 'prioridade', 'ameacaNome', 'local'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
      expansion: {
        enabled: true,
        contractVersion: '1.0.0',
        identity: { rowKeySource: 'table.idField', requireStableIdField: true },
        state: { mode: 'uncontrolled' },
        interaction: {
          trigger: 'icon',
          toggleOnRowClick: false,
        },
        limits: { allowMultiple: false, maxExpandedRows: 1, onOverflow: 'collapseOldest' },
      },
      detail: {
        schemaContract: {
          kind: 'praxis.detail.schema',
          version: '1.0.0',
          compat: 'semver',
          allowedNodes: [
            'card',
            'value',
            'stack',
            'text',
            'icon',
            'badge',
            'timeline',
            'list',
            'tabs',
            'tab',
            'mediaBlock',
            'cardGrid',
          ],
          sanitization: 'strict',
        },
        rendering: {
          strategy: 'registry',
          registryId: 'praxis.detail.default',
          rendererVersion: '1.0.0',
          fallbackNodePolicy: 'failClosed',
        },
        source: {
          mode: 'inline',
          inlineSchema: {
            layout: 'stack',
            items: [
              {
                type: 'card',
                title: 'Briefing Tático Integrado & Parâmetros de Missão',
                subtitle: 'Visão operacional expandida do teatro de operações e alvos prioritários',
                content: [
                  {
                    type: 'stack',
                    items: [
                      {
                        type: 'value',
                        label: 'Objetivo Estratégico',
                        valueField: 'objetivo',
                      },
                      {
                        type: 'value',
                        label: 'Ameaça / Inimigo Associado',
                        valueField: 'ameacaNome',
                      },
                      {
                        type: 'value',
                        label: 'Teatro de Operações',
                        valueField: 'local',
                      },
                      {
                        type: 'value',
                        label: 'Janela Real de Início (Telemetria)',
                        valueField: 'inicioReal',
                      },
                      {
                        type: 'value',
                        label: 'Janela Real de Conclusão',
                        valueField: 'fimReal',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    },
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

      <!-- Metadata-Driven KPI Bento Grid com Interatividade de Filtro -->
      <section
        class="kpi-surface"
        (click)="onKpiSectionClicked($event)"
        [attr.data-active-filter]="activeFilterId()"
        title="Clique em um indicador para filtrar as missões abaixo"
      >
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Tática de Filtro e Escopo de Missões -->
      <div class="tactical-filter-bar glass-panel">
        <div class="filter-bar-lead">
          <span class="material-symbols-outlined filter-icon">filter_alt</span>
          <span class="filter-lead-label">Status da Operação:</span>
        </div>

        <div class="filter-chips-track">
          <button
            type="button"
            class="scope-chip"
            [class.is-active]="activeFilterId() === 'all'"
            (click)="setFilter('all')"
          >
            <span class="material-symbols-outlined">military_tech</span>
            <span>Todas as Missões</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-ready"
            [class.is-active]="activeFilterId() === 'ativas'"
            (click)="setFilter('ativas')"
          >
            <span class="material-symbols-outlined">flight_takeoff</span>
            <span>Em Andamento</span>
            <span class="chip-count">{{ activeCount() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-danger"
            [class.is-active]="activeFilterId() === 'omega'"
            (click)="setFilter('omega')"
          >
            <span class="material-symbols-outlined">crisis_alert</span>
            <span>Prioridade Ômega</span>
            <span class="chip-count">{{ criticalCount() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-warning"
            [class.is-active]="activeFilterId() === 'planejamento'"
            (click)="setFilter('planejamento')"
          >
            <span class="material-symbols-outlined">schedule</span>
            <span>Em Planejamento</span>
            <span class="chip-count">{{ plannedCount() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-success"
            [class.is-active]="activeFilterId() === 'concluidas'"
            (click)="setFilter('concluidas')"
          >
            <span class="material-symbols-outlined">task_alt</span>
            <span>Concluídas</span>
            <span class="chip-count">{{ completedCount() }}</span>
          </button>
        </div>

        @if (activeFilterId() !== 'all') {
          <button type="button" class="clear-scope-btn" (click)="setFilter('all')">
            <span class="material-symbols-outlined">restart_alt</span>
            <span>Limpar Filtro</span>
          </button>
        }
      </div>

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-missoes-crud"
          [metadata]="activeCrudMetadata()"
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

    /* Tactical Filter Bar */
    .tactical-filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 18px;
      border-radius: 14px;
      flex-wrap: wrap;
    }

    .filter-bar-lead {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--muted-foreground);
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;

      .filter-icon {
        font-size: 18px;
        color: var(--operations);
      }
    }

    .filter-chips-track {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .scope-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 34px;
      padding: 0 14px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: color-mix(in oklab, var(--card) 70%, transparent);
      color: var(--muted-foreground);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      span.material-symbols-outlined {
        font-size: 16px;
      }

      .chip-count {
        padding: 2px 7px;
        border-radius: 9999px;
        font-size: 0.72rem;
        background: color-mix(in oklab, var(--muted) 80%, transparent);
        color: var(--foreground);
      }

      &:hover {
        border-color: color-mix(in oklab, var(--operations) 40%, var(--border));
        color: var(--foreground);
        transform: translateY(-1px);
      }

      &.is-active {
        background: color-mix(in oklab, var(--operations) 15%, var(--card));
        border-color: var(--operations);
        color: var(--foreground);
        box-shadow: 0 0 0 1px color-mix(in oklab, var(--operations) 40%, transparent);

        .chip-count {
          background: var(--operations);
          color: #fff;
        }
      }

      &.chip-ready.is-active {
        background: color-mix(in oklab, var(--ready) 15%, var(--card));
        border-color: var(--ready);

        .chip-count {
          background: var(--ready);
          color: #fff;
        }
      }

      &.chip-danger.is-active {
        background: color-mix(in oklab, var(--risk) 15%, var(--card));
        border-color: var(--risk);

        .chip-count {
          background: var(--risk);
          color: #fff;
        }
      }

      &.chip-warning.is-active {
        background: color-mix(in oklab, var(--warning) 15%, var(--card));
        border-color: var(--warning);

        .chip-count {
          background: var(--warning);
          color: #fff;
        }
      }

      &.chip-success.is-active {
        background: color-mix(in oklab, #10b981 15%, var(--card));
        border-color: #10b981;

        .chip-count {
          background: #10b981;
          color: #fff;
        }
      }
    }

    .clear-scope-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      padding: 0 12px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px dashed var(--border);
      background: transparent;
      color: var(--muted-foreground);
      transition: all 0.15s ease;

      span { font-size: 15px; }

      &:hover {
        border-color: var(--operations);
        color: var(--operations);
        background: color-mix(in oklab, var(--operations) 8%, transparent);
      }
    }

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
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                    border-color 0.2s ease,
                    box-shadow 0.2s ease,
                    background 0.2s ease;

        &:hover {
          transform: translateY(-3px);
          border-color: color-mix(in oklab, var(--operations) 50%, var(--border)) !important;
          box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.35);
        }
      }

      [data-active-filter="ativas"] .prx-rich-stat-group__item:nth-child(1),
      [data-active-filter="concluidas"] .prx-rich-stat-group__item:nth-child(2),
      [data-active-filter="planejamento"] .prx-rich-stat-group__item:nth-child(3),
      [data-active-filter="omega"] .prx-rich-stat-group__item:nth-child(4) {
        border-color: var(--operations) !important;
        background: color-mix(in oklab, var(--operations) 12%, var(--card)) !important;
        box-shadow: 0 0 0 2px color-mix(in oklab, var(--operations) 50%, transparent),
                    0 8px 24px -6px rgba(0, 0, 0, 0.4) !important;
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
  protected readonly activeFilterId = signal<'all' | 'ativas' | 'concluidas' | 'planejamento' | 'omega'>('all');
  protected readonly activeCount = signal<number>(6);
  protected readonly completedCount = signal<number>(4);
  protected readonly plannedCount = signal<number>(10);
  protected readonly criticalCount = signal<number>(10);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};
    if (filterId === 'ativas') {
      filterCriteria = { status: 'EM_ANDAMENTO' };
    } else if (filterId === 'omega') {
      filterCriteria = { prioridade: 'CRITICA' };
    } else if (filterId === 'planejamento') {
      filterCriteria = { status: 'PLANEJADA' };
    } else if (filterId === 'concluidas') {
      filterCriteria = { status: 'CONCLUIDA' };
    }
    return {
      ...MISSOES_CRUD_METADATA,
      filterCriteria,
    };
  });

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

  protected onKpiSectionClicked(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const itemEl = target.closest('.prx-rich-stat-group__item') as HTMLElement | null;
    if (!itemEl) return;

    const items = Array.from(itemEl.parentElement?.children || []);
    const index = items.indexOf(itemEl);

    if (index === 0) {
      this.setFilter('ativas');
    } else if (index === 1) {
      this.setFilter('concluidas');
    } else if (index === 2) {
      this.setFilter('planejamento');
    } else if (index === 3) {
      this.setFilter('omega');
    }
  }

  protected setFilter(filterId: 'all' | 'ativas' | 'concluidas' | 'planejamento' | 'omega'): void {
    if (this.activeFilterId() === filterId) return;
    this.activeFilterId.set(filterId);
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getMissionTacticalKpis().subscribe((kpis) => {
      this.activeCount.set(kpis.activeMissions);
      this.completedCount.set(kpis.completedMissions);
      this.plannedCount.set(kpis.plannedMissions);
      this.criticalCount.set(kpis.criticalPriorityMissions);

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
      objetivo: raw.objetivo || raw.descricao || 'Operação tática autorizada pelo Comando Central.',
      descricao: raw.objetivo || raw.descricao,
      prioridade: raw.prioridade || 'MEDIA',
      status: raw.status || 'EM_ANDAMENTO',
      local: raw.local || raw.localizacao || 'Setor Global',
      localizacao: raw.local || raw.localizacao || 'Setor Global',
      ameacaId: raw.ameacaId,
      ameacaNome: raw.ameacaNome,
      inicioPrev: raw.inicioPrev,
      fimPrev: raw.fimPrev,
      inicioReal: raw.inicioReal,
      fimReal: raw.fimReal,
      dataInicioPrevista: raw.inicioPrev || raw.dataInicioPrevista,
      dataFimPrevista: raw.fimPrev || raw.dataFimPrevista,
    };
    this.selectedMission.set(mission);
  }
}
