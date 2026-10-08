import type { CrudMetadata } from '@praxisui/crud';
import type { RichContentDocument } from '@praxisui/core';
import { createBentoDetailExpansion } from '../shared/detail-expansion.helper';

export const EQUIPAMENTOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'assets/equipamentos',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'Cód.',
        width: '80px',
        align: 'center',
        sortable: true,
        filterable: false,
      },
      {
        field: 'nome',
        header: 'Equipamento / Traje',
        width: '260px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'tipo',
        header: 'Categoria Tática',
        width: '160px',
        align: 'center',
        sortable: true,
        filterable: true,
      },
      {
        field: 'resistencia',
        header: 'Integridade da Blindagem',
        width: '190px',
        align: 'center',
        sortable: true,
        filterable: true,
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.resistenciaScore',
              total: 100,
              toneExpr: 'row.resistenciaTone',
              fallbackText: 'Blindagem',
            },
          },
        },
      },
      {
        field: 'proprietarioNome',
        header: 'Custodiante / Herói',
        width: '220px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'status',
        header: 'Status de Custódia',
        width: '160px',
        align: 'center',
        sortable: true,
        filterable: true,
      },
    ],
    toolbar: {
      visible: true,
      filters: {
        enabled: true,
        showAdvancedButton: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Itens', icon: 'inventory_2', filter: {} },
          { id: 'custodia', label: 'Em Uso / Custódia', icon: 'verified_user', filter: { status: 'EM_USO' } },
          { id: 'manutencao', label: 'Em Manutenção', icon: 'build', filter: { status: 'MANUTENCAO' } },
          { id: 'estoque', label: 'Disponível em Arsenal', icon: 'shelves', filter: { status: 'DISPONIVEL' } },
        ],
      },
    },
    behavior: {
      filtering: {
        enabled: true,
        columnFilters: {
          enabled: true,
        },
        advancedFilters: {
          enabled: true,
          settings: {
            showAdvanced: true,
            alwaysVisibleFields: ['nome', 'tipo', 'status'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
      ...createBentoDetailExpansion([
        {
          type: 'cardGrid',
          title: 'Dossiê Técnico & Telemetria Balística',
          subtitle: 'Especificações de manufatura, blindagem reativa e protocolos de custódia militar',
          columns: 3,
          minCardWidth: 280,
          cards: [
            {
              id: 'card-especificacoes',
              title: 'Blindagem & Integridade',
              subtitle: 'Diagnóstico estrutural e absorção de impacto',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'badge',
                      labelExpr: 'row.statusBadge',
                      icon: 'verified_user',
                    },
                    {
                      type: 'metric',
                      label: 'Categoria Tática',
                      valueExpr: 'row.tipo',
                      icon: 'category',
                    },
                    {
                      type: 'progress',
                      label: 'Integridade Estrutural',
                      valueExpr: 'row.resistenciaScore',
                      max: 100,
                      showPercent: true,
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-telemetria',
              title: 'Telemetria & Propulsão',
              subtitle: 'Célula de energia e suporte balístico',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Fonte de Energia Primária',
                      valueExpr: 'row.fonteEnergia',
                      icon: 'bolt',
                    },
                    {
                      type: 'metric',
                      label: 'Engenharia & Origem',
                      valueExpr: 'row.tecnologiaOrigem',
                      icon: 'precision_manufacturing',
                    },
                    {
                      type: 'metric',
                      label: 'Última Calibração Tática',
                      valueExpr: 'row.ultimaRevisaoFormatada',
                      icon: 'history_toggle_off',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-custodia',
              title: 'Custódia & Governança',
              subtitle: 'Protocolo de cofre e credenciamento',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Custodiante Credenciado',
                      valueExpr: 'row.proprietarioNome',
                      icon: 'shield_person',
                    },
                    {
                      type: 'metric',
                      label: 'Localização de Armaria',
                      valueExpr: 'row.localizacaoArmaria',
                      icon: 'shelves',
                    },
                    {
                      type: 'metric',
                      label: 'Nível de Autorização',
                      valueExpr: 'row.autorizacaoAcesso',
                      icon: 'key',
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

export const EQUIPAMENTOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'equipamentos-kpi-grid',
      items: [
        {
          id: 'total',
          label: 'Total de Itens Táticos',
          value: '62 Ativos',
          caption: 'Trajes, armas e exoesqueletos',
          icon: 'shield',
          tone: 'info',
        },
        {
          id: 'custodia',
          label: 'Em Custódia / Uso Ativo',
          value: '56 Itens',
          caption: 'Alocados a heróis em missão',
          icon: 'verified_user',
          tone: 'success',
        },
        {
          id: 'manutencao',
          label: 'Em Manutenção',
          value: '2 Itens',
          caption: 'Recarga de reator e nanotecnologia',
          icon: 'build',
          tone: 'warning',
        },
        {
          id: 'estoque',
          label: 'Em Reserva de Arsenal',
          value: '4 Itens',
          caption: 'Disponíveis no cofre central',
          icon: 'inventory_2',
          tone: 'neutral',
        },
      ],
    },
  ],
};
