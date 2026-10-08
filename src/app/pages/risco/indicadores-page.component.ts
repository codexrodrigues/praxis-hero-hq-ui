import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';
import {
  PraxisAnalyticalDrawerComponent,
  PraxisScopeBarComponent,
  type PraxisScopeBarItem,
} from '@praxisui/table';
import { INCIDENT_ANALYTICAL_DRAWER_CONFIG } from '../operacoes/incident-drawer.config';
import { INDICADORES_CRUD_METADATA, INDICADORES_KPI_DOCUMENT } from './indicadores.config';

@Component({
  selector: 'app-indicadores-page',
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

      <!-- Barra Tática de Escopo e Filtros Rápidos (Canonical PraxisScopeBar) -->
      <praxis-scope-bar
        [items]="scopeItems"
        [activeId]="activeFilterId()"
        leadLabel="Status do Passivo:"
        leadIcon="tune"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="onScopeChange($event)"
        (clear)="setFilter('all')"
      />

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-indicadores-crud"
          [metadata]="activeCrudMetadata()"
          (rowClick)="onIncidentRowClicked($event)"
        />
      </section>

      <!-- Tactical Incident Investigation Drawer (Canonical PraxisAnalyticalDrawer) -->
      <praxis-analytical-drawer
        [isOpen]="!!selectedIncident()"
        [row]="selectedIncident()"
        [drawerConfig]="incidentDrawerConfig"
        (closeDrawer)="selectedIncident.set(null)"
      />
    </div>
  `,
})
export class IndicadoresPageComponent implements OnInit, OnDestroy {
  protected readonly incidentDrawerConfig = INCIDENT_ANALYTICAL_DRAWER_CONFIG;
  protected readonly selectedIncident = signal<Record<string, unknown> | null>(null);
  protected readonly activeFilterId = signal<string>('all');
  protected readonly scopeItems: PraxisScopeBarItem[] = [
    { id: 'all', label: 'Todos os Casos', count: 74, icon: 'account_balance', tone: 'default', isDefault: true },
    { id: 'critico', label: 'Passivo Crítico', count: 18, icon: 'warning', tone: 'danger', filter: { severidade: 'CRITICA' } },
    { id: 'pendente', label: 'Saldo em Aberto', count: 56, icon: 'pending', tone: 'warning' },
    { id: 'homologado', label: '100% Homologado', count: 18, icon: 'verified', tone: 'success' },
  ];

  protected readonly kpiDocument = signal<RichContentDocument>(INDICADORES_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'critico') {
      filterCriteria = { severidade: 'CRITICA' };
    } else if (filterId === 'pendente') {
      filterCriteria = { 'totalPendente >': 0 };
    } else if (filterId === 'homologado') {
      filterCriteria = { totalPendente: 0 };
    }

    return {
      ...INDICADORES_CRUD_METADATA,
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

  protected setFilter(filterId: string): void {
    this.activeFilterId.set(filterId);
  }

  protected onScopeChange(item: PraxisScopeBarItem): void {
    this.setFilter(item.id);
  }

  protected onIncidentRowClicked(event: unknown): void {
    const row =
      (event as { row?: any; data?: any })?.row ||
      (event as { row?: any; data?: any })?.data ||
      (event as any);

    if (row) {
      this.selectedIncident.set({
        ...row,
        id: Number(row.incidenteId ?? row.id ?? 1),
      });
    }
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
