# Praxis Platform Evolutions & Architectural Issues

Este documento cataloga, detalha e rastreia as necessidades de evolução, inconsistências de ciclo de vida e melhorias de arquitetura identificadas na **Plataforma Praxis** durante o desenvolvimento e a auditoria da aplicação modelo de excelência **Praxis Hero HQ**.

O objetivo deste catálogo é fornecer ao **Agente Executor de Plataforma** um plano de trabalho minucioso e exaustivo, com diagnósticos de causa raiz no monorepo, cenários correlatos ampliados para evitar correções pontuais míopes e critérios de aceite claros para garantir que as melhorias sejam robustas, escaláveis e canônicas.

---

## 📊 Matriz de Rastreamento de Issues de Plataforma

> **Instrução para o Agente Executor:** Conforme você investigar e resolver cada issue na plataforma (`praxis-ui-angular`, `praxis-metadata-starter` ou `praxis-config-starter`), atualize a coluna **Status**, registre a **Versão / Commit / PR** e marque a caixa de seleção `[x]` para acompanhamento contínuo da equipe.

| ID | Título da Demanda | Módulos Afetados | Severidade | Status | Versão / Commit / PR | Data Resolução | Validação Downstream (Hero HQ) |
|:---:|---|---|:---:|:---:|:---:|:---:|:---:|
| [**#1**](#-issue-1-duplo-carregamento-redundante-no-praxiscuitable-via-praxisicrud) | Duplo Carregamento Redundante no `@praxisui/table` via `@praxisui/crud` | `@praxisui/crud`<br>`@praxisui/table` | 🔴 Alta | `[x] Resolvida` | PR #562 (`327fd7786`) | 2026-10-07 | Validado (interceptor removido) |
| [**#2**](#-issue-2-destruição-de-estado-e-recarregamento-de-schemas-em-shells-com-abas) | Destruição de Estado e Recarregamento de Schemas em Shells com Abas | `@praxisui/dynamic-form`<br>`DynamicFormService` | 🟡 Média | `[ ] Aberta` | — | — | Pendente |
| [**#3**](#-issue-3-barramento-canônico-de-eventos-entre-widgets-praxiswidgeteventbus) | Barramento Canônico de Eventos entre Widgets (`PraxisWidgetEventBus`) | `@praxisui/page-builder`<br>`@praxisui/rich-content`<br>`@praxisui/charts` | 🟡 Média | `[ ] Aberta` | — | — | Pendente |
| [**#4**](#-issue-4-governança-declarativa-de-filtros-rápidos-e-filtros-avançados-na-tabela) | Governança Declarativa de Filtros Rápidos e Filtros Avançados na Tabela | `@praxisui/table`<br>`@praxisui/crud`<br>`praxis-metadata-starter` | 🟢 Baixa | `[ ] Aberta` | — | — | Pendente |
| [**#5**](#-issue-5-suporte-declarativo-a-ícones-e-cores-condicionais-em-apresentações-booleanas-e-enums) | Suporte Declarativo a Ícones e Cores Condicionais em Apresentações Booleanas e Enums | `@praxisui/dynamic-form`<br>`@praxisui/dynamic-fields`<br>`@UISchema` (Java) | 🟡 Média | `[ ] Aberta` | — | — | Pendente |
| [**#6**](#-issue-6-descoberta-e-ativação-automática-de-filtros-inline-inteligentes-no-praxisicrud) | Descoberta e Ativação Automática de Filtros Inline Inteligentes no `@praxisui/crud` | `@praxisui/crud`<br>`@praxisui/table`<br>`praxis-metadata-starter` | 🟡 Média | `[ ] Aberta` | — | — | Pendente |
| [**#7**](#-issue-7-normalização-robusta-de-parâmetros-de-path-em-schemasfiltered) | Normalização Robusta de Parâmetros de Path em `/schemas/filtered` | `praxis-metadata-starter`<br>`ApiDocsController` | 🟢 Baixa | `[ ] Aberta` | — | — | Pendente |
| [**#8**](#-issue-8-hierarquia-visual-de-seções-e-densidade-de-enquadramento-em-dossiêsdrawers-caixa-dentro-de-caixa-vs-seções-plaindivider) | Hierarquia Visual de Seções e Densidade de Enquadramento em Dossiês/Drawers ("Caixa Dentro de Caixa" vs Seções Plain/Divider) | `@praxisui/dynamic-form`<br>`Design System`<br>`praxis-metadata-starter` | 🟡 Média | `[ ] Aberta` | — | — | Pendente |
| [**#9**](#-issue-9-governança-canônica-e-descoberta-de-serviços-de-métricas-e-dashboards-statscapabilities-e-praxischarts) | Governança Canônica e Descoberta de Serviços de Métricas e Dashboards (`/stats/capabilities` e `@praxisui/charts`) | `praxis-metadata-starter`<br>`@praxisui/charts`<br>`@praxisui/page-builder` | 🟡 Média | `[ ] Aberta` | — | — | Pendente |

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
- **Status:** `[ ] Aberta`

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

### Mitigação Temporária Aplicada no Hero HQ
- No [`hero-dossier-drawer.component.ts`](file:///D:/Developer/praxis-plataform/praxis-hero-hq-ui/src/app/pages/rh/hero-dossier-drawer.component.ts#L515-L593), os painéis de abas foram migrados para `[hidden]="activeTab() !== '...'"` com regras de CSS `.tab-pane[hidden] { display: none !important; }`, garantindo transição instantânea de 0ms sem chamadas de rede repetidas.

### Critérios de Aceite para Resolução
- [ ] A navegação entre abas em um dossiê não gera novas chamadas a `/schemas/filtered` nem a `/locate`.
- [ ] Nenhuma tela branca perceptível durante a alternância entre abas.
- [ ] Manutenção integral do estado do formulário durante a navegação interna.
- [ ] Teste unitário no `DynamicFormService` garantindo cache L1 de schema compilado.

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

### Critérios de Aceite para Resolução
- [ ] Possibilidade de vincular um card do `PraxisRichContent` a um filtro de tabela via configuração declarativa no Page Builder, sem necessidade de métodos TypeScript manuais no host.
- [ ] Suporte a interoperabilidade com eventos emitidos por cliques em fatias e barras de `PraxisCharts`.
- [ ] Teste unitário validando isolamento de eventos entre instâncias hierárquicas de `PraxisWidgetEventBus`.

---

## 📌 Issue #4: Governança Declarativa de Filtros Rápidos e Filtros Avançados na Tabela

### Classificação
- **Módulos Afetados:** `@praxisui/table`, `@praxisui/crud`, `praxis-metadata-starter`
- **Severidade:** 🟢 Baixa (Evolução de Contrato e Configuração Declarativa)
- **Tipo:** Contrato OpenAPI `x-ui` / Configuração Declarativa
- **Status:** `[ ] Aberta`

### Diagnóstico Detalhado
O componente `PraxisTable` já possui uma infraestrutura rica para filtragem:
- `toolbar.filters.enabled`: ativa a seção de filtros na barra.
- `toolbar.filters.quickFilters`: exibe chips rápidos de escopo (ex.: Todos, Ativos, Inativos).
- `toolbar.filters.showAdvancedButton`: botão para abrir o painel de query builder avançado.
- `behavior.filtering.columnFilters.enabled`: filtros contextuais por coluna.
- `behavior.filtering.advancedFilters.settings.alwaysVisibleFields`: campos fixos na barra como inputs inline inteligentes.

Entretanto, essa estrutura não é automaticamente preenchida ou sugerida pelos geradores de metadados do backend Java (`praxis-metadata-starter`), exigindo que cada aplicação consumidora monte o JSON do `CrudMetadata` manualmente.

### Cenários Correlatos & Investigação Abrangente de Plataforma
1. **Comportamento em Telas Estreitas (Responsividade):** Quando múltiplos campos são colocados em `alwaysVisibleFields`, a barra de ferramentas pode estourar a largura em viewports menores que 1200px. O `PraxisTable` precisa implementar um mecanismo de overflow (colapsar campos excedentes automaticamente para um menu "Mais Filtros").
2. **Conflito entre QuickFilter e AdvancedFilter:** Se o usuário seleciona um chip rápido (ex.: "Ativos") e em seguida abre o filtro avançado e escolhe "Inativos", qual filtro tem precedência? É necessário padronizar a política de merge ou sobrescrita canônica no `PraxisTable`.
3. **Persistência de Filtros na URL:** Os filtros rápidos e avançados devem poder sincronizar com os query parameters da URL de forma opcional (`syncUrl: true`), permitindo que links filtrados sejam favoritados ou compartilhados entre operadores.

### Solução Canônica Recomendada de Plataforma
- Estender as anotações Java de governança para que o starter infira os quick filters automaticamente:
  ```java
  @ApiResource(
      resourceKey = "human-resources/funcionarios",
      quickFilters = {
          @QuickFilter(id = "active", label = "Em Prontidão", filter = "ativo=true", icon = "verified_user"),
          @QuickFilter(id = "inactive", label = "Reserva", filter = "ativo=false", icon = "person_off")
      }
  )
  ```
- O gerador de OpenAPI deve publicar essas definições sob `x-ui.table.toolbar.filters.quickFilters`.

### Critérios de Aceite para Resolução
- [ ] Recursos com `@QuickFilter` geram automaticamente os chips na toolbar da tabela sem configuração manual no frontend.
- [ ] Em telas com viewport estreito (< 1024px), campos inline excedentes colapsam para dropdown de overflow.

---

## 📌 Issue #5: Suporte Declarativo a Ícones e Cores Condicionais em Apresentações Booleanas e Enums

### Classificação
- **Módulos Afetados:** `@praxisui/dynamic-form`, `@praxisui/dynamic-fields`, `praxis-metadata-starter`
- **Severidade:** 🟡 Média (Inconsistência semântica e visual crítica em dossiês e visualizações de perfil)
- **Tipo:** Metadados OpenAPI / UX
- **Status:** `[ ] Aberta`

### Diagnóstico Detalhado da Causa Raiz
No `<praxis-dynamic-form>` em modo de apresentação (`mode="view"`, `presentationModeGlobal="true"` ou `presentationPreset="corporate-dossier"`):
- O componente `PraxisPresentation` renderiza o ícone configurado estaticamente no `@UISchema` ou o padrão do componente (ex.: `toggle_on` com tom esmeralda/sucesso).
- Quando o registro possui valor `ativo: false`:
  - O texto renderizado é `"Não"`.
  - O ícone permanece `toggle_on` em verde brilhante!
- Isso induz o usuário a um erro grave de interpretação: o operador vê o ícone de ligado/ativo e presume que o colaborador está em prontidão ativa, quando na realidade ele está inativo.

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
2. **No Frontend (`@praxisui/dynamic-fields` / `PraxisPresentationComponent`):**
   - No renderer booleano, se `value === false`, selecionar automaticamente `iconFalse` (ou `toggle_off`) e tom `muted` / `neutral`, alterando classes e ligatures de forma reativa sem exigir CSS ad-hoc no consumidor.

### Mitigação Temporária Aplicada no Hero HQ
- Foi inserido CSS com targeting em classes no [`hero-dossier-drawer.component.ts`](file:///D:/Developer/praxis-plataform/praxis-hero-hq-ui/src/app/pages/rh/hero-dossier-drawer.component.ts#L650-L670):
  ```css
  .praxis-presentation--boolean-false .praxis-presentation__icon--prefix {
    font-variation-settings: 'FILL' 0;
    color: var(--muted-foreground) !important;
  }
  .praxis-presentation--boolean-false .praxis-presentation__icon--prefix::before {
    content: 'toggle_off';
  }
  ```

### Critérios de Aceite para Resolução
- [ ] Qualquer campo booleano renderizado com valor `false` no dynamic form de apresentação exibe ícone `toggle_off` com tom neutro por padrão.
- [ ] O backend Java aceita parametrização de ícones e cores para ambos os estados booleanos no `@UISchema`.

---

## 📌 Issue #6: Descoberta e Ativação Automática de Filtros Inline Inteligentes no `@praxisui/crud`

### Classificação
- **Módulos Afetados:** `@praxisui/crud`, `@praxisui/table`, `praxis-metadata-starter`
- **Severidade:** 🟡 Média (Evolução de Produtividade e Experiência Out-of-the-Box)
- **Tipo:** Auto-configuração Metadata-Driven
- **Status:** `[ ] Aberta`

### Diagnóstico Detalhado
O componente `PraxisFilter` embutido no `@praxisui/table` é extremamente poderoso:
- Suporta campos inline fixos (`alwaysVisibleFields`).
- Suporta selects com busca assíncrona (`useInlineSearchableSelectVariant`).
- Suporta seletores de intervalo de data (`useInlineDateVariant`).
- Conecta-se diretamente ao schema do endpoint de filtro via `/schemas/filtered?path=/api/{resource}/filter&operation=post&schemaType=request`.

Contudo, para que esse componente apareça, o desenvolvedor precisa montar uma estrutura aninhada complexa de propriedades (`behavior.filtering.advancedFilters.settings.*`) em cada página. Como o backend já conhece todos os campos anotados com `@Filterable`, o runtime da plataforma deveria habilitar e sugerir esses filtros automaticamente.

### Cenários Correlatos & Investigação Abrangente de Plataforma
1. **Hierarquia de Operação no `/schemas/filtered`:** O endpoint de schema filtra por `operation` (default: `"get"`). Para filtros, a operação é `"post"` e o schemaType é `"request"`. Se o cliente chamar sem especificar esses parâmetros, o endpoint retorna erro 404/400. A plataforma deve documentar e padronizar helpers de consulta para schemas de requisição de busca.
2. **Dependência de Campos (Cascade nos Filtros Inline):** Se o usuário filtra por "Departamento", o campo inline de "Cargo" deve atualizar sua lista de opções automaticamente. O `PraxisFilter` já possui suporte a `dependencyFilterMap`, mas essa orquestração precisa ser testada e homologada na linha inline fixa.

### Solução Canônica Recomendada de Plataforma
1. No `PraxisCrudComponent`:
   - Ao inspecionar as capabilities do recurso, se `capabilities.filter` for verdadeiro e existirem propriedades `@Filterable` no schema, gerar automaticamente uma configuração padrão de `advancedFilters` com os campos relevantes em `alwaysVisibleFields`.
2. Adicionar uma propriedade simplificada no `CrudMetadata`:
   ```typescript
   filterBar: {
     inlineFields: ['nomeCompleto', 'departamentoId', 'ativo'],
     quickFilters: true
   }
   ```
   que é expandida internamente para a configuração canônica completa do `PraxisTable`.

---

## 📌 Issue #7: Normalização Robusta de Parâmetros de Path em `/schemas/filtered`

### Classificação
- **Módulos Afetados:** `praxis-metadata-starter`, `ApiDocsController`
- **Severidade:** 🟢 Baixa (Robustez de API / Tolerância a Formatos)
- **Tipo:** Contrato de Endpoint / Tratamento de Requisições
- **Status:** `[ ] Aberta`

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
- [ ] Chamar `/schemas/filtered?path=human-resources/funcionarios/filter&operation=post&schemaType=request` retorna o schema com sucesso, mesmo sem `/api/` explícito na URL.

---

## 📌 Issue #8: Hierarquia Visual de Seções e Densidade de Enquadramento em Dossiês/Drawers ("Caixa Dentro de Caixa" vs Seções Plain/Divider)

### Classificação
- **Módulos Afetados:** `@praxisui/dynamic-form`, Design System da Plataforma, `praxis-metadata-starter`
- **Severidade:** 🟡 Média (Evolução Fundamental de Design e UX de Plataforma)
- **Tipo:** Design System / Tokens de Layout e Apresentação
- **Status:** `[ ] Aberta`

### Diagnóstico Detalhado da Causa Raiz
No desenvolvimento de aplicações ricas baseadas em Praxis, formulários e fichas são frequentemente renderizados dentro de contêineres já delimitados (gavetas laterais/drawers, caixas de diálogo modais ou cards de dashboard).

1. **Sensação de "Caixa Dentro de Caixa":**
   No arquivo `projects/praxis-dynamic-form/src/lib/praxis-dynamic-form.scss` (linha 638), o estilo padrão de `.form-section` define:
   ```scss
   .form-section {
     border: 1px solid var(--pfx-form-section-divider);
     border-radius: var(--pfx-editorial-form-radius);
     padding: var(--pfx-form-section-padding);
     background: var(--pfx-form-section-surface-flat);
   }
   ```
   Quando o formulário é inserido dentro de uma Drawer (que já possui fundo próprio, borda e padding), cada seção é renderizada como um cartão adicional. Isso causa ruído visual, fragmentação excessiva da informação e a percepção indesejada de múltiplos cartões aninhados ("caixa dentro de caixa").
2. **Espaçamento Colapsado entre Seções:**
   O espaçamento entre seções no CSS é implementado através do seletor:
   ```scss
   .section-drop-wrapper > .form-section {
     margin-bottom: var(--pfx-section-gap, 20px);
   }
   .section-drop-wrapper:last-of-type > .form-section {
     margin-bottom: 0;
   }
   ```
   Caso o formulário seja renderizado sem a classe `.section-drop-wrapper` (ou se o contêiner intermediário colapsar margens ou sofrer com regras de flex/grid), as seções ficam completamente encostadas umas nas outras.
3. **Ausência de Governança Declarativa no Backend Java:**
   Embora o componente `@praxisui/dynamic-form` já suporte internamente classes como `.section-appearance-plain` e `.section-appearance-step` (ver `praxis-dynamic-form.section-appearance.spec.ts`), **o backend Java (`praxis-metadata-starter`) não possui anotações para definir o `appearance` da seção**, forçando os desenvolvedores a criar overrides manuais de layout JSON ou seletores CSS agressivos com `!important`.

### Cenários Correlatos & Investigação Abrangente de Plataforma
1. **Dossiês Corporativos e Fichas Cadastrais (Read-only / Presentation Mode):**
   Em visualizações de perfil e dossiê (como a gaveta lateral do Hero HQ), a melhor prática de UX recomendada por especialistas em Design System corporativo é utilizar **seções sem borda de cartão (`plain`) com divisores sutis** (`border-top: 1px solid var(--outline-variant)` ou linhas decorativas alinhadas ao título da seção).
2. **Formulários Longos em Páginas Abertas:**
   Em páginas abertas de tela cheia, cartões agrupados (`card`) podem ser apropriados se o fundo da página for neutro (`surface-container-low`). Em contrapartida, em painéis laterais (`drawers`) e diálogos modais, o enquadramento `plain` ou `divider` deve ser o padrão adotado.
3. **Containers Flexbox Modernos com `gap`:**
   O uso de margens em filhos (`.section-drop-wrapper > .form-section { margin-bottom: ... }`) é um padrão frágil herdado. A abordagem canônica moderna é aplicar `display: flex; flex-direction: column; gap: var(--pfx-section-gap, 24px);` diretamente no contêiner `<form class="praxis-dynamic-form">`, garantindo espaçamento consistente e imune a colapso de margens.

### Solução Canônica Recomendada de Plataforma
1. **No Backend (`praxis-metadata-starter`):**
   Adicionar suporte à governança declarativa de seções:
   ```java
   @ApiResource(
       resourceKey = "human-resources/funcionarios",
       formSections = {
           @FormSection(id = "identificacao", label = "Identificação", appearance = SectionAppearance.PLAIN),
           @FormSection(id = "contato", label = "Contato & Comunicação", appearance = SectionAppearance.PLAIN, divider = true)
       }
   )
   ```
   Publicar esses atributos no contrato `x-ui.form.sections[].appearance`.
2. **No `@praxisui/dynamic-form`:**
   - Suportar o atributo de entrada `@Input() sectionDefaultAppearance: 'card' | 'plain' | 'step' = 'card'`.
   - Quando `presentationPreset="corporate-dossier"` ou `presentationPreset="drawer-compact"` for especificado, assumir `sectionDefaultAppearance="plain"` automaticamente, gerando um layout sofisticado com divisores sutis sem aninhamento de cartões.
   - Refatorar o espaçamento do contêiner para utilizar CSS `gap`, prevenindo seções coladas em qualquer contêiner hospedeiro.

### Mitigação Temporária Aplicada no Hero HQ
- No componente [`hero-dossier-drawer.component.ts`](file:///D:/Developer/praxis-plataform/praxis-hero-hq-ui/src/app/pages/rh/hero-dossier-drawer.component.ts#L650-L685), foram aplicados estilos pontuais:
  ```css
  .section-drop-wrapper {
    margin-bottom: 20px !important;
  }
  .form-section {
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    background: transparent !important;
  }
  ```

### Critérios de Aceite para Resolução
- [ ] Formulários dinâmicos em gavetas e modais suportam configuração declarativa `appearance: 'plain'` sem necessidade de CSS `!important`.
- [ ] O espaçamento entre seções é consistente e garantido via CSS `gap`, independentemente da estrutura do contêiner pai.
- [ ] A documentação oficial de UX e Design System da plataforma detalha quando utilizar cada enquadramento (`card`, `plain`, `step`).

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
