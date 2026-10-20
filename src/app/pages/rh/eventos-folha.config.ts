import type { CrudMetadata } from '@praxisui/crud';

export const EVENTOS_FOLHA_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/eventos-folha',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    source: 'human-resources/eventos-folha/filter?page=0&size=1',
    method: 'POST',
    payload: {},
    cards: [
      {
        id: 'total',
        label: 'Eventos Lançados',
        value: '25.590 Rubricas',
        valueExpr: "${totalElements | number | default:'25.590'} Rubricas",
        caption: 'Rubricas vinculadas às folhas de pagamento',
        icon: 'receipt_long',
        tone: 'neutral',
        filter: {},
      },
      {
        id: 'pendentes',
        label: 'Aguardando Aprovação',
        value: '18.802 Pendentes',
        caption: 'Elegíveis para aprovação ou revisão em lote',
        icon: 'pending_actions',
        tone: 'warning',
        filter: { status: 'PENDENTE' },
      },
      {
        id: 'aprovados',
        label: 'Eventos Homologados',
        value: '6.758 Aprovados',
        caption: 'Aprovados pelo fluxo governado de folha',
        icon: 'task_alt',
        tone: 'success',
        filter: { status: 'APROVADO' },
      },
      {
        id: 'rejeitados',
        label: 'Eventos Glosados',
        value: '30 Rejeitados',
        caption: 'Bloqueados na auditoria de folha',
        icon: 'cancel',
        tone: 'danger',
        filter: { status: 'REJEITADO' },
      },
    ],
  },
  filterBar: {
    placement: 'scope-bar',
    inlineFields: ['descricao', 'tipo', 'status'],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'descricao', 'tipo', 'valor', 'folhaPagamentoNome', 'status'],
      order: ['id', 'descricao', 'tipo', 'valor', 'folhaPagamentoNome', 'status'],
      overrides: {
        id: { width: '90px', align: 'center', header: 'Evento ID' },
        descricao: { width: '280px', header: 'Descrição da Rubrica / Evento' },
        tipo: {
          width: '170px',
          align: 'center',
          header: 'Natureza (Provento/Desconto)',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'tipo' }, 'PROVENTO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Provento', variant: 'soft', color: 'primary', icon: 'trending_up' },
              },
            },
            {
              condition: { '==': [{ var: 'tipo' }, 'DESCONTO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Desconto', variant: 'soft', color: 'accent', icon: 'trending_down' },
              },
            },
          ],
        },
        valor: { width: '160px', align: 'right', type: 'currency', format: 'BRL', header: 'Valor Financeiro' },
        folhaPagamentoNome: { width: '220px', header: 'Folha de Competência' },
        status: {
          width: '160px',
          align: 'center',
          header: 'Status do Workflow',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'status' }, 'APROVADO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Homologado', variant: 'soft', color: 'primary', icon: 'task_alt' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'PENDENTE'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Pendente', variant: 'soft', color: 'accent', icon: 'pending_actions' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'REJEITADO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Glosado', variant: 'soft', color: 'warn', icon: 'cancel' },
              },
            },
          ],
        },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todos os Eventos', filter: {}, icon: 'receipt_long' },
          { id: 'pendentes', label: 'Pendentes de Aprovação', filter: { status: 'PENDENTE' }, icon: 'pending_actions' },
          { id: 'aprovados', label: 'Aprovados', filter: { status: 'APROVADO' }, icon: 'task_alt' },
          { id: 'rejeitados', label: 'Rejeitados', filter: { status: 'REJEITADO' }, icon: 'cancel' },
        ],
      },
    },
    behavior: {
      selection: {
        enabled: true,
      },
      filtering: {
        advancedFilters: {
          settings: {
            alwaysVisibleFields: ['descricao', 'tipo', 'status'],
          },
        },
      },
      expansion: {
        enabled: false,
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};

