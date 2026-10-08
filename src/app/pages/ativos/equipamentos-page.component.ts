import { CommonModule } from '@angular/common';
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
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';

export const EQUIPAMENTOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'assets/equipamentos',
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
        filterable: false,
      },
      {
        field: 'nome',
        header: 'Equipamento / Traje',
        width: '260px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'tipo',
        header: 'Categoria Tática',
        width: '160px',
        align: 'center',
        sortable: true,
        filterable: true,
      },
      {
        field: 'resistencia',
        header: 'Integridade da Blindagem',
        width: '190px',
        align: 'center',
        sortable: true,
        filterable: true,
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.resistenciaScore',
              total: 100,
              toneExpr: 'row.resistenciaTone',
              fallbackText: 'Blindagem',
            },
          },
        },
      },
      {
        field: 'proprietarioNome',
        header: 'Custodiante / Herói',
        width: '220px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'status',
        header: 'Status de Custódia',
        width: '160px',
        align: 'center',
        sortable: true,
        filterable: true,
      },
    ],
    toolbar: {
      visible: true,
      filters: {
        enabled: true,
        showAdvancedButton: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Itens', icon: 'inventory_2', filter: {} },
          { id: 'custodia', label: 'Em Uso / Custódia', icon: 'verified_user', filter: { status: 'EM_USO' } },
          { id: 'manutencao', label: 'Em Manutenção', icon: 'build', filter: { status: 'MANUTENCAO' } },
          { id: 'estoque', label: 'Disponível em Arsenal', icon: 'shelves', filter: { status: 'DISPONIVEL' } },
        ],
      },
    },
    behavior: {
      filtering: {
        enabled: true,
        columnFilters: {
          enabled: true,
        },
        advancedFilters: {
          enabled: true,
          settings: {
            showAdvanced: true,
            alwaysVisibleFields: ['nome', 'tipo', 'status'],
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
                title: 'Dossiê Técnico & Telemetria Balística',
                subtitle: 'Especificações de manufatura, blindagem reativa e protocolos de custódia militar',
                columns: 3,
                minCardWidth: 280,
                cards: [
                  {
                    id: 'card-especificacoes',
                    title: 'Blindagem & Integridade',
                    subtitle: 'Diagnóstico estrutural e absorção de impacto',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'badge',
                            labelExpr: 'row.statusBadge',
                            icon: 'verified_user',
                          },
                          {
                            type: 'metric',
                            label: 'Categoria Tática',
                            valueExpr: 'row.tipo',
                            icon: 'category',
                          },
                          {
                            type: 'progress',
                            label: 'Integridade Estrutural',
                            valueExpr: 'row.resistenciaScore',
                            max: 100,
                            showPercent: true,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-telemetria',
                    title: 'Telemetria & Propulsão',
                    subtitle: 'Célula de energia e suporte balístico',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Fonte de Energia Primária',
                            valueExpr: 'row.fonteEnergia',
                            icon: 'bolt',
                          },
                          {
                            type: 'metric',
                            label: 'Engenharia & Origem',
                            valueExpr: 'row.tecnologiaOrigem',
                            icon: 'precision_manufacturing',
                          },
                          {
                            type: 'metric',
                            label: 'Última Calibração Tática',
                            valueExpr: 'row.ultimaRevisaoFormatada',
                            icon: 'history_toggle_off',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-custodia',
                    title: 'Custódia & Governança',
                    subtitle: 'Protocolo de cofre e credenciamento',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Custodiante Credenciado',
                            valueExpr: 'row.proprietarioNome',
                            icon: 'shield_person',
                          },
                          {
                            type: 'metric',
                            label: 'Localização de Armaria',
                            valueExpr: 'row.localizacaoArmaria',
                            icon: 'shelves',
                          },
                          {
                            type: 'metric',
                            label: 'Nível de Autorização',
                            valueExpr: 'row.autorizacaoAcesso',
                            icon: 'key',
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

export const EQUIPAMENTOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'equipamentos-kpi-grid',
      items: [
        {
          id: 'total',
          label: 'Total de Itens Táticos',
          value: '62 Ativos',
          caption: 'Trajes, armas e exoesqueletos',
          icon: 'shield',
          tone: 'info',
        },
        {
          id: 'custodia',
          label: 'Em Custódia / Uso Ativo',
          value: '56 Itens',
          caption: 'Alocados a heróis em missão',
          icon: 'verified_user',
          tone: 'success',
        },
        {
          id: 'manutencao',
          label: 'Em Manutenção',
          value: '2 Itens',
          caption: 'Recarga de reator e nanotecnologia',
          icon: 'build',
          tone: 'warning',
        },
        {
          id: 'estoque',
          label: 'Em Reserva de Arsenal',
          value: '4 Itens',
          caption: 'Disponíveis no cofre central',
          icon: 'inventory_2',
          tone: 'neutral',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-equipamentos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
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

      <!-- Metadata-Driven KPI Bento Grid com Interatividade de Filtro -->
      <section
        class="kpi-surface"
        (click)="onKpiSectionClicked($event)"
        [attr.data-active-filter]="activeFilterId()"
        title="Clique em um indicador para filtrar o inventário abaixo"
      >
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Tática de Filtro e Escopo de Custódia -->
      <div class="tactical-filter-bar glass-panel">
        <div class="filter-bar-lead">
          <span class="material-symbols-outlined filter-icon">filter_alt</span>
          <span class="filter-lead-label">Status de Custódia:</span>
        </div>

        <div class="filter-chips-track">
          <button
            type="button"
            class="scope-chip"
            [class.is-active]="activeFilterId() === 'all'"
            (click)="setFilter('all')"
          >
            <span class="material-symbols-outlined">inventory_2</span>
            <span>Todos os Itens</span>
            <span class="chip-count">{{ totalCount() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-ready"
            [class.is-active]="activeFilterId() === 'custodia'"
            (click)="setFilter('custodia')"
          >
            <span class="material-symbols-outlined">verified_user</span>
            <span>Em Custódia / Ativo</span>
            <span class="chip-count">{{ inUseCount() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-warning"
            [class.is-active]="activeFilterId() === 'manutencao'"
            (click)="setFilter('manutencao')"
          >
            <span class="material-symbols-outlined">build</span>
            <span>Em Manutenção</span>
            <span class="chip-count">{{ maintenanceCount() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-stock"
            [class.is-active]="activeFilterId() === 'estoque'"
            (click)="setFilter('estoque')"
          >
            <span class="material-symbols-outlined">shelves</span>
            <span>Reserva no Arsenal</span>
            <span class="chip-count">{{ stockCount() }}</span>
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
          crudId="heroes-hq-equipamentos-crud"
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
      background: color-mix(in oklab, var(--assets) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--assets) 30%, transparent);
      color: var(--assets);
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
    }

    .page-subtitle {
      margin: 8px 0 0;
      font-size: 0.88rem;
      color: var(--muted-foreground);
      max-width: 720px;
    }

    /* Tactical Filter Bar */
    .tactical-filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 18px;
      border-radius: 14px;
      flex-wrap: wrap;
    }

    .filter-bar-lead {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--muted-foreground);
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;

      .filter-icon {
        font-size: 18px;
        color: var(--assets);
      }
    }

    .filter-chips-track {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .scope-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 34px;
      padding: 0 14px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: color-mix(in oklab, var(--card) 70%, transparent);
      color: var(--muted-foreground);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      span.material-symbols-outlined {
        font-size: 16px;
      }

      .chip-count {
        padding: 2px 7px;
        border-radius: 9999px;
        font-size: 0.72rem;
        background: color-mix(in oklab, var(--muted) 80%, transparent);
        color: var(--foreground);
      }

      &:hover {
        border-color: color-mix(in oklab, var(--assets) 40%, var(--border));
        color: var(--foreground);
        transform: translateY(-1px);
      }

      &.is-active {
        background: color-mix(in oklab, var(--assets) 15%, var(--card));
        border-color: var(--assets);
        color: var(--foreground);
        box-shadow: 0 0 0 1px color-mix(in oklab, var(--assets) 40%, transparent);

        .chip-count {
          background: var(--assets);
          color: #fff;
        }
      }

      &.chip-ready.is-active {
        background: color-mix(in oklab, var(--ready) 15%, var(--card));
        border-color: var(--ready);

        .chip-count {
          background: var(--ready);
          color: #fff;
        }
      }

      &.chip-warning.is-active {
        background: color-mix(in oklab, var(--warning) 15%, var(--card));
        border-color: var(--warning);

        .chip-count {
          background: var(--warning);
          color: #fff;
        }
      }
    }

    .clear-scope-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      padding: 0 12px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px dashed var(--border);
      background: transparent;
      color: var(--muted-foreground);
      transition: all 0.15s ease;

      span { font-size: 15px; }

      &:hover {
        border-color: var(--assets);
        color: var(--assets);
        background: color-mix(in oklab, var(--assets) 8%, transparent);
      }
    }

    ::ng-deep {
      .equipamentos-kpi-grid {
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
          border-color: color-mix(in oklab, var(--assets) 50%, var(--border)) !important;
          box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.35);
        }
      }

      [data-active-filter="all"] .prx-rich-stat-group__item:nth-child(1),
      [data-active-filter="custodia"] .prx-rich-stat-group__item:nth-child(2),
      [data-active-filter="manutencao"] .prx-rich-stat-group__item:nth-child(3),
      [data-active-filter="estoque"] .prx-rich-stat-group__item:nth-child(4) {
        border-color: var(--assets) !important;
        background: color-mix(in oklab, var(--assets) 12%, var(--card)) !important;
        box-shadow: 0 0 0 2px color-mix(in oklab, var(--assets) 50%, transparent),
                    0 8px 24px -6px rgba(0, 0, 0, 0.4) !important;
      }
    }

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class EquipamentosPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<'all' | 'custodia' | 'manutencao' | 'estoque'>('all');
  protected readonly totalCount = signal<number>(62);
  protected readonly inUseCount = signal<number>(56);
  protected readonly maintenanceCount = signal<number>(2);
  protected readonly stockCount = signal<number>(4);

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

  protected readonly kpiDocument = signal<RichContentDocument>(EQUIPAMENTOS_KPI_DOCUMENT);

  private readonly dashboardStats = inject(DashboardStatsService);
  private kpiSub: Subscription | null = null;

  ngOnInit(): void {
    this.loadKpis();
  }

  ngOnDestroy(): void {
    this.kpiSub?.unsubscribe();
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
      this.setFilter('custodia');
    } else if (index === 2) {
      this.setFilter('manutencao');
    } else if (index === 3) {
      this.setFilter('estoque');
    }
  }

  protected setFilter(filterId: 'all' | 'custodia' | 'manutencao' | 'estoque'): void {
    if (this.activeFilterId() === filterId) return;
    this.activeFilterId.set(filterId);
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getEquipamentosTacticalKpis().subscribe((kpis) => {
      this.totalCount.set(kpis.totalEquipamentos);
      this.inUseCount.set(kpis.inUse);
      this.maintenanceCount.set(kpis.inMaintenance);
      this.stockCount.set(kpis.inStock);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'equipamentos-kpi-grid',
            items: [
              {
                id: 'total',
                label: 'Total de Itens Táticos',
                value: `${kpis.totalEquipamentos} Ativos`,
                caption: 'Trajes, armas e exoesqueletos',
                icon: 'shield',
                tone: 'info',
              },
              {
                id: 'custodia',
                label: 'Em Custódia / Uso Ativo',
                value: `${kpis.inUse} Itens`,
                caption: 'Alocados a heróis em missão',
                icon: 'verified_user',
                tone: 'success',
              },
              {
                id: 'manutencao',
                label: 'Em Manutenção',
                value: `${kpis.inMaintenance} Itens`,
                caption: 'Recarga de reator e nanotecnologia',
                icon: 'build',
                tone: 'warning',
              },
              {
                id: 'estoque',
                label: 'Em Reserva de Arsenal',
                value: `${kpis.inStock} Itens`,
                caption: 'Disponíveis no cofre central',
                icon: 'inventory_2',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
