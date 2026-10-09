import { Routes } from '@angular/router';
import { HEROES_CRUD_METADATA } from './pages/rh/funcionarios.config';
import { FOLHA_PAGAMENTO_CRUD_METADATA } from './pages/rh/folha-pagamento.config';
import { AFASTAMENTOS_CRUD_METADATA } from './pages/rh/afastamentos.config';
import { DEPARTAMENTOS_CRUD_METADATA } from './pages/rh/departamentos.config';
import { REPUTACAO_CRUD_METADATA } from './pages/rh/reputacao.config';
import { MISSOES_CRUD_METADATA } from './pages/operacoes/missoes.config';
import { EQUIPES_CRUD_METADATA } from './pages/operacoes/equipes.config';
import { BASES_CRUD_METADATA } from './pages/operacoes/bases.config';
import { INCIDENTES_CRUD_METADATA } from './pages/operacoes/incidentes.config';
import { EQUIPAMENTOS_CRUD_METADATA } from './pages/ativos/equipamentos.config';
import { VEICULOS_CRUD_METADATA } from './pages/ativos/veiculos.config';
import { CONTRATOS_CRUD_METADATA } from './pages/suprimentos/contratos.config';
import { PEDIDOS_CRUD_METADATA } from './pages/suprimentos/pedidos.config';
import { AMEACAS_CRUD_METADATA } from './pages/risco/ameacas.config';
import { INDICADORES_CRUD_METADATA } from './pages/risco/indicadores.config';

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
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'rh/funcionarios',
      title: 'Heróis & Colaboradores',
      subtitle: 'Gestão centralizada do quadro de heróis e colaboradores.',
      domain: {
        label: 'Pessoas & Recursos Humanos',
        icon: 'group',
        tone: 'rh',
      },
      metadata: HEROES_CRUD_METADATA,
    },
    title: 'Praxis Hero HQ | Heróis & Colaboradores',
  },
  {
    path: 'rh/folha-pagamento',
    loadComponent: () =>
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'rh/folha-pagamento',
      title: 'Folha de Pagamento',
      subtitle: 'Processamento de remunerações, eventos e pagamentos.',
      domain: {
        label: 'Pessoas & Recursos Humanos',
        icon: 'payments',
        tone: 'rh',
      },
      metadata: FOLHA_PAGAMENTO_CRUD_METADATA,
    },
    title: 'Praxis Hero HQ | Folha de Pagamento',
  },
  {
    path: 'rh/afastamentos',
    loadComponent: () =>
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'rh/afastamentos',
      title: 'Férias & Afastamentos',
      subtitle: 'Controle de disponibilidade, férias e afastamentos da força.',
      domain: {
        label: 'Pessoas & Recursos Humanos',
        icon: 'event_busy',
        tone: 'rh',
      },
      metadata: AFASTAMENTOS_CRUD_METADATA,
    },
    title: 'Praxis Hero HQ | Férias & Afastamentos',
  },
  {
    path: 'rh/cargos-departamentos',
    loadComponent: () =>
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'rh/cargos-departamentos',
      title: 'Cargos & Departamentos',
      subtitle: 'Estrutura organizacional, funções e centros de comando.',
      domain: {
        label: 'Pessoas & Recursos Humanos',
        icon: 'domain',
        tone: 'rh',
      },
      metadata: DEPARTAMENTOS_CRUD_METADATA,
    },
    title: 'Praxis Hero HQ | Cargos & Departamentos',
  },
  {
    path: 'rh/reputacao',
    loadComponent: () =>
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'rh/reputacao',
      title: 'Ranking de Reputação',
      subtitle: 'Análise dos índices públicos e governamentais dos heróis.',
      domain: {
        label: 'Pessoas & Recursos Humanos',
        icon: 'monitoring',
        tone: 'rh',
      },
      metadata: REPUTACAO_CRUD_METADATA,
    },
    title: 'Praxis Hero HQ | Ranking de Reputação',
  },
  {
    path: 'operacoes/missoes',
    loadComponent: () =>
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'operations/missoes',
      title: 'Centro de Missões',
      subtitle: 'Planejamento e acompanhamento de missões em campo.',
      domain: {
        label: 'Operações & Missões Táticas',
        icon: 'military_tech',
        tone: 'operations',
      },
      metadata: MISSOES_CRUD_METADATA,
    },
    title: 'Praxis Hero HQ | Centro de Missões',
  },
  {
    path: 'operacoes/equipes',
    loadComponent: () =>
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'operations/equipes',
      title: 'Equipes & Squads',
      subtitle: 'Formação de equipes táticas e distribuição de competências.',
      domain: {
        label: 'Operações & Missões Táticas',
        icon: 'shield',
        tone: 'operations',
      },
      metadata: EQUIPES_CRUD_METADATA,
    },
    title: 'Praxis Hero HQ | Equipes & Squads',
  },
  {
    path: 'operacoes/bases',
    loadComponent: () =>
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'operations/bases',
      title: 'Bases & Níveis de Acesso',
      subtitle: 'Administração de bases e credenciais de segurança.',
      domain: {
        label: 'Operações & Missões Táticas',
        icon: 'apartment',
        tone: 'operations',
      },
      metadata: BASES_CRUD_METADATA,
    },
    title: 'Praxis Hero HQ | Bases & Acessos',
  },
  {
    path: 'operacoes/incidentes',
    loadComponent: () =>
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'operations/incidentes',
      title: 'Incidentes Táticos',
      subtitle: 'Registro e resposta coordenada a incidentes críticos.',
      domain: {
        label: 'Operações & Missões Táticas',
        icon: 'crisis_alert',
        tone: 'operations',
      },
      metadata: INCIDENTES_CRUD_METADATA,
    },
    title: 'Praxis Hero HQ | Incidentes Táticos',
  },
  {
    path: 'ativos/equipamentos',
    loadComponent: () =>
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'assets/equipamentos',
      title: 'Equipamentos & Armaduras',
      subtitle: 'Inventário, manutenção e alocação de recursos táticos.',
      domain: {
        label: 'Ativos Operacionais',
        icon: 'inventory_2',
        tone: 'assets',
      },
      metadata: EQUIPAMENTOS_CRUD_METADATA,
    },
    title: 'Praxis Hero HQ | Equipamentos & Armaduras',
  },
  {
    path: 'ativos/veiculos',
    loadComponent: () =>
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'assets/veiculos',
      title: 'Frota & Veículos',
      subtitle: 'Disponibilidade e manutenção da frota operacional.',
      domain: {
        label: 'Ativos Operacionais',
        icon: 'directions_car',
        tone: 'assets',
      },
      metadata: VEICULOS_CRUD_METADATA,
    },
    title: 'Praxis Hero HQ | Frota & Veículos',
  },
  {
    path: 'suprimentos/contratos',
    loadComponent: () =>
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'supplies/contratos',
      title: 'Fornecedores & Contratos',
      subtitle:
        'Gestão de parceiros industriais, acordos de nível de serviço, peças de reposição e contratos corporativos.',
      domain: {
        label: 'Suprimentos & Aquisições Estratégicas',
        icon: 'contract',
        tone: 'supplies',
      },
      metadata: CONTRATOS_CRUD_METADATA,
    },
    title: 'Praxis Hero HQ | Fornecedores & Contratos',
  },
  {
    path: 'suprimentos/pedidos',
    loadComponent: () =>
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'supplies/pedidos',
      title: 'Pedidos de Compra & Reposição',
      subtitle:
        'Ordens de fornecimento de ligas de vibranium, propulsores quânticos, tecidos balísticos e insumos de laboratório.',
      domain: {
        label: 'Suprimentos & Logística Tática',
        icon: 'shopping_cart_checkout',
        tone: 'supplies',
      },
      metadata: PEDIDOS_CRUD_METADATA,
      enableCustomization: true,
    },
    title: 'Praxis Hero HQ | Pedidos de Compra',
  },
  {
    path: 'risco/ameacas',
    loadComponent: () =>
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'risk/ameacas',
      title: 'Radar de Ameaças Globais',
      subtitle: 'Monitoramento contínuo de ameaças em escala global.',
      domain: {
        label: 'Inteligência de Risco',
        icon: 'radar',
        tone: 'risk',
      },
      metadata: AMEACAS_CRUD_METADATA,
    },
    title: 'Praxis Hero HQ | Radar de Ameaças',
  },
  {
    path: 'risco/indicadores',
    loadComponent: () =>
      import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    data: {
      resource: 'risk/indicadores',
      title: 'Indicadores & Indenizações',
      subtitle: 'Métricas de risco, impacto e proteção financeira.',
      domain: {
        label: 'Inteligência de Risco',
        icon: 'emergency',
        tone: 'risk',
      },
      metadata: INDICADORES_CRUD_METADATA,
    },
    title: 'Praxis Hero HQ | Indicadores & Indenizações',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
