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
        field: 'prontidaoScore',
        header: 'Prontidão Operacional',
        width: '180px',
        align: 'center',
        sortable: true,
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.prontidaoScore',
              total: 100,
              toneExpr: 'row.prontidaoTone',
              fallbackText: 'Prontidão',
            },
          },
        },
      },
      {
        field: 'status',
        header: 'Status Tático',
        width: '140px',
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
                title: 'Dossiê do Esquadrão & Desdobramento Operacional',
                subtitle: 'Composição tática de agentes, base de operações e prontidão de resposta',
                columns: 3,
                minCardWidth: 280,
                cards: [
                  {
                    id: 'card-esquadrao',
                    title: 'Esquadrão & Base',
                    subtitle: 'Identificação e base designada',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'badge',
                            labelExpr: 'row.sigla',
                            icon: 'shield',
                          },
                          {
                            type: 'metric',
                            label: 'Base Designada',
                            valueExpr: 'row.basePrincipalNome',
                            icon: 'domain',
                          },
                          {
                            type: 'metric',
                            label: 'Status Tático',
                            valueExpr: 'row.status',
                            icon: 'flag',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-capacidade',
                    title: 'Prontidão & Histórico',
                    subtitle: 'Capacidade e telemetria',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'progress',
                            label: 'Prontidão Operacional do Squad',
                            valueExpr: 'row.prontidaoScore',
                            max: 100,
                            showPercent: true,
                          },
                          {
                            type: 'metric',
                            label: 'Efetivo de Operadores',
                            valueExpr: 'row.efetivoOperacional',
                            icon: 'groups',
                          },
                          {
                            type: 'metric',
                            label: 'Histórico de Missões',
                            valueExpr: 'row.historicoMissoes',
                            icon: 'military_tech',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-lideranca',
                    title: 'Liderança & Acesso',
                    subtitle: 'Comando e autorização',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Líder Tático',
                            valueExpr: 'row.liderTatico',
                            icon: 'person_star',
                          },
                          {
                            type: 'metric',
                            label: 'Nível de Autorização',
                            valueExpr: 'row.nivelAcessoEquipe',
                            icon: 'verified_user',
                          },
                          {
                            type: 'metric',
                            label: 'ID do Esquadrão',
                            valueExpr: 'row.id',
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
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent, PraxisScopeBarComponent],
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

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Status Tático:"
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

  protected readonly scopeItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todos os Esquadrões',
      icon: 'diversity_3',
      count: this.totalEquipes(),
    },
    {
      id: 'ativa',
      label: 'Prontidão Máxima',
      icon: 'verified_user',
      tone: 'ready',
      count: this.activeEquipes(),
    },
    {
      id: 'reserva',
      label: 'Reserva / Standby',
      icon: 'shield',
      tone: 'warning',
      count: this.reserveEquipes(),
    },
  ]);

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
