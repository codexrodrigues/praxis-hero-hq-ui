import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { type RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';
import { HeroDossierDrawerComponent, type HeroProfile } from './hero-dossier-drawer.component';
import { PRAXIS_API_BASE_URL } from '../../core/platform.config';

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

export const HEROES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      className: 'heroes-kpi-grid',
      items: [
        {
          id: 'total',
          label: 'Efetivo Total',
          value: '24 Cadastrados',
          caption: 'Quadro ativo e reserva',
          icon: 'group',
          tone: 'info',
        },
        {
          id: 'ativos',
          label: 'Em Prontidão Ativa',
          value: '21 Ativos',
          caption: '87,5% da força operacional',
          icon: 'verified_user',
          tone: 'success',
        },
        {
          id: 'inativos',
          label: 'Em Reserva / Licença',
          value: '03 Inativos',
          caption: 'Clark Kent · em licença civil',
          icon: 'person_off',
          tone: 'warning',
        },
        {
          id: 'reputacao',
          label: 'Score Reputacional Médio',
          value: '91,2 / 100',
          caption: 'Índice combinado público-governo',
          icon: 'auto_awesome',
          tone: 'neutral',
        },
      ],
    },
  ],
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
  fotoPerfilUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=face',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=face',
  scorePublico: 96,
  scoreGovernamental: 88,
  dataAdmissao: '15/04/2018',
};

@Component({
  selector: 'app-funcionarios-page',
  standalone: true,
  imports: [
    CommonModule,
    PraxisCrudComponent,
    PraxisRichContent,
    HeroDossierDrawerComponent,
  ],
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

      <!-- KPI Bento Grid Declarativo (praxis-rich-content) -->
      <section class="kpi-section">
        <praxis-rich-content [document]="kpiDocument" />
      </section>

      <!-- Canonical Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-funcionarios-crud"
          [metadata]="crudMetadata"
          (rowClick)="onHeroRowClicked($event)"
        />
      </section>

      <!-- Dossiê 360 Slide-over Drawer (praxis-rich-content inside) -->
      <app-hero-dossier-drawer
        [hero]="selectedHero()"
        [isTransitioning]="isTransitioning()"
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

    /* KPI Grid Enhancements */
    ::ng-deep {
      .heroes-kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 16px;
        width: 100%;
      }

      .bento-kpi-card {
        border-radius: 18px !important;
        padding: 20px !important;
        border: 1px solid var(--border) !important;
        background: color-mix(in oklab, var(--card) 60%, transparent) !important;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition: transform 0.2s ease, border-color 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          border-color: color-mix(in oklab, var(--primary) 40%, var(--border));
        }
      }

      .bento-kpi-card .prx-rich-card__title,
      .bento-kpi-card .pdx-rich-card__title {
        font-family: var(--font-display) !important;
        font-size: 1.8rem !important;
        font-weight: 700 !important;
        color: var(--foreground) !important;
        margin: 6px 0 8px !important;
      }

      .bento-kpi-card .prx-rich-card__subtitle,
      .bento-kpi-card .pdx-rich-card__subtitle {
        font-size: 0.72rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        color: var(--muted-foreground) !important;
      }

      .card-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .card-footnote {
        font-size: 0.72rem;
        color: var(--muted-foreground);
      }

      .text-ready { color: var(--ready) !important; }
      .text-warning { color: var(--warning) !important; }
    }

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
  protected readonly kpiDocument = HEROES_KPI_DOCUMENT;
  protected readonly selectedHero = signal<HeroProfile | null>(null);
  protected readonly isTransitioning = signal(false);
  protected readonly notice = signal<string | null>(null);

  private readonly http = inject(HttpClient);

  protected openSampleDossier(): void {
    this.selectedHero.set(SAMPLE_HERO);
  }

  protected onHeroRowClicked(event: unknown): void {
    const raw = (event as any)?.row ?? (event as any)?.data ?? event;
    if (!raw || typeof raw !== 'object' || !('id' in raw)) {
      return;
    }
    const hero: HeroProfile = {
      id: raw.id,
      nomeCompleto: raw.nomeCompleto || 'Colaborador',
      codinome: raw.codinome || (raw.nomeCompleto ? String(raw.nomeCompleto).split(' ')[0] : 'Herói'),
      cargoNome: raw.cargoNome || 'Especialista Operacional',
      departamentoNome: raw.departamentoNome || 'Divisão Tática',
      universo: raw.universo || 'Terra-616',
      ativo: Boolean(raw.ativo),
      salario: raw.salario || 0,
      cpf: raw.cpf || '***.***.***-**',
      telefone: raw.telefone || '+55 (11) 98888-0000',
      email: raw.email || 'confidencial@praxis.org',
      avatarUrl: raw.avatarUrl || raw.fotoPerfilUrl,
      fotoPerfilUrl: raw.fotoPerfilUrl || raw.avatarUrl,
      scorePublico: raw.scorePublico || 94,
      scoreGovernamental: raw.scoreGovernamental || 88,
      dataAdmissao: raw.dataAdmissao,
      resourceVersion: raw.resourceVersion,
    };
    this.selectedHero.set(hero);
  }

  protected onToggleStatus(hero: HeroProfile): void {
    if (this.isTransitioning()) return;

    this.isTransitioning.set(true);
    const action = hero.ativo ? 'deactivate' : 'reactivate';
    const payload = {
      effectiveAt: new Date().toISOString().substring(0, 10),
      reasonCode: hero.ativo ? 'RESERVA_OPERACIONAL' : 'REATIVACAO_QUADRO',
      comment: 'Transição de prontidão tática executada via Dossiê 360 do Centro de Comando.',
    };

    const headers: Record<string, string> = {};
    if (hero.resourceVersion) {
      headers['If-Match'] = hero.resourceVersion;
    }

    this.http
      .post(
        `${PRAXIS_API_BASE_URL}/human-resources/funcionarios/${hero.id}/actions/${action}`,
        payload,
        { headers }
      )
      .subscribe({
        next: () => {
          this.isTransitioning.set(false);
          const updated: HeroProfile = { ...hero, ativo: !hero.ativo };
          this.selectedHero.set(updated);
          this.showNotice(
            updated.ativo
              ? `Colaborador ${hero.nomeCompleto} reativado na força ativa com sucesso!`
              : `Colaborador ${hero.nomeCompleto} movido para a reserva com sucesso!`
          );
        },
        error: () => {
          this.isTransitioning.set(false);
          const updated: HeroProfile = { ...hero, ativo: !hero.ativo };
          this.selectedHero.set(updated);
          this.showNotice(
            updated.ativo
              ? `Colaborador ${hero.nomeCompleto} reativado na força ativa (local)!`
              : `Colaborador ${hero.nomeCompleto} movido para a reserva (local)!`
          );
        },
      });
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
