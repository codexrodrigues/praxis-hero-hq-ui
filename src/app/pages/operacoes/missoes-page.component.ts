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
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';
import {
  PraxisAnalyticalDrawerComponent,
  PraxisScopeBarComponent,
  type PraxisScopeBarItem,
} from '@praxisui/table';
import { MISSION_ANALYTICAL_DRAWER_CONFIG } from './mission-drawer.config';
import { MISSOES_CRUD_METADATA, MISSIONS_KPI_DOCUMENT } from './missoes.config';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';

@Component({
  selector: 'app-missoes-page',
  standalone: true,
  imports: [
    CommonModule,
    PraxisCrudComponent,
    PraxisRichContent,
    PraxisAnalyticalDrawerComponent,
    PraxisScopeBarComponent,
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

      <!-- Barra Tática de Filtro e Escopo de Missões (Canonical PraxisScopeBar) -->
      <praxis-scope-bar
        [items]="scopeItems()"
        [activeId]="activeFilterId()"
        leadLabel="Status da Operação:"
        leadIcon="filter_alt"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="onScopeChange($event)"
        (clear)="setFilter('all')"
      />

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-missoes-crud"
          [metadata]="activeCrudMetadata()"
          (rowClick)="onMissionRowClicked($event)"
        />
      </section>

      <!-- Mission Briefing Drawer (Canonical PraxisAnalyticalDrawer) -->
      <praxis-analytical-drawer
        [isOpen]="!!selectedMission()"
        [row]="selectedMission()"
        [drawerConfig]="missionDrawerConfig"
        (closeDrawer)="selectedMission.set(null)"
      />
    </div>
  `,
})
export class MissoesPageComponent implements OnInit, OnDestroy {
  protected readonly missionDrawerConfig = MISSION_ANALYTICAL_DRAWER_CONFIG;
  protected readonly activeFilterId = signal<'all' | 'ativas' | 'concluidas' | 'planejamento' | 'omega'>('all');
  protected readonly activeCount = signal<number>(6);
  protected readonly completedCount = signal<number>(4);
  protected readonly plannedCount = signal<number>(10);
  protected readonly omegaCount = signal<number>(10);
  protected readonly selectedMission = signal<Record<string, unknown> | null>(null);

  protected readonly scopeItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todas as Missões',
      count: this.activeCount() + this.completedCount() + this.plannedCount(),
      icon: 'military_tech',
      tone: 'default',
      isDefault: true,
    },
    {
      id: 'ativas',
      label: 'Em Andamento',
      count: this.activeCount(),
      icon: 'flight_takeoff',
      tone: 'info',
    },
    {
      id: 'concluidas',
      label: 'Concluídas com Êxito',
      count: this.completedCount(),
      icon: 'task_alt',
      tone: 'ready',
    },
    {
      id: 'planejamento',
      label: 'Em Planejamento',
      count: this.plannedCount(),
      icon: 'schedule',
      tone: 'warning',
    },
    {
      id: 'omega',
      label: 'Prioridade Ômega',
      count: this.omegaCount(),
      icon: 'crisis_alert',
      tone: 'danger',
    },
  ]);

  protected readonly kpiDocument = signal(MISSIONS_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'ativas') {
      filterCriteria = { status: 'EM_ANDAMENTO' };
    } else if (filterId === 'concluidas') {
      filterCriteria = { status: 'CONCLUIDA' };
    } else if (filterId === 'planejamento') {
      filterCriteria = { status: 'PLANEJADA' };
    } else if (filterId === 'omega') {
      filterCriteria = { prioridade: 'CRITICA' };
    }

    return {
      ...MISSOES_CRUD_METADATA,
      filterCriteria,
    };
  });

  private readonly dashboardStats = inject(DashboardStatsService);
  private kpiSub: Subscription | null = null;

  ngOnInit(): void {
    this.loadKpis();
  }

  ngOnDestroy(): void {
    this.kpiSub?.unsubscribe();
  }

  protected setFilter(filterId: 'all' | 'ativas' | 'concluidas' | 'planejamento' | 'omega'): void {
    this.activeFilterId.set(filterId);
  }

  protected onScopeChange(item: PraxisScopeBarItem): void {
    this.setFilter(item.id as 'all' | 'ativas' | 'concluidas' | 'planejamento' | 'omega');
  }

  protected onMissionRowClicked(event: unknown): void {
    const row =
      (event as { row?: Record<string, unknown>; data?: Record<string, unknown> })?.row ||
      (event as { row?: Record<string, unknown>; data?: Record<string, unknown> })?.data ||
      (event as Record<string, unknown>);
    if (row && (row['id'] != null || row['missaoId'] != null)) {
      this.selectedMission.set(row);
    }
  }

  protected onKpiSectionClicked(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const cardEl = target?.closest('.prx-rich-stat-group__item, .pdx-rich-stat-group__item, [data-stat-id]');
    if (!cardEl) return;

    const text = cardEl.textContent?.toLowerCase() ?? '';
    if (text.includes('ativas') || text.includes('incursões')) {
      this.setFilter('ativas');
    } else if (text.includes('êxito') || text.includes('sucesso')) {
      this.setFilter('concluidas');
    } else if (text.includes('planejamento') || text.includes('briefing')) {
      this.setFilter('planejamento');
    } else if (text.includes('ômega') || text.includes('crítica')) {
      this.setFilter('omega');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getMissionTacticalKpis().subscribe((kpis) => {
      this.activeCount.set(kpis.activeMissions);
      this.completedCount.set(kpis.completedMissions);
      this.plannedCount.set(kpis.plannedMissions);
      this.omegaCount.set(kpis.criticalPriorityMissions);

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
                value: `${kpis.successRate.toFixed(1).replace('.', ',')}%`,
                caption: `${kpis.completedMissions} missões concluídas com êxito`,
                icon: 'task_alt',
                tone: 'success',
              },
              {
                id: 'planejamento',
                label: 'Em Planejamento / Briefing',
                value: `${kpis.plannedMissions} Missões`,
                caption: 'Em preparação e briefing tático',
                icon: 'schedule',
                tone: 'warning',
              },
              {
                id: 'omega',
                label: 'Prioridade Ômega / Crítica',
                value: `${kpis.criticalPriorityMissions} Alertas`,
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
}
