import type { PraxisAnalyticalDrawerSchema } from '@praxisui/core';

export const THREAT_ANALYTICAL_DRAWER_CONFIG: PraxisAnalyticalDrawerSchema = {
  kind: 'praxis.analytical-drawer.schema',
  version: '1.0.0',
  titleExpr: "row.nome + ' · #THR-' + row.id",
  subtitleExpr: "'Classe: ' + (row.classe || 'NÃO IDENTIFICADA') + ' · Origem: ' + (row.planeta || 'DESCONHECIDA') + ' · Nível ' + (row.nivel || 1) + '/10'",
  icon: 'warning',
  classificationPill: 'DOSSIÊ DE INTELIGÊNCIA TÁTICA · PRAXIS GOVERNED',
  relations: [
    {
      key: 'missoes',
      endpoint: '/api/operations/missoes/filter?ameacaId={id}',
      cardinality: 'collection',
      cache: true,
    },
  ],
  tabs: [
    {
      id: 'intel',
      label: 'Inteligência & Classificação',
      icon: 'description',
      content: [
        { label: 'Código de Registro', icon: 'tag', valueExpr: "'#THR-' + row.id" },
        { label: 'Designação da Ameaça', icon: 'crisis_alert', valueExpr: "row.nome" },
        { label: 'Classe de Perigo', icon: 'category', valueExpr: "row.classe" },
        { label: 'Nível de Letalidade', icon: 'warning', valueExpr: "'Nível ' + row.nivel + ' / 10'" },
        { label: 'Origem Planetária', icon: 'public', valueExpr: "row.planeta" },
        { label: 'Status Operacional', icon: 'verified', valueExpr: "row.status" },
        { label: 'Fundo de Captura / Recompensa', icon: 'payments', valueExpr: "row.recompensa", format: 'currency:BRL' },
      ] as any,
    },
    {
      id: 'missions',
      label: 'Operações de Engajamento',
      icon: 'military_tech',
      content: {
        type: 'cardGrid',
        columns: 2,
        cards: [
          {
            title: 'Missões Vinculadas',
            subtitle: 'Operações ativadas contra este alvo',
            badge: 'Engajamento',
            className: 'card-highlight-info',
            content: [
              { type: 'metric', label: 'Incursões', valueExpr: '(relations.missoes && relations.missoes.length) || 0', format: 'number' },
            ],
          },
          {
            title: 'Status Tático',
            subtitle: 'Condição atual do alvo',
            badge: 'Status',
            className: 'card-highlight-warning',
            content: [
              { type: 'metric', label: 'Situação', valueExpr: "row.status === 'CONTIDO' ? 'Alvo Neutralizado' : 'Em Confronto / Ativo'" },
            ],
          },
        ],
      },
    },
    {
      id: 'containment',
      label: 'Protocolos de Contenção',
      icon: 'security',
      content: {
        type: 'cardGrid',
        columns: 2,
        cards: [
          {
            title: 'Nível de Resposta',
            subtitle: 'Escalação tática de contenção',
            badge: 'Protocolo',
            className: 'card-highlight-danger',
            content: [
              { type: 'metric', label: 'Diretiva', valueExpr: "row.nivel >= 6 ? 'Protocolo Ômega Ativado' : 'Contenção Convencional'" },
            ],
          },
          {
            title: 'Prontidão de Custódia',
            subtitle: 'Instalação de contenção designada',
            badge: 'Custódia',
            className: 'card-highlight-success',
            content: [
              { type: 'metric', label: 'Unidade', valueExpr: "'Prisão de Segurança Máxima Raft / Espacial'" },
            ],
          },
        ],
      },
    },
  ],
};
