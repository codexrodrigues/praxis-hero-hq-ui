import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';

export const EQUIPES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/equipes',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'ID',
        width: '80px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'nome',
        header: 'Nome da Equipe / Esquadrão',
        width: '260px',
        sortable: true,
      },
      {
        field: 'sigla',
        header: 'Sigla',
        width: '120px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'basePrincipalNome',
        header: 'Base Principal Designada',
        width: '240px',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Prontidão Tática',
        width: '160px',
        align: 'center',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar equipes por nome, sigla ou base...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Esquadrões', filter: '', icon: 'diversity_3' },
          { id: 'ativa', label: 'Prontidão Ativa', filter: "status='ATIVA'", icon: 'verified_user' },
          { id: 'reserva', label: 'Reserva Tática', filter: "status='RESERVA'", icon: 'shield' },
          { id: 'missoes', label: 'Em Missão', filter: "status='EM_MISSAO'", icon: 'flight_takeoff' },
        ],
        showAdvancedButton: true,
      },
    },
    behavior: {
      filtering: {
        columnFilters: {
          enabled: true,
        },
        advancedFilters: {
          schemaUrl: '/schemas/filtered?path=/api/operations/equipes/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['nome', 'status', 'sigla'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
    },
  } as unknown as CrudMetadata['table'],
  defaults: {
    openMode: 'drawer',
  },
};

export const EQUIPES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'equipes-kpi-grid',
      items: [
        {
          id: 'equipes',
          label: 'Esquadrões Registrados',
          value: '5 Equipes',
          caption: 'Compostas por heróis de ponta',
          icon: 'diversity_3',
          tone: 'info',
        },
        {
          id: 'ativas',
          label: 'Prontidão Máxima',
          value: '4 Ativas',
          caption: 'Mobilizáveis para resposta imediata',
          icon: 'verified_user',
          tone: 'success',
        },
        {
          id: 'reserva',
          label: 'Reserva & Suporte',
          value: '1 em Treinamento',
          caption: 'Squad em ciclo de integração',
          icon: 'shield',
          tone: 'neutral',
        },
        {
          id: 'bases',
          label: 'Bases Interligadas',
          value: '5 Complexos',
          caption: 'Presença e ancoragem tática',
          icon: 'hub',
          tone: 'info',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-equipes-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
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

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Tática de Escopo e Filtros Rápidos -->
      <div class="tactical-filter-bar glass-panel">
        <div class="scope-label">
          <span class="material-symbols-outlined">tune</span>
          <span>Status Tático:</span>
        </div>

        <div class="scope-chips">
          <button
            type="button"
            class="scope-chip"
            [class.is-active]="activeFilterId() === 'all'"
            (click)="setFilter('all')"
          >
            <span class="material-symbols-outlined">diversity_3</span>
            <span>Todos os Esquadrões</span>
            <span class="chip-count">{{ totalEquipes() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-ready"
            [class.is-active]="activeFilterId() === 'ativa'"
            (click)="setFilter('ativa')"
          >
            <span class="material-symbols-outlined">verified_user</span>
            <span>Prontidão Máxima</span>
            <span class="chip-count">{{ activeEquipes() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-warning"
            [class.is-active]="activeFilterId() === 'reserva'"
            (click)="setFilter('reserva')"
          >
            <span class="material-symbols-outlined">shield</span>
            <span>Reserva / Standby</span>
            <span class="chip-count">{{ reserveEquipes() }}</span>
          </button>
        </div>

        @if (activeFilterId() !== 'all') {
          <button type="button" class="clear-scope-btn" (click)="setFilter('all')">
            <span class="material-symbols-outlined">restart_alt</span>
            <span>Limpar Filtro</span>
          </button>
        }
      </div>

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-equipes-crud"
          [metadata]="activeCrudMetadata()"
        />
      </section>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1540px;
      margin: 0 auto;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .domain-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      span { font-size: 14px; }
    }

    .tone-operations {
      background: color-mix(in oklab, var(--operations) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--operations) 30%, transparent);
      color: var(--operations);
    }

    .page-title {
      margin: 10px 0 0;
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-weight: 700;
    }

    .page-subtitle {
      margin: 8px 0 0;
      font-size: 0.88rem;
      color: var(--muted-foreground);
      max-width: 720px;
    }

    .kpi-surface {
      cursor: pointer;
    }

    /* Tactical Filter Bar */
    .tactical-filter-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 18px;
      border-radius: 14px;
      flex-wrap: wrap;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(18, 26, 43, 0.6);
      backdrop-filter: blur(12px);
    }

    .scope-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted-foreground);
      span.material-symbols-outlined { font-size: 18px; color: var(--primary); }
    }

    .scope-chips {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .scope-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.03);
      color: var(--foreground);
      transition: all 0.2s ease;

      span.material-symbols-outlined { font-size: 16px; }

      .chip-count {
        padding: 2px 7px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.08);
        font-size: 0.75rem;
        font-weight: 700;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.22);
      }

      &.is-active {
        background: color-mix(in oklab, var(--primary) 22%, transparent);
        border-color: var(--primary);
        color: #fff;
        box-shadow: 0 0 16px color-mix(in oklab, var(--primary) 30%, transparent);

        .chip-count {
          background: var(--primary);
          color: #fff;
        }
      }

      &.chip-danger.is-active {
        background: color-mix(in oklab, var(--risk) 22%, transparent);
        border-color: var(--risk);
        .chip-count { background: var(--risk); }
      }

      &.chip-warning.is-active {
        background: color-mix(in oklab, var(--warning) 22%, transparent);
        border-color: var(--warning);
        .chip-count { background: var(--warning); }
      }

      &.chip-ready.is-active {
        background: color-mix(in oklab, var(--ready) 22%, transparent);
        border-color: var(--ready);
        .chip-count { background: var(--ready); }
      }
    }

    .clear-scope-btn {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--muted-foreground);
      background: transparent;
      border: 1px dashed rgba(255, 255, 255, 0.15);
      cursor: pointer;
      transition: all 0.15s ease;

      span { font-size: 16px; }

      &:hover {
        color: var(--foreground);
        border-color: rgba(255, 255, 255, 0.35);
        background: rgba(255, 255, 255, 0.04);
      }
    }

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class EquipesPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalEquipes = signal<number>(5);
  protected readonly activeEquipes = signal<number>(4);
  protected readonly reserveEquipes = signal<number>(1);
  protected readonly linkedBases = signal<number>(5);

  protected readonly kpiDocument = signal<RichContentDocument>(EQUIPES_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'ativa') {
      filterCriteria = { status: 'ATIVA' };
    } else if (filterId === 'reserva') {
      filterCriteria = { status: 'RESERVA' };
    }

    return {
      ...EQUIPES_CRUD_METADATA,
      filterCriteria,
    };
  });

  private readonly dashboardStats = inject(DashboardStatsService);
  private kpiSub: Subscription | null = null;

  ngOnInit(): void {
    this.loadKpis();
  }

  ngOnDestroy(): void {
    this.kpiSub?.unsubscribe();
  }

  protected setFilter(filterId: string): void {
    this.activeFilterId.set(filterId);
  }

  protected onKpiCardClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const cardEl = target?.closest('.prx-stat-group__item, [data-stat-id], .prx-rich-card');
    if (!cardEl) return;

    const text = cardEl.textContent?.toLowerCase() ?? '';
    if (text.includes('prontidão máxima') || text.includes('ativas')) {
      this.setFilter('ativa');
    } else if (text.includes('reserva') || text.includes('treinamento')) {
      this.setFilter('reserva');
    } else if (text.includes('esquadrões') || text.includes('registrados')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getEquipesTacticalKpis().subscribe((kpis) => {
      this.totalEquipes.set(kpis.totalEquipes);
      this.activeEquipes.set(kpis.activeEquipes);
      this.reserveEquipes.set(kpis.reserveEquipes);
      this.linkedBases.set(kpis.linkedBases);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'equipes-kpi-grid',
            items: [
              {
                id: 'equipes',
                label: 'Esquadrões Registrados',
                value: `${kpis.totalEquipes} Equipes`,
                caption: 'Compostas por heróis de ponta',
                icon: 'diversity_3',
                tone: 'info',
              },
              {
                id: 'ativas',
                label: 'Prontidão Máxima',
                value: `${kpis.activeEquipes} Ativas`,
                caption: 'Mobilizáveis para resposta imediata',
                icon: 'verified_user',
                tone: 'success',
              },
              {
                id: 'reserva',
                label: 'Reserva & Suporte',
                value: `${kpis.reserveEquipes} em Treinamento`,
                caption: 'Squad em ciclo de integração',
                icon: 'shield',
                tone: 'neutral',
              },
              {
                id: 'bases',
                label: 'Bases Interligadas',
                value: `${kpis.linkedBases} Complexos`,
                caption: 'Presença e ancoragem tática',
                icon: 'hub',
                tone: 'info',
              },
            ],
          },
        ],
      });
    });
  }
}
