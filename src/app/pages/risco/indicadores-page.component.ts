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
import { INCIDENT_ANALYTICAL_DRAWER_CONFIG } from '../operacoes/incident-drawer.config';

export const INDICADORES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'risk-intelligence/vw-indicadores-incidentes',
    idField: 'incidenteId',
  },
  table: {
    meta: { idField: 'incidenteId' },
    idField: 'incidenteId',
    columns: [
      {
        field: 'incidenteId',
        header: 'Registro',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'missao',
        header: 'Missão de Origem',
        width: '200px',
        sortable: true,
      },
      {
        field: 'local',
        header: 'Local do Dano',
        width: '150px',
        sortable: true,
      },
      {
        field: 'severidade',
        header: 'Severidade',
        width: '120px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'statusLiquidacao',
        header: 'Taxa de Liquidação',
        width: '180px',
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: '= round(min(100, (totalPago / max(1, totalIndenizacoes)) * 100))',
              total: 100,
              toneExpr: {
                if: [
                  { '==': [{ var: 'totalPendente' }, 0] },
                  'success',
                  { '==': [{ var: 'severidade' }, 'CRITICA'] },
                  'danger',
                  { '==': [{ var: 'severidade' }, 'ALTA'] },
                  'warning',
                  'info',
                ],
              } as any,
              fallbackText: 'Taxa de Liquidação',
            },
          },
        },
      },
      {
        field: 'danosCivis',
        header: 'Prejuízo Civil Estimado',
        type: 'currency',
        format: 'BRL',
        width: '170px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'totalIndenizacoes',
        header: 'Indenizações Totais',
        type: 'currency',
        format: 'BRL',
        width: '170px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'totalPago',
        header: 'Total Indenizado',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'totalPendente',
        header: 'Saldo Pendente',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar sinistros por local, missão ou descrição...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Sinistros', filter: '', icon: 'account_balance' },
          { id: 'critico', label: 'Severidade Crítica', filter: "severidade='CRITICA'", icon: 'warning' },
          { id: 'pendente', label: 'Saldo Pendente', filter: 'totalPendente > 0', icon: 'pending' },
          { id: 'homologado', label: '100% Homologado', filter: 'totalPendente = 0', icon: 'verified' },
        ],
        showAdvancedButton: true,
      },
    },
    behavior: {
      filtering: {
        columnFilters: {
          enabled: true,
        },
      },
      expansion: {
        enabled: true,
        contractVersion: '1.0.0',
        identity: { rowKeySource: 'table.idField', requireStableIdField: false },
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
                    title: 'Auditoria Fiduciária & Conformidade de Sinistro',
                    subtitle: 'Protocolo regulatório regido pelas cláusulas do Acordo de Sokovia',
                    columns: 3,
                    minCardWidth: 280,
                    cards: [
                      {
                        id: 'card-origem',
                        title: 'Origem & Narrativa Pericial',
                        subtitle: 'Circunstâncias e missão associada',
                        content: [
                          {
                            type: 'compose',
                            direction: 'column',
                            gap: 'sm',
                            items: [
                              {
                                type: 'badge',
                                labelExpr: 'row.severidade',
                                icon: 'emergency',
                              },
                              {
                                type: 'metric',
                                label: 'Missão de Origem',
                                valueExpr: 'row.missao',
                                caption: 'Operação tática catalogada',
                                icon: 'military_tech',
                              },
                              {
                                type: 'metric',
                                label: 'Teatro do Dano',
                                valueExpr: 'row.local',
                                icon: 'location_on',
                              },
                              {
                                type: 'metric',
                                label: 'Laudo Pericial',
                                valueExpr: 'row.descricao',
                                icon: 'description',
                              },
                            ],
                          },
                        ],
                      },
                      {
                        id: 'card-financeiro-balanco',
                        title: 'Balanço Compensatório',
                        subtitle: 'Auditoria de valores e cobertura',
                        content: [
                          {
                            type: 'compose',
                            direction: 'column',
                            gap: 'sm',
                            items: [
                              {
                                type: 'metric',
                                label: 'Prejuízo Civil Estimado',
                                valueExpr: 'row.danosCivis',
                                caption: 'Sinistralidade apurada em campo',
                                icon: 'broken_image',
                              },
                              {
                                type: 'progress',
                                label: 'Índice de Liquidação de Indenizações',
                                valueExpr: '= round(min(100, (totalPago / max(1, totalIndenizacoes)) * 100))',
                                max: 100,
                                showPercent: true,
                              },
                              {
                                type: 'metric',
                                label: 'Total Já Liquidado',
                                valueExpr: 'row.totalPago',
                                caption: 'Repasses confirmados aos civis',
                                icon: 'payments',
                              },
                            ],
                          },
                        ],
                      },
                      {
                        id: 'card-sokovia-protocolo',
                        title: 'Fundo Tático S.H.I.E.L.D.',
                        subtitle: 'Status fiduciário e conciliação',
                        content: [
                          {
                            type: 'compose',
                            direction: 'column',
                            gap: 'sm',
                            items: [
                              {
                                type: 'metric',
                                label: 'Total Homologado',
                                valueExpr: 'row.totalIndenizacoes',
                                caption: 'Teto máximo pactuado em juízo',
                                icon: 'gavel',
                              },
                              {
                                type: 'metric',
                                label: 'Saldo Pendente de Repasse',
                                valueExpr: 'row.totalPendente',
                                caption: 'Aguardando validação pericial',
                                icon: 'pending_actions',
                              },
                              {
                                type: 'badge',
                                labelExpr: '= row.totalPendente == 0 ? "TOTALMENTE LIQUIDADO" : "CONCILIAÇÃO EM CURSO"',
                                icon: 'verified',
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

export const INDICADORES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'indicadores-kpi-grid',
      items: [
        {
          id: 'passivo',
          label: 'Sinistros com Passivo',
          value: '74 Casos',
          caption: 'Histórico de acordos regulados pelo HQ',
          icon: 'gavel',
          tone: 'danger',
        },
        {
          id: 'total',
          label: 'Volume de Indenizações',
          value: 'R$ 99,5 M',
          caption: 'Compensações acordadas com o judiciário',
          icon: 'payments',
          tone: 'warning',
        },
        {
          id: 'danos',
          label: 'Danos Civis Apurados',
          value: 'R$ 154,4 M',
          caption: 'Prejuízo material total auditado',
          icon: 'broken_image',
          tone: 'info',
        },
        {
          id: 'saldo',
          label: 'Saldo em Conciliação',
          value: 'R$ 72,8 M',
          caption: 'Em análise de perícia e fundos de seguro',
          icon: 'hourglass_top',
          tone: 'neutral',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-indicadores-page',
  standalone: true,
  imports: [
    CommonModule,
    PraxisCrudComponent,
    PraxisRichContent,
    PraxisAnalyticalDrawerComponent,
    PraxisScopeBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-risk">
            <span class="material-symbols-outlined">balance</span>
            Risco & Compensações Civis
          </div>
          <h1 class="title-gradient page-title">Indicadores de Risco & Indenizações</h1>
          <p class="page-subtitle">
            Auditoria financeira de acordos regulatórios, compensação patrimonial civil e passivo securitário de missões.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Tática de Escopo e Filtros Rápidos (Canonical PraxisScopeBar) -->
      <praxis-scope-bar
        [items]="scopeItems"
        [activeId]="activeFilterId()"
        leadLabel="Status do Passivo:"
        leadIcon="tune"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="onScopeChange($event)"
        (clear)="setFilter('all')"
      />

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-indicadores-crud"
          [metadata]="activeCrudMetadata()"
          (rowClick)="onIncidentRowClicked($event)"
        />
      </section>

      <!-- Tactical Incident Investigation Drawer (Canonical PraxisAnalyticalDrawer) -->
      <praxis-analytical-drawer
        [isOpen]="!!selectedIncident()"
        [row]="selectedIncident()"
        [drawerConfig]="incidentDrawerConfig"
        (closeDrawer)="selectedIncident.set(null)"
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
      background: color-mix(in oklab, var(--risk) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--risk) 30%, transparent);
      color: var(--risk);
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

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class IndicadoresPageComponent implements OnInit, OnDestroy {
  protected readonly incidentDrawerConfig = INCIDENT_ANALYTICAL_DRAWER_CONFIG;
  protected readonly selectedIncident = signal<Record<string, unknown> | null>(null);
  protected readonly activeFilterId = signal<string>('all');
  protected readonly scopeItems: PraxisScopeBarItem[] = [
    { id: 'all', label: 'Todos os Casos', count: 74, icon: 'account_balance', tone: 'default', isDefault: true },
    { id: 'critico', label: 'Passivo Crítico', count: 18, icon: 'warning', tone: 'danger', filter: { severidade: 'CRITICA' } },
    { id: 'pendente', label: 'Saldo em Aberto', count: 56, icon: 'pending', tone: 'warning' },
    { id: 'homologado', label: '100% Homologado', count: 18, icon: 'verified', tone: 'success' },
  ];

  protected readonly kpiDocument = signal<RichContentDocument>(INDICADORES_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'critico') {
      filterCriteria = { severidade: 'CRITICA' };
    } else if (filterId === 'pendente') {
      filterCriteria = { 'totalPendente >': 0 };
    } else if (filterId === 'homologado') {
      filterCriteria = { totalPendente: 0 };
    }

    return {
      ...INDICADORES_CRUD_METADATA,
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

  protected onScopeChange(item: PraxisScopeBarItem): void {
    this.setFilter(item.id);
  }

  protected onIncidentRowClicked(event: unknown): void {
    const row =
      (event as { row?: any; data?: any })?.row ||
      (event as { row?: any; data?: any })?.data ||
      (event as any);

    if (row) {
      this.selectedIncident.set({
        ...row,
        id: Number(row.incidenteId ?? row.id ?? 1),
      });
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getIndicadoresRiscoTacticalKpis().subscribe((kpis) => {
      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'indicadores-kpi-grid',
            items: [
              {
                id: 'passivo',
                label: 'Sinistros com Passivo',
                value: `${kpis.totalIncidentes} Casos`,
                caption: 'Histórico de acordos regulados pelo HQ',
                icon: 'gavel',
                tone: 'danger',
              },
              {
                id: 'total',
                label: 'Volume de Indenizações',
                value: `R$ ${kpis.totalIndenizacoesMillion} M`,
                caption: `Compensações acordadas (${kpis.liquidationRate}% liquidado)`,
                icon: 'payments',
                tone: 'warning',
              },
              {
                id: 'danos',
                label: 'Danos Civis Apurados',
                value: `R$ ${kpis.totalDanosMillion} M`,
                caption: 'Prejuízo material total auditado',
                icon: 'broken_image',
                tone: 'info',
              },
              {
                id: 'saldo',
                label: 'Saldo em Conciliação',
                value: `R$ ${kpis.totalPendenteMillion} M`,
                caption: 'Em análise de perícia e fundos de seguro',
                icon: 'hourglass_top',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
