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
import { PraxisCrudComponent } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';
import {
  REPUTACAO_CRUD_METADATA,
  REPUTACAO_KPI_DOCUMENT,
  buildReputacaoChartConfig,
} from './reputacao.config';

@Component({
  selector: 'app-reputacao-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisChartComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh">
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
