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

export const VEICULOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'assets/veiculos',
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
        header: 'Identificação da Unidade',
        width: '240px',
        sortable: true,
      },
      {
        field: 'tipo',
        header: 'Plataforma',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'prontidao',
        header: 'Prontidão de Voo',
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
        field: 'capacidade',
        header: 'Tripulação / Carga',
        type: 'number',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'proprietarioNome',
        header: 'Custodiante / Piloto',
        width: '220px',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Disponibilidade',
        width: '150px',
        align: 'center',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar veículos por nome, categoria ou piloto...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Toda a Frota', filter: '', icon: 'rocket_launch' },
          { id: 'operacional', label: 'Em Operação / Prontidão', filter: "status='OPERACIONAL'", icon: 'verified' },
          { id: 'manutencao', label: 'Em Manutenção / Hangar', filter: "status='MANUTENCAO'", icon: 'build' },
          { id: 'aerea', label: 'Aeronaves & Espaciais', filter: "tipo='AERONAVE' or tipo='ESPACIAL'", icon: 'flight' },
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
          schemaUrl: '/schemas/filtered?path=/api/assets/veiculos/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['nome', 'tipo', 'status', 'proprietarioNome'],
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
                title: 'Dossiê Técnico & Hangar Operacional',
                subtitle: 'Especificações aeroespaciais, capacidade de propulsão e telemetria de frota',
                columns: 3,
                minCardWidth: 280,
                cards: [
                  {
                    id: 'card-propulsao',
                    title: 'Propulsão & Performance',
                    subtitle: 'Motores, turbinas e velocidade limite',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Sistema de Propulsão',
                            valueExpr: 'row.sistemaPropulsao',
                            icon: 'mode_fan',
                          },
                          {
                            type: 'metric',
                            label: 'Velocidade Máxima',
                            valueExpr: 'row.velocidadeMax',
                            icon: 'speed',
                          },
                          {
                            type: 'metric',
                            label: 'Autonomia de Voo',
                            valueExpr: 'row.autonomiaVoo',
                            icon: 'flight_takeoff',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-hangar',
                    title: 'Telemetria de Hangar',
                    subtitle: 'Armazenamento e combustível',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Hangar de Alocação',
                            valueExpr: 'row.hangarAlocacao',
                            icon: 'warehouse',
                          },
                          {
                            type: 'metric',
                            label: 'Carga de Baterias / Combustível',
                            valueExpr: 'row.nivelCombustivel',
                            icon: 'local_gas_station',
                          },
                          {
                            type: 'metric',
                            label: 'Blindagem do Casco',
                            valueExpr: 'row.blindagemCasco',
                            icon: 'security',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-piloto',
                    title: 'Piloto & Sortie Tática',
                    subtitle: 'Comandante e capacidade de missão',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'badge',
                            labelExpr: 'row.status',
                            icon: 'verified',
                          },
                          {
                            type: 'metric',
                            label: 'Piloto Credenciado',
                            valueExpr: 'row.proprietarioNome',
                            icon: 'person_pin',
                          },
                          {
                            type: 'metric',
                            label: 'Capacidade Total',
                            valueExpr: 'row.capacidade',
                            icon: 'airline_seat_recline_extra',
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

export const VEICULOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'veiculos-kpi-grid',
      items: [
        {
          id: 'registradas',
          label: 'Unidades na Frota',
          value: '8 Veículos',
          caption: 'Aeronaves, hovercrafts e terrestres',
          icon: 'rocket_launch',
          tone: 'info',
        },
        {
          id: 'operacionais',
          label: 'Prontidão de Voo',
          value: '5 Disponíveis',
          caption: 'Abastecidos e prontos para decolagem',
          icon: 'verified',
          tone: 'success',
        },
        {
          id: 'manutencao',
          label: 'Em Revisão / Hangar',
          value: '2 em Manutenção',
          caption: 'Calibragem de propulsores iônicos',
          icon: 'build',
          tone: 'warning',
        },
        {
          id: 'eficiencia',
          label: 'Taxa Operacional',
          value: '62,5% Ativo',
          caption: 'Capacidade de transporte de squads',
          icon: 'speed',
          tone: 'neutral',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-veiculos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-assets">
            <span class="material-symbols-outlined">rocket_launch</span>
            Patrimônio & Frota Operacional
          </div>
          <h1 class="title-gradient page-title">Frota Tática & Veículos</h1>
          <p class="page-subtitle">
            Gestão de Quinjets, aeronaves suborbitais, tanques blindados, hovercrafts e cápsulas de resgate tático.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Disponibilidade:"
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
          crudId="heroes-hq-veiculos-crud"
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

    .tone-assets {
      background: color-mix(in oklab, var(--primary) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--primary) 30%, transparent);
      color: var(--primary);
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
export class VeiculosPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalVeiculos = signal<number>(8);
  protected readonly operational = signal<number>(5);
  protected readonly maintenance = signal<number>(2);
  protected readonly readinessRate = signal<number>(62.5);

  protected readonly scopeItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Toda a Frota',
      icon: 'rocket_launch',
      count: this.totalVeiculos(),
    },
    {
      id: 'operacional',
      label: 'Em Operação',
      icon: 'verified',
      tone: 'ready',
      count: this.operational(),
    },
    {
      id: 'manutencao',
      label: 'Em Revisão',
      icon: 'build',
      tone: 'warning',
      count: this.maintenance(),
    },
  ]);

  protected readonly kpiDocument = signal<RichContentDocument>(VEICULOS_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'operacional') {
      filterCriteria = { status: 'OPERACIONAL' };
    } else if (filterId === 'manutencao') {
      filterCriteria = { status: 'MANUTENCAO' };
    }

    return {
      ...VEICULOS_CRUD_METADATA,
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
    if (text.includes('prontidão') || text.includes('disponíveis')) {
      this.setFilter('operacional');
    } else if (text.includes('revisão') || text.includes('manutenção')) {
      this.setFilter('manutencao');
    } else if (text.includes('frota') || text.includes('unidades')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getVeiculosTacticalKpis().subscribe((kpis) => {
      this.totalVeiculos.set(kpis.totalVeiculos);
      this.operational.set(kpis.operational);
      this.maintenance.set(kpis.maintenance);
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
            className: 'veiculos-kpi-grid',
            items: [
              {
                id: 'registradas',
                label: 'Unidades na Frota',
                value: `${kpis.totalVeiculos} Veículos`,
                caption: 'Aeronaves, hovercrafts e terrestres',
                icon: 'rocket_launch',
                tone: 'info',
              },
              {
                id: 'operacionais',
                label: 'Prontidão de Voo',
                value: `${kpis.operational} Disponíveis`,
                caption: 'Abastecidos e prontos para decolagem',
                icon: 'verified',
                tone: 'success',
              },
              {
                id: 'manutencao',
                label: 'Em Revisão / Hangar',
                value: `${kpis.maintenance} em Manutenção`,
                caption: 'Calibragem de propulsores iônicos',
                icon: 'build',
                tone: 'warning',
              },
              {
                id: 'eficiencia',
                label: 'Taxa Operacional',
                value: `${kpis.readinessRate}% Ativo`,
                caption: 'Capacidade de transporte de squads',
                icon: 'speed',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
