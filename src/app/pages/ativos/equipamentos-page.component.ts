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
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import { EQUIPAMENTOS_CRUD_METADATA, EQUIPAMENTOS_KPI_DOCUMENT } from './equipamentos.config';

@Component({
  selector: 'app-equipamentos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-assets">
            <span class="material-symbols-outlined">inventory_2</span>
            Ativos Operacionais & Armaria
          </div>
          <h1 class="title-gradient page-title">Equipamentos & Trajes</h1>
          <p class="page-subtitle">
            Inventário de armaduras, armas táticas, comunicadores quânticos e controle de custódia patrimonial.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid com Interatividade de Filtro -->
      <section
        class="kpi-surface"
        (click)="onKpiSectionClicked($event)"
        [attr.data-active-filter]="activeFilterId()"
        title="Clique em um indicador para filtrar o inventário abaixo"
      >
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Status de Custódia:"
        leadIcon="tune"
        [items]="scopeItems()"
        [activeId]="activeFilterId()"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="setFilter($event.id)"
        (clear)="setFilter('all')"
      />

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-equipamentos-crud"
          [metadata]="activeCrudMetadata()"
        />
      </section>
    </div>
  `,
})
export class EquipamentosPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalCount = signal<number>(62);
  protected readonly inUseCount = signal<number>(56);
  protected readonly maintenanceCount = signal<number>(2);
  protected readonly stockCount = signal<number>(4);

  protected readonly scopeItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todos os Itens',
      icon: 'inventory_2',
      count: this.totalCount(),
    },
    {
      id: 'custodia',
      label: 'Em Custódia / Ativo',
      icon: 'verified_user',
      tone: 'ready',
      count: this.inUseCount(),
    },
    {
      id: 'manutencao',
      label: 'Em Manutenção',
      icon: 'build',
      tone: 'warning',
      count: this.maintenanceCount(),
    },
    {
      id: 'estoque',
      label: 'Reserva no Arsenal',
      icon: 'shelves',
      tone: 'default',
      count: this.stockCount(),
    },
  ]);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};
    if (filterId === 'custodia') {
      filterCriteria = { status: 'EM_USO' };
    } else if (filterId === 'manutencao') {
      filterCriteria = { status: 'MANUTENCAO' };
    } else if (filterId === 'estoque') {
      filterCriteria = { status: 'DISPONIVEL' };
    }
    return {
      ...EQUIPAMENTOS_CRUD_METADATA,
      filterCriteria,
    };
  });

  protected readonly kpiDocument = signal<RichContentDocument>(EQUIPAMENTOS_KPI_DOCUMENT);

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
      this.setFilter('all');
    } else if (index === 1) {
      this.setFilter('custodia');
    } else if (index === 2) {
      this.setFilter('manutencao');
    } else if (index === 3) {
      this.setFilter('estoque');
    }
  }

  protected setFilter(filterId: string): void {
    if (this.activeFilterId() === filterId) return;
    this.activeFilterId.set(filterId);
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getEquipamentosTacticalKpis().subscribe((kpis) => {
      this.totalCount.set(kpis.totalEquipamentos);
      this.inUseCount.set(kpis.inUse);
      this.maintenanceCount.set(kpis.inMaintenance);
      this.stockCount.set(kpis.inStock);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'equipamentos-kpi-grid',
            items: [
              {
                id: 'total',
                label: 'Total de Itens Táticos',
                value: `${kpis.totalEquipamentos} Ativos`,
                caption: 'Trajes, armas e exoesqueletos',
                icon: 'shield',
                tone: 'info',
              },
              {
                id: 'custodia',
                label: 'Em Custódia / Uso Ativo',
                value: `${kpis.inUse} Itens`,
                caption: 'Alocados a heróis em missão',
                icon: 'verified_user',
                tone: 'success',
              },
              {
                id: 'manutencao',
                label: 'Em Manutenção',
                value: `${kpis.inMaintenance} Itens`,
                caption: 'Recarga de reator e nanotecnologia',
                icon: 'build',
                tone: 'warning',
              },
              {
                id: 'estoque',
                label: 'Em Reserva de Arsenal',
                value: `${kpis.inStock} Itens`,
                caption: 'Disponíveis no cofre central',
                icon: 'inventory_2',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
