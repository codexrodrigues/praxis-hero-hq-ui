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
      scopeBar: {
        leadLabel: 'Força Operacional:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Toda a Força', icon: 'group', count: 18, filter: {} },
          { id: 'ativos', label: 'Em Serviço Ativo', icon: 'shield', tone: 'ready', count: 14, filter: { status: 'ATIVO' } },
          { id: 'afastados', label: 'Afastados / Licença', icon: 'event_busy', tone: 'warning', count: 3, filter: { status: 'AFASTADO' } },
          { id: 'reserva', label: 'Quadro Reserva', icon: 'inventory_2', tone: 'info', count: 1, filter: { status: 'RESERVA' } },
        ],
      },
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
      scopeBar: {
        leadLabel: 'Ciclo de Pagamento:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Todos os Lançamentos', icon: 'receipt_long', count: 24, filter: {} },
          { id: 'processados', label: 'Processados / Pagos', icon: 'task_alt', tone: 'ready', count: 18, filter: { status: 'PROCESSADO' } },
          { id: 'pendentes', label: 'Pendentes de Validação', icon: 'hourglass_top', tone: 'warning', count: 4, filter: { status: 'PENDENTE' } },
          { id: 'estornados', label: 'Glosados / Estornados', icon: 'block', count: 2, filter: { status: 'CANCELADO' } },
        ],
      },
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
      scopeBar: {
        leadLabel: 'Status de Afastamento:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Todos os Registros', icon: 'date_range', count: 14, filter: {} },
          { id: 'vigentes', label: 'Afastamentos Vigentes', icon: 'person_off', tone: 'warning', count: 5, filter: { status: 'EM_ANDAMENTO' } },
          { id: 'agendados', label: 'Programados', icon: 'schedule', tone: 'info', count: 6, filter: { status: 'PROGRAMADO' } },
          { id: 'concluidos', label: 'Retornados à Base', icon: 'how_to_reg', tone: 'ready', count: 3, filter: { status: 'CONCLUIDO' } },
        ],
      },
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
      scopeBar: {
        leadLabel: 'Divisões Táticas:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Todas as Divisões', icon: 'corporate_fare', count: 28, filter: {} },
          { id: 'liderancas', label: 'Lideranças Ativas', icon: 'military_tech', count: 96, tooltip: '96,4% de prontidão', tone: 'ready', filter: { status: 'ATIVO' } },
          { id: 'cargos', label: 'Funções Mapeadas', icon: 'account_tree', count: 15, tone: 'info', filter: {} },
        ],
      },
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
      scopeBar: {
        leadLabel: 'Grau de Confiabilidade:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Todos os Indicadores', icon: 'star', count: 18, filter: {} },
          { id: 'alto', label: 'Índice Excelente (>90%)', icon: 'verified', tone: 'ready', count: 12, filter: { faixa: 'EXCELENTE' } },
          { id: 'atencao', label: 'Sob Observação (<70%)', icon: 'warning', tone: 'warning', count: 3, filter: { faixa: 'ALERTA' } },
        ],
      },
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
      scopeBar: {
        leadLabel: 'Status da Incursão:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Todas as Incursões', icon: 'military_tech', count: 12, filter: {} },
          { id: 'ativas', label: 'Em Andamento', icon: 'flight_takeoff', tone: 'ready', count: 5, filter: { status: 'EM_ANDAMENTO' } },
          { id: 'planejamento', label: 'Planejamento', icon: 'edit_calendar', tone: 'warning', count: 4, filter: { status: 'PLANEJAMENTO' } },
          { id: 'concluidas', label: 'Concluídas', icon: 'task_alt', count: 3, filter: { status: 'CONCLUIDA' } },
        ],
      },
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
      scopeBar: {
        leadLabel: 'Squads Táticos:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Todos os Squads', icon: 'groups', count: 8, filter: {} },
          { id: 'alpha', label: 'Squad Alpha (Prontidão Máxima)', icon: 'bolt', tone: 'ready', count: 3, filter: { nivelProntidao: 'ALPHA' } },
          { id: 'bravo', label: 'Squad Bravo (Suporte Pesado)', icon: 'security', tone: 'info', count: 3, filter: { nivelProntidao: 'BRAVO' } },
          { id: 'standby', label: 'Quadro em Standby', icon: 'hourglass_empty', count: 2, filter: { status: 'STANDBY' } },
        ],
      },
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
      scopeBar: {
        leadLabel: 'Instalações Globais:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Todas as Instalações', icon: 'home_work', count: 9, filter: {} },
          { id: 'seguras', label: 'Nível Alpha / Seguras', icon: 'verified_user', tone: 'ready', count: 6, filter: { statusSeguranca: 'SEGURA' } },
          { id: 'alerta', label: 'Perímetro em Alerta', icon: 'crisis_alert', tone: 'warning', count: 2, filter: { statusSeguranca: 'ALERTA' } },
          { id: 'quarentena', label: 'Quarentena Tática', icon: 'gpp_bad', count: 1, filter: { statusSeguranca: 'QUARENTENA' } },
        ],
      },
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
      scopeBar: {
        leadLabel: 'Severidade do Alerta:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Todos os Incidentes', icon: 'emergency', count: 15, filter: {} },
          { id: 'criticos', label: 'Nível Ômega / Crítico', icon: 'dangerous', tone: 'warning', count: 3, filter: { severidade: 'OMEGA' } },
          { id: 'ativos', label: 'Em Contenção Ativa', icon: 'shield_lock', tone: 'info', count: 7, filter: { status: 'EM_ANDAMENTO' } },
          { id: 'resolvidos', label: 'Mitigados com Sucesso', icon: 'check_circle', tone: 'ready', count: 5, filter: { status: 'RESOLVIDO' } },
        ],
      },
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
      scopeBar: {
        leadLabel: 'Prontidão de Armaduras:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Todo o Inventário', icon: 'inventory', count: 32, filter: {} },
          { id: 'prontos', label: 'Prontos para Combate', icon: 'verified', tone: 'ready', count: 24, filter: { status: 'PRONTO' } },
          { id: 'manutencao', label: 'Em Reparo / Oficina', icon: 'build', tone: 'warning', count: 6, filter: { status: 'MANUTENCAO' } },
          { id: 'pesquisa', label: 'Em Desenvolvimento R&D', icon: 'science', tone: 'info', count: 2, filter: { status: 'PROTOTIPO' } },
        ],
      },
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
      scopeBar: {
        leadLabel: 'Frota Tática:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Toda a Frota', icon: 'local_shipping', count: 16, filter: {} },
          { id: 'hangar', label: 'No Hangar / Prontos', icon: 'flight', tone: 'ready', count: 11, filter: { status: 'DISPONIVEL' } },
          { id: 'missao', label: 'Em Deslocamento / Missão', icon: 'connecting_airports', tone: 'info', count: 3, filter: { status: 'EM_MISSAO' } },
          { id: 'reparo', label: 'Em Manutenção Pesada', icon: 'car_repair', tone: 'warning', count: 2, filter: { status: 'MANUTENCAO' } },
        ],
      },
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
      scopeBar: {
        leadLabel: 'Escopo Contratual:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Todos os Acordos', icon: 'description', count: 17, filter: {} },
          { id: 'vigentes', label: 'Vigentes & Assinados', icon: 'verified', tone: 'ready', count: 11, filter: { status: 'ACTIVE' } },
          { id: 'expirados', label: 'Expirados', icon: 'event_busy', tone: 'warning', count: 3, filter: { status: 'EXPIRED' } },
          { id: 'draft', label: 'Em Minuta / Draft', icon: 'edit_note', tone: 'info', count: 1, filter: { status: 'DRAFT' } },
        ],
      },
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
      scopeBar: {
        leadLabel: 'Status da Ordem:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Todas as Ordens', icon: 'local_shipping', count: 10, filter: {} },
          { id: 'aprovadas', label: 'Aprovadas / Entregues', icon: 'inventory', tone: 'ready', count: 5, filter: { status: 'APPROVED' } },
          { id: 'analise', label: 'Em Análise', icon: 'pending_actions', tone: 'warning', count: 3, filter: { status: 'DRAFT' } },
          { id: 'canceladas', label: 'Canceladas', icon: 'cancel', count: 2, filter: { status: 'CANCELLED' } },
        ],
      },
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
      scopeBar: {
        leadLabel: 'Nível de Perigo:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Todas as Ameaças', icon: 'radar', count: 22, filter: {} },
          { id: 'ativas', label: 'Ameaças Ativas', icon: 'crisis_alert', tone: 'warning', count: 8, filter: { status: 'ATIVA' } },
          { id: 'extintas', label: 'Neutralizadas', icon: 'shield_with_heart', tone: 'ready', count: 14, filter: { status: 'NEUTRALIZADA' } },
        ],
      },
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
      scopeBar: {
        leadLabel: 'Tipo de Indenização:',
        leadIcon: 'tune',
        items: [
          { id: 'all', label: 'Todas as Solicitações', icon: 'payments', count: 19, filter: {} },
          { id: 'deferidas', label: 'Indenizações Pagas', icon: 'check_circle', tone: 'ready', count: 13, filter: { status: 'PAGO' } },
          { id: 'analise', label: 'Em Auditoria / Análise', icon: 'pending', tone: 'warning', count: 4, filter: { status: 'EM_ANALISE' } },
          { id: 'recusadas', label: 'Indeferidas', icon: 'cancel', count: 2, filter: { status: 'INDEFERIDO' } },
        ],
      },
    },
    title: 'Praxis Hero HQ | Indicadores & Indenizações',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
