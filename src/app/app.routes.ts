import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
    title: 'Praxis Hero HQ | Centro de Comando',
  },
  {
    path: 'rh/funcionarios',
    loadComponent: () =>
      import('./pages/rh/funcionarios-page.component').then((m) => m.FuncionariosPageComponent),
    title: 'Praxis Hero HQ | Heróis & Colaboradores',
  },
  {
    path: 'rh/folha-pagamento',
    loadComponent: () =>
      import('./pages/rh/folha-pagamento-page.component').then((m) => m.FolhaPagamentoPageComponent),
    title: 'Praxis Hero HQ | Folha de Pagamento',
  },
  {
    path: 'rh/afastamentos',
    loadComponent: () =>
      import('./pages/shared/resource-hub-page.component').then((m) => m.ResourceHubPageComponent),
    title: 'Praxis Hero HQ | Férias & Afastamentos',
    data: {
      title: 'Férias & Afastamentos',
      description: 'Controle de disponibilidade operacional, férias e licenças táticas.',
      resourcePath: 'human-resources/ferias-afastamentos',
    },
  },
  {
    path: 'rh/cargos-departamentos',
    loadComponent: () =>
      import('./pages/shared/resource-hub-page.component').then((m) => m.ResourceHubPageComponent),
    title: 'Praxis Hero HQ | Cargos & Departamentos',
    data: {
      title: 'Cargos & Departamentos',
      description: 'Estrutura organizacional, divisões táticas e hierarquia de comando.',
      resourcePath: 'human-resources/departamentos',
    },
  },
  {
    path: 'rh/reputacao',
    loadComponent: () =>
      import('./pages/shared/resource-hub-page.component').then((m) => m.ResourceHubPageComponent),
    title: 'Praxis Hero HQ | Ranking de Reputação',
    data: {
      title: 'Ranking de Reputação',
      description: 'Índices públicos de aprovação e governança de heróis.',
      resourcePath: 'human-resources/vw-ranking-reputacao',
    },
  },
  {
    path: 'operacoes/missoes',
    loadComponent: () =>
      import('./pages/operacoes/missoes-page.component').then((m) => m.MissoesPageComponent),
    title: 'Praxis Hero HQ | Centro de Missões',
  },
  {
    path: 'operacoes/equipes',
    loadComponent: () =>
      import('./pages/operacoes/equipes-page.component').then((m) => m.EquipesPageComponent),
    title: 'Praxis Hero HQ | Equipes & Squads',
  },
  {
    path: 'operacoes/bases',
    loadComponent: () =>
      import('./pages/shared/resource-hub-page.component').then((m) => m.ResourceHubPageComponent),
    title: 'Praxis Hero HQ | Bases & Acessos',
    data: {
      title: 'Bases & Acessos',
      description: 'Gestão de instalações táticas, quarentenas e credenciais de segurança.',
      resourcePath: 'operations/bases',
    },
  },
  {
    path: 'operacoes/incidentes',
    loadComponent: () =>
      import('./pages/operacoes/incidentes-page.component').then((m) => m.IncidentesPageComponent),
    title: 'Praxis Hero HQ | Incidentes Táticos',
  },
  {
    path: 'ativos/equipamentos',
    loadComponent: () =>
      import('./pages/ativos/equipamentos-page.component').then((m) => m.EquipamentosPageComponent),
    title: 'Praxis Hero HQ | Equipamentos & Armaduras',
  },
  {
    path: 'ativos/veiculos',
    loadComponent: () =>
      import('./pages/ativos/veiculos-page.component').then((m) => m.VeiculosPageComponent),
    title: 'Praxis Hero HQ | Frota & Veículos',
  },
  {
    path: 'suprimentos/contratos',
    loadComponent: () =>
      import('./pages/suprimentos/contratos-page.component').then((m) => m.ContratosPageComponent),
    title: 'Praxis Hero HQ | Fornecedores & Contratos',
  },
  {
    path: 'suprimentos/pedidos',
    loadComponent: () =>
      import('./pages/shared/resource-hub-page.component').then((m) => m.ResourceHubPageComponent),
    title: 'Praxis Hero HQ | Pedidos de Compra',
    data: {
      title: 'Pedidos de Compra',
      description: 'Aquisição estratégica de insumos, protótipos e suprimentos.',
      resourcePath: 'procurement/purchase-orders',
    },
  },
  {
    path: 'risco/ameacas',
    loadComponent: () =>
      import('./pages/risco/ameacas-page.component').then((m) => m.AmeacasPageComponent),
    title: 'Praxis Hero HQ | Radar de Ameaças',
  },
  {
    path: 'risco/indicadores',
    loadComponent: () =>
      import('./pages/shared/resource-hub-page.component').then((m) => m.ResourceHubPageComponent),
    title: 'Praxis Hero HQ | Indicadores & Indenizações',
    data: {
      title: 'Indicadores & Indenizações',
      description: 'Mitigação de riscos patrimoniais e compensações civis.',
      resourcePath: 'riskintelligence/vw-indicadores-incidentes',
    },
  },
  {
    path: '**',
    redirectTo: '',
  },
];
