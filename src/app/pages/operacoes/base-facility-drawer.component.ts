import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PRAXIS_API_BASE_URL } from '../../core/platform.config';

export interface BaseFacilityProfile {
  id: number;
  nome: string;
  tipo: string;
  sigilo: string;
  latitude?: number;
  longitude?: number;
  planeta?: string;
}

export interface BaseAccessItem {
  id: number;
  baseId: number;
  funcionarioId: number;
  baseNome?: string;
  funcionarioNome?: string;
  nivelAcesso: string;
  ativo: boolean;
}

export type FacilityTabId = 'detalhes' | 'acessos' | 'defesa';

@Component({
  selector: 'app-base-facility-drawer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (facility(); as fac) {
      <div class="drawer-backdrop" (click)="onBackdropClick($event)">
        <aside class="drawer-panel tactical-scroll" role="dialog" aria-modal="true">
          <!-- Top Classification Bar -->
          <div class="drawer-top-bar">
            <span class="classification-pill">
              <span class="material-symbols-outlined">hub</span>
              DOSSIÊ DE INSTALAÇÃO & INFRAESTRUTURA · PRAXIS GOVERNED
            </span>
            <button
              type="button"
              class="close-button"
              (click)="closeDrawer.emit()"
              aria-label="Fechar Dossiê da Base"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Hero Identity Section -->
          <div class="hero-identity-card">
            <div class="identity-main">
              <div class="facility-badge-icon" [ngClass]="getSigiloToneClass(fac.sigilo)">
                <span class="material-symbols-outlined">{{ getFacilityIcon(fac.tipo) }}</span>
              </div>
              <div class="identity-text">
                <h2 class="facility-title">{{ fac.nome }}</h2>
                <div class="identity-meta">
                  <span>{{ fac.tipo }}</span>
                  <span class="meta-dot">·</span>
                  <span>{{ fac.planeta || 'TERRA' }}</span>
                  <span class="meta-dot">·</span>
                  <span>Setor #BASE-{{ fac.id }}</span>
                </div>
              </div>
            </div>

            <!-- Tactical Badges -->
            <div class="tactical-badges">
              <span class="badge" [ngClass]="getSigiloToneClass(fac.sigilo)">
                SIGILO: {{ fac.sigilo }}
              </span>
              <span class="badge badge-info">
                TEATRO: {{ fac.planeta || 'TERRA' }}
              </span>
              <span class="badge badge-success">
                ESTADO: 100% OPERACIONAL
              </span>
            </div>
          </div>

          <!-- Segmented Navigation Controls -->
          <div class="segmented-control" role="tablist">
            <button
              type="button"
              role="tab"
              class="seg-btn"
              [class.is-active]="activeTab() === 'detalhes'"
              (click)="activeTab.set('detalhes')"
            >
              <span class="material-symbols-outlined">info</span>
              <span>Estrutura & Posição</span>
            </button>
            <button
              type="button"
              role="tab"
              class="seg-btn"
              [class.is-active]="activeTab() === 'acessos'"
              (click)="activeTab.set('acessos')"
            >
              <span class="material-symbols-outlined">lock_person</span>
              <span>Níveis de Acesso & Credenciais</span>
              @if (accessList().length > 0) {
                <span class="tab-badge">{{ accessList().length }}</span>
              }
            </button>
            <button
              type="button"
              role="tab"
              class="seg-btn"
              [class.is-active]="activeTab() === 'defesa'"
              (click)="activeTab.set('defesa')"
            >
              <span class="material-symbols-outlined">security</span>
              <span>Defesa & Blindagem</span>
            </button>
          </div>

          <!-- Drawer Body Content -->
          <div class="drawer-body">
            <!-- TAB 1: Estrutura & Posição -->
            @if (activeTab() === 'detalhes') {
              <div class="tab-pane">
                <h3 class="section-title">Parâmetros Estruturais & Geodésicos</h3>

                <div class="property-grid">
                  <div class="property-item">
                    <span class="property-label">
                      <span class="material-symbols-outlined">tag</span>
                      Identificador Tático
                    </span>
                    <span class="property-value font-mono">#BASE-{{ fac.id }}</span>
                  </div>

                  <div class="property-item">
                    <span class="property-label">
                      <span class="material-symbols-outlined">shield</span>
                      Classificação de Sigilo
                    </span>
                    <span class="property-value">
                      <span class="pill-tone" [ngClass]="getSigiloToneClass(fac.sigilo)">
                        {{ fac.sigilo }}
                      </span>
                    </span>
                  </div>

                  <div class="property-item">
                    <span class="property-label">
                      <span class="material-symbols-outlined">category</span>
                      Tipologia de Fortificação
                    </span>
                    <span class="property-value">{{ fac.tipo }}</span>
                  </div>

                  <div class="property-item">
                    <span class="property-label">
                      <span class="material-symbols-outlined">public</span>
                      Corpo Celeste / Planeta
                    </span>
                    <span class="property-value">{{ fac.planeta || 'TERRA' }}</span>
                  </div>

                  <div class="property-item">
                    <span class="property-label">
                      <span class="material-symbols-outlined">my_location</span>
                      Latitude (WGS-84)
                    </span>
                    <span class="property-value font-mono">{{ fac.latitude ?? '0.000000' }}</span>
                  </div>

                  <div class="property-item">
                    <span class="property-label">
                      <span class="material-symbols-outlined">my_location</span>
                      Longitude (WGS-84)
                    </span>
                    <span class="property-value font-mono">{{ fac.longitude ?? '0.000000' }}</span>
                  </div>

                  <div class="property-item span-full">
                    <span class="property-label">
                      <span class="material-symbols-outlined">radar</span>
                      Telemetria Geodésica & Escudo Defensivo
                    </span>
                    <div class="geodesic-box">
                      <div class="geo-status-row">
                        <span class="geo-status-indicator pulse-green"></span>
                        <span class="geo-status-title">Escudo Defensivo e Transponder Ativos</span>
                      </div>
                      <p class="geo-text">
                        A instalação {{ fac.nome }} mantém rede de isolamento quântico e camuflagem
                        sub-harmônica operando em níveis nominais. Conexão direta com a malha S.H.I.E.L.D.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- TAB 2: Níveis de Acesso & Credenciais -->
            @if (activeTab() === 'acessos') {
              <div class="tab-pane">
                <div class="pane-header-row">
                  <h3 class="section-title">Credenciais de Acesso Autorizadas</h3>
                  <span class="header-count">{{ accessList().length }} Operadores Habilitados</span>
                </div>

                @if (loadingAccess()) {
                  <div class="loading-state">
                    <span class="material-symbols-outlined spin">progress_activity</span>
                    <span>Consultando permissões na matriz de controle de acesso...</span>
                  </div>
                } @else if (accessList().length > 0) {
                  <div class="access-items-list">
                    @for (item of accessList(); track item.id) {
                      <div class="access-item-card">
                        <div class="access-icon-box">
                          <span class="material-symbols-outlined">person_check</span>
                        </div>
                        <div class="access-details">
                          <div class="access-operator-name">{{ item.funcionarioNome || 'Agente Registrado' }}</div>
                          <div class="access-sub">
                            <span>ID #{{ item.funcionarioId }}</span>
                            <span class="meta-dot">·</span>
                            <span>Registro #AC-{{ item.id }}</span>
                          </div>
                        </div>
                        <div class="access-badges">
                          <span class="pill-access-level" [ngClass]="getAccessLevelClass(item.nivelAcesso)">
                            {{ item.nivelAcesso }}
                          </span>
                          @if (item.ativo) {
                            <span class="status-pill status-active">ATIVO</span>
                          } @else {
                            <span class="status-pill status-revoked">REVOGADO</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-state">
                    <span class="material-symbols-outlined">lock</span>
                    <p>Nenhuma credencial de acesso individual encontrada para esta base operacional.</p>
                  </div>
                }
              </div>
            }

            <!-- TAB 3: Defesa & Blindagem -->
            @if (activeTab() === 'defesa') {
              <div class="tab-pane">
                <h3 class="section-title">Protocolos Defensivos & Resposta de Segurança</h3>

                <div class="timeline-container">
                  <div class="timeline-node">
                    <div class="timeline-marker marker-green"></div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="timeline-step">Nível Verde · Monitoramento Perimetral</span>
                        <span class="timeline-badge badge-success">CONTÍNUO</span>
                      </div>
                      <p class="timeline-text">
                        Varredura por satélites e sensores sísmicos em um raio de 50km ao redor de {{ fac.nome }}.
                        Identificação de assinaturas térmicas e drones não autorizados.
                      </p>
                    </div>
                  </div>

                  <div class="timeline-node">
                    <div class="timeline-marker marker-blue"></div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="timeline-step">Nível Azul · Blindagem Cinética & Campo de Força</span>
                        <span class="timeline-badge badge-info">AUTOMÁTICO</span>
                      </div>
                      <p class="timeline-text">
                        Em caso de disparo de alarme, geradores de escudo energético ativam cúpula de contenção
                        projetada para repelir projéteis pesados e rajadas de energia de classe Ômega.
                      </p>
                    </div>
                  </div>

                  <div class="timeline-node">
                    <div class="timeline-marker marker-red"></div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="timeline-step">Nível Vermelho · Protocolo DEFCON 1 & Purga</span>
                        <span class="timeline-badge badge-danger">CONTINGÊNCIA</span>
                      </div>
                      <p class="timeline-text">
                        Isolamento hermético total dos silos internos, criptografia imediata de servidores
                        e evacuação prioritária de pessoal civil e cientistas para rotas de escape subterrâneas.
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
      background: color-mix(in oklab, var(--primary) 14%, transparent);
      color: var(--primary);
      border: 1px solid color-mix(in oklab, var(--primary) 32%, transparent);
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

    .facility-badge-icon {
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

    .facility-title {
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

    .badge-success {
      background: color-mix(in oklab, var(--ready) 15%, transparent);
      color: var(--ready);
      border-color: color-mix(in oklab, var(--ready) 35%, transparent);
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

    .pane-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .header-count {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary);
      background: color-mix(in oklab, var(--primary) 12%, transparent);
      padding: 3px 8px;
      border-radius: 6px;
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

    .geodesic-box {
      background: color-mix(in oklab, var(--muted) 60%, var(--card));
      padding: 14px;
      border-radius: 10px;
      border: 1px solid var(--border);
    }

    .geo-status-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .geo-status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .pulse-green {
      background: var(--ready);
      box-shadow: 0 0 8px color-mix(in oklab, var(--ready) 50%, transparent);
    }

    .geo-status-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--ready);
    }

    .geo-text {
      margin: 0;
      font-size: 0.82rem;
      color: var(--muted-foreground);
      line-height: 1.45;
    }

    /* Access Tab Cards */
    .access-items-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .access-item-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: 12px;
      background: color-mix(in oklab, var(--card) 85%, transparent);
      border: 1px solid var(--border);
      transition: all 0.15s ease;

      &:hover {
        background: color-mix(in oklab, var(--card) 95%, transparent);
        border-color: color-mix(in oklab, var(--border) 150%, transparent);
      }
    }

    .access-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in oklab, var(--primary) 12%, transparent);
      color: var(--primary);
      border: 1px solid color-mix(in oklab, var(--primary) 25%, transparent);
      span { font-size: 22px; }
    }

    .access-details {
      flex: 1;
    }

    .access-operator-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--foreground);
    }

    .access-sub {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--muted-foreground);
      margin-top: 2px;
    }

    .access-badges {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pill-access-level {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .level-comando {
      background: color-mix(in oklab, var(--alert) 15%, transparent);
      color: var(--alert);
      border: 1px solid color-mix(in oklab, var(--alert) 35%, transparent);
    }

    .level-alpha {
      background: color-mix(in oklab, var(--warning) 15%, transparent);
      color: var(--warning);
      border: 1px solid color-mix(in oklab, var(--warning) 35%, transparent);
    }

    .level-standard {
      background: color-mix(in oklab, var(--primary) 15%, transparent);
      color: var(--primary);
      border: 1px solid color-mix(in oklab, var(--primary) 35%, transparent);
    }

    .status-pill {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .status-active {
      background: color-mix(in oklab, var(--ready) 15%, transparent);
      color: var(--ready);
    }

    .status-revoked {
      background: color-mix(in oklab, var(--alert) 15%, transparent);
      color: var(--alert);
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

    .marker-green { background: var(--ready); box-shadow: 0 0 10px color-mix(in oklab, var(--ready) 50%, transparent); }
    .marker-blue { background: var(--primary); box-shadow: 0 0 10px color-mix(in oklab, var(--primary) 50%, transparent); }
    .marker-red { background: var(--alert); box-shadow: 0 0 10px color-mix(in oklab, var(--alert) 50%, transparent); }

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
export class BaseFacilityDrawerComponent implements OnDestroy {
  readonly facility = input<BaseFacilityProfile | null>(null);
  readonly closeDrawer = output<void>();

  protected readonly activeTab = signal<FacilityTabId>('detalhes');
  protected readonly loadingAccess = signal<boolean>(false);
  protected readonly accessList = signal<BaseAccessItem[]>([]);

  private readonly http = inject(HttpClient);
  private sub: Subscription | null = null;

  constructor() {
    effect(() => {
      const fac = this.facility();
      if (fac) {
        this.loadBaseAccesses(fac.id);
      } else {
        this.accessList.set([]);
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

  protected getSigiloToneClass(sigilo?: string): string {
    const s = sigilo?.toUpperCase();
    if (s === 'ULTRA_SECRETO') return 'badge-danger';
    if (s === 'SECRETO') return 'badge-warning';
    if (s === 'CONFIDENCIAL') return 'badge-info';
    return 'badge-neutral';
  }

  protected getAccessLevelClass(level?: string): string {
    const l = level?.toUpperCase();
    if (l === 'COMANDO') return 'level-comando';
    if (l === 'ALPHA') return 'level-alpha';
    return 'level-standard';
  }

  protected getFacilityIcon(tipo?: string): string {
    const t = tipo?.toUpperCase();
    if (t === 'BUNKER') return 'shield';
    if (t === 'TORRE') return 'apartment';
    if (t === 'ESTACAO_ESPACIAL') return 'satellite_alt';
    if (t === 'FORTALEZA') return 'castle';
    if (t === 'TEMPLO') return 'temple_buddhist';
    return 'hub';
  }

  private loadBaseAccesses(baseId: number): void {
    this.loadingAccess.set(true);
    this.sub?.unsubscribe();

    const url = `${PRAXIS_API_BASE_URL}/operations/base-acessos/filter?size=50`;
    this.sub = this.http
      .post<{ data?: { content?: BaseAccessItem[] } }>(url, { baseId })
      .pipe(
        map((resp) => resp?.data?.content || []),
        catchError(() => [[]]),
      )
      .subscribe((list) => {
        this.accessList.set(list);
        this.loadingAccess.set(false);
      });
  }
}
