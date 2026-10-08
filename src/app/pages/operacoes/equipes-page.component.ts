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
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import { EQUIPES_CRUD_METADATA, EQUIPES_KPI_DOCUMENT } from './equipes.config';

@Component({
  selector: 'app-equipes-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-operations">
            <span class="material-symbols-outlined">diversity_3</span>
            Operações & Esquadrões Especiais
          </div>
          <h1 class="title-gradient page-title">Equipes & Esquadrões Táticos</h1>
          <p class="page-subtitle">
            Estrutura organizacional das forças-tarefa, alocação de heróis, bases de comando e prontidão de resposta.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Status Tático:"
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
          crudId="heroes-hq-equipes-crud"
          [metadata]="activeCrudMetadata()"
        />
      </section>
    </div>
  `,
})
export class EquipesPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalCount = signal<number>(5);
  protected readonly activeCount = signal<number>(4);
  protected readonly reserveCount = signal<number>(1);
  protected readonly linkedBasesCount = signal<number>(5);

  protected readonly scopeItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todos os Esquadrões',
      count: this.totalCount(),
      icon: 'diversity_3',
      tone: 'default',
      isDefault: true,
    },
    {
      id: 'ativa',
      label: 'Prontidão Máxima',
      count: this.activeCount(),
      icon: 'verified_user',
      tone: 'ready',
    },
    {
      id: 'reserva',
      label: 'Reserva & Suporte',
      count: this.reserveCount(),
      icon: 'shield',
      tone: 'default',
    },
    {
      id: 'bases',
      label: 'Bases Interligadas',
      count: this.linkedBasesCount(),
      icon: 'hub',
      tone: 'info',
    },
  ]);

  protected readonly kpiDocument = signal(EQUIPES_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'ativa') {
      filterCriteria = { status: 'ATIVA' };
    } else if (filterId === 'reserva') {
      filterCriteria = { status: 'RESERVA' };
    }

    return {
      ...EQUIPES_CRUD_METADATA,
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
    if (text.includes('máxima') || text.includes('ativas') || text.includes('prontidão')) {
      this.setFilter('ativa');
    } else if (text.includes('reserva') || text.includes('suporte')) {
      this.setFilter('reserva');
    } else if (text.includes('esquadrões') || text.includes('registrados')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getEquipesTacticalKpis().subscribe((kpis) => {
      this.totalCount.set(kpis.totalEquipes);
      this.activeCount.set(kpis.activeEquipes);
      this.reserveCount.set(kpis.reserveEquipes);
      this.linkedBasesCount.set(kpis.linkedBases);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'equipes-kpi-grid',
            items: [
              {
                id: 'equipes',
                label: 'Esquadrões Registrados',
                value: `${kpis.totalEquipes} Equipes`,
                caption: 'Compostas por heróis de ponta',
                icon: 'diversity_3',
                tone: 'info',
              },
              {
                id: 'ativas',
                label: 'Prontidão Máxima',
                value: `${kpis.activeEquipes} Ativas`,
                caption: 'Mobilizáveis para resposta imediata',
                icon: 'verified_user',
                tone: 'success',
              },
              {
                id: 'reserva',
                label: 'Reserva & Suporte',
                value: `${kpis.reserveEquipes} em Treinamento`,
                caption: 'Squad em ciclo de integração',
                icon: 'shield',
                tone: 'neutral',
              },
              {
                id: 'bases',
                label: 'Bases Interligadas',
                value: `${kpis.linkedBases} Complexos`,
                caption: 'Presença e ancoragem tática',
                icon: 'hub',
                tone: 'info',
              },
            ],
          },
        ],
      });
    });
  }
}
