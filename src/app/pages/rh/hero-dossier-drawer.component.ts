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
        orientation: 'horizontal',
        className: 'glass-panel dossier-hero-card',
        title: hero.nomeCompleto,
        subtitle: `${hero.codinome || hero.nomeCompleto} · ${hero.cargoNome || 'Especialista Tático'}`,
        style: {
          '--hero-avatar-image': (hero.fotoPerfilUrl || hero.avatarUrl) ? `url("${hero.fotoPerfilUrl || hero.avatarUrl}")` : 'none',
          '--hero-avatar-color': (hero.fotoPerfilUrl || hero.avatarUrl) ? 'transparent' : 'var(--primary)',
        },
        media: {
          kind: 'avatar',
          src: hero.fotoPerfilUrl || hero.avatarUrl || '',
          label: hero.nomeCompleto,
          alt: hero.nomeCompleto,
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
        className: 'dossier-tabs',
        items: [
          // TAB 1: IDENTIDADE
          {
            id: 'tab-identity',
            label: 'Identidade',
            icon: 'badge',
            content: [
              // Bloco 1: Vínculo Operacional & Remuneração (2x2 perfeito)
              {
                type: 'propertySheet',
                title: 'Vínculo Operacional & Remuneração',
                columns: 2,
                className: 'glass-panel dossier-sheet-card',
                items: [
                  { id: 'cargo', label: 'Cargo / Posto Tático', value: hero.cargoNome || 'Especialista Operacional', icon: 'military_tech' },
                  { id: 'departamento', label: 'Divisão Operacional', value: hero.departamentoNome || 'Divisão Tática', icon: 'business' },
                  { id: 'admissao', label: 'Data de Integração', value: hero.dataAdmissao || '15/04/2018', icon: 'calendar_today' },
                  { id: 'remuneracao', label: 'Remuneração Base', value: `R$ ${(hero.salario || 95000).toLocaleString('pt-BR')},00`, icon: 'payments' },
                ],
              },
              // Bloco 2: Identidade Civil & Contato Seguro (2x2 perfeito)
              {
                type: 'propertySheet',
                title: 'Identidade Civil & Contato Seguro',
                columns: 2,
                className: 'glass-panel dossier-sheet-card',
                items: [
                  { id: 'cpf', label: 'CPF Mascarado (LGPD)', value: hero.cpf || '109.876.543-21', icon: 'fingerprint' },
                  { id: 'universo', label: 'Universo / Origem Multiversal', value: hero.universo || 'Terra-616', icon: 'public' },
                  { id: 'email', label: 'Canal Seguro / E-mail', value: hero.email || 'tony.stark@avengers.praxis.org', icon: 'mail' },
                  { id: 'telefone', label: 'Telefone Tático / Linha Direta', value: hero.telefone || '+55 (11) 99887-6655', icon: 'call' },
                ],
              },
              // Bloco 3: Avaliação Reputacional 360° (StatGroup moderno com anéis de progresso)
              {
                type: 'statGroup',
                title: 'Avaliação Reputacional 360°',
                subtitle: 'Índices consolidados de conformidade governamental e respaldo da opinião pública',
                layout: 'grid',
                className: 'glass-panel dossier-scores-section',
                items: [
                  {
                    id: 'scorePublico',
                    label: 'Aprovação Pública',
                    value: `${hero.scorePublico || 96}%`,
                    caption: 'Índice de engajamento popular e mídia global',
                    icon: 'public',
                    tone: 'info',
                    progress: {
                      value: hero.scorePublico || 96,
                      max: 100,
                      variant: 'ring',
                      tone: 'info',
                    },
                  },
                  {
                    id: 'scoreGov',
                    label: 'Confiança Governamental',
                    value: `${hero.scoreGovernamental || 88}%`,
                    caption: 'Nível de conformidade e tratados com a ONU/Governo',
                    icon: 'account_balance',
                    tone: 'success',
                    progress: {
                      value: hero.scoreGovernamental || 88,
                      max: 100,
                      variant: 'ring',
                      tone: 'success',
                    },
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

          // TAB 3: FOLHA (DADOS REAIS DA API)
          {
            id: 'tab-payroll',
            label: 'Folha',
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
            label: 'Missões',
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
            label: 'Ativos',
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
        padding: 20px !important;
        margin-bottom: 20px !important;

        .prx-rich-card {
          display: grid !important;
          grid-template-columns: 76px 1fr auto !important;
          align-items: center !important;
          gap: 16px !important;
        }

        .prx-rich-card-media {
          background: transparent !important;
          padding: 0 !important;
          min-height: auto !important;
          aspect-ratio: auto !important;
          grid-column: 1 !important;
          grid-row: 1 !important;
        }

        .prx-rich-card-media__avatar {
          width: 72px !important;
          height: 72px !important;
          border-radius: 50% !important;
          background-image: var(--hero-avatar-image, none) !important;
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          background-color: color-mix(in oklab, var(--primary) 20%, var(--card)) !important;
          border: 2px solid color-mix(in oklab, var(--primary) 40%, transparent) !important;
          box-shadow: 0 0 16px color-mix(in oklab, var(--primary) 25%, transparent) !important;
          color: var(--hero-avatar-color, var(--primary)) !important;
          font-size: 1.4rem !important;
          font-weight: 800 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          user-select: none !important;
        }

        .prx-rich-card-heading {
          grid-column: 2 !important;
          grid-row: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 3px !important;
          min-width: 0 !important;
        }

        .prx-rich-card-title {
          font-family: var(--font-display) !important;
          font-size: 1.35rem !important;
          font-weight: 700 !important;
          letter-spacing: -0.02em !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .prx-rich-card-subtitle {
          font-size: 0.82rem !important;
          color: var(--muted-foreground) !important;
          margin: 0 !important;
        }

        .prx-rich-card-header {
          grid-column: 3 !important;
          grid-row: 1 !important;
          margin: 0 !important;
          align-self: center !important;
        }

        .prx-rich-card-header__action {
          margin: 0 !important;
        }

        .prx-rich-card-body {
          grid-column: 2 / span 2 !important;
          grid-row: 2 !important;
          margin-top: -6px !important;
        }
      }

      .dossier-tabs {
        margin-bottom: 8px;

        .prx-rich-tabs__tablist {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          gap: 6px !important;
          padding: 6px !important;
          border-radius: 14px !important;
          background: color-mix(in oklab, var(--card) 60%, transparent) !important;
          border: 1px solid var(--border) !important;
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          scrollbar-width: none !important;
          margin-bottom: 20px !important;

          &::-webkit-scrollbar {
            display: none !important;
          }
        }

        .prx-rich-tabs__tab {
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          padding: 8px 14px !important;
          border-radius: 10px !important;
          border: 1px solid transparent !important;
          font-size: 0.82rem !important;
          font-weight: 600 !important;
          white-space: nowrap !important;
          flex-shrink: 0 !important;
          min-width: max-content !important;
          color: var(--muted-foreground) !important;
          background: transparent !important;
          cursor: pointer !important;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;

          &:hover {
            color: var(--foreground) !important;
            background: color-mix(in oklab, var(--accent) 50%, transparent) !important;
            border-color: color-mix(in oklab, var(--border) 70%, transparent) !important;
          }

          &.prx-rich-tabs__tab--active {
            color: var(--primary) !important;
            background: color-mix(in oklab, var(--primary) 14%, var(--card)) !important;
            border-color: color-mix(in oklab, var(--primary) 35%, transparent) !important;
            font-weight: 700 !important;
            box-shadow: 0 2px 8px color-mix(in oklab, var(--primary) 15%, transparent) !important;

            .prx-rich-tabs__tab-icon {
              color: var(--primary) !important;
            }
          }

          .prx-rich-tabs__tab-icon {
            font-size: 18px !important;
            color: inherit !important;
          }

          .prx-rich-badge {
            font-size: 0.68rem !important;
            padding: 1px 6px !important;
            border-radius: 9999px !important;
            background: color-mix(in oklab, var(--primary) 20%, transparent) !important;
            color: var(--primary) !important;
            font-weight: 700 !important;
            margin-left: 2px !important;
          }
        }
      }

      .dossier-sheet-card {
        border-radius: 16px !important;
        padding: 20px !important;
        margin-bottom: 16px !important;

        .prx-rich-property-sheet__title {
          font-size: 1.02rem !important;
          font-weight: 700 !important;
          color: var(--foreground) !important;
          margin: 0 0 16px 0 !important;
        }
      }

      .dossier-scores-section {
        border-radius: 16px !important;
        padding: 20px !important;
        margin-bottom: 16px !important;

        .prx-rich-stat-group__title {
          font-size: 1.02rem !important;
          font-weight: 700 !important;
          color: var(--foreground) !important;
          margin: 0 0 2px 0 !important;
        }

        .prx-rich-stat-group__subtitle {
          font-size: 0.78rem !important;
          color: var(--muted-foreground) !important;
          margin: 0 0 16px 0 !important;
        }
      }

      .prx-rich-property-sheet {
        .prx-rich-property-sheet__items {
          gap: 12px !important;
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }

        .prx-rich-property-sheet__item {
          background: color-mix(in oklab, var(--card) 45%, transparent) !important;
          padding: 12px 14px !important;
          border-radius: 12px !important;
          border: 1px solid color-mix(in oklab, var(--border) 60%, transparent) !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 4px !important;
        }

        .prx-rich-property-sheet__label {
          color: var(--muted-foreground) !important;
          font-size: 0.72rem !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;

          .material-symbols-outlined {
            font-size: 15px !important;
            color: var(--primary) !important;
          }
        }

        .prx-rich-property-sheet__value {
          color: var(--foreground) !important;
          font-size: 0.92rem !important;
          font-weight: 600 !important;
          font-family: var(--font-mono, inherit) !important;
          margin: 0 !important;
        }
      }

      .dossier-reputation-grid {
        .prx-rich-stat-group__items {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 14px !important;
        }

        .prx-rich-stat-group__item {
          padding: 18px !important;
          border-radius: 14px !important;
          background: color-mix(in oklab, var(--card) 50%, transparent) !important;
          border: 1px solid var(--border) !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 6px !important;
          transition: transform 0.15s ease, border-color 0.15s ease !important;

          &:hover {
            transform: translateY(-1px) !important;
            border-color: color-mix(in oklab, var(--primary) 40%, transparent) !important;
          }
        }

        .prx-rich-stat-group__label {
          font-size: 0.82rem !important;
          font-weight: 600 !important;
          color: var(--muted-foreground) !important;
        }

        .prx-rich-stat-group__value {
          font-size: 1.65rem !important;
          font-weight: 800 !important;
          font-family: var(--font-display) !important;
          line-height: 1.2 !important;
          margin: 2px 0 !important;
          color: var(--foreground) !important;
        }

        .prx-rich-stat-group__caption {
          font-size: 0.72rem !important;
          color: var(--muted-foreground) !important;
          line-height: 1.3 !important;
        }

        .prx-rich-stat-group__icon {
          font-size: 24px !important;
          color: var(--primary) !important;
          margin-bottom: 2px !important;
        }
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
