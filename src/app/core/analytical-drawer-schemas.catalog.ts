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

export const BASE_FACILITY_ANALYTICAL_DRAWER_CONFIG: PraxisAnalyticalDrawerSchema = {
  kind: 'praxis.analytical-drawer.schema',
  version: '1.0.0',
  titleExpr: "row.nome + ' · #BASE-' + row.id",
  subtitleExpr: "(row.tipo || 'Complexo Militar') + ' · ' + (row.planeta || 'TERRA') + ' · Sigilo: ' + (row.sigilo || 'CONFIDENCIAL')",
  icon: 'hub',
  classificationPill: 'DOSSIÊ DE INSTALAÇÃO & INFRAESTRUTURA · PRAXIS GOVERNED',
  relations: [
    {
      key: 'acessos',
      endpoint: '/api/operations/bases-acessos/filter?baseId={id}',
      cardinality: 'collection',
      cache: true,
    },
  ],
  tabs: [
    {
      id: 'detalhes',
      label: 'Parâmetros da Instalação',
      icon: 'description',
      content: [
        { label: 'Código do Setor', icon: 'tag', valueExpr: "'#BASE-' + row.id" },
        { label: 'Nome da Instalação', icon: 'home_work', valueExpr: "row.nome" },
        { label: 'Tipologia Estrutural', icon: 'domain', valueExpr: "row.tipo" },
        { label: 'Nível de Sigilo & Acesso', icon: 'security', valueExpr: "row.sigilo" },
        { label: 'Teatro Planetário', icon: 'public', valueExpr: "row.planeta || 'TERRA'" },
        { label: 'Coordenadas Geodésicas', icon: 'location_on', valueExpr: "(row.latitude || 0) + '° Lat, ' + (row.longitude || 0) + '° Long'" },
        { label: 'Status da Instalação', icon: 'verified', valueExpr: "'100% Operacional e Guarnecida'" },
      ] as any,
    },
    {
      id: 'acessos',
      label: 'Credenciamento & Pessoal',
      icon: 'badge',
      content: {
        type: 'cardGrid',
        columns: 2,
        cards: [
          {
            title: 'Operadores Autorizados',
            subtitle: 'Credenciais ativas no complexo',
            badge: 'Acesso',
            className: 'card-highlight-info',
            content: [
              { type: 'metric', label: 'Efetivo', valueExpr: '(relations.acessos && relations.acessos.length) || 0', format: 'number' },
            ],
          },
          {
            title: 'Nível de Despacho',
            subtitle: 'Classificação de segurança necessária',
            badge: 'Sigilo',
            className: 'card-highlight-warning',
            content: [
              { type: 'metric', label: 'Classificação', valueExpr: "row.sigilo || 'CONFIDENCIAL'" },
            ],
          },
        ],
      },
    },
    {
      id: 'defesa',
      label: 'Defesa & Protocolos',
      icon: 'shield',
      content: {
        type: 'cardGrid',
        columns: 2,
        cards: [
          {
            title: 'Blindagem de Perímetro',
            subtitle: 'Escudo energético e campos de força',
            badge: 'Defesa',
            className: 'card-highlight-success',
            content: [
              { type: 'metric', label: 'Integridade', valueExpr: "'99.8% Nominal'" },
            ],
          },
          {
            title: 'Varredura de Intrusões',
            subtitle: 'Sensores de telemetria quântica',
            badge: 'Vigilância',
            className: 'card-highlight-info',
            content: [
              { type: 'metric', label: 'Status', valueExpr: "'Nenhuma ameaça detectada'" },
            ],
          },
        ],
      },
    },
  ],
};

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

/**
 * Catálogo canônico de gavetas analíticas da aplicação Praxis Hero HQ.
 * Mapeia as coordenadas REST para suas respectivas definições declarativas governadas.
 */
export const HERO_HQ_ANALYTICAL_DRAWER_SCHEMAS: Record<string, PraxisAnalyticalDrawerSchema> = {
  'operations/incidentes': INCIDENT_ANALYTICAL_DRAWER_CONFIG,
  'risk-intelligence/vw-indicadores-incidentes': INCIDENT_ANALYTICAL_DRAWER_CONFIG,
  'operations/missoes': MISSION_ANALYTICAL_DRAWER_CONFIG,
  'operations/bases': BASE_FACILITY_ANALYTICAL_DRAWER_CONFIG,
  'human-resources/funcionarios': HERO_ANALYTICAL_DRAWER_CONFIG,
  'risk-intelligence/ameacas': THREAT_ANALYTICAL_DRAWER_CONFIG,
};
