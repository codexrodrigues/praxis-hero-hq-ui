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

interface ResourceRouteConfig {
  path: string;
  resource: string;
  title: string;
  subtitle: string;
  domain: string;
  icon: string;
  tone: string;
  metadata: any;
  enableCustomization?: boolean;
}

const RESOURCE_ROUTES: ResourceRouteConfig[] = [
  {
    path: 'rh/funcionarios',
    resource: 'rh/funcionarios',
    title: 'Heróis & Colaboradores',
    subtitle: 'Gestão centralizada do quadro de heróis e colaboradores.',
    domain: 'Pessoas & Recursos Humanos',
    icon: 'group',
    tone: 'rh',
    metadata: HEROES_CRUD_METADATA,
  },
  {
    path: 'rh/folha-pagamento',
    resource: 'rh/folha-pagamento',
    title: 'Folha de Pagamento',
    subtitle: 'Processamento de remunerações, eventos e pagamentos.',
    domain: 'Pessoas & Recursos Humanos',
    icon: 'payments',
    tone: 'rh',
    metadata: FOLHA_PAGAMENTO_CRUD_METADATA,
  },
  {
    path: 'rh/afastamentos',
    resource: 'rh/afastamentos',
    title: 'Férias & Afastamentos',
    subtitle: 'Controle de disponibilidade, férias e afastamentos da força.',
    domain: 'Pessoas & Recursos Humanos',
    icon: 'event_busy',
    tone: 'rh',
    metadata: AFASTAMENTOS_CRUD_METADATA,
  },
  {
    path: 'rh/cargos-departamentos',
    resource: 'rh/cargos-departamentos',
    title: 'Cargos & Departamentos',
    subtitle: 'Estrutura organizacional, funções e centros de comando.',
    domain: 'Pessoas & Recursos Humanos',
    icon: 'domain',
    tone: 'rh',
    metadata: DEPARTAMENTOS_CRUD_METADATA,
  },
  {
    path: 'rh/reputacao',
    resource: 'rh/reputacao',
    title: 'Ranking de Reputação',
    subtitle: 'Análise dos índices públicos e governamentais dos heróis.',
    domain: 'Pessoas & Recursos Humanos',
    icon: 'monitoring',
    tone: 'rh',
    metadata: REPUTACAO_CRUD_METADATA,
  },
  {
    path: 'operacoes/missoes',
    resource: 'operations/missoes',
    title: 'Centro de Missões',
    subtitle: 'Planejamento e acompanhamento de missões em campo.',
    domain: 'Operações & Missões Táticas',
    icon: 'military_tech',
    tone: 'operations',
    metadata: MISSOES_CRUD_METADATA,
  },
  {
    path: 'operacoes/equipes',
    resource: 'operations/equipes',
    title: 'Equipes & Squads',
    subtitle: 'Formação de equipes táticas e distribuição de competências.',
    domain: 'Operações & Missões Táticas',
    icon: 'shield',
    tone: 'operations',
    metadata: EQUIPES_CRUD_METADATA,
  },
  {
    path: 'operacoes/bases',
    resource: 'operations/bases',
    title: 'Bases & Níveis de Acesso',
    subtitle: 'Administração de bases e credenciais de segurança.',
    domain: 'Operações & Missões Táticas',
    icon: 'apartment',
    tone: 'operations',
    metadata: BASES_CRUD_METADATA,
  },
  {
    path: 'operacoes/incidentes',
    resource: 'operations/incidentes',
    title: 'Incidentes Táticos',
    subtitle: 'Registro e resposta coordenada a incidentes críticos.',
    domain: 'Operações & Missões Táticas',
    icon: 'crisis_alert',
    tone: 'operations',
    metadata: INCIDENTES_CRUD_METADATA,
  },
  {
    path: 'ativos/equipamentos',
    resource: 'assets/equipamentos',
    title: 'Equipamentos & Armaduras',
    subtitle: 'Inventário, manutenção e alocação de recursos táticos.',
    domain: 'Ativos Operacionais',
    icon: 'inventory_2',
    tone: 'assets',
    metadata: EQUIPAMENTOS_CRUD_METADATA,
  },
  {
    path: 'ativos/veiculos',
    resource: 'assets/veiculos',
    title: 'Frota & Veículos',
    subtitle: 'Disponibilidade e manutenção da frota operacional.',
    domain: 'Ativos Operacionais',
    icon: 'directions_car',
    tone: 'assets',
    metadata: VEICULOS_CRUD_METADATA,
  },
  {
    path: 'suprimentos/contratos',
    resource: 'supplies/contratos',
    title: 'Fornecedores & Contratos',
    subtitle:
      'Gestão de parceiros industriais, acordos de nível de serviço, peças de reposição e contratos corporativos.',
    domain: 'Suprimentos & Aquisições Estratégicas',
    icon: 'contract',
    tone: 'supplies',
    metadata: CONTRATOS_CRUD_METADATA,
  },
  {
    path: 'suprimentos/pedidos',
    resource: 'supplies/pedidos',
    title: 'Pedidos de Compra & Reposição',
    subtitle:
      'Ordens de fornecimento de ligas de vibranium, propulsores quânticos, tecidos balísticos e insumos de laboratório.',
    domain: 'Suprimentos & Logística Tática',
    icon: 'shopping_cart_checkout',
    tone: 'supplies',
    metadata: PEDIDOS_CRUD_METADATA,
    enableCustomization: true,
  },
  {
    path: 'risco/ameacas',
    resource: 'risk/ameacas',
    title: 'Radar de Ameaças Globais',
    subtitle: 'Monitoramento contínuo de ameaças em escala global.',
    domain: 'Inteligência de Risco',
    icon: 'radar',
    tone: 'risk',
    metadata: AMEACAS_CRUD_METADATA,
  },
  {
    path: 'risco/indicadores',
    resource: 'risk/indicadores',
    title: 'Indicadores & Indenizações',
    subtitle: 'Métricas de risco, impacto e proteção financeira.',
    domain: 'Inteligência de Risco',
    icon: 'emergency',
    tone: 'risk',
    metadata: INDICADORES_CRUD_METADATA,
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
    data: {
      resource: r.resource,
      title: r.title,
      subtitle: r.subtitle,
      domain: {
        label: r.domain,
        icon: r.icon,
        tone: r.tone,
      },
      metadata: r.metadata,
      ...(r.enableCustomization ? { enableCustomization: true } : {}),
    },
    title: `Praxis Hero HQ | ${r.title}`,
  })),
  {
    path: '**',
    redirectTo: '',
  },
];
