import type { CrudMetadata } from '@praxisui/crud';

export const AMEACAS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'risk-intelligence/ameacas',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    source: 'risk-intelligence/ameacas/stats/group-by',
    method: 'POST',
    payload: {
      filter: {},
      field: 'status',
      metrics: [{ operation: 'COUNT', alias: 'total' }],
    },
    cards: [
      {
        id: 'ameacas',
        label: 'Ameaças Monitoradas',
        value: '24 Alvos',
        valueExpr: '${totalCount | number | default:24} Alvos',
        caption: 'Radar contínuo em frequência quântica',
        icon: 'warning',
        tone: 'danger',
        filter: {},
      },
      {
        id: 'confronto',
        label: 'Em Confronto Ativo',
        value: '9 em Combate',
        valueExpr: '${byKey.CONFRONTO | number | default:9} em Combate',
        caption: 'Esquadrões mobilizados em solo (37,5%)',
        captionExpr: "Esquadrões mobilizados em solo (${((byKey.CONFRONTO / totalCount) * 100) | round:1 | default:'37,5'}%)",
        icon: 'crisis_alert',
        tone: 'warning',
        filter: { status: 'CONFRONTO' },
      },
      {
        id: 'contidos',
        label: 'Contidos / Prisão Raft',
        value: '3 Neutralizados',
        valueExpr: '${byKey.CAPTURADO | number | default:3} Neutralizados',
        caption: 'Custodiados em estase de força',
        icon: 'lock',
        tone: 'success',
        filter: { status: 'CAPTURADO' },
      },
      {
        id: 'recompensas',
        label: 'Fundo Total de Recompensas',
        value: 'R$ 12,1 M',
        caption: '23 ameaças nível 5+ · Acordo de Sokovia',
        icon: 'payments',
        tone: 'info',
        filter: { nivelBetween: [5, 10] },
      },
    ],
  },
  filterBar: {
    placement: 'scope-bar',
    inlineFields: ['nome', 'classe', 'status', 'planeta'],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'nome', 'classe', 'planeta', 'nivel', 'status', 'recompensa'],
      order: ['id', 'nome', 'classe', 'planeta', 'nivel', 'indicePerigo', 'status', 'recompensa'],
      additions: [
        {
          field: 'indicePerigo',
          header: 'Índice de Letalidade',
          width: '180px',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: '= min(100, row.nivel * 14)',
                total: 100,
                toneExpr: "= row.nivel >= 6 ? 'danger' : row.nivel >= 4 ? 'warning' : 'info'",
                fallbackText: 'Letalidade',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '80px', align: 'center', header: 'Cód.' },
        nome: { width: '220px', header: 'Designação da Ameaça' },
        classe: { width: '130px', align: 'center', header: 'Classe Tática' },
        planeta: { width: '140px', header: 'Origem Planetária' },
        nivel: { width: '80px', align: 'center', type: 'number', header: 'Nível' },
        status: {
          width: '160px',
          align: 'center',
          header: 'Status de Contenção',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'status' }, 'CONFRONTO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Em Confronto', variant: 'soft', color: 'warn', icon: 'crisis_alert' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'LIVRE'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Ativo / Livre', variant: 'soft', color: 'warn', icon: 'warning' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'EM_OBSERVACAO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Em Observação', variant: 'soft', color: 'accent', icon: 'radar' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'CAPTURADO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Contido (Raft)', variant: 'soft', color: 'primary', icon: 'lock' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'ELIMINADO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Neutralizado', variant: 'outlined', color: 'basic', icon: 'verified_user' },
              },
            },
          ],
        },
        recompensa: { width: '160px', align: 'right', type: 'currency', format: 'BRL', header: 'Recompensa Fixada' },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todas as Ameaças', filter: {}, icon: 'radar' },
          { id: 'confronto', label: 'Em Confronto Ativo', filter: { status: 'CONFRONTO' }, icon: 'crisis_alert' },
          { id: 'critico', label: 'Nível Ômega / Crítico', filter: { nivelBetween: [5, 10] }, icon: 'warning' },
          { id: 'contidos', label: 'Neutralizados / Raft', filter: { status: 'CAPTURADO' }, icon: 'lock' },
        ],
      },
    },
    behavior: {
      filtering: {
        advancedFilters: {
          settings: {
            alwaysVisibleFields: ['nome', 'classe', 'status', 'planeta'],
          },
        },
      },
      expansion: {
        enabled: true,
        contractVersion: '1.0.0',
        identity: {
          rowKeySource: 'table.idField',
          requireStableIdField: true,
        },
        state: {
          mode: 'uncontrolled',
        },
        interaction: {
          trigger: 'icon',
          toggleOnRowClick: false,
        },
        limits: {
          allowMultiple: false,
          maxExpandedRows: 1,
          onOverflow: 'collapseOldest',
        },
      },
      detail: {
        schemaContract: {
          kind: 'praxis.detail.schema',
          version: '1.0.0',
          compat: 'semver',
          allowedNodes: ['cardGrid', 'card', 'metric', 'compose', 'badge', 'richContent', 'stack', 'text', 'value', 'icon'],
          sanitization: 'strict',
        },
        rendering: {
          strategy: 'registry',
          registryId: 'praxis.detail.default',
          fallbackNodePolicy: 'failClosed',
        },
        source: {
          mode: 'inline',
          inlineSchema: {
            layout: 'stack',
            items: [
              {
                type: 'cardGrid',
                title: 'DOSSIÊ DE INTELIGÊNCIA DE RISCO & PROTOCOLO DE CONTENÇÃO',
                subtitle: 'Monitoramento contínuo pelo Radar de Ameaças Globais do Centro de Comando',
                columns: 3,
                minCardWidth: 250,
                cards: [
                  {
                    title: 'Perfil & Origem Tática',
                    subtitle: 'Classificação e teatro de origem',
                    variant: 'outlined',
                    tone: 'primary',
                    size: 'sm',
                    density: 'compact',
                    content: [
                      {
                        type: 'metric',
                        label: 'Designação do Alvo',
                        valueExpr: '${row.nome}',
                        captionExpr: 'Classe: ${row.classe} · Origem: ${row.planeta | default:Terra}',
                        icon: 'radar',
                        tone: 'primary',
                      },
                    ],
                  },
                  {
                    title: 'Grau de Letalidade',
                    subtitle: 'Escala global de periculosidade',
                    variant: 'outlined',
                    tone: 'warning',
                    size: 'sm',
                    density: 'compact',
                    content: [
                      {
                        type: 'metric',
                        label: 'Nível de Ameaça',
                        valueExpr: 'Nível ${row.nivel} / 10',
                        captionExpr: 'Status atual: ${row.status}',
                        icon: 'crisis_alert',
                        tone: 'warning',
                      },
                    ],
                  },
                  {
                    title: 'Recompensa Governada',
                    subtitle: 'Acordo de Sokovia & Custódia Raft',
                    variant: 'outlined',
                    tone: 'info',
                    size: 'sm',
                    density: 'compact',
                    content: [
                      {
                        type: 'metric',
                        label: 'Recompensa Fixada',
                        valueExpr: '${row.recompensa | default:0 | currency}',
                        captionExpr: 'Registro de Inteligência #${row.id}',
                        icon: 'payments',
                        tone: 'info',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'richContent',
                document: {
                  kind: 'praxis.rich-content',
                  version: '1.0.0',
                  nodes: [
                    {
                      type: 'callout',
                      tone: 'warning',
                      icon: 'gpp_maybe',
                      title: 'Diretiva de Contenção & Engajamento',
                      messageExpr:
                        'Alvo "${row.nome}" (${row.classe}, Nível ${row.nivel}) de origem ${row.planeta | default:Terra} sob status ${row.status}. Mobilização sujeita aos protocolos táticos do Acordo de Sokovia.',
                    },
                  ],
                },
              },
            ],
          } as any,
        },
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};


