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
  type RichBlockHostCapabilities,
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
  `],
})
export class DashboardPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly globalAction = inject(GlobalActionService, { optional: true });
  private readonly statsService = inject(DashboardStatsService);

  private readonly hostCapabilities: RichBlockHostCapabilities = {
    dispatchAction: (actionId: string, payload: unknown) => {
      const p = payload as any;
      if (actionId === 'navigation.openRoute' || actionId === 'navigation.navigate') {
        const path = p?.path || p;
        if (typeof path === 'string') {
          this.router.navigateByUrl(path);
          return;
        }
      }
      if (this.globalAction) {
        this.globalAction.execute(actionId, payload);
      }
    },
    isActionAvailable: () => true,
  };

  protected pageDefinition: WidgetPageDefinition = this.injectHostCapabilities(DASHBOARD_PAGE_DEFINITION);
  protected readonly isCustomizing = signal<boolean>(false);

  ngOnInit(): void {
    this.statsService.getTacticalKpis().subscribe((kpis) => {
      this.pageDefinition = this.applyRealKpis(this.pageDefinition, kpis);
    });
  }

  private applyRealKpis(def: WidgetPageDefinition, kpis: DashboardTacticalKpis): WidgetPageDefinition {
    return {
      ...def,
      widgets: (def.widgets || []).map((w) => {
        if (w.key === 'kpiProntidao' && w.definition?.inputs?.['document']?.nodes?.[0]) {
          const card = { ...w.definition.inputs['document'].nodes[0] };
          card.title = `${kpis.activeHeroes} Ativos`;
          card.subtitle = 'Prontidão Operacional';
          if (card.header?.[0]?.items?.[1]) {
            card.header[0].items[1] = { ...card.header[0].items[1], label: `${kpis.readinessRate}% Força` };
          }
          if (card.content?.[0]) {
            card.content[0] = { ...card.content[0], value: kpis.readinessRate };
          }
          if (card.content?.[1]) {
            card.content[1] = {
              ...card.content[1],
              text: `${kpis.activeHeroes} de ${kpis.totalHeroes} heróis prontos para ação`,
            };
          }
          return {
            ...w,
            definition: {
              ...w.definition,
              inputs: {
                ...w.definition.inputs,
                context: { progressValue: kpis.readinessRate },
                document: {
                  ...w.definition.inputs['document'],
                  nodes: [card],
                },
              },
            },
          };
        }

        if (w.key === 'kpiMissoes' && w.definition?.inputs?.['document']?.nodes?.[0]) {
          const card = { ...w.definition.inputs['document'].nodes[0] };
          card.title = `${kpis.plannedMissions} Planejadas`;
          card.subtitle = 'Missões Operacionais';
          if (card.header?.[0]?.items?.[1]) {
            card.header[0].items[1] = {
              ...card.header[0].items[1],
              label: `${kpis.inProgressMissions < 10 ? '0' : ''}${kpis.inProgressMissions} Em Curso`,
            };
          }
          const percent = Math.min(100, Math.round((kpis.inProgressMissions / Math.max(1, kpis.totalMissions)) * 100));
          if (card.content?.[0]) {
            card.content[0] = { ...card.content[0], value: percent };
          }
          if (card.content?.[1]) {
            card.content[1] = {
              ...card.content[1],
              text: `${kpis.totalMissions} missões catalogadas no radar tático`,
            };
          }
          return {
            ...w,
            definition: {
              ...w.definition,
              inputs: {
                ...w.definition.inputs,
                context: { progressValue: percent },
                document: {
                  ...w.definition.inputs['document'],
                  nodes: [card],
                },
              },
            },
          };
        }

        if (w.key === 'kpiFolha' && w.definition?.inputs?.['document']?.nodes?.[0]) {
          const card = { ...w.definition.inputs['document'].nodes[0] };
          card.title = `R$ ${kpis.latestPayrollNetMillion} M`;
          card.subtitle = 'Execução da Folha';
          if (card.header?.[0]?.items?.[1]) {
            card.header[0].items[1] = { ...card.header[0].items[1], label: kpis.latestPayrollMonth };
          }
          if (card.content?.[1]) {
            card.content[1] = {
              ...card.content[1],
              text: `Folha de ${kpis.latestPayrollEmployees} colaboradores auditados`,
            };
          }
          return {
            ...w,
            definition: {
              ...w.definition,
              inputs: {
                ...w.definition.inputs,
                document: {
                  ...w.definition.inputs['document'],
                  nodes: [card],
                },
              },
            },
          };
        }

        if (w.key === 'kpiRiscos' && w.definition?.inputs?.['document']?.nodes?.[0]) {
          const card = { ...w.definition.inputs['document'].nodes[0] };
          card.title = `${kpis.criticalIncidents < 10 ? '0' : ''}${kpis.criticalIncidents} Críticos`;
          card.subtitle = 'Ameaças & Incidentes';
          if (card.header?.[0]?.items?.[1]) {
            card.header[0].items[1] = { ...card.header[0].items[1], label: `${kpis.totalIncidents} Incidentes` };
          }
          const percent = Math.min(100, Math.round((kpis.criticalIncidents / Math.max(1, kpis.totalIncidents)) * 100));
          if (card.content?.[0]) {
            card.content[0] = { ...card.content[0], value: percent };
          }
          if (card.content?.[1]) {
            card.content[1] = {
              ...card.content[1],
              text: `${kpis.highIncidents} ocorrências de severidade alta em contenção`,
            };
          }
          return {
            ...w,
            definition: {
              ...w.definition,
              inputs: {
                ...w.definition.inputs,
                context: { progressValue: percent },
                document: {
                  ...w.definition.inputs['document'],
                  nodes: [card],
                },
              },
            },
          };
        }

        return w;
      }),
    };
  }

  private injectHostCapabilities(def: WidgetPageDefinition): WidgetPageDefinition {
    return {
      ...def,
      widgets: (def.widgets || []).map((w) => {
        if (w.definition?.id === 'praxis-rich-content') {
          return {
            ...w,
            definition: {
              ...w.definition,
              inputs: {
                ...(w.definition.inputs || {}),
                hostCapabilities: this.hostCapabilities,
              },
            },
          };
        }
        return w;
      }),
    };
  }

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
