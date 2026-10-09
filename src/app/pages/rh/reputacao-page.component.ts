import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { PraxisChartComponent, type PraxisChartConfig } from '@praxisui/charts';
import { PraxisCrudComponent } from '@praxisui/crud';
import {
  REPUTACAO_CRUD_METADATA,
  buildReputacaoChartConfig,
} from './reputacao.config';

@Component({
  selector: 'app-reputacao-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisChartComponent],
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

      <!-- Visual Chart Surface -->
      <section class="glass-panel chart-surface">
        <praxis-chart [config]="chartConfig()" height="340px" />
      </section>

      <!-- Canonical Metadata-Driven CRUD Runtime with native kpiBand integration -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-reputacao-crud"
          [metadata]="crudMetadata"
        />
      </section>
    </div>
  `,
})
export class ReputacaoPageComponent {
  protected readonly crudMetadata = REPUTACAO_CRUD_METADATA;
  protected readonly chartConfig = signal<PraxisChartConfig>(
    buildReputacaoChartConfig([
      { heroi: 'Carol Danvers', civil: 95, governo: 98 },
      { heroi: 'Captain Marvel', civil: 88, governo: 95 },
      { heroi: 'Solar Vanguard', civil: 83, governo: 99 },
      { heroi: 'Shadow Sentinel', civil: 94, governo: 86 },
      { heroi: 'Helix Titan', civil: 84, governo: 96 },
      { heroi: 'Solar Comet', civil: 95, governo: 83 },
      { heroi: 'Iron Man', civil: 86, governo: 92 },
      { heroi: 'Aegis Sentinel', civil: 85, governo: 93 },
    ])
  );
}
