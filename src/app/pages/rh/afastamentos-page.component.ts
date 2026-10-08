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

export const AFASTAMENTOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/ferias-afastamentos',
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
        field: 'tipo',
        header: 'Tipo de Licença / Ausência',
        width: '180px',
        align: 'left',
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
        field: 'dataInicio',
        header: 'Início da Vigência',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '150px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'dataFim',
        header: 'Término Previsto',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '150px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'progressoRecuperacao',
        header: 'Progresso / Recuperação',
        width: '190px',
        align: 'center',
        sortable: true,
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.progressoRecuperacao',
              total: 100,
              toneExpr: 'row.leaveTone',
              fallbackText: 'Progresso',
            },
          },
        },
      },
      {
        field: 'observacoes',
        header: 'Observações / Parecer Operacional',
        width: '320px',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar afastamentos por tipo, colaborador ou observações...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Registros', filter: '', icon: 'history' },
          { id: 'ferias', label: 'Férias Regulamentares', filter: "tipo='FERIAS'", icon: 'beach_access' },
          { id: 'medica', label: 'Licença Médica / Recuperação', filter: "tipo='LICENCA_MEDICA' or tipo='MEDICA'", icon: 'health_and_safety' },
          { id: 'treinamento', label: 'Treinamento Tático', filter: "tipo='TREINAMENTO'", icon: 'model_training' },
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
          schemaUrl: '/schemas/filtered?path=/api/human-resources/ferias-afastamentos/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['tipo', 'funcionarioId', 'dataInicio'],
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
                title: 'Dossiê do Período de Afastamento & Escala Tática',
                subtitle: 'Acompanhamento clínico pós-combate, parecer médico e designação de contingente',
                columns: 3,
                minCardWidth: 280,
                cards: [
                  {
                    id: 'card-recuperacao',
                    title: 'Período & Motivo',
                    subtitle: 'Datas e enquadramento tático',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'badge',
                            labelExpr: 'row.tipo',
                            icon: 'event_busy',
                          },
                          {
                            type: 'metric',
                            label: 'Início da Vigência',
                            valueExpr: 'row.dataInicioFormatada || row.dataInicio',
                            icon: 'calendar_today',
                          },
                          {
                            type: 'metric',
                            label: 'Previsão de Retorno',
                            valueExpr: 'row.dataFimFormatada || row.dataFim',
                            icon: 'event_available',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-medico',
                    title: 'Laudo & Recuperação',
                    subtitle: 'Status biológico e regenerativo',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'progress',
                            label: 'Ciclo Regenerativo Concluído',
                            valueExpr: 'row.progressoRecuperacao',
                            max: 100,
                            showPercent: true,
                          },
                          {
                            type: 'metric',
                            label: 'Parecer da Ala Médica',
                            valueExpr: 'row.laudoMedico',
                            icon: 'medical_services',
                          },
                          {
                            type: 'metric',
                            label: 'Observações Gerais',
                            valueExpr: 'row.observacoes',
                            icon: 'clinical_notes',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-substituicao',
                    title: 'Substituição Operacional',
                    subtitle: 'Cobertura de posto tático',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Substituto Designado',
                            valueExpr: 'row.substitutoDesignado',
                            icon: 'person_pin',
                          },
                          {
                            type: 'metric',
                            label: 'Colaborador Afastado (ID)',
                            valueExpr: 'row.funcionarioId',
                            icon: 'badge',
                          },
                          {
                            type: 'metric',
                            label: 'Protocolo de Prontidão',
                            valueExpr: "'Protocolo Aegis Nível 2'",
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

export const AFASTAMENTOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'afastamentos-kpi-grid',
      items: [
        {
          id: 'ciclos',
          label: 'Total de Registros',
          value: '111 Registros',
          caption: 'Férias regulamentares e licenças',
          icon: 'history',
          tone: 'neutral',
        },
        {
          id: 'criticos',
          label: 'Casos Críticos / Graves',
          value: '51 Ocorrências',
          caption: 'Trauma de combate e regeneração',
          icon: 'health_and_safety',
          tone: 'danger',
        },
        {
          id: 'padrao',
          label: 'Licenças Padrão',
          value: '60 Registros',
          caption: 'Descanso e suporte preventivo',
          icon: 'event_available',
          tone: 'info',
        },
        {
          id: 'dias',
          label: 'Dias em Recuperação',
          value: '1.204 Dias',
          caption: 'Total acumulado em afastamento',
          icon: 'calendar_month',
          tone: 'warning',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-afastamentos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh-bg">
            <span class="material-symbols-outlined">event_busy</span>
            Gestão de Pessoas & Disponibilidade
          </div>
          <h1 class="title-gradient page-title">Férias & Afastamentos Táticos</h1>
          <p class="page-subtitle">
            Controle de períodos de descanso regulamentar, licenças médicas de recuperação pós-combate e escalas de substituição.
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
          <span>Tipo de Afastamento:</span>
        </div>

        <div class="scope-chips">
          <button
            type="button"
            class="scope-chip"
            [class.is-active]="activeFilterId() === 'all'"
            (click)="setFilter('all')"
          >
            <span class="material-symbols-outlined">history</span>
            <span>Todos os Registros</span>
            <span class="chip-count">{{ totalRegistros() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-danger"
            [class.is-active]="activeFilterId() === 'criticos'"
            (click)="setFilter('criticos')"
          >
            <span class="material-symbols-outlined">health_and_safety</span>
            <span>Médicas / Regeneração</span>
            <span class="chip-count">{{ criticalCases() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-ready"
            [class.is-active]="activeFilterId() === 'padrao'"
            (click)="setFilter('padrao')"
          >
            <span class="material-symbols-outlined">event_available</span>
            <span>Férias Regulamentares</span>
            <span class="chip-count">{{ standardCases() }}</span>
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
          crudId="heroes-hq-afastamentos-crud"
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

      &.chip-danger.is-active {
        background: color-mix(in oklab, var(--risk) 22%, transparent);
        border-color: var(--risk);
        .chip-count { background: var(--risk); color: #fff; }
      }

      &.chip-ready.is-active {
        background: color-mix(in oklab, var(--ready) 22%, transparent);
        border-color: var(--ready);
        .chip-count { background: var(--ready); color: #fff; }
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
export class AfastamentosPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalRegistros = signal<number>(111);
  protected readonly criticalCases = signal<number>(51);
  protected readonly standardCases = signal<number>(60);
  protected readonly totalDays = signal<number>(1204);

  protected readonly kpiDocument = signal<RichContentDocument>(AFASTAMENTOS_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'criticos') {
      filterCriteria = { tipo: 'LICENCA_MEDICA' };
    } else if (filterId === 'padrao') {
      filterCriteria = { tipo: 'FERIAS' };
    }

    return {
      ...AFASTAMENTOS_CRUD_METADATA,
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
    if (text.includes('graves') || text.includes('críticos') || text.includes('regeneração')) {
      this.setFilter('criticos');
    } else if (text.includes('padrão') || text.includes('férias') || text.includes('descanso')) {
      this.setFilter('padrao');
    } else if (text.includes('total') || text.includes('registros')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getAfastamentosTacticalKpis().subscribe((kpis) => {
      this.totalRegistros.set(kpis.totalRecords);
      this.criticalCases.set(kpis.criticalCases);
      this.standardCases.set(kpis.standardLeaves);
      this.totalDays.set(kpis.totalDaysAway);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'afastamentos-kpi-grid',
            items: [
              {
                id: 'ciclos',
                label: 'Total de Registros',
                value: `${kpis.totalRecords} Registros`,
                caption: 'Férias regulamentares e licenças',
                icon: 'history',
                tone: 'neutral',
              },
              {
                id: 'criticos',
                label: 'Casos Críticos / Graves',
                value: `${kpis.criticalCases} Ocorrências`,
                caption: 'Trauma de combate e regeneração',
                icon: 'health_and_safety',
                tone: 'danger',
              },
              {
                id: 'padrao',
                label: 'Licenças Padrão',
                value: `${kpis.standardLeaves} Registros`,
                caption: 'Descanso e suporte preventivo',
                icon: 'event_available',
                tone: 'info',
              },
              {
                id: 'dias',
                label: 'Dias em Recuperação',
                value: `${kpis.totalDaysAway} Dias`,
                caption: 'Total acumulado em afastamento',
                icon: 'calendar_month',
                tone: 'warning',
              },
            ],
          },
        ],
      });
    });
  }
}
