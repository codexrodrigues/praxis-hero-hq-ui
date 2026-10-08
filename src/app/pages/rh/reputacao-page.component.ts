import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { PraxisChartComponent, type PraxisChartConfig } from '@praxisui/charts';
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';

export const REPUTACAO_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/vw-ranking-reputacao',
    idField: 'funcionarioId',
  },
  table: {
    columns: [
      {
        field: 'posicao',
        header: 'Pos.',
        width: '70px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'codinome',
        header: 'Codinome / Identidade Heroica',
        width: '180px',
        sortable: true,
      },
      {
        field: 'media',
        header: 'Score Médio Global',
        width: '170px',
        align: 'center',
        sortable: true,
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.mediaScore',
              total: 100,
              toneExpr: 'row.mediaTone',
              fallbackText: 'Score',
            },
          },
        },
      },
      {
        field: 'nomeCompleto',
        header: 'Nome Civil',
        width: '180px',
        sortable: true,
      },
      {
        field: 'equipe',
        header: 'Equipe Vinculada',
        width: '160px',
        sortable: true,
      },
      {
        field: 'scorePublico',
        header: 'Aprovação Civil (%)',
        type: 'number',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'scoreGovernamental',
        header: 'Confiança Governo (%)',
        type: 'number',
        width: '150px',
        align: 'center',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar heróis por codinome, nome civil ou equipe...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Heróis', filter: '', icon: 'groups' },
          { id: 'top90', label: 'Score 90%+', filter: 'media >= 90', icon: 'military_tech' },
          { id: 'top80', label: 'Score 80%+', filter: 'media >= 80', icon: 'trending_up' },
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
                title: 'Dossiê de Reputação & Relações Públicas',
                subtitle: 'Auditoria de imagem governamental, opinião pública e impacto da atuação heroica',
                columns: 3,
                minCardWidth: 280,
                cards: [
                  {
                    id: 'card-indices',
                    title: 'Opinião Pública & Governo',
                    subtitle: 'Chancelas civis e estatais',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'badge',
                            labelExpr: 'row.statusImagem',
                            icon: 'military_tech',
                          },
                          {
                            type: 'metric',
                            label: 'Aprovação Civil Popular',
                            valueExpr: 'row.scorePublicoPercentual',
                            icon: 'public',
                          },
                          {
                            type: 'metric',
                            label: 'Confiança Governamental',
                            valueExpr: 'row.scoreGovernamentalPercentual',
                            icon: 'account_balance',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-auditoria',
                    title: 'Mídia & Opinião Global',
                    subtitle: 'Impacto midiático e redes',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'progress',
                            label: 'Score Médio Consolidado',
                            valueExpr: 'row.mediaScore',
                            max: 100,
                            showPercent: true,
                          },
                          {
                            type: 'metric',
                            label: 'Tendência de Mídia',
                            valueExpr: 'row.tendenciaMidia',
                            icon: 'trending_up',
                          },
                          {
                            type: 'metric',
                            label: 'Posição no Ranking',
                            valueExpr: 'row.posicao',
                            icon: 'workspace_premium',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'card-enquadramento',
                    title: 'Alocação & Protocolo',
                    subtitle: 'Equipe e diretrizes',
                    content: [
                      {
                        type: 'compose',
                        direction: 'column',
                        gap: 'sm',
                        items: [
                          {
                            type: 'metric',
                            label: 'Equipe Vinculada',
                            valueExpr: 'row.equipe',
                            icon: 'groups',
                          },
                          {
                            type: 'metric',
                            label: 'Identidade Heroica',
                            valueExpr: 'row.codinome',
                            icon: 'shield',
                          },
                          {
                            type: 'metric',
                            label: 'Nome de Registro Civil',
                            valueExpr: 'row.nomeCompleto',
                            icon: 'badge',
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

export const REPUTACAO_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'reputacao-kpi-grid',
      items: [
        {
          id: 'topHero',
          label: 'Herói #1 no Ranking',
          value: 'Carol Danvers',
          caption: '91,5% de média global consolidada',
          icon: 'trophy',
          tone: 'success',
        },
        {
          id: 'aprovacao',
          label: 'Aprovação Civil Média',
          value: '86,8%',
          caption: 'Amostragem em tempo real',
          icon: 'trending_up',
          tone: 'info',
        },
        {
          id: 'confianca',
          label: 'Confiança Institucional',
          value: '91,2%',
          caption: 'Chancela de reguladores civis',
          icon: 'verified',
          tone: 'neutral',
        },
        {
          id: 'monitorados',
          label: 'Quadro Monitorado',
          value: '101 Heróis',
          caption: 'Cobertura integral de todas as equipes',
          icon: 'groups',
          tone: 'warning',
        },
      ],
    },
  ],
};

export function buildReputacaoChartConfig(
  items: Array<{ heroi: string; civil: number; governo: number }>
): PraxisChartConfig {
  return {
    id: 'reputacao-top7-chart',
    type: 'bar',
    title: 'Top Heróis - Avaliação Reputacional Comparativa',
    subtitle: 'Aprovação civil e confiança institucional consolidadas',
    sizing: { mode: 'fixed', height: 320 },
    dataSource: {
      kind: 'local',
      items,
    },
    axes: {
      x: { field: 'heroi', type: 'category', label: 'Herói' },
      y: {
        type: 'value',
        label: 'Score (%)',
        min: 60,
        max: 100,
      },
    },
    series: [
      {
        id: 'civil',
        name: 'Aprovação Civil',
        type: 'bar',
        metric: { field: 'civil', aggregation: 'sum' },
        color: '#06b6d4',
      },
      {
        id: 'governo',
        name: 'Confiança Governo',
        type: 'bar',
        metric: { field: 'governo', aggregation: 'sum' },
        color: '#10b981',
      },
    ],
  };
}

@Component({
  selector: 'app-reputacao-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisChartComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh-bg">
            <span class="material-symbols-outlined">military_tech</span>
            Governança & Relações Públicas
          </div>
          <h1 class="title-gradient page-title">Ranking de Reputação & Confiança</h1>
          <p class="page-subtitle">
            Monitoramento de índices de aceitação pública e chancela governamental consolidados via view analítica canônica da Praxis.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Visual Chart Surface -->
      <section class="glass-panel chart-surface">
        <praxis-chart [config]="chartConfig()" height="340px" />
      </section>

      <!-- Canonical Metadata-Driven CRUD Runtime (Inspect-Only View) -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-reputacao-crud"
          [metadata]="crudMetadata"
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
      background: color-mix(in oklab, var(--rh) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--rh) 30%, transparent);
      color: var(--rh);
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

    .chart-surface {
      border-radius: 18px;
      padding: 24px;
      overflow: hidden;
    }

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class ReputacaoPageComponent implements OnInit, OnDestroy {
  protected readonly crudMetadata = REPUTACAO_CRUD_METADATA;
  protected readonly kpiDocument = signal<RichContentDocument>(REPUTACAO_KPI_DOCUMENT);
  protected readonly chartConfig = signal<PraxisChartConfig>(
    buildReputacaoChartConfig([
      { heroi: 'Captain Marvel', civil: 88, governo: 95 },
      { heroi: 'Solar Vanguard', civil: 83, governo: 99 },
      { heroi: 'Shadow Sentinel', civil: 94, governo: 86 },
      { heroi: 'Helix Titan', civil: 84, governo: 96 },
      { heroi: 'Solar Comet', civil: 95, governo: 83 },
      { heroi: 'Iron Man', civil: 86, governo: 92 },
      { heroi: 'Aegis Sentinel', civil: 85, governo: 93 },
    ])
  );

  private readonly dashboardStats = inject(DashboardStatsService);
  private dataSub: Subscription | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
  }

  private loadData(): void {
    this.dataSub?.unsubscribe();
    this.dataSub = this.dashboardStats.getReputacaoTacticalData().subscribe((data) => {
      this.chartConfig.set(buildReputacaoChartConfig(data.chartItems));

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'reputacao-kpi-grid',
            items: [
              {
                id: 'topHero',
                label: 'Herói #1 no Ranking',
                value: data.topHeroName,
                caption: `${data.topHeroScore} de média consolidada`,
                icon: 'trophy',
                tone: 'success',
              },
              {
                id: 'aprovacao',
                label: 'Aprovação Civil Média',
                value: `${data.averagePublicScore.toString().replace('.', ',')}%`,
                caption: 'Índice de sentimento público',
                icon: 'trending_up',
                tone: 'info',
              },
              {
                id: 'confianca',
                label: 'Confiança Institucional',
                value: `${data.averageGovScore.toString().replace('.', ',')}%`,
                caption: 'Chancela de reguladores civis',
                icon: 'verified',
                tone: 'neutral',
              },
              {
                id: 'monitorados',
                label: 'Quadro Monitorado',
                value: `${data.monitoredHeroes} Heróis`,
                caption: 'Cobertura integral de todas as equipes',
                icon: 'groups',
                tone: 'warning',
              },
            ],
          },
        ],
      });
    });
  }
}
