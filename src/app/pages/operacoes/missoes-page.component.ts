import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import {
  PraxisScopeBarComponent,
  type PraxisScopeBarItem,
} from '@praxisui/table';
import { MISSOES_CRUD_METADATA } from './missoes.config';

@Component({
  selector: 'app-missoes-page',
  standalone: true,
  imports: [
    CommonModule,
    PraxisCrudComponent,
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

      <!-- Barra Tática de Filtro e Escopo de Missões (Canonical PraxisScopeBar) -->
      <praxis-scope-bar
        [items]="scopeItems"
        [activeId]="activeFilterId()"
        leadLabel="Status da Operação:"
        leadIcon="filter_alt"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="onScopeChange($event)"
        (clear)="setFilter('all')"
      />

      <!-- Metadata-Driven CRUD Runtime with native kpiBand integration -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-missoes-crud"
          [metadata]="activeCrudMetadata()"
          (kpiCardClick)="onKpiCardClick($event)"
        />
      </section>
    </div>
  `,
})
export class MissoesPageComponent {
  protected readonly activeFilterId = signal<string>('all');

  protected readonly scopeItems: PraxisScopeBarItem[] = [
    {
      id: 'all',
      label: 'Todas as Missões',
      count: 20,
      icon: 'military_tech',
      tone: 'default',
      isDefault: true,
    },
    {
      id: 'ativas',
      label: 'Em Andamento',
      count: 6,
      icon: 'flight_takeoff',
      tone: 'info',
      filter: { status: 'EM_ANDAMENTO' },
    },
    {
      id: 'concluidas',
      label: 'Concluídas com Êxito',
      count: 4,
      icon: 'task_alt',
      tone: 'ready',
      filter: { status: 'CONCLUIDA' },
    },
    {
      id: 'planejamento',
      label: 'Em Planejamento',
      count: 10,
      icon: 'schedule',
      tone: 'warning',
      filter: { status: 'PLANEJADA' },
    },
    {
      id: 'omega',
      label: 'Prioridade Ômega',
      count: 10,
      icon: 'crisis_alert',
      tone: 'danger',
      filter: { prioridade: 'CRITICA' },
    },
  ];

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

  protected setFilter(filterId: string): void {
    this.activeFilterId.set(filterId);
  }

  protected onScopeChange(item: PraxisScopeBarItem): void {
    this.setFilter(item.id);
  }

  protected onKpiCardClick(event: { card: { id?: string; filter?: Record<string, unknown> } }): void {
    const filter = event.card.filter;
    if (!filter || Object.keys(filter).length === 0) {
      this.setFilter('all');
      return;
    }

    const matched = this.scopeItems.find(
      (item) => JSON.stringify(item.filter) === JSON.stringify(filter)
    );
    if (matched) {
      this.setFilter(matched.id);
    }
  }
}
