import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import { AFASTAMENTOS_CRUD_METADATA } from './afastamentos.config';

@Component({
  selector: 'app-afastamentos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisScopeBarComponent],
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

      <!-- Scope Bar Canônico da Plataforma Praxis -->
      <praxis-scope-bar
        leadLabel="Tipo de Afastamento"
        leadIcon="tune"
        [items]="scopeBarItems"
        [activeId]="activeFilterId()"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="setFilter($event.id)"
        (clear)="setFilter('all')"
      />

      <!-- Tabela CRUD Governança Canônica com kpiBand nativo -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-afastamentos-crud"
          [metadata]="activeCrudMetadata()"
          (kpiCardClick)="onKpiCardClick($event)"
        />
      </section>
    </div>
  `,
})
export class AfastamentosPageComponent {
  protected readonly activeFilterId = signal<string>('all');

  protected readonly scopeBarItems: PraxisScopeBarItem[] = [
    {
      id: 'all',
      label: 'Todos os Registros',
      icon: 'history',
      filter: {},
      count: 111,
      isDefault: true,
    },
    {
      id: 'criticos',
      label: 'Médicas / Regeneração',
      icon: 'health_and_safety',
      filter: { tipo: 'LICENCA_MEDICA' },
      count: 51,
      tone: 'danger',
    },
    {
      id: 'padrao',
      label: 'Férias Regulamentares',
      icon: 'event_available',
      filter: { tipo: 'FERIAS' },
      count: 60,
      tone: 'ready',
    },
  ];

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

  protected setFilter(filterId: string): void {
    this.activeFilterId.set(filterId);
  }

  protected onKpiCardClick(event: { card: { id?: string; filter?: Record<string, unknown> } }): void {
    const filter = event.card.filter;
    if (!filter || Object.keys(filter).length === 0) {
      this.setFilter('all');
      return;
    }

    const matched = this.scopeBarItems.find(
      (item) => JSON.stringify(item.filter) === JSON.stringify(filter)
    );
    if (matched) {
      this.setFilter(matched.id);
    }
  }
}
