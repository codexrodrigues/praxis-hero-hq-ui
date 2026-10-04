import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
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

@Component({
  selector: 'app-mission-briefing-drawer',
  standalone: true,
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (mission) {
      <div class="drawer-overlay" (click)="close.emit()">
        <aside class="drawer-content" (click)="$event.stopPropagation()">
          <!-- Header -->
          <header class="drawer-header">
            <div class="mission-header-info">
              <div class="badge-line">
                <span class="priority-pill" [attr.data-priority]="mission.prioridade">
                  PRIORIDADE: {{ mission.prioridade }}
                </span>
                <span class="status-pill" [attr.data-status]="mission.status">
                  {{ mission.status }}
                </span>
              </div>
              <h2 class="title-gradient mission-title">{{ mission.titulo }}</h2>
              <p class="mission-theater">
                <span class="material-symbols-outlined">explore</span>
                Teatro: {{ mission.localizacao }}
              </p>
            </div>

            <button class="close-icon-btn" (click)="close.emit()" aria-label="Fechar Briefing">
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>

          <!-- Nav Tabs -->
          <nav class="drawer-tabs">
            <button
              [class.active]="activeTab() === 'briefing'"
              (click)="selectTab('briefing')"
            >
              <span class="material-symbols-outlined">description</span>
              Briefing
            </button>
            <button
              [class.active]="activeTab() === 'squad'"
              (click)="selectTab('squad')"
            >
              <span class="material-symbols-outlined">groups</span>
              Operadores ({{ participants().length }})
            </button>
            <button
              [class.active]="activeTab() === 'incidents'"
              (click)="selectTab('incidents')"
            >
              <span class="material-symbols-outlined">siren</span>
              Sinistros ({{ incidents().length }})
            </button>
          </nav>

          <!-- Body -->
          <div class="drawer-body">
            <!-- TAB 1: BRIEFING TÁTICO -->
            @if (activeTab() === 'briefing') {
              <div class="tab-panel">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Identificador da Missão</span>
                    <span class="info-value">#MIS-{{ mission.id }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Teatro Operacional</span>
                    <span class="info-value">{{ mission.localizacao }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Janela de Início</span>
                    <span class="info-value">
                      {{ (mission.dataInicioPrevista | date: 'dd/MM/yyyy HH:mm') || 'Imediato' }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Janela de Conclusão</span>
                    <span class="info-value">
                      {{ (mission.dataFimPrevista | date: 'dd/MM/yyyy HH:mm') || 'Sob demanda' }}
                    </span>
                  </div>
                </div>

                <div class="description-card glass-panel">
                  <h3>Objetivo Estratégico & Diretrizes</h3>
                  <p>
                    {{ mission.descricao || 'Operação tática autorizada pelo Comando Central. Todas as unidades devem manter silêncio de rádio subespacial e resguardar prioritariamente a integridade das zonas residenciais civis.' }}
                  </p>
                </div>

                <div class="protocols-card glass-panel">
                  <h3>Protocolos de Engajamento Ativos</h3>
                  <ul class="protocol-list">
                    <li>
                      <span class="material-symbols-outlined tone-ready">verified</span>
                      <span><strong>Protocolo Alpha-9:</strong> Emprego de força proporcional com mitigação de danos colaterais.</span>
                    </li>
                    <li>
                      <span class="material-symbols-outlined tone-warning">cell_tower</span>
                      <span><strong>Telemetria Criptografada:</strong> Transmissão de biometria e prontidão em tempo real ao HQ.</span>
                    </li>
                    <li>
                      <span class="material-symbols-outlined tone-operations">local_hospital</span>
                      <span><strong>Evacuação de Suporte:</strong> Ponto de extração médica definido para o complexo central.</span>
                    </li>
                  </ul>
                </div>
              </div>
            }

            <!-- TAB 2: OPERADORES & SQUAD -->
            @if (activeTab() === 'squad') {
              <div class="tab-panel">
                @if (isLoadingTab()) {
                  <div class="tab-loader">
                    <span class="material-symbols-outlined spin">sync</span>
                    <span>Localizando operadores designados na API...</span>
                  </div>
                } @else if (participants().length > 0) {
                  <div class="participants-list">
                    @for (p of participants(); track p.id) {
                      <div class="participant-item glass-panel">
                        <div class="avatar-wrap primary-gradient">
                          @if (p.funcionarioFotoUrl) {
                            <img [src]="p.funcionarioFotoUrl" [alt]="p.funcionarioNome" />
                          } @else {
                            <span>{{ getInitials(p.funcionarioNome) }}</span>
                          }
                        </div>
                        <div class="participant-info">
                          <h4>{{ p.funcionarioNome }}</h4>
                          <p>
                            Função: <strong>{{ p.papel }}</strong> · Ordem de inserção: #{{ p.ordem || 1 }}
                          </p>
                        </div>
                        <span class="tag-role" [attr.data-role]="p.papel">{{ p.papel }}</span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-state glass-panel">
                    <span class="material-symbols-outlined">person_search</span>
                    <p>Nenhum operador alocado diretamente nesta missão.</p>
                  </div>
                }
              </div>
            }

            <!-- TAB 3: SINISTROS & INCIDENTES -->
            @if (activeTab() === 'incidents') {
              <div class="tab-panel">
                @if (isLoadingTab()) {
                  <div class="tab-loader">
                    <span class="material-symbols-outlined spin">sync</span>
                    <span>Consultando relatórios de sinistros da missão...</span>
                  </div>
                } @else if (incidents().length > 0) {
                  <div class="incidents-list">
                    @for (inc of incidents(); track inc.id) {
                      <div class="incident-item glass-panel">
                        <span class="material-symbols-outlined inc-icon tone-risk">siren</span>
                        <div class="inc-info">
                          <h4>{{ inc.descricao }}</h4>
                          <p>Local: {{ inc.local }} · Severidade: {{ inc.severidade }}</p>
                          @if (inc.danosCivis) {
                            <small>Prejuízo estimado: R$ {{ inc.danosCivis | number: '1.2-2' }}</small>
                          }
                        </div>
                        <span class="tag-sev" [attr.data-sev]="inc.severidade">{{ inc.severidade }}</span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-state glass-panel">
                    <span class="material-symbols-outlined tone-ready">task_alt</span>
                    <p>Nenhum sinistro ou incidente registrado durante esta operação.</p>
                  </div>
                }
              </div>
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

    .drawer-header {
      padding: 24px 28px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      background: color-mix(in oklab, var(--card) 60%, transparent);
    }

    .badge-line {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
    }

    .priority-pill {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      background: color-mix(in oklab, var(--operations) 14%, transparent);
      color: var(--operations);

      &[data-priority="ALTA"], &[data-priority="CRITICA"], &[data-priority="OMEGA"] {
        background: color-mix(in oklab, var(--destructive) 15%, transparent);
        color: var(--destructive);
      }
    }

    .status-pill {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      background: color-mix(in oklab, var(--ready) 14%, transparent);
      color: var(--ready);
    }

    .mission-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 700;
    }

    .mission-theater {
      margin: 4px 0 0;
      font-size: 0.82rem;
      color: var(--muted-foreground);
      display: flex;
      align-items: center;
      gap: 4px;
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
      &:hover {
        background: var(--accent);
        color: var(--foreground);
      }
    }

    .drawer-tabs {
      display: flex;
      gap: 6px;
      padding: 12px 28px;
      border-bottom: 1px solid var(--border);
      background: color-mix(in oklab, var(--muted) 30%, transparent);

      button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 36px;
        padding: 0 14px;
        border-radius: 10px;
        border: none;
        background: transparent;
        color: var(--muted-foreground);
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        span { font-size: 16px; }

        &:hover {
          color: var(--foreground);
          background: var(--accent);
        }

        &.active {
          color: var(--operations);
          background: color-mix(in oklab, var(--operations) 14%, transparent);
          box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--operations) 30%, transparent);
        }
      }
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 28px;
    }

    .tab-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }

    .info-item {
      padding: 14px;
      border-radius: 12px;
      background: color-mix(in oklab, var(--muted) 40%, transparent);
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted-foreground);
    }

    .info-value {
      font-size: 0.85rem;
      font-weight: 600;
    }

    .description-card, .protocols-card {
      padding: 20px;
      border-radius: 16px;
      h3 {
        margin: 0 0 12px;
        font-family: var(--font-display);
        font-size: 0.95rem;
        font-weight: 700;
      }
      p {
        margin: 0;
        font-size: 0.85rem;
        line-height: 1.6;
        color: var(--muted-foreground);
      }
    }

    .protocol-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;

      li {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        font-size: 0.82rem;
        line-height: 1.5;
        span.material-symbols-outlined { font-size: 18px; margin-top: 1px; }
      }
    }

    .tone-ready { color: var(--ready); }
    .tone-warning { color: var(--warning); }
    .tone-operations { color: var(--operations); }
    .tone-risk { color: var(--risk); }

    /* Participants */
    .participants-list, .incidents-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .participant-item, .incident-item {
      padding: 14px 18px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .avatar-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .participant-info, .inc-info {
      flex: 1;
      h4 { margin: 0 0 2px; font-size: 0.88rem; font-weight: 700; }
      p { margin: 0; font-size: 0.75rem; color: var(--muted-foreground); }
      small { display: block; margin-top: 2px; font-size: 0.7rem; color: var(--muted-foreground); }
    }

    .tag-role, .tag-sev {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 9999px;
      background: color-mix(in oklab, var(--operations) 14%, transparent);
      color: var(--operations);

      &[data-role="LIDER"] {
        background: color-mix(in oklab, var(--primary) 14%, transparent);
        color: var(--primary);
      }
      &[data-role="COMBATE"] {
        background: color-mix(in oklab, var(--destructive) 14%, transparent);
        color: var(--destructive);
      }
      &[data-sev="CRITICA"], &[data-sev="ALTA"] {
        background: color-mix(in oklab, var(--destructive) 14%, transparent);
        color: var(--destructive);
      }
    }

    .inc-icon {
      font-size: 24px;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in oklab, var(--risk) 14%, transparent);
      flex-shrink: 0;
    }

    .tab-loader, .empty-state {
      padding: 32px;
      border-radius: 14px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--muted-foreground);
      span { font-size: 28px; }
      p { margin: 0; font-size: 0.85rem; }
    }

    .spin { animation: spin 1s linear infinite; }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  `],
})
export class MissionBriefingDrawerComponent implements OnChanges {
  @Input() mission: MissionProfile | null = null;
  @Output() close = new EventEmitter<void>();

  protected readonly activeTab = signal<'briefing' | 'squad' | 'incidents'>('briefing');
  protected readonly isLoadingTab = signal(false);
  protected readonly participants = signal<MissionParticipant[]>([]);
  protected readonly incidents = signal<IncidentRecord[]>([]);

  private readonly http = inject(HttpClient);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mission'] && this.mission) {
      this.refreshTab(this.activeTab());
    }
  }

  protected selectTab(tab: 'briefing' | 'squad' | 'incidents'): void {
    this.activeTab.set(tab);
    this.refreshTab(tab);
  }

  private refreshTab(tab: string): void {
    if (!this.mission?.id) return;
    if (tab === 'squad') {
      this.fetchSquad(this.mission.id);
    } else if (tab === 'incidents') {
      this.fetchIncidents(this.mission.id);
    }
  }

  private fetchSquad(missionId: number): void {
    this.isLoadingTab.set(true);
    this.http
      .post<{ data?: { content?: MissionParticipant[] } }>(
        `${PRAXIS_API_BASE_URL}/operations/missao-participantes/filter`,
        { missaoId: missionId }
      )
      .subscribe({
        next: (res) => {
          this.participants.set(res.data?.content || []);
          this.isLoadingTab.set(false);
        },
        error: () => {
          this.participants.set([]);
          this.isLoadingTab.set(false);
        },
      });
  }

  private fetchIncidents(missionId: number): void {
    this.isLoadingTab.set(true);
    this.http
      .post<{ data?: { content?: IncidentRecord[] } }>(
        `${PRAXIS_API_BASE_URL}/operations/incidentes/filter`,
        { missaoId: missionId }
      )
      .subscribe({
        next: (res) => {
          this.incidents.set(res.data?.content || []);
          this.isLoadingTab.set(false);
        },
        error: () => {
          this.incidents.set([]);
          this.isLoadingTab.set(false);
        },
      });
  }

  protected getInitials(name: string): string {
    if (!name) return 'OP';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
