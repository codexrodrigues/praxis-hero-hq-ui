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
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'responsavelNome',
        header: 'Diretor / Líder Responsável',
        width: '260px',
        sortable: true,
      },
    ],
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
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
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
      <section class="kpi-surface">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Tabela CRUD Governança Canônica -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-departamentos-crud"
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

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class DepartamentosPageComponent implements OnInit, OnDestroy {
  protected readonly crudMetadata = DEPARTAMENTOS_CRUD_METADATA;
  protected readonly kpiDocument = signal<RichContentDocument>(DEPARTAMENTOS_KPI_DOCUMENT);

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
    this.kpiSub = this.dashboardStats.getDepartamentosTacticalKpis().subscribe((kpis) => {
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
                value: `${kpis.leadershipCoverage.toString().replace('.', ',')}% Cobertura`,
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
