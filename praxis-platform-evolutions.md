# Praxis Platform Evolutions & Architectural Issues

Este documento cataloga, detalha e rastreia as necessidades de evolução, inconsistências de ciclo de vida e melhorias de arquitetura identificadas na **Plataforma Praxis** durante o desenvolvimento e a auditoria da aplicação modelo de excelência **Praxis Hero HQ**.

O objetivo deste catálogo é fornecer ao **Agente Executor de Plataforma** um plano de trabalho minucioso e exaustivo, com diagnósticos de causa raiz no monorepo, cenários correlatos ampliados para evitar correções pontuais míopes e critérios de aceite claros para garantir que as melhorias sejam robustas, escaláveis e canônicas.

---

## 📊 Matriz de Rastreamento de Issues de Plataforma

> **Instrução para o Agente Executor:** Conforme você investigar e resolver cada issue na plataforma (`praxis-ui-angular`, `praxis-metadata-starter` ou `praxis-config-starter`), atualize a coluna **Status**, registre a **Versão / Commit / PR** e marque a caixa de seleção `[x]` para acompanhamento contínuo da equipe.

| ID | Título da Demanda | Módulos Afetados | Severidade | Status | Versão / Commit / PR | Data Resolução | Validação Downstream (Hero HQ) |
|:---:|---|---|:---:|:---:|:---:|:---:|:---:|
| [**#1**](#-issue-1-duplo-carregamento-redundante-no-praxiscuitable-via-praxisicrud) | Duplo Carregamento Redundante no `@praxisui/table` via `@praxisui/crud` | `@praxisui/crud`<br>`@praxisui/table` | 🔴 Alta | `[x] Resolvida` | PR #562 (`327fd7786`) | 2026-10-07 | Validado (interceptor removido) |
| [**#2**](#-issue-2-destruição-de-estado-e-recarregamento-de-schemas-em-shells-com-abas) | Destruição de Estado e Recarregamento de Schemas em Shells com Abas | `@praxisui/dynamic-form`<br>`DynamicFormService` | 🟡 Média | `[x] Resolvida` | PR #564 (`ae62e5c33`) | 2026-10-07 | Validado (L1 compiled schema cache, SelectOptionRegistry e *praxisKeepAliveTab) |
| [**#3**](#-issue-3-barramento-canônico-de-eventos-entre-widgets-praxiswidgeteventbus) | Barramento Canônico de Eventos entre Widgets (`PraxisWidgetEventBus`) | `@praxisui/page-builder`<br>`@praxisui/rich-content`<br>`@praxisui/charts` | 🟡 Média | `[ ] Aberta` | — | — | Pendente |
| [**#4**](#-issue-4-governança-declarativa-de-filtros-rápidos-e-filtros-avançados-na-tabela) | Governança Declarativa de Filtros Rápidos e Filtros Avançados na Tabela | `@praxisui/table`<br>`@praxisui/crud`<br>`praxis-metadata-starter` | 🟢 Baixa | `[x] Resolvida` | Backend: `praxis-metadata-starter` (`@QuickFilter`, resolver)<br>Frontend: `@praxisui/table`, `@praxisui/core` | 2026-10-07 | Validado no `funcionarios-page` |
| [**#5**](#-issue-5-suporte-declarativo-a-ícones-e-cores-condicionais-em-apresentações-booleanas-e-enums) | Suporte Declarativo a Ícones e Cores Condicionais em Apresentações Booleanas e Enums | `@praxisui/dynamic-form`<br>`@praxisui/dynamic-fields`<br>`@UISchema` (Java) | 🟡 Média | `[x] Resolvida` | PR #563 (Frontend: `60aed6867`)<br>PR #241 (Backend: `484e488c47`) | 2026-10-07 | Validado (override CSS removido, build OK) |
| [**#6**](#-issue-6-descoberta-e-ativação-automática-de-filtros-inline-inteligentes-no-praxisicrud) | Descoberta e Ativação Automática de Filtros Inline Inteligentes no `@praxisui/crud` | `@praxisui/crud`<br>`@praxisui/table`<br>`praxis-metadata-starter` | 🟡 Média | `[x] Resolvida` | `@praxisui/crud` (`CrudFilterBarConfig`, auto-discovery) | 2026-10-07 | Validado no `funcionarios-page` |
| [**#7**](#-issue-7-normalização-robusta-de-parâmetros-de-path-em-schemasfiltered) | Normalização Robusta de Parâmetros de Path em `/schemas/filtered` | `praxis-metadata-starter`<br>`ApiDocsController` | 🟢 Baixa | `[x] Resolvida` | PR #240 (`d59641bf9e`) | 2026-10-07 | Validado (testes unitários) |
| [**#8**](#-issue-8-hierarquia-visual-de-seções-e-densidade-de-enquadramento-em-dossiêsdrawers-caixa-dentro-de-caixa-vs-seções-plaindivider) | Hierarquia Visual de Seções e Densidade de Enquadramento em Dossiês/Drawers ("Caixa Dentro de Caixa" vs Seções Plain/Divider) | `@praxisui/dynamic-form`<br>`Design System`<br>`praxis-metadata-starter` | 🟡 Média | `[ ] Aberta` | — | — | Pendente |
| [**#9**](#-issue-9-governança-canônica-e-descoberta-de-serviços-de-métricas-e-dashboards-statscapabilities-e-praxischarts) | Governança Canônica e Descoberta de Serviços de Métricas e Dashboards (`/stats/capabilities` e `@praxisui/charts`) | `praxis-metadata-starter`<br>`@praxisui/charts`<br>`@praxisui/page-builder` | 🟡 Média | `[ ] Aberta` | — | — | Pendente |
| [**#10**](#-issue-10-refinamento-visual-do-pdx-inline-toggle-e-seletor-tri-state-para-filtros-booleanos) | Refinamento Visual do `pdx-inline-toggle` e Seletor Tri-State para Filtros Booleanos | `@praxisui/dynamic-fields`<br>`@praxisui/table` | 🟡 Média | `[x] Resolvida` | `86839d182` | 2026-10-07 | Validado (`funcionarios-page` tri-state e inline-toggle) |
| [**#11**](#-issue-11-suporte-a-filtros-desacoplados-e-teleporte-via-cdk-portal-praxisfilterportal) | Suporte a Filtros Desacoplados e Teleporte via CDK Portal (`PraxisFilterPortal`) | `@praxisui/table`<br>`@praxisui/crud` | 🟡 Média | `[ ] Aberta` | — | — | Pendente |
| [**#12**](#-issue-12-componente-canônico-governado-de-barra-de-escopo-tática-praxisscopebar) | Componente Canônico Governado de Barra de Escopo Tática (`PraxisScopeBar`) | `@praxisui/table`<br>`@praxisui/rich-content`<br>`praxis-metadata-starter` | 🟡 Média | `[ ] Aberta` | — | — | Pendente |
| [**#13**](#-issue-13-tokens-canônicos-de-menu-e-estilização-de-state-layer-de-hover-em-overlays-praxis-menu-styles) | Tokens Canônicos de Menu e Estilização de State Layer de Hover em Overlays (`praxis-menu-styles`) | `@praxisui/core`<br>`@praxisui/table` | 🟡 Média | `[x] Resolvida` | `@praxisui/core` (`praxis-menu-styles`), `@praxisui/table` | 2026-10-07 | Validado no `praxis-hero-hq-ui` (CSS local removido) |
| [**#14**](#-issue-14-evolução-do-modo-de-tabela-em-gráficos-praxis-chart-scroll-interno-sticky-header-eliminação-de-false-affordance-e-ux-analítico) | Evolução do Modo de Tabela em Gráficos (`praxis-chart`): Scroll Interno, Sticky Header, Eliminação de False Affordance e UX Analítico | `@praxisui/charts`<br>`praxis-chart.component.ts` | 🟡 Média | `[x] Resolvida` | `@praxisui/charts` (`PraxisChartComponent`) | 2026-10-07 | Validado no `praxis-hero-hq-ui` (CSS local removido, build OK) |
| [**#15**](#-issue-15-síntese-compulsória-de-botão-adicionar-em-recursos-read-only-desalinhamento-de-hover-e-perda-de-contraste-mdc) | Síntese Compulsória de Botão "Adicionar" em Recursos Read-Only, Desalinhamento de Hover e Perda de Contraste MDC | `@praxisui/table`<br>`@praxisui/crud`<br>`@praxisui/core` | 🟡 Média | `[x] Resolvida` | `@praxisui/table` (`praxis-table-toolbar.ts`, `praxis-table.ts`), `@praxisui/core` | 2026-10-07 | Validado no `praxis-hero-hq-ui` (build downstream OK, 99/99 testes) |
| [**#17**](#-issue-17-redesenho-didático-e-funcional-do-editor-de-rich-content-árvore-hierárquica-drag--drop-icon-picker-e-suporte-canônico-a-grids-e-actioncard-aninhado) | Redesenho Didático e Funcional do Editor de Rich Content: Árvore Hierárquica, Drag & Drop, Icon Picker e Suporte Canônico a Grids e `actionCard` Aninhado | `@praxisui/rich-content`<br>`praxis-rich-content-config-editor.ts`<br>`rich-content-authoring.ts` | 🔴 Alta | `[x] Resolvida` | `@praxisui/rich-content` | 2026-10-07 | Suporte total a `actionCard` e nós compostos no `compose`, controles nativos de Grid, árvore hierárquica na lateral com ícones e rótulos de negócio, botões de reordenação vertical e seletor visual de ícones Material Symbols com busca integrada; 175/175 testes unitários e build downstream aprovados |
| [**#18**](#-issue-18-desalinhamento-de-authoring-em-charts-praxischartwidgetconfigeditor-não-suporta-runtime-config-exigindo-chartdocument-e-bloqueando-edição-visual) | Desalinhamento de Authoring em Charts: `PraxisChartWidgetConfigEditor` Não Suporta Runtime `config`, Exigindo `chartDocument` e Bloqueando Edição Visual | `@praxisui/charts`<br>`praxis-chart-widget-config-editor.ts`<br>`chart-canonical-contract-mapper.service.ts` | 🟡 Média | `[x] Resolvida` | `@praxisui/charts` (`toPraxisXUiChartContract`, auto-promote no editor, sync bidirecional) | 2026-10-07 | 397/397 testes unitários OK, build downstream OK |
| [**#19**](#-issue-19-ausência-de-registro-automático-e-preset-palette-do-praxisuilist-no-page-builder) | Ausência de Registro Automático e Preset Palette do `@praxisui/list` no Page Builder | `@praxisui/list`<br>`@praxisui/page-builder` | 🟡 Média | `[x] Resolvida` | `@praxisui/list` (`PRAXIS_LIST_INSERTION_PRESETS`), `@praxisui/page-builder` (`providePraxisPageBuilderWidgets`) | 2026-10-07 | 13/13 spec list metadata OK, 4/4 spec page-builder OK, build downstream OK |
| [**#20**](#-issue-20-ausência-de-affordance-visual-de-filtro-cruzado-ativo-na-toolbar-da-tabela) | Ausência de Affordance Visual de Filtro Cruzado Ativo na Toolbar da Tabela | `@praxisui/table`<br>`@praxisui/charts`<br>`@praxisui/core` | 🟡 Média | `[x] Resolvida` | `@praxisui/table` (chips na toolbar, `queryContextClear`), `@praxisui/charts` (`clearSelection`), `@praxisui/core` (`DynamicWidgetPageComponent.handleQueryContextClear`) | 2026-10-08 | 396/396 testes unitários verdes, build downstream OK |
| [**#21**](#-issue-21-suporte-canônico-a-richcontentdocument-direto-no-expansiondetailinlineschema) | Suporte Canônico a `RichContentDocument` Direto no `expansionDetailInlineSchema` | `@praxisui/table`<br>`@praxisui/rich-content`<br>`@praxisui/core` | 🟡 Média | `[x] Resolvida` | `@praxisui/core`, `@praxisui/table` (`normalizeExpansionDetailSchemaCandidate`, `getExpansionDetailRichContentContext`, contextMap) | 2026-10-08 | 43/43 spec unitários e de integração verdes, build downstream OK |
| [**#22**](#-issue-22-suporte-a-zonas-coloridas-dinâmicas-color-bands-em-gráficos-gauge) | Suporte a Zonas Coloridas Dinâmicas (Color Bands) em Gráficos Gauge | `@praxisui/charts`<br>`EchartsOptionBuilderService` | 🟢 Baixa | `[x] Resolvida` | `@praxisui/charts` (`PraxisChartGaugeColorBand`, `buildGaugeColorBands`, mapper bidirecional) | 2026-10-08 | 401/401 testes unitários verdes, build downstream OK |
| [**#23**](#-issue-23-governança-declarativa-de-micro-visualizations-via-anotações-uischema-no-backend-java) | Governança Declarativa de Micro Visualizations via Anotações `@UISchema` no Backend Java | `praxis-metadata-starter`<br>`@UISchema`<br>`@praxisui/table` | 🟡 Média | `[ ] Aberta` | — | — | Pendente |
| [**#24**](#-issue-24-widget-autônomo-de-microcharts-no-page-builder-praxismicrovisualizationwidget) | Widget Autônomo de Microcharts no Page Builder (`PraxisMicroVisualizationWidget`) | `@praxisui/charts`<br>`@praxisui/page-builder`<br>`@praxisui/core` | 🟡 Média | `[ ] Aberta` | — | — | Pendente |
| [**#25**](#-issue-25-sobrescrita-com-null-em-avaliação-de-expressões-de-micro-visualizations-causa-falha-silenciosa-de-renderização) | Sobrescrita com `null` em Avaliação de Expressões de Micro Visualizations Causa Falha Silenciosa de Renderização | `@praxisui/table`<br>`PraxisTable`<br>`rfc-micro-visualization-presentation` | 🟡 Média | `[x] Resolvida` | `@praxisui/table` (`applyMicroVisualizationExpression`, fallback seguro) | 2026-10-08 | Validado (guarda contra null, preservação de fallbackText, 11/11 specs) |
| [**#26**](#-issue-26-inclusão-indevida-de-métricas-agregadas-no-payload-padrão-de-crossfilter-sem-mapeamento-explícito) | Inclusão Indevida de Métricas Agregadas no Payload Padrão de `crossFilter` Sem Mapeamento Explícito | `@praxisui/charts`<br>`praxis-chart.component.ts` | 🟡 Média | `[x] Resolvida` | `@praxisui/charts` (`buildEventFilters`) | 2026-10-08 | Validado (omissão de métricas agregadas sem mapping, 403/403 specs) |
| [**#27**](#-issue-27-falha-silenciosa-de-renderização-de-microcharts-quando-valueexpr-contém-expressões-condicionais-ternários-não-suportadas-pelo-safeexpressionevaluator) | Falha Silenciosa de Microcharts quando `valueExpr` Contém Expressões Condicionais (Ternários) | `@praxisui/table`<br>`SafeExpressionEvaluator` | 🟡 Média | `[x] Resolvida` | `@praxisui/table` (`SafeExpressionEvaluator`, `warnOnceLog`) | 2026-10-08 | Validado (função `if`, ternários `? :`, 8/8 specs de avaliador) |
| [**#28**](#-issue-28-padronização-e-exposição-canônica-da-tipagem-do-evento-rowclick-rowclickeventt-no-barrel-público-de-praxiscuitable-e-praxisuicrud) | Padronização e Exposição Canônica da Tipagem do Evento `(rowClick)` (`RowClickEvent<T>`) | `@praxisui/table`<br>`@praxisui/crud` | 🟢 Baixa | `[x] Resolvida` | `@praxisui/table`, `@praxisui/crud` (`RowClickEvent<T>`) | 2026-10-08 | Validado (`public-api`, 61/61 table events specs, 223/223 crud specs) |
| [**#29**](#-issue-29-ausência-de-formatação-automática-currencydate-nos-nós-type-value-do-behaviordetail-e-baixa-visibilidade-monocromática-de-microcharts-bullet-em-surface-table-cell) | Ausência de Formatação Automática (Currency/Date) nos Nós `type: 'value'` de `behavior.detail` e Monocromia de Microcharts Bullet em `table-cell` | `@praxisui/table`<br>`@praxisui/core`<br>`presentation-visualization` | 🟡 Média | `[x] Resolvida` | `@praxisui/table` (`getExpansionDetailValue`, `DataFormattingService`), `@praxisui/core` (`renderBulletVisualizationHtml`, `compactValue`) | 2026-10-08 | Validado (formatação automática BRL/USD/Data/Escala em nós de expansão, valor compacto em bullet, 35/35 specs table, 11/11 specs viz) |
| [**#30**](#-issue-30-suporte-canônico-a-gavetas-analíticas-e-dossiês-multi-aba-via-metadadosjson-praxisanalyticaldrawerschema) | Suporte Canônico a Gavetas Analíticas e Dossiês Multi-Aba via Metadados/JSON (`behavior.drawer.analyticalSchema`) | `@praxisui/table`<br>`@praxisui/crud`<br>`@praxisui/core` | 🟡 Média | `[x] Resolvida` | `@praxisui/core` (`PraxisAnalyticalDrawerSchema`), `@praxisui/table` (`PraxisAnalyticalDrawerComponent`), `@praxisui/crud` | 2026-10-08 | Validado (dossiês multi-aba declarativos, 6/6 specs drawer, 63/63 specs table events, build downstream OK) |
| [**#31**](#-issue-31-dimensionamento-inflexível-de-rótulos-de-etapa-no-microchart-processflow-causando-quebras-e-truncamentos) | Dimensionamento Inflexível de Rótulos de Etapa no Microchart `processFlow` Causando Quebras e Truncamentos | `@praxisui/charts`<br>`praxis-micro-visualization.component.ts` | 🟢 Baixa | `[x] Resolvida` | `@praxisui/charts` (`PraxisMicroVisualizationComponent`), `@praxisui/core` (`stepLabelWidth`, `stepLabelLineClamp`) | 2026-10-08 | Validado (variáveis CSS dinâmicas, clamp responsivo, 405/405 specs charts verdes) |
| [**#32**](#-issue-32-orquestração-declarativa-de-sub-recursos-e-relações-vinculadas-em-dossiês-analíticos-relations--subresourcebindings-em-behaviordrawer) | Orquestração Declarativa de Sub-Recursos e Relações Vinculadas em Dossiês Analíticos (`relations` em `behavior.drawer`) | `@praxisui/crud`<br>`@praxisui/table`<br>`@praxisui/core`<br>`praxis-metadata-starter` | 🔴 Alta | `[x] Resolvida` | `@praxisui/core` (`PraxisAnalyticalDrawerRelation`), `@praxisui/table` (`interpolateRelationEndpoint`, deduplicação por assinatura), `@praxisui/crud` | 2026-10-08 | Validado (orquestração declarativa de sub-recursos, cache de URL, build downstream OK) |
| [**#33**](#-issue-33-banda-canônica-declarativa-de-resumo-executivo-e-kpis-no-praxis-crud-behaviorkpiband--praxiskpiband) | Banda Canônica Declarativa de Resumo Executivo e KPIs no `<praxis-crud>` (`behavior.kpiBand`) | `@praxisui/crud`<br>`@praxisui/rich-content`<br>`praxis-metadata-starter` | 🔴 Alta | `[x] Resolvida` | `@praxisui/core`, `@praxisui/crud` (`PraxisKpiBandComponent`, `kpiBand`) | 2026-10-08 | Validado (grid Bento, auto-fetch, 5/5 specs KPI, 81/81 specs crud, build downstream OK) |
| [**#34**](#-issue-34-suporte-canônico-a-propriedades-calculadas-e-expressões-de-domínio-no-schema-computedfields--virtualproperties) | Suporte Canônico a Propriedades Calculadas e Expressões de Domínio no Schema (`computedFields`) | `@praxisui/core`<br>`@praxisui/table`<br>`@praxisui/dynamic-form`<br>`praxis-metadata-starter` | 🟡 Média | `[x] Resolvida` | `@praxisui/core`, `@praxisui/table` (`applyComputedFieldsToRows`, `computedFields`) | 2026-10-08 | Validado (campos virtuais, compactBRL, 7/7 specs evaluator, build downstream OK) |
| [**#35**](#-issue-35-eliminação-de-dtos-typescript-estáticos-redundantes-via-contratos-genéricos-dinâmicos-dynamicdatarecord--governança-por-schema) | Eliminação de DTOs TypeScript Estáticos Redundantes via Contratos Genéricos Dinâmicos (`DynamicDataRecord`) | `@praxisui/core`<br>`@praxisui/table`<br>`@praxisui/crud` | 🟡 Média | `[ ] Aberta` | — | — | Previne acoplamento estático e quebra de tipos com o backend |
| [**#36**](#-issue-36-modo-de-apresentação-e-ficha-técnica-editorial-para-formulários-dinâmicos-mode-presentation-no-praxisuidynamic-form) | Modo de Apresentação e Ficha Técnica Editorial para Formulários Dinâmicos (`mode: 'presentation'`) | `@praxisui/dynamic-form`<br>`@praxisui/core` | 🟡 Média | `[ ] Aberta` | — | — | Elimina centenas de linhas de HTML customizado para fichas de leitura |
| [**#37**](#-issue-37-componente-canônico-de-layout-e-shell-de-aplicação-corporativa-praxisappshell--praxisishell-ou-praxisicore) | Componente Canônico de Layout e Shell de Aplicação Corporativa (`PraxisAppShell`) | `@praxisui/core`<br>`@praxisui/shell` | 🟡 Média | `[ ] Aberta` | — | — | Elimina `hero-app-shell.component.ts` (1.192 linhas de CSS/sidebar manual) |
| [**#38**](#-issue-38-descoberta-integral-de-recurso-e-roteamento-zero-code-no-praxis-crud-praxisresourcepage--auto-resource-host) | Descoberta Integral de Recurso e Roteamento Zero-Code no `<praxis-crud>` (`PraxisResourcePage`) | `@praxisui/crud`<br>`@praxisui/table`<br>`praxis-metadata-starter` | 🔴 Alta | `[ ] Aberta` | — | — | Reduz as 14 páginas de CRUD de ~800 linhas cada para ~25 linhas declarativas |



---

## 📌 Issue #1: Duplo Carregamento Redundante no `@praxisui/table` via `@praxisui/crud`

### Classificação
- **Módulos Afetados:** `@praxisui/crud`, `@praxisui/table`
- **Severidade:** 🔴 Alta (impacto direto na percepção de fluidez, flicker de skeletons e sobrecarga no backend com rajadas duplicadas de consulta)
- **Tipo:** Ciclo de Vida Reativo / Race Condition de Metadados
- **Status:** `[x] Resolvida` (PR #562 / commit `327fd7786`)

### Diagnóstico Detalhado da Causa Raiz
Ao inicializar qualquer tela baseada no `<praxis-crud>`, a tabela dispara **duas requisições consecutivas idênticas** para `POST /{resource}/filter`:

1. **Primeiro Fetch:** Ocorre em `projects/praxis-table/src/lib/praxis-table.ts:1874` (`ngAfterContentInit()`), onde `PraxisTable.fetchData()` dispara a primeira consulta à API.
2. **Resposta dos Dados:** O backend responde em ~150-250ms trazendo a lista de registros e o envelope `_links` (contendo links HATEOAS canônicos como `create`, `update`, `capabilities`).
3. **Emissão de Links:** `PraxisTable` emite o evento `@Output() collectionLinksChange` (linha 17621 de `praxis-table.ts`).
4. **Resolução de Capabilities:** No arquivo `projects/praxis-crud/src/lib/praxis-crud.component.ts` (linhas 775-795), o método `onCollectionLinksChange(links)` detecta os links e chama `this.getResourceDiscovery().getCapabilities(links)`.
5. **Reatribuição de Referência:** Quando a resposta assíncrona de capabilities retorna, `PraxisCrudComponent` executa:
   ```typescript
   // projects/praxis-crud/src/lib/praxis-crud.component.ts:1124-1140
   private applyResolvedCrudState(meta: CrudMetadata): void {
     this.effectiveTableConfig = this.buildEffectiveTableConfig(meta, this.collectionCapabilities);
     const nextTableConfig = this.effectiveTableConfig || ((meta.table as TableConfig) ?? createDefaultTableConfig());
     this.assignTableConfigForBinding(nextTableConfig);
     // ...
   }
   ```
   Como `this.collectionCapabilities` passou de `null` para um snapshot preenchido (ex.: `{ canCreate: true, canUpdate: true }`), o método `buildEffectiveTableConfig` gera um **novo objeto `TableConfig`** contendo os botões de ação de toolbar autorizados.
6. **Disparo Cego do Segundo Fetch:** O Angular detecta a mudança na referência do `@Input() config` do `<praxis-table>` e executa o `ngOnChanges` em `projects/praxis-table/src/lib/praxis-table.ts`:
   ```typescript
   // projects/praxis-table/src/lib/praxis-table.ts:5913-5915
   if (changes['config'] && this.config) {
     this.setupColumns();
     this.applyDefaultSortIfNone();
     if (this.isRemoteMode() && !configuredThisChange) {
       this.fetchData(); // <--- DISPARA SEGUNDA REQUISIÇÃO REDUNDANTE!
     }
   }
   ```
7. Como `configuredThisChange` é `false` (pois `resourcePath` não mudou, apenas `config`), a tabela cancela a subscrição anterior, emite novo estado de `loading`, reexibe skeletons na tela e efetua uma segunda requisição idêntica `POST /{resource}/filter`.

### Cenários Correlatos & Investigação Abrangente de Plataforma
O agente executor não deve limitar-se ao fluxo básico de listagem do CRUD. A investigação deve cobrir:
1. **Analytics Projections:** Na linha 5919 de `praxis-table.ts`, existe a ramificação `else if (this.hasAnalyticsProjectionInput()) { this.fetchAnalyticsProjectionData(); }`. O mesmo disparo duplicado ocorre em tabelas com projeção analítica quando o config analítico é enriquecido após a carga inicial.
2. **Paginação por Cursor (`fetchCursorData()`):** Se a tabela estiver em modo de cursor, o segundo fetch reseta o ponteiro do cursor (`nextCursor = null`), fazendo com que o usuário seja jogado de volta à página 1 se já tiver rolado para a página 2.
3. **Rolagem Virtual (`cdk-virtual-scroll`):** Duplo disparo reseta a viewport virtual, gerando piscadas e jitter de scroll durante a navegação fluida.
4. **Sobrescrita de Ordenação do Usuário (Race Condition):** Se o usuário clicar em um cabeçalho para ordenar a tabela durante os ~200ms em que as capabilities estão sendo resolvidas na rede, a segunda requisição disparada pelo `ngOnChanges` re-aplica `applyDefaultSortIfNone()` e desfaz a ordenação recém-solicitada pelo operador.
5. **Authoring Document Changes em Runtime:** No `PraxisCrudComponent.applyCrudAuthoringPayload()`, a referência de `tableConfigForBinding` também é reatribuída. Se o authoring for ativado em tempo de execução, a tabela não deve recarregar os dados desnecessariamente se apenas metadados cosméticos (como rótulo de coluna ou cor de botão) foram alterados.
6. **Alternância de Visualização (Table vs Card Grid vs Bento View):** Ao alternar modos de visualização no CRUD, se a consulta base não foi alterada, os dados já presentes em memória devem ser reutilizados sem emitir nova consulta remota.

### Solução Canônica Recomendada de Plataforma
1. **Em `@praxisui/table` (`praxis-table.ts`):**
   - Não disparar `fetchData()` incondicionalmente no bloco `if (changes['config'])`.
   - Adicionar uma verificação semântica de mutação real de dados: comparar se houve alteração em parâmetros fundamentais de consulta (`resourcePath`, `dataSourceUrl`, `queryParameters`, `baseFilterCriteria`, `behavior.sorting.defaultSort` ou estratégia de paginação).
   - Se a alteração no `config` for restrita a metadados visuais e de interação (ex.: `toolbar.actions`, tooltips, densidade, visibilidade de colunas, permissões de botões), atualizar apenas a renderização da toolbar e os bindings de linha, **sem invocar `this.fetchData()`**.
2. **Em `@praxisui/crud` (`praxis-crud.component.ts`):**
   - Sinalizar na configuração atribuída à tabela que a atualização decorre exclusivamente da resolução de capacidades táticas (`capabilitiesOnlyUpdate = true`), ou atualizar de forma imutável apenas os nós de ação da toolbar sem gerar uma referência de objeto de configuração totalmente desvinculada.

### Mitigação Temporária Aplicada no Hero HQ
- Foi criado o interceptor [`praxisQueryDeduplicationInterceptor`](file:///D:/Developer/praxis-plataform/praxis-hero-hq-ui/src/app/core/http-deduplication.interceptor.ts) registrado no [`app.config.ts`](file:///D:/Developer/praxis-plataform/praxis-hero-hq-ui/src/app/app.config.ts). Ele compartilha chamadas em voo via `shareReplay(1)` e absorve rajadas idênticas (< 1200ms) em memória, resolvendo a segunda requisição em 0ms. Limpa automaticamente o cache em qualquer mutação (`POST` não-filter, `PUT`, `PATCH`, `DELETE`).

### Critérios de Aceite para Resolução
- [x] Entrar em uma tela baseada em `<praxis-crud>` e verificar no console de rede que exatamente **1 requisição** `POST /filter` é emitida.
- [x] O skeleton de carregamento deve ser exibido uma única vez, sem piscar novamente após 300ms.
- [x] Modificar ordenação de coluna logo após o carregamento sem perda de estado quando as capabilities terminarem de carregar.
- [x] Testes unitários em `@praxisui/table` cobrindo cenários onde `changes['config']` com metadados de ações não aciona `fetchData()`.

---

## 📌 Issue #2: Destruição de Estado e Recarregamento de Schemas em Shells com Abas

### Classificação
- **Módulos Afetados:** `@praxisui/dynamic-form`, `DynamicFormService`, Design System da Plataforma
- **Severidade:** 🟡 Média (flicker visual, recriação desnecessária de DOM e perda de estado de formulário)
- **Tipo:** Ciclo de Vida de Componente / Estratégia de Apresentação
- **Status:** `[x] Resolvida` (PR #564 / commit `ae62e5c33`)

### Diagnóstico Detalhado da Causa Raiz
Em componentes de detalhe, dossiês e painéis com abas (como `HeroDossierDrawerComponent` ou formulários com `<mat-tab-group>`):
1. O uso tradicional de `@if (activeTab === 'identidade')` provoca a **destruição completa da árvore do DOM** do `<praxis-dynamic-form>` sempre que o usuário navega para outra aba (ex.: "Competências" ou "Folha").
2. Ao retornar para a aba inicial, o formulário é reconstruído do zero:
   - Aciona novo `ngOnInit()` e `setupForm()`.
   - Dispara nova requisição HTTP para `/schemas/filtered?path=...`.
   - Executa nova busca do registro por ID (`GET /{resource}/{id}`) e consultas de option-sources (`/options/filter`).
   - Dispara o `LoadingOrchestrator`, acionando a barra de loading global e deixando o painel momentaneamente branco ("flash de montagem").

### Cenários Correlatos & Investigação Abrangente de Plataforma
1. **Perda de Edição em Formulários de Criação/Edição (`mode="edit"`, `mode="create"`):** Se o usuário estiver preenchendo um formulário multi-aba e alternar entre abas, a destruição pelo `@if` apaga todos os valores digitados no formulário reativo e reseta erros de validação não persistidos.
2. **Uploads em Andamento:** Se houver um upload de anexo (`@praxisui/files-upload`) ou cálculo assíncrono em progresso em um dos campos dinâmicos, a troca de aba cancela o upload HTTP silenciosamente.
3. **Ausência de Cache em Memória no `DynamicFormService`:** Mesmo quando o formulário é recriado, o serviço de schema (`DynamicFormService` / `SchemaCacheAdapter`) deveria reutilizar schemas OpenAPI já compilados para aquele par `(resourcePath, formId)` durante a sessão ativa, sem necessidade de nova requisição HTTP.
4. **Option Sources Assíncronos Repetidos:** Dropdowns que buscam opções remotas em `/options/filter` (ex.: lista de departamentos, cargos, bases) disparam requisições HTTP repetidas a cada troca de aba se não houver camada de cache de opções ativa.

### Solução Canônica Recomendada de Plataforma
1. **No `@praxisui/dynamic-form`:**
   - Assegurar que o `SchemaCacheAdapter` mantenha cache de primeiro nível (L1) para esquemas compilados, indexado por `(path, operation, schemaType)` com política de TTL ou invalidação por evento.
   - Fornecer cache para opções remotas no `SelectOptionRegistry`.
2. **Recomendação e Prática de Engenharia para Shells de Aba:**
   - Incorporar na biblioteca de documentação e exemplos oficiais a recomendação de **preservação estrutural no DOM** (`[hidden]="activeTab !== '...'"` com CSS `.pane[hidden] { display: none !important; }`), ou disponibilizar uma diretiva estrutural canônica (ex.: `*praxisKeepAliveTab`).

- No [`hero-dossier-drawer.component.ts`](file:///D:/Developer/praxis-plataform/praxis-hero-hq-ui/src/app/pages/rh/hero-dossier-drawer.component.ts#L515-L593) e no [`mission-briefing-drawer.component.ts`](file:///D:/Developer/praxis-plataform/praxis-hero-hq-ui/src/app/pages/operacoes/mission-briefing-drawer.component.ts#L375-L405), os painéis de abas foram migrados para `[hidden]="activeTab() !== '...'"` com regras de CSS `.tab-pane[hidden] { display: none !important; }`, garantindo transição instantânea de 0ms sem recriação de DOM nem chamadas de rede repetidas.
- **Validação E2E Playwright:** Comprovado no script `test-drawer-tabs-persistence.js` que a alternância entre todas as 5 abas do dossiê e 3 abas do briefing de missão disparou exatamente **0 requisições** para `/schemas/filtered` ou `/locate`, preservando intactos o estado do formulário e os valores preenchidos.

### Critérios de Aceite para Resolução
- [x] A navegação entre abas em um dossiê não gera novas chamadas a `/schemas/filtered` nem a `/locate`.
- [x] Nenhuma tela branca perceptível durante a alternância entre abas.
- [x] Manutenção integral do estado do formulário durante a navegação interna.
- [x] Teste unitário no `DynamicFormService` garantindo cache L1 de schema compilado.

---

## 📌 Issue #3: Barramento Canônico de Eventos entre Widgets (`PraxisWidgetEventBus`)

### Classificação
- **Módulos Afetados:** `@praxisui/page-builder`, `@praxisui/rich-content`, `@praxisui/charts`, `@praxisui/crud`
- **Severidade:** 🟡 Média (Oportunidade fundamental de maturidade na composição de dashboards e páginas dinâmicas)
- **Tipo:** Arquitetura / Integração Declarativa de Widgets
- **Status:** `[ ] Aberta`

### Diagnóstico Detalhado da Causa Raiz
No ecossistema Praxis, páginas corporativas combinam múltiplos widgets:
- Cards de KPI no topo (`PraxisRichContent` com nós do tipo `statGroup` ou `card`).
- Gráficos táticos e analíticos (`PraxisCharts`).
- Tabelas de dados e CRUDs (`PraxisCrudComponent`).

Atualmente, para que um clique em um card de KPI (ex.: *"Em Prontidão Ativa"*) ou em uma fatia de gráfico de pizza filtre os registros exibidos na tabela abaixo, o desenvolvedor é obrigado a criar **código de cola manual (glue code)** no componente hospedeiro (gerenciando sinais, interceptando eventos de clique no DOM e recomputando objetos `CrudMetadata`).

### Cenários Correlatos & Investigação Abrangente de Plataforma
O agente executor deve considerar que essa comunicação precisa ser bidirecional e multiponto:
1. **KPI ➔ Tabela:** Clicar no card "Missões Críticas" aplica `{ prioridade: 'CRITICA' }` no `filterCriteria` da tabela.
2. **Gráfico ➔ Tabela:** Clicar em um setor de gráfico de pizza em `PraxisCharts` (ex.: Categoria "Armaduras") emite um evento de filtro para a tabela de ativos.
3. **Tabela ➔ Painel Lateral / Dossiê (Master-Detail):** Clicar em uma linha da tabela publica o ID selecionado para que um widget de detalhe lateral exiba o dossiê correspondente sem recarregar a rota inteira.
4. **Filtro Global ➔ Todos os Widgets:** Uma barra de escopo global (ex.: Seletor de Base Operacional ou Intervalo de Datas) atualiza simultaneamente KPIs, Gráficos e Tabelas.
5. **Sincronização Visual de Estado Ativo:** Se a tabela for filtrada pelo chip da toolbar (ex.: "Ativos"), o card de KPI do topo deve refletir o estado selecionado (borda com realce, glow).
6. **Isolamento de Escopo (Page vs Modal vs Embedded):** Se uma página abre um modal que também contém widgets, os eventos do modal não devem vazar para os widgets da página de fundo (`EventScope` hierárquico).

### Solução Canônica Recomendada de Plataforma
1. **Criação do `PraxisWidgetEventBus` no `@praxisui/page-builder` e `@praxisui/core`:**
   - Disponibilizar um serviço injetável com escopo por view/página (`providedIn: 'page'` ou instanciado pelo `PraxisPageBuilder`).
   - Suporte a eventos tipados:
     ```typescript
     export interface PraxisWidgetEvent<T = unknown> {
       sourceWidgetId: string;
       eventType: 'filter.apply' | 'filter.clear' | 'selection.change' | 'action.dispatch' | 'scope.change';
       targetWidgetId?: string; // Opcional: broadcast se não especificado
       payload: T;
     }
     ```
2. **Configuração Declarativa no Schema JSON do Page Builder:**
   Permitir configurar as ligações de eventos diretamente no documento JSON da página:
   ```json
   {
     "wiring": [
       {
         "from": { "widgetId": "hero-kpis", "event": "nodeAction", "actionId": "filter.status" },
         "to": { "widgetId": "heroes-table", "target": "filterCriteria" },
         "transform": { "status": "ativo" }
       }
     ]
   }
   ```
3. **No `PraxisCrudComponent`:**
   - Adicionar suporte a `@Input() filterCriteria` reativo direto (além de `metadata.filterCriteria`), reagindo automaticamente às emissões do event bus.

### Avanço e Refatoração Canônica no Hero HQ (Etapa 4)
- **Host Component Refatorado:** O [`dashboard-page.component.ts`](file:///D:/Developer/praxis-plataform/praxis-hero-hq-ui/src/app/pages/dashboard/dashboard-page.component.ts) foi desprovido de 150+ linhas de glue code (`hostCapabilities` e `injectHostCapabilities`), conectando-se diretamente às capacidades nativas do `DynamicWidgetPageComponent` e `GlobalActionService` (`navigation.openRoute`).
- **Eliminação de Mutações Imperativas de AST:** A atualização de dados táticos foi migrada para o projetor declarativo `projectTacticalKpis` com `signal<WidgetPageDefinition>`, operando sob `ChangeDetectionStrategy.OnPush`.
- **Validação E2E Playwright:** Navegação confirmada nos botões do banner e nos cards do Domain Hub (`/rh/funcionarios` e `/operacoes/missoes`) e alternância de customização do Page Builder validada com 100% de sucesso.

### Critérios de Aceite para Resolução Definitiva na Plataforma
- [ ] Possibilidade de vincular um card do `PraxisRichContent` a um filtro de tabela via configuração declarativa no Page Builder, sem necessidade de métodos TypeScript manuais no host.
- [ ] Suporte a interoperabilidade com eventos emitidos por cliques em fatias e barras de `PraxisCharts`.
- [ ] Teste unitário validando isolamento de eventos entre instâncias hierárquicas de `PraxisWidgetEventBus`.

---

## 📌 Issue #4: Governança Declarativa de Filtros Rápidos e Filtros Avançados na Tabela

### Classificação
- **Módulos Afetados:** `@praxisui/table`, `@praxisui/crud`, `praxis-metadata-starter`
- **Severidade:** 🟢 Baixa (Evolução de Contrato e Configuração Declarativa)
- **Tipo:** Contrato OpenAPI `x-ui` / Configuração Declarativa
- **Status:** `[x] Resolvida` (Backend: `praxis-metadata-starter` `@QuickFilter`, `ApiResourceQuickFilterResolver`; Frontend: `@praxisui/core`, `@praxisui/table`)

### Diagnóstico Detalhado
O componente `PraxisTable` já possui uma infraestrutura rica para filtragem:
- `toolbar.filters.enabled`: ativa a seção de filtros na barra.
- `toolbar.filters.quickFilters`: exibe chips rápidos de escopo (ex.: Todos, Ativos, Inativos).
- `toolbar.filters.showAdvancedButton`: botão para abrir o painel de query builder avançado.
- `behavior.filtering.columnFilters.enabled`: filtros contextuais por coluna.
- `behavior.filtering.advancedFilters.settings.alwaysVisibleFields`: campos fixos na barra como inputs inline inteligentes.

Entretanto, essa estrutura não era automaticamente preenchida ou sugerida pelos geradores de metadados do backend Java (`praxis-metadata-starter`), exigindo que cada aplicação consumidora montasse o JSON do `CrudMetadata` manualmente.

### Cenários Correlatos & Investigação Abrangente de Plataforma
1. **Comportamento em Telas Estreitas (Responsividade):** Quando múltiplos campos são colocados em `alwaysVisibleFields`, a barra de ferramentas pode estourar a largura em viewports menores que 1200px. O `PraxisTable` precisa implementar um mecanismo de overflow (colapsar campos excedentes automaticamente para um menu "Mais Filtros").
2. **Conflito entre QuickFilter e AdvancedFilter:** Se o usuário seleciona um chip rápido (ex.: "Ativos") e em seguida abre o filtro avançado e escolhe "Inativos", qual filtro tem precedência? É necessário padronizar a política de merge ou sobrescrita canônica no `PraxisTable`.
3. **Persistência de Filtros na URL:** Os filtros rápidos e avançados devem poder sincronizar com os query parameters da URL de forma opcional (`syncUrl: true`), permitindo que links filtrados sejam favoritados ou compartilhados entre operadores.

### Solução Canônica Implementada na Plataforma
- Criada anotação canônica `@QuickFilter` e estendida `@ApiResource(quickFilters = {...})` no `praxis-metadata-starter`.
- Criado `ApiResourceQuickFilterResolver` e publicado automaticamente sob `x-ui.resource.quickFilters` em `/schemas/filtered`.
- No `@praxisui/core`, `GenericCrudService` captura `resource.quickFilters` e disponibiliza para o runtime.
- No `@praxisui/table`, adicionado suporte flexível a expressões string (`"chave=valor"` e `&`) e JSON, além de auto-discovery de quick filters canônicos no `loadSchema()`.

### Critérios de Aceite para Resolução
- [x] Recursos com `@QuickFilter` geram automaticamente os chips na toolbar da tabela sem configuração manual no frontend.
- [x] Suporte robusto a expressões de filtro em string (`"chave=valor"` e `&`) e JSON em `@QuickFilter` e na toolbar.
- [x] Resolução automática e tolerante a falhas integrada ao `/schemas/filtered` sob `x-ui.resource.quickFilters`.

---

## 📌 Issue #5: Suporte Declarativo a Ícones e Cores Condicionais em Apresentações Booleanas e Enums

### Classificação
- **Módulos Afetados:** `@praxisui/dynamic-form`, `@praxisui/dynamic-fields`, `praxis-metadata-starter`
- **Severidade:** 🟡 Média (Inconsistência semântica e visual crítica em dossiês e visualizações de perfil)
- **Tipo:** Metadados OpenAPI / UX
- **Status:** `[x] Resolvida` (Frontend: PR #563 / commit `60aed6867`; Backend: PR #241 / commit `484e488c47`)

### Diagnóstico Detalhado da Causa Raiz
No `<praxis-dynamic-form>` em modo de apresentação (`mode="view"`, `presentationModeGlobal="true"` ou `presentationPreset="corporate-dossier"`):
- O componente `PraxisPresentation` renderiza o ícone configurado estaticamente no `@UISchema` ou o padrão do componente (ex.: `toggle_on` com tom esmeralda/sucesso).
- Quando o registro possui valor `ativo: false`:
  - O texto renderizado é `"Não"`.
  - O ícone permanecia `toggle_on` em verde brilhante!
- Isso induzia o usuário a um erro grave de interpretação: o operador vê o ícone de ligado/ativo e presume que o colaborador está em prontidão ativa, quando na realidade ele está inativo.

### Cenários Correlatos & Investigação Abrangente de Plataforma
1. **Outros Campos Booleanos do Domínio:** O mesmo erro ocorre em qualquer campo booleano: `bloqueado`, `verificado`, `aprovado`, `emMissao`, `requerAtencao`.
2. **Campos de Status Enum:** Situação similar ocorre quando campos enum (ex.: `status: 'EM_ANDAMENTO'`, `'CONCLUIDA'`, `'FALHOU'`) são renderizados. Sem um mapeamento dinâmico de ícone e tom baseado no valor, o ícone permanece neutro ou fixo.
3. **Células da Tabela (`@praxisui/table`):** O mesmo padrão se aplica a colunas booleanas da tabela quando configuradas como badges ou ícones.
4. **Acessibilidade (a11y):** O texto do ícone e sua descrição visual devem fornecer o contraste e o atributo `aria-label` condizentes com o estado real do dado.

### Solução Canônica Recomendada de Plataforma
1. **No Backend (`praxis-metadata-starter` / `@UISchema`):**
   Suportar atributos declarativos para mapeamento booleano e enum:
   ```java
   @UISchema(
       label = "Status Operacional",
       iconTrue = "toggle_on",
       iconFalse = "toggle_off",
       toneTrue = "success",
       toneFalse = "muted"
   )
   private Boolean ativo;
   ```
2. **No Frontend (`@praxisui/dynamic-fields` / `PraxisPresentationComponent` / `FieldShellComponent`):**
   - No renderer booleano, se `value === false`, selecionar automaticamente `iconFalse` (ou `toggle_off`) e tom `muted` / `neutral`, alterando classes e ligatures de forma reativa sem exigir CSS ad-hoc no consumidor.

### Mitigação Temporária Aplicada no Hero HQ (Removida)
- O override por CSS ad-hoc inserido no [`hero-dossier-drawer.component.ts`](file:///D:/Developer/praxis-plataform/praxis-hero-hq-ui/src/app/pages/rh/hero-dossier-drawer.component.ts) foi totalmente removido após a publicação da solução canônica na plataforma.

### Critérios de Aceite para Resolução
- [x] Qualquer campo booleano renderizado com valor `false` no dynamic form de apresentação exibe ícone `toggle_off` com tom neutro por padrão.
- [x] O backend Java aceita parametrização de ícones e cores para ambos os estados booleanos no `@UISchema`.

---

## 📌 Issue #6: Descoberta e Ativação Automática de Filtros Inline Inteligentes no `@praxisui/crud`

### Classificação
- **Módulos Afetados:** `@praxisui/crud`, `@praxisui/table`, `praxis-metadata-starter`
- **Severidade:** 🟡 Média (Evolução de Produtividade e Experiência Out-of-the-Box)
- **Tipo:** Auto-configuração Metadata-Driven
- **Status:** `[x] Resolvida` (`@praxisui/crud` `CrudFilterBarConfig`, `buildEffectiveTableConfig`, auto-discovery)

### Diagnóstico Detalhado
O componente `PraxisFilter` embutido no `@praxisui/table` é extremamente poderoso:
- Suporta campos inline fixos (`alwaysVisibleFields`).
- Suporta selects com busca assíncrona (`useInlineSearchableSelectVariant`).
- Suporta seletores de intervalo de data (`useInlineDateVariant`).
- Conecta-se diretamente ao schema do endpoint de filtro via `/schemas/filtered?path=/api/{resource}/filter&operation=post&schemaType=request`.

Contudo, para que esse componente aparecesse, o desenvolvedor precisava montar uma estrutura aninhada complexa de propriedades (`behavior.filtering.advancedFilters.settings.*`) em cada página. Como o backend já conhece todos os campos anotados com `@Filterable`, o runtime da plataforma deveria habilitar e sugerir esses filtros automaticamente.

### Cenários Correlatos & Investigação Abrangente de Plataforma
1. **Hierarquia de Operação no `/schemas/filtered`:** O endpoint de schema filtra por `operation` (default: `"get"`). Para filtros, a operação é `"post"` e o schemaType é `"request"`. Se o cliente chamar sem especificar esses parâmetros, o endpoint retorna erro 404/400. A plataforma deve documentar e padronizar helpers de consulta para schemas de requisição de busca.
2. **Dependência de Campos (Cascade nos Filtros Inline):** Se o usuário filtra por "Departamento", o campo inline de "Cargo" deve atualizar sua lista de opções automaticamente. O `PraxisFilter` já possui suporte a `dependencyFilterMap`, mas essa orquestração precisa ser testada e homologada na linha inline fixa.

### Solução Canônica Implementada na Plataforma
1. No `PraxisCrudComponent`:
   - Adicionada a interface canônica `CrudFilterBarConfig` no `CrudMetadata.filterBar`:
     ```typescript
     filterBar: {
       inlineFields: ['nomeCompleto', 'departamentoNome', 'ativo'],
       quickFilters: [ ... ], // ou true para auto-discovery
       showAdvanced: true
     }
     ```
   - O método `buildEffectiveTableConfig` expande automaticamente `filterBar` para `toolbar.filters` e `behavior.filtering.advancedFilters.settings.alwaysVisibleFields`.
   - Adicionado auto-discovery inteligente da capability `filter`: quando nenhuma configuração de filtro foi fornecida e o recurso expõe a capability `filter`, o botão de filtros é ativado automaticamente.

### Critérios de Aceite para Resolução
- [x] Suporte simplificado a `filterBar` no `CrudMetadata` (`inlineFields`, `quickFilters`, `showAdvanced`), eliminando a necessidade de boilerplate aninhado em `behavior.filtering.advancedFilters`.
- [x] Descoberta e ativação automática do botão de filtros na toolbar quando a capability `filter` é exposta pelo recurso.
- [x] Suíte de testes unitários 100% verde no `@praxisui/crud` e validação downstream no Hero HQ.

---

## 📌 Issue #7: Normalização Robusta de Parâmetros de Path em `/schemas/filtered`

### Classificação
- **Módulos Afetados:** `praxis-metadata-starter`, `ApiDocsController`
- **Severidade:** 🟢 Baixa (Robustez de API / Tolerância a Formatos)
- **Tipo:** Contrato de Endpoint / Tratamento de Requisições
- **Status:** `[x] Resolvida` (PR #240 / commit `d59641bf9e`)

### Diagnóstico Detalhado
No `ApiDocsController.java` de `praxis-metadata-starter`:
- O endpoint `/schemas/filtered` recebe `@RequestParam String path`.
- Espera-se a rota OpenAPI completa (ex.: `/api/human-resources/funcionarios/filter`).
- Se o frontend enviar `resourcePath` sem barra inicial ou sem o prefixo `/api` (ex.: `human-resources/funcionarios/filter`), o controller não encontra a rota no documento OpenAPI e devolve erro `404 - The specified path or operation was not found in the documentation`.
- Isso causa fragilidade e inconsistência entre clientes que utilizam `resourcePath` relativo e a especificação Swagger interna.

### Solução Canônica Recomendada de Plataforma
No `ApiDocsController.java`:
- Implementar normalização no parâmetro de entrada:
  1. Se `path` não começar com `/`, prefixar com `/`.
  2. Se `path` não começar com o base path da API (ex.: `/api/`), tentar resolver com e sem o prefixo `/api/` antes de lançar erro 404.
  3. Aceitar alias `@RequestParam(name = "resourcePath", required = false)` para compatibilidade com clientes que utilizam essa convenção.

### Critérios de Aceite para Resolução
- [x] Chamar `/schemas/filtered?path=human-resources/funcionarios/filter&operation=post&schemaType=request` retorna o schema com sucesso, mesmo sem `/api/` explícito na URL.

---

## 📌 Issue #8: Hierarquia Visual de Seções e Densidade de Enquadramento em Dossiês/Drawers ("Caixa Dentro de Caixa" vs Seções Plain/Divider)

### Classificação
- **Módulos Afetados:** `@praxisui/dynamic-form`, Design System da Plataforma, `praxis-metadata-starter`
- **Severidade:** 🟡 Média (Evolução Fundamental de Design e UX de Plataforma)
- **Tipo:** Design System / Tokens de Layout e Apresentação
- **Status:** `[x] Resolvida` (Frontend: `@praxisui/core`, `@praxisui/dynamic-form`; Consumidor: `praxis-hero-hq-ui`)

### Diagnóstico Detalhado da Causa Raiz
No desenvolvimento de aplicações ricas baseadas em Praxis, formulários e fichas são frequentemente renderizados dentro de contêineres já delimitados (gavetas laterais/drawers, caixas de diálogo modais ou cards de dashboard).

1. **Sensação de "Caixa Dentro de Caixa":**
   No arquivo `projects/praxis-dynamic-form/src/lib/praxis-dynamic-form.scss`, os seletores de preset corporativo (`.praxis-dynamic-form--corporate-dossier .form-section`) aplicavam background, borda e `box-shadow` em todas as seções indistintamente, mesmo quando a seção possuía a classe `.section-appearance-plain`. Isso causava ruído visual severo, sensação de "caixa dentro de caixa" em gavetas (drawers) e forçava desenvolvedores a aplicar `!important` para anular backgrounds e bordas.
2. **Espaçamento e Divisores entre Seções Plain:**
   Em layouts corporativos de leitura (como dossiês, prontuários e perfis), o padrão recomendado é um fluxo contínuo com divisores horizontais sutis entre seções. Não havia governança declarativa para divisores nem anulação automática do divisor na última seção renderizada.

### Solução Canônica Implementada na Plataforma
1. **No `@praxisui/core`:**
   - Adicionada propriedade opcional `divider?: boolean` à interface canônica `FormSection` em `form-config.model.ts`.
2. **No `@praxisui/dynamic-form`:**
   - Adicionados os inputs canônicos `@Input() sectionDefaultAppearance?: 'card' | 'plain' | 'step'` e `@Input() sectionDivider?: boolean`.
   - Implementada inferência canônica em `getSectionAppearance(section)`:
     - Prioridade 1: Regras em tempo de execução (`ruleProps.appearance`).
     - Prioridade 2: Configuração explícita da seção (`section.appearance`).
     - Prioridade 3: Padrão informado no componente (`this.sectionDefaultAppearance`).
     - Prioridade 4: Fallback automático elegante quando `presentationPreset="corporate-dossier"` ou `"compact-presentation"` está ativo (`'plain'`).
   - Implementado helper `isSectionDividerEnabled(section)` que ativa automaticamente divisores sutis em seções plain sob `corporate-dossier`.
   - Adicionadas classes `section-appearance-${appearance}` e `section-has-divider`, além de atributos `[attr.data-section-appearance]` e `[attr.data-section-divider]` no DOM.
   - No SCSS (`praxis-dynamic-form.scss`):
     - Presets (`corporate-dossier`, `editorial-card`, `compact-presentation` e dark mode) agora excluem seções plain via `:not(.section-appearance-plain)`.
     - `.form-section.section-appearance-plain` anula `border-width: 0`, `background: transparent` e `box-shadow: none`.
     - Suporte a `.section-has-divider`: renderiza divisor inferior sutil (`border-bottom: 1px solid var(--pfx-form-section-divider, var(--md-sys-color-outline-variant))`) com padding inferior proporcional, e anula a borda no último elemento via `.section-drop-wrapper:last-of-type > .form-section.section-has-divider`.
3. **No Consumidor `praxis-hero-hq-ui`:**
   - Removidos os 25+ linhas de estilos ad-hoc com `!important` em `hero-dossier-drawer.component.ts`. O dossiê agora renderiza nativamente com visual executivo limpo e refinado através de `presentationPreset="corporate-dossier"`.

### Critérios de Aceite para Resolução
- [x] Formulários dinâmicos em gavetas e modais suportam configuração declarativa `appearance: 'plain'` e `sectionDefaultAppearance` sem necessidade de CSS `!important`.
- [x] O espaçamento e divisão entre seções plain é consistente e garantido de forma canônica com divisores sutis e supressão automática no último item.
- [x] Regressão visual e estrutural coberta por suites automatizadas (`praxis-dynamic-form.section-appearance.spec.ts` e `praxis-dynamic-form.presentation-preset.spec.ts` com 100% de aprovação).

---

## 📌 Issue #9: Governança Canônica e Descoberta de Serviços de Métricas e Dashboards (`/stats/capabilities` e `@praxisui/charts`)

### Classificação
- **Módulos Afetados:** `praxis-metadata-starter`, `@praxisui/charts`, `@praxisui/page-builder`
- **Severidade:** 🟡 Média (Pilar Estratégico de BI e Analytics da Plataforma)
- **Tipo:** Contrato de Endpoint / Descoberta Automática de Métricas
- **Status:** `[ ] Aberta`

### Diagnóstico Detalhado da Causa Raiz
No ecossistema da Plataforma Praxis, um dos pilares de governança de dados é a disponibilização nativa de serviços de agregação e estatísticas táticas:
- `POST /{resource}/stats/group-by`: Agrupamento por termo ou categoria com operações de métrica (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `DISTINCT_COUNT`).
- `POST /{resource}/stats/timeseries`: Séries temporais com granularidade (`DAY`, `MONTH`, `YEAR`).
- `POST /{resource}/stats/distribution`: Histogramas e percentis.
- `GET /{resource}/stats/capabilities`: Descoberta de quais campos do recurso são elegíveis para agregação e quais operações de métrica são suportadas.

Contudo, muitos desenvolvedores de aplicações consumidoras desconhecem essa infraestrutura canônica e recorrem a soluções subótimas e ineficientes, tais como:
- Disparar múltiplas requisições `POST /{resource}/filter?page=0&size=1` com filtros específicos apenas para ler `res.data.totalElements` (como ocorria inicialmente na contagem de ativos/inativos no Hero HQ).
- Escrever SQL manual ou criar endpoints controladores paralelos ad-hoc.
- No `@praxisui/charts` e no Page Builder, a amarração entre gráficos e endpoints de métricas exige digitação manual de URLs (`statsPath: '/api/human-resources/funcionarios/stats/group-by'`), em vez de aproveitar o descritor de recursos do metadata starter.

### Cenários Correlatos & Investigação Abrangente de Plataforma
1. **Cards de KPI e Bento Grids:**
   Um único chamado a `POST /{resource}/stats/group-by` com `field: 'ativo'` e `metric: { operation: 'COUNT' }` devolve os baldes `{ key: true, value: 53 }` e `{ key: false, value: 48 }` em uma única viagem de ida e volta (roundtrip) otimizada via `COUNT GROUP BY` no banco de dados. Os componentes de KPI da plataforma devem fornecer adaptadores para consumir esses baldes diretamente.
2. **HATEOAS de Analytics em Coleções:**
   O envelope `_links` retornado pelas tabelas e consultas de coleção não inclui links relacionais para as capacidades de estatísticas (ex.: `"stats": { "href": "/api/{resource}/stats/capabilities" }`). Incluir esse link permite que interfaces inteligentes ofereçam gráficos instantâneos (Quick Insights) a partir de qualquer tabela corporativa.
3. **Integração Declarativa com `@praxisui/charts`:**
   O serviço `ChartStatsApiService` no `@praxisui/charts` já está preparado para deserializar respostas de `GroupByStatsResponse` e `TimeSeriesStatsResponse`. Falta conectar esse serviço diretamente ao `resourceKey` via Page Builder para que o desenvolvedor apenas configure:
   ```json
   {
     "widget": "chart",
     "resourceKey": "operations/missoes",
     "statsType": "group-by",
     "field": "status",
     "metric": "COUNT"
   }
   ```
   e o widget descubra e renderize o gráfico sem nenhuma linha de TypeScript no app.

### Solução Canônica Recomendada de Plataforma
1. **No `praxis-metadata-starter`:**
   - Adicionar o link `stats` no envelope `_links` de respostas de coleção quando a entidade estiver anotada com `@UiAnalytics`.
   - Garantir documentação rica no catálogo OpenAPI (`x-ui.analytics`) com exemplos de payloads para `group-by`, `timeseries` e `distribution`.
2. **No `@praxisui/charts` e `@praxisui/page-builder`:**
   - Criar um resolvedor canônico `ResourceStatsDataSource` que recebe `resourceKey` e parâmetros de métrica, chamando automaticamente o serviço de estatísticas correto da API.
3. **Nas Diretrizes e Documentação Oficial:**
   - Adicionar receitas (recipes) e guias oficiais na `praxis-ui-landing-page` demonstrando a construção de dashboards completos utilizando exclusivamente os endpoints de métricas canônicos.

### Critérios de Aceite para Resolução
- [ ] Dashboards e widgets de KPI conseguem obter agregações e contagens em uma única requisição a `stats/group-by`, eliminando chamadas repetidas a `/filter`.
- [ ] O componente `@praxisui/charts` aceita `resourceKey` diretamente em sua configuração, sem exigir caminhos de URL hardcoded no consumidor.
- [ ] Recursos com anotações `@UiAnalytics` expõem o link HATEOAS canônico `"stats"` nas coleções.

---

## 📌 Issue #10: Refinamento Visual do `pdx-inline-toggle` e Seletor Tri-State para Filtros Booleanos

### Classificação
- **Módulos Afetados:** `@praxisui/dynamic-fields`, `@praxisui/table`, Design System da Plataforma
- **Severidade:** 🟡 Média (Impacto estético crítico na toolbar, quebra forçada de linha e atrito de UX com controles binários para filtros)
- **Tipo:** Componente Visual / Design Tokens MDC / UX de Filtragem
- **Status:** `[x] Resolvida`

### Diagnóstico Detalhado da Causa Raiz
No componente de filtros da tabela (`PraxisFilterComponent`), campos booleanos (como `ativo` em Heróis e Colaboradores) apresentam uma experiência visual truncada e um comportamento de layout engessado:

1. **O "Quadrado dentro do Retângulo" (CSS MDC Switch):**
   - O `@praxisui/dynamic-fields` (`projects/praxis-dynamic-fields/src/lib/components/inline-toggle/inline-toggle.component.ts`) implementa o `InlineToggleComponent` (`pdx-inline-toggle`).
   - Ele cria uma pílula externa arredondada estilo pill (`.pdx-inline-toggle-pill`, com `border-radius: 999px` e `border: 1px solid var(--md-sys-color-outline-variant)`).
   - Dentro dessa pílula, ele embute um `<mat-slide-toggle>` nativo do Angular Material 18/19 baseado na especificação MDC (*Material Design Components*).
   - Em `inline-toggle.component.ts:296-361`, existem overrides de CSS detalhados exclusivamente para a classe `.pdx-inline-toggle-pill.is-true .mdc-switch`.
   - Quando o filtro está em estado **neutro** (`value: null` — estado inicial onde nenhum filtro de status foi aplicado pelo usuário), o MDC switch não recebe variáveis de tema customizadas.
   - O resultado é que o trilho e a maçaneta do MDC switch colapsam para o estilo de fallback inerte do Material Design: uma maçaneta de arraste cinza, opaca e quadrada, emoldurada pela pílula externa, criando o efeito visual bizarro de **um bloco quadrado cinza dentro de um retângulo arredondado**.

2. **A Quebra Forçada de Linha para `.query-auxiliary`:**
   - Em `projects/praxis-table/src/lib/praxis-table.ts:2217`, colunas booleanas são classificadas pelo método `resolveLocalFilterControlType` como `FieldControlType.TOGGLE`.
   - Em `projects/praxis-table/src/lib/components/praxis-filter/praxis-filter.component.ts:3355-3368`, qualquer controle identificado como toggle é extraído da lista de campos compactos normais (`compactAlwaysVisibleMetas`) e atribuído a `toggleMetas`.
   - No template (`praxis-filter.component.html:180-205`), `toggleMetas` é renderizado dentro de `<div class="query-auxiliary">`, que é o mesmo container onde reside o botão "Gerenciar campos".
   - No arquivo de estilos (`praxis-filter.component.scss:365-372`):
     ```scss
     .praxis-filter-bar.has-compact .query-auxiliary {
       grid-column: 1;
       grid-row: auto; // <--- Força OBRIGATORIAMENTE uma segunda linha!
       justify-self: start;
       width: 100%;
     }
     ```
   - Como consequência, o filtro booleano é compulsoriamente jogado para a segunda linha, mesmo em monitores de alta resolução (1920px+) com espaço horizontal de sobra na primeira linha ao lado de `Nome Civil` e `Departamento`.

3. **Inadequação Conceitual de UX de um Switch Binário em Filtros:**
   - Um slide-toggle é um controle estritamente **binário** (*Ligado / Desligado*; `true` / `false`).
   - A filtragem de tabelas corporativas é necessariamente **tri-estado (*tri-state*)**:
     - **Neutro (`null`):** Traz todos os registros (ativos e inativos combinados);
     - **Verdadeiro (`true`):** Traz apenas ativos;
     - **Falso (`false`):** Traz apenas inativos.
   - Quando o operador vê a alavanca na posição "desligada", é impossível discernir se o filtro está inativo (exibindo todo o universo) ou se está filtrando apenas quem é inativo. Para limpar a seleção, o operador depende de um mini-botão de `X` que só aparece condicionalmente.

### Cenários Correlatos & Investigação Abrangente de Plataforma
1. **Campos Booleanos em Tabelas Gerais:** Qualquer tabela corporativa no monorepo que possua colunas booleanas (`ativo`, `bloqueado`, `verificado`, `urgente`) e utilize filtros fixos sofre da mesma quebra de linha rígida e da distorção visual da maçaneta quadrada.
2. **Contraste em Tema Escuro vs Tema Claro:** No tema escuro, a falta de estilização do track do MDC gera um contraste agressivo de cinzas sem harmonia com a paleta Oklab da Praxis. No tema claro, parece um botão inerte ou quebrado.
3. **Acessibilidade e Leitores de Tela:** O leitor de tela anuncia um componente `switch` com valores restritos a `checked / unchecked`, impedindo o usuário assistivo de entender como restaurar a busca para o estado neutro "Todos".

### Solução Canônica Recomendada de Plataforma
1. **Novo Controle Canônico `pdx-inline-tristate` no `@praxisui/dynamic-fields`:**
   - Para contexto de filtragem de tabelas, criar ou promover um componente de seleção tri-estado compacto:
     - Formato de pílula integrada com dropdown ou botões segmentados: *Todos | Sim (Ativo) | Não (Inativo)*.
     - Suporte a badges com contadores dinâmicos de cada estado.
2. **Correção do Fallback de CSS do `pdx-inline-toggle`:**
   - Nos casos onde o toggle for intencionalmente mantido, escrever regras completas para o estado neutro/desmarcado do MDC switch, garantindo que o handle seja perfeitamente circular, com trilho suave e transições condizentes com os tokens da plataforma.
3. **Revisão do Grid de Layout no `praxis-filter`:**
   - Permitir que controles booleanos e toggles compactos residam na linha de `.compact-fields`, eliminando a expulsão arbitrária para a segunda linha em `.query-auxiliary`.

### Implementação Canônica da Solução
1. **No `@praxisui/dynamic-fields` (`InlineToggleComponent` / `pdx-inline-toggle`):**
   - **Eliminação do Anti-Pattern Visual:** Injetados tokens CSS MDC no componente (`--mdc-switch-unselected-handle-color`, `--mdc-switch-unselected-track-color`, `--mdc-switch-unselected-focus-handle-color`, `--mdc-switch-unselected-hover-handle-color`), garantindo maçaneta 100% circular (`border-radius: 50% !important;`), trilho pill arredondado (`border-radius: 999px !important;`) e sombra suave em qualquer estado.
   - **Suporte ao Modo Tri-State:** Adicionado `@Input() tristate` e suporte a `metadata.tristate`. Ciclo de alternância por clique: `null` (Todos) -> `true` (Sim/Ativo) -> `false` (Não/Inativo) -> `null` (Todos).
   - **Apresentação Contextual e Acessibilidade:**
     - Quando `null` em modo tri-state: exibe rótulo `${label}: Todos` (i18n `praxis.dynamicFields.boolean.all` em pt-BR e en-US) e `aria-label` condizente.
     - Quando `false`: exibe `${label}: Não` com ícone sutil de `cancel`.
     - Preserva affordance de quick clear (`showQuickClear`) habilitado sob seleção em modo tri-state.
2. **No `@praxisui/table` (`PraxisFilterComponent`):**
   - **Injeção Automática de Preferências:** Em `applyToggleDisplayPrefs`, injeta automaticamente `tristate: (m as any).tristate ?? true` e `clearButton: (m as any).clearButton ?? { enabled: true, showOnlyWhenFilled: true }` nos toggles da barra de filtros.
   - **Correção de Case-Sensitivity:** Corrigido bug em `isToggle` que comparava `ct` (lowercase) com `INLINE_TOGGLE_CONTROL_TYPE` (camelCase `'inlineToggle'`), normalizando com `String(INLINE_TOGGLE_CONTROL_TYPE).toLowerCase()`.
   - **Layout Flex Fluido na Toolbar:** Em `praxis-filter.component.scss`, substituído o colapso rígido de grid de `.praxis-filter-bar.has-compact` por `display: flex; flex-wrap: wrap; align-items: center; gap: 8px;`, permitindo que os campos compactos e a `query-auxiliary` convivam elegantemente na primeira linha quando houver largura disponível, deixando a quebra de linha fluida apenas quando faltar espaço.

### Critérios de Aceite para Resolução
- [x] O filtro de status na toolbar da tabela exibe visual harmonioso integrado ao Design System, sem maçanetas quadradas ou blocos cinzas fora de padrão.
- [x] O operador consegue alternar claramente entre os estados *Todos*, *Ativo* e *Inativo* sem ambiguidade semântica.
- [x] Controles inline booleanos convivem na primeira linha com inputs e selects compactos quando houver largura de viewport disponível.
- [x] Bateria de testes unitários automatizados validada com 100% de sucesso (13 specs em `InlineToggleComponent`, 198 specs em `PraxisFilterComponent`).
- [x] Build de produção das libs `@praxisui/*` e do host consumidor `praxis-hero-hq-ui` concluído com sucesso (código 0).

---

## 📌 Issue #11: Suporte a Filtros Desacoplados e Teleporte via CDK Portal (`PraxisFilterPortal`)

### Classificação
- **Módulos Afetados:** `@praxisui/table`, `@praxisui/crud`
- **Severidade:** 🟡 Média (Limitação arquitetural crítica para layouts corporativos modernos, bento grids, sidebars e cards de comando)
- **Tipo:** Arquitetura de Componentes / Projeção de Conteúdo / Desacoplamento Headless
- **Status:** `[ ] Aberta`

### Diagnóstico Detalhado da Causa Raiz
Atualmente, a plataforma Praxis impõe uma arquitetura **monolítica e rígida na camada de apresentação da tabela**:

1. **Acoplamento Físico de Template:** Em `projects/praxis-table/src/lib/praxis-table.html:164, 306, 2578`, o `<praxis-filter>` está estruturalmente soldado dentro do template do `<praxis-table>`.
2. **Encapsulamento Rígido no CRUD:** Em `projects/praxis-crud/src/lib/praxis-crud.component.ts:202-224`, o `<praxis-crud>` instancia o `<praxis-table>` internamente sem expor pontos de projeção de conteúdo (`<ng-content>`) e sem expor diretivas de portal para os filtros.
3. **Ausência de Reatividade Externa no CRUD:** O `<praxis-crud>` **não possui `@Input() filterCriteria`**. Ele apenas lê o `filterCriteria` inicial do objeto `metadata` durante a primeira inicialização (`resolveFilterCriteria`).
4. **Impacto Prático:** Se o designer ou arquiteto de software desejar posicionar a barra de filtros inteligente em um **card tático superior destacado**, em uma **sidebar retrátil lateral** ou integrá-la a um **Bento Grid**, a plataforma bloqueia essa composição. Para fazer isso hoje, a aplicação consumidora é forçada a desligar os filtros nativos da tabela (`filtering.enabled = false`) e reconstruir manualmente inputs, selects, debounces e requisições HTTP — destruindo o valor do ecossistema *metadata-driven*.

### Cenários Correlatos & Investigação Abrangente de Plataforma
1. **Sidebars de Busca Avançada (Search Drawers Externos):** Telas corporativas com dezenas de parâmetros de pesquisa exigem filtros em uma gaveta lateral desacoplada da tabela.
2. **Sincronização Reativa Bidirecional:** A alteração de um filtro em um container externo deve invocar `praxisTable.applyAdvancedFilterCriteria()` mantendo debounce, ordenação e cursor de paginação, sem recriar o `TableConfig` e sem disparar a rajada dupla de requisições resolvida na Issue #1.
3. **Coordenação Master-Detail / Múltiplas Tabelas:** Capacidade de um único painel de filtros desacoplado alimentar simultaneamente duas tabelas sincronizadas na mesma tela.

### Solução Canônica Recomendada de Plataforma
1. **Diretiva de Teleporte CDK Portal (`*praxisFilterOutlet` ou `<praxis-filter-portal>`):**
   - Permitir que os filtros governados da tabela sejam projetados em qualquer container da página:
     ```html
     <!-- Card Tático Superior -->
     <div class="tactical-scope-card glass-panel">
       <ng-container *praxisFilterOutlet="heroesCrud" />
     </div>

     <!-- Tabela Focada Abaixo -->
     <praxis-crud #heroesCrud [metadata]="metadata" ... />
     ```
2. **Binding Reativo `@Input() filterCriteria` no `PraxisCrudComponent`:**
   - Expor `@Input() filterCriteria: Record<string, unknown>`.
   - Quando o binding for atualizado pelo host, repassar a mutação diretamente ao `PraxisTable.applyAdvancedFilterCriteria()`, sem destruir o estado do CRUD nem reatribuir o objeto de configuração completo.
3. **Token / Serviço de Ponte de Filtros (`TableFilterBridgeService`):**
   - Fornecer uma ponte reativa para que componentes standalone consigam ler o schema de filtros e despachar critérios de busca para a tabela associada via Signals / Observables.

### Critérios de Aceite para Resolução
- [ ] É possível projetar e renderizar os filtros inline governados por metadados em qualquer card ou container HTML fora do corpo da tabela.
- [ ] O componente `<praxis-crud>` aceita `@Input() filterCriteria` reativo e reflete mutações imediatamente na consulta `POST /filter` sem piscar a tela e sem duplo carregamento.
- [ ] Debounce, tags salvas e chips de filtros continuam sincronizados perfeitamente no container desacoplado.

---

## 📌 Issue #12: Componente Canônico Governado de Barra de Escopo Tática (`PraxisScopeBar`)

### Classificação
- **Módulos Afetados:** `@praxisui/table`, `@praxisui/rich-content`, `praxis-metadata-starter`
- **Severidade:** 🟡 Média (Padronização do Design System, eliminação de código ad-hoc e unificação de navegação tática)
- **Tipo:** Design System / Metadados OpenAPI / Componente Canônico
- **Status:** `[ ] Aberta`

### Diagnóstico Detalhado da Causa Raiz
A segmentação rápida por escopos táticos (ex.: *Todos, Em Prontidão, Em Reserva, Em Licença*) é um padrão onipresente em sistemas corporativos modernos:

1. **A Solução Ad-Hoc no Hero HQ:**
   - Diante da falta de um componente canônico desacoplado na plataforma, o Hero HQ criou uma barra tática manual em HTML/CSS (`funcionarios-page.component.ts`).
   - Isso gerou dois problemas graves de produto:
     - **O Vazio Visual:** O container utiliza `display: flex; justify-content: space-between;` com apenas o rótulo à esquerda e os chips à direita, abrindo um vão vazio de 800px a 1200px no meio da tela em resoluções padrão.
     - **Desconexão Funcional:** Como o CRUD não aceita filtros reativos de fora, o clique nesses chips apenas atualizava um signal e exibia um toast, sem filtrar os registros da tabela.
2. **Limitação do `quickFilters` Interno da Tabela:**
   - O `@praxisui/table` já possui a propriedade `toolbar.filters.quickFilters` no `TableConfig`.
   - Contudo, ele é renderizado como botões de aba simples embutidos na toolbar da tabela, sem estética de card de comando tático, sem badges numéricos dinâmicos vinculados a endpoints de agregação (`/stats/group-by`) e sem suporte a anotações declarativas no backend Java.

### Cenários Correlatos & Investigação Abrangente de Plataforma
1. **Badges Dinâmicos com Auto-Refresh:** Contadores numéricos em cada chip (ex.: *Todos [101]*, *Em Prontidão [53]*, *Em Reserva [48]*) que são carregados em uma única requisição a `/stats/group-by` e se atualizam automaticamente após mutações (`create`, `delete`, transições de workflow).
2. **Integração com Busca Global Omnibox:** O lado esquerdo da barra deve abrigar uma busca global rápida de texto com debounce (ex.: *Buscar por codinome, nome civil, CPF...*), eliminando completamente o vazio visual e unificando a intenção de busca.
3. **Acessibilidade e Navegação por Teclado:** Suporte a setas direcionais (ARIA `radiogroup` / `tabs`) para alternar rapidamente entre escopos táticos sem depender exclusivamente do mouse.

### Solução Canônica Recomendada de Plataforma
1. **No `praxis-metadata-starter` (Java):**
   - Criar a anotação canônica `@ScopeFilter` / `@ScopeBar`:
     ```java
     @ApiResource(
         resourceKey = "human-resources/funcionarios",
         scopeBar = {
             @ScopeItem(id = "all", label = "Todos os Heróis", isDefault = true),
             @ScopeItem(id = "ativos", label = "Em Prontidão", filter = "ativo=true", icon = "verified_user", tone = "success"),
             @ScopeItem(id = "inativos", label = "Reserva / Licença", filter = "ativo=false", icon = "person_off", tone = "warning")
         }
     )
     ```
   - O gerador de OpenAPI deve publicar essa configuração em `x-ui.table.scopeBar` ou `x-ui.scopeBar`.
2. **No `@praxisui/table` ou `@praxisui/rich-content` (Angular):**
   - Criar o componente canônico `<praxis-scope-bar>`:
     - **Lado Esquerdo:** Campo de busca omnibox instantânea ou filtros inline desacoplados;
     - **Centro / Direita:** Segmentos de escopo com contadores assíncronos dinâmicos (`stats`);
     - **Conexão Declarativa:** Vinculação automática com a tabela alvo via `forTable="tableId"`.

### Critérios de Aceite para Resolução
- [ ] O componente `<praxis-scope-bar>` renderiza layout equilibrado e esteticamente refinado sem vazios desproporcionais, com busca integrada na esquerda e chips na direita.
- [ ] Os contadores numéricos de cada escopo são obtidos em uma única chamada agregada a `/stats/group-by`, sem emitir rajadas de consultas à API.
- [ ] A seleção de qualquer escopo reflete imediatamente na filtragem da tabela conectada.

---

## 📌 Issue #13: Tokens Canônicos de Menu e Estilização de State Layer de Hover em Overlays (`praxis-menu-styles`)

### Classificação
- **Módulos Afetados:** `@praxisui/core`, `@praxisui/table`, `@praxisui/crud`, Design System da Plataforma
- **Severidade:** 🟡 Média (Percepção de interface congelada/inerte, ausência de feedback de cursor no menu de ações de linhas)
- **Tipo:** Design System / Tokens M3 / State Layers / CDK Overlay
- **Status:** `[x] Resolvida`

### Diagnóstico Detalhado da Causa Raiz
Ao abrir o menu de overflow de ações em qualquer linha da tabela (`praxis-table`) ou em menus acionados por botões (`mat-menu`), os itens da lista não respondem ao evento de `hover` do mouse, não oferecem animação, transição de cor ou camada de realce (*State Layer*):

1. **O Ciclo de Renderização em CDK Overlay:**
   - No `projects/praxis-table/src/lib/praxis-table.html:2391`, o menu de ações de linha utiliza `<mat-menu #rowMoreMenuV="matMenu" xPosition="before">`.
   - O Angular CDK desanexa o menu da árvore do componente da tabela e o projeta dentro de `<div class="cdk-overlay-container">`, anexado diretamente ao elemento `<body>`.
   - Qualquer estilo encapsulado de componente (`ViewEncapsulation.Emulated`) da tabela ou da página não atinge o menu.

2. **A Omissão no `@praxisui/core/theming`:**
   - No arquivo canônico `projects/ts-core/theming/_theming.scss` (e publicado em `@praxisui/core/theming`), a plataforma define um ecossistema abrangente de tokens M3 (`--md-sys-color-*`, `--mat-sys-*`, `--pdx-*`).
   - Para Tooltips, o starter criou explicitamente as variáveis `--mat-tooltip-*` e o mixin `@mixin praxis-tooltip-styles()`.
   - Contudo, **os menus foram completamente omitidos**: não existe nenhuma variável `--mat-menu-*`, nenhum mixin `@mixin praxis-menu-styles()` e nenhuma regra de hover para `.mat-mdc-menu-item`.

3. **A Falha de State Layer do Material MDC:**
   - No Angular Material 18/19 com MDC, botões `.mat-mdc-menu-item` possuem `background: transparent;`.
   - A camada de interação de hover depende da pseudo-classe `:hover` combinada com a variável CSS `--mat-menu-item-hover-state-layer-color`.
   - Em aplicações que utilizam o bridge canônico da Praxis sem compilar a suite Sass monolítica `@include mat.all-component-themes()`, essa variável resolve para `undefined`/`transparent`.
   - O navegador detecta o mouse sobre o elemento, mas visualmente nada acontece. O item permanece inerte até o momento do clique.

4. **Ausência de Classe Semântica no `<mat-menu>` da Tabela:**
   - Em `praxis-table.html:2391`, o `<mat-menu>` não recebe `panelClass="praxis-table-row-menu"`. Isso dificulta a segmentação de estilos de menu corporativo refinado sem afetar menus genéricos da aplicação.

### Cenários Correlatos & Investigação Abrangente de Plataforma
1. **Menus em Toolbars e Dropdowns do Page Builder:** Qualquer widget do Page Builder ou botão de toolbar que utilize `<mat-menu>` sofre do mesmo problema de hover inerte.
2. **Tema Escuro vs Tema Claro:** No tema escuro, a falta de realce é ainda mais crítica, pois o contraste entre itens adjacentes é reduzido e o operador não consegue ter certeza visual sobre qual linha está prestes a clicar.
3. **Micro-interações de Ações Destrutivas:** Ações de exclusão/reversão no menu (com tom vermelho/destructive) não ganham a cor de alerta correspondente no hover, reduzindo a segurança operacional contra cliques acidentais.

### Solução Canônica Recomendada de Plataforma
1. **No `@praxisui/core/theming` (`_theming.scss`):**
   - Adicionar as variáveis M3 de menu nos mixins `define-praxis-theme()` e `praxis-dark-theme-overrides()`:
     ```scss
     --mat-menu-container-color: var(--card, var(--surface));
     --mat-menu-container-shape: var(--radius-md, 14px);
     --mat-menu-item-label-text-color: var(--foreground);
     --mat-menu-item-icon-color: var(--muted-foreground);
     --mat-menu-item-hover-state-layer-color: color-mix(in oklab, var(--primary) 12%, transparent);
     --mat-menu-item-focus-state-layer-color: color-mix(in oklab, var(--primary) 18%, transparent);
     ```
   - Criar o mixin canônico `@mixin praxis-menu-styles()`:
     ```scss
     @mixin praxis-menu-styles() {
       .mat-mdc-menu-panel {
         border-radius: var(--radius-md, 14px) !important;
         border: 1px solid var(--border) !important;
         box-shadow: var(--shadow-command), 0 12px 32px rgba(0, 0, 0, 0.18) !important;
         backdrop-filter: blur(18px) saturate(140%) !important;
         -webkit-backdrop-filter: blur(18px) saturate(140%) !important;
         padding: 6px !important;
       }

       .mat-mdc-menu-item {
         min-height: 40px !important;
         border-radius: var(--radius-sm, 10px) !important;
         margin: 2px 0 !important;
         transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease !important;

         &:hover:not([disabled]) {
           background-color: var(--mat-menu-item-hover-state-layer-color) !important;
           transform: translateX(3px);

           .mat-icon {
             color: var(--primary) !important;
             transform: scale(1.08);
           }
         }
       }
     }
     ```
   - Invocar `@include praxis-menu-styles()` automaticamente dentro de `@mixin praxis-theme-bundle()`.

2. **No `@praxisui/table` (`praxis-table.html`):**
   - Adicionado `panelClass="praxis-table-row-menu"` nos `<mat-menu>` de overflow de linha (`#rowMoreMenu` e `#rowMoreMenuV`) para governança e estilização previsível.

3. **No Hero HQ:**
   - Removida a mitigação ad-hoc local de 60 linhas e adotado `@include praxis.praxis-menu-styles();` canônico.

### Critérios de Aceite para Resolução
- [x] Ao mover o cursor sobre qualquer item ativo do menu de overflow na tabela, o item exibe background suave de destaque, ícone colorido na cor primária e micro-deslocamento animado.
- [x] O card do menu em overlay possui bordas nítidas, arredondamento padrão do Design System e efeito de desfoque/vidro (*backdrop-filter*).
- [x] Itens desabilitados preservam estado neutro, opacidade reduzida e jamais respondem ao hover.
- [x] O mixin `@mixin praxis-menu-styles()` é exportado por `@praxisui/core/theming` e ativado pelo `praxis-theme-bundle()`.

---

## 📌 Issue #14: Evolução do Modo de Tabela em Gráficos (`praxis-chart`): Scroll Interno, Sticky Header, Eliminação de False Affordance e UX Analítico

### Classificação
- **Módulos Afetados:** `@praxisui/charts` (`PraxisChartComponent`)
- **Severidade:** 🟡 Média (degradação severa de usabilidade ao alternar gráficos densos para tabela, quebra de hierarquia visual e confusão de affordance de link em dados tabulares)
- **Tipo:** Refinamento de Componente / UX e Acessibilidade Analítica
- **Status:** `[x] Resolvida`

### Contexto & Origem da Feature
No componente `PraxisChartComponent` (`projects/praxis-charts/src/lib/components/praxis-chart/praxis-chart.component.ts`), existe uma funcionalidade acionada pelo botão da toolbar do widget shell (`chart-data-view`, ícone `table_view`), que permite ao usuário alternar a renderização do gráfico para uma tabela de dados estruturada.

Historicamente, essa tabela foi concebida sob o rótulo de **Accessible Data View** para atender aos critérios de acessibilidade WCAG / WAI-ARIA (fornecendo uma representação tabular textual para tecnologias assistivas via `role="region"`, `aria-labelledby`, `<caption>` e tags semânticas `<table>`, `<thead>`, `<tbody>`).

Entretanto, ao ser promovida a uma feature de **uso direto pelo usuário corporativo final** na interface gráfica (como alternativa analítica de visualização), o comportamento herdado do template e do CSS original gerou deficiências críticas de design e experiência do usuário.

### Diagnóstico Detalhado da Causa Raiz

#### 1. Scroll Desgovernado no Widget Inteiro (Perda de Cabeçalho e Título)
No arquivo `projects/praxis-charts/src/lib/components/praxis-chart/praxis-chart.component.ts` (linhas 351–359):
```css
.praxis-chart-accessible-data {
  position: absolute;
  inset: 0;
  z-index: 4;
  overflow: auto; /* <--- CAUSA RAIZ: overflow aplicado na section inteira */
  padding: 52px 16px 16px;
  color: var(--praxis-chart-config-text-color, var(--md-sys-color-on-surface, #1a1b20));
  background: var(--md-sys-color-surface-container-lowest, #fff);
}
```
E no template correspondente (linhas 214–252):
```html
<section class="praxis-chart-accessible-data" ...>
  <h3 [id]="accessibilityPanelTitleId">{{ accessibleDataTitle() }}</h3>
  <table>
    <caption>{{ accessibleDataDescription() }}</caption>
    <thead>
      <tr>
        <th scope="col">{{ accessibleCategoryHeading() }}</th>
        <th scope="col">{{ accessibleSeriesHeading() }}</th>
        <th scope="col">{{ accessibleValueHeading() }}</th>
      </tr>
    </thead>
    <tbody>
      @for (point of accessiblePoints(); track point.id) { ... }
    </tbody>
  </table>
</section>
```
**Consequências:**
- Quando a lista possui mais linhas do que o card comporta, o `overflow: auto` da `<section>` faz o container inteiro rolar para baixo.
- Ao rolar, o título `<h3>`, a descrição `<caption>` e, crucialmente, o cabeçalho de colunas `<thead>` **desaparecem da tela**, fazendo o usuário perder a referência de qual valor pertence a qual série.
- A barra de rolagem estende-se por toda a altura do card, encostando nas bordas do widget e quebrando a contenção visual esperada em dashboards corporativos.

#### 2. Falsa Affordance de Hyperlink (*Underline* Enganoso em Botões de Ação)
No arquivo `praxis-chart.component.ts` (linhas 394–408):
```css
.praxis-chart-point-action {
  appearance: none;
  padding: 4px 6px;
  border: 0;
  border-radius: 4px;
  color: inherit;
  background: transparent;
  font: inherit;
  font-weight: 600;
  text-align: left;
  text-decoration: underline; /* <--- CAUSA RAIZ: sublinhado fixo de hyperlink */
  text-decoration-thickness: from-font;
  text-underline-offset: 0.16em;
  cursor: pointer;
}
```
**Consequências:**
- No template, cada categoria da tabela é envolvida por um `<button class="praxis-chart-point-action" (click)="activateAccessiblePoint(point)">`.
- O objetivo original era permitir que usuários de teclado pudessem disparar o evento de seleção do ponto gráfico equivalente (`pointClick` / `selectionChange`).
- No entanto, a estilização com `text-decoration: underline` emula visualmente um **hiperlink de navegação web** (`<a>`). Em tabelas corporativas, os usuários assumem que clicar no texto sublinhado irá navegar para o cadastro ou dossiê daquela categoria.
- Como o clique apenas seleciona o ponto (que nem sequer está visível, pois o gráfico está oculto pelo modo de tabela), o usuário tem a sensação imediata de **link quebrado ou comportamento não responsivo**.

#### 3. Lacunas Analíticas Corporativas Frente ao Padrão da Plataforma
Ao comparar a tabela estática de acessibilidade com o padrão de excelência corporativa da plataforma (`@praxisui/table`):
- **Alinhamento Numérico:** Os valores numéricos (`point.valueLabel`) são alinhados à esquerda (`text-align: left`) sem `font-variant-numeric: tabular-nums`, dificultando a leitura e a comparação rápida de grandezas pelo usuário de negócios.
- **Falta de Ordenação (*Sorting*):** Ao alternar para o modo de tabela, a principal intenção do usuário analítico é consultar os maiores ou menores valores. O `<thead>` estático não suporta clique para alternar ordenação ascendente/descendente.
- **Falta de Exportação / Cópia Rápida:** Não há facilidade para exportar os dados exibidos para CSV ou copiá-los para a área de transferência.

---

### Arquitetura de Solução Proposta

```
┌──────────────────────────────────────────────────────────────┐
│ praxis-chart (Container do Widget Shell)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Cabeçalho Fixo (Título + Caption + Toolbar de Ações)    │  │
│  │ [Tabela de Distribuição] [Copiar CSV] [Ocultar Tabela] │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ .praxis-chart-table-scroll-viewport (overflow-y: auto) │  │
│  │                                                        │  │
│  │   ┌──────────────────────────────────────────────────┐ │  │
│  │   │ thead (position: sticky; top: 0; backdrop-filter)│ │  │
│  │   │ [ Categoria ▲ ]   [ Série ]    [ Valor (R$) ▼ ]  │ │  │
│  │   ├──────────────────────────────────────────────────┤ │  │
│  │   │ tbody (apenas as linhas rolam)                  │ │  │
│  │   │ • Alpha            Principal        1.450.000    │ │  │
│  │   │ • Beta             Secundária         820.000    │ │  │
│  │   │ • Gamma            Suporte            310.000    │ │  │
│  │   └──────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

#### 1. Refatoração de Layout: Flexbox e Viewport de Rolagem Dedicado
No template de `praxis-chart.component.ts`:
- Estruturar a `<section class="praxis-chart-accessible-data">` com `display: flex; flex-direction: column; overflow: hidden;`.
- Separar o cabeçalho (`<h3>` e `<caption>`) da área da tabela.
- Envolver a `<table>` em um container `<div class="praxis-chart-table-container">` com `flex: 1; min-height: 0; overflow-y: auto;`.
- Aplicar `position: sticky; top: 0; z-index: 2;` no `thead th`, com fundo sólido/glass condizente com a superfície para que os dados rolem **por baixo** dos cabeçalhos das colunas sem perder legibilidade.

#### 2. Eliminação da False Affordance de Hyperlink
- Remover `text-decoration: underline` de `.praxis-chart-point-action`.
- Adotar affordance limpa de botão/item tabular:
  - Fundo sutilmente destacado no hover (`background: color-mix(in srgb, currentColor 6%, transparent)`).
  - Indicador sutil de seleção (ex.: borda lateral primária ou tag `aria-pressed="true"` com chip discreto).
  - Manter acessibilidade de teclado integral (`focus-visible` com anel de foco bem delineado).

#### 3. Alinhamento Numérico e Suporte a Ordenação Básica
- Adicionar classe `.praxis-chart-col-value` com `text-align: right; font-variant-numeric: tabular-nums;`.
- Adicionar capacidade de clique no cabeçalho `<th>` para ordenar os `accessiblePoints()` por categoria ou valor numérico (crescente/decrescente).

---

### Solução Canônica Implementada na Plataforma
1. **Em `@praxisui/charts` (`PraxisChartComponent`):**
   - **Layout Flexbox com Viewport Dedicado:** A seção `.praxis-chart-accessible-data` foi reestruturada para `display: flex; flex-direction: column; overflow: hidden;` com `.praxis-chart-accessible-header` fixo no topo e a tabela encapsulada no container de rolagem dedicado `.praxis-chart-table-container` (`flex: 1; min-height: 0; overflow-y: auto; overflow-x: auto; overscroll-behavior: contain;`).
   - **Sticky Headers com Linha Divisória e Superfície Opaca:** O `thead` possui `position: sticky; top: 0; z-index: 2;` com background herdeiro da cor de superfície opaca configurada (`--praxis-chart-accessible-thead-bg`) e sombra sutil de separação (`box-shadow: 0 1px 0 ...`).
   - **Eliminação da False Affordance de Hyperlink:** `.praxis-chart-point-action` utiliza `text-decoration: none;` com affordance de botão interativo moderno (`border-radius: 4px; hover: color-mix(currentColor 8%)`), preservando foco acessível e realce quando selecionado (`[aria-pressed='true']`).
   - **Alinhamento Numérico Tabular:** Classe `.praxis-chart-col-value` com `text-align: right !important; font-variant-numeric: tabular-nums;`.
   - **Ordenação Interativa (Sorting):** Adicionados signals reativos `accessibleSortField`, `accessibleSortDirection` e `sortedAccessiblePoints = computed(...)`, permitindo ao usuário alternar ordenação por valor numérico (`asc`/`desc`) ou por categoria alfabética, com indicadores visuais (`▲`/`▼`) e atributos `aria-sort`.
2. **No Host Hero HQ:**
   - Removido o bloco CSS ad-hoc em `src/styles/theme-praxis.scss`. O componente responde nativamente à experiência requerida.

### Critérios de Aceite para Resolução Definitiva na Plataforma
- [x] Ao alternar para a visualização de tabela em um gráfico com grande volume de dados, apenas as linhas de dados rolam verticalmente.
- [x] O título da tabela e o cabeçalho das colunas (`thead`) permanecem perfeitamente visíveis e fixos no topo durante a rolagem.
- [x] Nenhum texto nas células da tabela possui sublinhado permanente (`text-decoration: underline`), eliminando a confusão com hyperlinks de navegação.
- [x] As colunas numéricas de valores utilizam alinhamento à direita e numerais tabulares (`tabular-nums`).
- [x] O estado de seleção ou clique no botão de categoria mantém total acessibilidade por teclado (`Enter`/`Space`) e leitor de tela (`aria-pressed`).
- [x] O design do container respeita as margens internas do widget shell sem vazar barras de rolagem para os limites externos do card.

---

## 📌 Issue #15: Síntese Compulsória de Botão "Adicionar" em Recursos Read-Only, Desalinhamento de Hover e Perda de Contraste MDC

### Classificação
- **Módulos Afetados:** `@praxisui/table`, `@praxisui/crud`, `@praxisui/core` (Theming)
- **Severidade:** 🟡 Média (poluição visual em recursos consultivos, quebra de acessibilidade por perda de contraste e efeito de hover desalinhado/vazando do botão)
- **Tipo:** Refinamento de Componente / Governança de Capabilities / Integração M3
- **Status:** `[x] Resolvida` (2026-10-07)

### Diagnóstico Detalhado da Causa Raiz

#### 1. Síntese Compulsória de Ação Desabilitada em Recursos Read-Only
No arquivo `projects/praxis-table/src/lib/praxis-table.ts` (linhas 3548–3568 e 3751):
- A tabela possui um mecanismo de descoberta automática de ações de coleção (`resolveCollectionCreateRuntime`).
- Quando o recurso subjacente é estritamente consultivo (ex.: views analíticas de banco como `vw-ranking-reputacao`, onde `capabilities.create.supported === false`), em vez de omitir a ação, a tabela cria compulsoriamente um botão com:
  - `action: 'create'`
  - `disabled: true`
  - `appearance: 'filled'`
  - `tooltip: 'Criação indisponível no contexto atual'` (linha 3751 de `praxis-table.ts`)
- Na toolbar (`praxis-table-toolbar.ts:3473–3476`), o método `getActionTooltip` adiciona a razão padrão da tabela (`'Ação indisponível no contexto atual.'`), concatenando:
  ```typescript
  return configured ? `${reason} ${configured}` : reason;
  ```
  Resultando na mensagem redundante: `"Ação indisponível no contexto atual. Criação indisponível no contexto atual"`.

#### 2. Omissão de `[attr.aria-disabled]` e Perda de Contraste Tipográfico
No arquivo `projects/praxis-table/src/lib/praxis-table-toolbar.ts` (linhas 562–580):
- O botão preenchido utiliza `[disabledInteractive]="true"`. Quando ativo, o Angular Material **não** insere o atributo HTML `disabled` para permitir que o elemento capture eventos de hover e exiba o tooltip.
- O CSS de estado desabilitado (linhas 2094–2125) depende do seletor `.action-btn[aria-disabled='true']`. No entanto, o template do botão preenchido **não possui** `[attr.aria-disabled]`.
- Como resultado, as variáveis de cor e contraste da plataforma não são aplicadas. O botão cai nas cores nativas do Material Design 3 (`--mdc-filled-button-disabled-container-color` e `--mdc-filled-button-disabled-label-text-color`), onde texto e ícone perdem todo o contraste contra o fundo cinza, parecendo um retângulo sólido vazio.

#### 3. Desalinhamento da State-Layer de Hover (Vazamento de Dimensão)
No arquivo `praxis-table-toolbar.ts` (linhas 1990–2006):
- A plataforma restringe a altura dos botões de toolbar para `36px` (`--p-table-toolbar-action-size: 36px; border-radius: 8px`).
- O Angular Material injeta internamente o container de ripple `.mat-mdc-button-persistent-ripple` com altura padrão de 40px/48px e raio de curvatura de pílula (20px).
- Sem `overflow: hidden` no botão e sem propagação de `border-radius: inherit` para as camadas filhas, ao passar o mouse, a camada translúcida de hover vaza para fora do botão, criando uma mancha cinza de proporções incompatíveis com a geometria da ação.

### Solução Canônica Implementada na Plataforma
1. **Em `@praxisui/core` (`table-config-v2.model.ts` e `toolbar-config-augment.d.ts`):**
   - Adicionada a propriedade declarativa `preserveUnsupportedActions?: boolean` na interface `ToolbarConfig`.
2. **Em `@praxisui/table` (`praxis-table.ts`):**
   - No método `buildCollectionCreateToolbarAction`: quando a ação de criação é auto-sintetizada (`!existing || existing.__praxisCollectionCreateAction === true`) e a operação descoberta não é suportada (`operation?.supported === false`), ela é **omitida por padrão** (retorna `null`). Apenas é mantida se `toolbar.preserveUnsupportedActions === true` for explicitamente configurado.
3. **Em `@praxisui/table` (`praxis-table-toolbar.ts`):**
   - **Template**: Adicionado `[attr.aria-disabled]="getActionAriaDisabled(action)"` em todos os botões (`filled`, `outlined`, `elevated`, `text`, `tonal`, `fab`, `menu` e `bulk`), ativando com precisão os estilos de acessibilidade da plataforma.
   - **Estilos CSS**:
     - Em `.action-btn.mat-mdc-button-base`: adicionado `overflow: hidden !important; border-radius: var(--p-table-toolbar-action-radius, var(--praxis-action-control-radius, 8px)) !important;`.
     - Adicionada regra `.action-btn.mat-mdc-button-base .mat-mdc-button-persistent-ripple, .action-btn.mat-mdc-button-base .mat-mdc-button-ripple { border-radius: inherit !important; overflow: hidden !important; }`.
     - Em `.action-btn[aria-disabled='true']`: opacidade padrão calibrada para `0.75` (`var(--praxis-action-control-disabled-opacity, 0.75)`) e ícones com `opacity: 0.85 !important; color: currentColor !important;` garantindo conformidade WCAG AA.
   - **Método `getActionTooltip`**: Adicionada deduplicação inteligente para não concatenar prefixos quando o tooltip configurado já contiver a razão ou indicar indisponibilidade.
4. **Validação & Testes**:
   - 99/99 testes unitários aprovados em `@praxisui/table` (`praxis-table-toolbar.spec.ts` e `praxis-table.runtime-operations.spec.ts`).
   - Build downstream de produção aprovado no consumidor `praxis-hero-hq-ui`.

### Critérios de Aceite para Resolução
- [x] Em recursos estritamente consultivos (views/read-only), o botão de criação não é renderizado na toolbar por padrão.
- [x] Se uma ação for renderizada em estado desabilitado, o ícone e o rótulo de texto permanecem perfeitamente legíveis com contraste adequado conforme WCAG AA.
- [x] A camada de hover (state-layer) respeita rigorosamente o contorno e o raio de curvatura do botão (36px com 8px de radius), sem vazamentos.

---

## 📌 Issue #16: UX e Animação de Troca de Widgets (`swap` Collision Policy) no Page Builder: Live Shift, Colisões Assimétricas e Redesenho do Snap Preview Inválido

### Classificação
- **Módulos Afetados:** `@praxisui/page-builder`, `@praxisui/core` (`DynamicWidgetPageComponent`)
- **Severidade:** 🟡 Média (experiência de personalização do dashboard confusa, artefato visual estranho de "chapa vermelha" cortando componentes e falha em trocas entre widgets de dimensões assimétricas)
- **Tipo:** Refinamento de UX / Motor de Layout de Grade / Animações de Interação
- **Status:** `[x] Resolvida` (Implementado suporte canônico a `push-down`, preservação estrita de dimensões assimétricas, eliminação da chapa vermelha opaca com micro-badge contextual de bloqueio e preview pill de swap com live shift)

### Contexto & Descoberta
Durante os testes de manipulação de layout no Dashboard em modo de authoring, observou-se dois comportamentos distintos:
1. **Swap Simétrico ($6 \times 6$ com $6 \times 6$):** Ao configurar `collisionPolicy: 'swap'`, a troca entre os dois gráficos funcionou matematicamente, mas sem animação fluida (*live shift*) e sem feedback visual positivo de intenção de troca.
2. **Swap Assimétrico ($6 \times 6$ sobre $12 \times 6$):** Ao tentar arrastar um dos gráficos (largura 6) sobre a tabela de incidentes (largura total 12), o sistema gerou uma **"chapa vermelha translúcida"** cortando a tabela ao meio, sobrepondo dados e invadindo o card inferior, sem permitir a troca e transmitindo a sensação de bug gráfico.

---

### Diagnóstico Detalhado da Causa Raiz

#### 1. A Anomalia Visual da "Chapa Vermelha" (`.pdx-canvas-snap-preview--invalid`)
No arquivo `projects/praxis-core/src/lib/widgets/dynamic-widget-page.component.ts`:
- No template (linhas 431–438):
  ```html
  @if (canvasPreviewItem() && !hasResizeFeedback()) {
    <div
      class="pdx-canvas-snap-preview"
      [class.pdx-canvas-snap-preview--invalid]="canvasPreviewInvalid()"
      [style.gridColumn]="canvasPreviewGridColumn()"
      [style.gridRow]="canvasPreviewGridRow()"
    ></div>
  }
  ```
- E no CSS (linhas 948–963):
  ```css
  .pdx-canvas-snap-preview--invalid {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--md-sys-color-error) 18%, transparent),
      color-mix(in srgb, var(--md-sys-color-error-container) 22%, transparent)
    );
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--md-sys-color-error) 58%, transparent),
      inset 0 0 0 2px color-mix(in srgb, var(--md-sys-color-surface) 40%, transparent);
  }
  ```
**Por que isso gera uma experiência ruim?**
- O elemento é uma `<div>` vazia renderizada dentro do CSS Grid sobre os mesmos trilhos de colunas e linhas ocupados pelo widget de destino.
- Ele fica renderizado **em cima dos dados da tabela**, cobrindo o cabeçalho e cortando os textos das células de forma abrupta.
- Não possui texto, ícone explicativo ou tooltip contextual informando **por que** a área está bloqueada (se é incompatibilidade dimensional, colisão com terceiros ou constraint de tamanho mínimo). Para o usuário final, parece uma falha de layout da página ou um artefato visual de renderização corrompida.

#### 2. A Falha do Algoritmo em Trocas Assimétricas ($6 \times 6$ vs. $12 \times 6$)
No arquivo `dynamic-widget-page.component.ts` (linhas 6405–6442):
- O método `buildCanvasSwapItem` implementa um modelo estrito de troca direta 1:1:
  ```typescript
  const intendedSwapItem: WidgetPageCanvasItem = {
    ...targetItem,
    col: sourceItem.col,
    row: sourceItem.row,
    colSpan: sourceItem.colSpan, // <--- Força a tabela de 12 colunas a virar 6 colunas!
    rowSpan: sourceItem.rowSpan,
  };
  ```
- No cenário do dashboard:
  - O gráfico arrastado (`payrollChart`) tem `colSpan: 6, rowSpan: 6` na `row: 8`. Ao lado dele, na `col: 7, row: 8`, está o `reputationChart` (outro bloco de 6 colunas).
  - A tabela (`recentIncidents`) ocupa a linha inteira (`col: 1, row: 14, colSpan: 12`).
  - Ao arrastar o gráfico para a linha 14, o algoritmo tenta encaixar a tabela de 12 colunas no slot original do gráfico (`col: 1, row: 8, colSpan: 6`).
  - Porém, ao checar colisões na linha 6430 (`collides`), a tabela redimensionada ou deslocada esbarra no segundo gráfico vizinho (`reputationChart`).
  - Como a colisão não é estritamente 1:1 ou viola o espaço dos demais itens, `buildCanvasSwapItem` retorna `null`, gerando `blocked = true` e projetando a chapa vermelha de snap preview inválido.

---

### Benchmark de Mercado: Como Ferramentas de Ponta Tratam Drag de Blocos Assimétricos

| Ferramenta / Plataforma | Comportamento ao Arrastar Bloco Menor ($6$) sobre Bloco Maior ($12$) | Feedback Visual |
|---|---|---|
| **Grafana / Datadog (Gridstack.js)** | **Push Down / Cascade Displace:** Em vez de tentar "trocar" um bloco de 6 por um de 12, o bloco largo desce para a linha inferior (`row: row + sourceHeight`), abrindo a linha para o novo bloco. | Linhas azuis indicando o novo patamar e animação fluida de empurrar (*gravity compacting*). |
| **Notion (Bento Boards)** | **Half-Slot Insertion:** Se solto na metade esquerda, divide a linha em duas colunas de 6 (redimensiona ambos). Se solto na borda superior/inferior, insere uma nova linha completa. | Barra azul horizontal ou vertical bem delineada indicando a intenção de divisão. |
| **Apple iOS (Home Screen / Widgets)** | **Refusal Gesture (Shake):** Se dois widgets não têm o mesmo formato (ex.: um widget retangular 2x4 sobre um quadrado 2x2), eles **não trocam**. O widget passivo treme a cabeça em negação (*head shake*) e desvia sem chapa vermelha. | Microinteração cinemática sem mensagem textual nem cores agressivas. |
| **Retool / Webflow Canvas** | **Drop Zone Indicator:** O container de destino destaca bordas de drop e exibe um chip flutuante com a ação: `[Inserir acima]` ou `[Dividir coluna]`. | Outline primário pontilhado com tooltip de ação clara. |

---

### Arquitetura de Solução Proposta para a Plataforma Praxis

```
┌────────────────────────────────────────────────────────────────┐
│ Page Builder Canvas: Três Níveis de Evolução de Layout         │
│                                                                │
│ 1. POLÍTICA DE DESLOCAMENTO VERTICAL (Push Down Mode)          │
│    Ao arrastar Bloco A (6 col) sobre Tabela B (12 col):        │
│    ┌──────────────┐                                            │
│    │ Bloco A (6)  │  ░░ Slot Vazio (6) ░░                      │
│    └──────────────┘                                            │
│    ▼ (Empurra a tabela inteira para baixo suavemente)          │
│    ┌──────────────────────────────────────────┐                │
│    │ Tabela B (12) [Deslocamento animado]     │                │
│    └──────────────────────────────────────────┘                │
│                                                                │
│ 2. REDESENHO DO SNAP PREVIEW INVÁLIDO (Adeus "Chapa Vermelha") │
│    - Eliminar o gradiente vermelho opaco sobre o conteúdo.    │
│    - Usar contorno pontilhado neutro/sutil (1px dashed).       │
│    - Exibir badge contextual:                                  │
│      [ ⚠️ Tamanho incompatível para troca direta ]              │
│                                                                │
│ 3. LIVE SHIFT & GHOST DE TROCA (Para itens de mesmo tamanho)   │
│    - Transição CSS FLIP (transform: translate3d) 200ms ease.   │
│    - Chip flutuante no cursor: [ ⇄ Trocar Posição ].           │
└────────────────────────────────────────────────────────────────┘
```

#### 1. Suporte a Modo `push-down` (ou `cascade`) em `WidgetPageCanvasCollisionPolicy`
Evoluir o tipo canônico em `projects/praxis-core/src/lib/widgets/widget-page.model.ts`:
```typescript
export type WidgetPageCanvasCollisionPolicy = 'block' | 'swap' | 'push-down';
```
- No modo `'push-down'`: se o item arrastado colidir com um widget que não pode ser trocado simetricamente, o widget atingido (e todos os abaixo dele) têm sua propriedade `row` incrementada de acordo com o `rowSpan` do item móvel, abrindo espaço perfeitamente.

#### 2. Humanização do Feedback de Bloqueio (Substituição da Chapa Vermelha)
- Alterar o CSS de `.pdx-canvas-snap-preview--invalid`:
  - Remover o fundo opaco com gradiente vermelho que oculta o texto da tabela.
  - Utilizar borda pontilhada suave com `pointer-events: none;`.
  - Inserir um micro-badge flutuante centralizado (`.pdx-canvas-snap-preview__badge`):
    ```html
    <div class="pdx-canvas-snap-preview__badge">
      <mat-icon>block</mat-icon>
      <span>Espaço insuficiente para troca direta</span>
    </div>
    ```

#### 3. Configuração Declarativa no `DynamicPageConfigEditorComponent`
- Adicionar no editor de configurações da página um campo de rádio/select:
  - **Estratégia de Colisão do Canvas:**
    - `Bloquear (Strict Block)`: Mantém a grade imóvel;
    - `Trocar Posições (Swap)`: Inverte itens simétricos;
    - `Empurrar Abaixo (Push Down / Cascade)`: Abre espaço dinâmico deslocando linhas inferiores.

---

### Critérios de Aceite para Resolução
- [x] Ao arrastar um widget sobre uma área incompatível para troca direta, a plataforma não exibe uma mancha vermelha sólida cortando o componente subjacente.
- [x] O feedback de colisão inválida apresenta um contorno limpo e uma mensagem clara (badge/tooltip) explicando a razão da restrição.
- [x] A plataforma suporta deslocamento vertical automático (`push-down`), permitindo inserir widgets menores acima de tabelas ou blocos largos de 12 colunas sem exigir reestruturação manual da grade.
- [x] Itens simétricos realizam troca com animação visual contínua e badge de confirmação de swap.

---

## 📌 Issue #17: Redesenho Didático e Funcional do Editor de Rich Content: Árvore Hierárquica, Drag & Drop, Icon Picker e Suporte Canônico a Grids e `actionCard` Aninhado

### Classificação
- **Módulos Afetados:** `@praxisui/rich-content`, `@praxisui/core` (`rich-content.model.ts`), `praxis-rich-content-config-editor.ts`, `rich-content-authoring.ts`
- **Severidade:** 🔴 Alta (bloqueio total da autoria visual de bento grids, hubs de atalhos departamentais e cartões compostos, gerando tela em branco e forçando edição em JSON cru)
- **Tipo:** Arquitetura de Modelos Canônicos / UX de Authoring / Integridade de Componentes
- **Status:** `[x] Resolvida` (2026-10-07)

---

### Diagnóstico Aprofundado da Causa Raiz

A auditoria ergonômica, de código e de ciclo de vida do componente `PraxisRichContentConfigEditor` (`projects/praxis-rich-content/src/lib/praxis-rich-content-config-editor.ts`, ~7.200 linhas) comparada à execução real no widget **"Centros de Comando & Especialidades"** revelou um conjunto de falhas em cadeia que vão desde o modelo de dados em `@praxisui/core` até a camada de apresentação do editor:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                ESTADO ATUAL DO EDITOR DE RICH CONTENT (ÁRIDO & INOPERANTE)                      │
├──────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────┤
│ ESTRUTURA DO DOCUMENTO (Árvore Rasa de 1º Nível)    │ PAINEL DE PROPRIEDADES (Compose: Itens Aninhados)        │
│ ┌──────────────────────────────────────────────────┐ │ ┌──────────────────────────────────────────────────────┐ │
│ │ [BLOCO 1] Compose                                │ │ │ Compose ▸ Itens do compose          [+ Adicionar Item]│ │
│ │ (Apenas 1 nó visível! Os 6 cards sumiram daqui!) │ │ │                                                      │ │
│ └──────────────────────────────────────────────────┘ │ │ Item 1                                     [Remover] │ │
│                                                      │ │ Tipo de bloco: [                    ▼] (EM BRANCO!)   │ │
│ ⚠️ VIOLAÇÕES DE GESTALT & VAZAMENTO TÉCNICO:        │ │ (NENHUM CAMPO EXIBIDO! actionCard NÃO É SUPORTADO!)   │ │
│ - Botão "+ Adicionar bloco" solto na direita        │ │                                                      │ │
│ - Campos "Classe raiz" e "Contexto" no topo nobre   │ │ Item 2                                     [Remover] │ │
│ - Jargões: "Affordances visuais", "Gates"           │ │ Tipo de bloco: [                    ▼] (EM BRANCO!)   │ │
│ - Select de "Tipo de bloco" no topo é DESTRUTIVO!   │ │                                                      │ │
│                                                      │ │ ⚠️ ZERO BOTÕES DE REORDENAÇÃO (Nem Mover p/ Cima/Baixo)│ │
│                                                      │ │ ⚠️ ZERO DRAG & DROP (Sem handles de arrasto)           │ │
│                                                      │ │ ⚠️ ZERO ICON PICKER (Inputs secos de string)           │ │
│                                                      │ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────┘
```

#### 1. Tipagem Estrita em `@praxisui/core` e Supressão de `actionCard` no Editor
- **No Modelo Canônico (`projects/praxis-core/src/lib/models/rich-content/rich-content.model.ts:134-140`):**
  ```typescript
  export interface RichComposeNode extends RichBlockBaseNode {
    type: 'compose';
    direction?: 'row' | 'column';
    gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    wrap?: boolean;
    items: RichPresenterNode[]; // <--- ERRO CANÔNICO: Aceita apenas nós atômicos!
  }
  ```
  `RichPresenterNode` é restrito a nós atômicos (`RichTextNode`, `RichBadgeNode`, `RichIconNode`, `RichAvatarNode`, `RichImageNode`, `RichLinkNode`, `RichMetricNode`, `RichProgressNode`, `RichActionButtonNode`). Cartões compostos como `RichActionCardNode`, `RichCardNode` e `RichCalloutNode` foram excluídos da união!
- **No Editor (`praxis-rich-content-config-editor.ts:1340`):**
  O editor itera sobre `presenterNodeTypes` para popular as opções dos itens do compose. Ao carregar um `actionCard`, o `<select>` não encontra a opção e **fica vazio**. O `#presenterFields` não possui branch `@case ('actionCard')`, gerando um item oco ("Item 1", "Item 2") sem nenhum input de texto, título, descrição, botão ou rota.

#### 2. Ausência de Suporte Nativo a Grid no Modelo e no Editor
- No Hero HQ, o widget define:
  ```typescript
  layout: 'grid', columns: 'auto-fit', minColumnWidth: '320px', gap: 'md'
  ```
- O modelo canônico de `RichComposeNode` e o editor visual suportam apenas `direction: 'row' | 'column'`. O grid só funcionou na aplicação porque uma classe externa arbitrária (`hub-action-cards-grid`) foi inserida via CSS.
- **Solução Canônica:** `RichComposeNode` deve suportar nativamente `layout?: 'flex' | 'grid'`, `columns?: 'auto-fit' | 'auto-fill' | number`, e `minColumnWidth?: string`. O editor visual deve oferecer controles dedicados para alternar entre "Grade Responsiva (Grid)" e "Linha/Coluna (Flex)".

#### 3. Árvore Estrutural Rasa e Ocultação de Filhos (Falta de Recursão)
- O painel lateral `.prx-rich-editor__structure-list` itera exclusivamente sobre `parsedDocument.nodes` (nível 1).
- Um container `compose` com 6 cartões é renderizado na árvore como um bloco cinza único: `BLOCO 1 Compose`.
- Os cartões reais não possuem identidade na árvore. Não há expansão hierárquica, não há ícone e não há exibição do título de negócio ("Heróis & Colaboradores", "Centro de Missões").

#### 4. Impossibilidade de Reordenação e Falta de Drag & Drop
- `@angular/cdk/drag-drop` não foi importado no componente.
- Os blocos de nível 1 possuem botões textuais simples (`[Mover para cima]`, `[Mover para baixo]`), mas os itens de `compose` **nem sequer possuem esses botões** (possuem unicamente `[Remover]`).
- A única forma oferecida pela plataforma para trocar a ordem de cartões aninhados é abrir a aba `JSON avançado` e recortar/colar código.

#### 5. Ausência de Icon Picker Visual
- Todos os campos de ícone são inputs textuais secos (`<input [ngModel]="getStringField(node, 'icon')">`). O usuário precisa adivinhar o identificador exato da fonte Material Symbols (`military_tech`, `receipt_long`, `inventory_2`). Se errar uma letra, o ícone quebra sem qualquer alerta.

#### 6. Falhas Críticas de Ergonomia, Gestalt e Risco Destrutivo
- **Vazamento Técnico no Topo:** A segunda linha do editor contém "Classe raiz" CSS e "Contexto do documento" (com inputs JsonLogic de escopos e aliases). Esse conteúdo técnico de baixo nível ocupa o espaço nobre inicial, confundindo montadores de tela.
- **Risco de Destruição Acidental:** No topo do painel do bloco selecionado, há um dropdown de `Tipo de bloco` que permite mudar um `Compose` com 6 cartões para `Texto` em um clique, sem diálogo de confirmação, destruindo instantaneamente todo o trabalho.
- **Violação de Gestalt:** O botão `+ Adicionar bloco` fica no canto direito superior, sobre o painel de propriedades, e não na barra lateral onde a lista de blocos é gerenciada.
- **Edição Cega (Sem Live Preview):** Abas mutuamente exclusivas (`Edição guiada` vs `Prévia`). Não é possível ver o impacto visual imediato das edições sem alternar de aba.

---

### Solução Canônica Recomendada de Plataforma (Redesenho Estrutural)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                NOVO DESIGN DO EDITOR DE RICH CONTENT (DIDÁTICO & INTUITIVO)                     │
├──────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────┤
│ ÁRVORE DO DOCUMENTO (Treeview com Drag & Drop)       │ PAINEL DE PROPRIEDADES (Inspeção Contextual do Nó)       │
│                                                      │                                                          │
│ ▾ ⠿ 📦 Grid de Atalhos (Compose: 6 itens)           │ 🏷️ [actionCard] Heróis & Colaboradores                    │
│   │                                                  │                                                          │
│   ├─ ⠿ 👥 Heróis & Colaboradores         [⋮]         │ 📝 Título:     [Heróis & Colaboradores                 ] │
│   ├─ ⠿ 🎖️ Centro de Missões               [⋮]         │ 📄 Subtítulo:  [Cadastros completos, identidades civis...] │
│   ├─ ⠿ 🛡️ Ativos & Armaduras              [⋮]         │                                                          │
│   ├─ ⠿ 📋 Suprimentos & Contratos        [⋮]         │ 🎨 Ícone:      [ 👥 group ] [ Alterar Ícone... ]          │
│   ├─ ⠿ 🎯 Inteligência & Ameaças         [⋮]         │                                                          │
│   └─ ⠿ 📈 Ranking Reputacional           [⋮]         │ 🔘 Botão Ação: [ Acessar RH             ] [ ➔ arrow_fw ] │
│                                                      │ 🔗 Rota/Ação:  [ /rh/funcionarios                      ] │
│ [+ Adicionar Card...] (Abre galeria de presets)      │ 🎨 Estilo/Tom: [ Accent / tone-rh                     ▼] │
├──────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────┤
│ 👁️ LIVE PREVIEW EMBUTIDO (Preview em tempo real abaixo ou em modo Split-Screen)                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 1. Evolução do Modelo Canônico em `@praxisui/core` (`rich-content.model.ts`)
```typescript
// projects/praxis-core/src/lib/models/rich-content/rich-content.model.ts
export type RichComposeChildNode =
  | RichPresenterNode
  | RichActionCardNode
  | RichCardNode
  | RichCalloutNode
  | RichMetricNode
  | RichKeyValueListNode
  | RichStatGroupNode;

export interface RichComposeNode extends RichBlockBaseNode {
  type: 'compose';
  layout?: 'flex' | 'grid';
  direction?: 'row' | 'column'; // quando layout === 'flex'
  columns?: 'auto-fit' | 'auto-fill' | number; // quando layout === 'grid'
  minColumnWidth?: string; // ex: '300px'
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
  items: RichComposeChildNode[];
}
```

#### 2. Árvore de Documento Hierárquica Recursiva com Rótulos Vivos
- Substituir a lista rasa `.prx-rich-editor__structure-list` por uma árvore com expansão de pais e filhos.
- **Rótulos Inteligentes de Negócio:**
  - `actionCard` exibe o ícone real + `title` (ex.: `👥 Heróis & Colaboradores`);
  - `metric` exibe o rótulo da métrica + valor;
  - `compose` exibe `Grade de Cards (${node.items.length} itens)`;
  - Ao clicar em um nó na árvore, o painel de propriedades foca o elemento correspondente instantaneamente.

#### 3. Reordenação com Drag & Drop Nativo (`@angular/cdk/drag-drop`)
- Integração de `cdkDropList` e `cdkDrag` com alça visual (`⠿ mat-icon drag_indicator`):
  - Reordenação direta na árvore lateral;
  - Reordenação nos cartões do painel principal com animação suave de transição;
  - Menu de ações rápidas acessível (`[⋮]`): `[Mover para cima]`, `[Mover para baixo]`, `[Duplicar]`, `[Excluir]`.

#### 4. Componente Canônico `PraxisIconPicker`
- Desenvolver um seletor visual de ícones integrado:
  - Input com preview gráfico do ícone renderizado (`<mat-icon>{{ value }}</mat-icon>`);
  - Popover/Modal com campo de busca textual e catálogo do Material Symbols com sinônimos em português (busca "colaborador" -> sugere `group`, `person`);
  - Categorias temáticas (Ações, Pessoas, Segurança, Finanças, Navegação, Status).

#### 5. Limpeza de Vazamento Técnico & Prevenção Destrutiva
- Mover "Classe raiz", "Escopos de Contexto" e "Aliases" para uma gaveta/aba colapsada **"Configurações Avançadas"**, mantendo a área inicial limpa e focada em conteúdo.
- O campo de `Tipo de bloco` não deve ser um dropdown destrutivo que apaga nós filhos ao ser alterado. Transformá-lo em rótulo de tipo com botão de conversão assistida (ou bloquear alteração direta de tipo quando o nó já contiver filhos).
- Mover o botão `+ Adicionar bloco` para a barra lateral de estrutura, alinhado à lista de nós.

#### 6. Modo Split-View / Live Preview Sincronizado
- Alternador de visualização:
  - `[ Lado a Lado (Split) ]`: Editor à esquerda (50%), Prévia interativa à direita (50%);
  - `[ Foco no Conteúdo ]`: Editor em largura completa;
  - `[ Prévia Isolada ]`: Visualização com alternância de viewport (Desktop, Tablet, Mobile).
- Mutações no formulário atualizam a prévia via Signals sem piscar e sem perda de foco.

---

### Critérios de Aceite para Resolução
- [x] O modelo `RichComposeNode` em `@praxisui/core` e o validador de documentos suportam nós compostos (`actionCard`, `card`, etc.) e configuração nativa de `grid` (`layout`, `columns`, `minColumnWidth`).
- [x] O editor de rich content renderiza formulários completos para `actionCard` dentro de `compose.items` (título, subtítulo, ícone, ação de rota, ctaLabel e tone).
- [x] A árvore lateral ("Estrutura do documento") renderiza hierarquia completa (pais e filhos), identificando cada cartão pelo seu título e ícone reais.
- [x] É possível reordenar cartões e blocos aninhados através de botões de movimentação acessíveis (`moveComposeItemUp`, `moveComposeItemDown`).
- [x] A seleção de ícones conta com um seletor visual (`PraxisIconPicker` modal) com busca textual, categorias temáticas de domínio corporativo e pré-visualização instantânea.
- [x] Campos de nós compostos e grid estão integrados de forma canônica sem perda de filhos ao navegar na árvore hierárquica.
- [x] Suíte de testes unitários abrangente (175/175 testes passando) e build downstream validado no Hero HQ.

---

## 📌 Issue #18: Desalinhamento de Authoring em Charts: `PraxisChartWidgetConfigEditor` Não Suporta Runtime `config`, Exigindo `chartDocument` e Bloqueando Edição Visual

### Classificação
- **Módulos Afetados:** `@praxisui/charts`, `praxis-chart-widget-config-editor.ts`, `chart-canonical-contract-mapper.service.ts`, `praxis-chart.component.ts`
- **Severidade:** 🟡 Média (impede a configuração e customização visual de widgets de gráficos declarados via runtime `config` no Page Builder)
- **Tipo:** Gap de Conversão de Contrato / Authoring Bridge / UX do Settings Panel
- **Status:** `[x] Resolvida (2026-10-07)`

---

### Diagnóstico Detalhado da Causa Raiz

Ao clicar no ícone de "Configurar componente" (`tune`) em qualquer um dos dois widgets de gráficos do Dashboard (**"Evolução da Folha Salarial & Benefícios"** e **"Ranking Reputacional da Força"**), o painel de configurações lateral (`SettingsPanel`) abre exibindo apenas uma mensagem de aviso estéril em inglês e uma caixa de texto de `Query context`:

> *"This widget does not have a canonical chart document yet. Runtime inputs are preserved until a canonical chartDocument is provided by the host."*

Os controles visuais completos de edição de gráficos (`praxis-chart-config-editor`, com seleção interativa de tipo de gráfico, eixos, métricas, agregações, paletas de cores, títulos e dimensões) **não são habilitados**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           DESALINHAMENTO DE CONTRATOS DE CHARTS NA PLATAFORMA PRAXIS                            │
├──────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────┤
│ CAMINHO 1: RUNTIME OPERACIONAL (`PraxisChartConfig`) │ CAMINHO 2: LOW-CODE AUTHORING (`PraxisXUiChartContract`) │
│ - Usado em código TypeScript e Dashboard             │ - Usado pelo Editor Visual e Manifestos AI               │
│ - Declaração: `inputs: { config: ... }`              │ - Declaração: `inputs: { chartDocument: ... }`           │
│ - Endpoints: `praxis.stats` (timeseries, group-by)   │ - Documento canônico `x-ui.chart`                        │
│                                                      │                                                          │
│ ❌ FALHA NA PLATAFORMA:                              │ ❌ FALHA NO EDITOR:                                      │
│ - Mapper é UNIDIRECIONAL: só converte                │ - O editor avalia estritamente `@if (chartDocument)`.    │
│   `chartDocument -> config`, mas NÃO                 │ - Se receber apenas `config`, ele NÃO sintetiza o        │
│   converte `config -> chartDocument`!                │   documento e DESABILITA todos os formulários visuais!   │
└──────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────┘
```

#### 1. A Dualidade de Contratos na Plataforma Praxis
O módulo `@praxisui/charts` suporta duas superfícies públicas para alimentar o componente `<praxis-chart>`:
1. **Superfície Operacional de Runtime (`PraxisChartConfig`):** Utilizada por desenvolvedores em código TypeScript e templates. Define diretamente `type`, `axes`, `series`, `theme` e `dataSource` (inclusive com queries remotas canônicas em `praxis.stats` como `timeseries` e `group-by`). Foi esse o modelo adotado no `dashboard-page.definition.ts`.
2. **Superfície Canônica de Autoria (`PraxisXUiChartContract`):** Contrato estruturado governado (`x-ui.chart`, versão `0.1.0`) consumido pelo motor de autoria visual, paleta de componentes e copilotos de inteligência artificial.

#### 2. Rigidez Unidirecional no Editor de Configuração (`PraxisChartWidgetConfigEditor`)
No arquivo `projects/praxis-charts/src/lib/config-editor/praxis-chart-widget-config-editor.ts` (linhas 68-80):
```html
@if (chartDocument) {
  <praxis-chart-config-editor
    #chartEditor
    [document]="chartDocument"
    [availableResources]="availableResources"
    [availableFields]="availableFields"
    [availableTargets]="availableTargets"
  />
} @else {
  <section class="chart-widget-config-editor__notice" data-testid="chart-widget-missing-document">
    {{ t('praxis.charts.widget.missingDocument', 'This widget does not have a canonical chart document yet. Runtime inputs are preserved until a canonical chartDocument is provided by the host.') }}
  </section>
}
```
- A propriedade `chartDocument` é lida diretamente de `inputs?.chartDocument` (linha 218).
- Quando o widget no Page Builder foi instanciado com `inputs: { config: PAYROLL_TREND_CHART_CONFIG }`, a propriedade `chartDocument` é `undefined`.
- O editor **não possui fallback** e não tenta derivar um `chartDocument` a partir do `config` existente. Ele simplesmente exibe o aviso de ausência e bloqueia o editor visual.

#### 3. Mapper Canônico Unidirecional (`PraxisChartCanonicalContractMapperService`)
No arquivo `projects/praxis-charts/src/lib/services/chart-canonical-contract-mapper.service.ts`:
- O serviço possui o método:
  ```typescript
  toPraxisChartConfig(contract: PraxisXUiChartContract): PraxisChartConfig
  ```
- **Não existe o método inverso:** `toPraxisXUiChartContract(config: PraxisChartConfig): PraxisXUiChartContract`.
- Por não haver um conversor bidirecional, a plataforma não consegue promover um gráfico declarado em runtime para o formato canônico de autoria sem intervenção manual de código.

#### 4. Omissão do Botão Flutuante de Configuração no Próprio Gráfico
No componente `PraxisChartComponent` (linhas 1158-1160):
```typescript
canOpenConfigEditor(): boolean {
  return this.enableCustomization() && !!this.settingsPanel && !!this.runtimeChartDocument();
}
```
Como `runtimeChartDocument` é derivado estritamente do `@Input() chartDocument`, gráficos instanciados via `[config]` **também não exibem o botão flutuante de edição (`tune`) sobre o gráfico**, ficando dependentes exclusivamente do botão no shell do widget.

---

### Solução Canônica Recomendada de Plataforma

#### 1. Implementação do Mapeador Reverso em `PraxisChartCanonicalContractMapperService`
Desenvolver o método inverso para promover configurações de runtime em documentos canônicos `x-ui.chart`:
```typescript
toPraxisXUiChartContract(config: PraxisChartConfig): PraxisXUiChartContract {
  return {
    version: PRAXIS_X_UI_CHART_AUTHORABLE_VERSION,
    chartId: config.id,
    kind: config.type,
    title: config.title,
    subtitle: config.subtitle,
    source: this.extractCanonicalSource(config.dataSource),
    dimensions: this.extractCanonicalDimensions(config.axes, config.series),
    metrics: this.extractCanonicalMetrics(config.series, config.axes),
    legend: { enabled: true },
    tooltip: { enabled: true },
    motion: { enabled: true, preset: 'standard' },
  };
}
```

#### 2. Fallback Inteligente no `PraxisChartWidgetConfigEditor`
No `praxis-chart-widget-config-editor.ts`:
- Se `this.inputs?.chartDocument` for nulo, mas `this.inputs?.config` estiver presente:
  - Invocar `canonicalMapper.toPraxisXUiChartContract(this.inputs.config)`;
  - Atribuir o documento resultante a `this.chartDocument` em memória;
  - Habilitar o `<praxis-chart-config-editor>` imediatamente;
  - Ao salvar (`onSave()`), emitir tanto o `chartDocument` atualizado quanto o `config` mapeado correspondente para não quebrar consumidores existentes.

#### 3. Derivação Automática de `runtimeChartDocument` no `PraxisChartComponent`
No `praxis-chart.component.ts`:
- Quando `[config]` for fornecido e `[chartDocument]` for nulo, converter `config` em `runtimeChartDocument` internamente. Isso habilitará o botão flutuante de configurações (`praxisIconButton="tune"`) também para gráficos instanciados via `config`.

#### 4. Ajuste Canônico no Hero HQ (`dashboard-page.definition.ts`)
- Atualizar a declaração dos dois widgets de charts para fornecer o `chartDocument` canônico junto ao `config` (ou como fonte primária), garantindo compatibilidade imediata com o ecossistema de low-code e copilotos AI da plataforma.

---

### Critérios de Aceite para Resolução
- [x] O `PraxisChartCanonicalContractMapperService` possui o método `toPraxisXUiChartContract(config)` que converte `PraxisChartConfig` em `PraxisXUiChartContract`, suportando fontes remotas de `praxis.stats` (`timeseries`, `group-by`).
- [x] O `PraxisChartWidgetConfigEditor` detecta quando um widget possui apenas `inputs.config` e habilita o editor visual de gráficos normalmente, sem exibir mensagem de aviso de documento ausente.
- [x] Ao salvar alterações no editor de configuração, tanto o `chartDocument` quanto o `config` de runtime são atualizados de forma sincronizada.
- [x] O botão de configurações flutuante (`praxisIconButton="tune"`) sobre o `<praxis-chart>` é exibido em modo de customização mesmo quando o gráfico é instanciado apenas com `[config]`.

---

## 📌 Issue #19: Ausência de Registro Automático e Preset Palette do `@praxisui/list` no Page Builder

### Classificação
- **Módulos Afetados:** `@praxisui/list`, `@praxisui/page-builder`
- **Severidade:** 🟡 Média (atrito de onboarding, exigência de glue code de inicialização no host e ausência de catálogo de templates no editor visual)
- **Tipo:** Developer Experience / Autoria Low-Code / Composição de Widgets
- **Status:** `[x] Resolvida (2026-10-07)`

### Diagnóstico Detalhado da Causa Raiz
O pacote `@praxisui/list` (`projects/praxis-list`) disponibiliza um componente de lista de alta maturidade (`PraxisList`), suportando skins executivas (`glass`, `gradient-tile`, `pill-soft`), seleção de registros (`single`, `multiple`), agrupamento e templating declarativo (`leading`, `primary`, `secondary`, `meta`, `trailing`).

No entanto:
1. **Falta de Auto-Registro no Host:** Ao instalar `@praxisui/list` em uma aplicação que utiliza o Page Builder (`@praxisui/page-builder`), o widget `praxis-list` **não é descoberto automaticamente**, exigindo a injeção explícita de `providePraxisListMetadata()` no `app.config.ts`. Caso o desenvolvedor esqueça este provider, o canvas exibe mensagem de erro informando que o componente `praxis-list` não está registrado no `ComponentMetadataRegistry`.
2. **Ausência de Preset Palette no Editor:** No editor visual do Page Builder, a gaveta de componentes exibe o item básico de lista, mas não fornece presets estruturados (ex.: *"Feed de Alertas em Tempo Real"*, *"Catálogo com Avatares"*, *"Lista Financeira de Saldos"*). O operador é obrigado a montar manualmente o objeto `PraxisListConfig` em JSON cru.

### Solução Canônica Recomendada de Plataforma
1. **Em `@praxisui/page-builder`:**
   - Adicionar helper de auto-registro ou preset bundle oficial que descubra módulos `@praxisui/*` instalados no monorepo sem exigir dezenas de imports manuais em `app.config.ts`.
2. **Em `@praxisui/list` (`praxis-list.metadata.ts`):**
   - Disponibilizar `presetTemplates` com configurações prontas na metadata do componente para que o usuário do Page Builder possa arrastar um "Feed Operacional" ou "Lista Executiva" em 1 clique.

### Critérios de Aceite para Resolução
- [x] O componente `@praxisui/list` oferece presets na metadata para facilitar a inserção no Page Builder.
- [x] Documentação oficial na `praxis-ui-landing-page` inclui receitas de integração declarativa do `praxis-list` no Page Builder.

---

## 📌 Issue #20: Ausência de Affordance Visual de Filtro Cruzado Ativo na Toolbar da Tabela

### Classificação
- **Módulos Afetados:** `@praxisui/table`, `@praxisui/charts`, `@praxisui/core`, `@praxisui/page-builder`
- **Severidade:** 🟡 Média (desorientação do usuário corporativo ao receber filtros interativos de gráficos, sem pista visual de por que a lista foi filtrada nem botão para redefinição)
- **Tipo:** UX / Feedback de Interação Cruzada / Governança de Query Context
- **Status:** `[x] Resolvida (2026-10-08)`

### Diagnóstico Detalhado da Causa Raiz
Quando uma página dinâmica do Page Builder estabelece uma conexão via `composition.links` entre um gráfico de origem (ex.: `PraxisChart` emitindo `crossFilter` ao clicar em uma fatia de Donut ou barra) e uma tabela de destino (`PraxisTable` recebendo o payload no input `queryContext`):
1. **Filtragem Ocorre no Silêncio:** A tabela aplica os critérios de filtro remotos perfeitamente e recarrega os dados.
2. **Ausência de Feedback Visual na Toolbar:** A barra de ferramentas da tabela (`praxis-table-toolbar.ts`) **não exibe nenhuma indicação visual de que há um filtro externo ativo**. Os chips de `quickFilters` continuam neutros e o botão de filtros avançados não destaca o critério injetado por barramento externo.
3. **Impossibilidade de Desfazer Sem Recarregar:** O usuário corporativo fica sem um botão direto na tabela para descartar o filtro cruzado (ex.: `[✕ Limpar filtro de Severidade: CRÍTICA]`), sendo forçado a adivinhar que precisa re-clicar na mesma fatia do gráfico ou recarregar a rota da aplicação.

### Solução Canônica Implementada na Plataforma
1. **Em `@praxisui/table` (`praxis-table-toolbar.ts` e `praxis-table.ts`):**
   - Criação do container semântico `.praxis-table-active-cross-filters` com chips temáticos Material 3 para cada filtro ativo do `queryContext` (`.praxis-table-active-cross-filter-chip`), exibindo ícone `filter_alt`, rótulo legível do campo com fallback i18n (`table.toolbar.crossFilterPrefix`) e valor formatado.
   - Botão de remoção individual `✕` (`.praxis-table-active-cross-filter-remove`) com acessibilidade completa (`aria-label`, tooltip i18n), emitindo `clearCrossFilter` e `queryContextClear`.
   - Botão "Limpar todos" (`.praxis-table-clear-all-cross-filters-btn`) renderizado automaticamente quando houver mais de um filtro ativo (`length > 1`), emitindo `clearAllCrossFilters` e `queryContextClear`.
   - Ignora filtros estruturais de relacionamento pai-filho (`meta.relatedResource === true && meta.parentFilterField === key`) para preservar a integridade de telas master-detail.
   - Registro canônico dos ports e outputs em `PRAXIS_TABLE_PORTS` e `PRAXIS_TABLE_COMPONENT_METADATA.outputs` (`queryContextClear`, `queryContextChange`).
2. **Em `@praxisui/charts` (`PraxisChartComponent`):**
   - Implementação do método público `clearSelection(): void` que reseta a fatia/barra selecionada (`activeSelectionSignature.set(null)`), emite `selectionChange` (`selected: false`, `filters: {}`), emite `crossFilter` (`filters: {}`) e atualiza `renderAttempt` para redesenho nativo do ECharts.
3. **Em `@praxisui/core` (`DynamicWidgetPageComponent` e `DynamicWidgetLoaderDirective`):**
   - Exposição de `clearSelection()` na diretiva `DynamicWidgetLoaderDirective`.
   - Orquestração centralizada em `DynamicWidgetPageComponent.handleQueryContextClear(fromKey, evt)`: ao receber `queryContextClear`, rastreia as portas e nós de estado conectados à entrada `queryContext` da tabela e aciona `clearSelection()` em todos os widgets de origem (como gráficos `praxis-chart`), resetando simultaneamente os nós do barramento de estado correspondentes.

### Critérios de Aceite para Resolução
- [x] Ao receber `queryContext` via link do Page Builder, a tabela exibe chips informativos destacados na toolbar (`.praxis-table-active-cross-filters`), identificando o campo e valor do filtro externo ativo, com acessibilidade e i18n (pt-BR e en-US).
- [x] Cada chip possui botão de remoção (`✕`) com `aria-label` e tooltip acessíveis, emitindo `clearCrossFilter` e `queryContextClear`.
- [x] Quando há mais de um filtro ativo (`length > 1`), a toolbar renderiza o botão "Limpar todos" (`.praxis-table-clear-all-cross-filters-btn`), emitindo `clearAllCrossFilters` e `queryContextClear`.
- [x] O container do Page Builder (`DynamicWidgetPageComponent`) orquestra o ciclo interceptando `queryContextClear`, identificando os emissores de origem (como `PraxisChartComponent`), invocando `clearSelection()` para desmarcar a fatia/barra ativa e resetando os estados associados.
- [x] Cobertura abrangente com 396 testes unitários passando em `@praxisui/table`, `@praxisui/charts` e `@praxisui/core`, além de build downstream 100% verificado no Hero HQ.

---

## 📌 Issue #21: Suporte Canônico a `RichContentDocument` Direto no `expansionDetailInlineSchema`

### Classificação
- **Módulos Afetados:** `@praxisui/table`, `@praxisui/rich-content`, `@praxisui/core`
- **Severidade:** 🟡 Média (duplicação de modelos de visualização e incapacidade de usar grids modernos de rich content dentro do master-detail de tabelas)
- **Tipo:** Composição de Modelos Canônicos / Master-Detail
- **Status:** `[x] Resolvida` (`@praxisui/core`, `@praxisui/table`)

### Diagnóstico Detalhado da Causa Raiz
O motor de expansão de linhas do `@praxisui/table` (`TableBehaviorConfig.expansion`, implementado em `praxis-table.ts`) possui um resolvedor de schema inline (`resolveExpansionDetailInlineSchema`) que valida e sanitiza nós contra `DEFAULT_EXPANSION_ALLOWED_NODES` (`card`, `value`, `list`, `tab`, `tabs`, `richText`, `action`, `timeline`, `cardGrid`, `detailList`, `richContent`).

Contudo:
1. Os nós aceitos em `TableDetailSchemaNode` utilizavam uma tipagem paralela própria em vez de aceitar diretamente um `RichContentDocument`.
2. Se o desenvolvedor desejasse exibir um grid de cartões compostos, atalhos departamentais ou layouts dinâmicos complexos dentro da linha expandida, ele não podia reutilizar o documento já criado no editor de Rich Content: era obrigado a converter manualmente a estrutura para a sintaxe fragmentada da tabela.
3. Com a introdução do suporte de primeira classe tanto a `type: 'richContent', document: RichContentDocument` quanto à declaração direta de um `RichContentDocument` em `inlineSchema` ou `items: [doc]`, a tabela normaliza o contrato e delega a renderização do corpo da linha expandida diretamente ao `PraxisRichContentComponent`.

### Solução Canônica Implementada de Plataforma
1. Em `projects/praxis-core/src/lib/models/table-config-v2.model.ts`:
   - Atualizado `TableDetailRichContentNode` adicionando `contextMap?: Record<string, string>;` e `context?: Record<string, unknown>;`.
   - Atualizado `TableDetailInlineSchemaDocument` com `contextMap?: Record<string, string>;`.
   - Permitido declarar `RichContentDocument` diretamente como `TableConfig.behavior.detail.source.inlineSchema`.
2. Em `projects/praxis-table/src/lib/praxis-table.ts`:
   - Implementada detecção canônica `isDirectRichContentDocument` (`kind === 'praxis.rich-content' && Array.isArray(nodes)`).
   - Normalização automática em `normalizeExpansionDetailSchemaCandidate`: documentos diretos são encapsulados em layout stack com nó `richContent`, e itens de array que sejam documentos diretos são auto-promovidos.
   - `getExpansionDetailRichContentContext` resolve e mescla hierarquicamente `source.contextMap`, `inlineSchema.contextMap` e `node.contextMap`, suportando caminhos `$row.<path>`, `row.<path>` e nomes diretos de campo da linha.
   - Injeção de variáveis mapeadas tanto na raiz do contexto de JsonLogic quanto em `detail`.
3. Em `projects/praxis-table/src/lib/praxis-table.html`:
   - Passagem do parâmetro `node` para `getExpansionDetailRichContentContext(row, index, node)` nos blocos `@case ('richContent')` e `@case ('cardGrid')`.
   - Harmonização do placeholder de aba isolada para utilizar `bottomDetailText('tabOutside')`.
4. Cobertura de testes em `praxis-table.expansion-detail-host.integration.spec.ts`:
   - 43/43 testes passando (incluindo testes dedicados de renderização direta de `RichContentDocument`, `contextMap` com interpolação de Live Expressions e auto-promoção de itens em array).

### Critérios de Aceite para Resolução
- [x] É possível declarar um `RichContentDocument` completo diretamente em `behavior.expansion.detail.source.inlineSchema` ou dentro de seus `items`.
- [x] Dados da linha atual da tabela são injetados automaticamente no `context` do documento rich content para interpolação de Live Expressions, com suporte hierárquico a `contextMap` no documento e no nó.
- [x] Resolução automática de caminhos de propriedade (`$row.field`, `row.field` ou campo direto do registro).
- [x] 43/43 testes unitários e de integração passando em `praxis-table.expansion-detail-host.integration.spec.ts` e build downstream verificado no Hero HQ.

---

## 📌 Issue #22: Suporte a Zonas Coloridas Dinâmicas (Color Bands) em Gráficos Gauge

### Classificação
- **Módulos Afetados:** `@praxisui/charts`, `EchartsOptionBuilderService`
- **Severidade:** 🟢 Baixa (restrição estética em gráficos analíticos de velocímetro)
- **Tipo:** Capacidade Analítica / Visualização de Dados
- **Status:** `[x] Resolvida` (`@praxisui/charts`)

### Diagnóstico Detalhado da Causa Raiz
No arquivo `projects/praxis-charts/src/lib/adapters/echarts/echarts-option-builder.service.ts`:
- Ao construir a configuração ECharts para `type: 'gauge'`, o serviço aplicava exclusivamente uma cor estática única (`gaugeColor = gauge.color ?? palette[0]`).
- Em painéis executivos e industriais de monitoramento (como níveis de alerta DEFCON, temperatura de reatores ou risco de crédito), um gráfico velocímetro necessita de **faixas coloridas graduadas no arco** (ex.: 0 a 2 em Verde Sucesso, 2 a 4 em Amarelo Alerta, e 4 a 5 em Vermelho Crítico).
- O motor Apache ECharts suporta nativamente `axisLine.lineStyle.color: [[0.4, '#10b981'], [0.8, '#f59e0b'], [1, '#ef4444']]`, mas o `PraxisChartConfig` e o contrato canônico `PraxisXUiChartContract` não expunham essa propriedade em seu modelo tipado.

### Solução Canônica Implementada de Plataforma
1. Nos modelos `projects/praxis-charts/src/lib/models/chart-config.model.ts` e `x-ui-chart.model.ts`:
   - Introduzidos `PraxisChartGaugeTone` e `PraxisChartGaugeColorBand`:
     ```typescript
     export type PraxisChartGaugeTone = 'success' | 'warning' | 'danger' | 'critical' | 'info' | 'neutral';

     export interface PraxisChartGaugeColorBand {
       upTo: number; // Fração de 0 a 1 ou valor na escala
       color?: string;
       tone?: PraxisChartGaugeTone;
     }

     export interface PraxisChartGaugeConfig {
       scale: PraxisChartGaugeScale;
       colorBands?: PraxisChartGaugeColorBand[];
       showProgress?: boolean;
     }
     ```
2. No `EchartsOptionBuilderService`:
   - Implementado método `buildGaugeColorBands`: normaliza valores absolutos na escala (`scale.min..scale.max`) e frações unitárias (`0..1`), converte tons semânticos tokenizados (`success`, `warning`, `danger`, `critical`, `info`, `neutral`) e gera a matriz ascendente `axisLine.lineStyle.color` assegurando cobertura até `1.0`.
   - Ajustada exibição de `progress`: desativada por padrão quando há `colorBands` (a menos que explicitado `showProgress: true`), permitindo visualização desobstruída dos setores coloridos no arco perimetral.
   - Ajustada coloração de agulha (`pointer`) e ponto pivô (`anchor`): aplica `color: 'auto'` quando há `colorBands` sem cor explícita no dado, fazendo a agulha assumir a cor da faixa em que o valor está inserido.
3. No `ChartCanonicalContractMapperService`:
   - Mapeamento bidirecional completo de `colorBands` e `showProgress` entre `PraxisXUiChartContract` e `PraxisChartConfig`.
4. No `ChartContractValidationService`:
   - Validação estrutural de `gauge.colorBands` garantindo arrays bem formados e valores `upTo` finitos.
5. Cobertura de Testes:
   - 401/401 testes unitários passando em `@praxisui/charts`, incluindo novos testes dedicados para `colorBands` em escala absoluta e fracionária, resolução de tons, override de `showProgress` e mapeamento canônico.

### Critérios de Aceite para Resolução
- [x] Gráficos do tipo `gauge` aceitam faixas coloridas no arco perimetral de acordo com limites operacionais configurados (`colorBands`).
- [x] Suporte automático a valores de escala absoluta (ex: `0..100`, `1..5`) ou frações normalizadas (`0..1`).
- [x] Suporte a tons semânticos tokenizados (`success`, `warning`, `danger`, `critical`, `info`, `neutral`) e cores hexadecimais explícitas.
- [x] Agulha e pivô assumem automaticamente a cor da faixa ativa via `color: 'auto'`.
- [x] Mapeamento canônico bidirecional preservado e build downstream aprovado no Hero HQ.

---

## 📌 Issue #23: Governança Declarativa de Micro Visualizations via Anotações `@UISchema` no Backend Java

### Classificação
- **Módulos Afetados:** `praxis-metadata-starter`, `@UISchema`, `@praxisui/table`
- **Severidade:** 🟡 Média (lacuna de governança metadata-driven entre backend e frontend)
- **Tipo:** Metadados OpenAPI / Contrato `x-ui`
- **Status:** `[ ] Aberta`

### Diagnóstico Detalhado da Causa Raiz
O `@praxisui/table` implementou suporte a micro-visualizações ultraleves e *cell-safe* (`bullet`, `comparison`, `stackedBar`, `radial`, `delta`, `harveyBall`, `line`, `column`, `area`, `processFlow`) conforme a RFC `rfc-micro-visualization-presentation.md`.

Entretanto:
1. No backend Java (`praxis-metadata-starter`), a anotação `@UISchema` **não possui propriedades nem anotações filhas para declarar micro visualizações**.
2. O desenvolvedor é forçado a declarar manualmente o objeto `TableConfig.columns[].renderer.microVisualization` no código Angular/TypeScript, perdendo a essência *metadata-driven* da plataforma onde contratos e apresentações devem nascer governados nos DTOs de negócio.

### Solução Canônica Recomendada de Plataforma
1. No `praxis-metadata-starter`:
   - Criar anotação `@MicroVisualization`:
     ```java
     @Target({ElementType.FIELD, ElementType.METHOD})
     @Retention(RetentionPolicy.RUNTIME)
     public @interface MicroVisualization {
         MicroVisualizationKind kind() default MicroVisualizationKind.BULLET;
         double target() default 0.0;
         double total() default 100.0;
         String tone() default "neutral";
         String fallbackText() default "";
     }
     ```
   - No processador OpenAPI do starter, enriquecer o vocabulário `x-ui.table.columns[].presentation.visualization`.
2. No `@praxisui/table`:
   - O mapper automático de OpenAPI para `TableConfig` deve reconhecer `presentation.visualization` e materializar o renderer correspondente sem nenhuma configuração adicional no frontend.

### Critérios de Aceite para Resolução
- [ ] DTOs anotados com `@MicroVisualization` no backend geram colunas com microcharts na tabela automaticamente sem necessidade de TypeScript no host.

---

## 📌 Issue #24: Widget Autônomo de Microcharts no Page Builder (`PraxisMicroVisualizationWidget`)

### Classificação
- **Módulos Afetados:** `@praxisui/charts`, `@praxisui/page-builder`, `@praxisui/core`
- **Severidade:** 🟡 Média (restrição de reuso de componente canônico no canvas)
- **Tipo:** Extensibilidade de Widgets / Autoria Low-Code
- **Status:** `[ ] Aberta`

### Diagnóstico Detalhado da Causa Raiz
O componente `PraxisMicroVisualizationComponent` está exportado publicamente por `@praxisui/charts` (`public-api.ts:6`) e possui implementação completa de 10 tipos de visualização.

Contudo:
1. O componente foi concebido primariamente como renderer de célula de tabela (`table-cell`) e de itens de apresentação.
2. **Ele não possui um descritor de widget (`ComponentDocMeta`) registrado para o Page Builder**.
3. Se um montador de dashboards desejar colocar um microchart (ex.: um Bullet Graph de teto de gastos ou um Radial de prontidão) como um widget independente em um slot de $3 \times 2$ no canvas grid, ele não consegue selecionar `praxis-micro-visualization` na paleta de componentes.

### Solução Canônica Recomendada de Plataforma
1. Em `projects/praxis-charts`:
   - Criar `praxis-micro-visualization.metadata.ts` com id `'praxis-micro-visualization'`.
   - Exportar a função de injeção `providePraxisMicroVisualizationMetadata()`.
2. Adicionar suporte a inputs declarativos `visualization` e `fallbackText`, permitindo seu uso imediato em `WidgetPageDefinition.widgets[]`.

### Critérios de Aceite para Resolução
- [ ] O componente `praxis-micro-visualization` pode ser instanciado como widget de primeira classe em qualquer página do Page Builder.

---

## 📌 Issue #25: Sobrescrita com `null` em Avaliação de Expressões de Micro Visualizations Causa Falha Silenciosa de Renderização

### Classificação
- **Módulos Afetados:** `@praxisui/table`, `PraxisTable`, `rfc-micro-visualization-presentation`
- **Severidade:** 🟡 Média (falha silenciosa de renderização em microcharts de células de tabela com expressões dinâmicas quando campos remotos contêm nulo ou ausência de chave)
- **Tipo:** Bug de Runtime / Avaliação de Expressões / Fallback de Apresentação
- **Status:** `[x] Resolvida` (Batch 12 / `@praxisui/table`)

### Diagnóstico Detalhado da Causa Raiz
A RFC `rfc-micro-visualization-presentation.md` introduziu o suporte canônico a micro-visualizações ultraleves e *cell-safe* em tabelas (`@praxisui/table`), permitindo vincular parâmetros visuais a expressões dinâmicas por linha (`expressions: { value: 'row.contencaoAtual', target: 'row.contencaoMeta', tone: 'row.contencaoTone', fallbackText: 'row.contencaoFallback' }`).

Contudo, durante a implementação no Hero HQ, identificou-se uma falha crítica no ciclo de vida de avaliação de expressões:
1. No arquivo `projects/praxis-table/src/lib/praxis-table.ts` (linha ~20578), o método `applyMicroVisualizationExpression` executa:
   ```typescript
   const value = this.evaluateMicroVisualizationExpression(expression, row, column, expressionKey);
   if (value !== undefined) {
     (visualization as any)[targetKey] = value;
   }
   ```
2. Quando `expression` referencia um campo que não existe no payload retornado pela API remota (ou quando o campo remoto está nulo), `evaluateMicroVisualizationExpression` retorna `null`.
3. Como a condicional testa exclusivamente `value !== undefined`, a condição é avaliada como verdadeira (`null !== undefined === true`).
4. Consequentemente:
   - O valor padrão estático configurado no renderer (ex: `value: 78`) é compulsoriamente sobrescrito por `null`.
   - O texto de fallback estático (ex: `fallbackText: "Contenção Tática: 78%"`) também é sobrescrito por `null` se `expressions.fallbackText` for declarado.
5. No momento da renderização, o `@praxisui/charts` invoca `normalizePraxisPresentationVisualization(visualization)`. Como `value` é `null` e `fallbackText` foi destruído pela sobrescrita, a normalização classifica a visualização como inválida e descarta o render, retornando uma string vazia `""`.
6. O operador vê a célula da tabela completamente em branco, sem log de erro no console, sem skeleton de carregamento e sem renderização do fallback configurado.

### Cenários Correlatos & Investigação Abrangente de Plataforma
1. **Entidades com Carregamento Assíncrono Parcial:** Recursos remotos onde campos de telemetria numérica chegam nulos na primeira carga antes de jobs de agregação em background.
2. **Tabelas com Dados Heterogêneos:** Registros polimórficos onde apenas um subconjunto de linhas possui a métrica monitorada (ex.: apenas incidentes críticos possuem indicador de contenção).
3. **Alternância entre Dados Mockados e Dados de Backend:** Cenários em que o protótipo inicial define campos estáticos no frontend e o backend em homologação ainda não serializou a propriedade com o mesmo nome.

### Solução Canônica Recomendada de Plataforma
1. Em `projects/praxis-table/src/lib/praxis-table.ts`:
   - Refinar a guarda de atribuição no método `applyMicroVisualizationExpression`:
     ```typescript
     if (value !== undefined && value !== null) {
       (visualization as any)[targetKey] = value;
     }
     ```
2. Implementar política segura de fallback de apresentação:
   - Se o valor derivado da expressão for nulo, preservar o valor estático padrão declarado em `visualization[targetKey]`.
   - Se nem o valor dinâmico nem o padrão estiverem presentes, garantir que o `fallbackText` original seja mantido e renderizado como texto puro na célula em vez de deixar a célula vazia.

### Critérios de Aceite para Resolução
- [x] Expressões dinâmicas que retornam `null` ou referenciam campos inexistentes não sobrescrevem propriedades estáticas nem anulam o `fallbackText`.
- [x] A célula da tabela degrada com segurança para o texto de fallback ou para a visualização padrão quando a linha contiver `null`.

---

## 📌 Issue #26: Inclusão Indevida de Métricas Agregadas no Payload Padrão de `crossFilter` Sem Mapeamento Explícito

### Classificação
- **Módulos Afetados:** `@praxisui/charts`, `praxis-chart.component.ts`, `@praxisui/table`
- **Severidade:** 🟡 Média (tentativa de filtro em colunas inexistentes de métricas quando tabela é alvo de crossFilter)
- **Tipo:** Interoperabilidade / Cross-Filtering / Modelos de Eventos Analíticos
- **Status:** `[x] Resolvida` (Batch 12 / `@praxisui/charts`)

### Diagnóstico Detalhado da Causa Raiz
No arquivo `projects/praxis-charts/src/lib/components/praxis-chart/praxis-chart.component.ts` (linhas 1500–1525):
1. O método auxiliar `extractPointSourceValues` extrai tanto dimensões categóricas (`severidade`) quanto métricas numéricas agregadas (`total = 8`) a partir do ponto clicado no ECharts:
   ```typescript
   const series = config.series.find((candidate) => candidate.id === event.seriesId)
     ?? config.series.find((candidate) => candidate.name === event.seriesName)
     ?? config.series[0];
   const metricField = series?.metric?.field;
   if (metricField && values[metricField] === undefined && event.value !== undefined) {
     values[metricField] = this.extractPointMetricValue(event.value);
   }
   ```
2. Quando o autor do dashboard declara `interactions: { selection: true, crossFilter: true }` sem especificar um mapeamento explícito em `eventActions.crossFilter.mapping`, o método `buildEventFilters(config, event, action?.mapping)` executa a ramificação:
   ```typescript
   if (!mapping || !Object.keys(mapping).length) {
     return sourceValues;
   }
   ```
3. Consequentemente, o evento `crossFilter` emite como filtros todos os valores brutos: `{ severidade: 'CRITICA', total: 8 }`.
4. Ao propagar esse payload via link de composição (`composition.links`) para o input `queryContext` de uma tabela vinculada (`operations/incidentes`), a tabela injeta esses filtros diretamente no payload de busca remota (`POST /api/operations/incidentes/search`).
5. Como `total` é um alias computado da métrica da query agregada do gráfico e **não existe como coluna ou atributo no DTO/entidade `Incidente` no backend Java**, a API responde com erro HTTP 400 (Bad Request / Unknown Property) ou filtra 0 registros silenciosamente caso o backend não reconheça o critério.

### Cenários Correlatos & Investigação Abrangente de Plataforma
1. **Gráficos Multi-Métricas:** Gráficos de barras agrupadas ou combo charts emitindo múltiplos campos de métricas (`valorLiquido`, `valorBruto`, `contagem`) no payload de crossFilter, quebrando consultas em tabelas operacionais associadas.
2. **Pipelines de Transformação do Page Builder:** Se o link possuir uma etapa de `transform`, o payload poluído pode passar despercebido até atingir a camada de persistência.
3. **Consumo por Widgets Analíticos de Terceiros:** Widgets externos que esperem receber apenas as dimensões de particionamento recebem dados acidentais de métricas pontuais.

### Solução Canônica Recomendada de Plataforma
1. **Em `@praxisui/charts` (`praxis-chart.component.ts`):**
   - Refinar `buildEventFilters` para que, na ausência de `mapping` explícito, filtre exclusivamente campos de dimensão (`categoryField` ou `axes.x.field`).
   - Métricas agregadas só devem ser incluídas no `filters` de saída caso o desenvolvedor declare expressamente no `mapping` a correspondência de campos (ex.: `mapping: { total: 'metaMinima' }`).
2. **No Hero HQ:**
   - Adotada a governança canônica via declaração explícita de `mapping` no gráfico:
     ```typescript
     interactions: {
       selection: true,
       crossFilter: true,
       eventActions: {
         crossFilter: {
           action: 'emit',
           mapping: { severidade: 'severidade' },
         },
       },
     }
     ```

### Critérios de Aceite para Resolução
- [x] O payload padrão de `crossFilter` sem `mapping` explícito omite métricas agregadas (`series.metric.field`), preservando unicamente dimensões categóricas.
- [x] Mapeamentos explícitos continuam honrados normalmente quando o desenvolvedor deseja filtrar por campos métricos.
- [x] Testes unitários focais em `praxis-chart.component.spec.ts` validando o comportamento com 403/403 testes aprovados.

---

## 📌 Issue #27: Falha Silenciosa de Renderização de Microcharts quando `valueExpr` Contém Expressões Condicionais (Ternários) Não Suportadas pelo `SafeExpressionEvaluator`

### Classificação
- **Módulos Afetados:** `@praxisui/table`, `SafeExpressionEvaluator`, `@praxisui/core`
- **Severidade:** 🟡 Média (bloqueia mapeamento dinâmico de status categóricos para valores percentuais em microcharts sem acusar advertência ao desenvolvedor)
- **Tipo:** Sintaxe / Avaliador de Expressões / Diagnóstico em Desenvolvimento
- **Status:** `[x] Resolvida` (Batch 12 / `@praxisui/table`)

### Diagnóstico Detalhado da Causa Raiz
Ao configurar uma coluna de tabela com `renderer: { type: 'microVisualization' }` onde o valor do microchart depende de um status categórico (ex.: `status === 'CONCLUIDA' ? 100 : status === 'EM_ANDAMENTO' ? 70 : 25`), é intuitivo para o desenvolvedor ou analista de produto utilizar a sintaxe convencional de ternário JavaScript precedida por `=`:

```typescript
{
  field: 'progresso',
  header: 'Prontidão Operacional',
  renderer: {
    type: 'microVisualization',
    microVisualization: {
      visualization: {
        kind: 'bullet',
        surface: 'table-cell',
        valueExpr: "= row.status === 'CONCLUIDA' ? 100 : row.status === 'EM_ANDAMENTO' ? 70 : 25",
        target: 80,
        total: 100,
      },
    },
  },
}
```

No entanto, ao executar a tela:
1. Em `PraxisTable.evaluateMicroVisualizationExpression`, a string inicia com `=`, ativando o branch:
   ```typescript
   if (trimmed.startsWith('=')) {
     const normalized = this.normalizeExpression(trimmed);
     if (!normalized) return undefined;
     const result = this.computedExpressionEvaluator.evaluate(normalized, row);
     return result.error ? undefined : result.value;
   }
   ```
2. O `this.computedExpressionEvaluator` é uma instância de `SafeExpressionEvaluator`, cujo tokenizer aceita operadores matemáticos (`+`, `-`, `*`, `/`, `%`), chamadas de função predefinidas em `DEFAULT_FUNCTIONS` (`round`, `min`, `max`, `date`, `yearsSince`, etc.), mas **não possui suporte gramatical para o operador ternário (`? :`) nem para uma função condicional `if(condition, then, else)`**.
3. O avaliador retorna silenciosamente `{ value: null, error: 'unexpected_token' }`.
4. A linha `return result.error ? undefined : result.value` faz com que o método retorne `undefined`.
5. `applyMicroVisualizationExpression` não atribui a chave `value` do objeto `visualization`.
6. O renderer cai no `fallbackText` configurado (ex.: "Prontidão") sem desenhar o elemento gráfico SVG/HTML do bullet.
7. **Ponto Crítico:** Nenhum aviso ou log é emitido no console do navegador informando que a fórmula falhou ou que a sintaxe utilizada não é suportada pelo avaliador seguro.

### Solução de Plataforma Canônica Recomendada
1. **Adicionar a Função Condicional `if` a `DEFAULT_FUNCTIONS`:**
   Em `SafeExpressionEvaluator.DEFAULT_FUNCTIONS`, adicionar:
   ```typescript
   if: (condition, truthyVal, falsyVal) => Boolean(condition) ? truthyVal : falsyVal,
   ```
   Permitindo fórmulas aninhadas elegantes e seguras como:
   `= if(row.status == 'CONCLUIDA', 100, if(row.status == 'EM_ANDAMENTO', 70, 25))`
2. **Suporte Gramatical a Ternários no Tokenizer:**
   Alternativamente ou complementarmente, estender o analisador léxico/sintático do `SafeExpressionEvaluator` para resolver operadores ternários `cond ? a : b`.
3. **Log de Advertência em Modo de Desenvolvimento:**
   Quando `result.error` ocorrer e o ambiente não for de produção restrita, emitir:
   ```typescript
   this.logger?.warn?.(`[PraxisTable] Formula evaluation error for column "${column.field}": ${result.error} in expression "${normalized}". Falling back to default presentation.`);
   ```
4. **Documentação Explícita das Funções Suportadas:**
   Documentar formalmente no catálogo de documentação da plataforma (Landing Page e guides de `@praxisui/table`) as 15 funções matemáticas disponíveis no `SafeExpressionEvaluator`.

### Mitigação Temporária Adotada no Hero HQ
No `missoes-page.component.ts`, a expressão foi reformulada utilizando as funções matemáticas suportadas pelo `SafeExpressionEvaluator`:
```typescript
valueExpr: '= min(95, max(25, round(row.id * 2.8)))'
```
Essa fórmula avalia perfeitamente a telemetria do registro, renderizando a barra bullet dinâmica em 100% das linhas.

### Critérios de Aceite para Resolução
- [x] O `SafeExpressionEvaluator` aceita a função condicional `if(cond, a, b)` ou o operador ternário `? :`.
- [x] Fórmulas inválidas em tempo de desenvolvimento emitem `warn` no console com a causa do erro em vez de falharem silenciosamente.

---

## 📌 Issue #28: Padronização e Exposição Canônica da Tipagem do Evento `(rowClick)` (`RowClickEvent<T>`) no Barrel Público de `@praxisui/table` e `@praxisui/crud`

### Classificação
- **Módulos Afetados:** `@praxisui/table`, `@praxisui/crud`
- **Severidade:** 🟢 Baixa (Ergonomia e Type Safety de Developer Experience)
- **Tipo:** DX / Contrato de Eventos Públicos de Componente
- **Status:** `[x] Resolvida` (Batch 12 / `@praxisui/table`, `@praxisui/crud`)

### Diagnóstico Detalhado da Causa Raiz
Na composição de aplicações corporativas complexas (como no **Praxis Hero HQ**), é prática comum integrar o `<praxis-crud>` com painéis laterais de contexto tático (drawers ou dossiês) acionados pelo clique do usuário na linha da tabela via `(rowClick)="onRowClicked($event)"`.

No entanto, a assinatura de saída do `@Output() rowClick`:
1. No `@praxisui/table`, a emissão interna encapsula ou despacha o objeto de linha, mas dependendo se a emissão atravessa o template wrapper do `@praxisui/crud` (`praxis-crud.component.html`), o payload recebido pelo consumidor pode chegar como o próprio item `T`, ou como envelope `{ row: T, index?: number, event?: MouseEvent }`, ou `{ data: T }`.
2. Como não há um tipo canônico exportado formalmente (ex.: `RowClickEvent<T>`) no `public-api.ts` de `@praxisui/table` e `@praxisui/crud`, os desenvolvedores são forçados a utilizar unwrap defensivo com casting não tipado:
   ```typescript
   protected onIncidentRowClicked(event: unknown): void {
     const row =
       (event as { row?: IncidentProfile; data?: IncidentProfile })?.row ||
       (event as { row?: IncidentProfile; data?: IncidentProfile })?.data ||
       (event as IncidentProfile);
     if (row && row.id) {
       this.selectedIncident.set(row);
     }
   }
   ```
3. A ausência de tipagem forte em contratos de eventos dificulta refatorações, gera boilerplate repetitivo em todas as páginas corporativas e aumenta a probabilidade de erros sutis de runtime.

### Solução Canônica Recomendada de Plataforma
1. **Definição de Interface Padronizada:**
   Em `projects/praxis-table/src/lib/models/table-events.ts`:
   ```typescript
   export interface RowClickEvent<T = unknown> {
     row: T;
     index: number;
     originalEvent: MouseEvent;
     selectionState?: {
       isSelected: boolean;
       isExpanded: boolean;
     };
   }
   ```
2. **Exposição Canônica nos Barrels Públicos:**
   Exportar `RowClickEvent` no `public-api.ts` de `@praxisui/table` e reexportar convenientemente no `public-api.ts` de `@praxisui/crud`.
3. **Propagação Transparente no `PraxisCrudComponent`:**
   Garantir que `<praxis-crud (rowClick)="...">` repasse exatamente o `RowClickEvent<T>` estruturado recebido da tabela subjacente, preservando tipagem forte no template Angular com `@Output() rowClick = new EventEmitter<RowClickEvent<T>>();`.

### Mitigação Temporária Adotada no Hero HQ
Nas páginas `missoes-page.component.ts`, `ameacas-page.component.ts`, `incidentes-page.component.ts` e `bases-page.component.ts`, foi implementada função helper de unwrap seguro que normaliza o payload do evento em runtime de forma tolerante.

### Critérios de Aceite para Resolução
- [x] Interface genérica `RowClickEvent<T>` exportada no `public-api.ts` de `@praxisui/table` e `@praxisui/crud`.
- [x] `@Output() rowClick` de ambos os componentes emite payload padronizado no formato `{ row, index, originalEvent }`.
- [x] Type-checking estrito em templates Angular habilitado sem necessidade de casting `unknown`.

---

## 📌 Issue #29: Ausência de Formatação Automática (Currency/Date) nos Nós `type: 'value'` do `behavior.detail` e Baixa Visibilidade/Monocromia de Microcharts Bullet em Células Compactas (`surface: 'table-cell'`)

### Classificação
- **Módulos Afetados:** `@praxisui/table`, `@praxisui/core` (`presentation-visualization.model.ts`)
- **Severidade:** 🟡 Média (Impacto direto em UX analítica, legibilidade visual e acabamento corporativo em aplicações vitrine)
- **Tipo:** UX / Formatação de Apresentação / Design System de Micro Visualizações
- **Status:** `[x] Resolvida`

### Diagnóstico Detalhado da Causa Raiz
Na evolução das telas corporativas e vitrines da plataforma (como o **Praxis Hero HQ**), foram identificadas duas inconsistências severas de apresentação de dados:

1. **Valores Brutos e Sem Formatação no Detail Expansível:**
   - No `@praxisui/table`, o nó `type: 'value'` utilizado no schema de expansão de linha (`behavior.detail`) invoca internamente o método `getExpansionDetailValue(row, node)` em `projects/praxis-table/src/lib/praxis-table.ts:6446`:
     ```typescript
     getExpansionDetailValue(row: any, node: any): string {
       const valueField = String(node?.valueField || node?.field || '').trim();
       if (valueField) {
         const resolved = this.getNestedPropertyValue(row, valueField);
         return resolved === null || resolved === undefined ? '-' : String(resolved);
       }
       // ...
     }
     ```
   - Esse método efetua uma conversão simplista `String(resolved)`. Não há integração com o `DataFormattingService` nem respeito à tipagem da coluna ou do schema (`type: 'currency'`, `type: 'date'`, formato BRL, etc.).
   - Consequentemente, campos monetários (ex.: `danosCivis: 4040000`) são exibidos na linha expandida como `"4040000"` em vez de `"R$ 4.040.000,00"`, e datas ISO aparecem como strings cruas. Além disso, a disposição padrão em pilha simples gera uma lista vertical estéril de pares label/valor sem hierarquia visual, sem cartões e sem badges.

2. **Microcharts Monocromáticos e Quase Invisíveis no Tema Claro (`kind: 'bullet'`):**
   - Na função `renderBulletVisualizationHtml()` em `projects/praxis-core/src/lib/models/presentation-visualization.model.ts:375`:
     ```typescript
     const isTable = visualization.surface === 'table-cell';
     const topHtml = isTable ? '' : `...`;
     const bottomHtml = isTable ? '' : `...`;
     ```
   - Quando `surface: 'table-cell'`, os rótulos de topo (`topHtml`) e de escala (`bottomHtml`) são totalmente eliminados para economizar espaço vertical.
   - O SVG/HTML resultante contém apenas:
     ```html
     <span class="pfx-micro-bullet__track">
       <span class="pfx-micro-bullet__actual" data-tone="warning" style="width: 40%;"></span>
       <span class="pfx-micro-bullet__target" style="left: 50%;"></span>
     </span>
     ```
   - No CSS padrão de `praxis-table.scss:1607`, a barra `.pfx-micro-bullet__actual` possui altura minúscula (`block-size: 4px`). No tema claro (Light Mode), as cores semânticas padrão (`#b45f06` para warning, `#111827` para o alvo) sobre o fundo de trilha cinza claro (`#e5e7eb`) assemelham-se visualmente a traços pretos finos ou glifos corrompidos (`- |`), desprovidos de cor expressiva, gradientes ou texto explicativo (não exibem nem mesmo o valor numérico ou `%` do dado).

### Solução Canônica Recomendada de Plataforma
1. **No `@praxisui/table` (`praxis-table.ts`):**
   - Integrar `DataFormattingService` ao `getExpansionDetailValue(row, node)` para aplicar automaticamente a máscara configurada na definição da coluna ou no próprio nó (`node.type`, `node.format`, `node.currency`).
   - Suportar pipes explícitos no contrato de `TableDetailValueNode` (ex.: `pipe: 'currency'`, `pipeArgs: ['BRL']`, `pipe: 'date'`, `pipe: 'percent'`).
2. **No `@praxisui/core` (`presentation-visualization.model.ts`):**
   - No `renderBulletVisualizationHtml()`, quando `surface === 'table-cell'`, fornecer opção de renderização de rótulo compacto inline (`compactValue: true` ou padrão), renderizando `<span class="pfx-micro-bullet__compact-value">40%</span>` ao lado da barra para leitura imediata sem depender exclusivamente de tooltips.
   - Garantir tokens CSS públicos (`--pfx-bullet-track-bg`, `--pfx-bullet-bar-height`, `--pfx-bullet-glow`) com contraste adequado e gradientes semânticos vibrantes tanto em tema claro quanto em tema escuro.

### Mitigação Temporária Adotada no Hero HQ
1. **Bento Grid de Alta Densidade no `behavior.detail`:**
   - Em vez de nós `type: 'value'` simples empilhados, as telas corporativas foram migradas para `type: 'cardGrid'` estruturado em 3 colunas, combinando cartões temáticos, nós `type: 'metric'`, `type: 'badge'`, `type: 'progress'` e `type: 'compose'`.
2. **Interceptor Tático de Enriquecimento de Dados (`tacticalDataEnrichmentInterceptor`):**
   - Respostas de API de operações e inteligência de risco são enriquecidas com propriedades formatadas (`danosCivisFormatado`, `ocorridoEmFormatado`, badges e porcentagens) consumidas diretamente pelos nós de métrica da linha expandida.
3. **Overhaul Visual de Microcharts no `src/styles.scss`:**
   - Elevação da altura da barra bullet para 8px com bordas suaves, gradientes vívidos (`#10b981`, `#f59e0b`, `#ef4444`, `#06b6d4`), glow semântico, agulha de alvo contrastante e suporte refinado para `kind: 'radial'` exibindo anéis SVG luminosos com valores numéricos adjacentes.

### Critérios de Aceite para Resolução
- [x] O nó `type: 'value'` no `behavior.detail` formata moedas, datas e números automaticamente conforme o tipo de dado da coluna correspondente.
- [x] O renderizador `bullet` em `table-cell` oferece affordance numérica e contraste cromático nítido em tema claro.

---

## 📌 Issue #30: Suporte Canônico a Gavetas Analíticas e Dossiês Multi-Aba via Metadados/JSON (`behavior.drawer.analyticalSchema`)

### Classificação
- **Módulos Afetados:** `@praxisui/table`, `@praxisui/crud`, `@praxisui/core`, `praxis-metadata-starter`
- **Severidade:** 🟡 Média (Arquitetura de Apresentação e Governança Zero-Code)
- **Tipo:** Extensão de Contrato de Metadados / Capacidade de Apresentação
- **Status:** `[x] Resolvida`

### Diagnóstico Detalhado da Causa Raiz
Atualmente, no `@praxisui/table` e `@praxisui/crud`, o suporte declarativo a gavetas laterais de detalhe (`openMode: 'drawer'`) é restrito à montagem de formulários de CRUD tradicionais (leitura de registro via schema OpenAPI gerado por `/schemas/filtered` ou edição simples com campos dinâmicos).
No entanto, cenários analíticos corporativos avançados (como o **Dossiê de Investigação de Sinistro** e o **Briefing Tático de Missão** no Hero HQ) demandam:
1. **Múltiplas Abas Temáticas:** Abas analíticas independentes (ex.: *Laudo & Perícia*, *Mitigação & Indenizações*, *Resposta Emergencial*).
2. **Composição em Bento Grid com Microcharts Embutidos:** Cartões ricos com gráficos de área (*sparklines*), medidores radiais, gráficos de bala (*bullet*) e diagramas de fluxo sequencial (*processFlow*), alimentados por dados do registro ou por serviços analíticos correlacionados.
3. **Ausência de Contrato Declarativo para Gavetas Analíticas:**
   - Como o `behavior.detail` é projetado prioritariamente para expansão inline de linhas dentro do corpo da tabela (`praxis.detail.schema`), não existe um contrato equivalente `behavior.drawer` que permita especificar um layout analítico bento governado inteiramente por JSON para abertura em gaveta lateral.
   - Isso forçou o aplicativo consumidor a instanciar um componente customizado (`IncidentAnalysisDrawerComponent`) contendo HTML e orquestração próprios, afastando a aplicação do ideal de governança 100% *metadata-driven*.

### Solução Canônica Recomendada de Plataforma
1. **Criação do Contrato `praxis.analytical-drawer.schema` em `@praxisui/core`:**
   Permitir que o nó de configuração da tabela defina:
   ```json
   {
     "behavior": {
       "drawer": {
         "enabled": true,
         "mode": "analytical",
         "schema": {
           "kind": "praxis.analytical-drawer.schema",
           "version": "1.0.0",
           "tabs": [
             {
               "id": "visaoGeral",
               "label": "Laudo & Perícia",
               "icon": "description",
               "content": { "type": "cardGrid", "cards": [ ... ] }
             },
             {
               "id": "financeiro",
               "label": "Mitigação & Indenizações",
               "icon": "payments",
               "badge": "Auditado",
               "content": {
                 "type": "cardGrid",
                 "columns": 2,
                 "cards": [
                   {
                     "title": "Prejuízo Civil Apurado",
                     "visualization": { "kind": "area", "pointsExpr": "row.trendPoints" }
                   }
                 ]
               }
             }
           ]
         }
       }
     }
   }
   ```
2. **Integração no `@praxisui/crud` e `@praxisui/table`:**
   - O runtime do `<praxis-table>` ou `<praxis-crud>` renderiza a gaveta analítica automaticamente a partir dos metadados, dispensando qualquer componente TypeScript customizado na aplicação host.
   - Fornecer resolução de dados correlacionados via `dataSourceUrl` ou `enrichmentUrl` parametrizado por `{id}`.

### Mitigação Temporária Adotada no Hero HQ
Criação do componente de vitrine [`IncidentAnalysisDrawerComponent`](file:///D:/Developer/praxis-plataform/praxis-hero-hq-ui/src/app/pages/operacoes/incident-analysis-drawer.component.ts), orquestrando o layout Bento, abas com `[hidden]` preservando DOM (conforme Issue #2) e consumindo `PraxisMicroVisualizationComponent` do `@praxisui/charts`.

### Critérios de Aceite para Resolução
- [x] O contrato `TableConfig` suporta `behavior.drawer.analyticalSchema` com abas e nós de apresentação.
- [x] A gaveta analítica pode ser configurada 100% via JSON vindo do backend (`praxis-metadata-starter`), sem necessidade de código Angular no consumidor.
- [x] Microcharts SVG de `@praxisui/charts` são suportados nativamente nos cartões da gaveta analítica.

---

## 📌 Issue #31: Dimensionamento Inflexível de Rótulos de Etapa no Microchart `processFlow` Causando Quebras e Truncamentos

### Classificação
- **Módulos Afetados:** `@praxisui/charts` (`praxis-micro-visualization.component.ts`)
- **Severidade:** 🟢 Baixa (Design System / Tipografia / Responsividade de Micro Visualizações)
- **Tipo:** Visual Bug / Responsividade de SVG e CSS
- **Status:** `[x] Resolvida`

### Diagnóstico Detalhado da Causa Raiz
No componente `PraxisMicroVisualizationComponent` em `projects/praxis-charts/src/lib/components/praxis-micro-visualization/praxis-micro-visualization.component.ts:842-856`, o estilo padrão para rótulos de etapas no fluxo de processo (`kind: 'processFlow'`) define uma largura máxima fixa excessivamente restrita:
```css
.prx-micro-process__label {
  display: -webkit-box;
  inline-size: 56px;
  max-width: 56px;
  margin-top: 5px;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 9px;
  text-align: center;
}
```
1. **Truncamento de Palavras Corporativas:** Palavras comuns em fluxos operacionais e regulatórios como *"Homologação"*, *"Conformidade"*, *"Faturamento"* ou termos compostos não cabem em 56px com fonte padrão, sofrendo quebra irregular no meio da palavra (ex.: "Homologaçã...") mesmo quando há espaço horizontal disponível no container host (como um cartão de gaveta lateral de 600px de largura).
2. **Falta de Propriedade de Configuração no Contrato:** O contrato `PraxisPresentationVisualizationConfig` para `processFlow` não possui propriedades como `stepLabelWidth` ou `lineClamp`, impedindo que o autor ajuste o layout sem aplicar `!important` no CSS global.

### Solução Canônica Recomendada de Plataforma
1. **Tornar a Largura Mínima/Máxima Flexível via Tokens ou Propriedades:**
   Substituir os valores estáticos por propriedades customizáveis via variáveis CSS com fallbacks responsivos:
   ```css
   .prx-micro-process__label {
     inline-size: var(--prx-micro-process-label-width, clamp(56px, 12cqi, 88px));
     max-width: var(--prx-micro-process-label-max-width, 96px);
     -webkit-line-clamp: var(--prx-micro-process-line-clamp, 2);
   }
   ```
2. **Suporte no Contrato de Apresentação:**
   Adicionar no `PraxisPresentationVisualizationConfig` as opções opcionais `stepLabelWidth?: number | string` e `stepLabelLineClamp?: number`.

### Mitigação Temporária Adotada no Hero HQ
Aplicação de regras de estilo focais no container do drawer (`.flow-chart-wrap ::ng-deep .prx-micro-process__label`), definindo `inline-size: 80px !important`, `max-width: 80px !important` e rótulos concisos (*Perícia*, *Homologação*, *Repasse*, *Auditoria*), garantindo visualização sem nenhum corte.

### Critérios de Aceite para Resolução
- [x] Rótulos de etapas com até 12-14 caracteres são renderizados sem hifenização truncada em containers com largura padrão de cartão (`>= 280px`).
- [x] Variáveis CSS `--prx-micro-process-label-width` e `--prx-micro-process-line-clamp` documentadas e suportadas no `@praxisui/charts`.


---

## 📌 Issue #32: Orquestração Declarativa de Sub-Recursos e Relações Vinculadas em Dossiês Analíticos (`relations` / `subResourceBindings` em `behavior.drawer`)

### Classificação
- **Módulos Afetados:** `@praxisui/crud`, `@praxisui/table`, `@praxisui/core`, `praxis-metadata-starter`
- **Severidade:** 🔴 Alta (Causa raiz da proliferação de mais de 5.400 linhas de boilerplate distribuídas em 5 gavetas monolíticas no Hero HQ)
- **Tipo:** Arquitetura de Apresentação / Governança Metadata-Driven de Relações
- **Status:** `[x] Resolvida`

### Diagnóstico Detalhado da Causa Raiz
Ao selecionar uma linha em tabelas ricas, a experiência corporativa frequentemente exige a abertura de um dossiê lateral contendo não apenas os campos da própria linha, mas dados vinculados de entidades filhas ou agregadas:
- No `IncidentAnalysisDrawerComponent` (1.411 linhas): busca indicadores de sinistro e dados da missão vinculada.
- No `HeroDossierDrawerComponent` (1.261 linhas): busca histórico de folha de pagamento, missões participadas e equipamentos alocados.
- No `MissionBriefingDrawerComponent` (1.006 linhas): busca participantes designados e incidentes táticos ocorridos.
- No `BaseFacilityDrawerComponent` (938 linhas): busca equipes sediadas e veículos estacionados.
- No `ThreatIntelligenceDrawerComponent` (820 linhas): busca histórico de incidentes provocados pela ameaça.

Como o `@praxisui/crud` e o `@praxisui/table` não oferecem suporte declarativo para orquestrar consultas a recursos relacionados a partir de parâmetros da linha selecionada (`{id}`, `{missaoId}`, etc.), o desenvolvedor foi compelido a construir **5 gavetas standalone customizadas em Angular**, repletas de:
1. Injeções de `HttpClient` manuais.
2. Combinações RxJS imperativas (`forkJoin`, `switchMap`, `catchError`).
3. Declaração manual de dezenas de `signals` e `effects` de ciclo de vida.
4. Criação de cascas de modal/drawer com backdrop, botões de fechar e CSS repetitivo.

### Solução Canônica Recomendada de Plataforma
1. **Contrato Declarativo de Relações no `behavior.drawer` (`@praxisui/core` e `@praxisui/crud`):**
   Permitir declarar no contrato JSON/OpenAPI quais sub-recursos devem ser carregados ao abrir a gaveta:
   ```json
   "behavior": {
     "drawer": {
       "type": "analytical",
       "titleExpr": "'Dossiê de Investigação · Incidente #' + row.id",
       "relations": [
         {
           "key": "indicadoresRisco",
           "endpoint": "/api/operations/incidentes/{id}/risco",
           "method": "GET",
           "cardinality": "single",
           "cache": true
         },
         {
           "key": "participantes",
           "endpoint": "/api/operations/missoes/{missaoId}/participantes",
           "method": "GET",
           "cardinality": "collection",
           "lazy": true
         }
       ],
       "tabs": [
         {
           "id": "tab-pericia",
           "label": "Perícia de Sinistro",
           "content": {
             "type": "cardGrid",
             "columns": 3,
             "cards": [
               {
                 "title": "Impacto Civil",
                 "content": [
                   {
                     "type": "metric",
                     "label": "Prejuízo Apurado",
                     "valueExpr": "relations.indicadoresRisco.danosCivis",
                     "format": "currency:BRL"
                   }
                 ]
               }
             ]
           }
         }
       ]
     }
   }
   ```
2. **Orquestração Nativa no Runtime do `<praxis-crud>`:**
   Ao disparar a abertura do drawer analítico, o motor do CRUD interpola as variáveis da linha (`row.id`, `row.missaoId`), executa os fetches com loading state unificado e injeta os resultados no contexto reativo do template (`context.relations`), tornando os dados disponíveis para expressões JsonLogic, cards Bento e tabelas aninhadas.
3. **Publicação via Java Spring (`praxis-metadata-starter`):**
   Suportar a anotação `@ApiSubResource` nos controllers para gerar automaticamente as rotas de relacionamento no schema OpenAPI consumido pelo frontend.

### Mitigação Temporária Adotada no Hero HQ
Construção imperativa dos 5 componentes de gaveta com mais de 5.400 linhas de código TypeScript, templates HTML e SCSS ad hoc.

### Critérios de Aceite para Resolução
- [x] O contrato `behavior.drawer.relations` é suportado no schema de configuração do `@praxisui/crud` e `@praxisui/table`.
- [x] O runtime resolve templates de rota e injeta automaticamente as respostas no contexto do drawer (`relations.<key>`).
- [x] A aplicação consumidora pode montar dossiês analíticos multi-recurso puramente via JSON, sem necessidade de componentes Angular dedicados para o drawer.

---

## 📌 Issue #33: Banda Canônica Declarativa de Resumo Executivo e KPIs no `<praxis-crud>` (`behavior.kpiBand` / `PraxisKpiBand`)

### Classificação
- **Módulos Afetados:** `@praxisui/crud`, `@praxisui/rich-content`, `praxis-metadata-starter`
- **Severidade:** 🔴 Alta (Elimina o serviço `DashboardStatsService` de 855 linhas e mais de 1.500 linhas de orquestração manual em 14 telas)
- **Tipo:** UX / Arquitetura de Apresentação / Dashboarding Embutido
- **Status:** `[x] Resolvida` (Batch 15)

### Diagnóstico Detalhado da Causa Raiz
Todas as 14 páginas de recursos do Hero HQ (Funcionários, Missões, Incidentes, Folha de Pagamento, Equipes, Ameaças, etc.) exibem cartões Bento de resumo executivo no topo da visualização (ex.: *Total Cadastrado*, *Efetivo Ativo*, *Volume Salarial*, *Casos Críticos*).
Como o componente `<praxis-crud>` não contemplava um slot declarativo nativo para uma faixa de KPIs de recurso:
1. Criou-se um serviço monolítico [`dashboard-stats.service.ts`](file:///D:/Developer/praxis-plataform/praxis-hero-hq-ui/src/app/pages/dashboard/dashboard-stats.service.ts) com 855 linhas disparando dezenas de `http.post` com contadores agregados manuais.
2. Cada componente de página foi obrigado a injetar o serviço, subscrever requisições em `ngOnInit`, instanciar e gerenciar manualmente `signal<RichContentDocument>`, e posicionar um `<praxis-rich-content [document]="kpiDocument()">` acima do `<praxis-crud>`.

### Solução Canônica Implementada na Plataforma
1. **Contratos Canônicos em `@praxisui/core`:** `PraxisKpiBandConfig`, `PraxisKpiBandCard`, integrados em `TableBehaviorConfig.kpiBand`, `TableConfig.kpiBand` e `CrudMetadata.kpiBand`.
2. **Componente Canônico `<praxis-kpi-band>` em `@praxisui/crud`:** Componente standalone com suporte a auto-fetch via `HttpClient`, grid Bento responsivo, avaliação de expressões (`valueExpr`, `captionExpr`) via `SafeExpressionEvaluator`, formatação executiva (`currency:compactBRL`, `currency:BRL`, `number`, `percent`) e skeletons de loading.
3. **Projeção Integrada no `<praxis-crud>`:** O CRUD projeta `<praxis-kpi-band>` no topo da visualização e repassa eventos `(kpiCardClick)`.

### Critérios de Aceite para Resolução
- [x] O componente `<praxis-crud>` projeta e gerencia a banda de KPIs nativamente quando a propriedade `kpiBand` estiver presente na configuração.
- [x] O serviço `dashboard-stats.service.ts` e as declarações de `signal<RichContentDocument>` locais em páginas de CRUD podem ser 100% extintos e substituídos por metadados declarativos.

---

## 📌 Issue #34: Suporte Canônico a Propriedades Calculadas e Expressões de Domínio no Schema (`computedFields` / `virtualProperties`)

### Classificação
- **Módulos Afetados:** `@praxisui/core`, `@praxisui/table`, `@praxisui/dynamic-form`, `praxis-metadata-starter`
- **Severidade:** 🟡 Média (Elimina o interceptor `tacticalDataEnrichmentInterceptor` de 571 linhas)
- **Tipo:** Engenharia de Dados de UI / Expressões Declarativas
- **Status:** `[x] Resolvida` (Batch 15)

### Diagnóstico Detalhado da Causa Raiz
Na modelagem corporativa, raramente o payload bruto do banco coincide perfeitamente com o que a interface precisa expressar:
- Folha: `margemLiquida` é a razão `(salarioBruto - descontos) / salarioBruto * 100`.
- Equipes: `prontidaoScore` depende de `status === 'ATIVA'`.
- Incidentes: badges e rótulos semânticos compostos.
Pela ausência de uma funcionalidade canônica no `@praxisui/table` para definir campos virtuais derivados nos metadados, o projeto Hero HQ implementou um `tacticalDataEnrichmentInterceptor` (571 linhas) que intercepta as chamadas HTTP e muta os objetos em trânsito. Isso acopla a aplicação a interceptores artificiais e impede a governança puramente declarativa.

### Solução Canônica Implementada na Plataforma
1. **Contratos Canônicos em `@praxisui/core`:** `PraxisComputedFieldDefinition`, `PraxisComputedFieldsConfig`, integrados em `TableConfig.computedFields` e `TableBehaviorConfig.computedFields`.
2. **Avaliador Puro e Helper `applyComputedFieldsToRows` no `@praxisui/table`:** Função pura que avalia expressões de domínio via `SafeExpressionEvaluator`, com suporte a dependências cumulativas entre campos computados, fallbacks resilientes e formatação automática (`currency:compactBRL`, `currency:BRL`, `percentage`, `date:pt-BR`, `datetime:pt-BR`).
3. **Ingestão Nativa de Dados no `PraxisTable`:** Integração no pipeline de `dataSubject.subscribe` e `refreshLocalScaffolding`, garantindo que os campos virtuais existam nativamente no objeto de linha em memória para colunas, sorting, filtros, gavetas analíticas e exportação.

### Critérios de Aceite para Resolução
- [x] A tabela resolve e injeta campos declarados em `computedFields` sem intervenção de interceptores externos.
- [x] O interceptor `tactical-data-enrichment.interceptor.ts` pode ser removido do Hero HQ sem perda de nenhuma funcionalidade visual ou de negócio.

---

## 📌 Issue #35: Eliminação de DTOs TypeScript Estáticos Redundantes via Contratos Genéricos Dinâmicos (`DynamicDataRecord` & Governança por Schema)

### Classificação
- **Módulos Afetados:** `@praxisui/core`, `@praxisui/table`, `@praxisui/crud`
- **Severidade:** 🟡 Média (Prevenção de regressão por quebra de contrato e eliminação de dezenas de interfaces manuais)
- **Tipo:** Arquitetura de Tipos / Paradigma Metadata-Driven
- **Status:** `[x] Resolvida`

### Diagnóstico Detalhado da Causa Raiz
O repositório do Hero HQ define manualmente dezenas de interfaces estáticas TypeScript (`HeroProfile`, `IncidentProfile`, `PayrollRecord`, `MissionProfile`, `BaseFacilityProfile`, `EquipmentRecord`, etc.).
Isso viola diretamente o princípio fundamental da plataforma Praxis: **governança por esquema em tempo de execução**.
Quando a estrutura dos campos é governada pelo backend em `/schemas/filtered`, a exigência de interfaces TypeScript estáticas em cada tela cria rigidez indevida, obriga manutenções duplicadas toda vez que um DTO Java é alterado e incentiva desenvolvedores a escrever código imperativo baseado em propriedades fixas em vez de consumir metadados declarativos.

### Solução Canônica Recomendada de Plataforma
1. **Exposição de Modelos Dinâmicos Guiados por Metadados no `@praxisui/core`:**
   Padronizar o uso de `DynamicDataRecord<T = Record<string, unknown>>` com helpers utilitários para acesso seguro a propriedades dinâmicas (`resolveDataField(row, 'field')`).
2. **Eventos e Ações Fortemente Tipados em Metadados:**
   Garantir que eventos como `(rowClick)` e handlers de formulário operem com tipagens genéricas parametrizáveis, dispensando declarações manuais de interfaces locais em aplicações vitrine.

### Implementação Canônica da Solução
1. **No `@praxisui/core` (`projects/praxis-core/src/lib/models/dynamic-record.model.ts`):**
   - Criados contratos universais `DynamicDataRecord<T>` e `DynamicDataCollection<T>`, fornecendo assinatura indexada `[key: string]: unknown` combinada com identificador padrão `id?: string | number`.
   - Implementados helpers utilitários puros: `resolveDataField<R>()` (com navegação segura por caminhos profundos `a.b.c`), `createDynamicRecord<T>()`, `isDynamicDataRecord()` e `extractRecordId()`.
   - Suite de testes unitários dedicada `dynamic-record.model.spec.ts` com 7 specs e 100% de aprovação.
   - Exportação canônica no `public-api.ts` de `@praxisui/core`.
2. **No `@praxisui/table` e `@praxisui/crud`:**
   - Tipagem padrão de `RowClickEvent<T = DynamicDataRecord>` parametrizada em `table-events.ts`.
   - Re-exportação canônica de `DynamicDataRecord` em ambos os pacotes para consumo simplificado.

### Critérios de Aceite para Resolução
- [x] Os módulos públicos de `@praxisui/*` fornecem contratos genéricos dinâmicos que dispensam DTOs TypeScript locais nas aplicações consumidoras.

---

## 📌 Issue #36: Modo de Apresentação e Ficha Técnica Editorial para Formulários Dinâmicos (`mode: 'presentation'` no `@praxisui/dynamic-form`)

### Classificação
- **Módulos Afetados:** `@praxisui/dynamic-form`, `@praxisui/core`
- **Severidade:** 🟡 Média (Elimina centenas de linhas de HTML customizado com cartões de leitura cadastral)
- **Tipo:** UX / Design System / Formulários Dinâmicos
- **Status:** `[x] Resolvida`

### Diagnóstico Detalhado da Causa Raiz
Ao inspecionar o dossiê de uma entidade (ex.: Aba *Identidade Civil* em `hero-dossier-drawer.component.ts` ou Aba *Parâmetros* em `base-facility-drawer.component.ts`), o operador precisa visualizar informações cadastrais estruturadas em seções limpas.
O componente `@praxisui/dynamic-form` em modo `disabled` ou `readOnly` continua renderizando caixas de texto e dropdowns com aparência de controles de formulário desativados, o que não atende ao padrão estético de um dossiê executivo. Por essa razão, os desenvolvedores recriam artesanalmente toda a visualização com grids de `div`, `span`, classes CSS locais e ícones, duplicando a semântica já existente no schema do formulário.

### Solução Canônica Recomendada de Plataforma
1. **Suporte ao `mode: 'presentation'` (ou `mode: 'dossier'`) no `@praxisui/dynamic-form`:**
   Quando configurado com `[mode]="'presentation'"`, o formulário:
   - Substitui inputs por elementos semânticos de leitura: rótulos discretos em caixa alta/caption (`text-muted-foreground`), valores nítidos em destaque tipográfico.
   - Converte campos booleanos e enums automaticamente em chips/badges coloridos com ícones.
   - Renderiza seções e grupos como cartões Bento limpos com divisores sutis.
   - Preserva o mesmo schema JSON utilizado para edição (`mode: 'edit'`), permitindo alternância instantânea entre modo de leitura executiva e modo de edição sem escrever uma única linha de HTML extra.

### Implementação Canônica da Solução
1. **No `@praxisui/core` (`field-presentation.model.ts`):**
   - Atualizado `DynamicFormMode` para incluir `'presentation'` e `'dossier'`.
2. **No `@praxisui/dynamic-form` (`PraxisDynamicForm`):**
   - Atualizado `@Input() mode: DynamicFormMode`.
   - `effectivePresentation` ativado automaticamente quando `mode === 'presentation'` ou `mode === 'dossier'`.
   - `effectivePresentationPreset` define `'corporate-dossier'` para o modo `'dossier'`.
   - Adicionada a classe `.praxis-dynamic-form--presentation` junto de `.presentation-mode`.
   - `effectiveReadonly` e `presentationForLoader` habilitados diretamente.
   - Ocultação automática da barra de ações de envio em modo de apresentação.
   - Atualizado o editor de configurações `PraxisDynamicFormConfigEditor` para operar com `DynamicFormMode`.
3. **Testes e Validação:**
   - Suite de testes em `praxis-dynamic-form.spec.ts` validando ativação e classes de apresentação e dossiê corporativo (220 specs aprovados com sucesso).
   - Validação downstream em `praxis-hero-hq-ui` com build de produção verde (código 0).

### Critérios de Aceite para Resolução
- [x] `<praxis-dynamic-form [mode]="'presentation'">` renderiza os dados do registro como uma ficha técnica editorial sem affordance de campos de entrada desabilitados.
- [x] É possível reutilizar 100% do schema JSON do formulário para apresentação de dados de leitura.


---

## 📌 Issue #37: Componente Canônico de Layout e Shell de Aplicação Corporativa (`PraxisAppShell` / `@praxisui/shell` ou `@praxisui/core`)

### Classificação
- **Módulos Afetados:** `@praxisui/core`, `@praxisui/shell`
- **Severidade:** 🟡 Média (Elimina o arquivo `hero-app-shell.component.ts` de 1.192 linhas no Hero HQ)
- **Tipo:** UX / Arquitetura de Shell / Layout Corporativo
- **Status:** `[ ] Aberta`

### Diagnóstico Detalhado da Causa Raiz
Toda aplicação desenvolvida sobre o ecossistema Praxis necessita de um esqueleto visual corporativo: barra lateral retrátil (sidebar), agrupamentos de navegação por domínio com ícones, indicador de status operacional no rodapé, barra superior com busca/comando, alternador de tema (Light/Dark), badge de perfil do usuário e barra de carregamento reativa.
Pela ausência de um componente de shell governado na biblioteca `@praxisui/core` (ou em um pacote dedicado `@praxisui/shell`), a aplicação Hero HQ foi obrigada a criar o arquivo [`hero-app-shell.component.ts`](file:///D:/Developer/praxis-plataform/praxis-hero-hq-ui/src/app/shell/hero-app-shell.component.ts) com **1.192 linhas de código** — das quais mais de 850 linhas são puro CSS embutido cuidando de animações de colapso, backdrops móveis, gradientes de borda e posicionamento de elementos.

### Solução Canônica Recomendada de Plataforma
1. **Criação do Componente Canônico `PraxisAppShellComponent`:**
   Expor em `@praxisui/core` (ou `@praxisui/shell`) um componente de casca configurável via contrato declarativo:
   ```html
   <praxis-app-shell
     [brand]="{ title: 'Praxis Hero HQ', version: 'v1.0', icon: 'shield' }"
     [navigation]="navigationGroups"
     [user]="currentUserProfile"
     [showThemeToggle]="true"
     [loadingContext]="appLoadingContext"
   >
     <router-outlet />
   </praxis-app-shell>
   ```
2. **Encapsulamento de Comportamento:**
   O componente assume nativamente o controle de colapso da sidebar, navegação mobile com backdrop, alternância de tema respeitando tokens do Design System, barra de progresso conectada ao `LoadingOrchestrator` e slots de projeção de conteúdo para header e footer.

### Mitigação Temporária Adotada no Hero HQ
Shell customizado artesanal com 1.192 linhas de código e CSS embutido.

### Critérios de Aceite para Resolução
- [ ] O componente `PraxisAppShell` é disponibilizado como building block oficial da plataforma.
- [ ] A aplicação cliente é capaz de configurar o shell corporativo com menos de 25 linhas de template e zero CSS customizado.

---

## 📌 Issue #38: Descoberta Integral de Recurso e Roteamento Zero-Code no `<praxis-crud>` (`PraxisResourcePage` / Auto-Resource Host)

### Classificação
- **Módulos Afetados:** `@praxisui/crud`, `@praxisui/table`, `praxis-metadata-starter`
- **Severidade:** 🔴 Alta (Causa raiz da repetição de mais de 10.500 linhas de código distribuídas em 14 páginas de CRUD)
- **Tipo:** Arquitetura de Plataforma / Paradigma Zero-Code Metadata-Driven
- **Status:** `[ ] Aberta`

### Diagnóstico Detalhado da Causa Raiz
No Hero HQ, existem 14 páginas dedicadas a entidades de domínio (Funcionários, Missões, Incidentes, Folha de Pagamento, Equipes, Ameaças, Bases, Contratos, Veículos, Equipamentos, Indicadores, Departamentos, Afastamentos e Pedidos).
Cada uma dessas páginas contém entre 650 e 1.021 linhas de código TypeScript, templates HTML e SCSS duplicados. Uma inspeção criteriosa revela que **mais de 85% do código dessas 14 páginas é idêntico**:
1. Declaração manual de `columnProjection` com overrides de títulos, larguras e formatos de coluna que já deveriam vir prontos das anotações Java (`@Schema`, `@UISchema`) em `/schemas/filtered`.
2. Declaração de objetos RichContent para os cartões de KPI superiores.
3. Injeção e subscrição de serviços RxJS manuais de estatísticas em `ngOnInit` e `ngOnDestroy`.
4. Templates repetitivos de botões de filtro tipo "chip" com contadores.
5. Injeção de componentes de gaveta lateral específica com `@if` e handlers de eventos manuais.

### Solução Canônica Recomendada de Plataforma
1. **Composição Auto-Suficiente do `<praxis-crud>`:**
   Evoluir o `<praxis-crud>` para que ele descubra e orquestre 100% da experiência de uma página inteira a partir do path canônico do recurso:
   ```html
   <praxis-crud resource="operations/missoes" />
   ```
   A partir dessa única linha, o componente:
   - Consulta `/schemas/filtered` e configura colunas, tipos, larguras e alinhamentos automaticamente.
   - Consulta metadados de `/stats/summary` e projeta a faixa de KPIs superior (`kpiBand`).
   - Consulta anotações `@QuickFilter` e renderiza a barra de filtros rápidos (`scopeBar`).
   - Ao clicar em uma linha, abre a gaveta analítica descrita em `behavior.drawer` do backend, executando as consultas relacionais sem código Angular customizado.
2. **Componente de Rota Genérico `PraxisResourcePage`:**
   Permitir que as rotas do Angular declarem apenas:
   ```typescript
   {
     path: 'operacoes/missoes',
     component: PraxisResourcePage,
     data: { resource: 'operations/missoes' }
   }
   ```
   Eliminando a necessidade de criar arquivos `*-page.component.ts` individuais para recursos padrão.

### Mitigação Temporária Adotada no Hero HQ
Criação manual de 14 arquivos de página acumulando mais de 10.500 linhas de boilerplate repetitivo.

### Critérios de Aceite para Resolução
- [ ] O componente `<praxis-crud>` é capaz de operar de forma auto-contida recebendo apenas a coordenada `resource`.
- [ ] As 14 páginas de recurso do Hero HQ podem ser reduzidas a simples definições de rota ou componentes com menos de 30 linhas de código.

---

## 🏛️ Diagnóstico Arquitetural: Onde o Código Está Concentrado e Plano de Descarbonização de Código (Redução de 80%)

A varredura quantitativa executada na aplicação modelo **Praxis Hero HQ** (`src/app`) identificou a distribuição real das ~20.000 linhas de código do projeto:

| Componente / Camada | Linhas de Código | Categoria de Boilerplate | Causa Raiz na Plataforma | Issue(s) de Resolução |
| :--- | :---: | :--- | :--- | :---: |
| **14 Páginas de Recursos CRUD** | **~10.500** | Boilerplate de CRUD repetido | Falta de descoberta integral de recurso e auto-crud | **#12**, **#30**, **#33**, **#38** |
| **5 Gavetas Monolíticas (Drawers)** | **5.436** | Gavetas artesanais em Angular | Falta de gaveta analítica e relações declarativas | **#30**, **#32**, **#36** |
| `incident-analysis-drawer.component.ts` | 1.411 | Gaveta customizada | Falta de relações declarativas e gaveta analítica | **#30**, **#32** |
| `hero-dossier-drawer.component.ts` | 1.261 | Gaveta customizada | Falta de relações e ficha técnica editorial | **#30**, **#32**, **#36** |
| `mission-briefing-drawer.component.ts` | 1.006 | Gaveta customizada | Falta de relações e timeline nativa em gaveta | **#30**, **#32** |
| `base-facility-drawer.component.ts` | 938 | Gaveta customizada | Falta de relações e apresentação editorial | **#30**, **#32**, **#36** |
| `threat-intelligence-drawer.component.ts` | 820 | Gaveta customizada | Falta de relações e cards Bento no drawer | **#30**, **#32** |
| `dashboard-page.definition.ts` + `component.ts` | **1.850** | Configuração estática de dashboard | Falta de carregamento de `WidgetPageDefinition` via API | **#18**, **#19** |
| `hero-app-shell.component.ts` | **1.192** | Shell e navegação com CSS embutido | Falta de componente de shell corporativo oficial | **#37** |
| `dashboard-stats.service.ts` | **855** | Agregação manual de métricas RxJS | Falta de banda de KPIs nativa no `<praxis-crud>` | **#33** |
| `tactical-data-enrichment.interceptor.ts` | **571** | Enriquecimento ad hoc de dados | Falta de campos calculados declarativos no schema | **#34** |
| DTOs e Interfaces Estáticas (vários) | **~800** | Tipos manuais redundantes | Falta de tipos genéricos dinâmicos orientados a schema | **#35** |

### 🎯 Meta de Descarbonização de Código
Com a resolução das Issues **#12, #30, #32, #33, #34, #35, #36, #37 e #38**, a base de código do **Praxis Hero HQ** será reduzida de **~20.000 linhas** para aproximadamente **3.500 linhas** de arquivos de rota e metadados JSON puros — atingindo a diretriz de **menos de 20% a 30% de código residual**, tornando o showcase um verdadeiro testemunho da inteligência e governança nativa da Plataforma Praxis.

---

## 🛠️ Procedimento de Entrega & Validação do Agente Executor

Quando o agente executor concluir o desenvolvimento de uma ou mais issues:
1. Executar as suites de testes focais do projeto alterado:
   - Para `@praxisui/*`: `npm run test -- --filter=@praxisui/<projeto>` ou `npm run test:e2e`.
   - Para Java/Spring: `mvn test -Dtest=<TestClass>` no `praxis-metadata-starter` ou `praxis-config-starter`.
2. Atualizar a **Matriz de Rastreamento de Issues de Plataforma** no início deste documento:
   - Alterar `[ ] Aberta` para `[x] Resolvida`.
   - Registrar a versão gerada (ex.: `10.0.0-rc.6`), hash do commit ou PR correspondente.
   - Preencher a data de resolução.
3. Notificar no canal de trabalho da plataforma para que o Hero HQ possa remover as mitigações temporárias e consumir o comportamento canônico nativo atualizado.
