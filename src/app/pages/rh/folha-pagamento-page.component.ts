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

export const FOLHA_PAGAMENTO_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/folhas-pagamento',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'Ciclo ID',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'funcionarioId',
        header: 'Colaborador ID',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'mes',
        header: 'Mês',
        width: '80px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'ano',
        header: 'Ano',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'salarioBruto',
        header: 'Salário Bruto',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'totalDescontos',
        header: 'Retenções Táticas',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'salarioLiquido',
        header: 'Líquido a Pagar',
        type: 'currency',
        format: 'BRL',
        width: '140px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'margemLiquida',
        header: 'Eficiência Líquida (%)',
        width: '170px',
        align: 'center',
        sortable: true,
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.margemLiquida',
              total: 100,
              toneExpr: 'row.margemTone',
              fallbackText: 'Margem',
            },
          },
        },
      },
      {
        field: 'dataPagamento',
        header: 'Data de Pagamento',
        type: 'date',
        width: '150px',
        align: 'center',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar folha por colaborador, mês ou ano...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Ciclos', filter: '', icon: 'receipt_long' },
          { id: 'mesAtual', label: 'Competência Vigente (03/2026)', filter: 'mes=3 and ano=2026', icon: 'today' },
          { id: 'anoAtual', label: 'Exercício 2026', filter: 'ano=2026', icon: 'calendar_month' },
          { id: 'anoAnterior', label: 'Exercício 2025', filter: 'ano=2025', icon: 'history' },
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
          schemaUrl: '/schemas/filtered?path=/api/human-resources/folhas-pagamento/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['mes', 'ano', 'funcionarioId'],
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
                title: 'Dossiê do Ciclo de Compensação & Liquidação',
                subtitle: 'Discriminação de proventos, encargos operacionais e liquidação bancária',
                columns: 3,
                minCardWidth: 280,
                cards: [
                  {
                    id: 'card-demonstrativo',
                    title: 'Demonstrativo Salarial',
                    subtitle: 'Valores brutos e créditos',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'badge',
                            labelExpr: 'row.statusTransferencia',
                            icon: 'account_balance',
                          },
                          {
                            type: 'metric',
                            label: 'Salário Bruto Tático',
                            valueExpr: 'row.salarioBrutoFormatado',
                            icon: 'payments',
                          },
                          {
                            type: 'metric',
                            label: 'Líquido Disponível',
                            valueExpr: 'row.salarioLiquidoFormatado',
                            icon: 'account_balance_wallet',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-descontos',
                    title: 'Retenções & Encargos',
                    subtitle: 'Previdência e fundo de danos',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'progress',
                            label: 'Eficiência de Repasse Líquido',
                            valueExpr: 'row.margemLiquida',
                            max: 100,
                            showPercent: true,
                          },
                          {
                            type: 'metric',
                            label: 'Total de Retenções',
                            valueExpr: 'row.totalDescontosFormatado',
                            icon: 'price_check',
                          },
                          {
                            type: 'metric',
                            label: 'Competência',
                            valueExpr: 'row.mes + "/" + row.ano',
                            icon: 'calendar_month',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-liquidacao',
                    title: 'Liquidação & Identificação',
                    subtitle: 'Protocolo de tesouraria',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Data de Pagamento',
                            valueExpr: 'row.dataPagamentoFormatada || row.dataPagamento',
                            icon: 'event_available',
                          },
                          {
                            type: 'metric',
                            label: 'Colaborador Credenciado (ID)',
                            valueExpr: 'row.funcionarioId',
                            icon: 'badge',
                          },
                          {
                            type: 'metric',
                            label: 'Ciclo Contábil (ID)',
                            valueExpr: 'row.id',
                            icon: 'receipt',
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

export const FOLHA_PAGAMENTO_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'folha-kpi-grid',
      items: [
        {
          id: 'volume',
          label: 'Volume Folha Mensal',
          value: 'R$ 3,45M',
          caption: 'Competência ativa 03/2026',
          icon: 'account_balance_wallet',
          tone: 'info',
        },
        {
          id: 'consolidados',
          label: 'Registros Consolidados',
          value: '3.246 Ciclos',
          caption: 'Histórico fiscal e operacional',
          icon: 'receipt_long',
          tone: 'success',
        },
        {
          id: 'retencoes',
          label: 'Retenções & Encargos',
          value: 'R$ 868,7k',
          caption: 'Previdência, saúde e encargos',
          icon: 'savings',
          tone: 'warning',
        },
        {
          id: 'liquidacao',
          label: 'Próxima Liquidação',
          value: '28/03/2026',
          caption: 'Programada via tesouraria',
          icon: 'calendar_month',
          tone: 'neutral',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-folha-pagamento-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh-bg">
            <span class="material-symbols-outlined">account_balance_wallet</span>
            Compensação, Benefícios & Folha
          </div>
          <h1 class="title-gradient page-title">Folha de Pagamento & Retenções</h1>
          <p class="page-subtitle">
            Demonstrativos de remuneração de heróis, estipêndios táticos, encargos previdenciários e consolidação fiscal.
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
          <span>Exercício:</span>
        </div>

        <div class="scope-chips">
          <button
            type="button"
            class="scope-chip"
            [class.is-active]="activeFilterId() === 'all'"
            (click)="setFilter('all')"
          >
            <span class="material-symbols-outlined">receipt_long</span>
            <span>Todos os Ciclos</span>
            <span class="chip-count">3.246</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-ready"
            [class.is-active]="activeFilterId() === 'vigente'"
            (click)="setFilter('vigente')"
          >
            <span class="material-symbols-outlined">today</span>
            <span>Competência Vigente (03/2026)</span>
            <span class="chip-count">101</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-info"
            [class.is-active]="activeFilterId() === 'ano2026'"
            (click)="setFilter('ano2026')"
          >
            <span class="material-symbols-outlined">calendar_month</span>
            <span>Ano 2026</span>
            <span class="chip-count">303</span>
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
          crudId="heroes-hq-folha-crud"
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

    .tone-rh-bg {
      background: color-mix(in oklab, var(--primary) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--primary) 30%, transparent);
      color: var(--primary);
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
      border: 1px solid var(--border);
      background: color-mix(in oklab, var(--card) 70%, transparent);
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
      border: 1px solid var(--border);
      background: color-mix(in oklab, var(--card) 40%, transparent);
      color: var(--foreground);
      transition: all 0.2s ease;

      span.material-symbols-outlined { font-size: 16px; }

      .chip-count {
        padding: 2px 7px;
        border-radius: 10px;
        background: color-mix(in oklab, var(--muted) 80%, transparent);
        font-size: 0.75rem;
        font-weight: 700;
      }

      &:hover {
        background: color-mix(in oklab, var(--muted) 50%, transparent);
        border-color: color-mix(in oklab, var(--primary) 40%, var(--border));
      }

      &.is-active {
        background: color-mix(in oklab, var(--primary) 22%, transparent);
        border-color: var(--primary);
        color: var(--foreground);
        box-shadow: 0 0 16px color-mix(in oklab, var(--primary) 30%, transparent);

        .chip-count {
          background: var(--primary);
          color: #fff;
        }
      }

      &.chip-ready.is-active {
        background: color-mix(in oklab, var(--ready) 22%, transparent);
        border-color: var(--ready);
        .chip-count { background: var(--ready); color: #fff; }
      }

      &.chip-info.is-active {
        background: color-mix(in oklab, var(--primary) 22%, transparent);
        border-color: var(--primary);
        .chip-count { background: var(--primary); color: #fff; }
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
      border: 1px dashed var(--border);
      cursor: pointer;
      transition: all 0.15s ease;

      span { font-size: 16px; }

      &:hover {
        color: var(--foreground);
        border-color: var(--primary);
        background: color-mix(in oklab, var(--primary) 8%, transparent);
      }
    }

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class FolhaPagamentoPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'vigente') {
      filterCriteria = { mes: 3, ano: 2026 };
    } else if (filterId === 'ano2026') {
      filterCriteria = { ano: 2026 };
    }

    return {
      ...FOLHA_PAGAMENTO_CRUD_METADATA,
      filterCriteria,
    };
  });

  protected readonly kpiDocument = signal<RichContentDocument>(FOLHA_PAGAMENTO_KPI_DOCUMENT);

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
    if (text.includes('volume') || text.includes('competência') || text.includes('mensal')) {
      this.setFilter('vigente');
    } else if (text.includes('consolidados') || text.includes('ciclos')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getPayrollTacticalKpis().subscribe((kpis) => {
      const volumeM = (kpis.monthlyGrossVolume / 1_000_000).toFixed(2);
      const retencoesK = (kpis.monthlyDeductions / 1_000).toFixed(1);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'folha-kpi-grid',
            items: [
              {
                id: 'volume',
                label: 'Volume Folha Mensal',
                value: `R$ ${volumeM}M`,
                caption: `Competência ${kpis.activeCompetence}`,
                icon: 'account_balance_wallet',
                tone: 'info',
              },
              {
                id: 'consolidados',
                label: 'Registros Consolidados',
                value: `${kpis.totalCycles} Ciclos`,
                caption: 'Histórico fiscal e operacional',
                icon: 'receipt_long',
                tone: 'success',
              },
              {
                id: 'retencoes',
                label: 'Retenções & Encargos',
                value: `R$ ${retencoesK}k`,
                caption: 'Previdência, saúde e encargos',
                icon: 'savings',
                tone: 'warning',
              },
              {
                id: 'liquidacao',
                label: 'Próxima Liquidação',
                value: kpis.nextPaymentDate,
                caption: 'Programada via tesouraria',
                icon: 'calendar_month',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
