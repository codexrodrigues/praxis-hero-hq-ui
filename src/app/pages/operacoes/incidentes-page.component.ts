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

export const INCIDENTES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/incidentes',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'Registro',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'descricao',
        header: 'Descrição do Sinistro / Impacto',
        width: '320px',
        sortable: true,
      },
      {
        field: 'local',
        header: 'Teatro do Dano',
        width: '200px',
        sortable: true,
      },
      {
        field: 'severidade',
        header: 'Severidade',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'danosCivis',
        header: 'Prejuízo Civil (R$)',
        type: 'currency',
        format: 'BRL',
        width: '180px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'ocorridoEm',
        header: 'Data do Ocorrido',
        type: 'date',
        width: '160px',
        align: 'center',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar incidentes por local, descrição ou severidade...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Ocorrências', filter: '', icon: 'report' },
          { id: 'critico', label: 'Severidade Crítica', filter: "severidade='CRITICA'", icon: 'warning' },
          { id: 'alta', label: 'Alta Severidade', filter: "severidade='ALTA'", icon: 'crisis_alert' },
          { id: 'media', label: 'Severidade Moderada', filter: "severidade='MEDIA'", icon: 'info' },
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
          schemaUrl: '/schemas/filtered?path=/api/operations/incidentes/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['local', 'severidade', 'descricao'],
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

export const INCIDENTES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'incidentes-kpi-grid',
      items: [
        {
          id: 'incidentes',
          label: 'Total de Ocorrências',
          value: '74 Registros',
          caption: 'Sinistros pós-combate catalogados',
          icon: 'report',
          tone: 'neutral',
        },
        {
          id: 'criticos',
          label: 'Severidade Crítica',
          value: '18 Casos Críticos',
          caption: 'Alto impacto civil e estrutural',
          icon: 'warning',
          tone: 'danger',
        },
        {
          id: 'danos',
          label: 'Danos Materiais Totais',
          value: 'R$ 154,4 M',
          caption: 'Cobertura via Fundo Tático de Indenizações',
          icon: 'account_balance',
          tone: 'warning',
        },
        {
          id: 'mitigacao',
          label: 'Taxa de Mitigação',
          value: '96,2% Contido',
          caption: 'Evacuação prévia e blindagem energética',
          icon: 'shield_with_heart',
          tone: 'success',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-incidentes-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-operations">
            <span class="material-symbols-outlined">crisis_alert</span>
            Operações & Gestão de Crise
          </div>
          <h1 class="title-gradient page-title">Incidentes Táticos & Danos Civis</h1>
          <p class="page-subtitle">
            Relatórios de impacto colateral, controle de contenção e compensações estruturais em teatro de confronto.
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
          <span>Severidade do Sinistro:</span>
        </div>

        <div class="scope-chips">
          <button
            type="button"
            class="scope-chip"
            [class.is-active]="activeFilterId() === 'all'"
            (click)="setFilter('all')"
          >
            <span class="material-symbols-outlined">report</span>
            <span>Todas as Ocorrências</span>
            <span class="chip-count">{{ totalIncidentes() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-danger"
            [class.is-active]="activeFilterId() === 'critico'"
            (click)="setFilter('critico')"
          >
            <span class="material-symbols-outlined">warning</span>
            <span>Severidade Crítica</span>
            <span class="chip-count">{{ criticalIncidentes() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-warning"
            [class.is-active]="activeFilterId() === 'alta'"
            (click)="setFilter('alta')"
          >
            <span class="material-symbols-outlined">crisis_alert</span>
            <span>Alta Severidade</span>
            <span class="chip-count">14</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-info"
            [class.is-active]="activeFilterId() === 'media'"
            (click)="setFilter('media')"
          >
            <span class="material-symbols-outlined">info</span>
            <span>Moderados</span>
            <span class="chip-count">42</span>
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
          crudId="heroes-hq-incidentes-crud"
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

    .tone-operations {
      background: color-mix(in oklab, var(--operations) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--operations) 30%, transparent);
      color: var(--operations);
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

      &.chip-danger.is-active {
        background: color-mix(in oklab, var(--risk) 22%, transparent);
        border-color: var(--risk);
        .chip-count { background: var(--risk); }
      }

      &.chip-warning.is-active {
        background: color-mix(in oklab, var(--warning) 22%, transparent);
        border-color: var(--warning);
        .chip-count { background: var(--warning); }
      }

      &.chip-info.is-active {
        background: color-mix(in oklab, var(--operations) 22%, transparent);
        border-color: var(--operations);
        .chip-count { background: var(--operations); }
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
export class IncidentesPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalIncidentes = signal<number>(74);
  protected readonly criticalIncidentes = signal<number>(18);
  protected readonly totalCivilDamages = signal<number>(154426000);
  protected readonly mitigationRate = signal<number>(96.2);

  protected readonly kpiDocument = signal<RichContentDocument>(INCIDENTES_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'critico') {
      filterCriteria = { severidade: 'CRITICA' };
    } else if (filterId === 'alta') {
      filterCriteria = { severidade: 'ALTA' };
    } else if (filterId === 'media') {
      filterCriteria = { severidade: 'MEDIA' };
    }

    return {
      ...INCIDENTES_CRUD_METADATA,
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
    if (text.includes('severidade crítica') || text.includes('casos críticos')) {
      this.setFilter('critico');
    } else if (text.includes('mitigação') || text.includes('contido')) {
      this.setFilter('media');
    } else if (text.includes('total') || text.includes('ocorrências')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getIncidentesTacticalKpis().subscribe((kpis) => {
      this.totalIncidentes.set(kpis.totalIncidentes);
      this.criticalIncidentes.set(kpis.criticalIncidentes);
      this.totalCivilDamages.set(kpis.totalCivilDamages);
      this.mitigationRate.set(kpis.mitigationRate);

      const damagesMillion = (kpis.totalCivilDamages / 1_000_000).toFixed(1);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'incidentes-kpi-grid',
            items: [
              {
                id: 'incidentes',
                label: 'Total de Ocorrências',
                value: `${kpis.totalIncidentes} Registros`,
                caption: 'Sinistros pós-combate catalogados',
                icon: 'report',
                tone: 'neutral',
              },
              {
                id: 'criticos',
                label: 'Severidade Crítica',
                value: `${kpis.criticalIncidentes} Casos Críticos`,
                caption: 'Alto impacto civil e estrutural',
                icon: 'warning',
                tone: 'danger',
              },
              {
                id: 'danos',
                label: 'Danos Materiais Totais',
                value: `R$ ${damagesMillion} M`,
                caption: 'Cobertura via Fundo Tático de Indenizações',
                icon: 'account_balance',
                tone: 'warning',
              },
              {
                id: 'mitigacao',
                label: 'Taxa de Mitigação',
                value: `${kpis.mitigationRate}% Contido`,
                caption: 'Evacuação prévia e blindagem energética',
                icon: 'shield_with_heart',
                tone: 'success',
              },
            ],
          },
        ],
      });
    });
  }
}
