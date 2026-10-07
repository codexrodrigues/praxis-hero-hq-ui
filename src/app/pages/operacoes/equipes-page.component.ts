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
        field: 'status',
        header: 'Prontidão Tática',
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
          label: 'Prontidão Operacional',
          value: '4 Equipes Ativas',
          caption: 'Prontas para engajamento imediato',
          icon: 'military_tech',
          tone: 'success',
        },
        {
          id: 'reserva',
          label: 'Reserva Estratégica',
          value: '1 Equipe em Reserva',
          caption: 'Escalável sob protocolo ômega',
          icon: 'shield',
          tone: 'warning',
        },
        {
          id: 'bases',
          label: 'Bases Interligadas',
          value: '5 Instalações',
          caption: 'Rede logística e suprimentos',
          icon: 'hub',
          tone: 'neutral',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-equipes-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-operations-bg">
            <span class="material-symbols-outlined">groups_3</span>
            Operações & Forças Especiais
          </div>
          <h1 class="title-gradient page-title">Equipes & Squads Táticos</h1>
          <p class="page-subtitle">
            Gestão de esquadrões operacionais, sinergia de combate, prontidão tática e alocação por bases avançadas.
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
          crudId="heroes-hq-equipes-crud"
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
export class EquipesPageComponent implements OnInit, OnDestroy {
  protected readonly crudMetadata = EQUIPES_CRUD_METADATA;
  protected readonly kpiDocument = signal<RichContentDocument>(EQUIPES_KPI_DOCUMENT);

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
    this.kpiSub = this.dashboardStats.getEquipesTacticalKpis().subscribe((kpis) => {
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
                label: 'Prontidão Operacional',
                value: `${kpis.activeEquipes} Equipes Ativas`,
                caption: 'Prontas para engajamento imediato',
                icon: 'military_tech',
                tone: 'success',
              },
              {
                id: 'reserva',
                label: 'Reserva Estratégica',
                value: `${kpis.reserveEquipes} em Reserva`,
                caption: 'Escalável sob protocolo ômega',
                icon: 'shield',
                tone: 'warning',
              },
              {
                id: 'bases',
                label: 'Bases Interligadas',
                value: `${kpis.linkedBases} Instalações`,
                caption: 'Rede logística e suprimentos',
                icon: 'hub',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
