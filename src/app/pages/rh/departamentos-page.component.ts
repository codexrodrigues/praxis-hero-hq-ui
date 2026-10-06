import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';

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
        width: '260px',
        sortable: true,
      },
      {
        field: 'sigla',
        header: 'Sigla / Código',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'responsavelNome',
        header: 'Diretor / Líder Responsável',
        width: '240px',
        sortable: true,
      },
      {
        field: 'orcamentoAnual',
        header: 'Orçamento Tático (R$)',
        type: 'currency',
        format: 'BRL',
        width: '180px',
        align: 'right',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Editar Divisão',
      action: 'edit',
      openMode: 'modal',
      formId: 'departamentos-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Criar Departamento',
      action: 'create',
      openMode: 'modal',
      formId: 'departamentos-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '840px', maxWidth: '95vw' },
  },
};

export const DEPARTAMENTOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      className: 'departamentos-kpi-grid',
      items: [
        {
          id: 'divisoes',
          label: 'Divisões Ativas',
          value: '28 Departamentos',
          caption: 'P&D, Tático, Suprimentos e Risco',
          icon: 'corporate_fare',
          tone: 'info',
        },
        {
          id: 'liderancas',
          label: 'Lideranças Nomeadas',
          value: '100% Cobertura',
          caption: 'Supervisores e diretores alocados',
          icon: 'military_tech',
          tone: 'success',
        },
        {
          id: 'principal',
          label: 'Divisão Principal',
          value: 'Stark Industries P&D',
          caption: 'Maior orçamento tecnológico',
          icon: 'science',
          tone: 'neutral',
        },
        {
          id: 'cargos',
          label: 'Cargos Mapeados',
          value: '46 Especialidades',
          caption: 'Do suporte civil à liderança ômega',
          icon: 'account_tree',
          tone: 'warning',
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
        <praxis-rich-content [document]="kpiDocument" />
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

    .tone-rh { color: var(--rh); background: color-mix(in oklab, var(--rh) 12%, transparent); }
    .tone-ready { color: var(--ready); background: color-mix(in oklab, var(--ready) 14%, transparent); }
    .tone-warning { color: var(--warning); background: color-mix(in oklab, var(--warning) 14%, transparent); }
    .tone-operations { color: var(--operations); background: color-mix(in oklab, var(--operations) 14%, transparent); }

    /* KPI Bento Grid Styling */
    ::ng-deep {
      .departamentos-kpi-grid .prx-rich-stat-group__items,
      .departamentos-kpi-grid .pdx-rich-stat-group__items {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        width: 100%;
      }

      .departamentos-kpi-grid .prx-rich-stat-group__item,
      .departamentos-kpi-grid .pdx-rich-stat-group__item {
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

      .departamentos-kpi-grid .prx-rich-stat-group__value,
      .departamentos-kpi-grid .pdx-rich-stat-group__value {
        font-family: var(--font-display) !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        color: var(--foreground) !important;
        margin: 4px 0 0 !important;
      }

      .departamentos-kpi-grid .prx-rich-stat-group__label,
      .departamentos-kpi-grid .pdx-rich-stat-group__label {
        font-size: 0.68rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        color: var(--muted-foreground) !important;
      }

      .departamentos-kpi-grid .prx-rich-stat-group__caption,
      .departamentos-kpi-grid .pdx-rich-stat-group__caption {
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
export class DepartamentosPageComponent {
  protected readonly crudMetadata = DEPARTAMENTOS_CRUD_METADATA;
  protected readonly kpiDocument = DEPARTAMENTOS_KPI_DOCUMENT;
}
