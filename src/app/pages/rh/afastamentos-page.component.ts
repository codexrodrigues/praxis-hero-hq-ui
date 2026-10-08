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
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';
import {
  AFASTAMENTOS_CRUD_METADATA,
  AFASTAMENTOS_KPI_DOCUMENT,
} from './afastamentos.config';

@Component({
  selector: 'app-afastamentos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh">
            <span class="material-symbols-outlined">event_busy</span>
            Gestão de Pessoas & Disponibilidade
          </div>
          <h1 class="title-gradient page-title">Férias & Afastamentos Táticos</h1>
          <p class="page-subtitle">
            Controle de períodos de descanso regulamentar, licenças médicas de recuperação pós-combate e escalas de substituição.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Scope Bar Canônico da Plataforma Praxis -->
      <praxis-scope-bar
        leadLabel="Tipo de Afastamento"
        leadIcon="tune"
        [items]="scopeBarItems()"
        [activeId]="activeFilterId()"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="setFilter($event.id)"
        (clear)="setFilter('all')"
      />

      <!-- Tabela CRUD Governança Canônica -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-afastamentos-crud"
          [metadata]="activeCrudMetadata()"
        />
      </section>
    </div>
  `,
})
export class AfastamentosPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalRegistros = signal<number>(111);
  protected readonly criticalCases = signal<number>(51);
  protected readonly standardCases = signal<number>(60);
  protected readonly totalDays = signal<number>(1204);

  protected readonly scopeBarItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todos os Registros',
      icon: 'history',
      filter: {},
      count: this.totalRegistros(),
      isDefault: true,
    },
    {
      id: 'criticos',
      label: 'Médicas / Regeneração',
      icon: 'health_and_safety',
      filter: "tipo='LICENCA_MEDICA'",
      count: this.criticalCases(),
      tone: 'danger',
    },
    {
      id: 'padrao',
      label: 'Férias Regulamentares',
      icon: 'event_available',
      filter: "tipo='FERIAS'",
      count: this.standardCases(),
      tone: 'ready',
    },
  ]);

  protected readonly kpiDocument = signal<RichContentDocument>(AFASTAMENTOS_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'criticos') {
      filterCriteria = { tipo: 'LICENCA_MEDICA' };
    } else if (filterId === 'padrao') {
      filterCriteria = { tipo: 'FERIAS' };
    }

    return {
      ...AFASTAMENTOS_CRUD_METADATA,
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

  protected onKpiCardClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const cardEl = target?.closest('.prx-stat-group__item, [data-stat-id], .prx-rich-card');
    if (!cardEl) return;

    const text = cardEl.textContent?.toLowerCase() ?? '';
    if (text.includes('graves') || text.includes('críticos') || text.includes('regeneração')) {
      this.setFilter('criticos');
    } else if (text.includes('padrão') || text.includes('férias') || text.includes('descanso')) {
      this.setFilter('padrao');
    } else if (text.includes('total') || text.includes('registros')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getAfastamentosTacticalKpis().subscribe((kpis) => {
      this.totalRegistros.set(kpis.totalRecords);
      this.criticalCases.set(kpis.criticalCases);
      this.standardCases.set(kpis.standardLeaves);
      this.totalDays.set(kpis.totalDaysAway);

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
                value: `${kpis.totalRecords} Registros`,
                caption: 'Férias regulamentares e licenças',
                icon: 'history',
                tone: 'neutral',
              },
              {
                id: 'criticos',
                label: 'Casos Críticos / Graves',
                value: `${kpis.criticalCases} Ocorrências`,
                caption: 'Trauma de combate e regeneração',
                icon: 'health_and_safety',
                tone: 'danger',
              },
              {
                id: 'padrao',
                label: 'Licenças Padrão',
                value: `${kpis.standardLeaves} Registros`,
                caption: 'Descanso e suporte preventivo',
                icon: 'event_available',
                tone: 'info',
              },
              {
                id: 'dias',
                label: 'Dias em Recuperação',
                value: `${kpis.totalDaysAway} Dias`,
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
