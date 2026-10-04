import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';

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
        header: 'Número Legal',
        width: '200px',
        sortable: true,
      },
      {
        field: 'supplierName',
        header: 'Fornecedor Homologado',
        width: '260px',
        sortable: true,
      },
      {
        field: 'currency',
        header: 'Moeda',
        width: '120px',
        sortable: true,
      },
      {
        field: 'validUntil',
        header: 'Vigência Final',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '160px',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status Contratual',
        width: '160px',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Editar Contrato',
      action: 'edit',
      openMode: 'modal',
      formId: 'contratos-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Novo Contrato',
      action: 'create',
      openMode: 'modal',
      formId: 'contratos-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '880px', maxWidth: '95vw' },
  },
};

@Component({
  selector: 'app-contratos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent],
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

      <!-- KPI Bento Grid -->
      <section class="kpi-grid">
        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-supplies"><span class="material-symbols-outlined">description</span></div>
          <p class="kpi-label">Contratos Vigentes</p>
          <p class="kpi-value">12 Ativos</p>
          <p class="kpi-detail">Indústrias Stark, Pym Tech e Oscorp</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-ready"><span class="material-symbols-outlined">verified</span></div>
          <p class="kpi-label">Compliance & SLAs</p>
          <p class="kpi-value">99,1%</p>
          <p class="kpi-detail text-ready">Entregas dentro do prazo tático</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-warning"><span class="material-symbols-outlined">event_repeat</span></div>
          <p class="kpi-label">Em Renovação Trimestral</p>
          <p class="kpi-value">03 Contratos</p>
          <p class="kpi-detail text-warning">Aditivos de fornecimento de vibranium</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-operations"><span class="material-symbols-outlined">attach_money</span></div>
          <p class="kpi-label">Volume Anual Contratado</p>
          <p class="kpi-value">R$ 42,0 M</p>
          <p class="kpi-detail">Orçamento aprovado para 2026</p>
        </div>
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

    .kpi-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      span { font-size: 22px; }
    }

    .tone-supplies { color: var(--supplies); background: color-mix(in oklab, var(--supplies) 14%, transparent); }
    .tone-ready { color: var(--ready); background: color-mix(in oklab, var(--ready) 14%, transparent); }
    .tone-warning { color: var(--warning); background: color-mix(in oklab, var(--warning) 14%, transparent); }
    .tone-operations { color: var(--operations); background: color-mix(in oklab, var(--operations) 14%, transparent); }

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
export class ContratosPageComponent {
  protected readonly crudMetadata = CONTRATOS_CRUD_METADATA;
}
