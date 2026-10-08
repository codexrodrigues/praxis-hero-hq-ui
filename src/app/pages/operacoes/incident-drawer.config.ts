import type { PraxisAnalyticalDrawerSchema } from '@praxisui/core';

export const INCIDENT_ANALYTICAL_DRAWER_CONFIG: PraxisAnalyticalDrawerSchema = {
  kind: 'praxis.analytical-drawer.schema',
  version: '1.0.0',
  titleExpr: "'Incidente #' + (row.id || row.incidenteId) + ' · ' + (row.local || 'Teatro Operacional')",
  subtitleExpr: "'Sinistro catalogado sob governança S.H.I.E.L.D. · ' + (row.ocorridoEm || '')",
  icon: 'crisis_alert',
  classificationPill: 'DOSSIÊ DE INVESTIGAÇÃO DE SINISTRO · PRAXIS GOVERNED',
  relations: [
    {
      key: 'indicadoresRisco',
      endpoint: '/api/risk-intelligence/vw-indicadores-incidentes/filter?incidenteId={id}',
      cardinality: 'single',
      cache: true,
    },
    {
      key: 'missao',
      endpoint: '/api/operations/missoes/{missaoId}',
      cardinality: 'single',
      cache: true,
    },
  ],
  tabs: [
    {
      id: 'pericia',
      label: 'Laudo & Perícia',
      icon: 'description',
      content: [
        { label: 'Código de Registro', icon: 'tag', valueExpr: "'#INC-' + (row.id || row.incidenteId)" },
        { label: 'Missão Vinculada', icon: 'flag', valueExpr: "relations.missao ? ('#MIS-' + relations.missao.id + ' - ' + relations.missao.titulo) : (row.missaoId ? ('#MIS-' + row.missaoId) : 'Não associada')" },
        { label: 'Classificação Tática', icon: 'emergency', valueExpr: "row.severidade" },
        { label: 'Teatro do Dano', icon: 'location_on', valueExpr: "row.local" },
        { label: 'Data e Hora', icon: 'calendar_today', valueExpr: "row.ocorridoEm" },
        { label: 'Prejuízo Civil Estimado', icon: 'account_balance', valueExpr: "row.danosCivis", format: 'currency:BRL' },
        { label: 'Vítimas Não Fatais', icon: 'healing', valueExpr: "(row.feridos || 0) + ' lesões catalogadas'" },
        { label: 'Vítimas Fatais', icon: 'heart_broken', valueExpr: "(row.mortos || 0) + ' civis falecidos'" },
        { label: 'Laudo Técnico Forense & Análise Circunstancial', icon: 'feed', valueExpr: "row.descricao", spanFull: true },
      ] as any,
    },
    {
      id: 'financeiro',
      label: 'Mitigação & Indenizações',
      icon: 'payments',
      content: {
        type: 'cardGrid',
        columns: 2,
        cards: [
          {
            title: 'Prejuízo Civil Apurado',
            subtitle: 'Estimativa de sinistralidade forense de campo',
            badge: 'Escalação',
            className: 'card-highlight-danger',
            content: [
              { type: 'metric', label: 'Sinistro', valueExpr: 'relations.indicadoresRisco.danosCivis || row.danosCivis', format: 'currency:BRL' },
            ],
          },
          {
            title: 'Indenizações Aprovadas',
            subtitle: 'Compensação aprovada contra sinistralidade',
            badge: 'Teto Sokovia',
            className: 'card-highlight-warning',
            content: [
              { type: 'metric', label: 'Aprovado', valueExpr: 'relations.indicadoresRisco.totalIndenizacoes || 0', format: 'currency:BRL' },
            ],
          },
          {
            title: 'Total Liquidado',
            subtitle: 'Repasses financeiros e obras finalizadas',
            badge: 'Liquidado',
            className: 'card-highlight-success',
            content: [
              { type: 'metric', label: 'Liquidado', valueExpr: 'relations.indicadoresRisco.totalPago || 0', format: 'currency:BRL' },
            ],
          },
          {
            title: 'Saldo Pendente',
            subtitle: 'Aguardando homologação de laudo pericial',
            badge: 'Em Aberto',
            className: 'card-highlight-info',
            content: [
              { type: 'metric', label: 'Pendente', valueExpr: 'relations.indicadoresRisco.totalPendente || 0', format: 'currency:BRL' },
            ],
          },
        ],
      },
    },
    {
      id: 'resposta',
      label: 'Resposta Emergencial',
      icon: 'timeline',
      content: [
        { label: 'Primeira Resposta', icon: 'timer', valueExpr: "'T+4 min: Contenção de perímetro acionada pela S.H.I.E.L.D.'" },
        { label: 'Evacuação Civil', icon: 'groups', valueExpr: "'Evacuação tática concluída sem baixas civis adicionais'" },
        { label: 'Status Operacional', icon: 'task_alt', valueExpr: "'Área estabilizada sob supervisão tática'", spanFull: true },
      ] as any,
    },
  ],
};
