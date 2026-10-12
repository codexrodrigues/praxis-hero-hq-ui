import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PraxisDashboardPage } from '@praxisui/page-builder';
import { DASHBOARD_PAGE_DEFINITION } from './dashboard-page.definition';
import { DashboardStatsService } from './dashboard-stats.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [PraxisDashboardPage],
  template: `
    <praxis-dashboard-page
      [pageKey]="'hq-dashboard'"
      [defaultDefinition]="defaultDefinition"
      [context]="dashboardContext()"
      title="HQ TACTICAL OPERATIONAL MATRIX"
      badge="Praxis Page Builder 10.0 · Canvas Governed"
    />
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  protected readonly defaultDefinition = DASHBOARD_PAGE_DEFINITION;
  private readonly statsService = inject(DashboardStatsService);
  private readonly kpis = toSignal(this.statsService.getTacticalKpis(), { initialValue: null });

  protected readonly dashboardContext = computed(() => {
    const k = this.kpis();
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
}
