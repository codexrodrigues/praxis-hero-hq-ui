import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';

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
        header: 'Nome da Base / Complexo',
        width: '260px',
        sortable: true,
      },
      {
        field: 'tipo',
        header: 'Ambiente / Tipo',
        width: '160px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'sigilo',
        header: 'Classificação de Sigilo',
        width: '180px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'planeta',
        header: 'Setor Planetário',
        width: '150px',
        sortable: true,
      },
      {
        field: 'latitude',
        header: 'Latitude',
        width: '130px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'longitude',
        header: 'Longitude',
        width: '130px',
        align: 'right',
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
      label: 'Comissionar Base',
      action: 'create',
      openMode: 'modal',
      formId: 'bases-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '840px', maxWidth: '95vw' },
  },
};

@Component({
  selector: 'app-bases-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent],
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

      <!-- Bento Grid de KPIs -->
      <section class="kpi-grid">
        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-operations">
            <span class="material-symbols-outlined">apartment</span>
          </div>
          <p class="kpi-label">Instalações Globais</p>
          <p class="kpi-value">7 Complexos</p>
          <p class="kpi-detail">Terrestres, móveis, subterrâneas e orbitais</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-ready">
            <span class="material-symbols-outlined">satellite_alt</span>
          </div>
          <p class="kpi-label">Plataforma Orbital</p>
          <p class="kpi-value">Enterprise NCC-1701</p>
          <p class="kpi-detail text-ready">Vigilância subespacial contínua</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-warning">
            <span class="material-symbols-outlined">lock</span>
          </div>
          <p class="kpi-label">Nível Máximo de Sigilo</p>
          <p class="kpi-value">Wakanda Citadel</p>
          <p class="kpi-detail text-warning">Acesso restrito: Ultra Secreta</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-rh">
            <span class="material-symbols-outlined">security</span>
          </div>
          <p class="kpi-label">Blindagem Perimetral</p>
          <p class="kpi-value">100% Prontidão</p>
          <p class="kpi-detail">Escudos defletores ativados</p>
        </div>
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
export class BasesPageComponent {
  protected readonly crudMetadata = BASES_CRUD_METADATA;
}
