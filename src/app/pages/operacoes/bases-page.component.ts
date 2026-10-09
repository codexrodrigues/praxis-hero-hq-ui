import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import {
  PraxisScopeBarComponent,
  type PraxisScopeBarItem,
} from '@praxisui/table';
import type { PraxisKpiBandCard } from '@praxisui/core';
import { BASES_CRUD_METADATA } from './bases.config';

@Component({
  selector: 'app-bases-page',
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
        <div class="header-intro">
          <div class="domain-tag tone-operations">
            <span class="material-symbols-outlined">hub</span>
            Instalações & Infraestrutura Tática
          </div>
          <h1 class="title-gradient page-title">Bases & Níveis de Acesso</h1>
          <p class="page-subtitle">
            Gerenciamento de complexos militares, hangares, silos subterrâneos e postos avançados de apoio logístico.
          </p>
        </div>
      </header>

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Escopo Tático:"
        leadIcon="tune"
        [items]="scopeItems"
        [activeId]="activeFilterId()"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="setFilter($event.id)"
        (clear)="setFilter('all')"
      />

      <!-- Tabela CRUD Governança Canônica com Faixa Nativa de KPIs -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-bases-crud"
          [metadata]="activeCrudMetadata()"
          (kpiCardClick)="onKpiCardClick($event)"
        />
      </section>
    </div>
  `,
})
export class BasesPageComponent {
  protected readonly activeFilterId = signal<string>('all');

  protected readonly scopeItems: PraxisScopeBarItem[] = [
    {
      id: 'all',
      label: 'Todas as Instalações',
      count: 7,
      icon: 'hub',
      tone: 'default',
      isDefault: true,
    },
    {
      id: 'sigilo',
      label: 'Segurança Máxima',
      count: 4,
      icon: 'security',
      tone: 'danger',
    },
    {
      id: 'terra',
      label: 'Bases Terrestres',
      count: 5,
      icon: 'public',
      tone: 'info',
    },
    {
      id: 'espaco',
      label: 'Complexos Orbitais',
      count: 2,
      icon: 'satellite_alt',
      tone: 'warning',
    },
  ];

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'sigilo') {
      filterCriteria = { sigilo: 'ULTRA_SECRETO' };
    } else if (filterId === 'terra') {
      filterCriteria = { planeta: 'Terra' };
    } else if (filterId === 'espaco') {
      filterCriteria = { tipo: 'ORBITAL' };
    }

    return {
      ...BASES_CRUD_METADATA,
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

