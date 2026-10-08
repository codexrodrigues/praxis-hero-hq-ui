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
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import { VEICULOS_CRUD_METADATA, VEICULOS_KPI_DOCUMENT } from './veiculos.config';

@Component({
  selector: 'app-veiculos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-assets">
            <span class="material-symbols-outlined">rocket_launch</span>
            Patrimônio & Frota Operacional
          </div>
          <h1 class="title-gradient page-title">Frota Tática & Veículos</h1>
          <p class="page-subtitle">
            Gestão de Quinjets, aeronaves suborbitais, tanques blindados, hovercrafts e cápsulas de resgate tático.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Disponibilidade:"
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
          crudId="heroes-hq-veiculos-crud"
          [metadata]="activeCrudMetadata()"
        />
      </section>
    </div>
  `,
})
export class VeiculosPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalVeiculos = signal<number>(8);
  protected readonly operational = signal<number>(5);
  protected readonly maintenance = signal<number>(2);
  protected readonly readinessRate = signal<number>(62.5);

  protected readonly scopeItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Toda a Frota',
      icon: 'rocket_launch',
      count: this.totalVeiculos(),
    },
    {
      id: 'operacional',
      label: 'Em Operação',
      icon: 'verified',
      tone: 'ready',
      count: this.operational(),
    },
    {
      id: 'manutencao',
      label: 'Em Revisão',
      icon: 'build',
      tone: 'warning',
      count: this.maintenance(),
    },
  ]);

  protected readonly kpiDocument = signal<RichContentDocument>(VEICULOS_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'operacional') {
      filterCriteria = { status: 'OPERACIONAL' };
    } else if (filterId === 'manutencao') {
      filterCriteria = { status: 'MANUTENCAO' };
    }

    return {
      ...VEICULOS_CRUD_METADATA,
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
    if (text.includes('prontidão') || text.includes('disponíveis')) {
      this.setFilter('operacional');
    } else if (text.includes('revisão') || text.includes('manutenção')) {
      this.setFilter('manutencao');
    } else if (text.includes('frota') || text.includes('unidades')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getVeiculosTacticalKpis().subscribe((kpis) => {
      this.totalVeiculos.set(kpis.totalVeiculos);
      this.operational.set(kpis.operational);
      this.maintenance.set(kpis.maintenance);
      this.readinessRate.set(kpis.readinessRate);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'veiculos-kpi-grid',
            items: [
              {
                id: 'registradas',
                label: 'Unidades na Frota',
                value: `${kpis.totalVeiculos} Veículos`,
                caption: 'Aeronaves, hovercrafts e terrestres',
                icon: 'rocket_launch',
                tone: 'info',
              },
              {
                id: 'operacionais',
                label: 'Prontidão de Voo',
                value: `${kpis.operational} Disponíveis`,
                caption: 'Abastecidos e prontos para decolagem',
                icon: 'verified',
                tone: 'success',
              },
              {
                id: 'manutencao',
                label: 'Em Revisão / Hangar',
                value: `${kpis.maintenance} em Manutenção`,
                caption: 'Calibragem de propulsores iônicos',
                icon: 'build',
                tone: 'warning',
              },
              {
                id: 'eficiencia',
                label: 'Taxa Operacional',
                value: `${kpis.readinessRate}% Ativo`,
                caption: 'Capacidade de transporte de squads',
                icon: 'speed',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
