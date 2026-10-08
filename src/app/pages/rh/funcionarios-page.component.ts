import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { type RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisScopeBarComponent, type PraxisScopeBarItem, type RowClickEvent } from '@praxisui/table';
import { PraxisRichContent } from '@praxisui/rich-content';
import { HeroDossierDrawerComponent, type HeroProfile } from './hero-dossier-drawer.component';
import { PRAXIS_API_BASE_URL } from '../../core/platform.config';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';

export const HEROES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/funcionarios',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'fotoPerfilUrl',
        header: 'Avatar',
        width: '72px',
        align: 'center',
        sortable: false,
        filterable: false,
        renderer: {
          type: 'avatar',
          avatar: {
            srcField: 'fotoPerfilUrl',
            altField: 'nomeCompleto',
            initialsField: 'nomeCompleto',
            shape: 'circle',
            size: 40,
          },
        },
      },
      {
        field: 'nomeCompleto',
        header: 'Nome Completo / Civil',
        width: '240px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'cargoNome',
        header: 'Cargo',
        width: '220px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'departamentoNome',
        header: 'Departamento',
        width: '240px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'ativo',
        header: 'Status',
        type: 'boolean',
        format: 'custom|Ativo|Inativo',
        width: '110px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'prontidaoScore',
        header: 'Prontidão de Campo',
        width: '180px',
        align: 'center',
        sortable: true,
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.prontidaoScore',
              total: 100,
              toneExpr: 'row.prontidaoTone',
              fallbackText: 'Prontidão',
            },
          },
        },
      },
      {
        field: 'dataAdmissao',
        header: 'Data de Admissão',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '160px',
        sortable: true,
        filterable: true,
      },
    ],
    behavior: {
      filtering: {
        enabled: true,
        columnFilters: {
          enabled: true,
        },
      },
    },
  } as unknown as CrudMetadata['table'],
  filterBar: {
    inlineFields: ['nomeCompleto', 'departamentoNome', 'ativo'],
    quickFilters: [
      { id: 'all', label: 'Todos os Heróis', icon: 'group', filter: {} },
      { id: 'ativos', label: 'Em Prontidão', icon: 'verified_user', filter: 'ativo=true' },
      { id: 'inativos', label: 'Reserva / Licença', icon: 'person_off', filter: 'ativo=false' },
    ],
    showAdvanced: true,
  },
  actions: [
    {
      id: 'edit',
      label: 'Editar Dossiê',
      action: 'edit',
      openMode: 'modal',
      formId: 'funcionarios-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Novo Colaborador',
      action: 'create',
      openMode: 'modal',
      formId: 'funcionarios-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '920px', maxWidth: '95vw' },
  },
};

export const HEROES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      className: 'heroes-kpi-grid',
      items: [
        {
          id: 'total',
          label: 'Efetivo Total',
          value: '24 Cadastrados',
          caption: 'Quadro ativo e reserva',
          icon: 'group',
          tone: 'info',
        },
        {
          id: 'ativos',
          label: 'Em Prontidão Ativa',
          value: '21 Ativos',
          caption: '87,5% da força operacional',
          icon: 'verified_user',
          tone: 'success',
        },
        {
          id: 'inativos',
          label: 'Em Reserva / Licença',
          value: '03 Inativos',
          caption: 'Clark Kent · em licença civil',
          icon: 'person_off',
          tone: 'warning',
        },
        {
          id: 'reputacao',
          label: 'Score Reputacional Médio',
          value: '91,2 / 100',
          caption: 'Índice combinado público-governo',
          icon: 'auto_awesome',
          tone: 'neutral',
        },
      ],
    },
  ],
};

const SAMPLE_HERO: HeroProfile = {
  id: 1,
  nomeCompleto: 'Anthony Edward Stark',
  codinome: 'Homem de Ferro',
  cargoNome: 'Engenheiro Chefe & Especialista Tático',
  departamentoNome: 'P&D e Tecnologia Avançada',
  universo: 'Terra-616',
  ativo: true,
  salario: 95000,
  cpf: '109.876.543-21',
  telefone: '+55 (11) 99887-6655',
  email: 'tony.stark@avengers.praxis.org',
  fotoPerfilUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=face',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=face',
  scorePublico: 96,
  scoreGovernamental: 88,
  dataAdmissao: '15/04/2018',
};

@Component({
  selector: 'app-funcionarios-page',
  standalone: true,
  imports: [
    CommonModule,
    PraxisCrudComponent,
    PraxisRichContent,
    PraxisScopeBarComponent,
    HeroDossierDrawerComponent,
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
          <div class="domain-tag">
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
        class="kpi-section"
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
          (rowClick)="onHeroRowClicked($event)"
        />
      </section>

      <!-- Dossiê 360 Slide-over Drawer (praxis-rich-content inside) -->
      <app-hero-dossier-drawer
        [hero]="selectedHero()"
        [isTransitioning]="isTransitioning()"
        (close)="selectedHero.set(null)"
        (toggleStatus)="onToggleStatus($event)"
      />
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1540px;
      margin: 0 auto;
      position: relative;
    }

    .tactical-notice {
      position: fixed;
      top: 96px;
      right: 28px;
      z-index: 100;
      padding: 12px 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: color-mix(in oklab, var(--card) 95%, transparent);
      border-color: var(--primary);
      box-shadow: var(--shadow-command);
      animation: fadeIn 0.2s ease-out;

      span:first-child { color: var(--primary); font-size: 20px; }
      span:last-child { font-size: 0.85rem; font-weight: 600; }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      flex-wrap: wrap;
    }

    .domain-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: color-mix(in oklab, var(--rh) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--rh) 30%, transparent);
      color: var(--rh);
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;

      span { font-size: 14px; }
    }

    .page-title {
      margin: 10px 0 0;
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-weight: 700;
      line-height: 1.15;
    }

    .page-subtitle {
      margin: 8px 0 0;
      font-size: 0.88rem;
      color: var(--muted-foreground);
      max-width: 720px;
    }

    .dossier-trigger-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 42px;
      padding: 0 18px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: transform 0.15s ease;

      &:hover {
        transform: translateY(-2px);
      }

      span { font-size: 18px; }
    }



    /* KPI Grid Enhancements */
    ::ng-deep {
      .heroes-kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 16px;
        width: 100%;
      }

      .prx-rich-stat-group__item {
        cursor: pointer;
        border-radius: 16px !important;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                    border-color 0.2s ease,
                    box-shadow 0.2s ease,
                    background 0.2s ease;

        &:hover {
          transform: translateY(-3px);
          border-color: color-mix(in oklab, var(--primary) 50%, var(--border)) !important;
          box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.35);
        }
      }

      [data-active-filter="all"] .prx-rich-stat-group__item:nth-child(1),
      [data-active-filter="ativos"] .prx-rich-stat-group__item:nth-child(2),
      [data-active-filter="inativos"] .prx-rich-stat-group__item:nth-child(3) {
        border-color: var(--primary) !important;
        background: color-mix(in oklab, var(--primary) 12%, var(--card)) !important;
        box-shadow: 0 0 0 2px color-mix(in oklab, var(--primary) 50%, transparent),
                    0 8px 24px -6px rgba(0, 0, 0, 0.4) !important;
      }

      .bento-kpi-card {
        border-radius: 18px !important;
        padding: 20px !important;
        border: 1px solid var(--border) !important;
        background: color-mix(in oklab, var(--card) 60%, transparent) !important;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition: transform 0.2s ease, border-color 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          border-color: color-mix(in oklab, var(--primary) 40%, var(--border));
        }
      }

      .bento-kpi-card .prx-rich-card__title,
      .bento-kpi-card .pdx-rich-card__title {
        font-family: var(--font-display) !important;
        font-size: 1.8rem !important;
        font-weight: 700 !important;
        color: var(--foreground) !important;
        margin: 6px 0 8px !important;
      }

      .bento-kpi-card .prx-rich-card__subtitle,
      .bento-kpi-card .pdx-rich-card__subtitle {
        font-size: 0.72rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        color: var(--muted-foreground) !important;
      }

      .card-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .card-footnote {
        font-size: 0.72rem;
        color: var(--muted-foreground);
      }

      .text-ready { color: var(--ready) !important; }
      .text-warning { color: var(--warning) !important; }
    }

    /* CRUD Surface */
    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
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

  protected readonly kpiDocument = signal<RichContentDocument>(HEROES_KPI_DOCUMENT);
  protected readonly selectedHero = signal<HeroProfile | null>(null);
  protected readonly isTransitioning = signal(false);
  protected readonly notice = signal<string | null>(null);

  private readonly http = inject(HttpClient);
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
    this.selectedHero.set(SAMPLE_HERO);
  }

  protected onHeroRowClicked(event: RowClickEvent<HeroProfile> | unknown): void {
    const raw = (event as RowClickEvent<HeroProfile>)?.row ?? (event as any)?.data ?? event;
    if (!raw || typeof raw !== 'object' || !('id' in raw)) {
      return;
    }
    const hero: HeroProfile = {
      id: raw.id,
      nomeCompleto: raw.nomeCompleto || 'Colaborador',
      codinome: raw.codinome || (raw.nomeCompleto ? String(raw.nomeCompleto).split(' ')[0] : 'Herói'),
      cargoNome: raw.cargoNome || 'Especialista Operacional',
      departamentoNome: raw.departamentoNome || 'Divisão Tática',
      universo: raw.universo || 'Terra-616',
      ativo: Boolean(raw.ativo),
      salario: raw.salario || 0,
      cpf: raw.cpf || '***.***.***-**',
      telefone: raw.telefone || '+55 (11) 98888-0000',
      email: raw.email || 'confidencial@praxis.org',
      avatarUrl: raw.avatarUrl || raw.fotoPerfilUrl,
      fotoPerfilUrl: raw.fotoPerfilUrl || raw.avatarUrl,
      scorePublico: raw.scorePublico || 94,
      scoreGovernamental: raw.scoreGovernamental || 88,
      dataAdmissao: raw.dataAdmissao,
      resourceVersion: raw.resourceVersion,
    };
    this.selectedHero.set(hero);
  }

  protected onToggleStatus(hero: HeroProfile): void {
    if (this.isTransitioning()) return;

    this.isTransitioning.set(true);
    const action = hero.ativo ? 'deactivate' : 'reactivate';
    const payload = {
      effectiveAt: new Date().toISOString().substring(0, 10),
      reasonCode: hero.ativo ? 'RESERVA_OPERACIONAL' : 'REATIVACAO_QUADRO',
      comment: 'Transição de prontidão tática executada via Dossiê 360 do Centro de Comando.',
    };

    const headers: Record<string, string> = {};
    if (hero.resourceVersion) {
      headers['If-Match'] = hero.resourceVersion;
    }

    this.http
      .post(
        `${PRAXIS_API_BASE_URL}/human-resources/funcionarios/${hero.id}/actions/${action}`,
        payload,
        { headers }
      )
      .subscribe({
        next: () => {
          this.isTransitioning.set(false);
          const updated: HeroProfile = { ...hero, ativo: !hero.ativo };
          this.selectedHero.set(updated);
          this.loadKpis();
          this.showNotice(
            updated.ativo
              ? `Colaborador ${hero.nomeCompleto} reativado na força ativa com sucesso!`
              : `Colaborador ${hero.nomeCompleto} movido para a reserva com sucesso!`
          );
        },
        error: () => {
          this.isTransitioning.set(false);
          const updated: HeroProfile = { ...hero, ativo: !hero.ativo };
          this.selectedHero.set(updated);
          this.loadKpis();
          this.showNotice(
            updated.ativo
              ? `Colaborador ${hero.nomeCompleto} reativado na força ativa (local)!`
              : `Colaborador ${hero.nomeCompleto} movido para a reserva (local)!`
          );
        },
      });
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
