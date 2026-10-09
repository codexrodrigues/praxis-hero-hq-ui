import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import { FOLHA_PAGAMENTO_CRUD_METADATA } from './folha-pagamento.config';

@Component({
  selector: 'app-folha-pagamento-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh">
            <span class="material-symbols-outlined">account_balance_wallet</span>
            Compensação, Benefícios & Folha
          </div>
          <h1 class="title-gradient page-title">Folha de Pagamento & Retenções</h1>
          <p class="page-subtitle">
            Demonstrativos de remuneração de heróis, estipêndios táticos, encargos previdenciários e consolidação fiscal.
          </p>
        </div>
      </header>

      <!-- Scope Bar Canônico da Plataforma Praxis -->
      <praxis-scope-bar
        leadLabel="Exercício"
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
          crudId="heroes-hq-folha-crud"
          [metadata]="activeCrudMetadata()"
          (kpiCardClick)="onKpiCardClick($event)"
        />
      </section>
    </div>
  `,
})
export class FolhaPagamentoPageComponent {
  protected readonly activeFilterId = signal<string>('all');

  protected readonly scopeBarItems: PraxisScopeBarItem[] = [
    {
      id: 'all',
      label: 'Todos os Ciclos',
      icon: 'receipt_long',
      filter: {},
      count: 3246,
      isDefault: true,
    },
    {
      id: 'vigente',
      label: 'Competência Vigente (03/2026)',
      icon: 'today',
      filter: { mes: 3, ano: 2026 },
      count: 101,
      tone: 'ready',
    },
    {
      id: 'ano2026',
      label: 'Ano 2026',
      icon: 'calendar_month',
      filter: { ano: 2026 },
      count: 303,
      tone: 'info',
    },
  ];

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'vigente') {
      filterCriteria = { mes: 3, ano: 2026 };
    } else if (filterId === 'ano2026') {
      filterCriteria = { ano: 2026 };
    }

    return {
      ...FOLHA_PAGAMENTO_CRUD_METADATA,
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
