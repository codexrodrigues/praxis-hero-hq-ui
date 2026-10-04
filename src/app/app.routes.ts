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
      import('./pages/shared/resource-hub-page.component').then((m) => m.ResourceHubPageComponent),
    title: 'Praxis Hero HQ | Folha de Pagamento',
    data: {
      title: 'Folha de Pagamento',
      description: 'Processamento de remunerações, eventos mensais e aprovação de pagamentos.',
      resourcePath: 'human-resources/folhas-pagamento',
    },
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
      import('./pages/shared/resource-hub-page.component').then((m) => m.ResourceHubPageComponent),
    title: 'Praxis Hero HQ | Centro de Missões',
    data: {
      title: 'Centro de Missões',
      description: 'Despacho operacional, planejamento de incursões e relatórios de campo.',
      resourcePath: 'operations/missoes',
    },
  },
  {
    path: 'operacoes/equipes',
    loadComponent: () =>
      import('./pages/shared/resource-hub-page.component').then((m) => m.ResourceHubPageComponent),
    title: 'Praxis Hero HQ | Equipes & Squads',
    data: {
      title: 'Equipes & Squads',
      description: 'Composição de forças operacionais, sinergia e lideranças.',
      resourcePath: 'operations/equipes',
    },
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
      import('./pages/shared/resource-hub-page.component').then((m) => m.ResourceHubPageComponent),
    title: 'Praxis Hero HQ | Incidentes Táticos',
    data: {
      title: 'Incidentes Táticos',
      description: 'Registro de sinistros em combate, danos urbanos e resposta coordenada.',
      resourcePath: 'operations/incidentes',
    },
  },
  {
    path: 'ativos/equipamentos',
    loadComponent: () =>
      import('./pages/shared/resource-hub-page.component').then((m) => m.ResourceHubPageComponent),
    title: 'Praxis Hero HQ | Equipamentos & Armaduras',
    data: {
      title: 'Equipamentos & Armaduras',
      description: 'Inventário, trajes de combate e manutenções em laboratório.',
      resourcePath: 'operationalassets/equipamentos',
    },
  },
  {
    path: 'ativos/veiculos',
    loadComponent: () =>
      import('./pages/shared/resource-hub-page.component').then((m) => m.ResourceHubPageComponent),
    title: 'Praxis Hero HQ | Frota & Veículos',
    data: {
      title: 'Frota & Veículos',
      description: 'Aeronaves, veículos terrestres e navais para mobilização rápida.',
      resourcePath: 'operationalassets/veiculos',
    },
  },
  {
    path: 'suprimentos/contratos',
    loadComponent: () =>
      import('./pages/shared/resource-hub-page.component').then((m) => m.ResourceHubPageComponent),
    title: 'Praxis Hero HQ | Fornecedores & Contratos',
    data: {
      title: 'Fornecedores & Contratos',
      description: 'Parcerias com indústrias bélicas, tecnologia e logística.',
      resourcePath: 'procurement/contracts',
    },
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
      import('./pages/shared/resource-hub-page.component').then((m) => m.ResourceHubPageComponent),
    title: 'Praxis Hero HQ | Radar de Ameaças',
    data: {
      title: 'Radar de Ameaças Globais',
      description: 'Detecção antecipada de vilões, mutações e anomalias cósmicas.',
      resourcePath: 'riskintelligence/ameacas',
    },
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
