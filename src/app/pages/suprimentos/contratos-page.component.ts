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

export const CONTRATOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'procurement/contracts',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'number',
        header: 'Nº do Contrato',
        width: '160px',
        sortable: true,
      },
      {
        field: 'supplierName',
        header: 'Fornecedor / Fabricante',
        width: '260px',
        sortable: true,
      },
      {
        field: 'currency',
        header: 'Moeda',
        width: '100px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'validUntil',
        header: 'Vigência Até',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '150px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status Contratual',
        width: '150px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'disabledReason',
        header: 'Observações / Motivo',
        width: '260px',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  defaults: {
    openMode: 'drawer',
  },
};

export const CONTRATOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'contratos-kpi-grid',
      items: [
        {
          id: 'vigentes',
          label: 'Contratos Vigentes',
          value: '11 Ativos',
          caption: 'Acordos ativos e assinados com a base',
          icon: 'description',
          tone: 'info',
        },
        {
          id: 'total',
          label: 'Total de Contratos',
          value: '17 Cadastrados',
          caption: 'Volume total de acordos catalogados',
          icon: 'verified',
          tone: 'success',
        },
        {
          id: 'expirados',
          label: 'Contratos Expirados',
          value: '3 Requerem Ação',
          caption: 'Demandam aditivo ou substituição',
          icon: 'event_busy',
          tone: 'warning',
        },
        {
          id: 'draft',
          label: 'Em Minuta / Draft',
          value: '1 em Aprovação',
          caption: 'Aguardando validação jurídica e financeira',
          icon: 'edit_note',
          tone: 'neutral',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-contratos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-supplies">
            <span class="material-symbols-outlined">contract</span>
            Suprimentos & Aquisições Estratégicas
          </div>
          <h1 class="title-gradient page-title">Fornecedores & Contratos</h1>
          <p class="page-subtitle">
            Gestão de parceiros industriais, acordos de nível de serviço, peças de reposição e contratos corporativos.
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
          crudId="heroes-hq-contratos-crud"
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
      background: color-mix(in oklab, var(--supplies) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--supplies) 30%, transparent);
      color: var(--supplies);
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
export class ContratosPageComponent implements OnInit, OnDestroy {
  protected readonly crudMetadata = CONTRATOS_CRUD_METADATA;
  protected readonly kpiDocument = signal<RichContentDocument>(CONTRATOS_KPI_DOCUMENT);

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
    this.kpiSub = this.dashboardStats.getContratosTacticalKpis().subscribe((kpis) => {
      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'contratos-kpi-grid',
            items: [
              {
                id: 'vigentes',
                label: 'Contratos Vigentes',
                value: `${kpis.activeAndSigned} Ativos`,
                caption: 'Acordos ativos e assinados com a base',
                icon: 'description',
                tone: 'info',
              },
              {
                id: 'total',
                label: 'Total de Contratos',
                value: `${kpis.totalContratos} Cadastrados`,
                caption: 'Volume total de acordos catalogados',
                icon: 'verified',
                tone: 'success',
              },
              {
                id: 'expirados',
                label: 'Contratos Expirados',
                value: `${kpis.expired} Requerem Ação`,
                caption: 'Demandam aditivo ou substituição',
                icon: 'event_busy',
                tone: 'warning',
              },
              {
                id: 'draft',
                label: 'Em Minuta / Draft',
                value: `${kpis.draft} em Aprovação`,
                caption: 'Aguardando validação jurídica e financeira',
                icon: 'edit_note',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
