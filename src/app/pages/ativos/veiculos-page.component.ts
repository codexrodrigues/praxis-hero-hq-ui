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
        header: 'ID',
        width: '80px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'nome',
        header: 'Identificação da Unidade',
        width: '260px',
        sortable: true,
      },
      {
        field: 'tipo',
        header: 'Categoria / Tipo',
        width: '160px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'capacidade',
        header: 'Capacidade (Tripulação/Carga)',
        type: 'number',
        width: '160px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'proprietarioNome',
        header: 'Custodiante / Piloto',
        width: '240px',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Disponibilidade',
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
          id: 'prontidao',
          label: 'Prontidão Operacional',
          value: '5 Prontos',
          caption: 'Liberados para missão imediata',
          icon: 'check_circle',
          tone: 'success',
        },
        {
          id: 'manutencao',
          label: 'Em Revisão / Hangares',
          value: '2 Unidades',
          caption: 'Manutenção corretiva e preventiva',
          icon: 'build',
          tone: 'warning',
        },
        {
          id: 'disponibilidade',
          label: 'Taxa de Prontidão',
          value: '62,5%',
          caption: 'Capacidade de surtida sustentada',
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
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-assets-bg">
            <span class="material-symbols-outlined">flight</span>
            Ativos Operacionais & Logística
          </div>
          <h1 class="title-gradient page-title">Frota Tática & Veículos</h1>
          <p class="page-subtitle">
            Gestão de veículos terrestres, anfíbios, aeronaves táticas e naves orbitais de mobilização rápida.
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
          crudId="heroes-hq-veiculos-crud"
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

    .tone-assets-bg {
      background: color-mix(in oklab, var(--assets) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--assets) 30%, transparent);
      color: var(--assets);
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
export class VeiculosPageComponent implements OnInit, OnDestroy {
  protected readonly crudMetadata = VEICULOS_CRUD_METADATA;
  protected readonly kpiDocument = signal<RichContentDocument>(VEICULOS_KPI_DOCUMENT);

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
    this.kpiSub = this.dashboardStats.getVeiculosTacticalKpis().subscribe((kpis) => {
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
                id: 'prontidao',
                label: 'Prontidão Operacional',
                value: `${kpis.operational} Operacionais`,
                caption: 'Liberados para missão imediata',
                icon: 'check_circle',
                tone: 'success',
              },
              {
                id: 'manutencao',
                label: 'Em Revisão / Hangares',
                value: `${kpis.maintenance} Unidades`,
                caption: 'Manutenção e ajuste de propulsão',
                icon: 'build',
                tone: 'warning',
              },
              {
                id: 'disponibilidade',
                label: 'Taxa de Prontidão',
                value: `${kpis.readinessRate.toString().replace('.', ',')}%`,
                caption: 'Capacidade de surtida sustentada',
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
