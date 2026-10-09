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
import { INDICADORES_CRUD_METADATA } from './indicadores.config';

@Component({
  selector: 'app-indicadores-page',
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
            <span class="material-symbols-outlined">balance</span>
            Risco & Compensações Civis
          </div>
          <h1 class="title-gradient page-title">Indicadores de Risco & Indenizações</h1>
          <p class="page-subtitle">
            Auditoria financeira de acordos regulatórios, compensação patrimonial civil e passivo securitário de missões.
          </p>
        </div>
      </header>

      <!-- Barra Tática de Escopo e Filtros Rápidos (Canonical PraxisScopeBar) -->
      <praxis-scope-bar
        [items]="scopeItems"
        [activeId]="activeFilterId()"
        leadLabel="Status do Passivo:"
        leadIcon="tune"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="onScopeChange($event)"
        (clear)="setFilter('all')"
      />

      <!-- Metadata-Driven CRUD Runtime with native kpiBand integration -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-indicadores-crud"
          [metadata]="activeCrudMetadata()"
          (kpiCardClick)="onKpiCardClick($event)"
        />
      </section>
    </div>
  `,
})
export class IndicadoresPageComponent {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly scopeItems: PraxisScopeBarItem[] = [
    { id: 'all', label: 'Todos os Casos', count: 74, icon: 'account_balance', tone: 'default', isDefault: true, filter: {} },
    { id: 'critico', label: 'Passivo Crítico', count: 18, icon: 'warning', tone: 'danger', filter: { severidade: 'CRITICA' } },
    { id: 'pendente', label: 'Saldo em Aberto', count: 56, icon: 'pending', tone: 'warning', filter: { 'totalPendente >': 0 } },
    { id: 'homologado', label: '100% Homologado', count: 18, icon: 'verified', tone: 'success', filter: { totalPendente: 0 } },
  ];

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'critico') {
      filterCriteria = { severidade: 'CRITICA' };
    } else if (filterId === 'pendente') {
      filterCriteria = { 'totalPendente >': 0 };
    } else if (filterId === 'homologado') {
      filterCriteria = { totalPendente: 0 };
    }

    return {
      ...INDICADORES_CRUD_METADATA,
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
