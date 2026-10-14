import { Routes } from '@angular/router';
import type { CrudMetadata } from '@praxisui/crud';
import { tacticalClearanceGuard } from './core/tactical-clearance.guard';

interface ResourceRouteConfig {
  path: string;
  resource: string;
  title: string;
  subtitle: string;
  domain: string;
  icon: string;
  tone: string;
  loadMetadata: () => Promise<CrudMetadata>;
  enableCustomization?: boolean;
  clearance?: 'DEFCON 1' | 'DEFCON 2';
}

const RESOURCE_ROUTES: ResourceRouteConfig[] = [
  {
    path: 'rh/funcionarios',
    resource: 'rh/funcionarios',
    title: 'Heróis & Colaboradores',
    subtitle: 'Gestão centralizada do quadro de heróis e colaboradores.',
    domain: 'Pessoas & Recursos Humanos',
    icon: 'group',
    tone: 'primary',
    loadMetadata: () => import('./pages/rh/funcionarios.config').then((m) => m.HEROES_CRUD_METADATA),
  },
  {
    path: 'rh/folha-pagamento',
    resource: 'rh/folha-pagamento',
    title: 'Folha de Pagamento',
    subtitle: 'Processamento de remunerações, eventos e pagamentos.',
    domain: 'Pessoas & Recursos Humanos',
    icon: 'payments',
    tone: 'primary',
    clearance: 'DEFCON 1',
    loadMetadata: () => import('./pages/rh/folha-pagamento.config').then((m) => m.FOLHA_PAGAMENTO_CRUD_METADATA),
  },
  {
    path: 'rh/eventos-folha',
    resource: 'human-resources/eventos-folha',
    title: 'Eventos de Folha',
    subtitle: 'Rubricas, proventos, descontos e aprovação governada em lote.',
    domain: 'Pessoas & Recursos Humanos',
    icon: 'receipt_long',
    tone: 'primary',
    loadMetadata: () => import('./pages/rh/eventos-folha.config').then((m) => m.EVENTOS_FOLHA_CRUD_METADATA),
  },
  {
    path: 'rh/afastamentos',
    resource: 'rh/afastamentos',
    title: 'Férias & Afastamentos',
    subtitle: 'Controle de disponibilidade, férias e afastamentos da força.',
    domain: 'Pessoas & Recursos Humanos',
    icon: 'event_busy',
    tone: 'primary',
    loadMetadata: () => import('./pages/rh/afastamentos.config').then((m) => m.AFASTAMENTOS_CRUD_METADATA),
  },
  {
    path: 'rh/cargos-departamentos',
    resource: 'rh/cargos-departamentos',
    title: 'Cargos & Departamentos',
    subtitle: 'Estrutura organizacional, funções e centros de comando.',
    domain: 'Pessoas & Recursos Humanos',
    icon: 'domain',
    tone: 'primary',
    loadMetadata: () => import('./pages/rh/departamentos.config').then((m) => m.DEPARTAMENTOS_CRUD_METADATA),
  },
  {
    path: 'rh/reputacao',
    resource: 'rh/reputacao',
    title: 'Ranking de Reputação',
    subtitle: 'Análise dos índices públicos e governamentais dos heróis.',
    domain: 'Pessoas & Recursos Humanos',
    icon: 'monitoring',
    tone: 'primary',
    loadMetadata: () => import('./pages/rh/reputacao.config').then((m) => m.REPUTACAO_CRUD_METADATA),
  },
  {
    path: 'operacoes/missoes',
    resource: 'operations/missoes',
    title: 'Centro de Missões',
    subtitle: 'Planejamento e acompanhamento de missões em campo.',
    domain: 'Operações & Missões Táticas',
    icon: 'military_tech',
    tone: 'info',
    loadMetadata: () => import('./pages/operacoes/missoes.config').then((m) => m.MISSOES_CRUD_METADATA),
  },
  {
    path: 'operacoes/missao-participantes',
    resource: 'operations/missao-participantes',
    title: 'Escala de Missões',
    subtitle: 'Alocação de heróis em missões, papéis táticos e resultados individuais.',
    domain: 'Operações & Missões Táticas',
    icon: 'groups',
    tone: 'info',
    loadMetadata: () =>
      import('./pages/operacoes/missao-participantes.config').then((m) => m.MISSAO_PARTICIPANTES_CRUD_METADATA),
  },
  {
    path: 'operacoes/equipes',
    resource: 'operations/equipes',
    title: 'Equipes & Squads',
    subtitle: 'Formação de equipes táticas e distribuição de competências.',
    domain: 'Operações & Missões Táticas',
    icon: 'shield',
    tone: 'info',
    loadMetadata: () => import('./pages/operacoes/equipes.config').then((m) => m.EQUIPES_CRUD_METADATA),
  },
  {
    path: 'operacoes/bases',
    resource: 'operations/bases',
    title: 'Bases & Níveis de Acesso',
    subtitle: 'Administração de bases e credenciais de segurança.',
    domain: 'Operações & Missões Táticas',
    icon: 'apartment',
    tone: 'info',
    loadMetadata: () => import('./pages/operacoes/bases.config').then((m) => m.BASES_CRUD_METADATA),
  },
  {
    path: 'operacoes/incidentes',
    resource: 'operations/incidentes',
    title: 'Incidentes Táticos',
    subtitle: 'Registro e resposta coordenada a incidentes críticos.',
    domain: 'Operações & Missões Táticas',
    icon: 'crisis_alert',
    tone: 'info',
    loadMetadata: () => import('./pages/operacoes/incidentes.config').then((m) => m.INCIDENTES_CRUD_METADATA),
  },
  {
    path: 'ativos/equipamentos',
    resource: 'assets/equipamentos',
    title: 'Equipamentos & Armaduras',
    subtitle: 'Inventário, manutenção e alocação de recursos táticos.',
    domain: 'Ativos Operacionais',
    icon: 'inventory_2',
    tone: 'neutral',
    loadMetadata: () => import('./pages/ativos/equipamentos.config').then((m) => m.EQUIPAMENTOS_CRUD_METADATA),
  },
  {
    path: 'ativos/veiculos',
    resource: 'assets/veiculos',
    title: 'Frota & Veículos',
    subtitle: 'Disponibilidade e manutenção da frota operacional.',
    domain: 'Ativos Operacionais',
    icon: 'directions_car',
    tone: 'neutral',
    loadMetadata: () => import('./pages/ativos/veiculos.config').then((m) => m.VEICULOS_CRUD_METADATA),
  },
  {
    path: 'suprimentos/contratos',
    resource: 'supplies/contratos',
    title: 'Fornecedores & Contratos',
    subtitle:
      'Gestão de parceiros industriais, acordos de nível de serviço, peças de reposição e contratos corporativos.',
    domain: 'Suprimentos & Aquisições Estratégicas',
    icon: 'contract',
    tone: 'warning',
    clearance: 'DEFCON 1',
    loadMetadata: () => import('./pages/suprimentos/contratos.config').then((m) => m.CONTRATOS_CRUD_METADATA),
  },
  {
    path: 'suprimentos/pedidos',
    resource: 'supplies/pedidos',
    title: 'Pedidos de Compra & Reposição',
    subtitle:
      'Ordens de fornecimento de ligas de vibranium, propulsores quânticos, tecidos balísticos e insumos de laboratório.',
    domain: 'Suprimentos & Logística Tática',
    icon: 'shopping_cart_checkout',
    tone: 'warning',
    enableCustomization: true,
    loadMetadata: () => import('./pages/suprimentos/pedidos.config').then((m) => m.PEDIDOS_CRUD_METADATA),
  },
  {
    path: 'risco/ameacas',
    resource: 'risk/ameacas',
    title: 'Radar de Ameaças Globais',
    subtitle: 'Monitoramento contínuo de ameaças em escala global.',
    domain: 'Inteligência de Risco',
    icon: 'radar',
    tone: 'danger',
    loadMetadata: () => import('./pages/risco/ameacas.config').then((m) => m.AMEACAS_CRUD_METADATA),
  },
  {
    path: 'risco/indicadores',
    resource: 'risk/indicadores',
    title: 'Indicadores & Indenizações',
    subtitle: 'Métricas de risco, impacto e proteção financeira.',
    domain: 'Inteligência de Risco',
    icon: 'emergency',
    tone: 'danger',
    loadMetadata: () => import('./pages/risco/indicadores.config').then((m) => m.INDICADORES_CRUD_METADATA),
  },
];

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
    title: 'Praxis Hero HQ | Centro de Comando',
  },
  ...RESOURCE_ROUTES.map((r) => ({
    path: r.path,
    loadComponent: () => import('@praxisui/crud').then((m) => m.PraxisResourcePage),
    canActivate: r.clearance ? [tacticalClearanceGuard] : [],
    resolve: {
      metadata: () => r.loadMetadata(),
    },
    data: {
      resource: r.resource,
      title: r.title,
      subtitle: r.subtitle,
      domain: {
        label: r.domain,
        icon: r.icon,
        tone: r.tone,
      },
      ...(r.clearance ? { clearance: r.clearance } : {}),
      ...(r.enableCustomization ? { enableCustomization: true } : {}),
    },
    title: `Praxis Hero HQ | ${r.title}`,
  })),
  {
    path: '**',
    redirectTo: '',
  },
];
