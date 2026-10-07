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

export const EQUIPAMENTOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'assets/equipamentos',
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
        header: 'Equipamento / Traje',
        width: '260px',
        sortable: true,
      },
      {
        field: 'tipo',
        header: 'Categoria Tática',
        width: '160px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'resistencia',
        header: 'Resistência / Blindagem',
        type: 'number',
        width: '160px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'proprietarioNome',
        header: 'Custodiante / Herói',
        width: '220px',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status de Custódia',
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

export const EQUIPAMENTOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'equipamentos-kpi-grid',
      items: [
        {
          id: 'total',
          label: 'Total de Itens Táticos',
          value: '62 Ativos',
          caption: 'Trajes, armas e exoesqueletos',
          icon: 'shield',
          tone: 'info',
        },
        {
          id: 'custodia',
          label: 'Em Custódia / Uso Ativo',
          value: '56 Itens',
          caption: 'Alocados a heróis em missão',
          icon: 'verified_user',
          tone: 'success',
        },
        {
          id: 'manutencao',
          label: 'Em Manutenção',
          value: '2 Itens',
          caption: 'Recarga de reator e nanotecnologia',
          icon: 'build',
          tone: 'warning',
        },
        {
          id: 'estoque',
          label: 'Em Reserva de Arsenal',
          value: '2 Itens',
          caption: 'Disponíveis no cofre central',
          icon: 'inventory_2',
          tone: 'neutral',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-equipamentos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-assets">
            <span class="material-symbols-outlined">inventory_2</span>
            Ativos Operacionais & Armaria
          </div>
          <h1 class="title-gradient page-title">Equipamentos & Trajes</h1>
          <p class="page-subtitle">
            Inventário de armaduras, armas táticas, comunicadores quânticos e controle de custódia patrimonial.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-equipamentos-crud"
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
    }

    .domain-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: color-mix(in oklab, var(--assets) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--assets) 30%, transparent);
      color: var(--assets);
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;

      span { font-size: 14px; }
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

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class EquipamentosPageComponent implements OnInit, OnDestroy {
  protected readonly crudMetadata = EQUIPAMENTOS_CRUD_METADATA;
  protected readonly kpiDocument = signal<RichContentDocument>(EQUIPAMENTOS_KPI_DOCUMENT);

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
    this.kpiSub = this.dashboardStats.getEquipamentosTacticalKpis().subscribe((kpis) => {
      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'equipamentos-kpi-grid',
            items: [
              {
                id: 'total',
                label: 'Total de Itens Táticos',
                value: `${kpis.totalEquipamentos} Ativos`,
                caption: 'Trajes, armas e exoesqueletos',
                icon: 'shield',
                tone: 'info',
              },
              {
                id: 'custodia',
                label: 'Em Custódia / Uso Ativo',
                value: `${kpis.inUse} Itens`,
                caption: 'Alocados a heróis em missão',
                icon: 'verified_user',
                tone: 'success',
              },
              {
                id: 'manutencao',
                label: 'Em Manutenção',
                value: `${kpis.inMaintenance} Itens`,
                caption: 'Recarga de reator e nanotecnologia',
                icon: 'build',
                tone: 'warning',
              },
              {
                id: 'estoque',
                label: 'Em Reserva de Arsenal',
                value: `${kpis.inStock} Itens`,
                caption: 'Disponíveis no cofre central',
                icon: 'inventory_2',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
