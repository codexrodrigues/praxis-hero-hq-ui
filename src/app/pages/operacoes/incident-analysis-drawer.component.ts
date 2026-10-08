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
import { Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PraxisMicroVisualizationComponent } from '@praxisui/charts';
import type { PraxisPresentationVisualizationConfig } from '@praxisui/core';
import { PRAXIS_API_BASE_URL } from '../../core/platform.config';

export interface IncidentProfile {
  id: number;
  missaoId?: number;
  descricao: string;
  severidade: string;
  local: string;
  ocorridoEm?: string;
  danosCivis?: number;
  feridos?: number;
  mortos?: number;
}

export interface RiskIndicatorData {
  incidenteId: number;
  missao?: string;
  descricao?: string;
  local?: string;
  severidade?: string;
  danosCivis?: number;
  totalIndenizacoes?: number;
  totalPago?: number;
  totalPendente?: number;
  ocorridoEm?: string;
}

export interface RelatedMissionData {
  id: number;
  titulo: string;
  prioridade: string;
  status: string;
  local?: string;
}

export type IncidentTabId = 'pericia' | 'financeiro' | 'resposta';

export function formatIncidentDateTime(isoStr?: string | null): string {
  if (!isoStr) return 'Data não catalogada';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

export function formatCurrencyBRL(value?: number | null): string {
  if (value == null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

@Component({
  selector: 'app-incident-analysis-drawer',
  standalone: true,
  imports: [CommonModule, PraxisMicroVisualizationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (incident(); as inc) {
      <div class="drawer-backdrop" (click)="onBackdropClick($event)">
        <aside class="drawer-panel tactical-scroll" role="dialog" aria-modal="true">
          <!-- Top Classification Bar -->
          <div class="drawer-top-bar">
            <span class="classification-pill">
              <span class="material-symbols-outlined">crisis_alert</span>
              DOSSIÊ DE INVESTIGAÇÃO DE SINISTRO · PRAXIS GOVERNED
            </span>
            <button
              type="button"
              class="close-button"
              (click)="closeDrawer.emit()"
              aria-label="Fechar Dossiê de Incidente"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Hero Identity Section -->
          <div class="hero-identity-card">
            <div class="identity-main">
              <div class="incident-badge-icon" [ngClass]="getSeverityToneClass(inc.severidade)">
                <span class="material-symbols-outlined">emergency</span>
              </div>
              <div class="identity-text">
                <h2 class="incident-title">Incidente #{{ inc.id }} · {{ inc.local }}</h2>
                <div class="identity-meta">
                  <span>{{ formatDateTime(inc.ocorridoEm) }}</span>
                  <span class="meta-dot">·</span>
                  @if (inc.missaoId) {
                    <span>Missão #MIS-{{ inc.missaoId }}</span>
                  } @else {
                    <span>Ocorrência Avulsa</span>
                  }
                </div>
              </div>
            </div>

            <!-- Tactical Badges -->
            <div class="tactical-badges">
              <span class="badge" [ngClass]="getSeverityToneClass(inc.severidade)">
                SEVERIDADE: {{ inc.severidade }}
              </span>
              <span class="badge badge-warning">
                DANOS: {{ formatCurrency(inc.danosCivis) }}
              </span>
              <span class="badge" [class.badge-danger]="(inc.feridos ?? 0) > 0" [class.badge-neutral]="(inc.feridos ?? 0) === 0">
                {{ inc.feridos ?? 0 }} FERIDOS / {{ inc.mortos ?? 0 }} ÓBITOS
              </span>
            </div>
          </div>

          <!-- Segmented Navigation Controls -->
          <div class="segmented-control" role="tablist">
            <button
              type="button"
              role="tab"
              class="seg-btn"
              [class.is-active]="activeTab() === 'pericia'"
              (click)="activeTab.set('pericia')"
            >
              <span class="material-symbols-outlined">description</span>
              <span>Laudo & Perícia</span>
            </button>
            <button
              type="button"
              role="tab"
              class="seg-btn"
              [class.is-active]="activeTab() === 'financeiro'"
              (click)="activeTab.set('financeiro')"
            >
              <span class="material-symbols-outlined">payments</span>
              <span>Mitigação & Indenizações</span>
              @if (riskIndicator()) {
                <span class="tab-badge">Auditado</span>
              }
            </button>
            <button
              type="button"
              role="tab"
              class="seg-btn"
              [class.is-active]="activeTab() === 'resposta'"
              (click)="activeTab.set('resposta')"
            >
              <span class="material-symbols-outlined">timeline</span>
              <span>Resposta Emergencial</span>
            </button>
          </div>

          <!-- Drawer Content Body -->
          <div class="drawer-body">
            <!-- TAB 1: Laudo & Perícia Forense -->
            @if (activeTab() === 'pericia') {
              <div class="tab-pane">
                <h3 class="section-title">Parâmetros de Sinistro & Laudo Pericial</h3>

                <div class="property-grid">
                  <div class="property-item">
                    <span class="property-label">
                      <span class="material-symbols-outlined">tag</span>
                      Código de Registro
                    </span>
                    <span class="property-value font-mono">#INC-{{ inc.id }}</span>
                  </div>

                  <div class="property-item">
                    <span class="property-label">
                      <span class="material-symbols-outlined">flag</span>
                      Missão Vinculada
                    </span>
                    <span class="property-value font-mono">
                      @if (relatedMission(); as miss) {
                        #MIS-{{ miss.id }} - {{ miss.titulo }}
                      } @else if (inc.missaoId) {
                        #MIS-{{ inc.missaoId }}
                      } @else {
                        Não associada
                      }
                    </span>
                  </div>

                  <div class="property-item">
                    <span class="property-label">
                      <span class="material-symbols-outlined">emergency</span>
                      Classificação Tática
                    </span>
                    <span class="property-value">
                      <span class="pill-tone" [ngClass]="getSeverityToneClass(inc.severidade)">
                        {{ inc.severidade }}
                      </span>
                    </span>
                  </div>

                  <div class="property-item">
                    <span class="property-label">
                      <span class="material-symbols-outlined">location_on</span>
                      Teatro do Dano
                    </span>
                    <span class="property-value">{{ inc.local }}</span>
                  </div>

                  <div class="property-item">
                    <span class="property-label">
                      <span class="material-symbols-outlined">calendar_today</span>
                      Data e Hora do Sinistro
                    </span>
                    <span class="property-value">{{ formatDateTime(inc.ocorridoEm) }}</span>
                  </div>

                  <div class="property-item">
                    <span class="property-label">
                      <span class="material-symbols-outlined">account_balance</span>
                      Prejuízo Civil Estimado
                    </span>
                    <span class="property-value text-warning font-mono">
                      {{ formatCurrency(inc.danosCivis) }}
                    </span>
                  </div>

                  <div class="property-item">
                    <span class="property-label">
                      <span class="material-symbols-outlined">healing</span>
                      Vítimas Não Fatais
                    </span>
                    <span class="property-value">{{ inc.feridos ?? 0 }} lesões catalogadas</span>
                  </div>

                  <div class="property-item">
                    <span class="property-label">
                      <span class="material-symbols-outlined">heart_broken</span>
                      Vítimas Fatais
                    </span>
                    <span class="property-value" [class.text-danger]="(inc.mortos ?? 0) > 0">
                      {{ inc.mortos ?? 0 }} civis falecidos
                    </span>
                  </div>

                  <div class="property-item span-full">
                    <span class="property-label">
                      <span class="material-symbols-outlined">feed</span>
                      Laudo Técnico Forense & Análise Circunstancial
                    </span>
                    <div class="narrative-box">
                      {{ inc.descricao }}
                    </div>
                  </div>
                </div>

                @if (relatedMission(); as miss) {
                  <div class="related-mission-card">
                    <div class="mission-card-header">
                      <span class="material-symbols-outlined">military_tech</span>
                      <span>Operação Vinculada: {{ miss.titulo }}</span>
                      <span class="pill-tone pill-info">{{ miss.status }}</span>
                    </div>
                    <p class="mission-card-body">
                      Ocorrência deflagrada durante o engajamento operacional em {{ miss.local || 'área restrita' }}.
                      Nível de prioridade da missão: <strong>{{ miss.prioridade }}</strong>.
                    </p>
                  </div>
                }
              </div>
            }

            <!-- TAB 2: Mitigação Financeira & Indenizações -->
            @if (activeTab() === 'financeiro') {
              <div class="tab-pane">
                <div class="tab-intro">
                  <div>
                    <h3 class="section-title">Análise de Risco & Fundo Tático de Indenizações</h3>
                    <p class="section-subtitle">
                      Auditoria fiduciária regida pelas cláusulas do Acordo de Sokovia e fundo compensatório S.H.I.E.L.D.
                    </p>
                  </div>
                  @if (riskIndicator()) {
                    <span class="status-chip chip-audited">
                      <span class="material-symbols-outlined">verified</span>
                      Auditado
                    </span>
                  }
                </div>

                @if (loadingRisk()) {
                  <div class="loading-state">
                    <span class="material-symbols-outlined spin">progress_activity</span>
                    <span>Carregando leitura analítica da view governada...</span>
                  </div>
                } @else if (riskIndicator(); as risk) {
                  <!-- 4 KPI Bento Cards with Embedded Microcharts -->
                  <div class="financial-kpi-grid">
                    <!-- CARD 1: Prejuízo Civil -->
                    <div class="finance-card card-highlight-danger">
                      <div class="finance-card-header">
                        <span class="finance-label">Prejuízo Civil Apurado</span>
                        <span class="finance-pill pill-danger">Escalação</span>
                      </div>
                      <span class="finance-value text-danger">{{ formatCurrency(risk.danosCivis) }}</span>
                      <div class="finance-chart-container">
                        @if (danosCivisTrendConfig(); as cfg) {
                          <praxis-micro-visualization [visualization]="cfg" />
                        }
                      </div>
                      <span class="finance-caption">Estimativa de sinistralidade forense de campo</span>
                    </div>

                    <!-- CARD 2: Indenizações Aprovadas -->
                    <div class="finance-card card-highlight-warning">
                      <div class="finance-card-header">
                        <span class="finance-label">Indenizações Aprovadas</span>
                        <span class="finance-pill pill-warning">Teto Sokovia</span>
                      </div>
                      <span class="finance-value text-warning">{{ formatCurrency(risk.totalIndenizacoes) }}</span>
                      <div class="finance-chart-container">
                        @if (indenizacoesBulletConfig(); as cfg) {
                          <praxis-micro-visualization [visualization]="cfg" />
                        }
                      </div>
                      <span class="finance-caption">Compensação aprovada contra sinistralidade</span>
                    </div>

                    <!-- CARD 3: Total Liquidado -->
                    <div class="finance-card card-highlight-success">
                      <div class="finance-card-header">
                        <span class="finance-label">Total Liquidado</span>
                        <span class="finance-pill pill-success">{{ liquidationPercent() }}% Pago</span>
                      </div>
                      <span class="finance-value text-success">{{ formatCurrency(risk.totalPago) }}</span>
                      <div class="finance-chart-container">
                        <div class="radial-kpi-wrap">
                          <praxis-micro-visualization [visualization]="liquidadoRadialConfig()" />
                          <div class="radial-meta">
                            <span class="kpi-rate-tag text-success">{{ liquidationPercent() }}% Liquidado</span>
                            <span class="kpi-rate-sub">Repasses concluídos</span>
                          </div>
                        </div>
                      </div>
                      <span class="finance-caption">Repasses financeiros e obras finalizadas</span>
                    </div>

                    <!-- CARD 4: Saldo Pendente -->
                    <div class="finance-card card-highlight-info">
                      <div class="finance-card-header">
                        <span class="finance-label">Saldo Pendente</span>
                        <span class="finance-pill pill-info">Em Aberto</span>
                      </div>
                      <span class="finance-value text-info">{{ formatCurrency(risk.totalPendente) }}</span>
                      <div class="finance-chart-container">
                        <div class="delta-kpi-wrap">
                          <praxis-micro-visualization [visualization]="pendenteDeltaConfig()" />
                          <span class="delta-sub">{{ formatCurrency(risk.totalPendente) }} restante</span>
                        </div>
                      </div>
                      <span class="finance-caption">Aguardando homologação de laudo pericial</span>
                    </div>
                  </div>

                  <!-- Workflow de Liquidação e Conformidade -->
                  <div class="process-flow-panel">
                    <div class="flow-title-row">
                      <span class="flow-title">
                        <span class="material-symbols-outlined">account_tree</span>
                        Fluxo de Liquidação e Conformidade Sokovia
                      </span>
                      <span class="font-mono font-bold text-success">{{ liquidationPercent() }}% Liquidado</span>
                    </div>

                    <div class="flow-chart-wrap">
                      <praxis-micro-visualization [visualization]="processFlowConfig()" />
                    </div>

                    <div class="liquidation-track">
                      <div
                        class="liquidation-fill"
                        [style.width.%]="liquidationPercent()"
                        [class.fill-success]="liquidationPercent() >= 75"
                        [class.fill-warning]="liquidationPercent() < 75"
                      ></div>
                    </div>
                    <p class="liquidation-legend">
                      Conformidade financeira regida pelo Tratado de Sokovia e Acordo de Compensação Metahumana.
                    </p>
                  </div>

                  <!-- Governança e Auditoria -->
                  <div class="governance-panel">
                    <div class="gov-header">
                      <span class="material-symbols-outlined">verified_user</span>
                      <span>Governança do Fundo de Compensação</span>
                    </div>
                    <ul class="gov-list">
                      <li>
                        <span class="material-symbols-outlined check-icon">check_circle</span>
                        <span>Auditoria Contábil S.H.I.E.L.D. validada sem discrepâncias.</span>
                      </li>
                      <li>
                        <span class="material-symbols-outlined check-icon">check_circle</span>
                        <span>Compensações civis vinculadas diretamente aos laudos do incidente #{{ risk.incidenteId }}.</span>
                      </li>
                      <li>
                        <span class="material-symbols-outlined check-icon">check_circle</span>
                        <span>Classificação de dados sensíveis protegida por políticas de conformidade interna.</span>
                      </li>
                    </ul>
                  </div>
                } @else {
                  <div class="empty-state">
                    <span class="material-symbols-outlined">info</span>
                    <p>Não há projeção de indenizações cadastrada para este sinistro até o momento.</p>
                  </div>
                }
              </div>
            }

            <!-- TAB 3: Resposta Emergencial & Cronologia -->
            @if (activeTab() === 'resposta') {
              <div class="tab-pane">
                <h3 class="section-title">Protocolo de Resposta Imediata pós-Confronto</h3>

                <div class="timeline-container">
                  <div class="timeline-node">
                    <div class="timeline-marker marker-alert"></div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="timeline-step">T+00m · Disparo de Alarme & Alerta Sísmico/Cinético</span>
                        <span class="timeline-badge badge-danger">IMEDIATO</span>
                      </div>
                      <p class="timeline-text">
                        Sensores urbanos e telemetria militar detectam choque destrutivo em {{ inc.local }}.
                        Acionamento do protocolo civil nível {{ inc.severidade }}.
                      </p>
                    </div>
                  </div>

                  <div class="timeline-node">
                    <div class="timeline-marker marker-warning"></div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="timeline-step">T+15m · Triagem Médica e Cordão de Isolamento</span>
                        <span class="timeline-badge badge-warning">RESPOSTA</span>
                      </div>
                      <p class="timeline-text">
                        Equipes de socorristas e blindagem civil isolam o perímetro de risco.
                        Prestação de primeiros socorros e triagem das vítimas no local.
                      </p>
                    </div>
                  </div>

                  <div class="timeline-node">
                    <div class="timeline-marker marker-info"></div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="timeline-step">T+45m · Blindagem Estrutural & Neutralização Química</span>
                        <span class="timeline-badge badge-info">CONTENÇÃO</span>
                      </div>
                      <p class="timeline-text">
                        Suporte de engenharia tática escorando estruturas abaladas e purificando
                        resíduos ou materiais nocivos resultantes do confronto.
                      </p>
                    </div>
                  </div>

                  <div class="timeline-node">
                    <div class="timeline-marker marker-success"></div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="timeline-step">T+120m · Laudo Pericial & Abertura de Apólice</span>
                        <span class="timeline-badge badge-success">FINALIZADO</span>
                      </div>
                      <p class="timeline-text">
                        Perícia S.H.I.E.L.D. conclui catálogo de danos de {{ formatCurrency(inc.danosCivis) }}
                        e direciona ao Fundo de Compensação Civil.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </aside>
      </div>
    }
  `,
  styles: [`
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: var(--overlay);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 1200;
      display: flex;
      justify-content: flex-end;
      animation: fadeIn 0.2s ease-out;
    }

    .drawer-panel {
      width: 100%;
      max-width: 660px;
      height: 100%;
      background: var(--background);
      border-left: 1px solid var(--border);
      box-shadow: var(--shadow-command);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .tactical-scroll {
      scrollbar-width: thin;
      scrollbar-color: color-mix(in oklab, var(--muted-foreground) 35%, transparent) transparent;
      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-thumb {
        background: color-mix(in oklab, var(--muted-foreground) 35%, transparent);
        border-radius: 4px;
      }
    }

    .drawer-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
      background: color-mix(in oklab, var(--card) 60%, transparent);
    }

    .classification-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: color-mix(in oklab, var(--alert) 14%, transparent);
      color: var(--alert);
      border: 1px solid color-mix(in oklab, var(--alert) 32%, transparent);
      span { font-size: 16px; }
    }

    .close-button {
      background: transparent;
      border: none;
      color: var(--muted-foreground);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      border-radius: 8px;
      transition: all 0.15s ease;
      &:hover {
        background: var(--accent);
        color: var(--foreground);
      }
    }

    /* Hero Identity Card */
    .hero-identity-card {
      padding: 24px;
      border-bottom: 1px solid var(--border);
      background: color-mix(in oklab, var(--card) 50%, var(--background));
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .identity-main {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .incident-badge-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border);
      background: color-mix(in oklab, var(--card) 90%, transparent);
      span { font-size: 28px; }
    }

    .incident-title {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--foreground);
      line-height: 1.25;
    }

    .identity-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
      font-size: 0.82rem;
      color: var(--muted-foreground);
    }

    .meta-dot {
      color: var(--border);
    }

    .tactical-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border: 1px solid transparent;
    }

    .badge-danger {
      background: color-mix(in oklab, var(--alert) 15%, transparent);
      color: var(--alert);
      border-color: color-mix(in oklab, var(--alert) 35%, transparent);
    }

    .badge-warning {
      background: color-mix(in oklab, var(--warning) 15%, transparent);
      color: var(--warning);
      border-color: color-mix(in oklab, var(--warning) 35%, transparent);
    }

    .badge-info {
      background: color-mix(in oklab, var(--primary) 15%, transparent);
      color: var(--primary);
      border-color: color-mix(in oklab, var(--primary) 35%, transparent);
    }

    .badge-neutral {
      background: color-mix(in oklab, var(--muted) 80%, transparent);
      color: var(--muted-foreground);
      border-color: var(--border);
    }

    /* Segmented Navigation Controls */
    .segmented-control {
      display: flex;
      padding: 8px 24px 0;
      border-bottom: 1px solid var(--border);
      gap: 8px;
      background: color-mix(in oklab, var(--muted) 50%, var(--card));
    }

    .seg-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--muted-foreground);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;

      span.material-symbols-outlined { font-size: 18px; }

      &:hover {
        color: var(--foreground);
        background: color-mix(in oklab, var(--accent) 50%, transparent);
      }

      &.is-active {
        color: var(--primary);
        border-bottom-color: var(--primary);
      }

      .tab-badge {
        padding: 2px 6px;
        border-radius: 9999px;
        background: color-mix(in oklab, var(--primary) 18%, transparent);
        color: var(--primary);
        font-size: 0.68rem;
        font-weight: 700;
      }
    }

    /* Drawer Body */
    .drawer-body {
      padding: 24px;
      flex: 1;
    }

    .section-title {
      margin: 0 0 16px;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--foreground);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .property-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .property-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px 14px;
      background: color-mix(in oklab, var(--card) 85%, transparent);
      border: 1px solid var(--border);
      border-radius: 10px;

      &.span-full {
        grid-column: 1 / -1;
      }
    }

    .property-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted-foreground);
      span { font-size: 15px; }
    }

    .property-value {
      font-size: 0.88rem;
      color: var(--foreground);
      font-weight: 500;
    }

    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .pill-tone {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .pill-info {
      background: color-mix(in oklab, var(--primary) 15%, transparent);
      color: var(--primary);
    }

    .narrative-box {
      font-size: 0.88rem;
      line-height: 1.55;
      color: var(--foreground);
      background: color-mix(in oklab, var(--muted) 60%, var(--card));
      padding: 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      border-left: 3px solid var(--primary);
    }

    .related-mission-card {
      margin-top: 18px;
      padding: 14px 16px;
      border-radius: 12px;
      background: color-mix(in oklab, var(--primary) 8%, var(--card));
      border: 1px solid color-mix(in oklab, var(--primary) 25%, transparent);
    }

    .mission-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--foreground);
      margin-bottom: 6px;
      span.material-symbols-outlined { color: var(--primary); font-size: 20px; }
    }

    .mission-card-body {
      margin: 0;
      font-size: 0.82rem;
      color: var(--muted-foreground);
      line-height: 1.45;
      strong { color: var(--foreground); }
    }

    /* Financial Tab Styles */
    .tab-intro {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }

    .section-subtitle {
      margin: 4px 0 0;
      font-size: 0.8rem;
      color: var(--muted-foreground);
      line-height: 1.4;
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      span.material-symbols-outlined { font-size: 16px; }
    }

    .chip-audited {
      background: color-mix(in oklab, var(--ready) 14%, transparent);
      color: var(--ready);
      border: 1px solid color-mix(in oklab, var(--ready) 30%, transparent);
    }

    .financial-kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      margin-bottom: 20px;
    }

    .finance-card {
      padding: 16px 18px;
      border-radius: 14px;
      background: color-mix(in oklab, var(--card) 88%, transparent);
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 8px;
      position: relative;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      &:hover {
        border-color: color-mix(in oklab, var(--primary) 35%, var(--border));
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }
    }

    .card-highlight-danger {
      border-top: 3px solid var(--alert);
    }
    .card-highlight-warning {
      border-top: 3px solid var(--warning);
    }
    .card-highlight-success {
      border-top: 3px solid var(--ready);
    }
    .card-highlight-info {
      border-top: 3px solid var(--cobalt);
    }

    .finance-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .finance-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--muted-foreground);
    }

    .finance-pill {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .pill-danger {
      background: color-mix(in oklab, var(--alert) 15%, transparent);
      color: var(--alert);
      border: 1px solid color-mix(in oklab, var(--alert) 30%, transparent);
    }
    .pill-warning {
      background: color-mix(in oklab, var(--warning) 15%, transparent);
      color: var(--warning);
      border: 1px solid color-mix(in oklab, var(--warning) 30%, transparent);
    }
    .pill-success {
      background: color-mix(in oklab, var(--ready) 15%, transparent);
      color: var(--ready);
      border: 1px solid color-mix(in oklab, var(--ready) 30%, transparent);
    }
    .pill-info {
      background: color-mix(in oklab, var(--cobalt) 15%, transparent);
      color: var(--cobalt);
      border: 1px solid color-mix(in oklab, var(--cobalt) 30%, transparent);
    }

    .finance-value {
      font-size: 1.45rem;
      font-weight: 800;
      font-family: var(--font-display);
      letter-spacing: -0.02em;
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }

    .finance-chart-container {
      margin: 4px 0 2px;
      min-height: 42px;
      display: flex;
      align-items: center;
      width: 100%;

      praxis-micro-visualization {
        width: 100%;
      }
    }

    .finance-caption {
      font-size: 0.74rem;
      color: var(--muted-foreground);
      line-height: 1.35;
    }

    .radial-kpi-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .radial-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .kpi-rate-tag {
      font-size: 0.85rem;
      font-weight: 700;
      font-family: var(--font-display);
    }

    .kpi-rate-sub {
      font-size: 0.7rem;
      color: var(--muted-foreground);
    }

    .delta-kpi-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .delta-sub {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--foreground);
    }

    .process-flow-panel {
      padding: 18px 20px;
      border-radius: 14px;
      background: color-mix(in oklab, var(--card) 85%, transparent);
      border: 1px solid var(--border);
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .flow-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      span.flow-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.82rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--foreground);
        span.material-symbols-outlined { font-size: 18px; color: var(--primary); }
      }
    }

    .flow-chart-wrap {
      width: 100%;
      padding: 8px 0;
      praxis-micro-visualization {
        width: 100%;
      }
      ::ng-deep .prx-micro-process__node-wrapper {
        min-width: 52px;
      }
      ::ng-deep .prx-micro-process__label {
        inline-size: 80px !important;
        max-width: 80px !important;
        font-size: 10px !important;
        line-height: 1.2 !important;
        margin-top: 6px !important;
      }
    }

    .liquidation-track {
      width: 100%;
      height: 10px;
      background: color-mix(in oklab, var(--muted) 80%, var(--border));
      border-radius: 9999px;
      overflow: hidden;
    }

    .liquidation-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.4s ease;
    }

    .fill-success { background: var(--ready); }
    .fill-warning { background: var(--warning); }

    .liquidation-legend {
      margin: 4px 0 0;
      font-size: 0.75rem;
      color: var(--muted-foreground);
    }

    .governance-panel {
      padding: 16px;
      border-radius: 12px;
      background: color-mix(in oklab, var(--ready) 8%, var(--card));
      border: 1px solid color-mix(in oklab, var(--ready) 25%, transparent);
    }

    .gov-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--ready);
      margin-bottom: 12px;
      span.material-symbols-outlined { font-size: 20px; }
    }

    .gov-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;

      li {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 0.82rem;
        color: var(--muted-foreground);

        .check-icon {
          color: var(--ready);
          font-size: 16px;
          margin-top: 2px;
        }
      }
    }

    /* Timeline Styles */
    .timeline-container {
      display: flex;
      flex-direction: column;
      position: relative;
      padding-left: 20px;

      &::before {
        content: '';
        position: absolute;
        top: 10px;
        bottom: 10px;
        left: 7px;
        width: 2px;
        background: var(--border);
      }
    }

    .timeline-node {
      position: relative;
      padding-bottom: 24px;
      &:last-child { padding-bottom: 0; }
    }

    .timeline-marker {
      position: absolute;
      left: -20px;
      top: 4px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid var(--background);
    }

    .marker-alert { background: var(--alert); box-shadow: 0 0 10px color-mix(in oklab, var(--alert) 50%, transparent); }
    .marker-warning { background: var(--warning); box-shadow: 0 0 10px color-mix(in oklab, var(--warning) 50%, transparent); }
    .marker-info { background: var(--primary); box-shadow: 0 0 10px color-mix(in oklab, var(--primary) 50%, transparent); }
    .marker-success { background: var(--ready); box-shadow: 0 0 10px color-mix(in oklab, var(--ready) 50%, transparent); }

    .timeline-content {
      padding-left: 10px;
    }

    .timeline-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 4px;
    }

    .timeline-step {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--foreground);
    }

    .timeline-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .timeline-text {
      margin: 0;
      font-size: 0.82rem;
      color: var(--muted-foreground);
      line-height: 1.45;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px 20px;
      color: var(--muted-foreground);
      font-size: 0.85rem;
      span.material-symbols-outlined { font-size: 32px; }
    }

    .spin {
      animation: rotate 1s linear infinite;
    }

    .text-danger { color: var(--alert) !important; }
    .text-warning { color: var(--warning) !important; }
    .text-success { color: var(--ready) !important; }
    .text-info { color: var(--primary) !important; }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
  `],
})
export class IncidentAnalysisDrawerComponent implements OnDestroy {
  readonly incident = input<IncidentProfile | null>(null);
  readonly closeDrawer = output<void>();

  protected readonly activeTab = signal<IncidentTabId>('pericia');
  protected readonly loadingRisk = signal<boolean>(false);
  protected readonly riskIndicator = signal<RiskIndicatorData | null>(null);
  protected readonly relatedMission = signal<RelatedMissionData | null>(null);

  protected readonly liquidationPercent = computed<number>(() => {
    const risk = this.riskIndicator();
    if (!risk || !risk.totalIndenizacoes || risk.totalIndenizacoes <= 0) return 0;
    const paid = risk.totalPago ?? 0;
    return Math.min(100, Math.round((paid / risk.totalIndenizacoes) * 100));
  });

  protected readonly danosCivisTrendConfig = computed<PraxisPresentationVisualizationConfig | null>(() => {
    const risk = this.riskIndicator();
    const val = risk?.danosCivis ?? this.incident()?.danosCivis ?? 0;
    if (val <= 0) return null;
    return {
      kind: 'area',
      surface: 'card-summary',
      size: 'responsive',
      tone: 'danger',
      fallbackText: 'Escalação T+120m',
      points: [
        { label: 'T+00m', value: Math.round(val * 0.15) },
        { label: 'T+15m', value: Math.round(val * 0.42) },
        { label: 'T+45m', value: Math.round(val * 0.78) },
        { label: 'T+120m', value: Math.round(val) },
      ],
    };
  });

  protected readonly indenizacoesBulletConfig = computed<PraxisPresentationVisualizationConfig | null>(() => {
    const risk = this.riskIndicator();
    if (!risk) return null;
    const claimed = risk.danosCivis ?? 100000;
    const approved = risk.totalIndenizacoes ?? 0;
    const maxVal = Math.max(claimed * 1.15, approved * 1.15, 100000);
    return {
      kind: 'bullet',
      surface: 'card-summary',
      size: 'responsive',
      tone: 'warning',
      value: approved,
      target: claimed,
      total: Math.round(maxVal),
      baseline: 0,
      fallbackText: 'Compensação vs Sinistro',
      thresholds: [
        { label: 'Piso 35%', value: Math.round(claimed * 0.35), tone: 'info' },
        { label: 'Teto 100%', value: Math.round(claimed), tone: 'warning' },
      ],
    };
  });

  protected readonly liquidadoRadialConfig = computed<PraxisPresentationVisualizationConfig>(() => {
    const pct = this.liquidationPercent();
    return {
      kind: 'radial',
      surface: 'card-summary',
      size: 'sm',
      tone: pct >= 75 ? 'success' : pct >= 40 ? 'warning' : 'info',
      value: pct,
      total: 100,
      fallbackText: `${pct}% Liquidado`,
    };
  });

  protected readonly pendenteDeltaConfig = computed<PraxisPresentationVisualizationConfig>(() => {
    const pct = 100 - this.liquidationPercent();
    return {
      kind: 'delta',
      surface: 'card-summary',
      size: 'sm',
      tone: 'info',
      value: -pct,
      fallbackText: `-${pct}% saldo`,
    };
  });

  protected readonly processFlowConfig = computed<PraxisPresentationVisualizationConfig>(() => {
    const pct = this.liquidationPercent();
    return {
      kind: 'processFlow',
      surface: 'card-summary',
      size: 'responsive',
      fallbackText: 'Fluxo de liquidação Sokovia',
      items: [
        { id: '1', label: 'Perícia', tone: 'success', icon: 'verified' },
        { id: '2', label: 'Homologação', tone: 'success', icon: 'gavel' },
        { id: '3', label: 'Repasse', tone: pct >= 50 ? 'success' : 'warning', icon: 'payments' },
        { id: '4', label: 'Auditoria', tone: pct >= 100 ? 'success' : 'info', icon: 'account_balance' },
      ],
    };
  });

  private readonly http = inject(HttpClient);
  private sub: Subscription | null = null;

  constructor() {
    effect(() => {
      const inc = this.incident();
      if (inc) {
        this.loadRiskIndicators(inc.id);
        if (inc.missaoId) {
          this.loadMissionDetails(inc.missaoId);
        } else {
          this.relatedMission.set(null);
        }
      } else {
        this.riskIndicator.set(null);
        this.relatedMission.set(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('drawer-backdrop')) {
      this.closeDrawer.emit();
    }
  }

  protected formatDateTime(isoStr?: string | null): string {
    return formatIncidentDateTime(isoStr);
  }

  protected formatCurrency(val?: number | null): string {
    return formatCurrencyBRL(val);
  }

  protected getSeverityToneClass(sev?: string): string {
    const s = sev?.toUpperCase();
    if (s === 'CRITICA' || s === 'OMEGA') return 'badge-danger';
    if (s === 'ALTA') return 'badge-warning';
    if (s === 'MEDIA') return 'badge-info';
    return 'badge-neutral';
  }

  private loadRiskIndicators(incidentId: number): void {
    this.loadingRisk.set(true);
    this.sub?.unsubscribe();

    const url = `${PRAXIS_API_BASE_URL}/operations/incidentes/${incidentId}/risk-indicators`;
    this.sub = this.http
      .get<{ data?: RiskIndicatorData[]; success?: boolean }>(url)
      .pipe(
        map((resp) => {
          if (resp && resp.data && Array.isArray(resp.data) && resp.data.length > 0) {
            return resp.data[0];
          }
          return null;
        }),
        catchError(() => [null]),
      )
      .subscribe((indicator) => {
        this.riskIndicator.set(indicator);
        this.loadingRisk.set(false);
      });
  }

  private loadMissionDetails(missaoId: number): void {
    const url = `${PRAXIS_API_BASE_URL}/operations/missoes/${missaoId}`;
    this.http
      .get<{ data?: RelatedMissionData }>(url)
      .pipe(
        map((resp) => resp?.data || null),
        catchError(() => [null]),
      )
      .subscribe((mission) => {
        this.relatedMission.set(mission);
      });
  }
}
