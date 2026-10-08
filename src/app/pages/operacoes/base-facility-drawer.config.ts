import type { PraxisAnalyticalDrawerSchema } from '@praxisui/core';

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
