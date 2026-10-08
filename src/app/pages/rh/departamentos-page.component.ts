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
  DEPARTAMENTOS_CRUD_METADATA,
  DEPARTAMENTOS_KPI_DOCUMENT,
} from './departamentos.config';

@Component({
  selector: 'app-departamentos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh">
            <span class="material-symbols-outlined">domain</span>
            Organização & Estrutura Tática
          </div>
          <h1 class="title-gradient page-title">Cargos & Departamentos</h1>
          <p class="page-subtitle">
            Estrutura hierárquica, divisões de pesquisa avançada, inteligência de campo e lideranças setoriais.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Scope Bar Canônico da Plataforma Praxis -->
      <praxis-scope-bar
        leadLabel="Estrutura"
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
          crudId="heroes-hq-departamentos-crud"
          [metadata]="activeCrudMetadata()"
        />
      </section>
    </div>
  `,
})
export class DepartamentosPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalDepartamentos = signal<number>(28);
  protected readonly totalCargos = signal<number>(15);

  protected readonly scopeBarItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todas as Divisões',
      icon: 'corporate_fare',
      filter: {},
      count: this.totalDepartamentos(),
      isDefault: true,
    },
    {
      id: 'liderancas',
      label: 'Lideranças Ativas',
      icon: 'military_tech',
      filter: {},
      badge: '96,4%',
      tone: 'ready',
    },
    {
      id: 'cargos',
      label: 'Funções Mapeadas',
      icon: 'account_tree',
      filter: {},
      count: this.totalCargos(),
      tone: 'info',
    },
  ]);

  protected readonly kpiDocument = signal<RichContentDocument>(DEPARTAMENTOS_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    return {
      ...DEPARTAMENTOS_CRUD_METADATA,
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

    this.setFilter('all');
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getDepartamentosTacticalKpis().subscribe((kpis) => {
      this.totalDepartamentos.set(kpis.totalDepartamentos);
      this.totalCargos.set(kpis.totalCargos);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'departamentos-kpi-grid',
            items: [
              {
                id: 'divisoes',
                label: 'Divisões Ativas',
                value: `${kpis.totalDepartamentos} Departamentos`,
                caption: 'Estrutura operacional e estratégica',
                icon: 'corporate_fare',
                tone: 'info',
              },
              {
                id: 'liderancas',
                label: 'Lideranças Nomeadas',
                value: `${kpis.leadershipCoverage}% Cobertura`,
                caption: 'Diretoria e supervisão tática',
                icon: 'military_tech',
                tone: 'success',
              },
              {
                id: 'cargos',
                label: 'Cargos Mapeados',
                value: `${kpis.totalCargos} Funções`,
                caption: 'Catálogo de carreiras ativas',
                icon: 'account_tree',
                tone: 'warning',
              },
              {
                id: 'senioridade',
                label: 'Níveis de Carreira',
                value: `${kpis.careerLevels} Níveis`,
                caption: 'Do Júnior ao Executivo/Diretor',
                icon: 'trending_up',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
