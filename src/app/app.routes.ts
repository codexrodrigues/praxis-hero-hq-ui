import type { Routes } from '@angular/router';
import { HERO_PAGE_GROUPS } from './core/page-definitions';
import { tacticalClearanceGuard } from './core/tactical-clearance.guard';

export const routes: Routes = [
  ...HERO_PAGE_GROUPS.flatMap((group) => group.items).map((item) => {
    const page = item.page;
    const routePath = item.path.replace(/^\//, '');
    const access = {
      canActivate: item.clearance ? [tacticalClearanceGuard] : [],
      data: item.clearance ? { clearance: item.clearance } : {},
    };
    if (page.kind === 'component') {
      return {
        ...access,
        path: routePath,
        loadComponent: page.loadComponent,
        title: page.title,
        data: { ...access.data, title: page.title },
      };
    }
    const title = page.title !== undefined ? page.title : item.label;
    const subtitle = page.subtitle !== undefined ? page.subtitle : item.description;
    return {
      path: routePath,
      loadComponent: () => import('@praxisui/crud').then((m) => m.PraxisResourcePage),
      canActivate: access.canActivate,
      resolve: { metadata: () => page.loadMetadata() },
      data: {
        resource: page.resource,
        ...(page.crudId ? { crudId: page.crudId } : {}),
        title: title || null,
        subtitle: subtitle || null,
        domain: page.domain ? { ...page.domain, icon: page.icon ?? item.icon } : null,
        ...access.data,
      },
      title: `Praxis Hero HQ | ${title || item.label}`,
    };
  }),
  { path: '**', redirectTo: '' },
];

