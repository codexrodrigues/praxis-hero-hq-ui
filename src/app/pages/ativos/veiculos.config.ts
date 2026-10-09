import type { CrudMetadata } from '@praxisui/crud';
import { createBentoDetailExpansion } from '../shared/detail-expansion.helper';

export const VEICULOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'assets/veiculos',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    cards: [
      {
        id: 'all',
        label: 'Unidades na Frota',
        value: '8 Veículos',
        caption: 'Aeronaves, hovercrafts e terrestres',
        icon: 'rocket_launch',
        tone: 'info',
        filter: {},
      },
      {
        id: 'operacional',
        label: 'Prontidão de Voo',
        value: '5 Disponíveis',
        caption: 'Abastecidos e prontos para decolagem',
        icon: 'verified',
        tone: 'success',
        filter: { status: 'OPERACIONAL' },
      },
      {
        id: 'manutencao',
        label: 'Em Revisão / Hangar',
        value: '2 em Manutenção',
        caption: 'Calibragem de propulsores iônicos',
        icon: 'build',
        tone: 'warning',
        filter: { status: 'MANUTENCAO' },
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
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'nome', 'tipo', 'capacidade', 'proprietarioNome', 'status'],
      order: ['id', 'nome', 'tipo', 'prontidao', 'capacidade', 'proprietarioNome', 'status'],
      additions: [
        {
          field: 'prontidao',
          header: 'Prontidão de Voo',
          width: '180px',
          align: 'center',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: "row.status === 'OPERACIONAL' ? 95 : row.status === 'MANUTENCAO' ? 45 : 15",
                total: 100,
                toneExpr: "row.status === 'OPERACIONAL' ? 'success' : row.status === 'MANUTENCAO' ? 'warning' : 'danger'",
                fallbackText: 'Prontidão',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '80px', align: 'center', header: 'Cód.' },
        nome: { width: '240px', header: 'Identificação da Unidade' },
        tipo: { width: '140px', align: 'center', header: 'Plataforma' },
        capacidade: { width: '140px', align: 'center', header: 'Tripulação / Carga' },
        proprietarioNome: { width: '220px', header: 'Custodiante / Piloto' },
        status: { width: '150px', align: 'center', header: 'Disponibilidade' },
      },
    },
    columns: [],
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
                      valueExpr: "row.tipo === 'ESPACIAL' ? 'Propulsor Hiperespacial Quântico' : row.tipo === 'AEREO' ? 'Turbinas Repulsoras Stark VTOL' : 'Motor Híbrido Turbinado Nível V'",
                      icon: 'mode_fan',
                    },
                    {
                      type: 'metric',
                      label: 'Velocidade Máxima',
                      valueExpr: "row.tipo === 'ESPACIAL' ? 'Dobra 2 (Suborbital)' : row.tipo === 'AEREO' ? 'Mach 4.5' : '380 km/h com Blindagem Reativa'",
                      icon: 'speed',
                    },
                    {
                      type: 'metric',
                      label: 'Autonomia de Voo',
                      valueExpr: "'12.000 km sem reabastecimento'",
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
                      valueExpr: "row.tipo === 'ESPACIAL' ? 'Plataforma Orbital S.H.I.E.L.D.' : row.tipo === 'AEREO' ? 'Hangar Central - Helicarrier' : 'Garagem Subterrânea HQ'",
                      icon: 'warehouse',
                    },
                    {
                      type: 'metric',
                      label: 'Carga de Baterias / Combustível',
                      valueExpr: "row.status === 'OPERACIONAL' ? '98% Carga Total' : '35% Em Recarga'",
                      icon: 'local_gas_station',
                    },
                    {
                      type: 'metric',
                      label: 'Blindagem do Casco',
                      valueExpr: "'Liga de Titânio-Vibranium'",
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

