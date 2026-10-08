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
import { BaseFacilityDrawerComponent, type BaseFacilityProfile } from './base-facility-drawer.component';

export const BASES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/bases',
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
        header: 'Nome da Instalação / Base',
        width: '260px',
        sortable: true,
      },
      {
        field: 'tipo',
        header: 'Tipo de Instalação',
        width: '180px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'sigilo',
        header: 'Nível de Sigilo',
        width: '160px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'prontidao',
        header: 'Prontidão Operacional',
        width: '180px',
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.defesaCalculada',
              total: 100,
              toneExpr: 'row.baseTone',
              fallbackText: 'Prontidão',
            },
          },
        },
      },
      {
        field: 'planeta',
        header: 'Planeta / Teatro',
        width: '150px',
        align: 'center',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar bases por nome, setor ou teatro...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Bases', filter: '', icon: 'hub' },
          { id: 'sigilo', label: 'Segurança Máxima', filter: "sigilo='SECRETO' or sigilo='ULTRA_SECRETO' or sigilo='SECRETA' or sigilo='ULTRA_SECRETA'", icon: 'security' },
          { id: 'terra', label: 'Bases Terrestres', filter: "planeta='Terra' or planeta='TERRA'", icon: 'public' },
          { id: 'espaco', label: 'Órbita / Espaço', filter: "tipo='ORBITAL' or planeta='ESPACO'", icon: 'satellite_alt' },
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
          schemaUrl: '/schemas/filtered?path=/api/operations/bases/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['nome', 'tipo', 'sigilo', 'planeta'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
      expansion: {
        enabled: true,
        contractVersion: '1.0.0',
        identity: { rowKeySource: 'table.idField', requireStableIdField: true },
        state: { mode: 'uncontrolled' },
        interaction: {
          trigger: 'icon',
          toggleOnRowClick: false,
        },
        limits: { allowMultiple: false, maxExpandedRows: 1, onOverflow: 'collapseOldest' },
      },
      detail: {
        schemaContract: {
          kind: 'praxis.detail.schema',
          version: '1.0.0',
          compat: 'semver',
          allowedNodes: [
            'card',
            'cardGrid',
            'value',
            'stack',
            'text',
            'icon',
            'badge',
            'metric',
            'progress',
            'compose',
            'timeline',
            'list',
            'tabs',
            'tab',
            'mediaBlock',
          ],
          sanitization: 'strict',
        },
        rendering: {
          strategy: 'registry',
          registryId: 'praxis.detail.default',
          rendererVersion: '1.0.0',
          fallbackNodePolicy: 'failClosed',
        },
        source: {
          mode: 'inline',
          inlineSchema: {
            layout: 'stack',
            items: [
              {
                type: 'cardGrid',
                title: 'Ficha Cadastral da Instalação Tática',
                subtitle: 'Telemetria de posicionamento geodésico, defesa de perímetro e capacidade de hangar',
                columns: 3,
                minCardWidth: 280,
                cards: [
                  {
                    id: 'card-instalacao',
                    title: 'Status & Classificação',
                    subtitle: 'Tipologia e diretrizes de sigilo',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'badge',
                            labelExpr: 'row.sigilo',
                            icon: 'security',
                          },
                          {
                            type: 'metric',
                            label: 'Tipologia de Fortificação',
                            valueExpr: 'row.tipo',
                            icon: 'fort',
                          },
                          {
                            type: 'metric',
                            label: 'Teatro Planetário',
                            valueExpr: 'row.planeta',
                            icon: 'public',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-defesa',
                    title: 'Defesa & Escudos Ativos',
                    subtitle: 'Integridade energética e esquadrões',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Contingente Tático Alocado',
                            valueExpr: 'row.contingenteDesc',
                            icon: 'groups',
                          },
                          {
                            type: 'progress',
                            label: 'Integridade dos Escudos Energéticos',
                            valueExpr: 'row.defesaCalculada',
                            max: 100,
                            showPercent: true,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-logistica',
                    title: 'Logística & Suporte Avançado',
                    subtitle: 'Hangar e reatores de energia',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Reator Primário de Fusão',
                            valueExpr: 'row.statusEnergia',
                            icon: 'bolt',
                          },
                          {
                            type: 'metric',
                            label: 'Hangar Tático Hero HQ',
                            valueExpr: 'row.capacidadeHangar',
                            icon: 'flight',
                          },
                          {
                            type: 'metric',
                            label: 'Protocolo de Emergência',
                            valueExpr: 'row.protocoloSeguranca',
                            icon: 'gavel',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    },
  } as unknown as CrudMetadata['table'],
  defaults: {
    openMode: 'drawer',
  },
};

export const BASES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'bases-kpi-grid',
      items: [
        {
          id: 'bases',
          label: 'Complexos Operacionais',
          value: '7 Instalações',
          caption: 'Quartéis-generais, torres e hangares',
          icon: 'hub',
          tone: 'info',
        },
        {
          id: 'sigilo',
          label: 'Segurança Máxima',
          value: '4 Bases Sigilosas',
          caption: 'Classificação Secreta ou Ultra-Secreta',
          icon: 'security',
          tone: 'danger',
        },
        {
          id: 'mundos',
          label: 'Teatros Planetários',
          value: '2 Mundos',
          caption: 'Operações terrestres e no espaço profundo',
          icon: 'public',
          tone: 'neutral',
        },
        {
          id: 'prontidao',
          label: 'Prontidão Logística',
          value: '100% Operacional',
          caption: 'Suporte imediato a todas as equipes',
          icon: 'verified_user',
          tone: 'success',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-bases-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent, BaseFacilityDrawerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-operations-bg">
            <span class="material-symbols-outlined">hub</span>
            Instalações & Infraestrutura Tática
          </div>
          <h1 class="title-gradient page-title">Bases & Níveis de Acesso</h1>
          <p class="page-subtitle">
            Gerenciamento de complexos militares, hangares, silos subterrâneos e postos avançados de apoio logístico.
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
          <span>Escopo Tático:</span>
        </div>

        <div class="scope-chips">
          <button
            type="button"
            class="scope-chip"
            [class.is-active]="activeFilterId() === 'all'"
            (click)="setFilter('all')"
          >
            <span class="material-symbols-outlined">hub</span>
            <span>Todas as Bases</span>
            <span class="chip-count">{{ totalBases() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-danger"
            [class.is-active]="activeFilterId() === 'sigilo'"
            (click)="setFilter('sigilo')"
          >
            <span class="material-symbols-outlined">security</span>
            <span>Segurança Máxima</span>
            <span class="chip-count">{{ highSecurityBases() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-info"
            [class.is-active]="activeFilterId() === 'terra'"
            (click)="setFilter('terra')"
          >
            <span class="material-symbols-outlined">public</span>
            <span>Bases Terrestres</span>
            <span class="chip-count">{{ theaters() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-ready"
            [class.is-active]="activeFilterId() === 'espaco'"
            (click)="setFilter('espaco')"
          >
            <span class="material-symbols-outlined">satellite_alt</span>
            <span>Órbita / Espaço</span>
            <span class="chip-count">1</span>
          </button>
        </div>

        @if (activeFilterId() !== 'all') {
          <button type="button" class="clear-scope-btn" (click)="setFilter('all')">
            <span class="material-symbols-outlined">restart_alt</span>
            <span>Limpar Filtro</span>
          </button>
        }
      </div>

      <!-- Tabela CRUD Governança Canônica -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-bases-crud"
          [metadata]="activeCrudMetadata()"
          (rowClick)="onFacilityRowClicked($event)"
        />
      </section>

      <!-- Base Facility Tactical Drawer -->
      <app-base-facility-drawer
        [facility]="selectedFacility()"
        (closeDrawer)="selectedFacility.set(null)"
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
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;

      span { font-size: 14px; }
    }

    .tone-operations-bg {
      background: color-mix(in oklab, var(--operations) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--operations) 30%, transparent);
      color: var(--operations);
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

      &.chip-info.is-active {
        background: color-mix(in oklab, var(--operations) 22%, transparent);
        border-color: var(--operations);
        .chip-count { background: var(--operations); }
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
export class BasesPageComponent implements OnInit, OnDestroy {
  protected readonly selectedFacility = signal<BaseFacilityProfile | null>(null);
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalBases = signal<number>(7);
  protected readonly highSecurityBases = signal<number>(4);
  protected readonly theaters = signal<number>(2);
  protected readonly readinessRate = signal<number>(100);

  protected readonly kpiDocument = signal<RichContentDocument>(BASES_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'sigilo') {
      filterCriteria = { sigilo: 'SECRETO' };
    } else if (filterId === 'terra') {
      filterCriteria = { planeta: 'TERRA' };
    } else if (filterId === 'espaco') {
      filterCriteria = { planeta: 'ESPACO' };
    }

    return {
      ...BASES_CRUD_METADATA,
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

  protected onFacilityRowClicked(event: unknown): void {
    const row =
      (event as { row?: BaseFacilityProfile; data?: BaseFacilityProfile })?.row ||
      (event as { row?: BaseFacilityProfile; data?: BaseFacilityProfile })?.data ||
      (event as BaseFacilityProfile);
    if (row && row.id) {
      this.selectedFacility.set(row);
    }
  }

  protected onKpiCardClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const cardEl = target?.closest('.prx-stat-group__item, [data-stat-id], .prx-rich-card');
    if (!cardEl) return;

    const text = cardEl.textContent?.toLowerCase() ?? '';
    if (text.includes('segurança máxima') || text.includes('sigilosas')) {
      this.setFilter('sigilo');
    } else if (text.includes('teatros') || text.includes('mundos') || text.includes('terrestres')) {
      this.setFilter('terra');
    } else if (text.includes('instalações') || text.includes('complexos')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getBasesTacticalKpis().subscribe((kpis) => {
      this.totalBases.set(kpis.totalBases);
      this.highSecurityBases.set(kpis.highSecurityBases);
      this.theaters.set(kpis.theaters);
      this.readinessRate.set(kpis.readinessRate);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'bases-kpi-grid',
            items: [
              {
                id: 'bases',
                label: 'Complexos Operacionais',
                value: `${kpis.totalBases} Instalações`,
                caption: 'Quartéis-generais, torres e hangares',
                icon: 'hub',
                tone: 'info',
              },
              {
                id: 'sigilo',
                label: 'Segurança Máxima',
                value: `${kpis.highSecurityBases} Bases Sigilosas`,
                caption: 'Classificação Secreta ou Ultra-Secreta',
                icon: 'security',
                tone: 'danger',
              },
              {
                id: 'mundos',
                label: 'Teatros Planetários',
                value: `${kpis.theaters} Mundos`,
                caption: 'Operações terrestres e no espaço profundo',
                icon: 'public',
                tone: 'neutral',
              },
              {
                id: 'prontidao',
                label: 'Prontidão Logística',
                value: `${kpis.readinessRate}% Operacional`,
                caption: 'Suporte imediato a todas as equipes',
                icon: 'verified_user',
                tone: 'success',
              },
            ],
          },
        ],
      });
    });
  }
}
