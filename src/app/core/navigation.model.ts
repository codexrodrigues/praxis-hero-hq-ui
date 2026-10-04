export interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
  readonly description: string;
}

export interface NavGroup {
  readonly label: string;
  readonly domainKey: 'overview' | 'rh' | 'operations' | 'assets' | 'supplies' | 'risk';
  readonly items: readonly NavItem[];
}

export const HERO_NAVIGATION: readonly NavGroup[] = [
  {
    label: 'Visão Geral',
    domainKey: 'overview',
    items: [
      {
        label: 'Dashboard Executivo',
        path: '/',
        icon: 'dashboard',
        description: 'Indicadores estratégicos e prontidão operacional em uma visão unificada.',
      },
    ],
  },
  {
    label: 'Pessoas & RH',
    domainKey: 'rh',
    items: [
      {
        label: 'Heróis & Colaboradores',
        path: '/rh/funcionarios',
        icon: 'group',
        description: 'Gestão centralizada do quadro de heróis e colaboradores.',
      },
      {
        label: 'Folha de Pagamento',
        path: '/rh/folha-pagamento',
        icon: 'payments',
        description: 'Processamento de remunerações, eventos e pagamentos.',
      },
      {
        label: 'Férias & Afastamentos',
        path: '/rh/afastamentos',
        icon: 'event_busy',
        description: 'Controle de disponibilidade, férias e afastamentos da força.',
      },
      {
        label: 'Cargos & Departamentos',
        path: '/rh/cargos-departamentos',
        icon: 'domain',
        description: 'Estrutura organizacional, funções e centros de comando.',
      },
      {
        label: 'Ranking de Reputação',
        path: '/rh/reputacao',
        icon: 'monitoring',
        description: 'Análise dos índices públicos e governamentais dos heróis.',
      },
    ],
  },
  {
    label: 'Operações & Missões',
    domainKey: 'operations',
    items: [
      {
        label: 'Centro de Missões',
        path: '/operacoes/missoes',
        icon: 'military_tech',
        description: 'Planejamento e acompanhamento de missões em campo.',
      },
      {
        label: 'Equipes & Squads',
        path: '/operacoes/equipes',
        icon: 'shield',
        description: 'Formação de equipes táticas e distribuição de competências.',
      },
      {
        label: 'Bases & Níveis de Acesso',
        path: '/operacoes/bases',
        icon: 'apartment',
        description: 'Administração de bases e credenciais de segurança.',
      },
      {
        label: 'Incidentes Táticos',
        path: '/operacoes/incidentes',
        icon: 'crisis_alert',
        description: 'Registro e resposta coordenada a incidentes críticos.',
      },
    ],
  },
  {
    label: 'Ativos Operacionais',
    domainKey: 'assets',
    items: [
      {
        label: 'Equipamentos & Armaduras',
        path: '/ativos/equipamentos',
        icon: 'inventory_2',
        description: 'Inventário, manutenção e alocação de recursos táticos.',
      },
      {
        label: 'Frota & Veículos',
        path: '/ativos/veiculos',
        icon: 'directions_car',
        description: 'Disponibilidade e manutenção da frota operacional.',
      },
    ],
  },
  {
    label: 'Suprimentos',
    domainKey: 'supplies',
    items: [
      {
        label: 'Fornecedores & Contratos',
        path: '/suprimentos/contratos',
        icon: 'contract',
        description: 'Gestão de parceiros, contratos e níveis de serviço.',
      },
      {
        label: 'Pedidos de Compra',
        path: '/suprimentos/pedidos',
        icon: 'shopping_cart',
        description: 'Fluxo de requisições e aquisições estratégicas.',
      },
    ],
  },
  {
    label: 'Inteligência de Risco',
    domainKey: 'risk',
    items: [
      {
        label: 'Radar de Ameaças Globais',
        path: '/risco/ameacas',
        icon: 'radar',
        description: 'Monitoramento contínuo de ameaças em escala global.',
      },
      {
        label: 'Indicadores & Indenizações',
        path: '/risco/indicadores',
        icon: 'emergency',
        description: 'Métricas de risco, impacto e proteção financeira.',
      },
    ],
  },
];

export const ALL_NAV_ITEMS: readonly NavItem[] = HERO_NAVIGATION.flatMap((group) => group.items);
