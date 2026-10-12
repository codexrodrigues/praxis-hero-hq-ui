import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  type WidgetEventEnvelope,
  type PageIdentity,
  type WidgetPagePersistenceState,
} from '@praxisui/core';
import { DynamicPageBuilderComponent } from '@praxisui/page-builder';
import { DASHBOARD_PAGE_DEFINITION } from './dashboard-page.definition';
import { DashboardStatsService } from './dashboard-stats.service';
import { AuthSimulationService } from '../../core/auth-simulation.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, DynamicPageBuilderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-page-wrapper">
      <!-- Toolbar de Governança do Dashboard -->
      <header class="dashboard-toolbar">
        <div class="toolbar-brand">
          <div class="status-indicator">
            <span class="dot-pulse"></span>
            <span class="status-label">HQ TACTICAL OPERATIONAL MATRIX</span>
          </div>
          <span class="governance-badge">
            <span class="material-symbols-outlined">dashboard_customize</span>
            Praxis Page Builder · Canvas Governado
          </span>

          <div class="layout-persistence-badge" data-testid="dashboard-layout-status" role="status"
            [class.customized]="isLayoutCustomized()" [class.governed]="!isLayoutCustomized()">
            <span>{{ persistenceLabel() }}</span>
            @if (persistence().status === 'saved' && lastSavedAt(); as saved) {
              <span class="saved-time">· salvo às {{ saved }}</span>
            }
          </div>
        </div>

        <div class="toolbar-actions">
          @if (persistence().status === 'error' && persistence().operation === 'save' && persistence().errorKind !== 'conflict') {
            <button type="button" class="reset-layout-btn" data-testid="retry-layout-btn"
              (click)="builder.retryPersistedPage()">Tentar salvar novamente</button>
          }
          @if (persistence().status === 'error') {
            <button type="button" class="reset-layout-btn" data-testid="reload-layout-btn"
              (click)="builder.reloadPersistedPage(pageDefinition)">Descartar alterações e recarregar</button>
          }
          @if (isCustomizing() && isLayoutCustomized()) {
            <button
              type="button"
              class="reset-layout-btn"
              data-testid="reset-layout-btn"
              (click)="builder.resetPersistedPage(pageDefinition)"
              [disabled]="busy() || persistence().status === 'error'"
              title="Reverter para o layout padrão de fábrica e descartar customizações desta persona"
            >
              <span class="material-symbols-outlined">restart_alt</span>
              <span>Restaurar Fábrica</span>
            </button>
          }

          <button
            type="button"
            class="customize-toggle-btn"
            data-testid="toggle-customization-btn"
            [class.active]="isCustomizing()"
            (click)="toggleCustomization()"
            [disabled]="busy() || persistence().status === 'error'"
            [attr.aria-pressed]="isCustomizing()"
            title="Alternar modo de customização de layout e widgets"
          >
            <span class="material-symbols-outlined">
              {{ isCustomizing() ? 'visibility' : 'dashboard_customize' }}
            </span>
            <span>{{ isCustomizing() ? 'Concluir Edição' : 'Customizar Layout' }}</span>
          </button>
        </div>
      </header>

      <!-- Canvas Oficial Page Builder -->
      <main class="dashboard-canvas-container">
        <praxis-dynamic-page-builder
          #builder
          [page]="pageDefinition"
          [pageIdentity]="pageIdentity()"
          [autoPersist]="true"
          (persistenceChange)="persistence.set($event)"
          [context]="dashboardContext()"
          [enableCustomization]="isCustomizing() && persistence().status !== 'error' && persistence().status !== 'loading'"
          [showSettingsButton]="isCustomizing()"
          (widgetEvent)="handleWidgetEvent($event)"
        />
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .dashboard-page-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 1540px;
      margin: 0 auto;
    }

    /* Dashboard Header / Toolbar */
    .dashboard-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 18px;
      border-radius: 14px;
      background: var(--surface-gradient);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: 1px solid var(--border);
      gap: 16px;
      flex-wrap: wrap;
    }

    .toolbar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 3px 10px;
      border-radius: 9999px;
      background: color-mix(in oklab, var(--ready) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--ready) 28%, transparent);
      color: var(--ready);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    .dot-pulse {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--ready);
      box-shadow: 0 0 8px var(--ready);
      animation: pulse-glow 2s infinite ease-in-out;
    }

    @keyframes pulse-glow {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }

    .governance-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.72rem;
      color: var(--muted-foreground);
      font-weight: 600;

      span { font-size: 15px; color: var(--cobalt); }
    }

    .layout-persistence-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.04em;

      &.customized {
        background: color-mix(in oklab, var(--warning) 15%, transparent);
        border: 1px solid color-mix(in oklab, var(--warning) 35%, transparent);
        color: var(--warning);
      }

      &.governed {
        background: color-mix(in oklab, var(--cobalt) 12%, transparent);
        border: 1px solid color-mix(in oklab, var(--cobalt) 30%, transparent);
        color: var(--cobalt);
      }

      .saved-time {
        font-size: 0.65rem;
        opacity: 0.8;
      }
    }

    .pulse-indicator-amber {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--warning);
      box-shadow: 0 0 6px var(--warning);
    }

    .pulse-indicator-cyan {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--cobalt);
      box-shadow: 0 0 6px var(--cobalt);
    }

    .reset-layout-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 14px;
      border-radius: 10px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid color-mix(in oklab, var(--destructive) 35%, transparent);
      background: color-mix(in oklab, var(--destructive) 10%, transparent);
      color: var(--destructive);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      &:hover {
        background: var(--destructive);
        color: var(--destructive-foreground);
        border-color: var(--destructive);
        transform: translateY(-1px);
      }

      span { font-size: 16px; }
    }

    .customize-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 36px;
      padding: 0 16px;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--foreground);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      &:hover {
        border-color: var(--primary);
        color: var(--primary);
        transform: translateY(-1px);
      }

      &.active {
        background: var(--primary);
        color: var(--primary-foreground);
        border-color: var(--primary);
        box-shadow: 0 0 16px color-mix(in oklab, var(--primary) 40%, transparent);
      }

      span { font-size: 18px; }
    }

    .dashboard-canvas-container {
      width: 100%;
    }
  `],
})
export class DashboardPageComponent {
  private readonly router = inject(Router);
  private readonly statsService = inject(DashboardStatsService);
  protected readonly authService = inject(AuthSimulationService);

  protected readonly pageDefinition = DASHBOARD_PAGE_DEFINITION;
  protected readonly pageIdentity = computed<PageIdentity>(() => {
    const persona = this.authService.currentPersona();
    return { appId: 'praxis-hero-hq', tenantId: persona.tenant, userId: persona.id, routePath: '/' };
  });
  protected readonly isCustomizing = signal(false);
  protected readonly persistence = signal<WidgetPagePersistenceState>({ status: 'idle', customized: false });
  protected readonly isLayoutCustomized = computed(() => this.persistence().customized);
  protected readonly busy = computed(() => ['loading', 'saving', 'resetting'].includes(this.persistence().status));
  protected readonly persistenceLabel = computed(() => {
    switch (this.persistence().status) {
      case 'loading': return 'Carregando layout…';
      case 'saving': return 'Salvando layout…';
      case 'resetting': return 'Restaurando layout…';
      case 'error': return this.persistence().errorKind === 'conflict'
        ? 'Conflito ao salvar. Reabra a página para carregar a versão atual.'
        : 'Não foi possível confirmar a persistência do layout.';
      default: return this.isLayoutCustomized() ? 'Layout personalizado salvo' : 'Layout padrão';
    }
  });
  protected readonly lastSavedAt = computed(() => {
    const saved = this.persistence().savedAt;
    return saved ? new Date(saved).toLocaleTimeString('pt-BR') : null;
  });

  constructor() {
    effect(() => {
      this.pageIdentity();
      this.isCustomizing.set(false);
      this.persistence.set({ status: 'idle', customized: false });
    });
  }

  protected readonly dashboardKpis = toSignal(this.statsService.getTacticalKpis(), { initialValue: null });

  protected readonly dashboardContext = computed(() => {
    const k = this.dashboardKpis();
    if (!k) {
      return {
        kpis: {
          readinessRate: 98.4,
          activeHeroes: 21,
          totalHeroes: 21,
          inProgressMissions: 7,
          inProgressMissionsBadge: '07',
          plannedMissions: 14,
          totalMissions: 21,
          missoesPercent: 70,
          latestPayrollMonth: 'Outubro / 2026',
          latestPayrollNetMillion: '4,85',
          latestPayrollEmployees: 98,
          folhaPercent: 78.5,
          totalIncidents: 24,
          criticalIncidents: 2,
          criticalIncidentsBadge: '02',
          highIncidents: 5,
          riscosPercent: 15,
        },
      };
    }
    const missoesPercent = Math.min(
      100,
      Math.round((k.inProgressMissions / Math.max(1, k.totalMissions)) * 100),
    );
    const riscosPercent = Math.min(
      100,
      Math.round((k.criticalIncidents / Math.max(1, k.totalIncidents)) * 100),
    );
    return {
      kpis: {
        ...k,
        inProgressMissionsBadge:
          k.inProgressMissions < 10 ? `0${k.inProgressMissions}` : String(k.inProgressMissions),
        criticalIncidentsBadge:
          k.criticalIncidents < 10 ? `0${k.criticalIncidents}` : String(k.criticalIncidents),
        missoesPercent,
        riscosPercent,
        folhaPercent: 78.5,
      },
    };
  });

  protected toggleCustomization(): void {
    if (!this.busy()) this.isCustomizing.update((value) => !value);
  }

  protected handleWidgetEvent(event: WidgetEventEnvelope): void {
    if (event.output !== 'navigate') return;
    const payload = event.payload;
    if (!payload || typeof payload !== 'object') return;
    const target = payload as Record<string, unknown>;
    const path = target['path'] ?? target['url'] ?? target['route'];
    if (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')) {
      void this.router.navigateByUrl(path);
    }
  }
}
