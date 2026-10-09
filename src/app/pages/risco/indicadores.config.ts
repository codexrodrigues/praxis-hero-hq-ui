import type { CrudMetadata } from '@praxisui/crud';
import { createBentoDetailExpansion } from '../shared/detail-expansion.helper';

export const INDICADORES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'risk-intelligence/vw-indicadores-incidentes',
    idField: 'incidenteId',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    cards: [
      {
        id: 'passivo',
        label: 'Sinistros com Passivo',
        value: '74 Casos',
        caption: 'Histórico de acordos regulados pelo HQ',
        icon: 'gavel',
        tone: 'danger',
        filter: {},
      },
      {
        id: 'total',
        label: 'Volume de Indenizações',
        value: 'R$ 99,5 M',
        caption: 'Compensações acordadas com o judiciário',
        icon: 'payments',
        tone: 'warning',
      },
      {
        id: 'danos',
        label: 'Danos Civis Apurados',
        value: 'R$ 154,4 M',
        caption: 'Prejuízo material total auditado',
        icon: 'broken_image',
        tone: 'info',
      },
      {
        id: 'saldo',
        label: 'Saldo em Conciliação',
        value: 'R$ 72,8 M',
        caption: 'Em análise de perícia e fundos de seguro',
        icon: 'hourglass_top',
        tone: 'neutral',
      },
    ],
  },
  table: {
    meta: { idField: 'incidenteId' },
    idField: 'incidenteId',
    columns: [
      {
        field: 'incidenteId',
        header: 'Registro',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'missao',
        header: 'Missão de Origem',
        width: '200px',
        sortable: true,
      },
      {
        field: 'local',
        header: 'Local do Dano',
        width: '150px',
        sortable: true,
      },
      {
        field: 'severidade',
        header: 'Severidade',
        width: '120px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'statusLiquidacao',
        header: 'Taxa de Liquidação',
        width: '180px',
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: '= round(min(100, (totalPago / max(1, totalIndenizacoes)) * 100))',
              total: 100,
              toneExpr: {
                if: [
                  { '==': [{ var: 'totalPendente' }, 0] },
                  'success',
                  { '==': [{ var: 'severidade' }, 'CRITICA'] },
                  'danger',
                  { '==': [{ var: 'severidade' }, 'ALTA'] },
                  'warning',
                  'info',
                ],
              } as any,
              fallbackText: 'Taxa de Liquidação',
            },
          },
        },
      },
      {
        field: 'danosCivis',
        header: 'Prejuízo Civil Estimado',
        type: 'currency',
        format: 'BRL',
        width: '170px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'totalIndenizacoes',
        header: 'Indenizações Totais',
        type: 'currency',
        format: 'BRL',
        width: '170px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'totalPago',
        header: 'Total Indenizado',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'totalPendente',
        header: 'Saldo Pendente',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar sinistros por local, missão ou descrição...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Sinistros', filter: '', icon: 'account_balance' },
          { id: 'critico', label: 'Severidade Crítica', filter: "severidade='CRITICA'", icon: 'warning' },
          { id: 'pendente', label: 'Saldo Pendente', filter: 'totalPendente > 0', icon: 'pending' },
          { id: 'homologado', label: '100% Homologado', filter: 'totalPendente = 0', icon: 'verified' },
        ],
        showAdvancedButton: true,
      },
    },
    behavior: {
      filtering: {
        columnFilters: {
          enabled: true,
        },
      },
      ...createBentoDetailExpansion([
        {
          type: 'cardGrid',
          title: 'Auditoria Fiduciária & Conformidade de Sinistro',
          subtitle: 'Protocolo regulatório regido pelas cláusulas do Acordo de Sokovia',
          columns: 3,
          minCardWidth: 280,
          cards: [
            {
              id: 'card-origem',
              title: 'Origem & Narrativa Pericial',
              subtitle: 'Circunstâncias e missão associada',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'badge',
                      labelExpr: 'row.severidade',
                      icon: 'emergency',
                    },
                    {
                      type: 'metric',
                      label: 'Missão de Origem',
                      valueExpr: 'row.missao',
                      caption: 'Operação tática catalogada',
                      icon: 'military_tech',
                    },
                    {
                      type: 'metric',
                      label: 'Teatro do Dano',
                      valueExpr: 'row.local',
                      icon: 'location_on',
                    },
                    {
                      type: 'metric',
                      label: 'Laudo Pericial',
                      valueExpr: 'row.descricao',
                      icon: 'description',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-financeiro-balanco',
              title: 'Balanço Compensatório',
              subtitle: 'Auditoria de valores e cobertura',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Prejuízo Civil Estimado',
                      valueExpr: 'row.danosCivis',
                      caption: 'Sinistralidade apurada em campo',
                      icon: 'broken_image',
                    },
                    {
                      type: 'progress',
                      label: 'Índice de Liquidação de Indenizações',
                      valueExpr: '= round(min(100, (totalPago / max(1, totalIndenizacoes)) * 100))',
                      max: 100,
                      showPercent: true,
                    },
                    {
                      type: 'metric',
                      label: 'Total Já Liquidado',
                      valueExpr: 'row.totalPago',
                      caption: 'Repasses confirmados aos civis',
                      icon: 'payments',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-sokovia-protocolo',
              title: 'Fundo Tático S.H.I.E.L.D.',
              subtitle: 'Status fiduciário e conciliação',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Total Homologado',
                      valueExpr: 'row.totalIndenizacoes',
                      caption: 'Teto máximo pactuado em juízo',
                      icon: 'gavel',
                    },
                    {
                      type: 'metric',
                      label: 'Saldo Pendente de Repasse',
                      valueExpr: 'row.totalPendente',
                      caption: 'Aguardando validação pericial',
                      icon: 'pending_actions',
                    },
                    {
                      type: 'badge',
                      labelExpr: '= row.totalPendente == 0 ? "TOTALMENTE LIQUIDADO" : "CONCILIAÇÃO EM CURSO"',
                      icon: 'verified',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]),
    },
  } as unknown as CrudMetadata['table'],
  defaults: {
    openMode: 'drawer',
  },
};

