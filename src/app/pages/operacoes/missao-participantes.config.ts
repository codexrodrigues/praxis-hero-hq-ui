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
    cards: [
      {
        id: 'total',
        label: 'Escalas Operacionais',
        value: 'Efetivo Escalado',
        caption: 'Participantes vinculados a missões em campo',
        icon: 'groups',
        tone: 'info',
        filter: {},
      },
      {
        id: 'lideres',
        label: 'Liderança Tática',
        value: 'Comandantes de Campo',
        caption: 'Referências principais de esquadrão',
        icon: 'military_tech',
        tone: 'primary',
        filter: { papel: 'LIDER' },
      },
      {
        id: 'suporte',
        label: 'Suporte & Especialistas',
        value: 'Apoio Operacional',
        caption: 'Retaguarda, inteligência e contenção',
        icon: 'shield',
        tone: 'neutral',
        filter: { papel: 'SUPORTE' },
      },
      {
        id: 'sucesso',
        label: 'Missões Bem-Sucedidas',
        value: 'Debriefing Positivo',
        caption: 'Participações concluídas com sucesso',
        icon: 'verified',
        tone: 'success',
        filter: { resultado: 'SUCESSO' },
      },
    ],
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
        papel: { width: '160px', align: 'center', header: 'Papel Tático' },
        ordem: { width: '110px', align: 'center', type: 'number', header: 'Ordem' },
        principal: { width: '130px', align: 'center', header: 'Líder Principal' },
        resultado: { width: '160px', align: 'center', header: 'Resultado Individual' },
      },
    },
    toolbar: {
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Escalas', filter: {}, icon: 'groups' },
          { id: 'lideres', label: 'Líderes de Missão', filter: { papel: 'LIDER' }, icon: 'military_tech' },
          { id: 'principais', label: 'Referência Principal', filter: { principal: true }, icon: 'star' },
          { id: 'sucesso', label: 'Resultado: Sucesso', filter: { resultado: 'SUCESSO' }, icon: 'verified' },
        ],
        showAdvancedButton: true,
      },
    },
    behavior: {
      selection: {
        enabled: true,
        type: 'multiple',
        mode: 'checkbox',
        allowSelectAll: true,
        checkboxPosition: 'start',
        persistSelection: true,
        persistOnDataUpdate: false,
        visual: {
          highlightSelected: true,
          showSelectionCount: true,
        },
      },
      filtering: {
        enabled: true,
        columnFilters: {
          enabled: true,
        },
        advancedFilters: {
          enabled: true,
          settings: {
            inline: true,
            alwaysVisibleFields: ['papel', 'principal', 'resultado'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
      expansion: {
        enabled: true,
        source: 'schema',
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};
