import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import {
  MissionBriefingDrawerComponent,
  type MissionProfile,
} from './mission-briefing-drawer.component';

export const MISSOES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/missoes',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'titulo',
        header: 'Título da Missão',
        width: '280px',
        sortable: true,
      },
      {
        field: 'prioridade',
        header: 'Prioridade',
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
        field: 'localizacao',
        header: 'Teatro de Operações',
        width: '220px',
        sortable: true,
      },
      {
        field: 'dataInicioPrevista',
        header: 'Início Previsto',
        type: 'date',
        format: 'dd/MM/yyyy HH:mm',
        width: '180px',
        sortable: true,
      },
      {
        field: 'dataFimPrevista',
        header: 'Fim Previsto',
        type: 'date',
        format: 'dd/MM/yyyy HH:mm',
        width: '180px',
        sortable: true,
      },
    ],
  } as unknown as CrudMetadata['table'],
  actions: [
    {
      id: 'edit',
      label: 'Despacho Tático',
      action: 'edit',
      openMode: 'modal',
      formId: 'missoes-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Nova Missão',
      action: 'create',
      openMode: 'modal',
      formId: 'missoes-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '920px', maxWidth: '95vw' },
  },
};

@Component({
  selector: 'app-missoes-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, MissionBriefingDrawerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-operations">
            <span class="material-symbols-outlined">military_tech</span>
            Operações & Missões Táticas
          </div>
          <h1 class="title-gradient page-title">Centro de Missões</h1>
          <p class="page-subtitle">
            Planejamento, despacho tático, coordenação de equipes em campo e diário de bordo operacional.
          </p>
        </div>
      </header>

      <!-- KPI Bento Grid -->
      <section class="kpi-grid">
        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-operations"><span class="material-symbols-outlined">flight_takeoff</span></div>
          <p class="kpi-label">Missões Ativas em Campo</p>
          <p class="kpi-value">07 Incursões</p>
          <p class="kpi-detail text-ready">Todas em comunicação segura</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-ready"><span class="material-symbols-outlined">task_alt</span></div>
          <p class="kpi-label">Taxa de Sucesso Histórica</p>
          <p class="kpi-value">96,2%</p>
          <p class="kpi-detail">Últimos 12 meses consolidados</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-warning"><span class="material-symbols-outlined">schedule</span></div>
          <p class="kpi-label">Em Planejamento / Briefing</p>
          <p class="kpi-value">05 Missões</p>
          <p class="kpi-detail text-warning">Aguardando aprovação de compliance</p>
        </div>

        <div class="glass-panel kpi-card">
          <div class="kpi-icon tone-risk"><span class="material-symbols-outlined">crisis_alert</span></div>
          <p class="kpi-label">Prioridade Ômega / Crítica</p>
          <p class="kpi-value">01 Alerta</p>
          <p class="kpi-detail text-risk">Protocolo de resposta imediata ativo</p>
        </div>
      </section>

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-missoes-crud"
          [metadata]="crudMetadata"
          (rowClick)="onMissionRowClicked($event)"
        />
      </section>

      <!-- Mission Briefing Drawer -->
      <app-mission-briefing-drawer
        [mission]="selectedMission()"
        (close)="selectedMission.set(null)"
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
      background: color-mix(in oklab, var(--operations) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--operations) 30%, transparent);
      color: var(--operations);
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

    .tone-operations { color: var(--operations); background: color-mix(in oklab, var(--operations) 14%, transparent); }
    .tone-ready { color: var(--ready); background: color-mix(in oklab, var(--ready) 14%, transparent); }
    .tone-warning { color: var(--warning); background: color-mix(in oklab, var(--warning) 14%, transparent); }
    .tone-risk { color: var(--risk); background: color-mix(in oklab, var(--risk) 14%, transparent); }

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
export class MissoesPageComponent {
  protected readonly crudMetadata = MISSOES_CRUD_METADATA;
  protected readonly selectedMission = signal<MissionProfile | null>(null);

  protected onMissionRowClicked(event: unknown): void {
    const raw = (event as any)?.row ?? (event as any)?.data ?? event;
    if (!raw || typeof raw !== 'object' || !('id' in raw)) {
      return;
    }
    const mission: MissionProfile = {
      id: raw.id,
      titulo: raw.titulo || 'Operação Tática',
      descricao: raw.descricao,
      prioridade: raw.prioridade || 'MEDIA',
      status: raw.status || 'EM_ANDAMENTO',
      localizacao: raw.localizacao || 'Setor Global',
      dataInicioPrevista: raw.dataInicioPrevista,
      dataFimPrevista: raw.dataFimPrevista,
    };
    this.selectedMission.set(mission);
  }
}
