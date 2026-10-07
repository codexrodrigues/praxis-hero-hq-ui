import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import {
  type RichBlockHostCapabilities,
  type RichContentDocument,
} from '@praxisui/core';
import { PraxisDynamicForm } from '@praxisui/dynamic-form';
import { PraxisRichContent } from '@praxisui/rich-content';
import { catchError, forkJoin, map, of, Subscription } from 'rxjs';
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
  dataNascimento?: string;
  estadoCivil?: string;
  resourceVersion?: string;
  [key: string]: unknown;
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

export type DossierTabId = 'identity' | 'skills' | 'payroll' | 'missions' | 'assets';

/**
 * 1. Hero Identity Header Document (RichContent Editorial)
 */
export function buildHeroHeaderDocument(
  hero: HeroProfile,
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
      {
        type: 'card',
        variant: 'unstyled',
        tone: 'neutral',
        orientation: 'horizontal',
        className: 'glass-panel dossier-hero-card',
        title: hero.nomeCompleto,
        subtitle: `${hero.codinome || hero.nomeCompleto} · ${hero.cargoNome || 'Especialista Tático'}`,
        style: {
          '--hero-avatar-image': (hero.fotoPerfilUrl || hero.avatarUrl)
            ? `url("${hero.fotoPerfilUrl || hero.avatarUrl}")`
            : 'none',
          '--hero-avatar-color': (hero.fotoPerfilUrl || hero.avatarUrl)
            ? 'transparent'
            : 'var(--primary)',
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
    ],
  };
}

/**
 * 2. Avaliação Reputacional 360° (Editorial Telemetria)
 */
export function buildHeroReputationDocument(hero: HeroProfile): RichContentDocument {
  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: [
      {
        type: 'statGroup',
        title: 'Avaliação Reputacional 360°',
        subtitle: 'Índices consolidados de conformidade governamental e aprovação popular',
        layout: 'grid',
        headerSpacing: 'normal',
        tileLayout: 'tile',
        className: 'dossier-scores-section',
        items: [
          {
            id: 'scorePublico',
            label: 'Aprovação Pública',
            value: `${hero.scorePublico || 96}%`,
            caption: 'Índice de engajamento popular e respaldo midiático',
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
            label: 'Conformidade Governamental',
            value: `${hero.scoreGovernamental || 88}%`,
            caption: 'Nível de alinhamento com tratados e auditorias da ONU',
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
  };
}

/**
 * 3. Competências Operacionais (RichContent)
 */
export function buildHeroSkillsDocument(hero: HeroProfile): RichContentDocument {
  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: [
      {
        type: 'card',
        variant: 'unstyled',
        tone: 'neutral',
        className: 'glass-panel skills-card',
        title: 'Matriz de Proficiência Tática',
        subtitle: 'Competências operacionais auditadas pela divisão de treinamento',
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
                text: 'Inteligência Estratégica & Análise de Ameaças — 90%',
              },
              {
                type: 'progress',
                valueExpr: '90',
                showPercent: false,
                className: 'fill-cyber',
              },
              {
                type: 'text',
                text: 'Engenharia & Sistemas Tecnológicos — 98%',
              },
              {
                type: 'progress',
                valueExpr: '98',
                showPercent: false,
                className: 'fill-tactical',
              },
              {
                type: 'text',
                text: 'Liderança de Esquadrão & Articulação Tática — 88%',
              },
              {
                type: 'progress',
                valueExpr: '88',
                showPercent: false,
                className: 'fill-diplomatic',
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * 4. Folha de Pagamento (RichContent)
 */
export function buildPayrollDocument(records: PayrollRecord[]): RichContentDocument {
  if (records.length === 0) {
    return {
      kind: 'praxis.rich-content',
      version: '1.0.0',
      nodes: [
        {
          type: 'emptyState',
          icon: 'receipt_long',
          title: 'Sem lançamentos recentes',
          message: 'Nenhum lançamento de folha salarial registrado para este colaborador na base de dados.',
        },
      ],
    };
  }

  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: [
      {
        type: 'timeline',
        density: 'comfortable',
        connectorVariant: 'dashed',
        items: records.map((p) => ({
          id: String(p.id),
          title: `Competência ${String(p.mes).padStart(2, '0')}/${p.ano}`,
          subtitle: `Líquido: R$ ${p.salarioLiquido?.toLocaleString('pt-BR') || '0,00'} (Bruto: R$ ${p.salarioBruto?.toLocaleString('pt-BR') || '0,00'})`,
          timestamp: p.dataPagamento ? `Pago em ${p.dataPagamento}` : 'Processado',
          icon: 'payments',
          badge: 'CONCLUÍDO',
          markerColor: 'success',
        })),
      },
    ],
  };
}

/**
 * 5. Missões Táticas (RichContent)
 */
export function buildMissionsDocument(records: MissionParticipantRecord[]): RichContentDocument {
  if (records.length === 0) {
    return {
      kind: 'praxis.rich-content',
      version: '1.0.0',
      nodes: [
        {
          type: 'emptyState',
          icon: 'military_tech',
          title: 'Nenhuma missão registrada',
          message: 'Este herói não possui histórico de engajamento tático em campo até o momento.',
        },
      ],
    };
  }

  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: [
      {
        type: 'timeline',
        density: 'comfortable',
        connectorVariant: 'solid',
        items: records.map((m) => ({
          id: String(m.id),
          title: m.missaoTitulo,
          subtitle: `Papel: ${m.papel} · ${m.principal ? 'Participação Primária' : 'Força de Apoio'}`,
          icon: m.resultado === 'OK' ? 'check_circle' : 'pending',
          badge: m.resultado === 'OK' ? 'CONCLUÍDA' : 'EM ANDAMENTO',
          markerColor: m.resultado === 'OK' ? 'success' : 'info',
        })),
      },
    ],
  };
}

/**
 * 6. Ativos em Custódia (RichContent)
 */
export function buildAssetsDocument(records: EquipmentRecord[]): RichContentDocument {
  if (records.length === 0) {
    return {
      kind: 'praxis.rich-content',
      version: '1.0.0',
      nodes: [
        {
          type: 'emptyState',
          icon: 'shield_moon',
          title: 'Nenhum ativo vinculado',
          message: 'Nenhum equipamento, armadura ou veículo registrado sob custódia deste herói.',
        },
      ],
    };
  }

  return {
    kind: 'praxis.rich-content',
    version: '1.0.0',
    nodes: records.map((asset) => ({
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
    })),
  };
}

@Component({
  selector: 'app-hero-dossier-drawer',
  standalone: true,
  imports: [CommonModule, PraxisRichContent, PraxisDynamicForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hero()) {
      <div class="drawer-overlay" (click)="close.emit()">
        <aside class="drawer-content" (click)="$event.stopPropagation()">
          <!-- Top Bar -->
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

          <!-- Fixed Header: Hero Card and Tactical Tabs -->
          <div class="drawer-fixed-header">
            @if (isLoading()) {
              <div class="dossier-loading">
                <span class="material-symbols-outlined spin">sync</span>
                <span>Sincronizando registros operacionais do herói...</span>
              </div>
            }

            <!-- 1. Header Hero Card (Editorial) -->
            <praxis-rich-content
              [document]="headerDocument()"
              [hostCapabilities]="hostCapabilities"
            />

            <!-- 2. Navegação Canônica em Abas Táticas -->
            <nav class="dossier-tabs-nav" role="tablist" aria-label="Abas do Dossiê">
              <button
                type="button"
                role="tab"
                class="tab-btn"
                [class.is-active]="activeTab() === 'identity'"
                [attr.aria-selected]="activeTab() === 'identity'"
                (click)="activeTab.set('identity')"
              >
                <span class="material-symbols-outlined">badge</span>
                <span>Identidade & Ficha</span>
              </button>

              <button
                type="button"
                role="tab"
                class="tab-btn"
                [class.is-active]="activeTab() === 'skills'"
                [attr.aria-selected]="activeTab() === 'skills'"
                (click)="activeTab.set('skills')"
              >
                <span class="material-symbols-outlined">bolt</span>
                <span>Competências</span>
              </button>

              <button
                type="button"
                role="tab"
                class="tab-btn"
                [class.is-active]="activeTab() === 'payroll'"
                [attr.aria-selected]="activeTab() === 'payroll'"
                (click)="activeTab.set('payroll')"
              >
                <span class="material-symbols-outlined">payments</span>
                <span>Folha</span>
                @if (payroll().length > 0) {
                  <span class="tab-count-chip">{{ payroll().length }}</span>
                }
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
                <span>Missões</span>
                @if (missions().length > 0) {
                  <span class="tab-count-chip">{{ missions().length }}</span>
                }
              </button>

              <button
                type="button"
                role="tab"
                class="tab-btn"
                [class.is-active]="activeTab() === 'assets'"
                [attr.aria-selected]="activeTab() === 'assets'"
                (click)="activeTab.set('assets')"
              >
                <span class="material-symbols-outlined">inventory_2</span>
                <span>Ativos</span>
                @if (assets().length > 0) {
                  <span class="tab-count-chip">{{ assets().length }}</span>
                }
              </button>
            </nav>
          </div>

          <!-- 3. Scrollable Body: Conteúdo Dinâmico por Aba -->
          <main class="drawer-body">
            <div class="dossier-tab-content">
              <!-- ABA 1: IDENTIDADE (FICHA CADASTRAL GOVERNADA + AVALIAÇÃO 360°) -->
              @if (activeTab() === 'identity') {
                <div class="tab-pane identity-pane">
                  <!-- Bloco 1: Ficha Cadastral Governada por Metadados (PraxisDynamicForm) -->
                  <div class="glass-panel dossier-form-container">
                    <div class="pane-section-header">
                      <div class="pane-header-title">
                        <span class="material-symbols-outlined">verified_user</span>
                        <div>
                          <h4>Ficha Cadastral Governada</h4>
                          <p>Campos, agrupamentos e máscaras resolvidos dinamicamente de <code>human-resources/funcionarios</code></p>
                        </div>
                      </div>
                      <span class="governance-badge">OpenAPI · x-ui</span>
                    </div>

                    <praxis-dynamic-form
                      formId="hero-dossier-cadastral-form"
                      resourcePath="human-resources/funcionarios"
                      [resourceId]="hero()!.id"
                      [initialValue]="heroRecord()"
                      mode="view"
                      [presentationModeGlobal]="true"
                      [enableCustomization]="false"
                      [showAiAssistant]="false"
                      presentationPreset="corporate-dossier"
                      class="presentation-mode pres-compact pres-label-left dossier-dynamic-form"
                    />
                  </div>

                  <!-- Bloco 2: Avaliação Reputacional 360° (Editorial Telemetria) -->
                  <praxis-rich-content [document]="reputationDocument()" />
                </div>
              }

              <!-- ABA 2: COMPETÊNCIAS OPERACIONAIS -->
              @if (activeTab() === 'skills') {
                <div class="tab-pane">
                  <praxis-rich-content [document]="skillsDocument()" />
                </div>
              }

              <!-- ABA 3: FOLHA E HOLERITE -->
              @if (activeTab() === 'payroll') {
                <div class="tab-pane glass-panel p-20">
                  <div class="pane-section-header mb-16">
                    <div class="pane-header-title">
                      <span class="material-symbols-outlined">receipt_long</span>
                      <div>
                        <h4>Histórico de Lançamentos Salariais</h4>
                        <p>Folhas liquidadas e holerites emitidos pelo departamento de RH</p>
                      </div>
                    </div>
                  </div>
                  <praxis-rich-content [document]="payrollDocument()" />
                </div>
              }

              <!-- ABA 4: MISSÕES TÁTICAS -->
              @if (activeTab() === 'missions') {
                <div class="tab-pane glass-panel p-20">
                  <div class="pane-section-header mb-16">
                    <div class="pane-header-title">
                      <span class="material-symbols-outlined">flag</span>
                      <div>
                        <h4>Engajamento Operacional em Campo</h4>
                        <p>Sorties, incursões e missões registradas com status de conclusão</p>
                      </div>
                    </div>
                  </div>
                  <praxis-rich-content [document]="missionsDocument()" />
                </div>
              }

              <!-- ABA 5: ATIVOS EM CUSTÓDIA -->
              @if (activeTab() === 'assets') {
                <div class="tab-pane assets-pane">
                  <div class="pane-section-header mb-16">
                    <div class="pane-header-title">
                      <span class="material-symbols-outlined">shield</span>
                      <div>
                        <h4>Inventário de Ativos em Custódia</h4>
                        <p>Equipamentos de alta tecnologia e armaduras alocadas ao herói</p>
                      </div>
                    </div>
                  </div>
                  <praxis-rich-content [document]="assetsDocument()" />
                </div>
              }
            </div>
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
      padding: 24px 24px 48px 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
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
        background: color-mix(in oklab, var(--primary) 10%, var(--card));
        color: var(--foreground);
        border-color: color-mix(in oklab, var(--primary) 20%, transparent);
      }

      &:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 1px;
      }

      &.is-active {
        background: var(--card);
        border: 1px solid color-mix(in oklab, var(--primary) 40%, var(--border));
        color: var(--primary);
        font-weight: 700;
        box-shadow: 0 2px 8px color-mix(in oklab, var(--primary) 15%, transparent), 0 1px 3px rgba(0, 0, 0, 0.08);

        span.material-symbols-outlined {
          opacity: 1;
        }
      }
    }

    :host-context(.dark) .tab-btn.is-active {
      background: color-mix(in oklab, var(--primary) 20%, var(--card));
      border-color: color-mix(in oklab, var(--primary) 50%, transparent);
      color: var(--primary);
      box-shadow: 0 2px 10px color-mix(in oklab, var(--primary) 28%, transparent);
    }

    .tab-count-chip {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 9999px;
      background: color-mix(in oklab, var(--primary) 18%, transparent);
      color: var(--primary);
    }

    /* Pane Sections */
    .dossier-tab-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .tab-pane {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .p-20 { padding: 20px; }
    .mb-16 { margin-bottom: 16px; }

    .pane-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
      padding-bottom: 12px;
      margin-bottom: 16px;
    }

    .pane-header-title {
      display: flex;
      align-items: center;
      gap: 10px;

      span.material-symbols-outlined {
        font-size: 22px;
        color: var(--primary);
      }

      h4 {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--foreground);
      }

      p {
        margin: 2px 0 0 0;
        font-size: 0.75rem;
        color: var(--muted-foreground);

        code {
          background: color-mix(in oklab, var(--muted) 40%, transparent);
          padding: 1px 4px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 0.72rem;
        }
      }
    }

    .governance-badge {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      background: color-mix(in oklab, var(--primary) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--primary) 25%, transparent);
      color: var(--primary);
      letter-spacing: 0.04em;
    }

    .dossier-form-container {
      padding: 20px;
      border-radius: 18px;
    }

    /* Glass Panel Token */
    .glass-panel {
      background: color-mix(in oklab, var(--card) 80%, transparent);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 16px;
    }

    /* Hero Card Specific Styles */
    ::ng-deep {
      .dossier-hero-card {
        border-radius: 20px !important;
        padding: 20px !important;
        margin-bottom: 4px !important;

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

        .prx-rich-card-body {
          grid-column: 2 / span 2 !important;
          grid-row: 2 !important;
          margin-top: -6px !important;
        }
      }

      /* Dynamic Form Presentation Customization (Clean Enterprise Editorial Layout) */
      .dossier-dynamic-form {
        .form-section {
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          padding: 0 0 20px 0 !important;
          margin-bottom: 24px !important;
          border-bottom: 1px solid color-mix(in oklab, var(--border) 60%, transparent) !important;

          &:last-child {
            border-bottom: none !important;
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
          }
        }

        .section-title {
          font-size: 0.84rem !important;
          font-weight: 700 !important;
          color: var(--primary) !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          margin-bottom: 14px !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase !important;
        }

        .praxis-presentation {
          padding: 8px 0 !important;
          border-bottom: 1px dashed color-mix(in oklab, var(--border) 35%, transparent) !important;

          &:last-child {
            border-bottom: none !important;
          }
        }

        .praxis-presentation__label {
          font-size: 0.72rem !important;
          font-weight: 600 !important;
          color: var(--muted-foreground) !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }

        .praxis-presentation__value {
          font-size: 0.88rem !important;
          font-weight: 600 !important;
          color: var(--foreground) !important;
        }

        /* Resolução Semântica Reativa para Campos Booleanos (ISSUE-022) */
        .praxis-presentation--boolean-false {
          .praxis-presentation__value {
            background: color-mix(in oklab, var(--muted) 70%, transparent) !important;
            color: var(--muted-foreground) !important;
            border: 1px solid color-mix(in oklab, var(--border) 80%, transparent) !important;
          }
        }

        .praxis-presentation--boolean-true {
          .praxis-presentation__value {
            background: color-mix(in oklab, #10b981 14%, transparent) !important;
            color: #059669 !important;
            border: 1px solid color-mix(in oklab, #10b981 30%, transparent) !important;
          }
        }
      }

      /* Stat Group / Reputação 360 (Harmonious Executive Metric Tiles) */
      .dossier-scores-section {
        display: block !important;
        margin-top: 12px !important;

        .prx-rich-stat-group__title {
          font-size: 1.05rem !important;
          font-weight: 700 !important;
          color: var(--foreground) !important;
          margin: 0 0 6px 0 !important;
          letter-spacing: -0.01em !important;
        }

        .prx-rich-stat-group__subtitle {
          font-size: 0.8rem !important;
          color: var(--muted-foreground) !important;
          margin: 0 0 18px 0 !important;
          line-height: 1.45 !important;
        }

        .prx-rich-stat-group__items {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 16px !important;
          width: 100% !important;
          margin: 0 !important;
        }

        .prx-rich-stat-group__item {
          display: grid !important;
          grid-template-columns: auto 1fr auto !important;
          grid-template-rows: auto auto 1fr !important;
          column-gap: 10px !important;
          row-gap: 4px !important;
          align-items: center !important;
          padding: 20px 22px !important;
          border-radius: 16px !important;
          border: 1px solid var(--border) !important;
          min-height: 195px !important;
          box-sizing: border-box !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          transition: transform 0.15s ease, box-shadow 0.15s ease !important;

          &:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
          }

          &[data-tone="info"] {
            background: color-mix(in oklab, #0284c7 8%, var(--card)) !important;
            border-color: color-mix(in oklab, #0284c7 22%, var(--border)) !important;
          }

          &[data-tone="success"] {
            background: color-mix(in oklab, #10b981 8%, var(--card)) !important;
            border-color: color-mix(in oklab, #10b981 22%, var(--border)) !important;
          }
        }
      }

      /* Skills Card */
      .skills-card {
        padding: 20px !important;
        border-radius: 16px !important;

        .prx-rich-card-title {
          font-size: 1.05rem !important;
          font-weight: 700 !important;
          margin-bottom: 16px !important;
        }
      }

      .asset-card-item {
        padding: 14px 18px !important;
        border-radius: 12px !important;
        margin-bottom: 12px !important;
      }
    }

    /* Badges */
    .status-pill {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 9999px;
      letter-spacing: 0.04em;
    }
    .cobalt-pill {
      background: color-mix(in oklab, #0284c7 15%, transparent);
      color: #38bdf8;
      border: 1px solid color-mix(in oklab, #0284c7 35%, transparent);
    }
    .ready-pill {
      background: color-mix(in oklab, #10b981 15%, transparent);
      color: #34d399;
      border: 1px solid color-mix(in oklab, #10b981 35%, transparent);
    }
    .reserve-pill {
      background: color-mix(in oklab, #f59e0b 15%, transparent);
      color: #fbbf24;
      border: 1px solid color-mix(in oklab, #f59e0b 35%, transparent);
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
  `],
})
export class HeroDossierDrawerComponent implements OnDestroy {
  readonly hero = input<HeroProfile | null>(null);
  readonly isTransitioning = input<boolean>(false);
  readonly close = output<void>();
  readonly toggleStatus = output<HeroProfile>();

  protected readonly activeTab = signal<DossierTabId>('identity');
  protected readonly isLoading = signal<boolean>(false);
  protected readonly payroll = signal<PayrollRecord[]>([]);
  protected readonly missions = signal<MissionParticipantRecord[]>([]);
  protected readonly assets = signal<EquipmentRecord[]>([]);

  private readonly http = inject(HttpClient);
  private dataSub: Subscription | null = null;

  protected readonly hostCapabilities: RichBlockHostCapabilities = {
    dispatchAction: (actionId: string, payload: unknown) => {
      if (actionId === 'hero.toggleStatus') {
        const h = (payload || this.hero()) as HeroProfile;
        if (h) this.toggleStatus.emit(h);
      }
    },
    isActionAvailable: () => true,
  };

  protected readonly headerDocument = computed<RichContentDocument>(() => {
    const h = this.hero();
    if (!h) return { kind: 'praxis.rich-content', version: '1.0.0', nodes: [] };
    return buildHeroHeaderDocument(h, this.isTransitioning());
  });

  protected readonly reputationDocument = computed<RichContentDocument>(() => {
    const h = this.hero();
    if (!h) return { kind: 'praxis.rich-content', version: '1.0.0', nodes: [] };
    return buildHeroReputationDocument(h);
  });

  protected readonly skillsDocument = computed<RichContentDocument>(() => {
    const h = this.hero();
    if (!h) return { kind: 'praxis.rich-content', version: '1.0.0', nodes: [] };
    return buildHeroSkillsDocument(h);
  });

  protected readonly heroRecord = computed<Record<string, unknown> | null>(() => {
    const h = this.hero();
    if (!h) return null;
    return { ...h } as Record<string, unknown>;
  });

  protected readonly payrollDocument = computed<RichContentDocument>(() => {
    return buildPayrollDocument(this.payroll());
  });

  protected readonly missionsDocument = computed<RichContentDocument>(() => {
    return buildMissionsDocument(this.missions());
  });

  protected readonly assetsDocument = computed<RichContentDocument>(() => {
    return buildAssetsDocument(this.assets());
  });

  constructor() {
    effect(() => {
      const h = this.hero();
      if (!h?.id) {
        this.dataSub?.unsubscribe();
        this.payroll.set([]);
        this.missions.set([]);
        this.assets.set([]);
        this.activeTab.set('identity');
        this.isLoading.set(false);
        return;
      }
      this.fetchAllHeroData(h.id);
    });
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
  }

  private fetchAllHeroData(heroId: number): void {
    this.dataSub?.unsubscribe();
    this.isLoading.set(true);

    const payroll$ = this.http
      .post<{ data?: { content?: PayrollRecord[] } }>(
        `${PRAXIS_API_BASE_URL}/human-resources/folhas-pagamento/filter`,
        { funcionarioId: heroId }
      )
      .pipe(
        map((res) => res.data?.content || []),
        catchError(() => of([] as PayrollRecord[]))
      );

    const missions$ = this.http
      .post<{ data?: { content?: MissionParticipantRecord[] } }>(
        `${PRAXIS_API_BASE_URL}/operations/missao-participantes/filter`,
        { funcionarioId: heroId }
      )
      .pipe(
        map((res) => res.data?.content || []),
        catchError(() => of([] as MissionParticipantRecord[]))
      );

    const assets$ = this.http
      .post<{ data?: { content?: EquipmentRecord[] } }>(
        `${PRAXIS_API_BASE_URL}/assets/equipamentos/filter`,
        { proprietarioId: heroId }
      )
      .pipe(
        map((res) => res.data?.content || []),
        catchError(() => of([] as EquipmentRecord[]))
      );

    this.dataSub = forkJoin({
      payroll: payroll$,
      missions: missions$,
      assets: assets$,
    }).subscribe({
      next: ({ payroll, missions, assets }) => {
        this.payroll.set(payroll);
        this.missions.set(missions);
        this.assets.set(assets);
        this.isLoading.set(false);
      },
      error: () => {
        this.payroll.set([]);
        this.missions.set([]);
        this.assets.set([]);
        this.isLoading.set(false);
      },
    });
  }
}
