import type { CrudMetadata } from '@praxisui/crud';

export const MISSAO_PARTICIPANTES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/missao-participantes',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    source: 'operations/missao-participantes/stats/group-by',
    method: 'POST',
    payload: {
      filter: {},
      field: 'papel',
      metrics: [{ operation: 'COUNT', alias: 'total' }],
    },
    cards: [
      {
        id: 'total',
        label: 'Escalas Operacionais',
        value: '315 Escalas',
        valueExpr: '${totalCount | number | default:315} Escalas',
        caption: 'Participantes vinculados a missões em campo',
        icon: 'groups',
        tone: 'info',
        filter: {},
      },
      {
        id: 'lideres',
        label: 'Liderança Tática',
        value: '54 Comandantes',
        valueExpr: '${byKey.LIDER | number | default:54} Comandantes',
        caption: 'Referências principais de esquadrão',
        captionExpr: "Referências principais de esquadrão (${((byKey.LIDER / totalCount) * 100) | round:1 | default:'17,1'}%)",
        icon: 'military_tech',
        tone: 'primary',
        filter: { papel: 'LIDER' },
      },
      {
        id: 'suporte',
        label: 'Suporte & Especialistas',
        value: '152 Operadores',
        valueExpr: '${byKey.SUPORTE | number | default:152} Operadores',
        caption: 'Retaguarda, inteligência e contenção',
        captionExpr: "Retaguarda, inteligência e contenção (${((byKey.SUPORTE / totalCount) * 100) | round:1 | default:'48,3'}%)",
        icon: 'shield',
        tone: 'neutral',
        filter: { papel: 'SUPORTE' },
      },
      {
        id: 'sucesso',
        label: 'Missões Bem-Sucedidas',
        value: '282 Concluídas',
        caption: 'Participações concluídas com sucesso (89,5%)',
        icon: 'verified',
        tone: 'success',
        filter: { resultado: 'OK' },
      },
    ],
  },
  filterBar: {
    placement: 'scope-bar',
    inlineFields: ['papel', 'principal', 'resultado'],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'missaoTitulo', 'funcionarioNome', 'papel', 'ordem', 'principal', 'resultado'],
      order: ['id', 'missaoTitulo', 'funcionarioNome', 'papel', 'ordem', 'principal', 'resultado'],
      overrides: {
        id: { width: '90px', align: 'center', header: 'Escala ID' },
        missaoTitulo: { width: '240px', header: 'Missão Operacional' },
        funcionarioNome: { width: '220px', header: 'Herói / Operador' },
        papel: {
          width: '160px',
          align: 'center',
          header: 'Papel Tático',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'papel' }, 'LIDER'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Líder Tático', variant: 'soft', color: 'primary', icon: 'military_tech' },
              },
            },
            {
              condition: { '==': [{ var: 'papel' }, 'COMBATENTE'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Combatente', variant: 'soft', color: 'accent', icon: 'swords' },
              },
            },
            {
              condition: { '==': [{ var: 'papel' }, 'SUPORTE'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Suporte / Tático', variant: 'outlined', color: 'basic', icon: 'shield' },
              },
            },
          ],
        },
        ordem: { width: '110px', align: 'center', type: 'number', header: 'Ordem' },
        principal: {
          width: '140px',
          align: 'center',
          header: 'Líder Principal',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'principal' }, true] },
              renderer: {
                type: 'chip',
                chip: { text: 'Principal', variant: 'soft', color: 'primary', icon: 'star' },
              },
            },
            {
              condition: { '==': [{ var: 'principal' }, false] },
              renderer: {
                type: 'chip',
                chip: { text: 'Integrante', variant: 'outlined', color: 'basic', icon: 'person' },
              },
            },
          ],
        },
        resultado: {
          width: '160px',
          align: 'center',
          header: 'Resultado Individual',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'resultado' }, 'OK'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Missão Cumprida', variant: 'soft', color: 'primary', icon: 'verified' },
              },
            },
            {
              condition: { '==': [{ var: 'resultado' }, 'FERIDO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Ferido em Ação', variant: 'soft', color: 'warn', icon: 'healing' },
              },
            },
            {
              condition: { '==': [{ var: 'resultado' }, 'MIA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Desaparecido (MIA)', variant: 'soft', color: 'warn', icon: 'crisis_alert' },
              },
            },
          ],
        },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todas as Escalas', filter: {}, icon: 'groups' },
          { id: 'lideres', label: 'Líderes de Missão', filter: { papel: 'LIDER' }, icon: 'military_tech' },
          { id: 'principais', label: 'Referência Principal', filter: { principal: true }, icon: 'star' },
          { id: 'sucesso', label: 'Resultado: Sucesso', filter: { resultado: 'OK' }, icon: 'verified' },
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
            alwaysVisibleFields: ['papel', 'principal', 'resultado'],
          },
        },
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};

