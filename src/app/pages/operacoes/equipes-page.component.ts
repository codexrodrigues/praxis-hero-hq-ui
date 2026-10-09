import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import type { PraxisKpiBandCard } from '@praxisui/core';
import { EQUIPES_CRUD_METADATA } from './equipes.config';

@Component({
  selector: 'app-equipes-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisScopeBarComponent],
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

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Status Tático:"
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
          crudId="heroes-hq-equipes-crud"
          [metadata]="activeCrudMetadata()"
          (kpiCardClick)="onKpiCardClick($event)"
        />
      </section>
    </div>
  `,
})
export class EquipesPageComponent {
  protected readonly activeFilterId = signal<string>('all');

  protected readonly scopeItems: PraxisScopeBarItem[] = [
    {
      id: 'all',
      label: 'Todos os Esquadrões',
      count: 5,
      icon: 'diversity_3',
      tone: 'default',
      isDefault: true,
    },
    {
      id: 'ativas',
      label: 'Prontidão Máxima',
      count: 4,
      icon: 'verified_user',
      tone: 'ready',
    },
    {
      id: 'reserva',
      label: 'Reserva & Suporte',
      count: 1,
      icon: 'shield',
      tone: 'default',
    },
    {
      id: 'bases',
      label: 'Bases Interligadas',
      count: 5,
      icon: 'hub',
      tone: 'info',
    },
  ];

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'ativas') {
      filterCriteria = { status: 'ATIVA' };
    } else if (filterId === 'reserva') {
      filterCriteria = { status: 'STANDBY' };
    }

    return {
      ...EQUIPES_CRUD_METADATA,
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

