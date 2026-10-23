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
      include: ['missaoTitulo', 'funcionarioNome', 'papel', 'ordem', 'principal', 'resultado'],
      order: ['funcionarioNome', 'missaoTitulo', 'papel', 'ordem', 'principal', 'resultado'],
      overrides: {
        // Media object: foto do operador + nome em destaque + papel tático em linha secundária.
        funcionarioNome: {
          width: '260px',
          header: 'Herói / Operador',
          renderer: {
            type: 'compose',
            compose: {
              items: [
                {
                  type: 'avatar',
                  avatar: {
                    srcField: 'funcionarioFotoUrl',
                    altField: 'funcionarioNome',
                    initialsField: 'funcionarioNome',
                    shape: 'circle',
                    size: 36,
                  },
                },
                { type: 'value', field: 'funcionarioNome', emphasis: 'strong' },
                { type: 'value', field: 'funcionarioId', prefix: 'Operador #', emphasis: 'subtle' },
              ],
              layout: { direction: 'media', gap: 12, align: 'start', ellipsis: true },
            },
          },
        },
        // Missão em destaque com o identificador da escala abaixo.
        missaoTitulo: {
          width: '260px',
          header: 'Missão Operacional',
          renderer: {
            type: 'compose',
            compose: {
              items: [
                { type: 'value', field: 'missaoTitulo', emphasis: 'strong' },
                { type: 'value', field: 'id', prefix: 'Escala #', emphasis: 'subtle' },
              ],
              layout: { direction: 'column', gap: 2, align: 'start', ellipsis: true },
            },
          },
        },
        papel: {
          width: '170px',
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
              condition: { '==': [{ var: 'papel' }, 'COMBATE'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Combate', variant: 'soft', color: 'accent', icon: 'swords' },
              },
            },
            {
              condition: { '==': [{ var: 'papel' }, 'SUPORTE'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Suporte Tático', variant: 'soft', color: 'primary', icon: 'shield' },
              },
            },
            {
              condition: { '==': [{ var: 'papel' }, 'INTEL'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Inteligência', variant: 'soft', color: 'accent', icon: 'radar' },
              },
            },
            {
              condition: { '==': [{ var: 'papel' }, 'NEGOCIACAO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Negociação', variant: 'outlined', color: 'basic', icon: 'handshake' },
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
          width: '170px',
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
                chip: { text: 'Ferido em Ação', variant: 'soft', color: 'accent', icon: 'healing' },
              },
            },
            {
              condition: { '==': [{ var: 'resultado' }, 'DESAPARECIDO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Desaparecido', variant: 'soft', color: 'warn', icon: 'crisis_alert' },
              },
            },
            {
              condition: { '==': [{ var: 'resultado' }, 'MORTO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Baixa em Combate', variant: 'soft', color: 'warn', icon: 'emergency' },
              },
            },
            {
              condition: { '==': [{ var: 'resultado' }, 'NA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Em Curso (N/A)', variant: 'outlined', color: 'basic', icon: 'schedule' },
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

