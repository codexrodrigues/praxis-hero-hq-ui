import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import { PEDIDOS_CRUD_METADATA } from './pedidos.config';

@Component({
  selector: 'app-pedidos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-supplies">
            <span class="material-symbols-outlined">shopping_cart_checkout</span>
            Suprimentos & Logística Tática
          </div>
          <h1 class="title-gradient page-title">Pedidos de Compra & Reposição</h1>
          <p class="page-subtitle">
            Ordens de fornecimento de ligas de vibranium, propulsores quânticos, tecidos balísticos e insumos de laboratório.
          </p>
        </div>
      </header>

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Status da Ordem:"
        leadIcon="tune"
        [items]="scopeItems"
        [activeId]="activeFilterId()"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="setFilter($event.id)"
        (clear)="setFilter('all')"
      />

      <!-- Metadata-Driven CRUD Runtime com Customização Habilitada Nativamente -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-pedidos-crud"
          [metadata]="activeCrudMetadata()"
          [enableCustomization]="true"
          (kpiCardClick)="onKpiCardClick($event)"
        />
      </section>
    </div>
  `,
})
export class PedidosPageComponent {
  protected readonly activeFilterId = signal<string>('all');

  protected readonly scopeItems: PraxisScopeBarItem[] = [
    {
      id: 'all',
      label: 'Todas as Ordens',
      icon: 'local_shipping',
      count: 10,
      filter: {},
    },
    {
      id: 'aprovadas',
      label: 'Aprovadas / Entregues',
      icon: 'inventory',
      tone: 'ready',
      count: 5,
      filter: { status: 'APPROVED' },
    },
    {
      id: 'analise',
      label: 'Em Análise',
      icon: 'pending_actions',
      tone: 'warning',
      count: 3,
      filter: { status: 'DRAFT' },
    },
    {
      id: 'canceladas',
      label: 'Canceladas',
      icon: 'cancel',
      count: 2,
      filter: { status: 'CANCELLED' },
    },
  ];

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'aprovadas') {
      filterCriteria = { status: 'APPROVED' };
    } else if (filterId === 'analise') {
      filterCriteria = { status: 'DRAFT' };
    } else if (filterId === 'canceladas') {
      filterCriteria = { status: 'CANCELLED' };
    }

    return {
      ...PEDIDOS_CRUD_METADATA,
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
