import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';

export const EQUIPAMENTOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'assets/equipamentos',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'nome',
        header: 'Equipamento / Traje',
        width: '260px',
        sortable: true,
      },
      {
        field: 'tipo',
        header: 'Categoria Tática',
        width: '180px',
        sortable: true,
      },
      {
        field: 'resistencia',
        header: 'Resistência / Blindagem',
        type: 'number',
        width: '180px',
        sortable: true,
      },
      {
        field: 'proprietarioNome',
        header: 'Custodiante / Herói',
        width: '220px',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status de Custódia',
        width: '160px',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Auditar Custódia',
      action: 'edit',
      openMode: 'modal',
      formId: 'equipamentos-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Novo Equipamento',
      action: 'create',
      openMode: 'modal',
      formId: 'equipamentos-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '880px', maxWidth: '95vw' },
  },
};

@Component({
  selector: 'app-equipamentos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-assets">
            <span class="material-symbols-outlined">inventory_2</span>
            Ativos Operacionais & Armaria
          </div>
          <h1 class="title-gradient page-title">Equipamentos & Trajes</h1>
          <p class="page-subtitle">
            Inventário de armaduras, armas táticas, comunicadores quânticos e controle de custódia patrimonial.
          </p>
        </div>
      </header>

      <!-- KPI Bento Grid -->
      <section class="kpi-grid">
        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-assets"><span class="material-symbols-outlined">shield</span></div>
          <p class="kpi-label">Total de Itens Táticos</p>
          <p class="kpi-value">48 Ativos</p>
          <p class="kpi-detail">Trajes, armas e exoesqueletos</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-ready"><span class="material-symbols-outlined">check_circle</span></div>
          <p class="kpi-label">Em Custódia / Uso Ativo</p>
          <p class="kpi-value">36 Itens</p>
          <p class="kpi-detail text-ready">Alocados a heróis em missão</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-warning"><span class="material-symbols-outlined">build</span></div>
          <p class="kpi-label">Em Manutenção / Laboratório</p>
          <p class="kpi-value">08 Itens</p>
          <p class="kpi-detail text-warning">Recarga de reator e nanotecnologia</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-operations"><span class="material-symbols-outlined">verified</span></div>
          <p class="kpi-label">Integridade Média da Força</p>
          <p class="kpi-value">94,8%</p>
          <p class="kpi-detail">Dentro dos limites de prontidão</p>
        </div>
      </section>

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-equipamentos-crud"
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
      background: color-mix(in oklab, var(--assets) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--assets) 30%, transparent);
      color: var(--assets);
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

    .tone-assets { color: var(--assets); background: color-mix(in oklab, var(--assets) 14%, transparent); }
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
export class EquipamentosPageComponent {
  protected readonly crudMetadata = EQUIPAMENTOS_CRUD_METADATA;
}
