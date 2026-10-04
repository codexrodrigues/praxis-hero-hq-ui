import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';

export const AFASTAMENTOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/ferias-afastamentos',
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
        field: 'tipo',
        header: 'Tipo de Licença / Ausência',
        width: '160px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'funcionarioId',
        header: 'ID Colaborador',
        width: '130px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'dataInicio',
        header: 'Início da Vigência',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '160px',
        sortable: true,
      },
      {
        field: 'dataFim',
        header: 'Término Previsto',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '160px',
        sortable: true,
      },
      {
        field: 'observacoes',
        header: 'Observações / Parecer Médico-Operacional',
        width: '320px',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Revisar Licença',
      action: 'edit',
      openMode: 'modal',
      formId: 'afastamentos-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Conceder Afastamento',
      action: 'create',
      openMode: 'modal',
      formId: 'afastamentos-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '840px', maxWidth: '95vw' },
  },
};

@Component({
  selector: 'app-afastamentos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh-bg">
            <span class="material-symbols-outlined">event_busy</span>
            Gestão de Pessoas & Disponibilidade
          </div>
          <h1 class="title-gradient page-title">Férias & Afastamentos Táticos</h1>
          <p class="page-subtitle">
            Controle de períodos de descanso regulamentar, licenças médicas de recuperação pós-combate e escalas de substituição.
          </p>
        </div>
      </header>

      <!-- Bento Grid de KPIs -->
      <section class="kpi-grid">
        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-rh">
            <span class="material-symbols-outlined">history_toggle_drop</span>
          </div>
          <p class="kpi-label">Total de Ciclos</p>
          <p class="kpi-value">111 Registros</p>
          <p class="kpi-detail">Férias regulamentares e licenças</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-warning">
            <span class="material-symbols-outlined">health_and_safety</span>
          </div>
          <p class="kpi-label">Em Recuperação Tática</p>
          <p class="kpi-value">12 Colaboradores</p>
          <p class="kpi-detail text-warning">Tratamento e regeneração celular</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-ready">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
          <p class="kpi-label">Disponibilidade Operacional</p>
          <p class="kpi-value">88,0%</p>
          <p class="kpi-detail text-ready">Quadro de prontidão sustentada</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-operations">
            <span class="material-symbols-outlined">sentiment_very_satisfied</span>
          </div>
          <p class="kpi-label">Taxa de Pleno Retorno</p>
          <p class="kpi-value">97,4%</p>
          <p class="kpi-detail">Retorno à ativa sem sequelas</p>
        </div>
      </section>

      <!-- Tabela CRUD Governança Canônica -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-afastamentos-crud"
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
export class AfastamentosPageComponent {
  protected readonly crudMetadata = AFASTAMENTOS_CRUD_METADATA;
}
