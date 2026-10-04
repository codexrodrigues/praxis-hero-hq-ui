import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';

export const AMEACAS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'risk-intelligence/ameacas',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'nome',
        header: 'Designação da Ameaça',
        width: '260px',
        sortable: true,
      },
      {
        field: 'classe',
        header: 'Classe Taxonômica',
        width: '180px',
        sortable: true,
      },
      {
        field: 'planeta',
        header: 'Teatro / Setor',
        width: '180px',
        sortable: true,
      },
      {
        field: 'nivel',
        header: 'Nível de Perigo',
        type: 'number',
        width: '140px',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status Operacional',
        width: '160px',
        sortable: true,
      },
      {
        field: 'recompensa',
        header: 'Recompensa Tática (R$)',
        type: 'number',
        width: '180px',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Atualizar Intel',
      action: 'edit',
      openMode: 'modal',
      formId: 'ameacas-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Registrar Ameaça',
      action: 'create',
      openMode: 'modal',
      formId: 'ameacas-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '880px', maxWidth: '95vw' },
  },
};

@Component({
  selector: 'app-ameacas-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-risk">
            <span class="material-symbols-outlined">radar</span>
            Inteligência de Risco & Segurança Global
          </div>
          <h1 class="title-gradient page-title">Radar de Ameaças Globais</h1>
          <p class="page-subtitle">
            Catalogação de supervilões, anomalias dimensionais, tracking geoespacial e recompensas ativas.
          </p>
        </div>
      </header>

      <!-- KPI Bento Grid -->
      <section class="kpi-grid">
        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-risk"><span class="material-symbols-outlined">warning</span></div>
          <p class="kpi-label">Ameaças Monitoradas</p>
          <p class="kpi-value">16 Alvos</p>
          <p class="kpi-detail text-risk">Radar contínuo em frequência quântica</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-warning"><span class="material-symbols-outlined">crisis_alert</span></div>
          <p class="kpi-label">Prioridade Ômega Ativa</p>
          <p class="kpi-value">02 Críticas</p>
          <p class="kpi-detail text-warning">Thanos · Doutor Destino</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-ready"><span class="material-symbols-outlined">lock</span></div>
          <p class="kpi-label">Contidos / Quarentena</p>
          <p class="kpi-value">09 Neutralizados</p>
          <p class="kpi-detail text-ready">Custodiados na Prisão Raft</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-operations"><span class="material-symbols-outlined">payments</span></div>
          <p class="kpi-label">Fundo Total de Recompensas</p>
          <p class="kpi-value">R$ 18,5 M</p>
          <p class="kpi-detail">Garantido pelo Acordo de Sokovia</p>
        </div>
      </section>

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-ameacas-crud"
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
      background: color-mix(in oklab, var(--risk) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--risk) 30%, transparent);
      color: var(--risk);
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

    .tone-risk { color: var(--risk); background: color-mix(in oklab, var(--risk) 14%, transparent); }
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
    .text-risk { color: var(--risk) !important; }

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }
  `],
})
export class AmeacasPageComponent {
  protected readonly crudMetadata = AMEACAS_CRUD_METADATA;
}
