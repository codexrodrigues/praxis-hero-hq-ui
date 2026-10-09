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
import { AMEACAS_CRUD_METADATA } from './ameacas.config';

@Component({
  selector: 'app-ameacas-page',
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
          <div class="domain-tag tone-risk">
            <span class="material-symbols-outlined">radar</span>
            Risco & Inteligência Tática
          </div>
          <h1 class="title-gradient page-title">Ameaças Táticas & Alvos Globais</h1>
          <p class="page-subtitle">
            Catalogação de vilões, supervilões e dissidentes intergalácticos com índices de perigo e status de contenção.
          </p>
        </div>
      </header>

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Radar Tático:"
        leadIcon="tune"
        [items]="scopeItems"
        [activeId]="activeFilterId()"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="setFilter($event.id)"
        (clear)="setFilter('all')"
      />

      <!-- Metadata-Driven CRUD Runtime with native kpiBand integration -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-ameacas-crud"
          [metadata]="activeCrudMetadata()"
          (kpiCardClick)="onKpiCardClick($event)"
        />
      </section>
    </div>
  `,
})
export class AmeacasPageComponent {
  protected readonly activeFilterId = signal<string>('all');

  protected readonly scopeItems: PraxisScopeBarItem[] = [
    {
      id: 'all',
      label: 'Todos os Alvos',
      icon: 'radar',
      count: 16,
      filter: {},
    },
    {
      id: 'confronto',
      label: 'Em Confronto',
      icon: 'crisis_alert',
      tone: 'warning',
      count: 6,
      filter: { status: 'CONFRONTO' },
    },
    {
      id: 'observacao',
      label: 'Em Observação',
      icon: 'visibility',
      count: 3,
      filter: { status: 'OBSERVACAO' },
    },
    {
      id: 'contidos',
      label: 'Contidos / Raft',
      icon: 'lock',
      tone: 'ready',
      count: 3,
      filter: { status: 'CONTIDO' },
    },
  ];

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'confronto') {
      filterCriteria = { status: 'CONFRONTO' };
    } else if (filterId === 'contidos') {
      filterCriteria = { status: 'CONTIDO' };
    } else if (filterId === 'observacao') {
      filterCriteria = { status: 'OBSERVACAO' };
    } else if (filterId === 'critico') {
      filterCriteria = { nivel: 5 };
    }

    return {
      ...AMEACAS_CRUD_METADATA,
      filterCriteria,
    };
  });

  protected setFilter(filterId: string): void {
    this.activeFilterId.set(filterId);
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
    } else if (filter['nivel'] === 5) {
      this.setFilter('critico');
    }
  }
}
