import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import type { PraxisKpiBandCard } from '@praxisui/core';
import { EQUIPAMENTOS_CRUD_METADATA } from './equipamentos.config';

@Component({
  selector: 'app-equipamentos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-assets">
            <span class="material-symbols-outlined">inventory_2</span>
            Ativos Operacionais & Armaria
          </div>
          <h1 class="title-gradient page-title">Equipamentos & Trajes</h1>
          <p class="page-subtitle">
            Inventário de armaduras, armas táticas, comunicadores quânticos e controle de custódia patrimonial.
          </p>
        </div>
      </header>

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Status de Custódia:"
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
          crudId="heroes-hq-equipamentos-crud"
          [metadata]="activeCrudMetadata()"
          (kpiCardClick)="onKpiCardClick($event)"
        />
      </section>
    </div>
  `,
})
export class EquipamentosPageComponent {
  protected readonly activeFilterId = signal<string>('all');

  protected readonly scopeItems: PraxisScopeBarItem[] = [
    {
      id: 'all',
      label: 'Todos os Itens',
      icon: 'inventory_2',
      count: 62,
    },
    {
      id: 'custodia',
      label: 'Em Custódia / Ativo',
      icon: 'verified_user',
      tone: 'ready',
      count: 56,
    },
    {
      id: 'manutencao',
      label: 'Em Manutenção',
      icon: 'build',
      tone: 'warning',
      count: 2,
    },
    {
      id: 'estoque',
      label: 'Reserva no Arsenal',
      icon: 'shelves',
      tone: 'default',
      count: 4,
    },
  ];

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};
    if (filterId === 'custodia') {
      filterCriteria = { status: 'EM_USO' };
    } else if (filterId === 'manutencao') {
      filterCriteria = { status: 'MANUTENCAO' };
    } else if (filterId === 'estoque') {
      filterCriteria = { status: 'DISPONIVEL' };
    }
    return {
      ...EQUIPAMENTOS_CRUD_METADATA,
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

