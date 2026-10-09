import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  OnDestroy,
  OnInit,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { type RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import {
  PraxisScopeBarComponent,
  type PraxisScopeBarItem,
} from '@praxisui/table';
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';
import {
  HEROES_CRUD_METADATA,
  HEROES_KPI_DOCUMENT,
  SAMPLE_HERO,
} from './funcionarios.config';

@Component({
  selector: 'app-funcionarios-page',
  standalone: true,
  imports: [
    CommonModule,
    PraxisCrudComponent,
    PraxisRichContent,
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

      <!-- KPI Bento Grid Declarativo (praxis-rich-content) com Interatividade de Filtro -->
      <section
        class="kpi-surface"
        (click)="onKpiSectionClicked($event)"
        [attr.data-active-filter]="activeFilterId()"
        title="Clique em um indicador para filtrar a tabela operacional abaixo"
      >
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Tática Canônica Governada (PraxisScopeBar - Issue #12) -->
      <praxis-scope-bar
        #scopeBar
        [items]="scopeBarItems()"
        [activeId]="activeFilterId()"
        (activeIdChange)="onScopeIdChanged($event)"
        (scopeChange)="onScopeItemChanged($event)"
        (searchChange)="onOmniboxSearch($event)"
        [target]="heroesCrud"
      />

      <!-- Canonical Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          #heroesCrud
          crudId="heroes-hq-funcionarios-crud"
          [metadata]="activeCrudMetadata()"
        />
      </section>
    </div>
  `,
})
export class FuncionariosPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<'all' | 'ativos' | 'inativos'>('all');
  protected readonly totalCount = signal<number>(24);
  protected readonly activeCount = signal<number>(21);
  protected readonly inactiveCount = signal<number>(3);

  protected readonly scopeBarItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todos os Heróis',
      icon: 'group',
      filter: {},
      count: this.totalCount(),
      isDefault: true,
    },
    {
      id: 'ativos',
      label: 'Em Prontidão Ativa',
      icon: 'verified_user',
      filter: 'ativo=true',
      count: this.activeCount(),
      tone: 'ready',
    },
    {
      id: 'inativos',
      label: 'Em Reserva / Licença',
      icon: 'person_off',
      filter: 'ativo=false',
      count: this.inactiveCount(),
      tone: 'warning',
    },
  ]);

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
  protected readonly kpiDocument = signal<RichContentDocument>(HEROES_KPI_DOCUMENT);
  protected readonly notice = signal<string | null>(null);

  private readonly dashboardStats = inject(DashboardStatsService);
  private kpisSub: Subscription | null = null;

  ngOnInit(): void {
    this.loadKpis();
  }

  ngOnDestroy(): void {
    this.kpisSub?.unsubscribe();
  }

  private loadKpis(): void {
    this.kpisSub?.unsubscribe();
    this.kpisSub = this.dashboardStats.getTacticalKpis().subscribe({
      next: (kpis) => {
        const formattedRep = kpis.averageReputationScore.toLocaleString('pt-BR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });
        const rateFormatted = kpis.readinessRate.toLocaleString('pt-BR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });

        this.totalCount.set(kpis.totalHeroes);
        this.activeCount.set(kpis.activeHeroes);
        this.inactiveCount.set(kpis.inactiveHeroes);

        this.kpiDocument.set({
          kind: 'praxis.rich-content',
          version: '1.0.0',
          nodes: [
            {
              type: 'statGroup',
              layout: 'grid',
              tileLayout: 'tile',
              headerSpacing: 'normal',
              className: 'heroes-kpi-grid',
              items: [
                {
                  id: 'total',
                  label: 'Efetivo Total',
                  value: `${kpis.totalHeroes} Cadastrados`,
                  caption: 'Quadro ativo e reserva tática',
                  icon: 'group',
                  tone: 'info',
                },
                {
                  id: 'ativos',
                  label: 'Em Prontidão Ativa',
                  value: `${kpis.activeHeroes} Ativos`,
                  caption: `${rateFormatted}% da força operacional`,
                  icon: 'verified_user',
                  tone: 'success',
                },
                {
                  id: 'inativos',
                  label: 'Em Reserva / Licença',
                  value: `${kpis.inactiveHeroes < 10 ? '0' : ''}${kpis.inactiveHeroes} Inativos`,
                  caption: 'Reserva tática ou licença civil',
                  icon: 'person_off',
                  tone: 'warning',
                },
                {
                  id: 'reputacao',
                  label: 'Score Reputacional Médio',
                  value: `${formattedRep} / 100`,
                  caption: 'Índice combinado público-governo',
                  icon: 'auto_awesome',
                  tone: 'neutral',
                },
              ],
            },
          ],
        });
      },
    });
  }

  protected onKpiSectionClicked(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const itemEl = target.closest('.prx-rich-stat-group__item') as HTMLElement | null;
    if (!itemEl) return;

    const items = Array.from(itemEl.parentElement?.children || []);
    const index = items.indexOf(itemEl);

    if (index === 0) {
      this.setFilter('all');
    } else if (index === 1) {
      this.setFilter('ativos');
    } else if (index === 2) {
      this.setFilter('inativos');
    } else if (index === 3) {
      this.showNotice('Índice Reputacional Tático: ponderação contínua de missões, avaliações e compliance.');
    }
  }

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
