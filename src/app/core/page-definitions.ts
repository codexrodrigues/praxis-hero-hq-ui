import type { Type } from '@angular/core';
import type { PraxisNavItem } from '@praxisui/core';
import type { CrudMetadata } from '@praxisui/crud';
import type { TacticalClearance } from './tactical-access';

export interface HeroNavItem extends PraxisNavItem {
  readonly description: string;
  readonly clearance?: TacticalClearance;
}

interface ResourcePage {
  readonly kind: 'resource';
  readonly resource: string;
  readonly crudId?: string;
  readonly domain?: { readonly label: string; readonly tone: string };
  readonly title?: string;
  readonly subtitle?: string;
  readonly icon?: string;
  readonly loadMetadata: () => Promise<CrudMetadata>;
}

interface ComponentPage {
  readonly kind: 'component';
  readonly title: string;
  readonly loadComponent: () => Promise<Type<unknown>>;
}

export interface HeroPageDefinition extends HeroNavItem {
  readonly path: string;
  readonly page: ResourcePage | ComponentPage;
}

export interface HeroPageGroup {
  readonly label: string;
  readonly domainKey: 'overview' | 'rh' | 'operations' | 'assets' | 'supplies' | 'risk';
  readonly items: HeroPageDefinition[];
}

/** Product navigation and page bindings. Resource semantics remain owned by backend metadata. */
export const HERO_PAGE_GROUPS: HeroPageGroup[] = [
  {
    label: 'Visão Geral',
    domainKey: 'overview',
    items: [
      {
        label: 'Dashboard Executivo',
        path: '/',
        icon: 'dashboard',
        description: 'Indicadores estratégicos e prontidão operacional em uma visão unificada.',
        page: {
          kind: 'component',
          title: 'Praxis Hero HQ | Centro de Comando',
          loadComponent: () =>
            import('../pages/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
        },
      },
      {
        label: 'Laboratório Tático (Studio)',
        path: '/comando-studio',
        icon: 'space_dashboard',
        description: 'Dashboard tático construído 100% em tempo real via Page Builder sem deploy.',
        badge: 'STUDIO',
        badgeTone: 'info',
        page: {
          kind: 'component',
          title: 'Praxis Hero HQ | Laboratório Tático (Studio)',
          loadComponent: () =>
            import('../pages/dashboard-studio/dashboard-studio-page.component').then(
              (m) => m.DashboardStudioPageComponent,
            ),
        },
      },
      {
        label: 'Workspace de Recurso (Studio)',
        path: '/workspace-studio',
        icon: 'table_chart',
        description: 'Workspace corporativo de recurso construído a partir de página em branco no Page Builder, sem código e sem deploy.',
        badge: 'STUDIO',
        badgeTone: 'info',
        page: {
          kind: 'component',
          title: 'Praxis Hero HQ | Workspace de Recurso (Studio)',
          loadComponent: () =>
            import('../pages/workspace-studio/workspace-studio-page.component').then(
              (m) => m.WorkspaceStudioPageComponent,
            ),
        },
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
        page: {
          kind: 'resource',
          resource: 'human-resources/funcionarios',
          domain: { label: 'Pessoas & Recursos Humanos', tone: 'primary' },
          loadMetadata: () => import('../pages/rh/funcionarios.config').then((m) => m.HEROES_CRUD_METADATA),
        },
      },
      {
        label: 'Folha de Pagamento',
        path: '/rh/folha-pagamento',
        icon: 'payments',
        description: 'Processamento de remunerações, eventos e pagamentos.',
        clearance: 'DEFCON 1',
        page: {
          kind: 'resource',
          resource: 'human-resources/folhas-pagamento',
          domain: { label: 'Pessoas & Recursos Humanos', tone: 'primary' },
          loadMetadata: () => import('../pages/rh/folha-pagamento.config').then((m) => m.FOLHA_PAGAMENTO_CRUD_METADATA),
        },
      },
      {
        label: 'Eventos de Folha',
        path: '/rh/eventos-folha',
        icon: 'receipt_long',
        description: 'Rubricas, proventos, descontos e aprovação governada em lote.',
        page: {
          kind: 'resource',
          resource: 'human-resources/eventos-folha',
          domain: { label: 'Pessoas & Recursos Humanos', tone: 'primary' },
          loadMetadata: () => import('../pages/rh/eventos-folha.config').then((m) => m.EVENTOS_FOLHA_CRUD_METADATA),
        },
      },
      {
        label: 'Férias & Afastamentos',
        path: '/rh/afastamentos',
        icon: 'event_busy',
        description: 'Controle de disponibilidade, férias e afastamentos da força.',
        page: {
          kind: 'resource',
          resource: 'human-resources/ferias-afastamentos',
          domain: { label: 'Pessoas & Recursos Humanos', tone: 'primary' },
          loadMetadata: () => import('../pages/rh/afastamentos.config').then((m) => m.AFASTAMENTOS_CRUD_METADATA),
        },
      },
      {
        label: 'Cargos & Departamentos',
        path: '/rh/cargos-departamentos',
        icon: 'domain',
        description: 'Estrutura organizacional, funções e centros de comando.',
        page: {
          kind: 'resource',
          resource: 'human-resources/departamentos',
          domain: { label: 'Pessoas & Recursos Humanos', tone: 'primary' },
          loadMetadata: () => import('../pages/rh/departamentos.config').then((m) => m.DEPARTAMENTOS_CRUD_METADATA),
        },
      },
      {
        label: 'Ranking de Reputação',
        path: '/rh/reputacao',
        icon: 'monitoring',
        description: 'Análise dos índices públicos e governamentais dos heróis.',
        page: {
          kind: 'resource',
          resource: 'human-resources/vw-ranking-reputacao',
          domain: { label: 'Pessoas & Recursos Humanos', tone: 'primary' },
          loadMetadata: () => import('../pages/rh/reputacao.config').then((m) => m.REPUTACAO_CRUD_METADATA),
        },
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
        page: {
          kind: 'resource',
          resource: 'operations/missoes',
          domain: { label: 'Operações & Missões Táticas', tone: 'info' },
          loadMetadata: () => import('../pages/operacoes/missoes.config').then((m) => m.MISSOES_CRUD_METADATA),
        },
      },
      {
        label: 'Escala de Missões',
        path: '/operacoes/missao-participantes',
        icon: 'groups',
        description: 'Alocação de heróis em missões, papéis táticos e resultados individuais.',
        page: {
          kind: 'resource',
          resource: 'operations/missao-participantes',
          domain: { label: 'Operações & Missões Táticas', tone: 'info' },
          loadMetadata: () =>
            import('../pages/operacoes/missao-participantes.config').then((m) => m.MISSAO_PARTICIPANTES_CRUD_METADATA),
        },
      },
      {
        label: 'Equipes & Squads',
        path: '/operacoes/equipes',
        icon: 'shield',
        description: 'Formação de equipes táticas e distribuição de competências.',
        page: {
          kind: 'resource',
          resource: 'operations/equipes',
          domain: { label: 'Operações & Missões Táticas', tone: 'info' },
          loadMetadata: () => import('../pages/operacoes/equipes.config').then((m) => m.EQUIPES_CRUD_METADATA),
        },
      },
      {
        label: 'Bases & Níveis de Acesso',
        path: '/operacoes/bases',
        icon: 'apartment',
        description: 'Administração de bases e credenciais de segurança.',
        page: {
          kind: 'resource',
          resource: 'operations/bases',
          domain: { label: 'Operações & Missões Táticas', tone: 'info' },
          loadMetadata: () => import('../pages/operacoes/bases.config').then((m) => m.BASES_CRUD_METADATA),
        },
      },
      {
        label: 'Incidentes Táticos',
        path: '/operacoes/incidentes',
        icon: 'crisis_alert',
        description: 'Registro e resposta coordenada a incidentes críticos.',
        page: {
          kind: 'resource',
          resource: 'operations/incidentes',
          domain: { label: 'Operações & Missões Táticas', tone: 'info' },
          loadMetadata: () => import('../pages/operacoes/incidentes.config').then((m) => m.INCIDENTES_CRUD_METADATA),
        },
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
        page: {
          kind: 'resource',
          resource: 'assets/equipamentos',
          domain: { label: 'Ativos Operacionais', tone: 'neutral' },
          loadMetadata: () => import('../pages/ativos/equipamentos.config').then((m) => m.EQUIPAMENTOS_CRUD_METADATA),
        },
      },
      {
        label: 'Frota & Veículos',
        path: '/ativos/veiculos',
        icon: 'directions_car',
        description: 'Disponibilidade e manutenção da frota operacional.',
        page: {
          kind: 'resource',
          resource: 'assets/veiculos',
          domain: { label: 'Ativos Operacionais', tone: 'neutral' },
          loadMetadata: () => import('../pages/ativos/veiculos.config').then((m) => m.VEICULOS_CRUD_METADATA),
        },
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
        clearance: 'DEFCON 1',
        page: {
          kind: 'resource',
          resource: 'procurement/contracts',
          domain: { label: 'Suprimentos & Aquisições Estratégicas', tone: 'warning' },
          subtitle: 'Gestão de parceiros industriais, acordos de nível de serviço, peças de reposição e contratos corporativos.',
          loadMetadata: () => import('../pages/suprimentos/contratos.config').then((m) => m.CONTRATOS_CRUD_METADATA),
        },
      },
      {
        label: 'Pedidos de Compra',
        path: '/suprimentos/pedidos',
        icon: 'shopping_cart',
        description: 'Fluxo de requisições e aquisições estratégicas.',
        page: {
          kind: 'resource',
          resource: 'procurement/purchase-orders',
          domain: { label: 'Suprimentos & Logística Tática', tone: 'warning' },
          title: 'Pedidos de Compra & Reposição',
          subtitle: 'Ordens de fornecimento de ligas de vibranium, propulsores quânticos, tecidos balísticos e insumos de laboratório.',
          icon: 'shopping_cart_checkout',
          loadMetadata: () => import('../pages/suprimentos/pedidos.config').then((m) => m.PEDIDOS_CRUD_METADATA),
        },
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
        page: {
          kind: 'resource',
          resource: 'risk-intelligence/ameacas',
          domain: { label: 'Inteligência de Risco', tone: 'danger' },
          loadMetadata: () => import('../pages/risco/ameacas.config').then((m) => m.AMEACAS_CRUD_METADATA),
        },
      },
      {
        label: 'Indicadores & Indenizações',
        path: '/risco/indicadores',
        icon: 'emergency',
        description: 'Métricas de risco, impacto e proteção financeira.',
        page: {
          kind: 'resource',
          resource: 'risk-intelligence/vw-indicadores-incidentes',
          domain: { label: 'Inteligência de Risco', tone: 'danger' },
          loadMetadata: () => import('../pages/risco/indicadores.config').then((m) => m.INDICADORES_CRUD_METADATA),
        },
      },
    ],
  },
];

