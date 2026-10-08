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
  ThreatIntelligenceDrawerComponent,
  type ThreatProfile,
} from './threat-intelligence-drawer.component';

export const AMEACAS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'risk-intelligence/ameacas',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'Cód.',
        width: '80px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'nome',
        header: 'Designação da Ameaça',
        width: '220px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'classe',
        header: 'Classe Tática',
        width: '130px',
        align: 'center',
        sortable: true,
        filterable: true,
      },
      {
        field: 'planeta',
        header: 'Origem Planetária',
        width: '140px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'nivel',
        header: 'Nível',
        type: 'number',
        width: '80px',
        align: 'center',
        sortable: true,
        filterable: true,
      },
      {
        field: 'indicePerigo',
        header: 'Índice de Letalidade',
        width: '180px',
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.letalidadeCalculada',
              total: 100,
              toneExpr: 'row.ameacaTone',
              fallbackText: 'Letalidade',
            },
          },
        },
      },
      {
        field: 'status',
        header: 'Status de Contenção',
        width: '150px',
        align: 'center',
        sortable: true,
        filterable: true,
      },
      {
        field: 'recompensa',
        header: 'Recompensa Fixada',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
        filterable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar alvos por designação, classe ou planeta...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Ameaças', filter: '', icon: 'radar' },
          { id: 'confronto', label: 'Em Confronto Ativo', filter: "status='CONFRONTO'", icon: 'crisis_alert' },
          { id: 'critico', label: 'Nível Ômega / Crítico', filter: 'nivel >= 5', icon: 'warning' },
          { id: 'contidos', label: 'Neutralizados / Raft', filter: "status='CAPTURADO' or status='CONTIDO' or status='NEUTRALIZADO'", icon: 'lock' },
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
          schemaUrl: '/schemas/filtered?path=/api/risk-intelligence/ameacas/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['nome', 'classe', 'status', 'nivel'],
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
                title: 'Dossiê Forense de Inteligência & Risco Global',
                subtitle: 'Taxonomia de combate e protocolos sob governança do Conselho de Segurança',
                columns: 3,
                minCardWidth: 280,
                cards: [
                  {
                    id: 'card-dossie',
                    title: 'Dossiê Biológico & Tático',
                    subtitle: 'Classificação e teatro de origem',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'badge',
                            labelExpr: 'row.status',
                            icon: 'radar',
                          },
                          {
                            type: 'metric',
                            label: 'Classe de Ameaça',
                            valueExpr: 'row.classe',
                            icon: 'warning',
                          },
                          {
                            type: 'metric',
                            label: 'Origem Planetária',
                            valueExpr: 'row.planeta',
                            icon: 'public',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-letalidade',
                    title: 'Letalidade & Gravidade',
                    subtitle: 'Escala de destruição e recompensas',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Classificação de Gravidade',
                            valueExpr: 'row.riscoGravidade',
                            icon: 'emergency',
                          },
                          {
                            type: 'progress',
                            label: 'Índice Relativo de Letalidade',
                            valueExpr: 'row.letalidadeCalculada',
                            max: 100,
                            showPercent: true,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-contencao',
                    title: 'Protocolos de Contenção',
                    subtitle: 'Diretrizes táticas de engajamento',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Status de Confinamento',
                            valueExpr: 'row.confinamentoStatus',
                            icon: 'lock',
                          },
                          {
                            type: 'metric',
                            label: 'Contramedida Recomendada',
                            valueExpr: 'row.contraMedidaSugerida',
                            icon: 'shield',
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

export const AMEACAS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'ameacas-kpi-grid',
      items: [
        {
          id: 'ameacas',
          label: 'Ameaças Monitoradas',
          value: '16 Alvos',
          caption: 'Radar contínuo em frequência quântica',
          icon: 'warning',
          tone: 'danger',
        },
        {
          id: 'confronto',
          label: 'Em Confronto Ativo',
          value: '6 em Combate',
          caption: 'Esquadrões mobilizados em solo',
          icon: 'crisis_alert',
          tone: 'warning',
        },
        {
          id: 'contidos',
          label: 'Contidos / Prisão Raft',
          value: '3 Neutralizados',
          caption: 'Custodiados em estase de força',
          icon: 'lock',
          tone: 'success',
        },
        {
          id: 'recompensas',
          label: 'Fundo Total de Recompensas',
          value: 'R$ 12,1 M',
          caption: 'Garantido pelo Acordo de Sokovia',
          icon: 'payments',
          tone: 'info',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-ameacas-page',
  standalone: true,
  imports: [
    CommonModule,
    PraxisCrudComponent,
    PraxisRichContent,
    ThreatIntelligenceDrawerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-risk">
            <span class="material-symbols-outlined">radar</span>
            Inteligência de Risco & Segurança Global
          </div>
          <h1 class="title-gradient page-title">Radar de Ameaças Globais</h1>
          <p class="page-subtitle">
            Catalogação de supervilões, anomalias dimensionais, tracking geoespacial e recompensas ativas.
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
          <span>Radar Tático:</span>
        </div>

        <div class="scope-chips">
          <button
            type="button"
            class="scope-chip"
            [class.is-active]="activeFilterId() === 'all'"
            (click)="setFilter('all')"
          >
            <span class="material-symbols-outlined">radar</span>
            <span>Todos os Alvos</span>
            <span class="chip-count">{{ totalAmeacas() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-warning"
            [class.is-active]="activeFilterId() === 'confronto'"
            (click)="setFilter('confronto')"
          >
            <span class="material-symbols-outlined">crisis_alert</span>
            <span>Em Confronto</span>
            <span class="chip-count">{{ confrontation() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-ready"
            [class.is-active]="activeFilterId() === 'contidos'"
            (click)="setFilter('contidos')"
          >
            <span class="material-symbols-outlined">lock</span>
            <span>Neutralizados / Raft</span>
            <span class="chip-count">{{ contained() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-danger"
            [class.is-active]="activeFilterId() === 'critico'"
            (click)="setFilter('critico')"
          >
            <span class="material-symbols-outlined">warning</span>
            <span>Nível Ômega (5+)</span>
            <span class="chip-count">4</span>
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
          crudId="heroes-hq-ameacas-crud"
          [metadata]="activeCrudMetadata()"
          (rowClick)="onThreatRowClicked($event)"
        />
      </section>

      <!-- Threat Intelligence Drawer -->
      <app-threat-intelligence-drawer
        [threat]="selectedThreat()"
        (close)="selectedThreat.set(null)"
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

    .tone-risk {
      background: color-mix(in oklab, var(--risk) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--risk) 30%, transparent);
      color: var(--risk);
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
export class AmeacasPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalAmeacas = signal<number>(16);
  protected readonly confrontation = signal<number>(6);
  protected readonly observation = signal<number>(3);
  protected readonly contained = signal<number>(3);
  protected readonly totalBountyMillion = signal<number>(12.1);

  protected readonly kpiDocument = signal<RichContentDocument>(AMEACAS_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'confronto') {
      filterCriteria = { status: 'CONFRONTO' };
    } else if (filterId === 'contidos') {
      filterCriteria = { status: 'CONTIDO' };
    } else if (filterId === 'critico') {
      filterCriteria = { nivel: 5 };
    }

    return {
      ...AMEACAS_CRUD_METADATA,
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
    if (text.includes('confronto') || text.includes('combate')) {
      this.setFilter('confronto');
    } else if (text.includes('contidos') || text.includes('neutralizados') || text.includes('raft')) {
      this.setFilter('contidos');
    } else if (text.includes('fundo') || text.includes('recompensas')) {
      this.setFilter('critico');
    } else if (text.includes('monitoradas') || text.includes('alvos')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getAmeacasTacticalKpis().subscribe((kpis) => {
      this.totalAmeacas.set(kpis.totalAmeacas);
      this.confrontation.set(kpis.confrontation);
      this.observation.set(kpis.observation);
      this.contained.set(kpis.contained);
      this.totalBountyMillion.set(kpis.totalBountyMillion);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'ameacas-kpi-grid',
            items: [
              {
                id: 'ameacas',
                label: 'Ameaças Monitoradas',
                value: `${kpis.totalAmeacas} Alvos`,
                caption: 'Radar contínuo em frequência quântica',
                icon: 'warning',
                tone: 'danger',
              },
              {
                id: 'confronto',
                label: 'Em Confronto Ativo',
                value: `${kpis.confrontation} em Combate`,
                caption: 'Esquadrões mobilizados em solo',
                icon: 'crisis_alert',
                tone: 'warning',
              },
              {
                id: 'contidos',
                label: 'Contidos / Prisão Raft',
                value: `${kpis.contained} Neutralizados`,
                caption: 'Custodiados em estase de força',
                icon: 'lock',
                tone: 'success',
              },
              {
                id: 'recompensas',
                label: 'Fundo Total de Recompensas',
                value: `R$ ${kpis.totalBountyMillion} M`,
                caption: 'Garantido pelo Acordo de Sokovia',
                icon: 'payments',
                tone: 'info',
              },
            ],
          },
        ],
      });
    });
  }

  protected readonly selectedThreat = signal<ThreatProfile | null>(null);

  protected onThreatRowClicked(event: unknown): void {
    const raw = (event as any)?.row ?? (event as any)?.data ?? event;
    if (!raw || typeof raw !== 'object' || !('id' in raw)) {
      return;
    }
    const threat: ThreatProfile = {
      id: raw.id,
      nome: raw.nome || 'Alvo Não Identificado',
      classe: raw.classe || 'ENTIDADE',
      planeta: raw.planeta || 'Desconhecido',
      nivel: typeof raw.nivel === 'number' ? raw.nivel : 5,
      status: raw.status || 'EM_OBSERVACAO',
      recompensa: typeof raw.recompensa === 'number' ? raw.recompensa : 0,
    };
    this.selectedThreat.set(threat);
  }
}
