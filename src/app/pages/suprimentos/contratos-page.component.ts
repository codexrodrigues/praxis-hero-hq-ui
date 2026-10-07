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
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar contratos por número, fornecedor ou motivo...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Contratos', filter: '', icon: 'description' },
          { id: 'active', label: 'Vigentes & Assinados', filter: "status='ACTIVE' or status='SIGNED'", icon: 'verified' },
          { id: 'expired', label: 'Contratos Expirados', filter: "status='EXPIRED'", icon: 'event_busy' },
          { id: 'draft', label: 'Em Minuta / Draft', filter: "status='DRAFT'", icon: 'edit_note' },
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
          schemaUrl: '/schemas/filtered?path=/api/procurement/contracts/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['supplierName', 'status', 'number'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
    },
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
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Tática de Escopo e Filtros Rápidos -->
      <div class="tactical-filter-bar glass-panel">
        <div class="scope-label">
          <span class="material-symbols-outlined">tune</span>
          <span>Escopo Contratual:</span>
        </div>

        <div class="scope-chips">
          <button
            type="button"
            class="scope-chip"
            [class.is-active]="activeFilterId() === 'all'"
            (click)="setFilter('all')"
          >
            <span class="material-symbols-outlined">description</span>
            <span>Todos os Acordos</span>
            <span class="chip-count">{{ totalContratos() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-ready"
            [class.is-active]="activeFilterId() === 'vigentes'"
            (click)="setFilter('vigentes')"
          >
            <span class="material-symbols-outlined">verified</span>
            <span>Vigentes & Assinados</span>
            <span class="chip-count">{{ activeAndSigned() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-warning"
            [class.is-active]="activeFilterId() === 'expirados'"
            (click)="setFilter('expirados')"
          >
            <span class="material-symbols-outlined">event_busy</span>
            <span>Expirados</span>
            <span class="chip-count">{{ expired() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-info"
            [class.is-active]="activeFilterId() === 'draft'"
            (click)="setFilter('draft')"
          >
            <span class="material-symbols-outlined">edit_note</span>
            <span>Em Minuta / Draft</span>
            <span class="chip-count">{{ draft() }}</span>
          </button>
        </div>

        @if (activeFilterId() !== 'all') {
          <button type="button" class="clear-scope-btn" (click)="setFilter('all')">
            <span class="material-symbols-outlined">restart_alt</span>
            <span>Limpar Filtro</span>
          </button>
        }
      </div>

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-contratos-crud"
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

    .tone-supplies {
      background: color-mix(in oklab, var(--supplies) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--supplies) 30%, transparent);
      color: var(--supplies);
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
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(18, 26, 43, 0.6);
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
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.03);
      color: var(--foreground);
      transition: all 0.2s ease;

      span.material-symbols-outlined { font-size: 16px; }

      .chip-count {
        padding: 2px 7px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.08);
        font-size: 0.75rem;
        font-weight: 700;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.22);
      }

      &.is-active {
        background: color-mix(in oklab, var(--primary) 22%, transparent);
        border-color: var(--primary);
        color: #fff;
        box-shadow: 0 0 16px color-mix(in oklab, var(--primary) 30%, transparent);

        .chip-count {
          background: var(--primary);
          color: #fff;
        }
      }

      &.chip-ready.is-active {
        background: color-mix(in oklab, var(--ready) 22%, transparent);
        border-color: var(--ready);
        .chip-count { background: var(--ready); }
      }

      &.chip-warning.is-active {
        background: color-mix(in oklab, var(--warning) 22%, transparent);
        border-color: var(--warning);
        .chip-count { background: var(--warning); }
      }

      &.chip-info.is-active {
        background: color-mix(in oklab, var(--supplies) 22%, transparent);
        border-color: var(--supplies);
        .chip-count { background: var(--supplies); }
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
      border: 1px dashed rgba(255, 255, 255, 0.15);
      cursor: pointer;
      transition: all 0.15s ease;

      span { font-size: 16px; }

      &:hover {
        color: var(--foreground);
        border-color: rgba(255, 255, 255, 0.35);
        background: rgba(255, 255, 255, 0.04);
      }
    }

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class ContratosPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalContratos = signal<number>(17);
  protected readonly activeAndSigned = signal<number>(11);
  protected readonly expired = signal<number>(3);
  protected readonly draft = signal<number>(1);

  protected readonly kpiDocument = signal<RichContentDocument>(CONTRATOS_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'vigentes') {
      filterCriteria = { status: 'ACTIVE' };
    } else if (filterId === 'expirados') {
      filterCriteria = { status: 'EXPIRED' };
    } else if (filterId === 'draft') {
      filterCriteria = { status: 'DRAFT' };
    }

    return {
      ...CONTRATOS_CRUD_METADATA,
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
    if (text.includes('vigentes') || text.includes('ativos')) {
      this.setFilter('vigentes');
    } else if (text.includes('expirados') || text.includes('requerem ação')) {
      this.setFilter('expirados');
    } else if (text.includes('minuta') || text.includes('draft') || text.includes('aprovação')) {
      this.setFilter('draft');
    } else if (text.includes('total') || text.includes('cadastrados')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getContratosTacticalKpis().subscribe((kpis) => {
      this.totalContratos.set(kpis.totalContratos);
      this.activeAndSigned.set(kpis.activeAndSigned);
      this.expired.set(kpis.expired);
      this.draft.set(kpis.draft);

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
