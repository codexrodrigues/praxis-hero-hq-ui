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
import {
  PraxisAnalyticalDrawerComponent,
  PraxisScopeBarComponent,
  type PraxisScopeBarItem,
} from '@praxisui/table';
import { BASE_FACILITY_ANALYTICAL_DRAWER_CONFIG } from './base-facility-drawer.config';

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
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent, PraxisAnalyticalDrawerComponent, PraxisScopeBarComponent],
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

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Escopo Tático:"
        leadIcon="tune"
        [items]="scopeItems()"
        [activeId]="activeFilterId()"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="setFilter($event.id)"
        (clear)="setFilter('all')"
      />

      <!-- Tabela CRUD Governança Canônica -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-bases-crud"
          [metadata]="activeCrudMetadata()"
          (rowClick)="onFacilityRowClicked($event)"
        />
      </section>

      <!-- Base Facility Tactical Drawer Governed via Canonical Schema -->
      <praxis-analytical-drawer
        [isOpen]="!!selectedFacility()"
        [row]="selectedFacility()"
        [drawerConfig]="facilityDrawerConfig"
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

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class BasesPageComponent implements OnInit, OnDestroy {
  protected readonly facilityDrawerConfig = BASE_FACILITY_ANALYTICAL_DRAWER_CONFIG;
  protected readonly selectedFacility = signal<Record<string, unknown> | null>(null);
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalBases = signal<number>(7);
  protected readonly highSecurityBases = signal<number>(4);
  protected readonly theaters = signal<number>(2);
  protected readonly readinessRate = signal<number>(100);

  protected readonly kpiDocument = signal<RichContentDocument>(BASES_KPI_DOCUMENT);

  protected readonly scopeItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todas as Bases',
      icon: 'hub',
      count: this.totalBases(),
    },
    {
      id: 'sigilo',
      label: 'Segurança Máxima',
      icon: 'security',
      tone: 'danger',
      count: this.highSecurityBases(),
    },
    {
      id: 'terra',
      label: 'Bases Terrestres',
      icon: 'public',
      tone: 'info',
      count: this.theaters(),
    },
    {
      id: 'espaco',
      label: 'Órbita / Espaço',
      icon: 'satellite_alt',
      tone: 'ready',
      count: 1,
    },
  ]);

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
      (event as { row?: Record<string, unknown>; data?: Record<string, unknown> })?.row ||
      (event as { row?: Record<string, unknown>; data?: Record<string, unknown> })?.data ||
      (event as Record<string, unknown>);
    if (row && row['id']) {
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
