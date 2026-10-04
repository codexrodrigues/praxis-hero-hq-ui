import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { HeroDossierDrawerComponent, type HeroProfile } from './hero-dossier-drawer.component';

export const HEROES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/funcionarios',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'fotoPerfilUrl',
        header: 'Avatar',
        width: '72px',
        align: 'center',
        sortable: false,
        filterable: false,
        renderer: {
          type: 'avatar',
          avatar: {
            srcField: 'fotoPerfilUrl',
            altField: 'nomeCompleto',
            initialsField: 'nomeCompleto',
            shape: 'circle',
            size: 40,
          },
        },
      },
      {
        field: 'nomeCompleto',
        header: 'Nome Completo / Civil',
        width: '240px',
        sortable: true,
      },
      {
        field: 'cargoNome',
        header: 'Cargo',
        width: '220px',
        sortable: true,
      },
      {
        field: 'departamentoNome',
        header: 'Departamento',
        width: '240px',
        sortable: true,
      },
      {
        field: 'ativo',
        header: 'Status',
        type: 'boolean',
        format: 'custom|Ativo|Inativo',
        width: '120px',
        sortable: true,
      },
      {
        field: 'dataAdmissao',
        header: 'Data de Admissão',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '160px',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Editar Dossiê',
      action: 'edit',
      openMode: 'modal',
      formId: 'funcionarios-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Novo Colaborador',
      action: 'create',
      openMode: 'modal',
      formId: 'funcionarios-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '920px', maxWidth: '95vw' },
  },
};

const SAMPLE_HERO: HeroProfile = {
  id: 1,
  nomeCompleto: 'Anthony Edward Stark',
  codinome: 'Homem de Ferro',
  cargoNome: 'Engenheiro Chefe & Especialista Tático',
  departamentoNome: 'P&D e Tecnologia Avançada',
  universo: 'Terra-616',
  ativo: true,
  salario: 95000,
  cpf: '109.876.543-21',
  telefone: '+55 (11) 99887-6655',
  email: 'tony.stark@avengers.praxis.org',
  scorePublico: 96,
  scoreGovernamental: 88,
  dataAdmissao: '15/04/2018',
};

@Component({
  selector: 'app-funcionarios-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, HeroDossierDrawerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <!-- Tactical Feedback Banner -->
      @if (notice()) {
        <div class="tactical-notice glass-panel">
          <span class="material-symbols-outlined">info</span>
          <span>{{ notice() }}</span>
        </div>
      }

      <!-- Section Header -->
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag">
            <span class="material-symbols-outlined">shield</span>
            Pessoas & Recursos Humanos
          </div>
          <h1 class="title-gradient page-title">Heróis & Colaboradores</h1>
          <p class="page-subtitle">
            Gestão unificada do quadro operacional e identidades civis governada por metadados da Plataforma Praxis.
          </p>
        </div>

        <div class="header-actions">
          <button class="dossier-trigger-btn primary-gradient" (click)="openSampleDossier()">
            <span class="material-symbols-outlined">badge</span>
            Abrir Dossiê 360° (Exemplo)
          </button>
        </div>
      </header>

      <!-- KPI Bento Grid -->
      <section class="kpi-grid">
        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-rh">
            <span class="material-symbols-outlined">group</span>
          </div>
          <p class="kpi-label">Efetivo Total</p>
          <p class="kpi-value">24 Cadastrados</p>
          <p class="kpi-detail">Quadro ativo e reserva</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-ready">
            <span class="material-symbols-outlined">verified_user</span>
          </div>
          <p class="kpi-label">Em Prontidão Ativa</p>
          <p class="kpi-value">21 Ativos</p>
          <p class="kpi-detail text-ready">87,5% da força operacional</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-warning">
            <span class="material-symbols-outlined">person_off</span>
          </div>
          <p class="kpi-label">Em Reserva / Licença</p>
          <p class="kpi-value">03 Inativos</p>
          <p class="kpi-detail text-warning">Clark Kent · em licença civil</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon-wrap tone-operations">
            <span class="material-symbols-outlined">auto_awesome</span>
          </div>
          <p class="kpi-label">Score Reputacional Médio</p>
          <p class="kpi-value">91,2 / 100</p>
          <p class="kpi-detail">Índice combinado público-governo</p>
        </div>
      </section>

      <!-- Canonical Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-funcionarios-crud"
          [metadata]="crudMetadata"
        />
      </section>

      <!-- Dossiê 360 Slide-over Drawer -->
      <app-hero-dossier-drawer
        [hero]="selectedHero()"
        (close)="selectedHero.set(null)"
        (toggleStatus)="onToggleStatus($event)"
      />
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1540px;
      margin: 0 auto;
      position: relative;
    }

    .tactical-notice {
      position: fixed;
      top: 96px;
      right: 28px;
      z-index: 100;
      padding: 12px 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: color-mix(in oklab, var(--card) 95%, transparent);
      border-color: var(--primary);
      box-shadow: var(--shadow-command);
      animation: fadeIn 0.2s ease-out;

      span:first-child { color: var(--primary); font-size: 20px; }
      span:last-child { font-size: 0.85rem; font-weight: 600; }
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
      background: color-mix(in oklab, var(--rh) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--rh) 30%, transparent);
      color: var(--rh);
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
      line-height: 1.15;
    }

    .page-subtitle {
      margin: 8px 0 0;
      font-size: 0.88rem;
      color: var(--muted-foreground);
      max-width: 720px;
    }

    .dossier-trigger-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 42px;
      padding: 0 18px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: transform 0.15s ease;

      &:hover {
        transform: translateY(-2px);
      }

      span { font-size: 18px; }
    }

    /* KPI Bento Grid */
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

    /* CRUD Surface */
    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class FuncionariosPageComponent {
  protected readonly crudMetadata = HEROES_CRUD_METADATA;
  protected readonly selectedHero = signal<HeroProfile | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected openSampleDossier(): void {
    this.selectedHero.set(SAMPLE_HERO);
  }

  protected onToggleStatus(hero: HeroProfile): void {
    const updated: HeroProfile = { ...hero, ativo: !hero.ativo };
    this.selectedHero.set(updated);
    this.showNotice(
      updated.ativo
        ? `Colaborador ${hero.nomeCompleto} reativado na força ativa com sucesso.`
        : `Colaborador ${hero.nomeCompleto} movido para a reserva com sucesso.`
    );
  }

  private showNotice(msg: string): void {
    this.notice.set(msg);
    setTimeout(() => {
      if (this.notice() === msg) {
        this.notice.set(null);
      }
    }, 3500);
  }
}
