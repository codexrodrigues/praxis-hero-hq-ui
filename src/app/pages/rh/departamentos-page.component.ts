import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';

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
        field: 'codigo',
        header: 'Código / Sigla',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'nome',
        header: 'Nome do Departamento / Divisão',
        width: '320px',
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
    modal: { width: '820px', maxWidth: '95vw' },
  },
};

@Component({
  selector: 'app-departamentos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent],
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

      <!-- Bento Grid de KPIs -->
      <section class="kpi-grid">
        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-rh">
            <span class="material-symbols-outlined">corporate_fare</span>
          </div>
          <p class="kpi-label">Divisões Ativas</p>
          <p class="kpi-value">28 Departamentos</p>
          <p class="kpi-detail">P&D, Tático, Suprimentos e Risco</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-ready">
            <span class="material-symbols-outlined">military_tech</span>
          </div>
          <p class="kpi-label">Lideranças Nomeadas</p>
          <p class="kpi-value">100% Cobertura</p>
          <p class="kpi-detail text-ready">Supervisores e diretores alocados</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-operations">
            <span class="material-symbols-outlined">science</span>
          </div>
          <p class="kpi-label">Divisão Principal</p>
          <p class="kpi-value">Stark Industries P&D</p>
          <p class="kpi-detail">Maior orçamento tecnológico</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-warning">
            <span class="material-symbols-outlined">account_tree</span>
          </div>
          <p class="kpi-label">Cargos Mapeados</p>
          <p class="kpi-value">46 Especialidades</p>
          <p class="kpi-detail text-warning">Do suporte civil à liderança ômega</p>
        </div>
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

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      padding: 18px;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
    }

    .kpi-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      span { font-size: 22px; }
    }

    .tone-rh { color: var(--rh); background: color-mix(in oklab, var(--rh) 12%, transparent); }
    .tone-ready { color: var(--ready); background: color-mix(in oklab, var(--ready) 12%, transparent); }
    .tone-warning { color: var(--warning); background: color-mix(in oklab, var(--warning) 12%, transparent); }
    .tone-operations { color: var(--operations); background: color-mix(in oklab, var(--operations) 12%, transparent); }

    .kpi-label {
      margin: 0;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted-foreground);
    }

    .kpi-value {
      margin: 4px 0 0;
      font-family: var(--font-display);
      font-size: 1.6rem;
      font-weight: 700;
    }

    .kpi-detail {
      margin: 4px 0 0;
      font-size: 0.72rem;
      color: var(--muted-foreground);
    }

    .text-ready { color: var(--ready) !important; }
    .text-warning { color: var(--warning) !important; }

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class DepartamentosPageComponent {
  protected readonly crudMetadata = DEPARTAMENTOS_CRUD_METADATA;
}
