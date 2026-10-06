import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';

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
        field: 'liderNome',
        header: 'Comandante de Campo / Líder',
        width: '240px',
        sortable: true,
      },
      {
        field: 'baseNome',
        header: 'Base Avançada Designada',
        width: '220px',
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
  actions: [
    {
      id: 'edit',
      label: 'Despachar Esquadrão',
      action: 'edit',
      openMode: 'modal',
      formId: 'equipes-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Formar Nova Equipe',
      action: 'create',
      openMode: 'modal',
      formId: 'equipes-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '840px', maxWidth: '95vw' },
  },
};

export const EQUIPES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      className: 'equipes-kpi-grid',
      items: [
        {
          id: 'equipes',
          label: 'Equipes Operacionais',
          value: '5 Forças Ativas',
          caption: 'Compostas por heróis de ponta',
          icon: 'diversity_3',
          tone: 'info',
        },
        {
          id: 'cobertura',
          label: 'Cobertura de Bases',
          value: '100% Integrada',
          caption: 'Complexos Central, Selene e Stark',
          icon: 'hub',
          tone: 'success',
        },
        {
          id: 'resposta',
          label: 'Tempo Médio de Resposta',
          value: '3,8 Minutos',
          caption: 'Alerta imediato em todo o globo',
          icon: 'timer',
          tone: 'warning',
        },
        {
          id: 'sinergia',
          label: 'Índice de Sinergia',
          value: '94,8%',
          caption: 'Complementaridade de poderes',
          icon: 'auto_fix_high',
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
        <praxis-rich-content [document]="kpiDocument" />
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

    .tone-rh { color: var(--rh); background: color-mix(in oklab, var(--rh) 12%, transparent); }
    .tone-ready { color: var(--ready); background: color-mix(in oklab, var(--ready) 12%, transparent); }
    .tone-warning { color: var(--warning); background: color-mix(in oklab, var(--warning) 12%, transparent); }
    .tone-operations { color: var(--operations); background: color-mix(in oklab, var(--operations) 14%, transparent); }

    /* KPI Bento Grid Styling */
    ::ng-deep {
      .equipes-kpi-grid .prx-rich-stat-group__items,
      .equipes-kpi-grid .pdx-rich-stat-group__items {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        width: 100%;
      }

      .equipes-kpi-grid .prx-rich-stat-group__item,
      .equipes-kpi-grid .pdx-rich-stat-group__item {
        border-radius: 16px !important;
        padding: 18px !important;
        border: 1px solid var(--border) !important;
        background: color-mix(in oklab, var(--card) 60%, transparent) !important;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        flex-direction: column;
        transition: transform 0.2s ease, border-color 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          border-color: color-mix(in oklab, var(--primary) 40%, var(--border));
        }
      }

      .equipes-kpi-grid .prx-rich-stat-group__value,
      .equipes-kpi-grid .pdx-rich-stat-group__value {
        font-family: var(--font-display) !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        color: var(--foreground) !important;
        margin: 4px 0 0 !important;
      }

      .equipes-kpi-grid .prx-rich-stat-group__label,
      .equipes-kpi-grid .pdx-rich-stat-group__label {
        font-size: 0.68rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        color: var(--muted-foreground) !important;
      }

      .equipes-kpi-grid .prx-rich-stat-group__caption,
      .equipes-kpi-grid .pdx-rich-stat-group__caption {
        font-size: 0.72rem !important;
        color: var(--muted-foreground) !important;
        margin-top: 4px !important;
      }
    }

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class EquipesPageComponent {
  protected readonly crudMetadata = EQUIPES_CRUD_METADATA;
  protected readonly kpiDocument = EQUIPES_KPI_DOCUMENT;
}
