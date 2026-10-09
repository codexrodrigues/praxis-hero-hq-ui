import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import type { PraxisKpiBandCard } from '@praxisui/core';
import { VEICULOS_CRUD_METADATA } from './veiculos.config';

@Component({
  selector: 'app-veiculos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisScopeBarComponent],
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

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Disponibilidade:"
        leadIcon="tune"
        [items]="scopeItems"
        [activeId]="activeFilterId()"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="setFilter($event.id)"
        (clear)="setFilter('all')"
      />

      <!-- Metadata-Driven CRUD Runtime com Faixa Nativa de KPIs -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-veiculos-crud"
          [metadata]="activeCrudMetadata()"
          (kpiCardClick)="onKpiCardClick($event)"
        />
      </section>
    </div>
  `,
})
export class VeiculosPageComponent {
  protected readonly activeFilterId = signal<string>('all');

  protected readonly scopeItems: PraxisScopeBarItem[] = [
    {
      id: 'all',
      label: 'Toda a Frota',
      icon: 'rocket_launch',
      count: 8,
    },
    {
      id: 'operacional',
      label: 'Em Operação',
      icon: 'verified',
      tone: 'ready',
      count: 5,
    },
    {
      id: 'manutencao',
      label: 'Em Revisão',
      icon: 'build',
      tone: 'warning',
      count: 2,
    },
  ];

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

  protected setFilter(filterId: string): void {
    if (this.activeFilterId() === filterId) return;
    this.activeFilterId.set(filterId);
  }

  protected onKpiCardClick(event: { card: PraxisKpiBandCard }): void {
    if (event.card.id) {
      this.setFilter(event.card.id);
    }
  }
}

