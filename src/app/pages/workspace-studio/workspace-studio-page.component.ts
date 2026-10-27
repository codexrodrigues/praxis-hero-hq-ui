import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import {
  GlobalConfigService,
  type GlobalDynamicPagesDefaultsConfig,
  type PageIdentity,
  type WidgetPageDefinition,
} from '@praxisui/core';
import { DynamicPageBuilderComponent } from '@praxisui/page-builder';
import { AuthSimulationService } from '../../core/auth-simulation.service';
import { VisitorLabCopyActionComponent } from '../visitor-lab/visitor-lab-copy-action.component';

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

export function createBlankWorkspaceStudioPageDefinition(
  defaults?: GlobalDynamicPagesDefaultsConfig,
): WidgetPageDefinition {
  const base = structuredClone(BLANK_WORKSPACE_STUDIO_PAGE_DEFINITION);
  if (!defaults) {
    return base;
  }
  const columns =
    typeof defaults.columns === 'number' && Number.isFinite(defaults.columns)
      ? Math.max(1, Math.min(12, Math.round(defaults.columns)))
      : undefined;
  const gap = defaults.gap?.trim() || undefined;
  const autoRows = defaults.autoRows;

  return {
    ...base,
    layout: {
      ...base.layout,
      ...(columns ? { columns } : {}),
      ...(gap ? { gap } : {}),
    },
    canvas: base.canvas
      ? {
          ...base.canvas,
          ...(columns ? { columns } : {}),
          ...(gap ? { gap } : {}),
          ...(autoRows ? { autoRows } : {}),
        }
      : undefined,
  };
}

@Component({
  selector: 'app-workspace-studio-page',
  standalone: true,
  imports: [DynamicPageBuilderComponent, VisitorLabCopyActionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="workspace-studio-page-wrapper">
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

    .workspace-studio-page-wrapper {
      max-width: 100%;
      margin: 0 auto;
      width: 100%;
    }
  `],
})
export class WorkspaceStudioPageComponent {
  protected readonly builder = viewChild(DynamicPageBuilderComponent);
  private readonly authService = inject(AuthSimulationService);
  private readonly globalConfig = inject(GlobalConfigService, { optional: true });

  protected readonly pageDefinition = createBlankWorkspaceStudioPageDefinition(
    this.globalConfig?.getPages()?.defaults,
  );
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
