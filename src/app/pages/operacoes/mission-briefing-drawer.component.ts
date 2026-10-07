import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import type {
  RichBlockHostCapabilities,
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

function buildMissionBriefingDocument(
  mission: MissionProfile,
  participants: MissionParticipant[],
  incidents: IncidentRecord[]
): RichContentDocument {
  const isHighPriority =
    mission.prioridade === 'ALTA' ||
    mission.prioridade === 'CRITICA' ||
    mission.prioridade === 'OMEGA';

  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: [
      // 1. Header Mission Identity Card
      {
        type: 'card',
        variant: 'unstyled',
        tone: 'neutral',
        className: 'glass-panel briefing-hero-card',
        title: mission.titulo,
        subtitle: `Teatro de Operações: ${mission.localizacao} · ID: #MIS-${mission.id}`,
        media: {
          kind: 'icon',
          icon: 'military_tech',
          placement: 'leading',
        },
        headerAction: {
          type: 'actionButton',
          label: 'Fechar',
          icon: 'close',
          variant: 'stroked',
          color: 'basic',
          action: {
            actionId: 'drawer.close',
          },
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
                className: 'status-pill status-ready',
              },
            ],
          },
        ],
      },

      // 2. Tabs: Briefing Tático, Operadores (Squad), Sinistros
      {
        type: 'tabs',
        appearance: 'pills',
        defaultTabId: 'tab-briefing',
        items: [
          // TAB 1: BRIEFING TÁTICO & DIRETRIZES
          {
            id: 'tab-briefing',
            label: 'Briefing Tático',
            icon: 'description',
            content: [
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
                    value: mission.dataFimPrevista || 'Sob demanda',
                    icon: 'event_available',
                  },
                  { id: 'prioridade', label: 'Nível de Resposta', value: mission.prioridade, icon: 'priority_high' },
                  { id: 'status', label: 'Status Atual', value: mission.status, icon: 'verified' },
                ],
              },
              {
                type: 'card',
                variant: 'outlined',
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
                    subtitle: 'Emprego de força proporcional com mitigação estrita de danos colaterais.',
                    icon: 'verified',
                    badge: 'ATIVO',
                    markerColor: 'success',
                  },
                  {
                    id: 'p2',
                    title: 'Telemetria Quântica Criptografada',
                    subtitle: 'Transmissão contínua de sinais biométricos e prontidão em tempo real ao HQ.',
                    icon: 'cell_tower',
                    badge: 'LINK SEGURO',
                    markerColor: 'warning',
                  },
                  {
                    id: 'p3',
                    title: 'Evacuação & Suporte Médico de Emergência',
                    subtitle: 'Ponto de extração médica prioritário definido para a Base Ômega Central.',
                    icon: 'local_hospital',
                    badge: 'STANDBY',
                    markerColor: 'info',
                  },
                ],
              },
            ],
          },

          // TAB 2: OPERADORES & SQUAD DESIGNADO
          {
            id: 'tab-squad',
            label: 'Operadores Designados',
            icon: 'groups',
            badge: participants.length > 0 ? String(participants.length) : undefined,
            content:
              participants.length > 0
                ? participants.map((p): RichCardNode => ({
                    type: 'card',
                    variant: 'outlined',
                    className: 'glass-panel squad-card-item',
                    title: p.funcionarioNome,
                    subtitle: `Função: ${p.papel} · Ordem de Inserção: #${p.ordem || 1} · ${p.principal ? 'Operador Primário' : 'Força de Apoio'}`,
                    media: {
                      kind: 'avatar',
                      src: p.funcionarioFotoUrl || '',
                      placement: 'leading',
                    },
                    content: [
                      {
                        type: 'badge',
                        label: p.papel,
                        className: p.papel === 'LIDER' ? 'status-pill role-lider' : 'status-pill role-agent',
                      },
                    ],
                  }))
                : [
                    {
                      type: 'emptyState',
                      icon: 'person_search',
                      title: 'Nenhum operador alocado',
                      message: 'Nenhum herói ou especialista foi designado diretamente para este teatro operacional.',
                    },
                  ],
          },

          // TAB 3: SINISTROS & INCIDENTES CIVIS
          {
            id: 'tab-incidents',
            label: 'Sinistros & Incidentes',
            icon: 'siren',
            badge: incidents.length > 0 ? String(incidents.length) : undefined,
            content:
              incidents.length > 0
                ? incidents.map((inc): RichCardNode => ({
                    type: 'card',
                    variant: 'outlined',
                    className: 'glass-panel incident-card-item',
                    title: inc.descricao,
                    subtitle: `Local: ${inc.local} · Prejuízo Estimado: R$ ${(inc.danosCivis || 0).toLocaleString('pt-BR')}`,
                    media: {
                      kind: 'icon',
                      icon: 'siren',
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
                  }))
                : [
                    {
                      type: 'emptyState',
                      icon: 'task_alt',
                      title: 'Nenhum sinistro registrado',
                      message: 'Esta operação tática não gerou danos colaterais civis ou sinistros reportados.',
                    },
                  ],
          },
        ],
      },
    ],
  };
}

@Component({
  selector: 'app-mission-briefing-drawer',
  standalone: true,
  imports: [CommonModule, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (mission) {
      <div class="drawer-overlay" (click)="close.emit()">
        <aside class="drawer-content" (click)="$event.stopPropagation()">
          <div class="drawer-body">
            @if (briefingDocument(); as doc) {
              <praxis-rich-content
                [document]="doc"
                [hostCapabilities]="hostCapabilities"
              />
            }
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
      display: flex;
      justify-content: flex-end;
    }

    .drawer-content {
      width: 100%;
      max-width: 680px;
      height: 100%;
      background: var(--background);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-command);
      animation: slideIn 0.25s ease-out;
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    /* Estilos Cyber Command & Glassmorphism para os nós do briefing */
    ::ng-deep {
      .briefing-hero-card {
        margin-bottom: 20px !important;
        border-radius: 18px !important;
        padding: 22px !important;
        background: color-mix(in oklab, var(--card) 65%, transparent) !important;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--border) !important;
      }

      .briefing-hero-card .prx-rich-card__title,
      .briefing-hero-card .pdx-rich-card__title {
        font-family: var(--font-display) !important;
        font-size: 1.5rem !important;
        font-weight: 700 !important;
        letter-spacing: -0.02em !important;
      }

      .briefing-hero-card .prx-rich-card__subtitle,
      .briefing-hero-card .pdx-rich-card__subtitle {
        font-size: 0.82rem !important;
        color: var(--muted-foreground) !important;
        margin-top: 4px !important;
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

      .status-ready {
        background: color-mix(in oklab, var(--ready) 15%, transparent);
        color: var(--ready);
        border: 1px solid color-mix(in oklab, var(--ready) 30%, transparent);
      }

      .role-lider {
        background: color-mix(in oklab, var(--primary) 15%, transparent);
        color: var(--primary);
      }

      .role-agent {
        background: color-mix(in oklab, var(--operations) 15%, transparent);
        color: var(--operations);
      }

      .sev-critical {
        background: color-mix(in oklab, var(--destructive) 15%, transparent);
        color: var(--destructive);
      }

      .sev-standard {
        background: color-mix(in oklab, var(--warning) 15%, transparent);
        color: var(--warning);
      }

      .squad-card-item,
      .incident-card-item,
      .objective-card {
        border-radius: 14px !important;
        padding: 16px !important;
        margin-bottom: 12px !important;
        background: color-mix(in oklab, var(--card) 45%, transparent) !important;
        border: 1px solid var(--border) !important;
      }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
  `],
})
export class MissionBriefingDrawerComponent implements OnChanges {
  @Input() mission: MissionProfile | null = null;
  @Output() close = new EventEmitter<void>();

  protected readonly participants = signal<MissionParticipant[]>([]);
  protected readonly incidents = signal<IncidentRecord[]>([]);

  private readonly http = inject(HttpClient);

  protected readonly briefingDocument = computed<RichContentDocument | null>(() => {
    const m = this.mission;
    if (!m) return null;
    return buildMissionBriefingDocument(m, this.participants(), this.incidents());
  });

  protected readonly hostCapabilities: RichBlockHostCapabilities = {
    dispatchAction: (actionId: string) => {
      if (actionId === 'drawer.close') {
        this.close.emit();
      }
    },
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mission'] && this.mission?.id) {
      this.fetchMissionData(this.mission.id);
    }
  }

  private fetchMissionData(missionId: number): void {
    this.http
      .post<{ data?: { content?: MissionParticipant[] } }>(
        `${PRAXIS_API_BASE_URL}/operations/missao-participantes/filter`,
        { missaoId: missionId }
      )
      .subscribe({
        next: (res) => this.participants.set(res.data?.content || []),
        error: () => this.participants.set([]),
      });

    this.http
      .post<{ data?: { content?: IncidentRecord[] } }>(
        `${PRAXIS_API_BASE_URL}/operations/incidentes/filter`,
        { missaoId: missionId }
      )
      .subscribe({
        next: (res) => this.incidents.set(res.data?.content || []),
        error: () => this.incidents.set([]),
      });
  }
}
