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
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';

export const CONTRATOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'procurement/contracts',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'number',
        header: 'Nº do Contrato',
        width: '150px',
        sortable: true,
      },
      {
        field: 'supplierName',
        header: 'Fornecedor / Fabricante',
        width: '240px',
        sortable: true,
      },
      {
        field: 'indiceSla',
        header: 'Conformidade / SLA',
        width: '180px',
        align: 'center',
        sortable: true,
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.complianceScore',
              total: 100,
              toneExpr: 'row.slaTone',
              fallbackText: 'SLA',
            },
          },
        },
      },
      {
        field: 'currency',
        header: 'Moeda',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'validUntil',
        header: 'Vigência Até',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status Contratual',
        width: '150px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'disabledReason',
        header: 'Observações / Motivo',
        width: '240px',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar contratos por número, fornecedor ou motivo...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Contratos', filter: '', icon: 'description' },
          { id: 'active', label: 'Vigentes & Assinados', filter: "status='ACTIVE' or status='SIGNED'", icon: 'verified' },
          { id: 'expired', label: 'Contratos Expirados', filter: "status='EXPIRED'", icon: 'event_busy' },
          { id: 'draft', label: 'Em Minuta / Draft', filter: "status='DRAFT'", icon: 'edit_note' },
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
          schemaUrl: '/schemas/filtered?path=/api/procurement/contracts/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['supplierName', 'status', 'number'],
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
                title: 'Dossiê Contratual & Gestão de Fornecedores',
                subtitle: 'Cláusulas de suprimento, indicadores de entrega e governança orçamentária S.H.I.E.L.D.',
                columns: 3,
                minCardWidth: 280,
                cards: [
                  {
                    id: 'card-clausulas',
                    title: 'Cláusulas & Vigência',
                    subtitle: 'Prazos legais e prorrogações',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'badge',
                            labelExpr: 'row.status',
                            icon: 'description',
                          },
                          {
                            type: 'metric',
                            label: 'Fornecedor Credenciado',
                            valueExpr: 'row.supplierName',
                            icon: 'store',
                          },
                          {
                            type: 'metric',
                            label: 'Renovação',
                            valueExpr: 'row.renovacaoAutomatica',
                            icon: 'autorenew',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-sla',
                    title: 'Performance & SLA',
                    subtitle: 'Confiabilidade e penalidades',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'progress',
                            label: 'Índice de Conformidade de Entregas',
                            valueExpr: 'row.complianceScore',
                            max: 100,
                            showPercent: true,
                          },
                          {
                            type: 'metric',
                            label: 'Cláusula Penal',
                            valueExpr: 'row.penalidadeDescricao',
                            icon: 'policy',
                          },
                          {
                            type: 'metric',
                            label: 'Observações de Auditoria',
                            valueExpr: 'row.disabledReason',
                            icon: 'info',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-governanca',
                    title: 'Governança & Finanças',
                    subtitle: 'Moeda e gestão fiscal',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Gestor Responsável',
                            valueExpr: 'row.gestorContrato',
                            icon: 'supervisor_account',
                          },
                          {
                            type: 'metric',
                            label: 'Moeda de Faturamento',
                            valueExpr: 'row.currency',
                            icon: 'payments',
                          },
                          {
                            type: 'metric',
                            label: 'Protocolo Contratual',
                            valueExpr: 'row.number',
                            icon: 'pin',
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

export const CONTRATOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'contratos-kpi-grid',
      items: [
        {
          id: 'vigentes',
          label: 'Contratos Vigentes',
          value: '11 Ativos',
          caption: 'Acordos ativos e assinados com a base',
          icon: 'description',
          tone: 'info',
        },
        {
          id: 'total',
          label: 'Total de Contratos',
          value: '17 Cadastrados',
          caption: 'Volume total de acordos catalogados',
          icon: 'verified',
          tone: 'success',
        },
        {
          id: 'expirados',
          label: 'Contratos Expirados',
          value: '3 Requerem Ação',
          caption: 'Demandam aditivo ou substituição',
          icon: 'event_busy',
          tone: 'warning',
        },
        {
          id: 'draft',
          label: 'Em Minuta / Draft',
          value: '1 em Aprovação',
          caption: 'Aguardando validação jurídica e financeira',
          icon: 'edit_note',
          tone: 'neutral',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-contratos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-supplies">
            <span class="material-symbols-outlined">contract</span>
            Suprimentos & Aquisições Estratégicas
          </div>
          <h1 class="title-gradient page-title">Fornecedores & Contratos</h1>
          <p class="page-subtitle">
            Gestão de parceiros industriais, acordos de nível de serviço, peças de reposição e contratos corporativos.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Escopo Contratual:"
        leadIcon="tune"
        [items]="scopeItems()"
        [activeId]="activeFilterId()"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="setFilter($event.id)"
        (clear)="setFilter('all')"
      />

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-contratos-crud"
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

    .tone-supplies {
      background: color-mix(in oklab, var(--supplies) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--supplies) 30%, transparent);
      color: var(--supplies);
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

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class ContratosPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalContratos = signal<number>(17);
  protected readonly activeAndSigned = signal<number>(11);
  protected readonly expired = signal<number>(3);
  protected readonly draft = signal<number>(1);

  protected readonly kpiDocument = signal<RichContentDocument>(CONTRATOS_KPI_DOCUMENT);

  protected readonly scopeItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todos os Acordos',
      icon: 'description',
      count: this.totalContratos(),
    },
    {
      id: 'vigentes',
      label: 'Vigentes & Assinados',
      icon: 'verified',
      tone: 'ready',
      count: this.activeAndSigned(),
    },
    {
      id: 'expirados',
      label: 'Expirados',
      icon: 'event_busy',
      tone: 'warning',
      count: this.expired(),
    },
    {
      id: 'draft',
      label: 'Em Minuta / Draft',
      icon: 'edit_note',
      tone: 'info',
      count: this.draft(),
    },
  ]);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'vigentes') {
      filterCriteria = { status: 'ACTIVE' };
    } else if (filterId === 'expirados') {
      filterCriteria = { status: 'EXPIRED' };
    } else if (filterId === 'draft') {
      filterCriteria = { status: 'DRAFT' };
    }

    return {
      ...CONTRATOS_CRUD_METADATA,
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
    if (text.includes('vigentes') || text.includes('ativos')) {
      this.setFilter('vigentes');
    } else if (text.includes('expirados') || text.includes('requerem ação')) {
      this.setFilter('expirados');
    } else if (text.includes('minuta') || text.includes('draft') || text.includes('aprovação')) {
      this.setFilter('draft');
    } else if (text.includes('total') || text.includes('cadastrados')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getContratosTacticalKpis().subscribe((kpis) => {
      this.totalContratos.set(kpis.totalContratos);
      this.activeAndSigned.set(kpis.activeAndSigned);
      this.expired.set(kpis.expired);
      this.draft.set(kpis.draft);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'contratos-kpi-grid',
            items: [
              {
                id: 'vigentes',
                label: 'Contratos Vigentes',
                value: `${kpis.activeAndSigned} Ativos`,
                caption: 'Acordos ativos e assinados com a base',
                icon: 'description',
                tone: 'info',
              },
              {
                id: 'total',
                label: 'Total de Contratos',
                value: `${kpis.totalContratos} Cadastrados`,
                caption: 'Volume total de acordos catalogados',
                icon: 'verified',
                tone: 'success',
              },
              {
                id: 'expirados',
                label: 'Contratos Expirados',
                value: `${kpis.expired} Requerem Ação`,
                caption: 'Demandam aditivo ou substituição',
                icon: 'event_busy',
                tone: 'warning',
              },
              {
                id: 'draft',
                label: 'Em Minuta / Draft',
                value: `${kpis.draft} em Aprovação`,
                caption: 'Aguardando validação jurídica e financeira',
                icon: 'edit_note',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
