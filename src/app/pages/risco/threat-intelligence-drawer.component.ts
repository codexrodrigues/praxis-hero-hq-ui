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
import { Subscription, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type {
  RichCardNode,
  RichContentDocument,
  RichTimelineItem,
} from '@praxisui/core';
import { PraxisRichContent } from '@praxisui/rich-content';
import { PRAXIS_API_BASE_URL } from '../../core/platform.config';

export interface ThreatProfile {
  id: number;
  nome: string;
  classe: string;
  planeta: string;
  nivel: number;
  status: string;
  recompensa: number;
}

export interface ThreatMission {
  id: number;
  titulo: string;
  objetivo?: string;
  prioridade: string;
  status: string;
  local: string;
  inicioPrev?: string;
  fimPrev?: string;
  inicioReal?: string | null;
  fimReal?: string | null;
}

export type ThreatTabId = 'intel' | 'missions' | 'containment';

/**
 * 1. Header do Dossiê de Inteligência (Top do Drawer)
 */
export function buildThreatHeaderDocument(threat: ThreatProfile): RichContentDocument {
  const isOmegaLevel = threat.nivel >= 6;
  const isContained =
    threat.status === 'CAPTURADO' ||
    threat.status === 'CONTIDO' ||
    threat.status === 'ELIMINADO';

  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: [
      {
        type: 'card',
        variant: 'unstyled',
        tone: 'neutral',
        className: 'glass-panel threat-hero-card',
        title: threat.nome,
        subtitle: `Origem: ${threat.planeta} · Classe: ${threat.classe} · Código: #THR-${threat.id}`,
        media: {
          kind: 'icon',
          icon: isOmegaLevel ? 'crisis_alert' : 'warning',
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
                label: `NÍVEL ${threat.nivel} / 10`,
                className: isOmegaLevel ? 'status-pill level-omega' : 'status-pill level-standard',
              },
              {
                type: 'badge',
                label: threat.status,
                className: isContained
                  ? 'status-pill status-contained'
                  : threat.status === 'CONFRONTO'
                    ? 'status-pill status-confrontation'
                    : 'status-pill status-active',
              },
              {
                type: 'badge',
                label: `RECOMPENSA: R$ ${threat.recompensa.toLocaleString('pt-BR')}`,
                className: 'status-pill bounty-badge',
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * 2. Dossiê de Inteligência & Perfil Forense
 */
export function buildThreatIntelDocument(threat: ThreatProfile): RichContentDocument {
  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: [
      {
        type: 'propertySheet',
        title: 'Parâmetros de Inteligência & Taxonomia Forense',
        columns: 2,
        items: [
          { id: 'id', label: 'Código do Alvo', value: `#THR-${threat.id}`, icon: 'tag' },
          { id: 'nome', label: 'Designação Oficial', value: threat.nome, icon: 'badge' },
          { id: 'classe', label: 'Classe Tática', value: threat.classe, icon: 'category' },
          { id: 'planeta', label: 'Origem Planetária', value: threat.planeta, icon: 'public' },
          {
            id: 'nivel',
            label: 'Nível de Letalidade',
            value: `Grau ${threat.nivel} (Escala Ômega)`,
            icon: 'trending_up',
          },
          { id: 'status', label: 'Status de Rastreio', value: threat.status, icon: 'radar' },
          {
            id: 'recompensa',
            label: 'Recompensa Fixada',
            value: `R$ ${threat.recompensa.toLocaleString('pt-BR')}`,
            icon: 'payments',
          },
          {
            id: 'jurisdicao',
            label: 'Tribunal Competente',
            value: 'Conselho de Segurança Global (Sokovia)',
            icon: 'gavel',
          },
        ],
      },
      {
        type: 'card',
        variant: 'unstyled',
        tone: 'neutral',
        className: 'glass-panel intel-directives-card',
        title: 'Avaliação de Risco & Diretriz de Neutralização',
        content: [
          {
            type: 'text',
            text:
              threat.nivel >= 6
                ? `Alvo de Nível Ômega com alto potencial destrutivo. Qualquer aproximação requer esquadrão tático com ao menos um herói de classe Vanguarda e blindagem psiônica/térmica reforçada. Autorizado emprego de força máxima para proteção de zonas urbanas.`
                : `Ameaça monitorada pela inteligência de risco. Recomenda-se vigilância contínua de movimentos interestelares e telemetria quântica preventiva antes de autorizar incursão de combate.`,
          },
        ],
      },
    ],
  };
}

/**
 * 3. Missões e Incursões Relacionadas
 */
export function buildThreatMissionsDocument(missions: ThreatMission[]): RichContentDocument {
  if (missions.length === 0) {
    return {
      kind: 'praxis.rich-content',
      version: '1.0.0',
      nodes: [
        {
          type: 'emptyState',
          icon: 'verified_user',
          title: 'Nenhuma missão ativa contra este alvo',
          message:
            'Nenhuma operação ou despacho tático de combate está atualmente registrado contra esta designação no Centro de Missões.',
        },
      ],
    };
  }

  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: missions.map((m): RichCardNode => ({
      type: 'card',
      variant: 'unstyled',
      tone: 'neutral',
      className: 'glass-panel threat-mission-card',
      title: m.titulo,
      subtitle: `Teatro: ${m.local} · Código: #MIS-${m.id} · Prioridade: ${m.prioridade}`,
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
              label: m.status,
              className:
                m.status === 'CONCLUIDA'
                  ? 'status-pill status-contained'
                  : m.status === 'EM_ANDAMENTO'
                    ? 'status-pill status-confrontation'
                    : 'status-pill status-active',
            },
            {
              type: 'badge',
              label: `PRIORIDADE: ${m.prioridade}`,
              className:
                m.prioridade === 'CRITICA' || m.prioridade === 'ALTA'
                  ? 'status-pill level-omega'
                  : 'status-pill level-standard',
            },
          ],
        },
        ...(m.objetivo
          ? [
              {
                type: 'text' as const,
                text: m.objetivo,
                className: 'mission-objective-text',
              },
            ]
          : []),
      ],
    })),
  };
}

/**
 * 4. Protocolos de Contenção & Diretrizes Raft
 */
export function buildContainmentDocument(threat: ThreatProfile): RichContentDocument {
  const isContained =
    threat.status === 'CAPTURADO' ||
    threat.status === 'CONTIDO' ||
    threat.status === 'ELIMINADO';

  const containmentItems: RichTimelineItem[] = [
    {
      id: 'c1-protocol',
      title: 'Protocolo Subespacial de Rastreamento',
      subtitle: 'Monitoramento contínuo por satélites quânticos de órbita média e sensores de energia.',
      opposite: 'Nível 1',
      badge: 'ATIVO',
      markerColor: 'info',
      markerStyle: 'filled',
      connectorColor: 'info',
      connectorVariant: 'solid',
    },
    {
      id: 'c2-quarantine',
      title: 'Perímetro de Quarentena & Evacuação',
      subtitle: 'Planos de contingência pré-calculados para isolamento civil em caso de confronto armado.',
      opposite: 'Nível 2',
      badge: 'HOMOLOGADO',
      markerColor: 'warning',
      markerStyle: 'filled',
      connectorColor: 'warning',
      connectorVariant: 'solid',
    },
    {
      id: 'c3-raft',
      title: 'Célula de Estase Magnética na Prisão Raft',
      subtitle: isContained
        ? 'Alvo atualmente contido em estase molecular sob vigilância contínua na Prisão Raft.'
        : 'Célula de retenção pré-alocada e calibrada com inibidores de frequência para quando capturado.',
      opposite: 'Nível 3',
      badge: isContained ? 'CUSTODIADO' : 'PRONTIDÃO',
      markerColor: isContained ? 'success' : 'primary',
      markerStyle: 'filled',
    },
  ];

  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: [
      {
        type: 'timeline',
        title: 'Diretrizes de Contenção & Mitigação Raft',
        density: 'comfortable',
        connectorVariant: 'solid',
        items: containmentItems,
      },
    ],
  };
}

@Component({
  selector: 'app-threat-intelligence-drawer',
  standalone: true,
  imports: [CommonModule, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (threat(); as t) {
      <div class="drawer-overlay" (click)="close.emit()">
        <aside class="drawer-content" (click)="$event.stopPropagation()">
          <!-- Top Bar Fixa -->
          <div class="drawer-top-bar">
            <span class="dossier-badge">
              <span class="material-symbols-outlined">radar</span>
              DOSSIÊ DE INTELIGÊNCIA DE RISCO · PRAXIS GOVERNED
            </span>
            <button class="close-icon-btn" (click)="close.emit()" aria-label="Fechar Dossiê">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Cabeçalho Fixo com Hero Card e Tabs -->
          <div class="drawer-fixed-header">
            <praxis-rich-content [document]="headerDocument()" />

            <nav class="dossier-tabs-nav" role="tablist">
              <button
                type="button"
                role="tab"
                class="tab-btn"
                [class.is-active]="activeTab() === 'intel'"
                [attr.aria-selected]="activeTab() === 'intel'"
                (click)="activeTab.set('intel')"
              >
                <span class="material-symbols-outlined">shield</span>
                <span>Perfil & Inteligência</span>
              </button>
              <button
                type="button"
                role="tab"
                class="tab-btn"
                [class.is-active]="activeTab() === 'missions'"
                [attr.aria-selected]="activeTab() === 'missions'"
                (click)="activeTab.set('missions')"
              >
                <span class="material-symbols-outlined">military_tech</span>
                <span>Incursões Vinculadas</span>
                @if (missions().length) {
                  <span class="tab-count-chip">{{ missions().length }}</span>
                }
              </button>
              <button
                type="button"
                role="tab"
                class="tab-btn"
                [class.is-active]="activeTab() === 'containment'"
                [attr.aria-selected]="activeTab() === 'containment'"
                (click)="activeTab.set('containment')"
              >
                <span class="material-symbols-outlined">lock</span>
                <span>Contenção & Raft</span>
              </button>
            </nav>
          </div>

          <!-- Corpo Rolável -->
          <div class="drawer-body">
            @if (isLoading()) {
              <div class="dossier-loading">
                <span class="material-symbols-outlined spin">progress_activity</span>
                <span>Consultando banco de inteligência e satélites orbitais...</span>
              </div>
            }

            <div class="tab-pane" [hidden]="activeTab() !== 'intel'">
              <praxis-rich-content [document]="intelDocument()" />
            </div>

            <div class="tab-pane" [hidden]="activeTab() !== 'missions'">
              <praxis-rich-content [document]="missionsDocument()" />
            </div>

            <div class="tab-pane" [hidden]="activeTab() !== 'containment'">
              <praxis-rich-content [document]="containmentDocument()" />
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
      background: color-mix(in oklab, var(--risk) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--risk) 28%, transparent);
      color: var(--risk);
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

    /* Tabs Bar - Segmented Control */
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
        background: color-mix(in oklab, var(--risk) 10%, var(--card));
        color: var(--foreground);
        border-color: color-mix(in oklab, var(--risk) 20%, transparent);
      }

      &.is-active {
        background: var(--card);
        border: 1px solid color-mix(in oklab, var(--risk) 40%, var(--border));
        color: var(--risk);
        font-weight: 700;
        box-shadow: 0 2px 8px color-mix(in oklab, var(--risk) 15%, transparent);

        span.material-symbols-outlined {
          opacity: 1;
        }
      }
    }

    .tab-count-chip {
      background: color-mix(in oklab, var(--risk) 20%, transparent);
      color: var(--risk);
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

    ::ng-deep {
      .threat-hero-card {
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
          background: color-mix(in oklab, var(--risk) 16%, var(--card)) !important;
          color: var(--risk) !important;
          width: 54px !important;
          height: 54px !important;
          border-radius: 14px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: 1px solid color-mix(in oklab, var(--risk) 35%, transparent) !important;

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

      .intel-directives-card {
        border-left: 3px solid var(--risk) !important;
        background: color-mix(in oklab, var(--risk) 5%, var(--card)) !important;
      }

      .threat-mission-card {
        border-radius: 14px !important;
        padding: 16px 18px !important;
        margin-bottom: 12px !important;
        background: color-mix(in oklab, var(--card) 70%, transparent) !important;
        border: 1px solid var(--border) !important;
        transition: transform 0.15s ease, border-color 0.15s ease;

        &:hover {
          transform: translateY(-1px);
          border-color: color-mix(in oklab, var(--risk) 40%, var(--border));
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

        .mission-objective-text {
          font-size: 0.8rem !important;
          color: var(--muted-foreground) !important;
          margin-top: 8px !important;
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

      .level-omega {
        background: color-mix(in oklab, var(--risk) 15%, transparent);
        color: var(--risk);
        border: 1px solid color-mix(in oklab, var(--risk) 30%, transparent);
      }

      .level-standard {
        background: color-mix(in oklab, var(--warning) 15%, transparent);
        color: var(--warning);
        border: 1px solid color-mix(in oklab, var(--warning) 30%, transparent);
      }

      .status-contained {
        background: color-mix(in oklab, var(--ready) 15%, transparent);
        color: var(--ready);
        border: 1px solid color-mix(in oklab, var(--ready) 30%, transparent);
      }

      .status-confrontation {
        background: color-mix(in oklab, var(--risk) 20%, transparent);
        color: var(--risk);
        border: 1px solid color-mix(in oklab, var(--risk) 40%, transparent);
      }

      .status-active {
        background: color-mix(in oklab, var(--primary) 15%, transparent);
        color: var(--primary);
        border: 1px solid color-mix(in oklab, var(--primary) 30%, transparent);
      }

      .bounty-badge {
        background: color-mix(in oklab, #10b981 15%, transparent);
        color: #10b981;
        border: 1px solid color-mix(in oklab, #10b981 30%, transparent);
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
export class ThreatIntelligenceDrawerComponent implements OnDestroy {
  readonly threat = input<ThreatProfile | null>(null);
  readonly close = output<void>();

  protected readonly activeTab = signal<ThreatTabId>('intel');
  protected readonly isLoading = signal<boolean>(false);
  protected readonly missions = signal<ThreatMission[]>([]);

  private readonly http = inject(HttpClient);
  private dataSub: Subscription | null = null;

  protected readonly headerDocument = computed<RichContentDocument>(() => {
    const t = this.threat();
    if (!t) return { kind: 'praxis.rich-content', version: '1.0.0', nodes: [] };
    return buildThreatHeaderDocument(t);
  });

  protected readonly intelDocument = computed<RichContentDocument>(() => {
    const t = this.threat();
    if (!t) return { kind: 'praxis.rich-content', version: '1.0.0', nodes: [] };
    return buildThreatIntelDocument(t);
  });

  protected readonly missionsDocument = computed<RichContentDocument>(() => {
    return buildThreatMissionsDocument(this.missions());
  });

  protected readonly containmentDocument = computed<RichContentDocument>(() => {
    const t = this.threat();
    if (!t) return { kind: 'praxis.rich-content', version: '1.0.0', nodes: [] };
    return buildContainmentDocument(t);
  });

  constructor() {
    effect(() => {
      const t = this.threat();
      if (!t?.id) {
        this.dataSub?.unsubscribe();
        this.missions.set([]);
        this.activeTab.set('intel');
        this.isLoading.set(false);
        return;
      }
      this.fetchThreatMissions(t.id);
    });
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
  }

  private fetchThreatMissions(threatId: number): void {
    this.dataSub?.unsubscribe();
    this.isLoading.set(true);

    this.dataSub = this.http
      .post<{ data?: { content?: ThreatMission[] } }>(
        `${PRAXIS_API_BASE_URL}/operations/missoes/filter`,
        { ameacaId: threatId }
      )
      .pipe(
        map((res) => res.data?.content || []),
        catchError(() => of([] as ThreatMission[]))
      )
      .subscribe({
        next: (missions) => {
          this.missions.set(missions);
          this.isLoading.set(false);
        },
        error: () => {
          this.missions.set([]);
          this.isLoading.set(false);
        },
      });
  }
}
