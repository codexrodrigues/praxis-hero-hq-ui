import type { CrudMetadata } from '@praxisui/crud';

export const MISSOES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/missoes',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    source: 'operations/vw-resumo-missoes/stats/group-by',
    method: 'POST',
    payload: {
      filter: {},
      field: 'status',
      metrics: [{ operation: 'COUNT', alias: 'total' }],
    },
    cards: [
      {
        id: 'ativas',
        label: 'Missões Ativas em Campo',
        value: '9 Incursões',
        valueExpr: '${byKey.EM_ANDAMENTO | number | default:9} Incursões',
        caption: 'Em andamento no teatro operacional',
        captionExpr: 'De ${totalCount | number | default:46} missões catalogadas no comando',
        icon: 'flight_takeoff',
        tone: 'info',
        filter: { status: 'EM_ANDAMENTO' },
      },
      {
        id: 'concluidas',
        label: 'Missões Concluídas',
        value: '22 Concluídas',
        valueExpr: '${byKey.CONCLUIDA | number | default:22} Concluídas',
        caption: 'Operações finalizadas com êxito',
        captionExpr: "Operações finalizadas com êxito (${((byKey.CONCLUIDA / totalCount) * 100) | round:1 | default:'47,8'}%)",
        icon: 'task_alt',
        tone: 'success',
        filter: { status: 'CONCLUIDA' },
      },
      {
        id: 'planejamento',
        label: 'Em Planejamento / Briefing',
        value: '15 Missões',
        valueExpr: '${byKey.PLANEJADA | number | default:15} Missões',
        caption: 'Em preparação e briefing tático',
        captionExpr: "Em preparação e briefing tático (${((byKey.PLANEJADA / totalCount) * 100) | round:1 | default:'32,6'}%)",
        icon: 'schedule',
        tone: 'warning',
        filter: { status: 'PLANEJADA' },
      },
      {
        id: 'omega',
        label: 'Prioridade Ômega / Crítica',
        value: '15 Alertas',
        caption: 'Engajamento de prioridade crítica',
        icon: 'crisis_alert',
        tone: 'danger',
        filter: { prioridade: 'CRITICA' },
      },
    ],
  },
  filterBar: {
    placement: 'scope-bar',
    inlineFields: ['titulo', 'status', 'prioridade', 'ameacaId', 'local'],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'titulo', 'ameacaNome', 'prioridade', 'status', 'local', 'inicioPrev', 'fimPrev'],
      order: ['id', 'titulo', 'ameacaNome', 'prioridade', 'status', 'progresso', 'local', 'inicioPrev', 'fimPrev'],
      additions: [
        {
          field: 'progresso',
          header: 'Prontidão Operacional',
          width: '180px',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: "= row.status === 'CONCLUIDA' ? 100 : row.status === 'EM_ANDAMENTO' ? 68 : row.status === 'PAUSADA' ? 40 : 15",
                total: 100,
                toneExpr: "= row.status === 'CONCLUIDA' ? 'success' : row.prioridade === 'CRITICA' ? 'danger' : 'info'",
                fallbackText: 'Prontidão',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '80px', align: 'center', header: 'Cód.' },
        titulo: { width: '250px', header: 'Título da Missão' },
        ameacaNome: { width: '160px', header: 'Ameaça / Alvo Tático' },
        prioridade: {
          width: '140px',
          align: 'center',
          header: 'Prioridade',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'prioridade' }, 'CRITICA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Ômega / Crítica', variant: 'soft', color: 'warn', icon: 'crisis_alert' },
              },
            },
            {
              condition: { '==': [{ var: 'prioridade' }, 'ALTA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Alta', variant: 'soft', color: 'accent', icon: 'warning' },
              },
            },
            {
              condition: { '==': [{ var: 'prioridade' }, 'MEDIA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Média', variant: 'soft', color: 'primary', icon: 'shield' },
              },
            },
            {
              condition: { '==': [{ var: 'prioridade' }, 'BAIXA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Baixa', variant: 'outlined', color: 'basic', icon: 'info' },
              },
            },
          ],
        },
        status: {
          width: '160px',
          align: 'center',
          header: 'Status Operacional',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'status' }, 'EM_ANDAMENTO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Em Andamento', variant: 'soft', color: 'primary', icon: 'flight_takeoff' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'CONCLUIDA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Concluída', variant: 'soft', color: 'primary', icon: 'task_alt' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'PLANEJADA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Em Briefing', variant: 'soft', color: 'accent', icon: 'schedule' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'PAUSADA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Em Espera', variant: 'outlined', color: 'basic', icon: 'pause_circle' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'FALHOU'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Falhou', variant: 'soft', color: 'warn', icon: 'gpp_bad' },
              },
            },
          ],
        },
        local: { width: '170px', header: 'Teatro de Operações' },
        inicioPrev: { width: '160px', type: 'date', format: 'dd/MM/yyyy HH:mm', header: 'Início Previsto' },
        fimPrev: { width: '160px', type: 'date', format: 'dd/MM/yyyy HH:mm', header: 'Fim Previsto' },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todas as Missões', icon: 'military_tech', filter: {} },
          { id: 'ativas', label: 'Em Andamento', icon: 'flight_takeoff', filter: { status: 'EM_ANDAMENTO' } },
          { id: 'omega', label: 'Prioridade Ômega', icon: 'crisis_alert', filter: { prioridade: 'CRITICA' } },
          { id: 'planejamento', label: 'Em Planejamento', icon: 'schedule', filter: { status: 'PLANEJADA' } },
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
            alwaysVisibleFields: ['titulo', 'status', 'prioridade', 'ameacaId', 'local'],
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
                title: 'DOSSIÊ TÁTICO DE MISSÃO & COMANDO DE CAMPO',
                subtitle: 'Briefing operacional e sincronização em tempo real com a Central de Operações',
                columns: 3,
                minCardWidth: 250,
                cards: [
                  {
                    title: 'Alvo & Teatro Operacional',
                    subtitle: 'Vetor geográfico e ameaça vinculada',
                    variant: 'outlined',
                    tone: 'primary',
                    size: 'sm',
                    density: 'compact',
                    content: [
                      {
                        type: 'metric',
                        label: 'Ameaça / Alvo Tático',
                        valueExpr: '${row.ameacaNome | default:Alvo sob reconhecimento}',
                        captionExpr: 'Teatro: ${row.local | default:Setor global} · Missão #${row.id}',
                        icon: 'radar',
                        tone: 'primary',
                      },
                    ],
                  },
                  {
                    title: 'Classificação & Prioridade',
                    subtitle: 'Nível de resposta e estado da incursão',
                    variant: 'outlined',
                    tone: 'warning',
                    size: 'sm',
                    density: 'compact',
                    content: [
                      {
                        type: 'metric',
                        label: 'Status da Incursão',
                        valueExpr: '${row.status}',
                        captionExpr: 'Prioridade de engajamento: ${row.prioridade}',
                        icon: 'military_tech',
                        tone: 'warning',
                      },
                    ],
                  },
                  {
                    title: 'Janela Operacional',
                    subtitle: 'Cronograma tático previsto pelo comando',
                    variant: 'outlined',
                    tone: 'info',
                    size: 'sm',
                    density: 'compact',
                    content: [
                      {
                        type: 'metric',
                        label: 'Início Previsto',
                        valueExpr: '${row.inicioPrev | dateTime}',
                        captionExpr: 'Término previsto: ${row.fimPrev | dateTime}',
                        icon: 'schedule',
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
                      tone: 'info',
                      icon: 'flight_takeoff',
                      title: 'Diretiva Operacional da Missão',
                      messageExpr:
                        'Operação "${row.titulo}" destacada para o setor ${row.local | default:Global} contra o alvo ${row.ameacaNome | default:Designado} sob prioridade ${row.prioridade}.',
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
  actions: [
    {
      id: 'edit',
      label: 'Despacho Tático',
      action: 'edit',
      openMode: 'modal',
      formId: 'missoes-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Nova Missão',
      action: 'create',
      openMode: 'modal',
      formId: 'missoes-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '920px', maxWidth: '95vw' },
  },
};


