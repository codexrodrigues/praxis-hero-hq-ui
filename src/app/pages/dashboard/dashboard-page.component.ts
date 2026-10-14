import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { type PageIdentity } from '@praxisui/core';
import { DynamicPageBuilderComponent } from '@praxisui/page-builder';
import { DASHBOARD_PAGE_DEFINITION } from './dashboard-page.definition';
import { AuthSimulationService } from '../../core/auth-simulation.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [DynamicPageBuilderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-page-wrapper">
      <praxis-dynamic-page-builder
        [page]="pageDefinition"
        [pageIdentity]="pageIdentity()"
        [autoPersist]="true"
        [showGovernanceToolbar]="true"
        governanceToolbarTitle="HQ TACTICAL OPERATIONAL MATRIX"
      />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .dashboard-page-wrapper {
      max-width: 1540px;
      margin: 0 auto;
      width: 100%;
    }
  `],
})
export class DashboardPageComponent {
  private readonly authService = inject(AuthSimulationService);

  protected readonly pageDefinition = DASHBOARD_PAGE_DEFINITION;
  protected readonly pageIdentity = computed<PageIdentity>(() => {
    const persona = this.authService.currentPersona();
    return { appId: 'praxis-hero-hq', tenantId: persona.tenant, userId: persona.id, routePath: '/' };
  });
}
