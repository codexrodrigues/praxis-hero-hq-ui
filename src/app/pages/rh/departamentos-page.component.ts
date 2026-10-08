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
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';

export const DEPARTAMENTOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/departamentos',
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
        header: 'Nome da Divisão',
        width: '280px',
        sortable: true,
      },
      {
        field: 'codigo',
        header: 'Sigla / Código',
        width: '130px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'ocupacaoScore',
        header: 'Taxa de Ocupação',
        width: '180px',
        align: 'center',
        sortable: true,
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.ocupacaoScore',
              total: 100,
              toneExpr: 'row.ocupacaoTone',
              fallbackText: 'Ocupação',
            },
          },
        },
      },
      {
        field: 'responsavelNome',
        header: 'Diretor / Líder Responsável',
        width: '260px',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar divisões por nome, sigla ou diretor responsável...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Divisões', filter: '', icon: 'corporate_fare' },
          { id: 'operacoes', label: 'Operações & Defesa', filter: "codigo='OP' or codigo='TAC' or codigo='DEF'", icon: 'shield' },
          { id: 'pesquisa', label: 'P&D e Tecnologia', filter: "codigo='RD' or codigo='TECH' or codigo='LAB'", icon: 'science' },
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
          schemaUrl: '/schemas/filtered?path=/api/human-resources/departamentos/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['nome', 'codigo', 'responsavelNome'],
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
                title: 'Dossiê da Divisão & Organização Tática',
                subtitle: 'Estrutura administrativa, liderança setorial e contingente alocado',
                columns: 3,
                minCardWidth: 280,
                cards: [
                  {
                    id: 'card-estrutura',
                    title: 'Estrutura & Identificação',
                    subtitle: 'Divisão e código setorial',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'badge',
                            labelExpr: 'row.codigo',
                            icon: 'corporate_fare',
                          },
                          {
                            type: 'metric',
                            label: 'Divisão',
                            valueExpr: 'row.nome',
                            icon: 'business',
                          },
                          {
                            type: 'metric',
                            label: 'Instalação / Local',
                            valueExpr: 'row.salaComando',
                            icon: 'apartment',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-lideranca',
                    title: 'Liderança & Governança',
                    subtitle: 'Diretoria e credenciamento',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Líder / Diretor',
                            valueExpr: 'row.responsavelNome',
                            icon: 'military_tech',
                          },
                          {
                            type: 'metric',
                            label: 'Credencial de Acesso',
                            valueExpr: 'row.nivelSigilo',
                            icon: 'lock',
                          },
                          {
                            type: 'metric',
                            label: 'ID Cadastral',
                            valueExpr: 'row.id',
                            icon: 'tag',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-contingente',
                    title: 'Contingente & Ocupação',
                    subtitle: 'Capacidade e alocação humana',
                    content: [
                      {
                        type: 'progress',
                        label: 'Taxa de Ocupação do Setor',
                        valueExpr: 'row.ocupacaoScore',
                        max: 100,
                        showPercent: true,
                      },
                      {
                        type: 'metric',
                        label: 'Especialistas Ativos',
                        valueExpr: 'row.contingenteTotal',
                        icon: 'groups',
                      },
                      {
                        type: 'metric',
                        label: 'Prontidão Operacional',
                        valueExpr: "'99.8% Operante'",
                        icon: 'verified',
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

export const DEPARTAMENTOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'departamentos-kpi-grid',
      items: [
        {
          id: 'divisoes',
          label: 'Divisões Ativas',
          value: '28 Departamentos',
          caption: 'Estrutura operacional e estratégica',
          icon: 'corporate_fare',
          tone: 'info',
        },
        {
          id: 'liderancas',
          label: 'Lideranças Nomeadas',
          value: '96,4% Cobertura',
          caption: 'Diretoria e supervisão tática',
          icon: 'military_tech',
          tone: 'success',
        },
        {
          id: 'cargos',
          label: 'Cargos Mapeados',
          value: '15 Funções',
          caption: 'Catálogo de carreiras ativas',
          icon: 'account_tree',
          tone: 'warning',
        },
        {
          id: 'senioridade',
          label: 'Níveis de Carreira',
          value: '5 Níveis',
          caption: 'Do Júnior ao Executivo/Diretor',
          icon: 'trending_up',
          tone: 'neutral',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-departamentos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh-bg">
            <span class="material-symbols-outlined">domain</span>
            Organização & Estrutura Tática
          </div>
          <h1 class="title-gradient page-title">Cargos & Departamentos</h1>
          <p class="page-subtitle">
            Estrutura hierárquica, divisões de pesquisa avançada, inteligência de campo e lideranças setoriais.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Scope Bar Canônico da Plataforma Praxis -->
      <praxis-scope-bar
        leadLabel="Estrutura"
        leadIcon="tune"
        [items]="scopeBarItems()"
        [activeId]="activeFilterId()"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="setFilter($event.id)"
        (clear)="setFilter('all')"
      />

      <!-- Tabela CRUD Governança Canônica -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-departamentos-crud"
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

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class DepartamentosPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalDepartamentos = signal<number>(28);
  protected readonly totalCargos = signal<number>(15);

  protected readonly scopeBarItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todas as Divisões',
      icon: 'corporate_fare',
      filter: {},
      count: this.totalDepartamentos(),
      isDefault: true,
    },
    {
      id: 'liderancas',
      label: 'Lideranças Ativas',
      icon: 'military_tech',
      filter: {},
      badge: '96,4%',
      tone: 'ready',
    },
    {
      id: 'cargos',
      label: 'Funções Mapeadas',
      icon: 'account_tree',
      filter: {},
      count: this.totalCargos(),
      tone: 'info',
    },
  ]);

  protected readonly kpiDocument = signal<RichContentDocument>(DEPARTAMENTOS_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    return {
      ...DEPARTAMENTOS_CRUD_METADATA,
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

    this.setFilter('all');
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getDepartamentosTacticalKpis().subscribe((kpis) => {
      this.totalDepartamentos.set(kpis.totalDepartamentos);
      this.totalCargos.set(kpis.totalCargos);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'departamentos-kpi-grid',
            items: [
              {
                id: 'divisoes',
                label: 'Divisões Ativas',
                value: `${kpis.totalDepartamentos} Departamentos`,
                caption: 'Estrutura operacional e estratégica',
                icon: 'corporate_fare',
                tone: 'info',
              },
              {
                id: 'liderancas',
                label: 'Lideranças Nomeadas',
                value: `${kpis.leadershipCoverage}% Cobertura`,
                caption: 'Diretoria e supervisão tática',
                icon: 'military_tech',
                tone: 'success',
              },
              {
                id: 'cargos',
                label: 'Cargos Mapeados',
                value: `${kpis.totalCargos} Funções`,
                caption: 'Catálogo de carreiras ativas',
                icon: 'account_tree',
                tone: 'warning',
              },
              {
                id: 'senioridade',
                label: 'Níveis de Carreira',
                value: `${kpis.careerLevels} Níveis`,
                caption: 'Do Júnior ao Executivo/Diretor',
                icon: 'trending_up',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
