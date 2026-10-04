import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-container">
      <!-- Executive Banner -->
      <section class="glass-panel hero-banner bg-grid">
        <div class="banner-content">
          <div class="badge-row">
            <span class="status-pill ready-pill">
              <span class="dot"></span>
              Sistemas Táticos Ativos
            </span>
            <span class="status-pill cobalt-pill">
              <span class="material-symbols-outlined">shield</span>
              Praxis Platform 9.0
            </span>
          </div>

          <h1 class="title-gradient hero-title">Centro de Comando & Prontidão</h1>
          <p class="hero-description">
            Visão unificada das operações de heróis, distribuição de equipes, folha salarial e monitoramento contínuo de ameaças globais.
          </p>

          <div class="banner-actions">
            <a routerLink="/rh/funcionarios" class="action-btn primary-gradient">
              <span class="material-symbols-outlined">group</span>
              Gerenciar Heróis & RH
            </a>
            <a routerLink="/operacoes/missoes" class="action-btn outline-btn">
              <span class="material-symbols-outlined">military_tech</span>
              Centro de Missões
            </a>
          </div>
        </div>

        <div class="hero-radar-preview">
          <div class="radar-circle circle-3"></div>
          <div class="radar-circle circle-2"></div>
          <div class="radar-circle circle-1"></div>
          <div class="radar-sweep"></div>
          <div class="radar-center">
            <span class="material-symbols-outlined">radar</span>
          </div>
        </div>
      </section>

      <!-- KPI Bento Grid -->
      <section class="bento-grid">
        <!-- Card 1: Prontidão -->
        <article class="glass-panel bento-card">
          <div class="card-header">
            <div class="card-icon tone-ready">
              <span class="material-symbols-outlined">verified_user</span>
            </div>
            <span class="tag-status ready-tag">Operacional</span>
          </div>
          <p class="card-label">Prontidão da Força</p>
          <p class="card-value">98,4%</p>
          <div class="progress-bar">
            <div class="progress-fill fill-ready" style="width: 98.4%"></div>
          </div>
          <p class="card-footnote">21 heróis em escala ativa imediata</p>
        </article>

        <!-- Card 2: Missões -->
        <article class="glass-panel bento-card">
          <div class="card-header">
            <div class="card-icon tone-operations">
              <span class="material-symbols-outlined">military_tech</span>
            </div>
            <span class="tag-status operations-tag">07 Em Curso</span>
          </div>
          <p class="card-label">Missões Ativas em Campo</p>
          <p class="card-value">14 Agendadas</p>
          <div class="progress-bar">
            <div class="progress-fill fill-operations" style="width: 65%"></div>
          </div>
          <p class="card-footnote">Taxa de sucesso operacional de 96,2%</p>
        </article>

        <!-- Card 3: Folha & Recursos -->
        <article class="glass-panel bento-card">
          <div class="card-header">
            <div class="card-icon tone-rh">
              <span class="material-symbols-outlined">payments</span>
            </div>
            <span class="tag-status rh-tag">Outubro / 2026</span>
          </div>
          <p class="card-label">Execução Orçamentária</p>
          <p class="card-value">R$ 4,85 M</p>
          <div class="progress-bar">
            <div class="progress-fill fill-rh" style="width: 80.8%"></div>
          </div>
          <p class="card-footnote">Folha programada e benefícios especiais</p>
        </article>

        <!-- Card 4: Alertas e Riscos -->
        <article class="glass-panel bento-card">
          <div class="card-header">
            <div class="card-icon tone-risk">
              <span class="material-symbols-outlined">emergency</span>
            </div>
            <span class="tag-status risk-tag">Defcon 5</span>
          </div>
          <p class="card-label">Incidentes Críticos</p>
          <p class="card-value">02 Em Análise</p>
          <div class="progress-bar">
            <div class="progress-fill fill-risk" style="width: 25%"></div>
          </div>
          <p class="card-footnote">Danos colaterais e indenizações contidas</p>
        </article>
      </section>

      <!-- Domain Navigation Hub -->
      <section class="hub-section">
        <h2 class="title-gradient hub-title">Centros de Comando & Especialidades</h2>
        <div class="hub-grid">
          <a routerLink="/rh/funcionarios" class="glass-panel hub-card">
            <div class="hub-icon tone-rh"><span class="material-symbols-outlined">group</span></div>
            <div class="hub-info">
              <h3>Heróis & Colaboradores</h3>
              <p>Cadastros completos, identidades civis, remunerações e histórico funcional.</p>
            </div>
            <span class="material-symbols-outlined arrow">arrow_forward</span>
          </a>

          <a routerLink="/operacoes/missoes" class="glass-panel hub-card">
            <div class="hub-icon tone-operations"><span class="material-symbols-outlined">military_tech</span></div>
            <div class="hub-info">
              <h3>Centro de Missões</h3>
              <p>Despacho tático, formação de squads, diário de bordo e desfechos operacionais.</p>
            </div>
            <span class="material-symbols-outlined arrow">arrow_forward</span>
          </a>

          <a routerLink="/ativos/equipamentos" class="glass-panel hub-card">
            <div class="hub-icon tone-assets"><span class="material-symbols-outlined">inventory_2</span></div>
            <div class="hub-info">
              <h3>Ativos & Armaduras</h3>
              <p>Controle de custódia, manutenção preventiva de trajes e gestão da frota aérea/terrestre.</p>
            </div>
            <span class="material-symbols-outlined arrow">arrow_forward</span>
          </a>

          <a routerLink="/suprimentos/contratos" class="glass-panel hub-card">
            <div class="hub-icon tone-supplies"><span class="material-symbols-outlined">contract</span></div>
            <div class="hub-info">
              <h3>Suprimentos & Contratos</h3>
              <p>Fornecedores homologados, requisições de compra e tecnologia bélica avançada.</p>
            </div>
            <span class="material-symbols-outlined arrow">arrow_forward</span>
          </a>

          <a routerLink="/risco/ameacas" class="glass-panel hub-card">
            <div class="hub-icon tone-risk"><span class="material-symbols-outlined">radar</span></div>
            <div class="hub-info">
              <h3>Inteligência & Ameaças</h3>
              <p>Monitoramento geoespacial de vilões, acordos regulatórios e indenizações públicas.</p>
            </div>
            <span class="material-symbols-outlined arrow">arrow_forward</span>
          </a>

          <a routerLink="/rh/reputacao" class="glass-panel hub-card">
            <div class="hub-icon tone-operations"><span class="material-symbols-outlined">monitoring</span></div>
            <div class="hub-info">
              <h3>Ranking Reputacional</h3>
              <p>Índices consolidados de aprovação popular, respaldo governamental e governança.</p>
            </div>
            <span class="material-symbols-outlined arrow">arrow_forward</span>
          </a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 28px;
      max-width: 1540px;
      margin: 0 auto;
    }

    /* Hero Banner */
    .hero-banner {
      border-radius: 24px;
      padding: 36px 42px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 32px;
      position: relative;
      overflow: hidden;
    }

    .banner-content {
      max-width: 760px;
      z-index: 2;
    }

    .badge-row {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;

      span { font-size: 14px; }
    }

    .ready-pill {
      background: color-mix(in oklab, var(--ready) 15%, transparent);
      color: var(--ready);
      border: 1px solid color-mix(in oklab, var(--ready) 30%, transparent);

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--ready);
      }
    }

    .cobalt-pill {
      background: color-mix(in oklab, var(--cobalt) 15%, transparent);
      color: var(--cobalt);
      border: 1px solid color-mix(in oklab, var(--cobalt) 30%, transparent);
    }

    .hero-title {
      margin: 0 0 12px;
      font-family: var(--font-display);
      font-size: 2.6rem;
      font-weight: 700;
      line-height: 1.1;
    }

    .hero-description {
      margin: 0 0 24px;
      font-size: 0.95rem;
      line-height: 1.5;
      color: var(--muted-foreground);
    }

    .banner-actions {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 44px;
      padding: 0 20px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.15s ease, opacity 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }

      span { font-size: 18px; }
    }

    .outline-btn {
      background: color-mix(in oklab, var(--card) 60%, transparent);
      border: 1px solid var(--border);
      color: var(--foreground);

      &:hover {
        border-color: var(--primary);
      }
    }

    /* Radar Graphic */
    .hero-radar-preview {
      position: relative;
      width: 220px;
      height: 220px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .radar-circle {
      position: absolute;
      border-radius: 50%;
      border: 1px dashed color-mix(in oklab, var(--primary) 35%, transparent);
    }

    .circle-1 { width: 70px; height: 70px; }
    .circle-2 { width: 140px; height: 140px; }
    .circle-3 { width: 210px; height: 210px; }

    .radar-center {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: color-mix(in oklab, var(--primary) 20%, transparent);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;

      span { font-size: 24px; }
    }

    /* Bento Grid */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
    }

    .bento-card {
      padding: 22px;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .card-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      span { font-size: 22px; }
    }

    .tag-status {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 9999px;
    }

    .ready-tag { color: var(--ready); background: color-mix(in oklab, var(--ready) 12%, transparent); }
    .operations-tag { color: var(--operations); background: color-mix(in oklab, var(--operations) 12%, transparent); }
    .rh-tag { color: var(--rh); background: color-mix(in oklab, var(--rh) 12%, transparent); }
    .risk-tag { color: var(--risk); background: color-mix(in oklab, var(--risk) 12%, transparent); }

    .tone-ready { color: var(--ready); background: color-mix(in oklab, var(--ready) 14%, transparent); }
    .tone-operations { color: var(--operations); background: color-mix(in oklab, var(--operations) 14%, transparent); }
    .tone-rh { color: var(--rh); background: color-mix(in oklab, var(--rh) 14%, transparent); }
    .tone-risk { color: var(--risk); background: color-mix(in oklab, var(--risk) 14%, transparent); }
    .tone-assets { color: var(--assets); background: color-mix(in oklab, var(--assets) 14%, transparent); }
    .tone-supplies { color: var(--supplies); background: color-mix(in oklab, var(--supplies) 14%, transparent); }

    .card-label {
      margin: 0;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted-foreground);
    }

    .card-value {
      margin: 6px 0 12px;
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
    }

    .progress-bar {
      height: 6px;
      background-color: var(--muted);
      border-radius: 9999px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      border-radius: 9999px;
    }

    .fill-ready { background-color: var(--ready); }
    .fill-operations { background-color: var(--operations); }
    .fill-rh { background-color: var(--rh); }
    .fill-risk { background-color: var(--risk); }

    .card-footnote {
      margin: 0;
      font-size: 0.72rem;
      color: var(--muted-foreground);
    }

    /* Hub Section */
    .hub-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .hub-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 700;
    }

    .hub-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
    }

    .hub-card {
      padding: 18px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      text-decoration: none;
      color: var(--foreground);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        border-color: var(--primary);

        .arrow {
          transform: translateX(4px);
          color: var(--primary);
        }
      }
    }

    .hub-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      span { font-size: 24px; }
    }

    .hub-info {
      flex: 1;
      min-width: 0;

      h3 {
        margin: 0 0 4px;
        font-family: var(--font-display);
        font-size: 1rem;
        font-weight: 700;
      }

      p {
        margin: 0;
        font-size: 0.75rem;
        color: var(--muted-foreground);
        line-height: 1.35;
      }
    }

    .arrow {
      color: var(--muted-foreground);
      transition: transform 0.2s ease, color 0.2s ease;
    }

    @media (max-width: 768px) {
      .hero-banner {
        flex-direction: column;
        padding: 24px;
      }
      .hero-radar-preview {
        display: none;
      }
    }
  `],
})
export class DashboardPageComponent {}
