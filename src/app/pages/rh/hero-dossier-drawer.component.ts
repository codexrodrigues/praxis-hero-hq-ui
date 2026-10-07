import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  type RichBlockHostCapabilities,
  type RichContentDocument,
} from '@praxisui/core';
import { PraxisRichContent } from '@praxisui/rich-content';
import { PRAXIS_API_BASE_URL } from '../../core/platform.config';

export interface HeroProfile {
  id: number;
  nomeCompleto: string;
  codinome?: string;
  cargoNome?: string;
  departamentoNome?: string;
  universo?: string;
  ativo: boolean;
  salario?: number;
  cpf?: string;
  telefone?: string;
  email?: string;
  avatarUrl?: string;
  fotoPerfilUrl?: string;
  scorePublico?: number;
  scoreGovernamental?: number;
  dataAdmissao?: string;
  resourceVersion?: string;
}

export interface PayrollRecord {
  id: number;
  ano: number;
  mes: number;
  salarioBruto: number;
  totalDescontos: number;
  salarioLiquido: number;
  dataPagamento: string;
}

export interface MissionParticipantRecord {
  id: number;
  missaoId: number;
  missaoTitulo: string;
  papel: string;
  ordem?: number;
  principal?: boolean;
  resultado?: string;
}

export interface EquipmentRecord {
  id: number;
  nome: string;
  tipo: string;
  resistencia?: number;
  status: string;
  proprietarioNome?: string;
}

export function buildHeroDossierDocument(
  hero: HeroProfile,
  payroll: PayrollRecord[],
  missions: MissionParticipantRecord[],
  assets: EquipmentRecord[],
  isTransitioning: boolean
): RichContentDocument {
  const isAtivo = hero.ativo;
  const toggleLabel = isTransitioning
    ? 'Processando...'
    : isAtivo
    ? 'Mover para Reserva'
    : 'Reativar no Quadro';
  const toggleIcon = isTransitioning
    ? 'sync'
    : isAtivo
    ? 'person_off'
    : 'verified_user';

  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: [
      // 1. Header Hero Identity Card
      {
        type: 'card',
        variant: 'unstyled',
        tone: 'neutral',
        className: 'glass-panel dossier-hero-card',
        title: hero.nomeCompleto,
        subtitle: `${hero.codinome || hero.nomeCompleto} · ${hero.cargoNome || 'Especialista Tático'}`,
        media: {
          kind: 'avatar',
          src: hero.fotoPerfilUrl || hero.avatarUrl || '',
          placement: 'leading',
        },
        headerAction: {
          type: 'actionButton',
          label: toggleLabel,
          icon: toggleIcon,
          variant: isAtivo ? 'stroked' : 'raised',
          color: isAtivo ? 'warn' : 'primary',
          action: {
            actionId: 'hero.toggleStatus',
            payload: hero,
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
                label: hero.universo || 'Terra-616',
                className: 'status-pill cobalt-pill',
              },
              {
                type: 'badge',
                label: isAtivo ? 'Em Prontidão' : 'Inativo / Reserva',
                className: isAtivo ? 'status-pill ready-pill' : 'status-pill reserve-pill',
              },
            ],
          },
        ],
      },

      // 2. Tabs: Identidade, Competências, Folha, Missões, Ativos
      {
        type: 'tabs',
        appearance: 'pills',
        defaultTabId: 'tab-identity',
        items: [
          // TAB 1: IDENTIDADE & REPUTAÇÃO
          {
            id: 'tab-identity',
            label: 'Identidade & Reputação',
            icon: 'badge',
            content: [
              {
                type: 'propertySheet',
                title: 'Ficha Cadastral & Segurança Civil',
                columns: 2,
                items: [
                  { id: 'cpf', label: 'CPF Mascarado (LGPD)', value: hero.cpf || '***.***.001-75', icon: 'fingerprint' },
                  { id: 'departamento', label: 'Departamento', value: hero.departamentoNome || 'Divisão Tática', icon: 'business' },
                  { id: 'cargo', label: 'Cargo / Posto Tático', value: hero.cargoNome || 'Especialista Operacional', icon: 'military_tech' },
                  { id: 'admissao', label: 'Data de Admissão', value: hero.dataAdmissao || '01/01/2020', icon: 'calendar_today' },
                  { id: 'email', label: 'Canal Seguro / E-mail', value: hero.email || 'confidencial@praxis.org', icon: 'mail' },
                  { id: 'telefone', label: 'Telefone Tático', value: hero.telefone || '+55 (11) 98888-0000', icon: 'call' },
                  { id: 'remuneracao', label: 'Remuneração Base', value: `R$ ${(hero.salario || 95000).toLocaleString('pt-BR')},00`, icon: 'payments' },
                ],
              },
              {
                type: 'statGroup',
                title: 'Avaliação Reputacional 360°',
                layout: 'inline',
                className: 'glass-panel scores-card',
                items: [
                  {
                    id: 'scorePublico',
                    label: 'Aprovação Pública',
                    value: `${hero.scorePublico || 94}%`,
                    icon: 'public',
                    tone: 'info',
                  },
                  {
                    id: 'scoreGov',
                    label: 'Confiança Governamental',
                    value: `${hero.scoreGovernamental || 88}%`,
                    icon: 'account_balance',
                    tone: 'success',
                  },
                ],
              },
            ],
          },

          // TAB 2: COMPETÊNCIAS OPERACIONAIS
          {
            id: 'tab-skills',
            label: 'Competências',
            icon: 'bolt',
            content: [
              {
                type: 'card',
                variant: 'unstyled',
                tone: 'neutral',
                className: 'glass-panel skills-card',
                title: 'Matriz de Proficiência Tática',
                content: [
                  {
                    type: 'compose',
                    direction: 'column',
                    gap: 'sm',
                    items: [
                      {
                        type: 'text',
                        text: 'Combate Avançado & Resposta Tática — 95%',
                      },
                      {
                        type: 'progress',
                        valueExpr: '95',
                        showPercent: false,
                        className: 'fill-training',
                      },
                      {
                        type: 'text',
                        text: 'Engenharia de Campo & Suporte Quântico — 92%',
                      },
                      {
                        type: 'progress',
                        valueExpr: '92',
                        showPercent: false,
                        className: 'fill-tech',
                      },
                      {
                        type: 'text',
                        text: 'Liderança Operacional & Coordenação de Crise — 98%',
                      },
                      {
                        type: 'progress',
                        valueExpr: '98',
                        showPercent: false,
                        className: 'fill-ready',
                      },
                    ],
                  },
                ],
              },
            ],
          },

          // TAB 3: FOLHA & HOLERITES (DADOS REAIS DA API)
          {
            id: 'tab-payroll',
            label: 'Folha & Holerites',
            icon: 'payments',
            badge: payroll.length > 0 ? String(payroll.length) : undefined,
            content: payroll.length > 0
              ? payroll.map((cycle) => ({
                  type: 'card' as const,
                  variant: 'outlined' as const,
                  className: 'glass-panel cycle-card-item',
                  title: `Competência ${cycle.mes}/${cycle.ano}`,
                  subtitle: `Bruto: R$ ${cycle.salarioBruto.toLocaleString('pt-BR')} · Líquido: R$ ${cycle.salarioLiquido.toLocaleString('pt-BR')} · Descontos: R$ ${cycle.totalDescontos.toLocaleString('pt-BR')}`,
                  content: [
                    {
                      type: 'badge' as const,
                      label: 'CONSOLIDADA',
                      className: 'status-tag status-paga',
                    },
                  ],
                }))
              : [
                  {
                    type: 'emptyState' as const,
                    icon: 'receipt_long',
                    title: 'Sem lançamentos recentes',
                    message: 'Nenhum lançamento de folha salarial registrado para este colaborador na base de dados.',
                  },
                ],
          },

          // TAB 4: HISTÓRICO DE MISSÕES (TIMELINE REAL DA API)
          {
            id: 'tab-missions',
            label: 'Missões Táticas',
            icon: 'military_tech',
            badge: missions.length > 0 ? String(missions.length) : undefined,
            content: missions.length > 0
              ? [
                  {
                    type: 'timeline' as const,
                    density: 'comfortable' as const,
                    connectorVariant: 'solid' as const,
                    items: missions.map((m) => ({
                      id: String(m.id),
                      title: m.missaoTitulo,
                      subtitle: `Papel: ${m.papel} · ${m.principal ? 'Participação Primária' : 'Força de Apoio'}`,
                      icon: m.resultado === 'OK' ? 'check_circle' : 'pending',
                      badge: m.resultado === 'OK' ? 'CONCLUÍDA' : 'EM ANDAMENTO',
                      markerColor: m.resultado === 'OK' ? ('success' as const) : ('info' as const),
                    })),
                  },
                ]
              : [
                  {
                    type: 'emptyState' as const,
                    icon: 'flag',
                    title: 'Nenhuma missão registrada',
                    message: 'Este herói não possui histórico de engajamento tático em campo até o momento.',
                  },
                ],
          },

          // TAB 5: ATIVOS EM CUSTÓDIA (DADOS REAIS DA API)
          {
            id: 'tab-assets',
            label: 'Ativos & Armaduras',
            icon: 'inventory_2',
            badge: assets.length > 0 ? String(assets.length) : undefined,
            content: assets.length > 0
              ? assets.map((asset) => ({
                  type: 'card' as const,
                  variant: 'outlined' as const,
                  className: 'glass-panel asset-card-item',
                  title: asset.nome,
                  subtitle: `Tipo: ${asset.tipo} · Resistência: ${asset.resistencia || 8}/10 · Status: ${asset.status}`,
                  content: [
                    {
                      type: 'badge' as const,
                      label: asset.status,
                      className: 'status-tag status-programada',
                    },
                  ],
                }))
              : [
                  {
                    type: 'emptyState' as const,
                    icon: 'shield_moon',
                    title: 'Nenhum ativo vinculado',
                    message: 'Nenhum equipamento, armadura ou veículo registrado sob custódia deste herói.',
                  },
                ],
          },
        ],
      },
    ],
  };
}

@Component({
  selector: 'app-hero-dossier-drawer',
  standalone: true,
  imports: [CommonModule, PraxisRichContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hero()) {
      <div class="drawer-overlay" (click)="close.emit()">
        <aside class="drawer-content" (click)="$event.stopPropagation()">
          <header class="drawer-top-bar">
            <div class="dossier-badge">
              <span class="material-symbols-outlined">badge</span>
              <span>DOSSIÊ TÁTICO 360° · PRAXIS GOVERNED</span>
            </div>
            <button
              type="button"
              class="close-icon-btn"
              (click)="close.emit()"
              aria-label="Fechar Dossiê"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>

          <main class="drawer-body">
            @if (isLoading()) {
              <div class="dossier-loading">
                <span class="material-symbols-outlined spin">sync</span>
                <span>Sincronizando registros operacionais do herói...</span>
              </div>
            }
            <praxis-rich-content
              [document]="dossierDocument()"
              [hostCapabilities]="hostCapabilities"
            />
          </main>
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
      max-width: 720px;
      height: 100%;
      background: var(--background);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-command);
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .drawer-top-bar {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: color-mix(in oklab, var(--card) 60%, transparent);
    }

    .dossier-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: color-mix(in oklab, var(--primary) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--primary) 28%, transparent);
      color: var(--primary);
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
      padding: 24px;
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

    /* Rich Content Styles Inside Drawer */
    ::ng-deep {
      .dossier-hero-card {
        border-radius: 20px !important;
        padding: 24px !important;
        margin-bottom: 16px;
      }

      .hero-dossier-name {
        margin: 4px 0 2px !important;
        font-family: var(--font-display) !important;
        font-size: 1.8rem !important;
        font-weight: 700 !important;
      }

      .hero-dossier-subtitle {
        margin: 0 !important;
        font-size: 0.85rem !important;
        color: var(--muted-foreground) !important;
      }

      .hero-dossier-avatar {
        width: 72px !important;
        height: 72px !important;
        border-radius: 50% !important;
        box-shadow: 0 0 16px color-mix(in oklab, var(--primary) 30%, transparent);
      }

      .universo-badge {
        background: color-mix(in oklab, var(--cobalt) 15%, transparent);
        color: var(--cobalt);
        border: 1px solid color-mix(in oklab, var(--cobalt) 30%, transparent);
        font-size: 0.65rem;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 9999px;
      }

      .reserve-pill {
        background: color-mix(in oklab, var(--warning) 15%, transparent);
        color: var(--warning);
        border: 1px solid color-mix(in oklab, var(--warning) 30%, transparent);
      }

      .cycle-card-item,
      .asset-card-item {
        border-radius: 14px !important;
        padding: 14px 18px !important;
        transition: transform 0.15s ease;

        &:hover {
          transform: translateY(-1px);
        }
      }

      .fill-training progress::-webkit-progress-value { background: var(--secondary) !important; border-radius: 9999px; }
      .fill-tech progress::-webkit-progress-value { background: var(--primary) !important; border-radius: 9999px; }

      .status-paga {
        color: var(--ready);
        background: color-mix(in oklab, var(--ready) 12%, transparent);
      }
      .status-programada {
        color: var(--operations);
        background: color-mix(in oklab, var(--operations) 12%, transparent);
      }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spin { animation: spin 1s infinite linear; }
  `],
})
export class HeroDossierDrawerComponent {
  readonly hero = input<HeroProfile | null>(null);
  readonly isTransitioning = input<boolean>(false);
  readonly close = output<void>();
  readonly toggleStatus = output<HeroProfile>();

  protected readonly isLoading = signal<boolean>(false);
  protected readonly payroll = signal<PayrollRecord[]>([]);
  protected readonly missions = signal<MissionParticipantRecord[]>([]);
  protected readonly assets = signal<EquipmentRecord[]>([]);

  private readonly http = inject(HttpClient);

  protected readonly hostCapabilities: RichBlockHostCapabilities = {
    dispatchAction: (actionId: string, payload: unknown) => {
      if (actionId === 'hero.toggleStatus') {
        const h = (payload || this.hero()) as HeroProfile;
        if (h) this.toggleStatus.emit(h);
      }
    },
    isActionAvailable: () => true,
  };

  protected readonly dossierDocument = computed<RichContentDocument>(() => {
    const h = this.hero();
    if (!h) {
      return { kind: 'praxis.rich-content', version: '1.0.0', nodes: [] };
    }
    return buildHeroDossierDocument(
      h,
      this.payroll(),
      this.missions(),
      this.assets(),
      this.isTransitioning()
    );
  });

  constructor() {
    effect(() => {
      const h = this.hero();
      if (!h?.id) {
        this.payroll.set([]);
        this.missions.set([]);
        this.assets.set([]);
        return;
      }
      this.fetchAllHeroData(h.id);
    });
  }

  private fetchAllHeroData(heroId: number): void {
    this.isLoading.set(true);

    // Parallel fetch from backend endpoints
    this.http
      .post<{ data?: { content?: PayrollRecord[] } }>(
        `${PRAXIS_API_BASE_URL}/human-resources/folhas-pagamento/filter`,
        { funcionarioId: heroId }
      )
      .subscribe({
        next: (res) => this.payroll.set(res.data?.content || []),
        error: () => this.payroll.set([]),
      });

    this.http
      .post<{ data?: { content?: MissionParticipantRecord[] } }>(
        `${PRAXIS_API_BASE_URL}/operations/missao-participantes/filter`,
        { funcionarioId: heroId }
      )
      .subscribe({
        next: (res) => this.missions.set(res.data?.content || []),
        error: () => this.missions.set([]),
      });

    this.http
      .post<{ data?: { content?: EquipmentRecord[] } }>(
        `${PRAXIS_API_BASE_URL}/assets/equipamentos/filter`,
        { proprietarioId: heroId }
      )
      .subscribe({
        next: (res) => {
          this.assets.set(res.data?.content || []);
          this.isLoading.set(false);
        },
        error: () => {
          this.assets.set([]);
          this.isLoading.set(false);
        },
      });
  }
}
