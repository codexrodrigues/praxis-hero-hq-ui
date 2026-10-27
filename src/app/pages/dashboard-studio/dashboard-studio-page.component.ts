import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { type PageIdentity, type WidgetPageDefinition } from '@praxisui/core';
import { DynamicPageBuilderComponent } from '@praxisui/page-builder';
import { AuthSimulationService } from '../../core/auth-simulation.service';
import { VisitorLabCopyActionComponent } from '../visitor-lab/visitor-lab-copy-action.component';

export const BLANK_STUDIO_PAGE_DEFINITION: WidgetPageDefinition = {
  context: {
    pageId: 'tactical-command-studio',
    title: 'Laboratório Tático (Studio)',
    purpose: 'dashboard',
  },
  layout: {
    orientation: 'columns',
    columns: 12,
    gap: '20px',
  },
  canvas: {
    mode: 'grid',
    columns: 12,
    gap: '20px',
    autoRows: 'content',
    collisionPolicy: 'swap',
    items: {},
  },
  deviceLayouts: {
    tablet: {
      layout: {
        orientation: 'columns',
        columns: 6,
        gap: '16px',
      },
      canvas: {
        columns: 6,
        gap: '16px',
        autoRows: 'content',
        collisionPolicy: 'swap',
        items: {},
      },
    },
    mobile: {
      layout: {
        orientation: 'vertical',
        columns: 1,
        gap: '14px',
      },
      canvas: {
        columns: 1,
        gap: '14px',
        autoRows: 'content',
        collisionPolicy: 'push-down',
        items: {},
      },
    },
  },
  widgets: [],
};

export function createBlankStudioPageDefinition(): WidgetPageDefinition {
  return structuredClone(BLANK_STUDIO_PAGE_DEFINITION);
}

@Component({
  selector: 'app-dashboard-studio-page',
  standalone: true,
  imports: [DynamicPageBuilderComponent, VisitorLabCopyActionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-page-wrapper">
      <app-visitor-lab-copy-action [page]="builder()?.currentPage()" [enabled]="builder()?.canSaveCurrentPage() ?? false" />
      <praxis-dynamic-page-builder
        [page]="pageDefinition"
        [pageIdentity]="pageIdentity()"
        [autoPersist]="true"
[enableCustomization]="true"
        [enableAgenticAuthoring]="true"
        [agenticAuthoringEnableStreaming]="true"
        [showGovernanceToolbar]="false"
      />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .dashboard-page-wrapper {
      max-width: 100%;
      margin: 0 auto;
      width: 100%;
    }
  `],
})
export class DashboardStudioPageComponent {
  protected readonly builder = viewChild(DynamicPageBuilderComponent);
  private readonly authService = inject(AuthSimulationService);

  protected readonly pageDefinition = createBlankStudioPageDefinition();
  protected readonly pageIdentity = computed<PageIdentity>(() => {
    const persona = this.authService.currentPersona();
    return {
      appId: 'praxis-hero-hq',
      tenantId: persona.tenant,
      userId: persona.id,
      routePath: '/comando-studio',
    };
  });
}

