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
import { INCIDENTES_CRUD_METADATA } from './incidentes.config';

@Component({
  selector: 'app-incidentes-page',
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
            <span class="material-symbols-outlined">crisis_alert</span>
            Operações & Gestão de Crise
          </div>
          <h1 class="title-gradient page-title">Incidentes Táticos & Danos Civis</h1>
          <p class="page-subtitle">
            Relatórios de impacto colateral, controle de contenção e compensações estruturais em teatro de confronto.
          </p>
        </div>
      </header>

      <!-- Barra Tática de Escopo e Filtros Rápidos (Canonical PraxisScopeBar) -->
      <praxis-scope-bar
        [items]="scopeItems"
        [activeId]="activeFilterId()"
        leadLabel="Severidade:"
        leadIcon="crisis_alert"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="onScopeChange($event)"
        (clear)="setFilter('all')"
      />

      <!-- Metadata-Driven CRUD Runtime with native kpiBand integration -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-incidentes-crud"
          [metadata]="activeCrudMetadata()"
          (kpiCardClick)="onKpiCardClick($event)"
        />
      </section>
    </div>
  `,
})
export class IncidentesPageComponent {
  protected readonly activeFilterId = signal<string>('all');

  protected readonly scopeItems: PraxisScopeBarItem[] = [
    { id: 'all', label: 'Todas as Ocorrências', count: 74, icon: 'report', tone: 'default', isDefault: true },
    { id: 'critico', label: 'Severidade Crítica', count: 18, icon: 'warning', tone: 'danger', filter: { severidade: 'CRITICA' } },
    { id: 'alta', label: 'Alta Severidade', count: 14, icon: 'crisis_alert', tone: 'warning', filter: { severidade: 'ALTA' } },
    { id: 'media', label: 'Moderados', count: 42, icon: 'info', tone: 'info', filter: { severidade: 'MEDIA' } },
  ];

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'critico') {
      filterCriteria = { severidade: 'CRITICA' };
    } else if (filterId === 'alta') {
      filterCriteria = { severidade: 'ALTA' };
    } else if (filterId === 'media') {
      filterCriteria = { severidade: 'MEDIA' };
    }

    return {
      ...INCIDENTES_CRUD_METADATA,
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
