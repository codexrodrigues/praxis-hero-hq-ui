import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import {
  type PageIdentity,
  type WidgetPagePersistenceState,
} from '@praxisui/core';
import { DynamicPageBuilderComponent } from '@praxisui/page-builder';
import { DASHBOARD_PAGE_DEFINITION } from './dashboard-page.definition';
import { AuthSimulationService } from '../../core/auth-simulation.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, DynamicPageBuilderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-page-wrapper">
      @if (authDeniedResource(); as deniedRes) {
        <div class="tactical-auth-alert glass-panel" role="alert" data-testid="tactical-auth-alert">
          <div class="alert-content">
            <span class="material-symbols-outlined alert-icon">shield_lock</span>
            <div class="alert-text">
              <strong class="alert-title">Acesso Tático Restrito (Credencial DEFCON 1 Requerida)</strong>
              <p class="alert-desc">
                A credencial de segurança de <strong>{{ authService.currentPersona().name }}</strong> ({{ authService.currentPersona().clearanceLevel }})
                não possui autorização executiva para acessar <em>{{ deniedRes }}</em>. Alterne para <strong>Nick Fury</strong> no menu superior para autorizar o acesso.
              </p>
            </div>
          </div>
          <button type="button" class="alert-dismiss-btn" (click)="dismissAuthDenied()" aria-label="Fechar alerta">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      }
      <!-- Toolbar de Governança do Dashboard -->
      <header class="dashboard-toolbar" data-testid="dashboard-governance-toolbar">
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
            <button type="button" class="reset-layout-btn" data-testid="reset-layout-btn"
              (click)="builder.resetPersistedPage(pageDefinition)"
              title="Reverter para o layout padrão de fábrica e descartar customizações desta persona">
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
          [enableCustomization]="isCustomizing() && persistence().status !== 'error' && persistence().status !== 'loading'"
          [showSettingsButton]="isCustomizing()"
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

    .tactical-auth-alert {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 20px;
      border-radius: 12px;
      background: color-mix(in oklab, var(--destructive, #ef4444) 14%, var(--card, #1e293b));
      border: 1px solid color-mix(in oklab, var(--destructive, #ef4444) 40%, transparent);
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.15);
      margin-bottom: 20px;
      animation: alertSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);

      .alert-content {
        display: flex;
        align-items: center;
        gap: 14px;

        .alert-icon {
          font-size: 28px;
          color: var(--destructive, #ef4444);
        }

        .alert-text {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .alert-title {
            font-size: 0.92rem;
            font-weight: 700;
            color: var(--destructive, #ef4444);
            letter-spacing: -0.01em;
          }

          .alert-desc {
            margin: 0;
            font-size: 0.82rem;
            color: var(--foreground, #e2e8f0);
            line-height: 1.4;

            strong, em {
              color: var(--foreground, #ffffff);
            }
          }
        }
      }

      .alert-dismiss-btn {
        background: transparent;
        border: none;
        color: var(--muted-foreground, #94a3b8);
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--foreground, #ffffff);
        }
      }
    }

    @keyframes alertSlideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dashboard-canvas-container {
      width: 100%;
    }
  `],
})
export class DashboardPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly authService = inject(AuthSimulationService);

  protected readonly authDeniedResource = toSignal(
    this.route.queryParams.pipe(
      map((params) => (params['authDenied'] === 'true' ? params['resource'] || 'Recurso Restrito' : null)),
    ),
    { initialValue: null },
  );

  protected dismissAuthDenied(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { authDenied: null, resource: null },
      queryParamsHandling: 'merge',
    });
  }

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

  protected toggleCustomization(): void {
    if (!this.busy()) this.isCustomizing.update((value) => !value);
  }
}
