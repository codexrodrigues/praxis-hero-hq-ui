import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';

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
        header: 'Nome da Base',
        width: '260px',
        sortable: true,
      },
      {
        field: 'localizacao',
        header: 'Coordenadas / Localização',
        width: '240px',
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
        field: 'capacidadeEquipes',
        header: 'Capacidade (Squads)',
        type: 'number',
        width: '160px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'nivelSigilo',
        header: 'Nível de Sigilo',
        width: '160px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status Operacional',
        width: '160px',
        align: 'center',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Gerenciar Instalação',
      action: 'edit',
      openMode: 'modal',
      formId: 'bases-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Registrar Nova Base',
      action: 'create',
      openMode: 'modal',
      formId: 'bases-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '880px', maxWidth: '95vw' },
  },
};

export const BASES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      className: 'bases-kpi-grid',
      items: [
        {
          id: 'instalacoes',
          label: 'Instalações Globais',
          value: '7 Complexos',
          caption: 'Terrestres, móveis, subterrâneas e orbitais',
          icon: 'apartment',
          tone: 'info',
        },
        {
          id: 'orbital',
          label: 'Plataforma Orbital',
          value: 'Enterprise NCC-1701',
          caption: 'Vigilância subespacial contínua',
          icon: 'satellite_alt',
          tone: 'success',
        },
        {
          id: 'sigilo',
          label: 'Nível Máximo de Sigilo',
          value: 'Wakanda Citadel',
          caption: 'Acesso restrito: Ultra Secreta',
          icon: 'lock',
          tone: 'warning',
        },
        {
          id: 'blindagem',
          label: 'Blindagem Perimetral',
          value: '100% Prontidão',
          caption: 'Escudos defletores ativados',
          icon: 'security',
          tone: 'neutral',
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
            <span class="material-symbols-outlined">fort</span>
            Infraestrutura Tática & Instalações
          </div>
          <h1 class="title-gradient page-title">Bases Operacionais & Acessos</h1>
          <p class="page-subtitle">
            Gestão de hangares avançados, instalações subterrâneas e plataformas orbitais com controle de sigilo e blindagem.
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

    .tone-rh { color: var(--rh); background: color-mix(in oklab, var(--rh) 12%, transparent); }
    .tone-ready { color: var(--ready); background: color-mix(in oklab, var(--ready) 12%, transparent); }
    .tone-warning { color: var(--warning); background: color-mix(in oklab, var(--warning) 12%, transparent); }
    .tone-operations { color: var(--operations); background: color-mix(in oklab, var(--operations) 14%, transparent); }

    /* KPI Bento Grid Styling */
    ::ng-deep {
      .bases-kpi-grid .prx-rich-stat-group__items,
      .bases-kpi-grid .pdx-rich-stat-group__items {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        width: 100%;
      }

      .bases-kpi-grid .prx-rich-stat-group__item,
      .bases-kpi-grid .pdx-rich-stat-group__item {
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

      .bases-kpi-grid .prx-rich-stat-group__value,
      .bases-kpi-grid .pdx-rich-stat-group__value {
        font-family: var(--font-display) !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        color: var(--foreground) !important;
        margin: 4px 0 0 !important;
      }

      .bases-kpi-grid .prx-rich-stat-group__label,
      .bases-kpi-grid .pdx-rich-stat-group__label {
        font-size: 0.68rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        color: var(--muted-foreground) !important;
      }

      .bases-kpi-grid .prx-rich-stat-group__caption,
      .bases-kpi-grid .pdx-rich-stat-group__caption {
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
export class BasesPageComponent {
  protected readonly crudMetadata = BASES_CRUD_METADATA;
  protected readonly kpiDocument = BASES_KPI_DOCUMENT;
}
