import type { CrudMetadata } from '@praxisui/crud';
import type { RichContentDocument } from '@praxisui/core';
import { createBentoDetailExpansion } from '../shared/detail-expansion.helper';

export const VEICULOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'assets/veiculos',
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
      },
      {
        field: 'nome',
        header: 'Identificação da Unidade',
        width: '240px',
        sortable: true,
      },
      {
        field: 'tipo',
        header: 'Plataforma',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'prontidao',
        header: 'Prontidão de Voo',
        width: '180px',
        align: 'center',
        sortable: true,
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.prontidaoScore',
              total: 100,
              toneExpr: 'row.prontidaoTone',
              fallbackText: 'Prontidão',
            },
          },
        },
      },
      {
        field: 'capacidade',
        header: 'Tripulação / Carga',
        type: 'number',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'proprietarioNome',
        header: 'Custodiante / Piloto',
        width: '220px',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Disponibilidade',
        width: '150px',
        align: 'center',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar veículos por nome, categoria ou piloto...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Toda a Frota', filter: '', icon: 'rocket_launch' },
          { id: 'operacional', label: 'Em Operação / Prontidão', filter: "status='OPERACIONAL'", icon: 'verified' },
          { id: 'manutencao', label: 'Em Manutenção / Hangar', filter: "status='MANUTENCAO'", icon: 'build' },
          { id: 'aerea', label: 'Aeronaves & Espaciais', filter: "tipo='AERONAVE' or tipo='ESPACIAL'", icon: 'flight' },
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
          schemaUrl: '/schemas/filtered?path=/api/assets/veiculos/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['nome', 'tipo', 'status', 'proprietarioNome'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
      ...createBentoDetailExpansion([
        {
          type: 'cardGrid',
          title: 'Dossiê Técnico & Hangar Operacional',
          subtitle: 'Especificações aeroespaciais, capacidade de propulsão e telemetria de frota',
          columns: 3,
          minCardWidth: 280,
          cards: [
            {
              id: 'card-propulsao',
              title: 'Propulsão & Performance',
              subtitle: 'Motores, turbinas e velocidade limite',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Sistema de Propulsão',
                      valueExpr: 'row.sistemaPropulsao',
                      icon: 'mode_fan',
                    },
                    {
                      type: 'metric',
                      label: 'Velocidade Máxima',
                      valueExpr: 'row.velocidadeMax',
                      icon: 'speed',
                    },
                    {
                      type: 'metric',
                      label: 'Autonomia de Voo',
                      valueExpr: 'row.autonomiaVoo',
                      icon: 'flight_takeoff',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-hangar',
              title: 'Telemetria de Hangar',
              subtitle: 'Armazenamento e combustível',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Hangar de Alocação',
                      valueExpr: 'row.hangarAlocacao',
                      icon: 'warehouse',
                    },
                    {
                      type: 'metric',
                      label: 'Carga de Baterias / Combustível',
                      valueExpr: 'row.nivelCombustivel',
                      icon: 'local_gas_station',
                    },
                    {
                      type: 'metric',
                      label: 'Blindagem do Casco',
                      valueExpr: 'row.blindagemCasco',
                      icon: 'security',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-piloto',
              title: 'Piloto & Sortie Tática',
              subtitle: 'Comandante e capacidade de missão',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'badge',
                      labelExpr: 'row.status',
                      icon: 'verified',
                    },
                    {
                      type: 'metric',
                      label: 'Piloto Credenciado',
                      valueExpr: 'row.proprietarioNome',
                      icon: 'person_pin',
                    },
                    {
                      type: 'metric',
                      label: 'Capacidade Total',
                      valueExpr: 'row.capacidade',
                      icon: 'airline_seat_recline_extra',
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

export const VEICULOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'veiculos-kpi-grid',
      items: [
        {
          id: 'registradas',
          label: 'Unidades na Frota',
          value: '8 Veículos',
          caption: 'Aeronaves, hovercrafts e terrestres',
          icon: 'rocket_launch',
          tone: 'info',
        },
        {
          id: 'operacionais',
          label: 'Prontidão de Voo',
          value: '5 Disponíveis',
          caption: 'Abastecidos e prontos para decolagem',
          icon: 'verified',
          tone: 'success',
        },
        {
          id: 'manutencao',
          label: 'Em Revisão / Hangar',
          value: '2 em Manutenção',
          caption: 'Calibragem de propulsores iônicos',
          icon: 'build',
          tone: 'warning',
        },
        {
          id: 'eficiencia',
          label: 'Taxa Operacional',
          value: '62,5% Ativo',
          caption: 'Capacidade de transporte de squads',
          icon: 'speed',
          tone: 'neutral',
        },
      ],
    },
  ],
};
