import type { PraxisAnalyticalDrawerSchema } from '@praxisui/core';

export const MISSION_ANALYTICAL_DRAWER_CONFIG: PraxisAnalyticalDrawerSchema = {
  kind: 'praxis.analytical-drawer.schema',
  version: '1.0.0',
  titleExpr: "'Missão #MIS-' + row.id + ' · ' + (row.titulo || 'Operação Tática')",
  subtitleExpr: "'Teatro: ' + (row.local || row.localizacao || 'Setor Global') + (row.ameacaNome ? ' · Alvo: ' + row.ameacaNome : '')",
  icon: 'military_tech',
  classificationPill: 'DOSSIÊ DE OPERAÇÃO & BRIEFING TÁTICO · PRAXIS GOVERNED',
  relations: [
    {
      key: 'participantes',
      endpoint: '/api/operations/missoes-participantes/filter?missaoId={id}',
      cardinality: 'collection',
      cache: true,
    },
    {
      key: 'incidentes',
      endpoint: '/api/operations/incidentes/filter?missaoId={id}',
      cardinality: 'collection',
      cache: true,
    },
  ],
  tabs: [
    {
      id: 'briefing',
      label: 'Briefing Tático & Diretrizes',
      icon: 'description',
      content: [
        { label: 'Código da Missão', icon: 'tag', valueExpr: "'#MIS-' + row.id" },
        { label: 'Teatro de Operações', icon: 'explore', valueExpr: "row.local || row.localizacao || 'Setor Global'" },
        { label: 'Ameaça / Alvo Tático', icon: 'crisis_alert', valueExpr: "row.ameacaNome || 'Não especificada'" },
        { label: 'Nível de Resposta', icon: 'priority_high', valueExpr: "row.prioridade" },
        { label: 'Status Operacional', icon: 'verified', valueExpr: "row.status" },
        { label: 'Janela de Início Previsto', icon: 'schedule', valueExpr: "row.inicioPrev || row.dataInicioPrevista || 'Imediato'" },
        { label: 'Janela de Fim Previsto', icon: 'event_available', valueExpr: "row.fimPrev || row.dataFimPrevista || 'Sob demanda tática'" },
        { label: 'Objetivo Estratégico & Diretrizes', icon: 'flag', valueExpr: "row.objetivo || row.descricao || 'Conter a ameaça com mínima sinistralidade civil.'", spanFull: true },
      ] as any,
    },
    {
      id: 'squad',
      label: 'Esquadrão Tático',
      icon: 'groups',
      content: {
        type: 'cardGrid',
        columns: 2,
        cards: [
          {
            title: 'Efetivo Alocado',
            subtitle: 'Operadores ativos em teatro de operações',
            badge: 'Tático',
            className: 'card-highlight-info',
            content: [
              { type: 'metric', label: 'Operadores', valueExpr: '(relations.participantes && relations.participantes.length) || 0', format: 'number' },
            ],
          },
          {
            title: 'Prontidão Operacional',
            subtitle: 'Status de mobilização das equipes',
            badge: 'Prontidão',
            className: 'card-highlight-success',
            content: [
              { type: 'metric', label: 'Prontidão', valueExpr: "row.status === 'CONCLUIDA' ? '100% Finalizado' : 'Operação Ativa'" },
            ],
          },
        ],
      },
    },
    {
      id: 'incidents',
      label: 'Sinistros & Danos',
      icon: 'emergency',
      content: {
        type: 'cardGrid',
        columns: 2,
        cards: [
          {
            title: 'Sinistros Reportados',
            subtitle: 'Ocorrências pós-confronto registradas',
            badge: 'Impacto',
            className: 'card-highlight-warning',
            content: [
              { type: 'metric', label: 'Ocorrências', valueExpr: '(relations.incidentes && relations.incidentes.length) || 0', format: 'number' },
            ],
          },
          {
            title: 'Perímetro Civil',
            subtitle: 'Contenção de danos e evacuação prévia',
            badge: 'Defesa',
            className: 'card-highlight-info',
            content: [
              { type: 'metric', label: 'Status', valueExpr: "relations.incidentes && relations.incidentes.length > 0 ? 'Danos Registrados' : 'Perímetro Preservado'" },
            ],
          },
        ],
      },
    },
  ],
};
