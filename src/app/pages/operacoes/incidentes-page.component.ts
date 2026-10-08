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
import { INCIDENT_ANALYTICAL_DRAWER_CONFIG } from './incident-drawer.config';

export const INCIDENTES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/incidentes',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'Registro',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'descricao',
        header: 'Descrição do Sinistro / Impacto',
        width: '320px',
        sortable: true,
      },
      {
        field: 'local',
        header: 'Teatro do Dano',
        width: '200px',
        sortable: true,
      },
      {
        field: 'severidade',
        header: 'Severidade',
        width: '130px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'indiceSinistro',
        header: 'Índice de Danos',
        width: '180px',
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: '= round(min(100, (danosCivis / 4000000) * 100))',
              total: 100,
              toneExpr: {
                if: [
                  { '==': [{ var: 'severidade' }, 'CRITICA'] },
                  'danger',
                  { '==': [{ var: 'severidade' }, 'ALTA'] },
                  'warning',
                  'info',
                ],
              } as any,
              fallbackText: 'Índice de Danos',
            },
          },
        },
      },
      {
        field: 'danosCivis',
        header: 'Prejuízo Civil (R$)',
        type: 'currency',
        format: 'BRL',
        width: '170px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'feridos',
        header: 'Feridos',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'ocorridoEm',
        header: 'Data do Ocorrido',
        type: 'date',
        width: '150px',
        align: 'center',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar incidentes por local, descrição ou severidade...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Ocorrências', filter: '', icon: 'report' },
          { id: 'critico', label: 'Severidade Crítica', filter: "severidade='CRITICA'", icon: 'warning' },
          { id: 'alta', label: 'Alta Severidade', filter: "severidade='ALTA'", icon: 'crisis_alert' },
          { id: 'media', label: 'Severidade Moderada', filter: "severidade='MEDIA'", icon: 'info' },
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
          schemaUrl: '/schemas/filtered?path=/api/operations/incidentes/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['local', 'severidade', 'descricao'],
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
                title: 'Laudo Pericial Tático & Circunstâncias de Campo',
                subtitle: 'Dossiê preliminar de resposta emergencial, contenção civil e indenizações',
                columns: 3,
                minCardWidth: 280,
                cards: [
                  {
                    id: 'card-pericia',
                    title: 'Perícia & Teatro de Confronto',
                    subtitle: 'Circunstâncias e narrativa do sinistro',
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
                            label: 'Teatro do Dano',
                            valueExpr: 'row.local',
                            caption: 'Perímetro operacional catalogado',
                            icon: 'location_on',
                          },
                          {
                            type: 'metric',
                            label: 'Descrição Tática Forense',
                            valueExpr: 'row.descricao',
                            icon: 'description',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-financeiro',
                    title: 'Impacto Financeiro & Indenizações',
                    subtitle: 'Prejuízo civil apurado e cobertura',
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
                            caption: 'Fundo Tático de Compensação Civil',
                            icon: 'payments',
                          },
                          {
                            type: 'progress',
                            label: 'Índice de Gravidade Relativa',
                            valueExpr: '= round(min(100, (danosCivis / 4000000) * 100))',
                            max: 100,
                            showPercent: true,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-socorro',
                    title: 'Socorro Civil & Mobilização',
                    subtitle: 'Vítimas e protocolo médico',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Vítimas Feridas Catalogadas',
                            valueExpr: 'row.feridos',
                            caption: 'Atendimento de emergência prestado no local',
                            icon: 'medical_services',
                          },
                          {
                            type: 'metric',
                            label: 'Fatalidades Confirmadas',
                            valueExpr: 'row.mortos',
                            caption: 'Registro pericial S.H.I.E.L.D.',
                            icon: 'heart_broken',
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

export const INCIDENTES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'incidentes-kpi-grid',
      items: [
        {
          id: 'incidentes',
          label: 'Total de Ocorrências',
          value: '74 Registros',
          caption: 'Sinistros pós-combate catalogados',
          icon: 'report',
          tone: 'neutral',
        },
        {
          id: 'criticos',
          label: 'Severidade Crítica',
          value: '18 Casos Críticos',
          caption: 'Alto impacto civil e estrutural',
          icon: 'warning',
          tone: 'danger',
        },
        {
          id: 'danos',
          label: 'Danos Materiais Totais',
          value: 'R$ 154,4 M',
          caption: 'Cobertura via Fundo Tático de Indenizações',
          icon: 'account_balance',
          tone: 'warning',
        },
        {
          id: 'mitigacao',
          label: 'Taxa de Mitigação',
          value: '96,2% Contido',
          caption: 'Evacuação prévia e blindagem energética',
          icon: 'shield_with_heart',
          tone: 'success',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-incidentes-page',
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
          <div class="domain-tag tone-operations">
            <span class="material-symbols-outlined">crisis_alert</span>
            Operações & Gestão de Crise
          </div>
          <h1 class="title-gradient page-title">Incidentes Táticos & Danos Civis</h1>
          <p class="page-subtitle">
            Relatórios de impacto colateral, controle de contenção e compensações estruturais em teatro de confronto.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Tática de Escopo e Filtros Rápidos (Canonical PraxisScopeBar) -->
      <praxis-scope-bar
        [items]="scopeItems"
        [activeId]="activeFilterId()"
        leadLabel="Severidade:"
        leadIcon="crisis_alert"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="onScopeChange($event)"
        (clear)="setFilter('all')"
      />

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-incidentes-crud"
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

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class IncidentesPageComponent implements OnInit, OnDestroy {
  protected readonly incidentDrawerConfig = INCIDENT_ANALYTICAL_DRAWER_CONFIG;
  protected readonly selectedIncident = signal<Record<string, unknown> | null>(null);
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalIncidentes = signal<number>(74);
  protected readonly criticalIncidentes = signal<number>(18);
  protected readonly totalCivilDamages = signal<number>(154426000);
  protected readonly mitigationRate = signal<number>(96.2);

  protected readonly scopeItems: PraxisScopeBarItem[] = [
    { id: 'all', label: 'Todas as Ocorrências', count: 74, icon: 'report', tone: 'default', isDefault: true },
    { id: 'critico', label: 'Severidade Crítica', count: 18, icon: 'warning', tone: 'danger', filter: { severidade: 'CRITICA' } },
    { id: 'alta', label: 'Alta Severidade', count: 14, icon: 'crisis_alert', tone: 'warning', filter: { severidade: 'ALTA' } },
    { id: 'media', label: 'Moderados', count: 42, icon: 'info', tone: 'info', filter: { severidade: 'MEDIA' } },
  ];

  protected readonly kpiDocument = signal<RichContentDocument>(INCIDENTES_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'critico') {
      filterCriteria = { severidade: 'CRITICA' };
    } else if (filterId === 'alta') {
      filterCriteria = { severidade: 'ALTA' };
    } else if (filterId === 'media') {
      filterCriteria = { severidade: 'MEDIA' };
    }

    return {
      ...INCIDENTES_CRUD_METADATA,
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
      (event as { row?: Record<string, unknown>; data?: Record<string, unknown> })?.row ||
      (event as { row?: Record<string, unknown>; data?: Record<string, unknown> })?.data ||
      (event as Record<string, unknown>);
    if (row && (row['id'] != null || row['incidenteId'] != null)) {
      this.selectedIncident.set(row);
    }
  }

  protected onKpiCardClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const cardEl = target?.closest('.prx-stat-group__item, [data-stat-id], .prx-rich-card');
    if (!cardEl) return;

    const text = cardEl.textContent?.toLowerCase() ?? '';
    if (text.includes('severidade crítica') || text.includes('casos críticos')) {
      this.setFilter('critico');
    } else if (text.includes('mitigação') || text.includes('contido')) {
      this.setFilter('media');
    } else if (text.includes('total') || text.includes('ocorrências')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getIncidentesTacticalKpis().subscribe((kpis) => {
      this.totalIncidentes.set(kpis.totalIncidentes);
      this.criticalIncidentes.set(kpis.criticalIncidentes);
      this.totalCivilDamages.set(kpis.totalCivilDamages);
      this.mitigationRate.set(kpis.mitigationRate);

      const damagesMillion = (kpis.totalCivilDamages / 1_000_000).toFixed(1);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'incidentes-kpi-grid',
            items: [
              {
                id: 'incidentes',
                label: 'Total de Ocorrências',
                value: `${kpis.totalIncidentes} Registros`,
                caption: 'Sinistros pós-combate catalogados',
                icon: 'report',
                tone: 'neutral',
              },
              {
                id: 'criticos',
                label: 'Severidade Crítica',
                value: `${kpis.criticalIncidentes} Casos Críticos`,
                caption: 'Alto impacto civil e estrutural',
                icon: 'warning',
                tone: 'danger',
              },
              {
                id: 'danos',
                label: 'Danos Materiais Totais',
                value: `R$ ${damagesMillion} M`,
                caption: 'Cobertura via Fundo Tático de Indenizações',
                icon: 'account_balance',
                tone: 'warning',
              },
              {
                id: 'mitigacao',
                label: 'Taxa de Mitigação',
                value: `${kpis.mitigationRate}% Contido`,
                caption: 'Evacuação prévia e blindagem energética',
                icon: 'shield_with_heart',
                tone: 'success',
              },
            ],
          },
        ],
      });
    });
  }
}
