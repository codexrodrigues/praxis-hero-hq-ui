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
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';

export const BASES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/bases',
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
        header: 'Nome da Instalação / Base',
        width: '260px',
        sortable: true,
      },
      {
        field: 'tipo',
        header: 'Tipo de Instalação',
        width: '180px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'sigilo',
        header: 'Nível de Sigilo',
        width: '180px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'planeta',
        header: 'Planeta / Teatro',
        width: '160px',
        align: 'center',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  defaults: {
    openMode: 'drawer',
  },
};

export const BASES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'bases-kpi-grid',
      items: [
        {
          id: 'bases',
          label: 'Complexos Operacionais',
          value: '7 Instalações',
          caption: 'Quartéis-generais, torres e hangares',
          icon: 'home_pin',
          tone: 'info',
        },
        {
          id: 'sigilo',
          label: 'Segurança Máxima',
          value: '4 Bases Sigilosas',
          caption: 'Classificação Secreta ou Ultra-Secreta',
          icon: 'security',
          tone: 'danger',
        },
        {
          id: 'mundos',
          label: 'Teatros Planetários',
          value: '2 Mundos',
          caption: 'Operações terrestres e no espaço profundo',
          icon: 'public',
          tone: 'neutral',
        },
        {
          id: 'prontidao',
          label: 'Prontidão Logística',
          value: '100% Operacional',
          caption: 'Suporte imediato a todas as equipes',
          icon: 'verified_user',
          tone: 'success',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-bases-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-operations-bg">
            <span class="material-symbols-outlined">hub</span>
            Instalações & Infraestrutura Tática
          </div>
          <h1 class="title-gradient page-title">Bases & Níveis de Acesso</h1>
          <p class="page-subtitle">
            Gerenciamento de complexos militares, hangares, silos subterrâneos e postos avançados de apoio logístico.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Tabela CRUD Governança Canônica -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-bases-crud"
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

    .tone-operations-bg {
      background: color-mix(in oklab, var(--operations) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--operations) 30%, transparent);
      color: var(--operations);
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

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class BasesPageComponent implements OnInit, OnDestroy {
  protected readonly crudMetadata = BASES_CRUD_METADATA;
  protected readonly kpiDocument = signal<RichContentDocument>(BASES_KPI_DOCUMENT);

  private readonly dashboardStats = inject(DashboardStatsService);
  private kpiSub: Subscription | null = null;

  ngOnInit(): void {
    this.loadKpis();
  }

  ngOnDestroy(): void {
    this.kpiSub?.unsubscribe();
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getBasesTacticalKpis().subscribe((kpis) => {
      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'bases-kpi-grid',
            items: [
              {
                id: 'bases',
                label: 'Complexos Operacionais',
                value: `${kpis.totalBases} Instalações`,
                caption: 'Quartéis-generais, torres e hangares',
                icon: 'home_pin',
                tone: 'info',
              },
              {
                id: 'sigilo',
                label: 'Segurança Máxima',
                value: `${kpis.highSecurityBases} Bases Sigilosas`,
                caption: 'Classificação Secreta ou Ultra-Secreta',
                icon: 'security',
                tone: 'danger',
              },
              {
                id: 'mundos',
                label: 'Teatros Planetários',
                value: `${kpis.theaters} Mundos`,
                caption: 'Operações terrestres e no espaço profundo',
                icon: 'public',
                tone: 'neutral',
              },
              {
                id: 'prontidao',
                label: 'Prontidão Logística',
                value: `${kpis.readinessRate}% Operacional`,
                caption: 'Suporte imediato a todas as equipes',
                icon: 'verified_user',
                tone: 'success',
              },
            ],
          },
        ],
      });
    });
  }
}
