import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  GlobalActionService,
  type WidgetEventEnvelope,
  type WidgetPageDefinition,
} from '@praxisui/core';
import { DynamicPageBuilderComponent } from '@praxisui/page-builder';
import { DASHBOARD_PAGE_DEFINITION } from './dashboard-page.definition';

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
            Praxis Page Builder 9.0 · Canvas Governed
          </span>
        </div>

        <div class="toolbar-actions">
          <button
            type="button"
            class="customize-toggle-btn"
            [class.active]="isCustomizing()"
            (click)="toggleCustomization()"
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
          [page]="pageDefinition"
          [enableCustomization]="isCustomizing()"
          [showSettingsButton]="isCustomizing()"
          (pageChange)="onPageChange($event)"
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
      background: color-mix(in oklab, var(--card) 60%, transparent);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
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
      background: color-mix(in oklab, var(--card) 80%, transparent);
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

    /* Rich Content & Widget Shell Enhancements */
    ::ng-deep {
      /* Hero Executive Banner */
      .hero-executive-banner {
        position: relative;
        overflow: hidden;
        border-radius: 24px !important;
        padding: 32px 38px !important;
        border: 1px solid var(--border) !important;
        background: color-mix(in oklab, var(--card) 60%, transparent) !important;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      }

      .hero-executive-banner .pdx-rich-card__title,
      .hero-executive-banner .prx-rich-card__title {
        font-family: var(--font-display) !important;
        font-size: 2.4rem !important;
        font-weight: 700 !important;
        line-height: 1.15 !important;
        background: linear-gradient(135deg, var(--foreground) 0%, color-mix(in oklab, var(--foreground) 70%, var(--primary)) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .hero-executive-banner .pdx-rich-card__subtitle,
      .hero-executive-banner .prx-rich-card__subtitle {
        font-size: 0.95rem !important;
        line-height: 1.5 !important;
        color: var(--muted-foreground) !important;
        max-width: 760px;
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
      }

      .ready-pill {
        background: color-mix(in oklab, var(--ready) 15%, transparent);
        color: var(--ready);
        border: 1px solid color-mix(in oklab, var(--ready) 30%, transparent);
      }

      .cobalt-pill {
        background: color-mix(in oklab, var(--cobalt) 15%, transparent);
        color: var(--cobalt);
        border: 1px solid color-mix(in oklab, var(--cobalt) 30%, transparent);
      }

      /* Bento KPI Cards */
      .bento-kpi-card {
        border-radius: 20px !important;
        padding: 22px !important;
        border: 1px solid var(--border) !important;
        background: color-mix(in oklab, var(--card) 60%, transparent) !important;
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        transition: transform 0.2s ease, border-color 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          border-color: color-mix(in oklab, var(--primary) 40%, var(--border));
        }
      }

      .bento-kpi-card .prx-rich-card__title,
      .bento-kpi-card .pdx-rich-card__title {
        font-family: var(--font-display) !important;
        font-size: 1.9rem !important;
        font-weight: 700 !important;
        color: var(--foreground) !important;
        margin: 6px 0 10px !important;
      }

      .bento-kpi-card .prx-rich-card__subtitle,
      .bento-kpi-card .pdx-rich-card__subtitle {
        font-size: 0.72rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        color: var(--muted-foreground) !important;
      }

      .card-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
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

      .fill-ready progress, .fill-ready .pdx-progress-bar-fill, .fill-ready .mat-mdc-progress-bar-fill {
        background-color: var(--ready) !important;
      }
      .fill-operations progress, .fill-operations .pdx-progress-bar-fill {
        background-color: var(--operations) !important;
      }
      .fill-rh progress, .fill-rh .pdx-progress-bar-fill {
        background-color: var(--rh) !important;
      }
      .fill-risk progress, .fill-risk .pdx-progress-bar-fill {
        background-color: var(--risk) !important;
      }

      .card-footnote {
        font-size: 0.72rem;
        color: var(--muted-foreground);
        margin-top: 6px;
      }

      /* Hub Action Cards Grid */
      .hub-action-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 16px;
        width: 100%;
      }

      .hub-card-action {
        border-radius: 16px !important;
        padding: 18px !important;
        border: 1px solid var(--border) !important;
        background: color-mix(in oklab, var(--card) 60%, transparent) !important;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        cursor: pointer;
        transition: transform 0.2s ease, border-color 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          border-color: var(--primary) !important;
        }
      }

      .hub-card-action .prx-rich-action-card__title,
      .hub-card-action .pdx-rich-action-card__title {
        font-family: var(--font-display) !important;
        font-size: 1rem !important;
        font-weight: 700 !important;
      }

      .hub-card-action .prx-rich-action-card__subtitle,
      .hub-card-action .pdx-rich-action-card__subtitle {
        font-size: 0.75rem !important;
        color: var(--muted-foreground) !important;
        line-height: 1.35 !important;
      }
    }
  `],
})
export class DashboardPageComponent {
  private readonly router = inject(Router);
  private readonly globalAction = inject(GlobalActionService, { optional: true });

  protected pageDefinition: WidgetPageDefinition = DASHBOARD_PAGE_DEFINITION;
  protected readonly isCustomizing = signal<boolean>(false);

  protected toggleCustomization(): void {
    this.isCustomizing.update((v) => !v);
  }

  protected onPageChange(updated: WidgetPageDefinition): void {
    this.pageDefinition = updated;
  }

  protected handleWidgetEvent(event: WidgetEventEnvelope): void {
    const payload = event.payload as any;
    if (payload?.path) {
      this.router.navigateByUrl(payload.path);
      return;
    }

    if (payload?.actionId) {
      if (this.globalAction) {
        this.globalAction.execute(payload.actionId, payload.payload);
      }
      return;
    }

    if (payload?.url) {
      window.open(payload.url, '_blank', 'noopener,noreferrer');
    }
  }
}
