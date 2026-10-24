import type { Routes } from '@angular/router';
import { HERO_PAGE_GROUPS } from './core/page-definitions';
import { tacticalClearanceGuard } from './core/tactical-clearance.guard';
import { CORPORATE_RUNTIME_PROVIDERS } from './core/corporate-runtime.providers';

export const routes: Routes = [
  {
    path: '', providers: CORPORATE_RUNTIME_PROVIDERS,
    loadComponent: () => import('./pages/corporate-layout/corporate-layout.component').then(m => m.CorporateLayoutComponent),
    children: [
      { path: 'workspace-corporativo', canActivate: [], loadComponent: () => import('./pages/corporate-context/corporate-context-page.component').then(m => m.CorporateContextPageComponent), title: 'Praxis Hero HQ | Workspace corporativo' },
      { path: 'workspace-corporativo/paginas', loadComponent: () => import('./pages/corporate-pages/corporate-pages.component').then(m => m.CorporatePagesComponent), title: 'Praxis Hero HQ | Páginas corporativas' },
      { path: 'workspace-corporativo/grupos', loadComponent: () => import('./pages/corporate-pages/corporate-pages.component').then(m => m.CorporatePagesComponent), data: { corporateGroups: true }, title: 'Praxis Hero HQ | Grupos corporativos' },
      { path: 'pages/:pageId', loadComponent: () => import('./pages/corporate-pages/corporate-pages.component').then(m => m.CorporatePagesComponent), data: { corporatePublished: true }, title: 'Praxis Hero HQ | Página corporativa' },
    ],
  },
  ...HERO_PAGE_GROUPS.flatMap((group) => group.items).filter(item => item.path !== '/workspace-corporativo').map((item) => {
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
  { path: 'laboratorio/paginas/:pageId', loadComponent: () => import('./pages/visitor-lab/visitor-lab-page.component').then((m) => m.VisitorLabPageComponent), title: 'Praxis Hero HQ | Minha página' },
  { path: '**', redirectTo: '' },
];

