import type { PraxisAnalyticalDrawerSchema } from '@praxisui/core';

export const HERO_ANALYTICAL_DRAWER_CONFIG: PraxisAnalyticalDrawerSchema = {
  kind: 'praxis.analytical-drawer.schema',
  version: '1.0.0',
  titleExpr: "(row.codinome || row.nomeCompleto) + ' · #' + row.id",
  subtitleExpr: "(row.cargoNome || 'Especialista Tático') + ' · ' + (row.departamentoNome || 'Divisão Tática') + ' · ' + (row.universo || 'Terra-616')",
  icon: 'badge',
  classificationPill: 'DOSSIÊ 360° · REGISTRO GOVERNADO PRAXIS',
  relations: [
    {
      key: 'folha',
      endpoint: '/api/human-resources/folhas-pagamento/filter?funcionarioId={id}',
      cardinality: 'collection',
      cache: true,
    },
    {
      key: 'missoes',
      endpoint: '/api/operations/missoes-participantes/filter?funcionarioId={id}',
      cardinality: 'collection',
      cache: true,
    },
    {
      key: 'equipamentos',
      endpoint: '/api/assets/equipamentos/filter?proprietarioId={id}',
      cardinality: 'collection',
      cache: true,
    },
  ],
  tabs: [
    {
      id: 'identity',
      label: 'Identidade & Registro Civil',
      icon: 'badge',
      content: [
        { label: 'Código de Registro', icon: 'tag', valueExpr: "'#HERO-' + row.id" },
        { label: 'Nome Civil Completo', icon: 'person', valueExpr: "row.nomeCompleto" },
        { label: 'Codinome / Alias', icon: 'military_tech', valueExpr: "row.codinome || row.nomeCompleto" },
        { label: 'Cargo Operacional', icon: 'work', valueExpr: "row.cargoNome || 'Especialista Operacional'" },
        { label: 'Departamento / Divisão', icon: 'corporate_fare', valueExpr: "row.departamentoNome || 'Divisão Tática'" },
        { label: 'Universo / Realidade', icon: 'public', valueExpr: "row.universo || 'Terra-616'" },
        { label: 'Status de Ativação', icon: 'verified_user', valueExpr: "row.ativo ? 'Ativo no Quadro Operacional' : 'Reserva Estratégica'" },
        { label: 'Comunicação Segura', icon: 'alternate_email', valueExpr: "row.email || 'confidencial@praxis.org'" },
        { label: 'Telemetria / Telefone', icon: 'call', valueExpr: "row.telefone || '+55 (11) 98888-0000'" },
        { label: 'Data de Ingresso', icon: 'event', valueExpr: "row.dataAdmissao || 'Não informada'" },
      ] as any,
    },
    {
      id: 'skills',
      label: 'Aptidões & Prontidão',
      icon: 'psychology',
      content: {
        type: 'cardGrid',
        columns: 2,
        cards: [
          {
            title: 'Reputação Civil & Pública',
            subtitle: 'Índice de aceitação metahumana',
            badge: 'Público',
            className: 'card-highlight-info',
            content: [
              { type: 'metric', label: 'Score Popular', valueExpr: "(row.scorePublico || 94) + '% aprovação'" },
            ],
          },
          {
            title: 'Avaliação Governamental',
            subtitle: 'Conformidade com Tratado de Sokovia',
            badge: 'Auditoria',
            className: 'card-highlight-success',
            content: [
              { type: 'metric', label: 'Conformidade', valueExpr: "(row.scoreGovernamental || 88) + '% homologado'" },
            ],
          },
          {
            title: 'Prontidão Operacional',
            subtitle: 'Capacidade de resposta em cenário crítico',
            badge: 'Prontidão',
            className: 'card-highlight-warning',
            content: [
              { type: 'metric', label: 'Nível', valueExpr: "row.ativo ? 'Nível Alpha (Pronto)' : 'Standby / Reserva'" },
            ],
          },
          {
            title: 'Classificação de Poder',
            subtitle: 'Graduação de impacto tático',
            badge: 'Escala',
            className: 'card-highlight-info',
            content: [
              { type: 'metric', label: 'Escalação', valueExpr: "'Nível Omega / Alto Impacto'" },
            ],
          },
        ],
      },
    },
    {
      id: 'payroll',
      label: 'Folha & Remuneração',
      icon: 'payments',
      content: {
        type: 'cardGrid',
        columns: 2,
        cards: [
          {
            title: 'Compensação Mensal',
            subtitle: 'Subsídio tático e benefícios contratuais',
            badge: 'CLT S.H.I.E.L.D.',
            className: 'card-highlight-success',
            content: [
              { type: 'metric', label: 'Salário Base', valueExpr: 'row.salario || 0', format: 'currency:BRL' },
            ],
          },
          {
            title: 'Histórico de Lançamentos',
            subtitle: 'Contracheques auditados no sistema',
            badge: 'Fiduciário',
            className: 'card-highlight-info',
            content: [
              { type: 'metric', label: 'Registros na Folha', valueExpr: '(relations.folha && relations.folha.length) || 0', format: 'number' },
            ],
          },
        ],
      },
    },
    {
      id: 'missions',
      label: 'Histórico de Missões',
      icon: 'military_tech',
      content: {
        type: 'cardGrid',
        columns: 2,
        cards: [
          {
            title: 'Incursões Operacionais',
            subtitle: 'Participação em missões ativas e encerradas',
            badge: 'Teatro',
            className: 'card-highlight-info',
            content: [
              { type: 'metric', label: 'Missões Designadas', valueExpr: '(relations.missoes && relations.missoes.length) || 0', format: 'number' },
            ],
          },
          {
            title: 'Taxa de Sucesso em Missões',
            subtitle: 'Eficácia em engajamentos de campo',
            badge: 'Desempenho',
            className: 'card-highlight-success',
            content: [
              { type: 'metric', label: 'Eficiência', valueExpr: "'98.4% Concluídas com Êxito'" },
            ],
          },
        ],
      },
    },
    {
      id: 'assets',
      label: 'Arsenal & Equipamentos',
      icon: 'shield',
      content: {
        type: 'cardGrid',
        columns: 2,
        cards: [
          {
            title: 'Equipamentos Vinculados',
            subtitle: 'Inventário tático sob custódia do operador',
            badge: 'Custódia',
            className: 'card-highlight-warning',
            content: [
              { type: 'metric', label: 'Itens em Uso', valueExpr: '(relations.equipamentos && relations.equipamentos.length) || 0', format: 'number' },
            ],
          },
          {
            title: 'Integridade dos Ativos',
            subtitle: 'Telemetria de manutenção e calibragem',
            badge: 'Arsenal',
            className: 'card-highlight-success',
            content: [
              { type: 'metric', label: 'Status dos Ativos', valueExpr: "'Operacional / Calibrado'" },
            ],
          },
        ],
      },
    },
  ],
};
