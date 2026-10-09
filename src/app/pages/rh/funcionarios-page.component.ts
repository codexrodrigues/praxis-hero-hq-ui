import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  ViewChild,
} from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import {
  PraxisScopeBarComponent,
  type PraxisScopeBarItem,
} from '@praxisui/table';
import {
  HEROES_CRUD_METADATA,
  SAMPLE_HERO,
} from './funcionarios.config';

@Component({
  selector: 'app-funcionarios-page',
  standalone: true,
  imports: [
    CommonModule,
    PraxisCrudComponent,
    PraxisScopeBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <!-- Tactical Feedback Banner -->
      @if (notice()) {
        <div class="tactical-notice glass-panel">
          <span class="material-symbols-outlined">info</span>
          <span>{{ notice() }}</span>
        </div>
      }

      <!-- Section Header -->
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh">
            <span class="material-symbols-outlined">shield</span>
            Pessoas & Recursos Humanos
          </div>
          <h1 class="title-gradient page-title">Heróis & Colaboradores</h1>
          <p class="page-subtitle">
            Gestão unificada do quadro operacional e identidades civis governada por metadados da Plataforma Praxis.
          </p>
        </div>

        <div class="header-actions">
          <button class="dossier-trigger-btn primary-gradient" (click)="openSampleDossier()">
            <span class="material-symbols-outlined">badge</span>
            Abrir Dossiê 360° (Exemplo)
          </button>
        </div>
      </header>

      <!-- Barra Tática Canônica Governada (PraxisScopeBar - Issue #12) -->
      <praxis-scope-bar
        #scopeBar
        [items]="scopeBarItems"
        [activeId]="activeFilterId()"
        (activeIdChange)="onScopeIdChanged($event)"
        (scopeChange)="onScopeItemChanged($event)"
        (searchChange)="onOmniboxSearch($event)"
        [target]="heroesCrud"
      />

      <!-- Canonical Metadata-Driven CRUD Runtime with native kpiBand integration -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          #heroesCrud
          crudId="heroes-hq-funcionarios-crud"
          [metadata]="activeCrudMetadata()"
          (kpiCardClick)="onKpiCardClick($event)"
        />
      </section>
    </div>
  `,
})
export class FuncionariosPageComponent {
  protected readonly activeFilterId = signal<'all' | 'ativos' | 'inativos'>('all');

  protected readonly scopeBarItems: PraxisScopeBarItem[] = [
    {
      id: 'all',
      label: 'Todos os Heróis',
      icon: 'group',
      filter: {},
      count: 24,
      isDefault: true,
    },
    {
      id: 'ativos',
      label: 'Em Prontidão Ativa',
      icon: 'verified_user',
      filter: 'ativo=true',
      count: 21,
      tone: 'ready',
    },
    {
      id: 'inativos',
      label: 'Em Reserva / Licença',
      icon: 'person_off',
      filter: 'ativo=false',
      count: 3,
      tone: 'warning',
    },
  ];

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};
    if (filterId === 'ativos') {
      filterCriteria = { ativo: true };
    } else if (filterId === 'inativos') {
      filterCriteria = { ativo: false };
    }
    return {
      ...HEROES_CRUD_METADATA,
      filterCriteria,
    };
  });

  @ViewChild('heroesCrud') heroesCrud?: PraxisCrudComponent;
  protected readonly notice = signal<string | null>(null);

  protected setFilter(filterId: 'all' | 'ativos' | 'inativos'): void {
    if (this.activeFilterId() === filterId) return;
    this.activeFilterId.set(filterId);

    const messages: Record<string, string> = {
      all: 'Filtro redefinido: Exibindo todo o efetivo de heróis e colaboradores.',
      ativos: 'Filtro tático ativado: Exibindo somente colaboradores em Prontidão Ativa.',
      inativos: 'Filtro tático ativado: Exibindo somente colaboradores em Reserva ou Licença.',
    };
    this.showNotice(messages[filterId]);
  }

  protected onScopeIdChanged(id: string): void {
    if (id === 'all' || id === 'ativos' || id === 'inativos') {
      this.setFilter(id);
    }
  }

  protected onScopeItemChanged(item: PraxisScopeBarItem): void {
    if (item.id === 'all' || item.id === 'ativos' || item.id === 'inativos') {
      this.setFilter(item.id);
    }
  }

  protected onOmniboxSearch(query: string): void {
    if (query) {
      this.showNotice(`Busca rápida: filtrando registros contendo "${query}"...`);
    }
  }

  protected onKpiCardClick(event: { card: { id?: string; filter?: Record<string, unknown> } }): void {
    const filter = event.card.filter;
    if (!filter || Object.keys(filter).length === 0) {
      this.setFilter('all');
      return;
    }

    if (filter['ativo'] === true) {
      this.setFilter('ativos');
    } else if (filter['ativo'] === false) {
      this.setFilter('inativos');
    }
  }

  protected openSampleDossier(): void {
    this.heroesCrud?.openAnalyticalDrawer(SAMPLE_HERO);
  }

  private showNotice(msg: string): void {
    this.notice.set(msg);
    setTimeout(() => {
      if (this.notice() === msg) {
        this.notice.set(null);
      }
    }, 3500);
  }
}
