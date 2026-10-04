import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
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

@Component({
  selector: 'app-hero-dossier-drawer',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hero) {
      <div class="drawer-overlay" (click)="close.emit()">
        <aside class="drawer-content" (click)="$event.stopPropagation()">
          <!-- Drawer Header -->
          <header class="drawer-header">
            <div class="hero-id-card">
              <div class="avatar-box primary-gradient">
                @if (hero.fotoPerfilUrl || hero.avatarUrl) {
                  <img
                    [src]="hero.fotoPerfilUrl || hero.avatarUrl"
                    [alt]="hero.nomeCompleto"
                    class="avatar-img"
                  />
                } @else {
                  <span>{{ getInitials(hero.nomeCompleto) }}</span>
                }
                <span class="status-indicator" [class.active]="hero.ativo"></span>
              </div>
              <div class="hero-titles">
                <div class="badge-line">
                  <span class="universo-pill">{{ hero.universo || 'Terra-616' }}</span>
                  <span class="status-pill" [class.active]="hero.ativo">
                    {{ hero.ativo ? 'Em Prontidão' : 'Inativo / Reserva' }}
                  </span>
                </div>
                <h2 class="title-gradient hero-name">{{ hero.nomeCompleto }}</h2>
                <p class="hero-alias">{{ hero.codinome || hero.nomeCompleto }} · {{ hero.cargoNome }}</p>
              </div>
            </div>

            <div class="header-controls">
              <button
                class="action-btn"
                [class.btn-danger]="hero.ativo"
                [class.btn-success]="!hero.ativo"
                [disabled]="isTransitioning()"
                (click)="toggleStatus.emit(hero)"
              >
                <span class="material-symbols-outlined">
                  {{ isTransitioning() ? 'sync' : hero.ativo ? 'person_off' : 'verified_user' }}
                </span>
                {{ isTransitioning() ? 'Processando...' : hero.ativo ? 'Mover para Reserva' : 'Reativar no Quadro' }}
              </button>
              <button class="close-icon-btn" (click)="close.emit()" aria-label="Fechar Dossiê">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </header>

          <!-- Tab Navigation -->
          <nav class="dossier-tabs">
            <button
              [class.active]="activeTab() === 'identity'"
              (click)="selectTab('identity')"
            >
              <span class="material-symbols-outlined">badge</span>
              Identidade
            </button>
            <button
              [class.active]="activeTab() === 'skills'"
              (click)="selectTab('skills')"
            >
              <span class="material-symbols-outlined">bolt</span>
              Competências
            </button>
            <button
              [class.active]="activeTab() === 'payroll'"
              (click)="selectTab('payroll')"
            >
              <span class="material-symbols-outlined">payments</span>
              Folha
            </button>
            <button
              [class.active]="activeTab() === 'missions'"
              (click)="selectTab('missions')"
            >
              <span class="material-symbols-outlined">military_tech</span>
              Missões
            </button>
            <button
              [class.active]="activeTab() === 'assets'"
              (click)="selectTab('assets')"
            >
              <span class="material-symbols-outlined">inventory_2</span>
              Ativos
            </button>
          </nav>

          <!-- Tab Panels -->
          <div class="dossier-body">
            <!-- TAB 1: IDENTIDADE -->
            @if (activeTab() === 'identity') {
              <div class="tab-panel">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">CPF Mascarado (LGPD)</span>
                    <span class="info-value">{{ hero.cpf || '***.***.001-75' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Departamento</span>
                    <span class="info-value">{{ hero.departamentoNome }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Cargo / Posto</span>
                    <span class="info-value">{{ hero.cargoNome }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Data de Admissão</span>
                    <span class="info-value">{{ hero.dataAdmissao || '01/01/2020' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Canal Seguro / E-mail</span>
                    <span class="info-value">{{ hero.email || 'confidencial@praxis.org' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Telefone Tático</span>
                    <span class="info-value">{{ hero.telefone || '+55 (11) 98888-0000' }}</span>
                  </div>
                </div>

                <div class="scores-card glass-panel">
                  <h3>Avaliação Reputacional 360°</h3>
                  <div class="score-bars">
                    <div>
                      <div class="score-header">
                        <span>Aprovação Pública</span>
                        <span class="score-val text-primary">{{ hero.scorePublico || 94 }}%</span>
                      </div>
                      <div class="progress-bar">
                        <div class="progress-fill fill-primary" [style.width.%]="hero.scorePublico || 94"></div>
                      </div>
                    </div>
                    <div>
                      <div class="score-header">
                        <span>Confiança Governamental</span>
                        <span class="score-val text-ready">{{ hero.scoreGovernamental || 88 }}%</span>
                      </div>
                      <div class="progress-bar">
                        <div class="progress-fill fill-ready" [style.width.%]="hero.scoreGovernamental || 88"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- TAB 2: COMPETÊNCIAS -->
            @if (activeTab() === 'skills') {
              <div class="tab-panel">
                <div class="skills-list">
                  <div class="skill-item glass-panel">
                    <div class="skill-top">
                      <span class="skill-name">Combate Avançado & Resposta Tática</span>
                      <span class="skill-origin origin-training">TREINAMENTO</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill fill-training" style="width: 95%"></div>
                    </div>
                    <span class="skill-pct">Proficiência: 95%</span>
                  </div>

                  <div class="skill-item glass-panel">
                    <div class="skill-top">
                      <span class="skill-name">Engenharia de Campo & Suporte Quântico</span>
                      <span class="skill-origin origin-tech">TECNOLOGIA</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill fill-tech" style="width: 92%"></div>
                    </div>
                    <span class="skill-pct">Proficiência: 92%</span>
                  </div>

                  <div class="skill-item glass-panel">
                    <div class="skill-top">
                      <span class="skill-name">Liderança Operacional & Coordenação de Crise</span>
                      <span class="skill-origin origin-natural">HABILIDADE</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill fill-natural" style="width: 98%"></div>
                    </div>
                    <span class="skill-pct">Proficiência: 98%</span>
                  </div>
                </div>
              </div>
            }

            <!-- TAB 3: FOLHA (DADOS REAIS DA API) -->
            @if (activeTab() === 'payroll') {
              <div class="tab-panel">
                @if (isLoadingTab()) {
                  <div class="tab-loader">
                    <span class="material-symbols-outlined spin">sync</span>
                    <span>Carregando histórico financeiro da API...</span>
                  </div>
                } @else if (payrollCycles().length > 0) {
                  <div class="cycles-list">
                    @for (cycle of payrollCycles(); track cycle.id) {
                      <div class="cycle-item glass-panel">
                        <span class="material-symbols-outlined cycle-icon tone-rh">payments</span>
                        <div class="cycle-info">
                          <h4>Competência {{ cycle.mes }}/{{ cycle.ano }}</h4>
                          <p>
                            Bruto: {{ cycle.salarioBruto | currency: 'BRL' }} ·
                            Líquido: {{ cycle.salarioLiquido | currency: 'BRL' }} ·
                            Descontos: {{ cycle.totalDescontos | currency: 'BRL' }}
                          </p>
                          <small>Pagamento: {{ cycle.dataPagamento | date: 'dd/MM/yyyy' }}</small>
                        </div>
                        <span class="tag-status status-paga">CONSOLIDADA</span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-tab-state glass-panel">
                    <span class="material-symbols-outlined">receipt_long</span>
                    <p>Nenhum lançamento de folha encontrado para este colaborador.</p>
                  </div>
                }
              </div>
            }

            <!-- TAB 4: MISSÕES (DADOS REAIS DA API) -->
            @if (activeTab() === 'missions') {
              <div class="tab-panel">
                @if (isLoadingTab()) {
                  <div class="tab-loader">
                    <span class="material-symbols-outlined spin">sync</span>
                    <span>Carregando histórico de missões...</span>
                  </div>
                } @else if (missions().length > 0) {
                  <div class="missions-list">
                    @for (mission of missions(); track mission.id) {
                      <div class="mission-item glass-panel">
                        <span class="material-symbols-outlined mission-icon tone-operations">military_tech</span>
                        <div class="mission-info">
                          <h4>{{ mission.missaoTitulo }}</h4>
                          <p>
                            Papel: <strong>{{ mission.papel }}</strong> ·
                            {{ mission.principal ? 'Participação Primária' : 'Força de Apoio' }}
                          </p>
                        </div>
                        <span
                          class="tag-status"
                          [class.status-sucesso]="mission.resultado === 'OK'"
                          [class.status-andamento]="mission.resultado !== 'OK'"
                        >
                          {{ mission.resultado === 'OK' ? 'CONCLUÍDA' : 'EM ANDAMENTO' }}
                        </span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-tab-state glass-panel">
                    <span class="material-symbols-outlined">flag</span>
                    <p>Nenhuma missão registrada para este herói até o momento.</p>
                  </div>
                }
              </div>
            }

            <!-- TAB 5: ATIVOS (DADOS REAIS DA API) -->
            @if (activeTab() === 'assets') {
              <div class="tab-panel">
                @if (isLoadingTab()) {
                  <div class="tab-loader">
                    <span class="material-symbols-outlined spin">sync</span>
                    <span>Consultando ativos em custódia...</span>
                  </div>
                } @else if (assets().length > 0) {
                  <div class="assets-list">
                    @for (asset of assets(); track asset.id) {
                      <div class="asset-item glass-panel">
                        <span class="material-symbols-outlined asset-icon tone-assets">inventory_2</span>
                        <div class="asset-info">
                          <h4>{{ asset.nome }}</h4>
                          <p>Tipo: {{ asset.tipo }} · Resistência: {{ asset.resistencia || 8 }}/10</p>
                        </div>
                        <span class="tag-status status-programada">{{ asset.status }}</span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-tab-state glass-panel">
                    <span class="material-symbols-outlined">shield_moon</span>
                    <p>Nenhum equipamento vinculado à custódia deste herói.</p>
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

    .hero-id-card {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .avatar-box {
      width: 58px;
      height: 58px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 700;
      position: relative;
      flex-shrink: 0;
      overflow: hidden;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .status-indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--warning);
      border: 2px solid var(--background);

      &.active {
        background: var(--ready);
      }
    }

    .badge-line {
      display: flex;
      gap: 8px;
      margin-bottom: 4px;
    }

    .universo-pill {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 9999px;
      background: color-mix(in oklab, var(--primary) 14%, transparent);
      color: var(--primary);
    }

    .status-pill {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 9999px;
      background: color-mix(in oklab, var(--warning) 14%, transparent);
      color: var(--warning);

      &.active {
        background: color-mix(in oklab, var(--ready) 14%, transparent);
        color: var(--ready);
      }
    }

    .hero-name {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 700;
    }

    .hero-alias {
      margin: 2px 0 0;
      font-size: 0.8rem;
      color: var(--muted-foreground);
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 14px;
      border-radius: 10px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;

      span { font-size: 16px; }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-danger {
      background: color-mix(in oklab, var(--destructive) 15%, transparent);
      color: var(--destructive);
      border: 1px solid color-mix(in oklab, var(--destructive) 30%, transparent);

      &:hover:not(:disabled) {
        background: var(--destructive);
        color: #fff;
      }
    }

    .btn-success {
      background: color-mix(in oklab, var(--ready) 15%, transparent);
      color: var(--ready);
      border: 1px solid color-mix(in oklab, var(--ready) 30%, transparent);

      &:hover:not(:disabled) {
        background: var(--ready);
        color: #fff;
      }
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

    .dossier-tabs {
      display: flex;
      gap: 6px;
      padding: 12px 28px;
      border-bottom: 1px solid var(--border);
      background: color-mix(in oklab, var(--muted) 30%, transparent);
      overflow-x: auto;

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
          color: var(--primary);
          background: color-mix(in oklab, var(--primary) 14%, transparent);
          box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--primary) 30%, transparent);
        }
      }
    }

    .dossier-body {
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
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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

    .scores-card {
      padding: 20px;
      border-radius: 16px;

      h3 {
        margin: 0 0 16px;
        font-family: var(--font-display);
        font-size: 0.95rem;
        font-weight: 700;
      }
    }

    .score-bars {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .score-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--muted-foreground);
      margin-bottom: 6px;
    }

    .score-val {
      font-family: var(--font-mono);
    }

    .progress-bar {
      height: 6px;
      border-radius: 9999px;
      background: var(--muted);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 9999px;
    }

    .fill-primary { background: var(--primary); }
    .fill-ready { background: var(--ready); }
    .fill-tech { background: #38bdf8; }
    .fill-natural { background: #10b981; }
    .fill-training { background: #f59e0b; }

    .skills-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skill-item {
      padding: 16px;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .skill-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .skill-name {
      font-size: 0.88rem;
      font-weight: 600;
    }

    .skill-origin {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 6px;
    }

    .origin-tech { color: #38bdf8; background: color-mix(in oklab, #38bdf8 15%, transparent); }
    .origin-natural { color: #10b981; background: color-mix(in oklab, #10b981 15%, transparent); }
    .origin-training { color: #f59e0b; background: color-mix(in oklab, #f59e0b 15%, transparent); }

    .skill-pct {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--muted-foreground);
      text-align: right;
    }

    .cycles-list, .missions-list, .assets-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cycle-item, .mission-item, .asset-item {
      padding: 16px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .cycle-icon, .mission-icon, .asset-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .tone-rh { color: var(--rh); background: color-mix(in oklab, var(--rh) 14%, transparent); }
    .tone-ready { color: var(--ready); background: color-mix(in oklab, var(--ready) 14%, transparent); }
    .tone-operations { color: var(--operations); background: color-mix(in oklab, var(--operations) 14%, transparent); }
    .tone-warning { color: var(--warning); background: color-mix(in oklab, var(--warning) 14%, transparent); }
    .tone-assets { color: var(--assets); background: color-mix(in oklab, var(--assets) 14%, transparent); }

    .cycle-info, .mission-info, .asset-info {
      flex: 1;

      h4 {
        margin: 0 0 2px;
        font-size: 0.88rem;
        font-weight: 700;
      }

      p {
        margin: 0;
        font-size: 0.75rem;
        color: var(--muted-foreground);
      }

      small {
        display: block;
        margin-top: 4px;
        font-size: 0.7rem;
        color: var(--muted-foreground);
      }
    }

    .tag-status {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 9999px;
    }

    .status-programada { color: var(--primary); background: color-mix(in oklab, var(--primary) 14%, transparent); }
    .status-paga { color: var(--ready); background: color-mix(in oklab, var(--ready) 14%, transparent); }
    .status-sucesso { color: var(--ready); background: color-mix(in oklab, var(--ready) 14%, transparent); }
    .status-andamento { color: var(--warning); background: color-mix(in oklab, var(--warning) 14%, transparent); }

    .tab-loader {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 30px;
      justify-content: center;
      color: var(--muted-foreground);
      font-size: 0.85rem;

      span.spin {
        animation: spin 1s linear infinite;
        font-size: 20px;
      }
    }

    .empty-tab-state {
      padding: 32px;
      border-radius: 14px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--muted-foreground);

      span {
        font-size: 32px;
        opacity: 0.6;
      }

      p {
        margin: 0;
        font-size: 0.85rem;
      }
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
export class HeroDossierDrawerComponent implements OnChanges {
  @Input() hero: HeroProfile | null = null;
  @Input() isTransitioning = signal(false);
  @Output() close = new EventEmitter<void>();
  @Output() toggleStatus = new EventEmitter<HeroProfile>();

  protected readonly activeTab = signal<'identity' | 'skills' | 'payroll' | 'missions' | 'assets'>('identity');
  protected readonly isLoadingTab = signal(false);
  protected readonly payrollCycles = signal<PayrollRecord[]>([]);
  protected readonly missions = signal<MissionParticipantRecord[]>([]);
  protected readonly assets = signal<EquipmentRecord[]>([]);

  private readonly http = inject(HttpClient);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hero'] && this.hero) {
      this.refreshTab(this.activeTab());
    }
  }

  protected selectTab(tab: 'identity' | 'skills' | 'payroll' | 'missions' | 'assets'): void {
    this.activeTab.set(tab);
    this.refreshTab(tab);
  }

  private refreshTab(tab: string): void {
    if (!this.hero?.id) return;

    if (tab === 'payroll') {
      this.fetchPayroll(this.hero.id);
    } else if (tab === 'missions') {
      this.fetchMissions(this.hero.id);
    } else if (tab === 'assets') {
      this.fetchAssets(this.hero.id);
    }
  }

  private fetchPayroll(heroId: number): void {
    this.isLoadingTab.set(true);
    this.http
      .post<{ data?: { content?: PayrollRecord[] } }>(
        `${PRAXIS_API_BASE_URL}/human-resources/folhas-pagamento/filter`,
        { funcionarioId: heroId }
      )
      .subscribe({
        next: (res) => {
          this.payrollCycles.set(res.data?.content || []);
          this.isLoadingTab.set(false);
        },
        error: () => {
          this.payrollCycles.set([]);
          this.isLoadingTab.set(false);
        },
      });
  }

  private fetchMissions(heroId: number): void {
    this.isLoadingTab.set(true);
    this.http
      .post<{ data?: { content?: MissionParticipantRecord[] } }>(
        `${PRAXIS_API_BASE_URL}/operations/missao-participantes/filter`,
        { funcionarioId: heroId }
      )
      .subscribe({
        next: (res) => {
          this.missions.set(res.data?.content || []);
          this.isLoadingTab.set(false);
        },
        error: () => {
          this.missions.set([]);
          this.isLoadingTab.set(false);
        },
      });
  }

  private fetchAssets(heroId: number): void {
    this.isLoadingTab.set(true);
    this.http
      .post<{ data?: { content?: EquipmentRecord[] } }>(
        `${PRAXIS_API_BASE_URL}/assets/equipamentos/filter`,
        { proprietarioId: heroId }
      )
      .subscribe({
        next: (res) => {
          this.assets.set(res.data?.content || []);
          this.isLoadingTab.set(false);
        },
        error: () => {
          this.assets.set([]);
          this.isLoadingTab.set(false);
        },
      });
  }

  protected getInitials(name: string): string {
    if (!name) return 'H';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
