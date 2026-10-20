import type { CrudMetadata } from '@praxisui/crud';

export const INCIDENTES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/incidentes',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    source: 'operations/incidentes/stats/group-by',
    method: 'POST',
    payload: {
      filter: {},
      field: 'severidade',
      metrics: [{ operation: 'COUNT', alias: 'total' }],
    },
    cards: [
      {
        id: 'all',
        label: 'Total de Ocorrências',
        value: '108 Registros',
        valueExpr: '${totalCount | number | default:108} Registros',
        caption: 'Sinistros pós-combate catalogados',
        icon: 'report',
        tone: 'neutral',
        filter: {},
      },
      {
        id: 'criticos',
        label: 'Severidade Crítica',
        value: '23 Casos Críticos',
        valueExpr: '${byKey.CRITICA | number | default:23} Casos Críticos',
        caption: 'Alto impacto civil e estrutural (21,3%)',
        captionExpr: "Alto impacto civil e estrutural (${((byKey.CRITICA / totalCount) * 100) | round:1 | default:'21,3'}%)",
        icon: 'warning',
        tone: 'danger',
        filter: { severidade: 'CRITICA' },
      },
      {
        id: 'danos',
        label: 'Danos Materiais Totais',
        value: 'R$ 154,4 M',
        caption: 'Cobertura via Fundo Tático de Indenizações',
        icon: 'account_balance',
        tone: 'warning',
      },
      {
        id: 'mitigacao',
        label: 'Taxa de Mitigação',
        value: '96,2% Contido',
        caption: 'Evacuação prévia e blindagem energética',
        icon: 'shield_with_heart',
        tone: 'success',
      },
    ],
  },
  filterBar: {
    placement: 'scope-bar',
    inlineFields: ['local', 'severidade', 'descricao'],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'descricao', 'local', 'severidade', 'danosCivis', 'feridos', 'ocorridoEm'],
      order: ['id', 'descricao', 'local', 'severidade', 'indiceSinistro', 'danosCivis', 'feridos', 'ocorridoEm'],
      additions: [
        {
          field: 'indiceSinistro',
          header: 'Índice de Danos',
          width: '180px',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: '= round(min(100, (danosCivis / 4000000) * 100))',
                total: 100,
                toneExpr: {
                  if: [
                    { '==': [{ var: 'severidade' }, 'CRITICA'] },
                    'danger',
                    { '==': [{ var: 'severidade' }, 'ALTA'] },
                    'warning',
                    'info',
                  ],
                },
                fallbackText: 'Índice de Danos',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '90px', align: 'center', header: 'Registro' },
        descricao: { width: '320px', header: 'Descrição do Sinistro / Impacto' },
        local: { width: '200px', header: 'Teatro do Dano' },
        severidade: {
          width: '140px',
          align: 'center',
          header: 'Severidade',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'severidade' }, 'CRITICA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Crítica', variant: 'soft', color: 'warn', icon: 'gpp_bad' },
              },
            },
            {
              condition: { '==': [{ var: 'severidade' }, 'ALTA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Alta', variant: 'soft', color: 'accent', icon: 'warning' },
              },
            },
            {
              condition: { '==': [{ var: 'severidade' }, 'MEDIA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Média', variant: 'soft', color: 'primary', icon: 'shield' },
              },
            },
            {
              condition: { '==': [{ var: 'severidade' }, 'BAIXA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Baixa', variant: 'outlined', color: 'basic', icon: 'verified_user' },
              },
            },
          ],
        },
        danosCivis: { width: '170px', align: 'right', type: 'currency', format: 'BRL', header: 'Prejuízo Civil (R$)' },
        feridos: { width: '90px', align: 'center', header: 'Feridos' },
        ocorridoEm: { width: '150px', align: 'center', type: 'date', header: 'Data do Ocorrido' },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todas as Ocorrências', filter: {}, icon: 'report' },
          { id: 'critico', label: 'Severidade Crítica', filter: { severidade: 'CRITICA' }, icon: 'warning' },
          { id: 'alta', label: 'Alta Severidade', filter: { severidade: 'ALTA' }, icon: 'crisis_alert' },
          { id: 'media', label: 'Severidade Moderada', filter: { severidade: 'MEDIA' }, icon: 'info' },
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
            alwaysVisibleFields: ['local', 'severidade', 'descricao'],
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
                title: 'DOSSIÊ FORENSE DE INCIDENTE & CONTENÇÃO DE DANOS',
                subtitle: 'Avaliação pericial do impacto civil e rastreabilidade operacional',
                columns: 3,
                minCardWidth: 250,
                cards: [
                  {
                    title: 'Geolocalização & Severidade',
                    subtitle: 'Setor afetado e classificação de risco',
                    variant: 'outlined',
                    tone: 'primary',
                    size: 'sm',
                    density: 'compact',
                    content: [
                      {
                        type: 'metric',
                        label: 'Teatro do Dano',
                        valueExpr: '${row.local | default:Setor em varredura}',
                        captionExpr: 'Ocorrência #${row.id} · Severidade: ${row.severidade}',
                        icon: 'location_on',
                        tone: 'primary',
                      },
                    ],
                  },
                  {
                    title: 'Impacto Humano & Socorro',
                    subtitle: 'Vítimas civis e evacuação médica',
                    variant: 'outlined',
                    tone: 'warning',
                    size: 'sm',
                    density: 'compact',
                    content: [
                      {
                        type: 'metric',
                        label: 'Feridos Atendidos',
                        valueExpr: '${row.feridos | default:0 | number} vítimas',
                        captionExpr: 'Baixas confirmadas: ${row.mortos | default:0 | number}',
                        icon: 'medical_services',
                        tone: 'warning',
                      },
                    ],
                  },
                  {
                    title: 'Auditoria Patrimonial',
                    subtitle: 'Cobertura pelo Fundo Tático de Indenizações',
                    variant: 'outlined',
                    tone: 'info',
                    size: 'sm',
                    density: 'compact',
                    content: [
                      {
                        type: 'metric',
                        label: 'Prejuízo Civil Estimado',
                        valueExpr: '${row.danosCivis | default:0 | currency}',
                        captionExpr: 'Data do sinistro: ${row.ocorridoEm | dateTime}',
                        icon: 'account_balance',
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
                      icon: 'security',
                      title: 'Síntese Pericial da Ocorrência',
                      messageExpr:
                        '${row.descricao} — Perímetro isolado no setor ${row.local}. Protocolo de mitigação e auditoria indenizatória ativo.',
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


