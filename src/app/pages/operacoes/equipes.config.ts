import type { CrudMetadata } from '@praxisui/crud';
import type { RichContentDocument } from '@praxisui/core';
import { createBentoDetailExpansion } from '../shared/detail-expansion.helper';

export const EQUIPES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/equipes',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'ID',
        width: '80px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'nome',
        header: 'Nome da Equipe / Esquadrão',
        width: '260px',
        sortable: true,
      },
      {
        field: 'sigla',
        header: 'Sigla',
        width: '120px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'basePrincipalNome',
        header: 'Base Principal Designada',
        width: '240px',
        sortable: true,
      },
      {
        field: 'prontidaoScore',
        header: 'Prontidão Operacional',
        width: '180px',
        align: 'center',
        sortable: true,
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: "row.status === 'ATIVA' ? 95 : row.status === 'RESERVA' ? 70 : 40",
              total: 100,
              toneExpr: "row.status === 'ATIVA' ? 'success' : row.status === 'RESERVA' ? 'info' : 'warning'",
              fallbackText: 'Prontidão',
            },
          },
        },
      },
      {
        field: 'status',
        header: 'Status Tático',
        width: '140px',
        align: 'center',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar equipes por nome, sigla ou base...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Esquadrões', filter: '', icon: 'diversity_3' },
          { id: 'ativa', label: 'Prontidão Ativa', filter: "status='ATIVA'", icon: 'verified_user' },
          { id: 'reserva', label: 'Reserva Tática', filter: "status='RESERVA'", icon: 'shield' },
          { id: 'missoes', label: 'Em Missão', filter: "status='EM_MISSAO'", icon: 'flight_takeoff' },
        ],
        showAdvancedButton: true,
      },
    },
    behavior: {
      filtering: {
        columnFilters: {
          enabled: true,
        },
        advancedFilters: {
          schemaUrl: '/schemas/filtered?path=/api/operations/equipes/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['nome', 'status', 'sigla'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
      expansion: createBentoDetailExpansion([
        {
          type: 'cardGrid',
          title: 'Dossiê do Esquadrão & Desdobramento Operacional',
          subtitle: 'Composição tática de agentes, base de operações e prontidão de resposta',
          columns: 3,
          minCardWidth: 280,
          cards: [
            {
              id: 'card-esquadrao',
              title: 'Esquadrão & Base',
              subtitle: 'Identificação e base designada',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'badge',
                      labelExpr: 'row.sigla',
                      icon: 'shield',
                    },
                    {
                      type: 'metric',
                      label: 'Base Designada',
                      valueExpr: 'row.basePrincipalNome',
                      icon: 'domain',
                    },
                    {
                      type: 'metric',
                      label: 'Status Tático',
                      valueExpr: 'row.status',
                      icon: 'flag',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-capacidade',
              title: 'Prontidão & Histórico',
              subtitle: 'Capacidade e telemetria',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'progress',
                      label: 'Prontidão Operacional do Squad',
                      valueExpr: "row.status === 'ATIVA' ? 95 : row.status === 'RESERVA' ? 70 : 40",
                      max: 100,
                      showPercent: true,
                    },
                    {
                      type: 'metric',
                      label: 'Efetivo de Operadores',
                      valueExpr: "row.status === 'ATIVA' ? '16 Operadores Táticos' : '8 Operadores em Reserva'",
                      icon: 'groups',
                    },
                    {
                      type: 'metric',
                      label: 'Histórico de Missões',
                      valueExpr: "'Esquadrão Operacional ' + (row.sigla || row.nome)",
                      icon: 'military_tech',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-lideranca',
              title: 'Liderança & Acesso',
              subtitle: 'Comando e autorização',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Líder Tático',
                      valueExpr: "'Comando Tático ' + (row.basePrincipalNome || 'Central')",
                      icon: 'person_star',
                    },
                    {
                      type: 'metric',
                      label: 'Nível de Autorização',
                      valueExpr: "'Credencial Classe Vingadores'",
                      icon: 'verified_user',
                    },
                    {
                      type: 'metric',
                      label: 'ID do Esquadrão',
                      valueExpr: 'row.id',
                      icon: 'pin',
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

export const EQUIPES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'equipes-kpi-grid',
      items: [
        {
          id: 'equipes',
          label: 'Esquadrões Registrados',
          value: '5 Equipes',
          caption: 'Compostas por heróis de ponta',
          icon: 'diversity_3',
          tone: 'info',
        },
        {
          id: 'ativas',
          label: 'Prontidão Máxima',
          value: '4 Ativas',
          caption: 'Mobilizáveis para resposta imediata',
          icon: 'verified_user',
          tone: 'success',
        },
        {
          id: 'reserva',
          label: 'Reserva & Suporte',
          value: '1 em Treinamento',
          caption: 'Squad em ciclo de integração',
          icon: 'shield',
          tone: 'neutral',
        },
        {
          id: 'bases',
          label: 'Bases Interligadas',
          value: '5 Complexos',
          caption: 'Presença e ancoragem tática',
          icon: 'hub',
          tone: 'info',
        },
      ],
    },
  ],
};
