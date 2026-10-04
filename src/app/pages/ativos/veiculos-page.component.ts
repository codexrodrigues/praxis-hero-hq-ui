import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';

export const VEICULOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'assets/veiculos',
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
        header: 'Identificação da Unidade',
        width: '260px',
        sortable: true,
      },
      {
        field: 'tipo',
        header: 'Categoria / Tipo',
        width: '160px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'capacidade',
        header: 'Capacidade (Tripulação/Carga)',
        type: 'number',
        width: '160px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'proprietarioNome',
        header: 'Custodiante / Piloto',
        width: '240px',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Disponibilidade',
        width: '160px',
        align: 'center',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Inspecionar Veículo',
      action: 'edit',
      openMode: 'modal',
      formId: 'veiculos-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Incorporar Veículo à Frota',
      action: 'create',
      openMode: 'modal',
      formId: 'veiculos-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '840px', maxWidth: '95vw' },
  },
};

@Component({
  selector: 'app-veiculos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-assets-bg">
            <span class="material-symbols-outlined">flight</span>
            Ativos Operacionais & Logística
          </div>
          <h1 class="title-gradient page-title">Frota Tática & Veículos</h1>
          <p class="page-subtitle">
            Gestão de aeronaves de inserção tática, transportadores pesados e mobilidade de heróis com telemetria governada.
          </p>
        </div>
      </header>

      <!-- Bento Grid de KPIs -->
      <section class="kpi-grid">
        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-assets">
            <span class="material-symbols-outlined">rocket_launch</span>
          </div>
          <p class="kpi-label">Unidades Registradas</p>
          <p class="kpi-value">8 Veículos</p>
          <p class="kpi-detail">Aeronaves, hovercrafts e terrestres</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-ready">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
          <p class="kpi-label">Prontidão Imediata</p>
          <p class="kpi-value">6 Operacionais</p>
          <p class="kpi-detail text-ready">75% da frota liberada para surtida</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-warning">
            <span class="material-symbols-outlined">build</span>
          </div>
          <p class="kpi-label">Em Manutenção / Hangares</p>
          <p class="kpi-value">2 Unidades</p>
          <p class="kpi-detail text-warning">Revisão de motores iônicos</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-operations">
            <span class="material-symbols-outlined">speed</span>
          </div>
          <p class="kpi-label">Autonomia Operacional</p>
          <p class="kpi-value">4.800 km</p>
          <p class="kpi-detail">Alcance suborbital médio</p>
        </div>
      </section>

      <!-- Tabela CRUD Governança Canônica -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-veiculos-crud"
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

    .tone-assets-bg {
      background: color-mix(in oklab, var(--assets) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--assets) 30%, transparent);
      color: var(--assets);
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

    .tone-assets { color: var(--assets); background: color-mix(in oklab, var(--assets) 12%, transparent); }
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
export class VeiculosPageComponent {
  protected readonly crudMetadata = VEICULOS_CRUD_METADATA;
}
