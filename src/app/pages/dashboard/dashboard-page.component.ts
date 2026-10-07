import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import {
  ASYNC_CONFIG_STORAGE,
  CONFIG_STORAGE,
  GlobalActionService,
  type WidgetEventEnvelope,
  type WidgetPageDefinition,
} from '@praxisui/core';
import { DynamicPageBuilderComponent } from '@praxisui/page-builder';
import { DASHBOARD_PAGE_DEFINITION } from './dashboard-page.definition';
import { DashboardStatsService, type DashboardTacticalKpis } from './dashboard-stats.service';
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
            Praxis Page Builder 9.0 · Canvas Governed
          </span>

          <!-- Layout Persistence Status Badge -->
          @if (isLayoutCustomized()) {
            <div
              class="layout-persistence-badge customized"
              data-testid="dashboard-layout-status"
              title="Layout customizado persistido para esta persona"
            >
              <span class="pulse-indicator-amber"></span>
              <span>Layout Customizado (Persistido)</span>
              @if (lastSavedAt(); as saved) {
                <span class="saved-time">· salvo às {{ saved }}</span>
              }
            </div>
          } @else {
            <div
              class="layout-persistence-badge governed"
              data-testid="dashboard-layout-status"
              title="Layout padrão governado de fábrica"
            >
              <span class="pulse-indicator-cyan"></span>
              <span>Layout de Fábrica (Governança)</span>
            </div>
          }
        </div>

        <div class="toolbar-actions">
          @if (isCustomizing() && isLayoutCustomized()) {
            <button
              type="button"
              class="reset-layout-btn"
              data-testid="reset-layout-btn"
              (click)="resetToFactoryLayout()"
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
          [page]="pageDefinition()"
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
        color: #fff;
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
  `],
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly globalAction = inject(GlobalActionService, { optional: true });
  private readonly statsService = inject(DashboardStatsService);
  private readonly asyncConfigStorage = inject(ASYNC_CONFIG_STORAGE, { optional: true });
  private readonly configStorage = inject(CONFIG_STORAGE);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly authService = inject(AuthSimulationService);

  private readonly storageKey = 'dynamic-page:hq-dashboard';

  protected readonly pageDefinition = signal<WidgetPageDefinition>(DASHBOARD_PAGE_DEFINITION);
  protected readonly isCustomizing = signal<boolean>(false);
  protected readonly isLayoutCustomized = signal<boolean>(false);
  protected readonly lastSavedAt = signal<string | null>(null);

  private currentKpis: DashboardTacticalKpis | null = null;

  ngOnInit(): void {
    this.loadEffectiveLayout();

    this.statsService.getTacticalKpis().subscribe((kpis) => {
      this.currentKpis = kpis;
      this.pageDefinition.update((def) => projectTacticalKpis(def, kpis));
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('praxis:identity-switch', this.onIdentitySwitch);
      (window as any).PAX_SAVE_DASHBOARD_LAYOUT = (def: WidgetPageDefinition) => this.onPageChange(def);
      (window as any).PAX_RELOAD_DASHBOARD_LAYOUT = () => this.loadEffectiveLayout();
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('praxis:identity-switch', this.onIdentitySwitch);
      delete (window as any).PAX_SAVE_DASHBOARD_LAYOUT;
      delete (window as any).PAX_RELOAD_DASHBOARD_LAYOUT;
    }
  }

  private readonly onIdentitySwitch = (): void => {
    // Ao alternar a persona tática, reseta o estado visual imediato para o padrão de governança
    // e dispara a carga remota da nova persona para isolamento total
    this.isLayoutCustomized.set(false);
    this.pageDefinition.set(
      this.currentKpis
        ? projectTacticalKpis(DASHBOARD_PAGE_DEFINITION, this.currentKpis)
        : DASHBOARD_PAGE_DEFINITION,
    );
    this.loadEffectiveLayout();
  };

  private loadEffectiveLayout(): void {
    const currentUserId = this.authService.currentPersona().id;
    const localScopedKey = `${this.storageKey}:${currentUserId}`;

    // 1. Renderiza imediatamente do cache local da persona (sem flash)
    let stored: WidgetPageDefinition | null = null;
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(localScopedKey);
        if (raw) stored = JSON.parse(raw);
      } catch {}
    }

    if (stored && stored.widgets && stored.widgets.length > 0) {
      this.isLayoutCustomized.set(true);
      const effective = this.currentKpis
        ? projectTacticalKpis(stored, this.currentKpis)
        : stored;
      this.pageDefinition.set(effective);
    } else {
      this.isLayoutCustomized.set(false);
      const effective = this.currentKpis
        ? projectTacticalKpis(DASHBOARD_PAGE_DEFINITION, this.currentKpis)
        : DASHBOARD_PAGE_DEFINITION;
      this.pageDefinition.set(effective);
    }

    // 2. Sincroniza com a persistência canônica remota no backend (praxis-config-starter)
    if (this.asyncConfigStorage) {
      this.asyncConfigStorage
        .loadConfig<WidgetPageDefinition>(this.storageKey)
        .pipe(take(1))
        .subscribe({
          next: (remote) => {
            if (this.authService.currentPersona().id !== currentUserId) {
              return;
            }
            if (remote && remote.widgets && remote.widgets.length > 0) {
              this.isLayoutCustomized.set(true);
              const effective = this.currentKpis
                ? projectTacticalKpis(remote, this.currentKpis)
                : remote;
              this.pageDefinition.set(effective);
              if (typeof localStorage !== 'undefined') {
                try {
                  localStorage.setItem(localScopedKey, JSON.stringify(remote));
                } catch {}
              }
            } else {
              this.isLayoutCustomized.set(false);
              const effective = this.currentKpis
                ? projectTacticalKpis(DASHBOARD_PAGE_DEFINITION, this.currentKpis)
                : DASHBOARD_PAGE_DEFINITION;
              this.pageDefinition.set(effective);
              if (typeof localStorage !== 'undefined') {
                try {
                  localStorage.removeItem(localScopedKey);
                } catch {}
              }
            }
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.warn('[DashboardPageComponent] Não foi possível carregar config remota:', err);
          },
        });
    }
    this.cdr.markForCheck();
  }

  protected toggleCustomization(): void {
    this.isCustomizing.update((v) => !v);
    this.cdr.markForCheck();
  }

  protected onPageChange(updated: WidgetPageDefinition): void {
    const currentUserId = this.authService.currentPersona().id;
    const localScopedKey = `${this.storageKey}:${currentUserId}`;

    this.pageDefinition.set(updated);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(localScopedKey, JSON.stringify(updated));
      } catch {}
    }

    if (this.asyncConfigStorage) {
      this.asyncConfigStorage.saveConfig(this.storageKey, updated).pipe(take(1)).subscribe();
    }
    this.isLayoutCustomized.set(true);
    this.lastSavedAt.set(new Date().toLocaleTimeString('pt-BR'));
    this.cdr.markForCheck();
  }

  protected resetToFactoryLayout(): void {
    const currentUserId = this.authService.currentPersona().id;
    const localScopedKey = `${this.storageKey}:${currentUserId}`;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(localScopedKey);
      } catch {}
    }

    if (this.asyncConfigStorage) {
      this.asyncConfigStorage.clearConfig(this.storageKey).pipe(take(1)).subscribe();
    }
    this.isLayoutCustomized.set(false);
    this.lastSavedAt.set(null);
    this.pageDefinition.set(
      this.currentKpis
        ? projectTacticalKpis(DASHBOARD_PAGE_DEFINITION, this.currentKpis)
        : DASHBOARD_PAGE_DEFINITION,
    );
    this.cdr.markForCheck();
  }

  protected handleWidgetEvent(event: WidgetEventEnvelope): void {
    const payload = event.payload as any;
    if (payload?.path) {
      this.router.navigateByUrl(payload.path);
      return;
    }

    if (payload?.actionId && this.globalAction) {
      this.globalAction.execute(payload.actionId, payload.payload);
      return;
    }

    if (payload?.url) {
      window.open(payload.url, '_blank', 'noopener,noreferrer');
    }
  }
}

interface BentoKpiCardConfig {
  icon: string;
  toneClass: string;
  badgeLabel: string;
  badgeClass: string;
  title: string;
  subtitle: string;
  progressValue: number;
  progressClass: string;
  footnote: string;
}

function buildBentoKpiCard(config: BentoKpiCardConfig) {
  return {
    type: 'card',
    variant: 'unstyled',
    tone: 'neutral',
    className: 'glass-panel bento-kpi-card',
    header: [
      {
        type: 'compose',
        direction: 'row',
        gap: 'sm',
        items: [
          {
            type: 'icon',
            icon: config.icon,
            className: `card-icon ${config.toneClass}`,
          },
          {
            type: 'badge',
            label: config.badgeLabel,
            className: `tag-status ${config.badgeClass}`,
          },
        ],
      },
    ],
    title: config.title,
    subtitle: config.subtitle,
    content: [
      {
        type: 'progress',
        value: config.progressValue,
        valueExpr: 'progressValue',
        showPercent: false,
        className: config.progressClass,
      },
      {
        type: 'text',
        text: config.footnote,
        className: 'card-footnote',
      },
    ],
  };
}

function projectTacticalKpis(
  def: WidgetPageDefinition,
  kpis: DashboardTacticalKpis,
): WidgetPageDefinition {
  const missoesPercent = Math.min(
    100,
    Math.round((kpis.inProgressMissions / Math.max(1, kpis.totalMissions)) * 100),
  );
  const riscosPercent = Math.min(
    100,
    Math.round((kpis.criticalIncidents / Math.max(1, kpis.totalIncidents)) * 100),
  );

  const kpiCardMap: Record<string, { card: ReturnType<typeof buildBentoKpiCard>; progressValue: number }> = {
    kpiProntidao: {
      card: buildBentoKpiCard({
        icon: 'verified_user',
        toneClass: 'tone-ready',
        badgeLabel: `${kpis.readinessRate}% Força`,
        badgeClass: 'ready-tag',
        title: `${kpis.activeHeroes} Ativos`,
        subtitle: 'Prontidão Operacional',
        progressValue: kpis.readinessRate,
        progressClass: 'fill-ready',
        footnote: `${kpis.activeHeroes} de ${kpis.totalHeroes} heróis prontos para ação`,
      }),
      progressValue: kpis.readinessRate,
    },
    kpiMissoes: {
      card: buildBentoKpiCard({
        icon: 'military_tech',
        toneClass: 'tone-operations',
        badgeLabel: `${kpis.inProgressMissions < 10 ? '0' : ''}${kpis.inProgressMissions} Em Curso`,
        badgeClass: 'operations-tag',
        title: `${kpis.plannedMissions} Planejadas`,
        subtitle: 'Missões Operacionais',
        progressValue: missoesPercent,
        progressClass: 'fill-operations',
        footnote: `${kpis.totalMissions} missões catalogadas no radar tático`,
      }),
      progressValue: missoesPercent,
    },
    kpiFolha: {
      card: buildBentoKpiCard({
        icon: 'payments',
        toneClass: 'tone-rh',
        badgeLabel: kpis.latestPayrollMonth,
        badgeClass: 'rh-tag',
        title: `R$ ${kpis.latestPayrollNetMillion} M`,
        subtitle: 'Execução da Folha',
        progressValue: 78.5,
        progressClass: 'fill-rh',
        footnote: `Folha de ${kpis.latestPayrollEmployees} colaboradores auditados`,
      }),
      progressValue: 78.5,
    },
    kpiRiscos: {
      card: buildBentoKpiCard({
        icon: 'emergency',
        toneClass: 'tone-risk',
        badgeLabel: `${kpis.totalIncidents} Incidentes`,
        badgeClass: 'risk-tag',
        title: `${kpis.criticalIncidents < 10 ? '0' : ''}${kpis.criticalIncidents} Críticos`,
        subtitle: 'Ameaças & Incidentes',
        progressValue: riscosPercent,
        progressClass: 'fill-risk',
        footnote: `${kpis.highIncidents} ocorrências de severidade alta em contenção`,
      }),
      progressValue: riscosPercent,
    },
  };

  return {
    ...def,
    widgets: (def.widgets || []).map((w) => {
      const entry = kpiCardMap[w.key];
      if (!entry) return w;
      return {
        ...w,
        definition: {
          ...w.definition,
          inputs: {
            ...w.definition?.inputs,
            context: { progressValue: entry.progressValue },
            document: {
              kind: 'praxis.rich-content',
              version: '1.0.0',
              nodes: [entry.card],
            },
          },
        },
      };
    }),
  };
}
