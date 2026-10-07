import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type {
  RichCardNode,
  RichContentDocument,
} from '@praxisui/core';
import { PraxisRichContent } from '@praxisui/rich-content';
import { PRAXIS_API_BASE_URL } from '../../core/platform.config';

export interface MissionProfile {
  id: number;
  titulo: string;
  descricao?: string;
  prioridade: string;
  status: string;
  localizacao: string;
  dataInicioPrevista?: string;
  dataFimPrevista?: string;
}

export interface MissionParticipant {
  id: number;
  missaoId: number;
  funcionarioId: number;
  funcionarioNome: string;
  funcionarioFotoUrl?: string;
  papel: string;
  ordem?: number;
  principal?: boolean;
  resultado?: string;
}

export interface IncidentRecord {
  id: number;
  descricao: string;
  severidade: string;
  local: string;
  danosCivis?: number;
  feridos?: number;
}

export interface VehicleMissionUsage {
  id: number;
  veiculoId: number;
  veiculoNome?: string;
  missaoId: number;
  statusUso?: string;
}

export type MissionTabId = 'briefing' | 'squad' | 'incidents';

/**
 * 1. Hero Identity Card (Top of Drawer)
 */
export function buildMissionHeaderDocument(mission: MissionProfile): RichContentDocument {
  const isHighPriority =
    mission.prioridade === 'ALTA' ||
    mission.prioridade === 'CRITICA' ||
    mission.prioridade === 'OMEGA';

  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: [
      {
        type: 'card',
        variant: 'unstyled',
        tone: 'neutral',
        className: 'glass-panel briefing-hero-card',
        title: mission.titulo,
        subtitle: `Teatro: ${mission.localizacao} · Código: #MIS-${mission.id}`,
        media: {
          kind: 'icon',
          icon: 'military_tech',
          placement: 'leading',
        },
        content: [
          {
            type: 'compose',
            direction: 'row',
            gap: 'xs',
            items: [
              {
                type: 'badge',
                label: `PRIORIDADE: ${mission.prioridade}`,
                className: isHighPriority
                  ? 'status-pill priority-high'
                  : 'status-pill priority-standard',
              },
              {
                type: 'badge',
                label: mission.status,
                className:
                  mission.status === 'CONCLUIDA'
                    ? 'status-pill status-ready'
                    : mission.status === 'FALHOU'
                      ? 'status-pill priority-high'
                      : 'status-pill status-active',
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * 2. Briefing Tático & Diretrizes
 */
export function buildBriefingParamsDocument(mission: MissionProfile): RichContentDocument {
  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: [
      {
        type: 'propertySheet',
        title: 'Parâmetros Operacionais',
        columns: 2,
        items: [
          { id: 'id', label: 'Código da Missão', value: `#MIS-${mission.id}`, icon: 'tag' },
          { id: 'local', label: 'Teatro de Operações', value: mission.localizacao, icon: 'explore' },
          {
            id: 'inicio',
            label: 'Janela de Início',
            value: mission.dataInicioPrevista || 'Imediato',
            icon: 'schedule',
          },
          {
            id: 'fim',
            label: 'Janela de Conclusão',
            value: mission.dataFimPrevista || 'Sob demanda tática',
            icon: 'event_available',
          },
          { id: 'prioridade', label: 'Nível de Resposta', value: mission.prioridade, icon: 'priority_high' },
          { id: 'status', label: 'Status Operacional', value: mission.status, icon: 'verified' },
        ],
      },
      {
        type: 'card',
        variant: 'unstyled',
        tone: 'neutral',
        className: 'glass-panel objective-card',
        title: 'Objetivo Estratégico & Diretrizes',
        content: [
          {
            type: 'text',
            text:
              mission.descricao ||
              'Operação tática autorizada pelo Comando Central. Todas as unidades devem manter silêncio de rádio subespacial e resguardar prioritariamente a integridade das zonas residenciais civis.',
          },
        ],
      },
      {
        type: 'timeline',
        title: 'Protocolos de Engajamento Ativos',
        density: 'comfortable',
        connectorVariant: 'solid',
        items: [
          {
            id: 'p1',
            title: 'Protocolo Alpha-9: Força Proporcional',
            subtitle: 'Emprego de força proporcional com mitigação estrita de danos colaterais a infraestruturas civis.',
            icon: 'verified',
            badge: 'ATIVO',
            markerColor: 'success',
          },
          {
            id: 'p2',
            title: 'Telemetria Quântica Criptografada',
            subtitle: 'Transmissão contínua de sinais vitais, biometria e status de blindagem em tempo real ao Centro de Comando.',
            icon: 'cell_tower',
            badge: 'LINK SEGURO',
            markerColor: 'warning',
          },
          {
            id: 'p3',
            title: 'Evacuação & Suporte Médico de Emergência',
            subtitle: 'Ponto de extração prioritária e suporte tático pré-alocado na Base Central.',
            icon: 'local_hospital',
            badge: 'STANDBY',
            markerColor: 'info',
          },
        ],
      },
    ],
  };
}

/**
 * 3. Operadores Designados (Squad)
 */
export function buildSquadDocument(participants: MissionParticipant[]): RichContentDocument {
  if (participants.length === 0) {
    return {
      kind: 'praxis.rich-content',
      version: '1.0.0',
      nodes: [
        {
          type: 'emptyState',
          icon: 'person_search',
          title: 'Nenhum operador designado',
          message: 'Nenhum herói ou especialista foi formalmente alocado para este teatro operacional.',
        },
      ],
    };
  }

  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: participants.map((p): RichCardNode => ({
      type: 'card',
      variant: 'unstyled',
      tone: 'neutral',
      className: 'glass-panel squad-card-item',
      title: p.funcionarioNome,
      subtitle: `Função: ${p.papel} · Ordem: #${p.ordem || 1} · ${p.principal ? 'Operador Primário' : 'Força de Apoio'}`,
      media: {
        kind: 'avatar',
        src: p.funcionarioFotoUrl || '',
        label: p.funcionarioNome,
        alt: p.funcionarioNome,
        placement: 'leading',
      },
      content: [
        {
          type: 'compose',
          direction: 'row',
          gap: 'xs',
          items: [
            {
              type: 'badge',
              label: p.papel,
              className: p.papel === 'LIDER' ? 'status-pill role-lider' : 'status-pill role-agent',
            },
            ...(p.resultado
              ? [
                  {
                    type: 'badge' as const,
                    label: `RESULTADO: ${p.resultado}`,
                    className: 'status-pill status-ready',
                  },
                ]
              : []),
          ],
        },
      ],
    })),
  };
}

/**
 * 4. Sinistros & Incidentes
 */
export function buildIncidentsDocument(incidents: IncidentRecord[]): RichContentDocument {
  if (incidents.length === 0) {
    return {
      kind: 'praxis.rich-content',
      version: '1.0.0',
      nodes: [
        {
          type: 'emptyState',
          icon: 'task_alt',
          title: 'Operação sem danos colaterais',
          message: 'Nenhum sinistro, ferido ou prejuízo a infraestruturas civis foi reportado durante esta missão.',
        },
      ],
    };
  }

  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: incidents.map((inc): RichCardNode => ({
      type: 'card',
      variant: 'unstyled',
      tone: 'neutral',
      className: 'glass-panel incident-card-item',
      title: inc.descricao,
      subtitle: `Local: ${inc.local} · Prejuízo Estimado: R$ ${(inc.danosCivis || 0).toLocaleString('pt-BR')} · Feridos: ${inc.feridos || 0}`,
      media: {
        kind: 'icon',
        icon: 'crisis_alert',
        placement: 'leading',
      },
      content: [
        {
          type: 'badge',
          label: `SEVERIDADE: ${inc.severidade}`,
          className:
            inc.severidade === 'CRITICA' || inc.severidade === 'ALTA'
              ? 'status-pill sev-critical'
              : 'status-pill sev-standard',
        },
      ],
    })),
  };
}

@Component({
  selector: 'app-mission-briefing-drawer',
  standalone: true,
  imports: [CommonModule, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (mission(); as m) {
      <div class="drawer-overlay" (click)="close.emit()">
        <aside class="drawer-content" (click)="$event.stopPropagation()">
          <!-- Top Bar Fixa Governança + Fechar -->
          <div class="drawer-top-bar">
            <span class="dossier-badge">
              <span class="material-symbols-outlined">military_tech</span>
              BRIEFING OPERACIONAL TÁTICO · PRAXIS GOVERNED
            </span>
            <button class="close-icon-btn" (click)="close.emit()" aria-label="Fechar Briefing">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Cabeçalho Fixo com Hero Card e Segmented Tabs -->
          <div class="drawer-fixed-header">
            <praxis-rich-content [document]="headerDocument()" />

            <nav class="dossier-tabs-nav" role="tablist">
              <button
                type="button"
                role="tab"
                class="tab-btn"
                [class.is-active]="activeTab() === 'briefing'"
                [attr.aria-selected]="activeTab() === 'briefing'"
                (click)="activeTab.set('briefing')"
              >
                <span class="material-symbols-outlined">description</span>
                <span>Briefing Tático</span>
              </button>
              <button
                type="button"
                role="tab"
                class="tab-btn"
                [class.is-active]="activeTab() === 'squad'"
                [attr.aria-selected]="activeTab() === 'squad'"
                (click)="activeTab.set('squad')"
              >
                <span class="material-symbols-outlined">groups</span>
                <span>Operadores Designados</span>
                @if (participants().length) {
                  <span class="tab-count-chip">{{ participants().length }}</span>
                }
              </button>
              <button
                type="button"
                role="tab"
                class="tab-btn"
                [class.is-active]="activeTab() === 'incidents'"
                [attr.aria-selected]="activeTab() === 'incidents'"
                (click)="activeTab.set('incidents')"
              >
                <span class="material-symbols-outlined">crisis_alert</span>
                <span>Sinistros & Incidentes</span>
                @if (incidents().length) {
                  <span class="tab-count-chip">{{ incidents().length }}</span>
                }
              </button>
            </nav>
          </div>

          <!-- Corpo Rolável com Abas Táticas -->
          <div class="drawer-body">
            @if (isLoading()) {
              <div class="dossier-loading">
                <span class="material-symbols-outlined spin">progress_activity</span>
                <span>Carregando telemetria operacional da missão...</span>
              </div>
            }

            <div class="tab-pane" [hidden]="activeTab() !== 'briefing'">
              <praxis-rich-content [document]="briefingDocument()" />
            </div>

            <div class="tab-pane" [hidden]="activeTab() !== 'squad'">
              <praxis-rich-content [document]="squadDocument()" />
            </div>

            <div class="tab-pane" [hidden]="activeTab() !== 'incidents'">
              <praxis-rich-content [document]="incidentsDocument()" />
            </div>
          </div>
        </aside>
      </div>
    }
  `,
  styles: [`
    .drawer-overlay {
      position: fixed;
      inset: 0;
      z-index: 90;
      background: var(--overlay);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      justify-content: flex-end;
    }

    .drawer-content {
      width: 100%;
      max-width: 740px;
      height: 100%;
      background: var(--background);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-command);
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
    }

    .drawer-top-bar {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: color-mix(in oklab, var(--card) 60%, transparent);
    }

    .drawer-fixed-header {
      padding: 16px 24px 12px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: color-mix(in oklab, var(--card) 45%, var(--background));
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .dossier-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: color-mix(in oklab, var(--operations) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--operations) 28%, transparent);
      color: var(--operations);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;

      span { font-size: 16px; }
    }

    .close-icon-btn {
      background: transparent;
      border: none;
      color: var(--muted-foreground);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      transition: all 0.15s ease;

      &:hover {
        background: var(--accent);
        color: var(--foreground);
      }
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px 24px 48px 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .dossier-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px;
      border-radius: 10px;
      background: color-mix(in oklab, var(--card) 70%, transparent);
      border: 1px solid var(--border);
      font-size: 0.8rem;
      color: var(--muted-foreground);
    }

    /* Tabs Bar - Segmented Control Pattern */
    .dossier-tabs-nav {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      padding: 6px;
      border-radius: 12px;
      background: color-mix(in oklab, var(--muted) 60%, var(--card));
      border: 1px solid var(--border);
      scrollbar-width: none;
      min-height: 46px;
      box-sizing: border-box;
      flex-shrink: 0;
      &::-webkit-scrollbar { display: none; }
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 9px;
      border: 1px solid transparent;
      outline: none;
      background: transparent;
      color: var(--muted-foreground);
      font-size: 0.84rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      span.material-symbols-outlined {
        font-size: 19px;
        opacity: 0.85;
      }

      &:hover:not(.is-active) {
        background: color-mix(in oklab, var(--operations) 10%, var(--card));
        color: var(--foreground);
        border-color: color-mix(in oklab, var(--operations) 20%, transparent);
      }

      &:focus-visible {
        outline: 2px solid var(--operations);
        outline-offset: 1px;
      }

      &.is-active {
        background: var(--card);
        border: 1px solid color-mix(in oklab, var(--operations) 40%, var(--border));
        color: var(--operations);
        font-weight: 700;
        box-shadow: 0 2px 8px color-mix(in oklab, var(--operations) 15%, transparent), 0 1px 3px rgba(0, 0, 0, 0.08);

        span.material-symbols-outlined {
          opacity: 1;
        }
      }
    }

    :host-context(.dark) .tab-btn.is-active {
      background: color-mix(in oklab, var(--operations) 20%, var(--card));
      border-color: color-mix(in oklab, var(--operations) 50%, transparent);
      color: var(--operations);
      box-shadow: 0 2px 10px color-mix(in oklab, var(--operations) 28%, transparent);
    }

    .tab-count-chip {
      background: color-mix(in oklab, var(--operations) 20%, transparent);
      color: var(--operations);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 9999px;
    }

    .tab-pane {
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: fadeIn 0.2s ease-out;

      &[hidden] {
        display: none !important;
      }
    }

    .glass-panel {
      background: color-mix(in oklab, var(--card) 80%, transparent);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 16px;
    }

    /* Estilos Cyber Command & Glassmorphism para os nós do briefing */
    ::ng-deep {
      .briefing-hero-card {
        border-radius: 18px !important;
        padding: 18px 20px !important;
        background: color-mix(in oklab, var(--card) 75%, transparent) !important;
        border: 1px solid var(--border) !important;

        .prx-rich-card {
          display: grid !important;
          grid-template-columns: 56px 1fr !important;
          align-items: center !important;
          gap: 16px !important;
        }

        .prx-rich-card-media {
          grid-column: 1 !important;
          background: color-mix(in oklab, var(--operations) 16%, var(--card)) !important;
          color: var(--operations) !important;
          width: 54px !important;
          height: 54px !important;
          border-radius: 14px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: 1px solid color-mix(in oklab, var(--operations) 35%, transparent) !important;

          span.material-symbols-outlined {
            font-size: 28px !important;
          }
        }

        .prx-rich-card-heading {
          grid-column: 2 !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 4px !important;
          min-width: 0 !important;
        }

        .prx-rich-card-title,
        .pdx-rich-card__title {
          font-family: var(--font-display) !important;
          font-size: 1.35rem !important;
          font-weight: 700 !important;
          letter-spacing: -0.02em !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          color: var(--foreground) !important;
        }

        .prx-rich-card-subtitle,
        .pdx-rich-card__subtitle {
          font-size: 0.82rem !important;
          color: var(--muted-foreground) !important;
          margin: 0 !important;
        }

        .prx-rich-card-body {
          grid-column: 2 !important;
          margin-top: 4px !important;
        }
      }

      .briefing-section-card {
        padding: 20px !important;
        border-radius: 16px !important;
        margin-bottom: 16px !important;

        .prx-rich-card-title {
          font-family: var(--font-display) !important;
          font-size: 1.05rem !important;
          font-weight: 700 !important;
          color: var(--foreground) !important;
          margin: 0 0 4px 0 !important;
        }

        .prx-rich-card-subtitle {
          font-size: 0.8rem !important;
          color: var(--muted-foreground) !important;
          margin: 0 0 16px 0 !important;
        }
      }

      .objective-card {
        border-left: 3px solid var(--operations) !important;
        background: color-mix(in oklab, var(--operations) 5%, var(--card)) !important;
      }

      .squad-card-item,
      .incident-card-item {
        border-radius: 14px !important;
        padding: 16px 18px !important;
        margin-bottom: 12px !important;
        background: color-mix(in oklab, var(--card) 70%, transparent) !important;
        border: 1px solid var(--border) !important;
        transition: transform 0.15s ease, border-color 0.15s ease;

        &:hover {
          transform: translateY(-1px);
          border-color: color-mix(in oklab, var(--operations) 40%, var(--border));
        }

        .prx-rich-card-title {
          font-size: 1rem !important;
          font-weight: 700 !important;
          margin: 0 0 2px 0 !important;
        }

        .prx-rich-card-subtitle {
          font-size: 0.8rem !important;
          color: var(--muted-foreground) !important;
          margin: 0 0 10px 0 !important;
        }
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .priority-standard {
        background: color-mix(in oklab, var(--operations) 15%, transparent);
        color: var(--operations);
        border: 1px solid color-mix(in oklab, var(--operations) 30%, transparent);
      }

      .priority-high {
        background: color-mix(in oklab, var(--destructive) 15%, transparent);
        color: var(--destructive);
        border: 1px solid color-mix(in oklab, var(--destructive) 30%, transparent);
      }

      .status-active {
        background: color-mix(in oklab, var(--primary) 15%, transparent);
        color: var(--primary);
        border: 1px solid color-mix(in oklab, var(--primary) 30%, transparent);
      }

      .status-ready {
        background: color-mix(in oklab, var(--ready) 15%, transparent);
        color: var(--ready);
        border: 1px solid color-mix(in oklab, var(--ready) 30%, transparent);
      }

      .role-lider {
        background: color-mix(in oklab, var(--primary) 15%, transparent);
        color: var(--primary);
        border: 1px solid color-mix(in oklab, var(--primary) 30%, transparent);
      }

      .role-agent {
        background: color-mix(in oklab, var(--operations) 15%, transparent);
        color: var(--operations);
        border: 1px solid color-mix(in oklab, var(--operations) 30%, transparent);
      }

      .sev-critical {
        background: color-mix(in oklab, var(--destructive) 15%, transparent);
        color: var(--destructive);
        border: 1px solid color-mix(in oklab, var(--destructive) 30%, transparent);
      }

      .sev-standard {
        background: color-mix(in oklab, var(--warning) 15%, transparent);
        color: var(--warning);
        border: 1px solid color-mix(in oklab, var(--warning) 30%, transparent);
      }
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class MissionBriefingDrawerComponent implements OnDestroy {
  readonly mission = input<MissionProfile | null>(null);
  readonly close = output<void>();

  protected readonly activeTab = signal<MissionTabId>('briefing');
  protected readonly isLoading = signal<boolean>(false);
  protected readonly participants = signal<MissionParticipant[]>([]);
  protected readonly incidents = signal<IncidentRecord[]>([]);

  private readonly http = inject(HttpClient);
  private dataSub: Subscription | null = null;

  protected readonly headerDocument = computed<RichContentDocument>(() => {
    const m = this.mission();
    if (!m) return { kind: 'praxis.rich-content', version: '1.0.0', nodes: [] };
    return buildMissionHeaderDocument(m);
  });

  protected readonly briefingDocument = computed<RichContentDocument>(() => {
    const m = this.mission();
    if (!m) return { kind: 'praxis.rich-content', version: '1.0.0', nodes: [] };
    return buildBriefingParamsDocument(m);
  });

  protected readonly squadDocument = computed<RichContentDocument>(() => {
    return buildSquadDocument(this.participants());
  });

  protected readonly incidentsDocument = computed<RichContentDocument>(() => {
    return buildIncidentsDocument(this.incidents());
  });

  constructor() {
    effect(() => {
      const m = this.mission();
      if (!m?.id) {
        this.dataSub?.unsubscribe();
        this.participants.set([]);
        this.incidents.set([]);
        this.activeTab.set('briefing');
        this.isLoading.set(false);
        return;
      }
      this.fetchMissionData(m.id);
    });
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
  }

  private fetchMissionData(missionId: number): void {
    this.dataSub?.unsubscribe();
    this.isLoading.set(true);

    const participants$ = this.http
      .post<{ data?: { content?: MissionParticipant[] } }>(
        `${PRAXIS_API_BASE_URL}/operations/missao-participantes/filter`,
        { missaoId: missionId }
      )
      .pipe(
        map((res) => res.data?.content || []),
        catchError(() => of([] as MissionParticipant[]))
      );

    const incidents$ = this.http
      .post<{ data?: { content?: IncidentRecord[] } }>(
        `${PRAXIS_API_BASE_URL}/operations/incidentes/filter`,
        { missaoId: missionId }
      )
      .pipe(
        map((res) => res.data?.content || []),
        catchError(() => of([] as IncidentRecord[]))
      );

    this.dataSub = forkJoin({
      participants: participants$,
      incidents: incidents$,
    }).subscribe({
      next: ({ participants, incidents }) => {
        this.participants.set(participants);
        this.incidents.set(incidents);
        this.isLoading.set(false);
      },
      error: () => {
        this.participants.set([]);
        this.incidents.set([]);
        this.isLoading.set(false);
      },
    });
  }
}
