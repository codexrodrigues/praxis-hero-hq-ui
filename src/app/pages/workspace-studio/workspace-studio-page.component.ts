import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { type PageIdentity, type WidgetPageDefinition } from '@praxisui/core';
import { DynamicPageBuilderComponent } from '@praxisui/page-builder';
import { AuthSimulationService } from '../../core/auth-simulation.service';

export const BLANK_WORKSPACE_STUDIO_PAGE_DEFINITION: WidgetPageDefinition = {
  context: {
    pageId: 'workspace-studio-page',
    title: 'Workspace de Recurso (Studio)',
    purpose: 'resource',
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

export function createBlankWorkspaceStudioPageDefinition(): WidgetPageDefinition {
  return structuredClone(BLANK_WORKSPACE_STUDIO_PAGE_DEFINITION);
}

@Component({
  selector: 'app-workspace-studio-page',
  standalone: true,
  imports: [DynamicPageBuilderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="workspace-studio-page-wrapper">
      <praxis-dynamic-page-builder
        [page]="pageDefinition"
        [pageIdentity]="pageIdentity()"
        [autoPersist]="true"
        [showGovernanceToolbar]="false"
      />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .workspace-studio-page-wrapper {
      max-width: 1540px;
      margin: 0 auto;
      width: 100%;
    }
  `],
})
export class WorkspaceStudioPageComponent {
  private readonly authService = inject(AuthSimulationService);

  protected readonly pageDefinition = createBlankWorkspaceStudioPageDefinition();
  protected readonly pageIdentity = computed<PageIdentity>(() => {
    const persona = this.authService.currentPersona();
    return {
      appId: 'praxis-hero-hq',
      tenantId: persona.tenant,
      userId: persona.id,
      routePath: '/workspace-studio',
    };
  });
}
