import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
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
import { DashboardStatsService, type DashboardTacticalKpis } from './dashboard-stats.service';

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
export class DashboardPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly globalAction = inject(GlobalActionService, { optional: true });
  private readonly statsService = inject(DashboardStatsService);

  protected readonly pageDefinition = signal<WidgetPageDefinition>(DASHBOARD_PAGE_DEFINITION);
  protected readonly isCustomizing = signal<boolean>(false);

  ngOnInit(): void {
    this.statsService.getTacticalKpis().subscribe((kpis) => {
      this.pageDefinition.update((def) => projectTacticalKpis(def, kpis));
    });
  }

  protected toggleCustomization(): void {
    this.isCustomizing.update((v) => !v);
  }

  protected onPageChange(updated: WidgetPageDefinition): void {
    this.pageDefinition.set(updated);
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
