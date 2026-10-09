import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import { CONTRATOS_CRUD_METADATA } from './contratos.config';

@Component({
  selector: 'app-contratos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-supplies">
            <span class="material-symbols-outlined">contract</span>
            Suprimentos & Aquisições Estratégicas
          </div>
          <h1 class="title-gradient page-title">Fornecedores & Contratos</h1>
          <p class="page-subtitle">
            Gestão de parceiros industriais, acordos de nível de serviço, peças de reposição e contratos corporativos.
          </p>
        </div>
      </header>

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Escopo Contratual:"
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
          crudId="heroes-hq-contratos-crud"
          [metadata]="activeCrudMetadata()"
          (kpiCardClick)="onKpiCardClick($event)"
        />
      </section>
    </div>
  `,
})
export class ContratosPageComponent {
  protected readonly activeFilterId = signal<string>('all');

  protected readonly scopeItems: PraxisScopeBarItem[] = [
    {
      id: 'all',
      label: 'Todos os Acordos',
      icon: 'description',
      count: 17,
      filter: {},
    },
    {
      id: 'vigentes',
      label: 'Vigentes & Assinados',
      icon: 'verified',
      tone: 'ready',
      count: 11,
      filter: { status: 'ACTIVE' },
    },
    {
      id: 'expirados',
      label: 'Expirados',
      icon: 'event_busy',
      tone: 'warning',
      count: 3,
      filter: { status: 'EXPIRED' },
    },
    {
      id: 'draft',
      label: 'Em Minuta / Draft',
      icon: 'edit_note',
      tone: 'info',
      count: 1,
      filter: { status: 'DRAFT' },
    },
  ];

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'vigentes') {
      filterCriteria = { status: 'ACTIVE' };
    } else if (filterId === 'expirados') {
      filterCriteria = { status: 'EXPIRED' };
    } else if (filterId === 'draft') {
      filterCriteria = { status: 'DRAFT' };
    }

    return {
      ...CONTRATOS_CRUD_METADATA,
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
    }
  }
}
