import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import { DEPARTAMENTOS_CRUD_METADATA } from './departamentos.config';

@Component({
  selector: 'app-departamentos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh">
            <span class="material-symbols-outlined">domain</span>
            Organização & Estrutura Tática
          </div>
          <h1 class="title-gradient page-title">Cargos & Departamentos</h1>
          <p class="page-subtitle">
            Estrutura hierárquica, divisões de pesquisa avançada, inteligência de campo e lideranças setoriais.
          </p>
        </div>
      </header>

      <!-- Scope Bar Canônico da Plataforma Praxis -->
      <praxis-scope-bar
        leadLabel="Estrutura"
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
          crudId="heroes-hq-departamentos-crud"
          [metadata]="activeCrudMetadata()"
          (kpiCardClick)="onKpiCardClick($event)"
        />
      </section>
    </div>
  `,
})
export class DepartamentosPageComponent {
  protected readonly activeFilterId = signal<string>('all');

  protected readonly scopeBarItems: PraxisScopeBarItem[] = [
    {
      id: 'all',
      label: 'Todas as Divisões',
      icon: 'corporate_fare',
      filter: {},
      count: 28,
      isDefault: true,
    },
    {
      id: 'liderancas',
      label: 'Lideranças Ativas',
      icon: 'military_tech',
      filter: {},
      count: 96,
      tooltip: '96,4% de prontidão',
      tone: 'ready',
    },
    {
      id: 'cargos',
      label: 'Funções Mapeadas',
      icon: 'account_tree',
      filter: {},
      count: 15,
      tone: 'info',
    },
  ];

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    return {
      ...DEPARTAMENTOS_CRUD_METADATA,
    };
  });

  protected setFilter(filterId: string): void {
    this.activeFilterId.set(filterId);
  }

  protected onKpiCardClick(event: { card: { id?: string; filter?: Record<string, unknown> } }): void {
    this.setFilter('all');
  }
}
