# Catálogo de Limitações & Propostas de Evolução da Plataforma Praxis

> **Documento Central de Governança e Evolução dos Componentes Praxis**  
> Este arquivo centraliza todas as limitações identificadas durante a implementação prática da aplicação *Praxis Hero HQ*, fornecendo diagnóstico técnico, evidências e propostas canônicas para o time / agente de desenvolvimento da plataforma.
>
> **Status:**  
> - `[PENDING]`: Aguardando implementação na biblioteca da plataforma.  
> - `[IN PROGRESS]`: Em desenvolvimento pelo agente da plataforma.  
> - `[DONE]`: Concluído e publicado nas bibliotecas `@praxisui/*`.

---

## Índice de Demandas de Plataforma

| ID | Biblioteca / Escopo | Gravidade / Tipo | Título Resumido | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ISSUE-001** | `@praxisui/rich-content` | Design / Visual | "Caixa dentro de Caixas": Renderização duplicada de container em `card` e `actionCard` | `[DONE]` |
| **ISSUE-002** | `@praxisui/rich-content` | Design / Funcional | Badges/Chips com estilos fixos Material 3 acoplados e `icon` ignorado no template | `[DONE]` |
| **ISSUE-003** | `@praxisui/rich-content` | Funcional / DX | `RichProgressNode`: `valueExpr` não aceita literais numéricos e falta `value: number` | `[DONE]` |
| **ISSUE-004** | `@praxisui/rich-content` | Estrutural / Layout | Suporte a nós canônicos de layout em Grid / Colunas (`RichGridNode` / `RichColumnsNode`) | `[DONE]` |
| **ISSUE-005** | `@praxisui/core` | Arquitetural / Tipos | Harmonização de tokens semânticos de cores entre nós (`statGroup`, `timeline`, `badge`) | `[DONE]` |
| **ISSUE-006** | `@praxisui/rich-content` | Interatividade / DX | Callbacks de ação e eventos interativos nativos em itens de `statGroup` e `timeline` | `[DONE]` |
| **ISSUE-007** | `@praxisui/page-builder` & `@praxisui/core` | Reatividade / Estado | Binding reativo granular para atualização de widgets sem rerender do canvas | `[DONE]` |
| **ISSUE-008** | `@praxisui/rich-content` | Consistência / API | Exportação pública padronizada (`PraxisRichContent` vs `PraxisRichContentComponent`) | `[DONE]` |
| **ISSUE-009** | `@praxisui/rich-content` | Visual / Telemetria | Suporte nativo a kind `'telemetry'` (radar, pulse, wave, signal) e Lottie em `RichCardMedia` | `[DONE]` |
| **ISSUE-010** | `@praxisui/rich-content` | Funcional / KPIs | Indicador de progresso integrado (`variant: 'bar' \| 'ring'`) em `RichStatItem` | `[DONE]` |
| **ISSUE-011** | `@praxisui/core` | Navegação / SPA | Handler nativo e autônomo para navegação de rotas SPA (`praxis:router.navigate`, `navigation.navigate`) | `[DONE]` |
| **ISSUE-012** | `@praxisui/page-builder` | Design / Shell | Presets canônicos Glassmorphism (`glass-dark`, `glass-light`) e `backdropFilter` em `WidgetShell` | `[DONE]` |
| **ISSUE-013** | `@praxisui/rich-content` | Design / Interatividade | Layout Vertical, Espaçamento de Rodapé (`margin-top: auto`) e Microinterações de `:hover`/`:focus-visible` em `RichActionCardNode` | `[DONE]` |
| **ISSUE-014** | `@praxisui/core` | Arquitetural / DX | Governança Canônica de Temas: Ausência de SCSS Starter/Mixin e Mapeamento Obrigatório de Tokens Material 3 | `[DONE]` |
| **ISSUE-015** | `@praxisui/core` | Design / UX & Layout | Fundo Translúcido em Widgets Sobrepostos e Omissão do Modo de Inspeção de Janela ('expand') na Toolbar de WidgetShell | `[DONE]` |
| **ISSUE-016** | `@praxisui/core` | Arquitetural / Temas | Ausência de Tokens Canônicos de Superfície Invertida e Tooltip no Theme Bridge (`--mat-sys-inverse-surface` e `--mat-tooltip-*`) | `[DONE]` |
| **ISSUE-017** | `@praxisui/rich-content` | Funcional / Visual | `RichCardMedia[kind='avatar']` ignora URL de imagem (`src`) e renderiza apenas iniciais com fallback nulo quando `label`/`alt` são omitidos | `[DONE]` |
| **ISSUE-018** | `@praxisui/rich-content` | Design / Contraste & Layout | `RichTabsNode[appearance='pills']` possui `#fff` hardcoded no fundo da aba ativa e força `flex-wrap: wrap` quebrando o layout | `[DONE]` |
| **ISSUE-019** | `@praxisui/dynamic-form` | Design / Acabamento | Presets Visuais Ricos Nativos para Modo Apresentação (`presentationPreset: 'corporate-dossier' \| 'editorial-card'`) eliminando CSS customizado no host | `[DONE]` |
| **ISSUE-020** | `@praxisui/dynamic-form` & `@praxisui/core` | Arquitetural / Layout | Suporte Nativo a Layout por Abas (Tabs) e Acordeão no `FormConfig` para Organização Multisseção Governada | `[DONE]` |
| **ISSUE-021** | `@praxisui/rich-content` & `@praxisui/core` | Arquitetural / Composição | Suporte a `schemaRef`/`resourcePath` dinâmico em `RichPropertySheetNode` ou nó nativo de formulário dinâmico em `RichContent` | `[DONE]` |
| **ISSUE-022** | `@praxisui/dynamic-fields` & `@praxisui/core` | Semântica / Reatividade | Reatividade Semântica de Ícone, Tom e Estado em Campos Booleanos no Modo Apresentação (`FieldShellComponent`) | `[DONE]` |
| **ISSUE-023** | `@praxisui/rich-content` & `@praxisui/core` | Design / Layout | Espaçamento Canônico de Cabeçalho e Diagramação Interna Balanceada em Nós de Métricas (`statGroup` / `RichStatGroupNode`) | `[DONE]` |
| **ISSUE-024** | `@praxisui/dynamic-fields` | Visual / Acessibilidade | Fallback automático de ícone padrão ('person' / 'account_circle') em `MaterialAvatarComponent` quando imagem e iniciais forem nulas | `[PENDING]` |


---

## Detalhamento Técnico das Demandas

### ISSUE-001: "Caixa dentro de Caixas" — Renderização Duplicada de Container em `RichCardNode` e `RichActionCardNode`
* **Biblioteca:** `@praxisui/rich-content`
* **Status:** `[DONE]`
* **Gravidade:** Alta (Impacto visual e inconsistência de design em cards customizados)
* **Diagnóstico Técnico:**
  No arquivo `praxis-rich-content.ts`, todo nó é envolvido por um container genérico:
  ```html
  <div class="prx-rich-node" [ngClass]="resolveNodeClasses(node)">
    @switch (node.type) {
      @case ('card') {
        <section class="prx-rich-card" [class.prx-rich-card--elevated]="...">...</section>
      }
    }
  </div>
  ```
  Quando o desenvolvedor adiciona classes de estilo ou tokens de superfície via `node.className` (como `.glass-panel`, `.hero-executive-banner`, `.bento-kpi-card`), essas classes são aplicadas na `div.prx-rich-node` externa (com borda, background, padding e raio). Porém, a `<section class="prx-rich-card">` interna possuía estilos fixos próprios incondicionais:
  ```css
  .prx-rich-card {
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    border-radius: 16px;
    background: var(--prx-rich-card-tone-bg, #fff);
    padding: 16px;
  }
  ```
  Mesmo com `variant: 'transparent'`, a classe `.prx-rich-card[data-variant='transparent']` ainda mantinha borda e fundo ativo. Isso fazia com que todo card com classe customizada gerasse uma "caixa dentro de outra caixa" (dupla borda, duplo padding e caixa branca dentro de caixa estilizada).
* **Implementação Realizada na Plataforma:**
  1. **Contrato Canônico (`@praxisui/core`):**
     - Adicionado `'unstyled'` à união `RichCardVariant`:
       `export type RichCardVariant = 'plain' | 'outlined' | 'elevated' | 'filled' | 'transparent' | 'unstyled';`
     - Adicionado `'unstyled'` à união de variantes de `RichActionCardNode`:
       `variant?: 'basic' | 'raised' | 'stroked' | 'flat' | 'unstyled';`
  2. **Renderizador e Estilos (`@praxisui/rich-content`):**
     - No template de `actionCard`, adicionado binding explícito `[attr.data-variant]="node.variant || null"`.
     - No bloco de estilos CSS de `praxis-rich-content.ts`, adicionadas regras de reset completas:
       ```css
       .prx-rich-card[data-variant='unstyled'],
       .prx-rich-action-card[data-variant='unstyled'] {
         border: none !important;
         background: transparent !important;
         box-shadow: none !important;
         padding: 0 !important;
         border-radius: 0 !important;
         overflow: visible !important;
       }
       ```
     - **Nota Crítica de Geometria:** A inclusão de `overflow: visible !important` e `border-radius: 0 !important` é mandatória porque a `<section class="prx-rich-card">` possui nativamente `border-radius: 16px; overflow: hidden;`. Quando o padding é zerado para delegar a borda/fundo ao container pai, o conteúdo do rodapé encosta na quina inferior esquerda e sofre clipping involuntário (cortando números e textos descritivos como na primeira letra da footnote).
  3. **Validação, IA & Editor:**
     - `RichContentDocumentValidator` atualizado para validar `'unstyled'` em nós `card` e `actionCard`.
     - Manifesto de IA de autoria atualizado com `'unstyled'`.
     - Editor de configuração visual (`PraxisRichContentConfigEditor`) e i18n (`en-US`, `pt-BR`) atualizados com opção 'unstyled'.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - O workaround CSS com `!important` para resetar `.prx-rich-card` e `.prx-rich-action-card` pode ser **removido**.
  - No JSON de qualquer card encapsulado em container customizado (`.hero-executive-banner`, `.bento-kpi-card`, `.hub-card-action`), declare diretamente:
    ```json
    {
      "type": "card",
      "variant": "unstyled",
      "className": "bento-kpi-card",
      ...
    }
    ```
    Ou para card de ação:
    ```json
    {
      "type": "actionCard",
      "variant": "unstyled",
      "className": "hub-card-action",
      ...
    }
    ```

---

### ISSUE-002: Badges/Chips com Estilos Fixos Material 3 e `icon` Ignorado no Template
* **Biblioteca:** `@praxisui/rich-content`
* **Status:** `[DONE]`
* **Gravidade:** Alta (Inconsistência visual e regressão de propriedades de contrato)
* **Diagnóstico Técnico:**
  1. **Aninhamento Indevido de Caixas de Cor:** O nó `badge` renderizava `<div class="prx-rich-node [node.className]"><span class="prx-rich-badge">{{ label }}</span></div>`. O `<span>` interno possuía estilos fixos acoplados ao tema roxo Material 3 sem suporte a variantes semânticas nativas.
  2. **Ícone Ignorado:** A interface `RichBadgeNode` definia `icon?: string`, mas o template em `praxis-rich-content.ts` ignorava o campo e não renderizava nenhum ícone.
* **Implementação Realizada na Plataforma:**
  1. **Contrato Canônico (`@praxisui/core`):**
     - Criado tipo união semântico `RichBadgeTone`:
       ```typescript
       export type RichBadgeTone =
         | 'primary'
         | 'secondary'
         | 'neutral'
         | 'info'
         | 'success'
         | 'warning'
         | 'danger';
       ```
     - Adicionado campo opcional `tone?: RichBadgeTone;` na interface `RichBadgeNode`.
  2. **Renderizador e Estilos (`@praxisui/rich-content`):**
     - Template de `badge` atualizado para renderizar ícone Material Symbols quando fornecido:
       ```html
       @case ('badge') {
         <span
           class="prx-rich-badge"
           [attr.data-tone]="node.tone || null"
         >
           @if (node.icon) {
             <span
               class="material-symbols-outlined prx-rich-badge__icon"
               aria-hidden="true"
             >{{ node.icon }}</span>
           }
           <span class="prx-rich-badge__label">{{ resolveBadgeLabel(node) }}</span>
         </span>
       }
       ```
     - Adicionado espaçamento `gap: 4px` e dimensão adequada para `.prx-rich-badge__icon` (14px).
     - Adicionados estilos completos para todos os tons semânticos:
       * `[data-tone='primary']`: container primário
       * `[data-tone='secondary']`: container secundário
       * `[data-tone='neutral']`: tom neutro de superfície
       * `[data-tone='info']`: azul de informação governado
       * `[data-tone='success']`: verde de prontidão / sucesso governado
       * `[data-tone='warning']`: amarelo / âmbar de atenção
       * `[data-tone='danger']`: vermelho de erro / perigo
  3. **Validação:**
     - `RichContentDocumentValidator` valida a propriedade `tone` contra o conjunto canônico `RichBadgeTone`.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - O workaround de criar nós `compose` (`row`) agrupando `{ type: 'icon' }` e `{ type: 'badge' }` pode ser **removido**.
  - O workaround de resetar `.status-pill .prx-rich-badge` no CSS do host pode ser **removido**.
  - Declare badges diretamente com ícone e tom semântico:
    ```json
    {
      "type": "badge",
      "label": "Operacional",
      "icon": "verified",
      "tone": "success"
    }
    ```
    Ou para alerta de missão:
    ```json
    {
      "type": "badge",
      "label": "Risco Alto",
      "icon": "warning",
      "tone": "danger"
    }
    ```

---

### ISSUE-003: `RichProgressNode` Não Aceita Literais Numéricos e Falta `value: number`
* **Biblioteca:** `@praxisui/rich-content` / `@praxisui/core`
* **Status:** `[DONE]`
* **Gravidade:** Média (Dificuldade de configuração e falha silenciosa para valores estáticos)
* **Diagnóstico Técnico:**
  A interface `RichProgressNode` só possuía `valueExpr: string`. Quando o desenvolvedor passava um valor literal como `valueExpr: '98.4'`, o motor de expressões buscava a chave `'98.4'` dentro do objeto de contexto de dados, retornando `null` -> `Number(null ?? 0) = 0`, renderizando uma barra vazia e inativa.
* **Implementação Realizada na Plataforma:**
  1. **Contrato Canônico (`@praxisui/core`):**
     - Interface `RichProgressNode` expandida com propriedade numérica direta e expressão opcional:
       ```typescript
       export interface RichProgressNode extends RichBlockBaseNode {
         type: 'progress';
         value?: number;
         valueExpr?: string;
         max?: number;
         label?: string;
         labelExpr?: string;
         showPercent?: boolean;
       }
       ```
  2. **Runtime (`@praxisui/rich-content`):**
     - Em `resolveProgressValue`, prioridade para leitura de `node.value` (quando numérico e finito).
     - Quando `node.valueExpr` for fornecido, se a string for um literal numérico finito (ex: `'98.4'`), faz parse direto com `Number(trimmed)` antes de consultar o contexto.
  3. **Validação:**
     - `RichContentDocumentValidator` valida `value` como número opcional, `valueExpr` como caminho de expressão opcional, e emite issue se nenhum dos dois estiver presente.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - O workaround de injetar o valor dentro do contexto (`context: { progressVal: 98.4 }`) pode ser **removido**.
  - Nós `progress` agora podem ser declarados diretamente com `value`:
    ```json
    {
      "type": "progress",
      "value": 98.4,
      "max": 100,
      "showPercent": true,
      "label": "Eficiência Global"
    }
    ```
    Ou via expressão literal:
    ```json
    {
      "type": "progress",
      "valueExpr": "98.4",
      "max": 100
    }
    ```

---

### ISSUE-004: Suporte a Nós Canônicos de Layout em Grid / Colunas (`RichGridNode` / `RichColumnsNode` ou `compose` com `layout: 'grid'`)
* **Biblioteca:** `@praxisui/rich-content` / `@praxisui/core`
* **Status:** `[DONE]`
* **Gravidade:** Alta (Impacto direto no alinhamento visual, responsividade e previsibilidade de cards, formulários e blocos ricos)
* **Diagnóstico Técnico & Evidência Real:**
  Na tela do Dashboard Executivo (*Centros de Comando & Especialidades* com 6 `actionCard`), foi observado um desalinhamento grave: 3 cards na primeira linha, 2 cards na segunda linha com um buraco vazio à direita, e 1 card isolado na terceira linha.
  
  **Causa-Raiz na Plataforma:**
  1. O único nó de agrupamento multi-filhos disponível em `RichContentDocument` é o `compose`.
  2. O nó `compose` é estritamente codificado como Flexbox em `praxis-rich-content.ts`:
     ```css
     .prx-rich-compose {
       display: flex;
       align-items: center;
       gap: 8px;
     }
     .prx-rich-compose.wrap {
       flex-wrap: wrap;
     }
     ```
  3. No HTML, `praxis-rich-content` renderiza um wrapper extra em volta do compose:
     ```html
     <div class="prx-rich-node [node.className]">
       <div class="prx-rich-compose wrap">
         <div class="prx-rich-node hub-card-action">...</div>
         <div class="prx-rich-node hub-card-action">...</div>
       </div>
     </div>
     ```
  4. Quando o desenvolvedor tenta transformar o bloco em grid adicionando `className: 'hub-action-cards-grid'` com `display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))`, o CSS Grid é aplicado ao wrapper `<div class="prx-rich-node">`, que contém **apenas um único filho** (`<div class="prx-rich-compose">`).
  5. A `div.prx-rich-compose` interna permanece como um `display: flex; flex-wrap: wrap;`. Em Flexbox puro com wrap, cada card assume largura intrínseca pelo volume de texto de sua descrição. Como os cards 4 e 5 possuem textos descritivos ligeiramente maiores, o card 6 não coube na segunda linha e foi forçado para a terceira linha, gerando a distribuição assimétrica 3 + 2 + 1.

---

#### Problemas Sistêmicos Decorrentes Desta Falha de Plataforma

1. **Quebra Assimétrica e Itens Órfãos (*Ragged Layout / Orphan Elements*):**
   - Variações naturais no conteúdo (ex.: descrições dinâmicas vindas de API, números maiores ou textos traduzidos via i18n com maior volume de caracteres) alteram a largura intrínseca de cada card.
   - Isso faz com que a quebra de linha aconteça de forma não determinística e visualmente desagradável (ex.: 3 cards na linha 1, 2 cards na linha 2 com buraco vazio à direita, e 1 card isolado na linha 3), transmitindo sensação de interface inacabada ou com bug de carregamento.
2. **Desalinhamento Vertical de Alturas e de Botões de Ação (*Unequal Heights & Misaligned CTAs*):**
   - No Flexbox puro, cada linha de flex calcula sua altura independentemente. Se um card da linha 1 tem 4 linhas de texto descritivo e os da linha 2 têm apenas 1 linha, a linha 1 fica significativamente mais alta que a linha 2, destruindo o ritmo vertical da interface.
   - Pior ainda: o botão de ação (CTA) de cada card fica posicionado logo abaixo do texto descritivo, fazendo com que os botões de cards adjacentes fiquem em alturas diferentes ("efeito escada"), a menos que exista um `height: 100%` com `justify-content: space-between` governado pela plataforma.
3. **Obstrução de Seletores CSS e Falha Silenciosa de Estilização no Consumidor (*Wrapper Obstruction*):**
   - Como a biblioteca insere um wrapper `<div class="prx-rich-node [className]">` envolvendo `<div class="prx-rich-compose">`, qualquer consumidor que tente aplicar classes utilitárias modernas (como Tailwind `grid grid-cols-3` ou CSS Grid customizado) falha silenciosamente, pois o grid é aplicado ao wrapper que contém apenas 1 filho (o compose). Isso gera enorme frustração e força o uso de seletores complexos via `::ng-deep`.
4. **Impossibilidade Declarativa de Layouts Proporcionais (*Master-Detail / Painel Lateral*):**
   - É comum em dashboards ricos ter layouts compostos como: Coluna de Conteúdo Principal (70%) + Painel de Ações Rápidas/Timeline (30%). Com o contrato atual de `compose`, é impossível expressar essa proporcionalidade via JSON de forma limpa sem recorrer a hacks de CSS no app consumidor.

---

#### Proposta Canônica de Evolução da Plataforma

1. **Evolução do Contrato `RichComposeNode` em `@praxisui/core`:**
   Adicionar suporte explícito a `layout: 'grid'` e parâmetros de dimensionamento:
   ```typescript
   export interface RichComposeNode extends RichBlockBaseNode {
     type: 'compose';
     layout?: 'flex' | 'grid'; // Default: 'flex' (para compatibilidade retroativa)
     direction?: 'row' | 'column'; // Utilizado quando layout === 'flex'
     wrap?: boolean; // Utilizado quando layout === 'flex'
     columns?: number | 'auto-fit' | 'auto-fill'; // Utilizado quando layout === 'grid' (ex: 3, 'auto-fit')
     minColumnWidth?: string; // Utilizado em auto-fit (ex: '300px', '320px')
     gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
     alignItems?: 'stretch' | 'start' | 'center' | 'end'; // Default no grid: 'stretch'
   }
   ```
2. **Atualização do Template e CSS em `praxis-rich-content.ts`:**
   - No template, quando `node.layout === 'grid'`, aplicar classe `.prx-rich-compose--grid`:
     ```html
     @case ('compose') {
       <div
         class="prx-rich-compose"
         [class.prx-rich-compose--grid]="node.layout === 'grid'"
         [class.direction-column]="node.layout !== 'grid' && node.direction === 'column'"
         [class.wrap]="node.layout !== 'grid' && node.wrap === true"
         [style.gap]="resolveComposeGap(node)"
         [style.--prx-compose-columns]="resolveGridColumns(node)"
       >
         <ng-container *ngTemplateOutlet="renderNodes; context: { $implicit: node.items }"></ng-container>
       </div>
     }
     ```
   - No CSS nativo de `praxis-rich-content`:
     ```css
     .prx-rich-compose--grid {
       display: grid;
       grid-template-columns: var(--prx-compose-columns, repeat(auto-fit, minmax(280px, 1fr)));
       align-items: stretch;
       width: 100%;
     }
     .prx-rich-compose--grid > .prx-rich-node {
       display: flex;
       width: 100%;
       min-width: 0;
     }
     .prx-rich-compose--grid > .prx-rich-node > * {
       width: 100%;
       height: 100%;
       display: flex;
       flex-direction: column;
       justify-content: space-between;
     }
     ```

---

#### Matriz de Casos de Teste para o Agente da Plataforma

O agente responsável pela evolução da plataforma deve validar sua implementação contra esta matriz de cenários:

| ID do Teste | Cenário | Configuração do Nó no JSON | Critério de Aceite / Asserção |
| :--- | :--- | :--- | :--- |
| **TC-004-1** | **Grade Simétrica 3x2 (Caso Hero HQ)** | `{ type: 'compose', layout: 'grid', columns: 3, items: [ 6 actionCards com textos de tamanhos variados ] }` | - Exatamente 2 linhas com 3 colunas de largura idêntica.<br>- Nenhum card isolado na 3ª linha.<br>- Cards 4, 5 e 6 preenchem a linha 2 perfeitamente sem buracos à direita. |
| **TC-004-2** | **Alinhamento e Estiramento Vertical (`stretch`)** | `{ type: 'compose', layout: 'grid', columns: 3, items: [ Card com 1 linha de texto, Card com 5 linhas, Card com 2 linhas ] }` | - Todos os 3 cards na mesma linha possuem **exatamente a mesma altura total** (a altura do card com 5 linhas).<br>- Os botões inferiores (`actions`/CTA) ficam perfeitamente alinhados na mesma linha de base horizontal no fundo do card. |
| **TC-004-3** | **Responsividade com `columns: 'auto-fit'` e `minColumnWidth`** | `{ type: 'compose', layout: 'grid', columns: 'auto-fit', minColumnWidth: '320px', items: [ 6 cards ] }` | - Em tela larga (1440px): 3 colunas (2x3).<br>- Em tela média (800px): reorganiza automaticamente para 2 colunas (3x2), sem overflow.<br>- Em tela mobile (400px): reorganiza para 1 coluna (6x1). |
| **TC-004-4** | **Compatibilidade com Layout Flex Legado** | `{ type: 'compose', direction: 'row', wrap: true, items: [ badges / pills ] }` | - Nós `compose` sem a propriedade `layout` continuam operando em modo Flexbox tradicional sem regressão visual em botões e pílulas inline. |

---

* **Implementação Realizada na Plataforma (PR #543 / Commit `836445390`):**
  1. **Contrato Canônico (`@praxisui/core`):**
     - Novos tipos públicos `RichComposeLayout` (`'flex' | 'grid'`) e `RichComposeAlignItems` (`'stretch' | 'start' | 'center' | 'end'`).
     - Interface `RichComposeNode` expandida com:
       * `layout?: RichComposeLayout;` (default `'flex'`, garantindo 100% de compatibilidade retroativa)
       * `columns?: number | 'auto-fit' | 'auto-fill';` (colunas fixas ex: `3`, ou responsivas `'auto-fit'`/`'auto-fill'`)
       * `minColumnWidth?: string;` (largura mínima das colunas em auto-fit/auto-fill, default `'280px'`)
       * `alignItems?: RichComposeAlignItems;` (alinhamento dos filhos, padrão `'stretch'` no grid)
       * `items: RichBlockNode[];` (capacidade canônica de receber qualquer bloco rico como filho, incluindo `actionCard`, `card`, `statGroup`, etc.)
  2. **Runtime e CSS (`@praxisui/rich-content`):**
     - Template enriquecido com binding `.prx-rich-compose--grid`, variável CSS `--prx-compose-columns` computada com `repeat(...)`, atributo `data-layout` e `style.align-items`.
     - CSS nativo `.prx-rich-compose--grid`:
       ```css
       .prx-rich-compose--grid {
         display: grid;
         grid-template-columns: var(--prx-compose-columns, repeat(auto-fit, minmax(280px, 1fr)));
         align-items: stretch;
         width: 100%;
       }
       .prx-rich-compose--grid > .prx-rich-node {
         display: flex;
         width: 100%;
         min-width: 0;
         height: 100%;
       }
       .prx-rich-compose--grid > .prx-rich-node > * {
         width: 100%;
         height: 100%;
       }
       ```
  3. **Validação e Manifestos de IA:**
     - `RichContentDocumentValidator` valida `layout`, `columns` (inteiro positivo ou `'auto-fit'`/`'auto-fill'`), `minColumnWidth` e `alignItems`.
     - `RICH_CONTENT_AI_CAPABILITIES` e `PRAXIS_RICH_CONTENT_AUTHORING_MANIFEST` atualizados para authoring declarativo assistido por IA.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - O workaround de aplicar `className: 'hub-action-cards-grid'` e forçar `display: grid !important` na `div.prx-rich-compose` interna pode ser **completamente removido** de `src/styles/theme-praxis.scss` e dos componentes host.
  - Para obter a grade simétrica 3x2 sem itens órfãos (Caso Centros de Comando & Especialidades):
    ```json
    {
      "type": "compose",
      "layout": "grid",
      "columns": 3,
      "gap": "md",
      "items": [
        { "type": "actionCard", "title": "Operações Táticas", ... },
        { "type": "actionCard", "title": "Inteligência Estratégica", ... },
        { "type": "actionCard", "title": "Logística Global", ... },
        { "type": "actionCard", "title": "Comunicações Seguras", ... },
        { "type": "actionCard", "title": "Recursos Humanos", ... },
        { "type": "actionCard", "title": "Segurança da Informação", ... }
      ]
    }
    ```
  - Para grade auto-responsiva adaptável de mobile a widescreen:
    ```json
    {
      "type": "compose",
      "layout": "grid",
      "columns": "auto-fit",
      "minColumnWidth": "320px",
      "gap": "md",
      "items": [ ... ]
    }
    ```

---

### ISSUE-005: Harmonização de Tokens Semânticos de Cores Entre Nós (`statGroup` vs `timeline` vs `badge`)
* **Biblioteca:** `@praxisui/core` & `@praxisui/rich-content`
* **Status:** `[DONE]`
* **Gravidade:** Baixa / DX (Assimetria de tipagem)
* **Diagnóstico Técnico:**
  Havia discrepâncias entre as uniões de cores dos diferentes nós:
  - `RichStatItem.tone`: `'neutral' | 'info' | 'success' | 'warning' | 'danger'`
  - `RichTimelineItem.markerColor`: `'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'`
  O termo `'danger'` vs `'error'` e a ausência dos tons institucionais `'primary'`/`'secondary'` no `statGroup` exigiam transformações de contrato na borda do frontend.
* **Implementação Realizada na Plataforma (PR #545):**
  1. **Contrato Canônico (`@praxisui/core`):**
     - Criado o tipo semântico unificado canônico em `rich-content.model.ts`:
       ```typescript
       export type RichSemanticTone =
         | 'primary'
         | 'secondary'
         | 'tertiary'
         | 'info'
         | 'success'
         | 'warning'
         | 'danger'
         | 'error'
         | 'neutral';
       ```
     - `RichBadgeTone`, `RichStatTone` e `RichTimelineColor` foram redefinidos como aliases canônicos de `RichSemanticTone`.
     - Todos os nós que suportam tons e cores semânticas (`RichBadgeNode.tone`, `RichStatItem.tone`, `RichTimelineNode.connectorColor`, `RichTimelineNode.markerColor`, `RichTimelineItem.markerColor`, `RichTimelineItem.connectorColor`) agora aceitam os mesmos 9 valores semânticos de forma 100% harmonizada e fortemente tipada.
  2. **Renderizador e Estilos (`@praxisui/rich-content`):**
     - Normalização inteligente: `resolveTimelineColor` aceita os 9 tons e normaliza `'danger'` para `'error'`, enquanto o CSS de timeline suporta seletores para ambas as convenções (`--marker-color-error` e `--marker-color-danger`, `--connector-color-error` e `--connector-color-danger`).
     - `statGroup` agora renderiza nativamente os tons institucionais `primary`, `secondary`, `tertiary` e `neutral`, além de aceitar tanto `danger` quanto `error` para estados críticos.
     - `badge` e `progress` (em stat items) expandidos com suporte a `primary`, `secondary`, `tertiary`, `danger` e `error`.
  3. **Validação, i18n e Manifestos de IA:**
     - `RichContentDocumentValidator` valida todos os 9 tons semânticos em `badge`, `statGroup`, `progress` e `timeline`.
     - `PRAXIS_RICH_CONTENT_AUTHORING_MANIFEST` atualizado com `'danger'` para authoring declarativo assistido por IA.
     - Editor visual de configuração (`praxis-rich-content-config-editor.ts`) atualizado com todos os seletores e chaves de i18n correspondentes em `en-US` e `pt-BR`.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - Não é mais necessário fazer mapeamentos manuais entre `'danger'` e `'error'` nem contornar tipagens na borda do frontend.
  - Pode-se utilizar livremente qualquer um dos 9 tons semânticos (`primary`, `secondary`, `tertiary`, `info`, `success`, `warning`, `danger`, `error`, `neutral`) em itens de `statGroup`, nós de `timeline` e nós de `badge`.

---

### ISSUE-006: Interatividade e Callbacks de Ação Nativos em Itens de `statGroup` e `timeline`
* **Biblioteca:** `@praxisui/rich-content` & `@praxisui/core`
* **Status:** `[DONE]`
* **Gravidade:** Média (Permite dashboards dinâmicos orientados a drilldown)
* **Diagnóstico Técnico:**
  Os cartões de estatísticas (`statGroup.items`) e eventos de linha do tempo (`timeline.items`) eram puramente estáticos e somente leitura, sem suporte a `action?: RichActionRef` nem emissão de eventos interativos para drilldown no host.
* **Implementação Realizada na Plataforma (PR #545):**
  1. **Contrato Canônico (`@praxisui/core`):**
     - Adicionado campo opcional `action?: RichActionRef;` às interfaces `RichStatItem` e `RichTimelineItem`.
  2. **Componente e Emissão de Eventos (`@praxisui/rich-content`):**
     - Adicionado output público `@Output() nodeAction = new EventEmitter<RichActionRef>();` em `PraxisRichContent`.
     - `dispatchRichAction(action: RichActionRef)` dispara centralizadamente `this.nodeAction.emit(action)`, permitindo que o consumidor capture interações de qualquer nó (`statGroup`, `timeline`, `actionCard`, `card`, etc.) via `(nodeAction)="onNodeAction($event)"`.
     - `statGroup`: Quando `item.action` está presente, o elemento recebe:
       * Classe `.prx-rich-stat-group__item--actionable`
       * Acessibilidade completa: `role="button"`, `tabindex="0"` (ou `tabindex="-1"` se desabilitado), `aria-disabled="false"` (ou `"true"`)
       * Suporte a teclado: `(keydown.enter)` e `(keydown.space)` disparam a ação de forma nativa.
       * Microinterações de `:hover`, `:focus-visible` e `:active` com elevação sutil e transições suaves (`prefers-reduced-motion` respeitado).
     - `timeline`: Quando `item.action` está presente, o corpo do evento (`.prx-rich-timeline__item-body`) recebe:
       * Classe `.prx-rich-timeline__item-body--actionable`
       * Acessibilidade completa: `role="button"`, `tabindex="0"` (ou `tabindex="-1"` se desabilitado), `aria-disabled="false"` (ou `"true"`)
       * Suporte a teclado: `(keydown.enter)` e `(keydown.space)` disparam a ação.
       * Microinterações de `:hover`, `:focus-visible` e `:active` no corpo do evento.
     - Respeito à governança de permissões / capabilities: se a ação estiver desabilitada pelo host via `hostCapabilities`, a interação é bloqueada, `aria-disabled="true"` e a classe `--disabled` são aplicadas.
  3. **Validação e Manifestos de IA:**
     - `RichContentDocumentValidator` valida a estrutura de `action` em itens de `statGroup` e `timeline`.
     - Manifestos de IA e editor visual suportam a propriedade `action` em itens de timeline e métricas.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - No template Angular do host, ouça o output `nodeAction`:
    ```html
    <prx-rich-content
      [document]="doc"
      (nodeAction)="handleRichAction($event)"
    ></prx-rich-content>
    ```
  - Nos documentos JSON de `statGroup`, adicione `action` diretamente nos itens para criar cards de KPI clicáveis:
    ```json
    {
      "type": "statGroup",
      "title": "Métricas da Liga",
      "items": [
        {
          "label": "Heróis Ativos",
          "value": "12",
          "tone": "primary",
          "action": {
            "actionId": "heroes.filter",
            "payload": { "status": "active" }
          }
        }
      ]
    }
    ```
  - Em `timeline`, adicione `action` em qualquer item para permitir drilldown no histórico de eventos ou missões:
    ```json
    {
      "type": "timeline",
      "title": "Histórico de Missões",
      "items": [
        {
          "id": "op-dawn",
          "title": "Operação Portão do Alvorecer",
          "markerColor": "primary",
          "action": {
            "actionId": "mission.details",
            "payload": { "missionId": "op-dawn" }
          }
        }
      ]
    }
    ```

---

### ISSUE-007: Binding Reativo Granular para Atualização de Widgets sem Rerender do Canvas
* **Biblioteca:** `@praxisui/page-builder` & `@praxisui/core`
* **Status:** `[DONE]`
* **Gravidade:** Alta (Eficiência e desempenho crítico em dashboards operacionais e telemetria em tempo real)
* **Diagnóstico Técnico & Limitação Prévia:**
  1. No `DynamicWidgetPageComponent` e `DynamicPageBuilderComponent`, a atualização de entradas (`inputs`) de widgets requeria a substituição do objeto `page` inteiro (`WidgetPageDefinition`) ou disparava o ciclo completo de recálculo responsivo e reconstrução de layout do canvas.
  2. A serialização ingênua via `JSON.parse(JSON.stringify(page))` nos motores de composição (`CompositionRuntimeEngine`, `WidgetPageCompositionFactory`, `WidgetPageCompositionSerialization`) e nos métodos de clonagem do builder destruía referências a Angular Signals (convertendo funções em `undefined`) e Observables (transformando-os em objetos mortos).
  3. Não existiam métodos públicos imperativos para injetar valores ou patches de entradas diretamente em um widget específico pelo seu `widgetKey`.
* **Implementação Realizada na Plataforma (PR #546 / Commit `8003aa6e6`):**
  1. **Diretiva de Carregamento Reativo (`DynamicWidgetLoaderDirective` em `@praxisui/core`):**
     - Suporte nativo e transparente a Angular Signals (`isSignal(inputVal)`): configurado `effect()` reativo vinculado ao injector do nó para propagar automaticamente novas emissões ao `ComponentRef.setInput()`.
     - Suporte nativo a RxJS Observables e Subscribables (`isObservable(inputVal)` ou `isSubscribable(inputVal)`): subscrição automática gerenciada pelo ciclo de vida da diretiva, com desinscrição e limpeza rigorosa no `ngOnDestroy` e re-binding seguro quando o input é substituído.
     - Suporte a métodos imperativos granulares `setInput(inputName, value)` e `patchInputs(inputPatch)` no próprio loader, desembrulhando fontes reativas se fornecidas.
  2. **APIs Públicas Granulares (`DynamicWidgetPageComponent` & `DynamicPageBuilderComponent`):**
     - `setWidgetInput(widgetKey: string, inputName: string, value: unknown): boolean`: localiza o loader do widget alvo pelo `widgetKey` e atualiza isoladamente o input via `loader.setInput()`, mantendo o snapshot em memória sincronizado sem remontar o DOM, sem recalcular breakpoints responsivos e sem afetar widgets vizinhos.
     - `patchWidgetInputs(widgetKey: string, inputPatch: Record<string, unknown>): boolean`: aplica um conjunto de alterações de entrada de uma só vez de forma isolada.
  3. **Preservação de Referências Vivas em Motores de Composição & Clonagem:**
     - `DynamicPageBuilderComponent.clonePagePreservingInputs` e `cloneInputsPreservingLiveReferences`: algoritmo recursivo que preserva Signals, Observables, Subscribables e funções em `definition.inputs`.
     - `CompositionRuntimeEngine.cloneJson`, `WidgetPageCompositionFactory.clone` e `WidgetPageCompositionSerialization.clone`: algoritmos atualizados para preservar instâncias reativas vivas sem passar por serialização destrutiva de JSON.
  4. **Normalização Limpa de Estado:**
     - `WidgetPageStateRuntimeService.normalizeState` e `clonePageDefinition`: omissão explícita de chaves `schema` e `derived` quando não fornecidas, evitando inserção de propriedades espúrias `{ schema: undefined, derived: undefined }`.
  5. **Correção Visual no Connection Editor:**
     - `connection.id` exibido na linha da dock do editor de conexões, garantindo visibilidade independente de densidade visual.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - **Modo Reativo Declarativo (Signals & Observables):** Pode-se declarar fontes reativas vivas diretamente no objeto `definition.inputs`:
    ```typescript
    const heroTelemetry$ = new BehaviorSubject({ radarSpeed: 'fast', activeTargets: 14 });
    const liveAlerts = signal(['Alpha-1', 'Bravo-7']);

    pageDefinition: WidgetPageDefinition = {
      widgets: [
        {
          key: 'telemetry-widget',
          definition: {
            id: 'hero-tactical-radar',
            inputs: {
              data: heroTelemetry$,
              alerts: liveAlerts,
            },
          },
        },
      ],
      ...
    };
    ```
    O widget renderizado receberá atualizações em tempo real a cada `heroTelemetry$.next(...)` ou `liveAlerts.set(...)` sem nenhum flicker, sem recriação do componente e sem recálculo do canvas.
  - **Modo Imperativo Granular (via ViewChild):**
    ```typescript
    @ViewChild(DynamicPageBuilderComponent) pageBuilder!: DynamicPageBuilderComponent;

    // Atualiza um único input isoladamente:
    this.pageBuilder.setWidgetInput('telemetry-widget', 'radarSpeed', 'ultra-fast');

    // Aplica patch em lote de inputs:
    this.pageBuilder.patchWidgetInputs('telemetry-widget', {
      radarSpeed: 'normal',
      activeTargets: 22,
    });
    ```

---

### ISSUE-008: Exportação Pública Padronizada (`PraxisRichContent` vs `PraxisRichContentComponent`)
* **Biblioteca:** `@praxisui/rich-content`
* **Status:** `[DONE]`
* **Gravidade:** Baixa / Consistência
* **Diagnóstico Técnico:**
  Enquanto todas as outras bibliotecas da plataforma exportavam seus componentes com sufixo `Component` (`PraxisCrudComponent`, `PraxisChartComponent`, `DynamicPageBuilderComponent`), a biblioteca `@praxisui/rich-content` exportava apenas como `PraxisRichContent`, gerando dúvidas sobre a convenção de nomenclatura.
* **Implementação Realizada na Plataforma:**
  1. **Exportação Canônica (`@praxisui/rich-content`):**
     - Em `projects/praxis-rich-content/src/public-api.ts` e no módulo de runtime `praxis-rich-content.ts`, exportado explicitamente:
       ```typescript
       export { PraxisRichContent, PraxisRichContent as PraxisRichContentComponent };
       ```
     - Validado com teste unitário garantindo identidade estrita de tipo (`expect(PraxisRichContentComponent).toBe(PraxisRichContent)`).
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - Aplicações consumidoras podem importar o componente usando qualquer um dos nomes canônicos:
    ```typescript
    import { PraxisRichContentComponent } from '@praxisui/rich-content';
    ```
    Ou:
    ```typescript
    import { PraxisRichContent } from '@praxisui/rich-content';
    ```

---

### ISSUE-009: Suporte a Telemetria e Animações Vetoriais em `RichCardMedia`
* **Biblioteca:** `@praxisui/rich-content` & `@praxisui/core`
* **Status:** `[DONE]`
* **Gravidade:** Média (Permite dashboards de comando, monitoramento e centros táticos governados por schema sem CSS ad-hoc)
* **Diagnóstico Técnico & Limitação Prévia:**
  O contrato `RichCardMedia` suportava exclusivamente `kind: 'image' | 'video' | 'icon' | 'avatar'`. Aplicações de comando e monitoramento (como o radar do Hero HQ) exibiam scanners táticos via pseudo-elementos e classes CSS proprietárias externas (`.radar-sweep`).
* **Implementação Realizada na Plataforma:**
  1. **Contrato Canônico (`@praxisui/core`):**
     - `RichCardMediaKind` expandido com `'telemetry' | 'lottie'`.
     - Criada interface canônica `RichCardMediaTelemetry`:
       ```typescript
       export interface RichCardMediaTelemetry {
         variant?: 'radar' | 'pulse' | 'wave' | 'signal';
         speed?: 'slow' | 'normal' | 'fast';
         color?: string;
         interactive?: boolean;
       }
       ```
     - Adicionados campos `telemetry?: RichCardMediaTelemetry;` e `animationSrc?: string;` em `RichCardMedia`.
  2. **Renderizador e Animações (`@praxisui/rich-content`):**
     - Renderizador vetorial nativo no template de card com 4 variantes:
       * `radar`: Anéis concêntricos vetoriais e varredura rotativa contínua (`.prx-rich-card__telemetry-sweep`).
       * `pulse`: Emissão de pulso por ondas concêntricas expansivas.
       * `wave`: Ondulação oscilatória com delays harmônicos escalonados.
       * `signal`: Barras verticais dinâmicas simulando medidor de espectro/sinal.
     - Ícone central opcional (`media.icon`) sobreposto ao indicador de telemetria com profundidade visual.
     - **Acessibilidade & Motion Guard:** `@media (prefers-reduced-motion: reduce)` integrado estritamente, parando rotações contínuas para usuários com sensibilidade vestibular.
     - Validação completa no schema de autoria (`RichContentDocumentValidator`), manifesto de IA e no editor visual de configuração (`PraxisRichContentConfigEditor`).
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - O workaround com classe `.radar-sweep` customizada em CSS externo pode ser **removido**.
  - No JSON do Banner Tático:
    ```json
    "media": {
      "kind": "telemetry",
      "icon": "radar",
      "position": "end",
      "telemetry": {
        "variant": "radar",
        "speed": "normal"
      }
    }
    ```
* **Perguntas / Alinhamento para o Agente do Hero HQ:**
  - Deseja que o radar emita eventos ao clicar quando `interactive: true` for definido, ou apenas represente feedback visual de monitoramento operacional?

---

### ISSUE-010: Ausência de Indicador de Progresso Integrado em `RichStatItem` (`statGroup`)
* **Biblioteca:** `@praxisui/rich-content` & `@praxisui/core`
* **Status:** `[DONE]`
* **Gravidade:** Média (Permite KPIs executivos e cards de meta unificados em um único nó declarativo)
* **Diagnóstico Técnico & Limitação Prévia:**
  O nó `statGroup` aceitava em seus itens apenas `{ id, label, value, caption, icon, tone }`. Para exibir uma barra ou anel de progresso percentual, o desenvolvedor era forçado a quebrar o agrupamento em múltiplos cards individuais usando `RichProgressNode` avulso dentro de `card.content`, destruindo a coesão do grid de métricas.
* **Implementação Realizada na Plataforma:**
  1. **Contrato Canônico (`@praxisui/core`):**
     - Criada interface canônica `RichStatItemProgress`:
       ```typescript
       export interface RichStatItemProgress {
         value: number;
         valueExpr?: string;
         max?: number;
         showPercent?: boolean;
         variant?: 'bar' | 'ring';
         tone?: RichStatTone;
       }
       ```
     - Adicionado campo opcional `progress?: RichStatItemProgress;` em `RichStatItem`.
  2. **Renderizador e Estilos (`@praxisui/rich-content`):**
     - Renderizador dual de progresso em `.prx-rich-stat-group__item-content`:
       * `variant: 'bar'` (padrão): Barra nativa `<progress>` com estilização harmonizada e tokens de tom (`[attr.data-tone]`).
       * `variant: 'ring'`: Anel circular vetorial SVG com `stroke-dasharray` e `stroke-dashoffset` calculados reativamente com base em `value` e `max` (padrão 100), com clamp seguro para evitar quebras em valores anômalos.
     - Suporte a rótulo percentual opcional (`showPercent: true`).
     - Suporte a expressão dinâmica `valueExpr` avaliada pelo motor de expressões da página.
     - Validação completa no schema de documento, manifesto de IA e controles no editor visual de configuração.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - KPIs com metas ou barras de progresso (ex: "Capacidade Operacional: 82%", "Índice de Prontidão: 94%") agora podem ser declarados diretamente no array `items` de um único nó `statGroup`:
    ```json
    {
      "id": "operational-capacity",
      "label": "Capacidade Operacional",
      "value": "82%",
      "progress": {
        "value": 82,
        "max": 100,
        "variant": "bar",
        "tone": "primary"
      }
    }
    ```
* **Perguntas / Alinhamento para o Agente do Hero HQ:**
  - Há necessidade no Hero HQ de múltiplos indicadores de progresso por stat item (ex: barra secundária de meta planejada vs realizada) ou a estrutura atual de progresso único por item atende integralmente todos os KPIs?

---

### ISSUE-011: Ação Canônica de Navegação SPA para Botões do `praxis-rich-content`
* **Biblioteca:** `@praxisui/core` & `@praxisui/rich-content`
* **Status:** `[DONE]`
* **Gravidade:** Alta (Desacoplamento e eliminação de boilerplate de navegação nos hosts consumidores)
* **Diagnóstico Técnico & Limitação Prévia:**
  Quando botões de ação (`RichActionButtonNode`) disparavam `navigation.navigate` ou `praxis:router.navigate`, o botão não navegava a menos que a aplicação hospedeira implementasse manualmente um listener ou fornecesse `hostCapabilities.dispatchAction`. Sem isso, o botão exigia recarregamento tradicional via `href`, quebrando a transição de SPA.
* **Implementação Realizada na Plataforma:**
  1. **Motor de Ações Canônico (`@praxisui/core` / `GlobalActionService`):**
     - Função `buildNavigationUrl` expandida para aceitar tanto `NavigationOpenRoutePayload` completo quanto `string` direta (ex: `"/operations/alerts"`). Extrai automaticamente path, query params (`?`) e fragment (`#`).
     - Registrados aliases canônicos: `navigation.navigate` e `praxis:router.navigate` mapeados diretamente para a infraestrutura de `navigation.openRoute`.
     - Suporte completo a navegação via Angular Router se provido no injector, com fallback graceful para browser history/location.
  2. **Fallback Autônomo (`@praxisui/rich-content` / `PraxisRichContent`):**
     - `PraxisRichContent` agora injeta opcionalmente `GlobalActionService`. Se o componente host não passar `hostCapabilities.dispatchAction` (ou se o host não interceptar a ação), o componente executa a navegação autonomamente através do `GlobalActionService`.
     - Método `isActionButtonDisabled` atualizado para verificar a prontidão da ação no `GlobalActionService`, garantindo que o botão fique habilitado e navegável out-of-the-box.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - Os botões em cards e banners agora podem usar diretamente qualquer uma das assinaturas canônicas sem necessidade de listeners manuais no host:
    ```json
    "action": {
      "actionId": "praxis:router.navigate",
      "payload": "/hero/patrol"
    }
    ```
    Ou com objeto detalhado:
    ```json
    "action": {
      "actionId": "navigation.openRoute",
      "payload": {
        "route": "/hero/missions",
        "queryParams": { "filter": "active" }
      }
    }
    ```
* **Perguntas / Alinhamento para o Agente do Hero HQ:**
  - Existem fluxos que necessitam de confirmação prévia (ex: `confirmDialog: true` antes de navegar) ou guards condicionais de navegação no documento declarativo?

---

### ISSUE-012: Falta de Estilo 'glass' Nativo nos Presets de `WidgetShell`
* **Biblioteca:** `@praxisui/core` & `@praxisui/page-builder`
* **Status:** `[DONE]`
* **Gravidade:** Média (Permite interfaces modernas e executivas com transparência e blur governados por tokens corporativos)
* **Diagnóstico Técnico & Limitação Prévia:**
  Os presets de `WidgetShellComponent` eram limitados a estilos opacos do Material Design (`dashboard-card`, `panel`, `tile`, `naked`). Para aplicar a estética de Glassmorphism (fundos translúcidos com desfoque e bordas reflexivas com OKLCH), os desenvolvedores eram obrigados a usar `shell.kind: 'naked'` e injetar CSS global com `!important` para sobrescrever as cascas dos widgets.
* **Implementação Realizada na Plataforma:**
  1. **Contrato Canônico (`@praxisui/core` / `WidgetShellConfig`):**
     - Adicionado campo opcional `backdropFilter?: string` em `appearance.card`.
     - Adicionados presets canônicos em `BUILTIN_SHELL_PRESETS`:
       * `'glass-dark'`: Fundo com `color-mix(in srgb, var(--md-sys-color-surface, #0f172a) 60%, transparent)`, borda sutil com `color-mix`, `backdropFilter: 'blur(12px)'`, sombras difusas e cabeçalho integrado.
       * `'glass-light'`: Fundo com `color-mix(in srgb, var(--md-sys-color-surface, #ffffff) 65%, transparent)`, borda sutil com `color-mix`, `backdropFilter: 'blur(12px)'`.
  2. **Renderizador de Casca (`@praxisui/core` / `WidgetShellComponent`):**
     - Mapeamento dinâmico da CSS variable `--pdx-shell-card-backdrop-filter`.
     - Inclusão de `backdrop-filter` e `-webkit-backdrop-filter` com fallback nativo em `.pdx-shell.dashboard`.
  3. **Editor Visual (`@praxisui/page-builder` / `WidgetShellEditorComponent`):**
     - Inclusão dos presets `glass-dark` e `glass-light` na lista de seleção.
     - Adicionado controle de formulário reativo para `cardBackdropFilter` com validação segura de sintaxe CSS (`cssDeclarationValidator('backdrop-filter')`).
     - Pré-visualização ao vivo com reflexo imediato no preview canvas.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - Remover qualquer regra de CSS global que tente forçar `backdrop-filter` e background translúcido sobre o widget shell.
  - No `WidgetPageDefinition` ou na configuração do widget no Page Builder:
    ```json
    "shell": {
      "kind": "dashboard-card",
      "preset": "glass-dark"
    }
    ```
    Ou customizado diretamente:
    ```json
    "shell": {
      "appearance": {
        "card": {
          "background": "rgba(15, 23, 42, 0.65)",
          "backdropFilter": "blur(16px)"
        }
      }
    }
    ```
* **Perguntas / Alinhamento para o Agente do Hero HQ:**
  - Além de `blur()`, há necessidade de suportar outros filtros combinados nos presets (como `saturate(180%)`) ou o desfoque gaussiano de 12px a 16px atende com fidelidade a identidade visual do projeto?

---

### ISSUE-013: Layout Vertical, Espaçamento de Rodapé (`margin-top: auto`) e Microinterações de `:hover`/`:focus-visible` Nativos em `RichActionCardNode`
* **Biblioteca:** `@praxisui/rich-content` / `@praxisui/core`
* **Status:** `[DONE]`
* **Gravidade:** Alta (Degradação de usabilidade, quebra de ritmo vertical e ausência de feedback interativo na principal CTA de navegação)
* **Diagnóstico Técnico & Evidência Real:**
  No template de `RichActionCardNode` em `praxis-rich-content.ts` (linhas 1123–1160):
  ```html
  <section class="prx-rich-action-card">
    <div class="prx-rich-action-card__copy">
      <div class="prx-rich-action-card__title-row">
        @if (node.icon) {
          <span class="prx-rich-action-card__icon material-symbols-outlined">{{ node.icon }}</span>
        }
        @if (resolveActionCardTitle(node); as actionCardTitle) {
          <div class="prx-rich-action-card__title">{{ actionCardTitle }}</div>
        }
      </div>
      @if (resolveActionCardSubtitle(node); as actionCardSubtitle) {
        <div class="prx-rich-action-card__subtitle">{{ actionCardSubtitle }}</div>
      }
      @if (resolveActionCardMessage(node); as actionCardMessage) {
        <div class="prx-rich-action-card__message">{{ actionCardMessage }}</div>
      }
      @if (resolveActionCardMeta(node); as actionCardMeta) {
        <div class="prx-rich-action-card__meta">{{ actionCardMeta }}</div>
      }
    </div>
    <div class="prx-rich-action-card__actions">
      <button type="button" class="prx-rich-action-button" ...>
        @if (node.ctaIcon) {
          <span class="prx-rich-action-button__icon material-symbols-outlined">{{ node.ctaIcon }}</span>
        }
        <span>{{ resolveActionCardCtaLabel(node) }}</span>
      </button>
    </div>
  </section>
  ```
  Entretanto, duas falhas estruturais ocorrem na biblioteca canônica:
  1. **Ausência Total de Folha de Estilos para `.prx-rich-action-card`:**
     - No bloco de `styles` de `praxis-rich-content.ts`, **não há nenhuma regra CSS** para `.prx-rich-action-card`, `.prx-rich-action-card__copy` ou `.prx-rich-action-card__actions`.
     - Como `<section>` é um elemento de bloco sem flexbox nativo, o container não preenche 100% da altura da célula da grade e não distribui o espaço vertical.
     - A div `.prx-rich-action-card__actions` não possui `margin-top: auto` nem padding superior, ficando colada a meros ~2px de distância da última linha do subtítulo descritivo.
     - Em cards adjacentes onde um card tem 2 linhas de descrição e outro tem 3 linhas, os botões ficam em alturas verticais desalinhadas ("efeito escada"), destruindo a simetria visual do dashboard.
  2. **Botão Inanimado sem Estados de `:hover` ou `:focus-visible`:**
     - A classe `.prx-rich-action-button` (linhas 2908–2928) possui apenas estilos estáticos:
       ```css
       .prx-rich-action-button {
         appearance: none;
         border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
         border-radius: 999px;
         background: var(--md-sys-color-surface, #fff);
         color: var(--md-sys-color-on-surface, #1d1b20);
         padding: 8px 12px;
         cursor: pointer;
       }
       .prx-rich-action-button:disabled { opacity: 0.56; cursor: default; }
       ```
     - **Não há `:hover`, `:active` ou `:focus-visible` definidos.**
     - Quando o usuário posiciona o cursor sobre o botão "Acessar RH" ou "Operações", o botão permanece estático (sem alteração de contraste, sem elevação e sem microinteração no ícone de seta), não comunicando que se trata de um elemento interativo acionável.
* **Proposta Canônica de Evolução da Plataforma:**
  1. **Estilos Canônicos em `praxis-rich-content.ts`:**
     ```css
     .prx-rich-action-card {
       display: flex;
       flex-direction: column;
       justify-content: space-between;
       height: 100%;
       min-height: 140px;
     }

     .prx-rich-action-card__copy {
       display: flex;
       flex-direction: column;
       flex: 1 1 auto;
       margin-bottom: 16px;
     }

     .prx-rich-action-card__title-row {
       display: flex;
       align-items: center;
       gap: 10px;
       margin-bottom: 8px;
     }

     .prx-rich-action-card__actions {
       margin-top: auto;
       padding-top: 16px;
       display: flex;
       align-items: center;
       justify-content: flex-start;
     }

     .prx-rich-action-button {
       transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
     }

     .prx-rich-action-button:hover:not(:disabled) {
       background: var(--md-sys-color-primary, #006a6a);
       color: var(--md-sys-color-on-primary, #ffffff);
       border-color: var(--md-sys-color-primary, #006a6a);
       box-shadow: var(--md-sys-elevation-level1);
       transform: translateY(-1px);
     }

     .prx-rich-action-button:focus-visible {
       outline: 2px solid var(--md-sys-color-primary, #006a6a);
       outline-offset: 2px;
     }

     .prx-rich-action-button:active:not(:disabled) {
       transform: translateY(0);
     }
     ```
  2. **Evolução de Contrato em `RichActionCardNode` (`@praxisui/core`):**
     ```typescript
     export interface RichActionCardNode extends RichBlockBaseNode {
       type: 'actionCard';
       title?: string;
       subtitle?: string;
       message?: string;
       meta?: string;
       icon?: string;
       ctaLabel?: string;
       ctaIcon?: string;
       ctaPlacement?: 'bottom' | 'inline' | 'trailing'; // Canônico (default: 'bottom')
       ctaVariant?: 'elevated' | 'stroked' | 'flat' | 'tonal';
       color?: 'primary' | 'accent' | 'warn';
     }
     ```
* **Implementação Realizada na Plataforma (PR #543 / Commit `836445390`):**
  1. **Contrato Canônico (`@praxisui/core`):**
     - Novos tipos públicos `RichActionCardCtaPlacement` (`'bottom' | 'inline' | 'trailing'`) e `RichActionCardCtaVariant` (`'elevated' | 'stroked' | 'flat' | 'tonal' | 'raised'`).
     - Interface `RichActionCardNode` expandida com as propriedades `ctaPlacement` e `ctaVariant`.
  2. **Layout Vertical e Alinhamento de Rodapé (`@praxisui/rich-content`):**
     - Folha de estilos completa para `.prx-rich-action-card`:
       ```css
       .prx-rich-action-card {
         display: flex;
         flex-direction: column;
         justify-content: space-between;
         height: 100%;
         min-height: 140px;
         box-sizing: border-box;
         border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
         border-radius: 16px;
         padding: 16px;
         background: var(--md-sys-color-surface, #fff);
         color: var(--md-sys-color-on-surface, #1d1b20);
       }
       .prx-rich-action-card__copy {
         display: flex;
         flex-direction: column;
         flex: 1 1 auto;
         margin-bottom: 16px;
       }
       .prx-rich-action-card__actions {
         margin-top: auto;
         padding-top: 12px;
         display: flex;
         align-items: center;
         gap: 8px;
         justify-content: flex-start;
         flex-wrap: wrap;
       }
       .prx-rich-action-card__actions[data-placement='trailing'] {
         justify-content: flex-end;
       }
       .prx-rich-action-card__actions[data-placement='inline'] {
         margin-top: 8px;
         padding-top: 0;
       }
       ```
     - O container agora se expande uniformemente para preencher 100% da altura da célula da grade e o rodapé (`.prx-rich-action-card__actions`) com `margin-top: auto` garante que todos os botões de ação permaneçam perfeitamente alinhados na mesma linha de base horizontal, eliminando de forma definitiva o "efeito escada".
  3. **Microinterações e Acessibilidade em `.prx-rich-action-button`:**
     - Adicionada transição suave de cores, borda, sombra e elevação:
       ```css
       .prx-rich-action-button {
         display: inline-flex;
         align-items: center;
         gap: 6px;
         transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
       }
       .prx-rich-action-button:hover:not(:disabled) {
         background: var(--md-sys-color-primary, #6750a4);
         color: var(--md-sys-color-on-primary, #fff);
         border-color: var(--md-sys-color-primary, #6750a4);
         box-shadow: var(--md-sys-elevation-level1, 0 1px 3px 1px rgba(0, 0, 0, 0.15));
         transform: translateY(-1px);
       }
       .prx-rich-action-button:focus-visible {
         outline: 2px solid var(--md-sys-color-primary, #6750a4);
         outline-offset: 2px;
       }
       .prx-rich-action-button:active:not(:disabled) {
         transform: translateY(0);
       }
       ```
     - Suporte completo às variantes visuais Material 3: `--raised`, `--stroked`, `--flat`, `--tonal` (secondary container), e `--elevated` (surface container com elevação).
     - Proteção para usuários com sensibilidade a movimento via `@media (prefers-reduced-motion: reduce)` desabilitando transições e transformações.
  4. **Validação:**
     - `RichContentDocumentValidator` valida `ctaPlacement` e `ctaVariant` contra seus respectivos tipos canônicos.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - O workaround de aplicar classes de host (como `.hub-card-action`) para forçar `height: 100%`, empurrar botões para a base com `margin-top: auto` ou sobrescrever `:hover` via `::ng-deep` pode ser **completamente removido**.
  - Declarar nós `actionCard` com a nova API expressiva:
    ```json
    {
      "type": "actionCard",
      "title": "Centro de Inteligência",
      "subtitle": "Operações táticas e análise estratégica",
      "icon": "shield",
      "ctaLabel": "Acessar Terminal",
      "ctaPlacement": "bottom",
      "ctaVariant": "tonal",
      "action": {
        "actionId": "praxis:router.navigate",
        "payload": "/intel"
      }
    }
    ```
    Ou para botão alinhado à direita com variante elevada:
    ```json
    {
      "type": "actionCard",
      "title": "Arsenal",
      "ctaLabel": "Ver Inventário",
      "ctaPlacement": "trailing",
      "ctaVariant": "elevated",
      "action": {
        "actionId": "praxis:router.navigate",
        "payload": "/armory"
      }
    }
    ```

---

### ISSUE-014: Governança Canônica de Temas — Ausência de Starter/Mixin SCSS e Fallbacks Material 3 Opacos em Ambientes Customizados
* **Biblioteca:** `@praxisui/core` / `@praxisui/*`
* **Status:** `[DONE]`
* **Gravidade:** Alta (Dificuldade de adoção por aplicações com design system moderno, proliferação de `::ng-deep` e inconsistência visual de componentes da plataforma)
* **Diagnóstico Técnico & Evidência Real:**
  1. A plataforma Praxis utiliza internamente uma combinação de namespaces de tokens CSS:
     - `--md-sys-color-*` (Material Design 3 tokens)
     - `--pdx-material-*` e `--pdx-overlay-*` (Praxis theme bridge)
     - `--pdx-page-*` e `--pdx-shell-*` (Page Builder e Widget Shell)
     - `--praxis-color-*` (Componentes legados como CRUD e Table)
  2. **Ausência de Starter/Mixin SCSS Exportado:**
     - O monorepo possuía apenas o arquivo estático `theme-bridge.css` em `@praxisui/core`, sem exportar mixins SCSS estruturados que permitissem à aplicação consumidora mapear suas variáveis de design de forma declarativa e com fallbacks dinâmicos.
  3. **Consequências Práticas Resolvidas:**
     - Aplicações com tokens modernos em OKLCH ou Tailwind (como Hero HQ) precisavam de centenas de linhas de CSS estático repetitivo.
     - Fallbacks opacos podiam gerar caixas brancas ou roxas inconsistentes.
* **Solução Canônica Implementada na Plataforma:**
  1. **Módulo de Theming Canônico em `@praxisui/core/theming`:**
     - Criado `projects/praxis-core/theming/_theming.scss` e `projects/praxis-core/theming/index.scss`.
     - Exportados mixins canônicos:
       * `@mixin define-praxis-theme($config: ())`: emite tokens de tema base (Light mode) mapeando tokens host ou fallbacks para `--md-sys-color-*`, `--mat-sys-*`, `--pdx-material-*`, `--pdx-page-*`, `--pdx-shell-*`, etc.
       * `@mixin praxis-dark-theme-overrides($config: ())`: emite overrides canônicos para modo escuro (`.dark`, `[data-theme="dark"]`, etc.).
       * `@mixin praxis-shell-styles()`: emite regras estruturais responsivas e superfície sólida para Widget Shell expandido/fullscreen e backdrop.
       * `@mixin praxis-tooltip-styles()`: emite refinamento enterprise de superfície sólida para Angular Material Tooltip.
       * `@mixin praxis-theme-bundle($config: (), $dark-config: (), $dark-selector: '.dark')`: atalho conveniência que inclui todos os mixins em uma única declaração.
  2. **Subpath Exports e Assets do Pacote:**
     - `projects/praxis-core/package.json` atualizado com exports para `./theming` (subpath Sass/style) e `./theming/*`.
     - `projects/praxis-core/ng-package.json` configurado com `"assets": [..., "./theming/**"]`.
  3. **Validação e Adoção Downstream:**
     - `praxis-hero-hq-ui/src/styles/theme-praxis.scss` refatorado para consumir diretamente:
       ```scss
       @use '@praxisui/core/theming' as praxis;

       :root {
         @include praxis.define-praxis-theme();
       }

       .dark {
         @include praxis.praxis-dark-theme-overrides();
       }

       @include praxis.praxis-shell-styles();
       @include praxis.praxis-tooltip-styles();
       ```
     - Validado com 100% de sucesso em `ng build` (`praxis-hero-hq-ui`) e 1870 testes unitários em `@praxisui/core`.

---

### ISSUE-015: Fundo Translúcido em Widgets Sobrepostos e Omissão do Modo de Inspeção de Janela ('expand') na Toolbar de WidgetShell
* **Biblioteca:** `@praxisui/core` (`WidgetShellComponent`, `widget-shell.model.ts`)
* **Status:** `[DONE]`
* **Gravidade:** Alta (Interferência visual crítica por vazamento de tela de fundo e confusão semântica de UX entre Tela Cheia Edge-to-Edge vs. Modal Flutuante de Inspeção)
* **Diagnóstico Técnico & Evidência Real:**
  Na investigação aprofundada do código-fonte compilado em `@praxisui/core@9.0.5-rc.10` e no monorepo, foram identificadas duas falhas estruturais independentes que originaram o problema visual relatado:

  1. **Falha de Superfície (Bug Crítico): Fundo Translúcido em Modos Sobrepostos (`fullscreen` e `expanded`):**
     - Em `WidgetShellComponent` (`widget-shell.component.ts`), as classes `.pdx-shell.fullscreen` e `.pdx-shell.expanded` **não possuem nenhuma declaração de `background` própria**.
     - Ambas herdam o `background` do estado de repouso em `.pdx-shell.dashboard`:
       ```css
       background: var(--pdx-shell-card-bg, var(--pdx-dashboard-card-bg, var(--md-sys-color-surface-container-low)));
       ```
     - A própria plataforma Praxis estimula e fornece presets translúcidos (`glass-dark`, `glass-light`), que utilizam `color-mix(..., transparent)`. Além disso, aplicações com identidade visual moderna (*Cyber Command*, *Glassmorphism*) utilizam `--pdx-shell-card-bg` semitransparente com desfoque.
     - Como o `praxis-chart` (ECharts) possui canvas 100% transparente por padrão, quando o widget entra em modo sobreposto, o container maximizado **continua translúcido**, e todo o dashboard subjacente (banners hero, cards bento, outros gráficos e sidebar) vaza sob o gráfico. O usuário vê textos e números colidindo diretamente com as curvas do gráfico, inutilizando a visualização.
     - *Nota arquitetural:* O repositório local de `praxis-ui-angular` tentou contornar isso recentemente adicionando `<div class="pdx-shell-overlay-surface">` com `background: var(--md-sys-color-surface)`. Porém, além de essa versão não estar publicada no npm (`9.0.5-rc.10`), criar uma `<div>` externa com `pointer-events: none` no mesmo z-index é um remendo tático frágil. A superfície opaca deve pertencer canonicamente à própria `<section class="pdx-shell">`.

  2. **Falha de UX e Contrato: Confusão Semântica entre "Fullscreen" (Edge-to-Edge) vs. "Expanded" (Modal de Inspeção com Respiro):**
     - A literatura e os padrões de UX (W3C HTML5 Fullscreen, Material Design 3, Nielsen Norman Group, Carbon Design System) distinguem dois comportamentos distintos:
       * **Fullscreen (Tela Cheia Autêntica):** Deve ser **Edge-to-Edge (`inset: 0; border-radius: 0`)**, cobrindo 100% do viewport do monitor. É essencial para telões de operação contínua (NOC / War Room), projeções em reuniões executivas e monitores com espaço útil crítico.
       * **Expanded / Focus View (Janela Flutuante de Inspeção):** Deve possuir **respiro perimetral (gap)**, cantos arredondados, sombra pronunciada e backdrop desfocado (`top: 10vh`, `width: 92vw`, etc.). Permite ao usuário inspecionar um gráfico com conforto e detalhe sem perder o contexto espacial do dashboard corporativo.
     - **A plataforma Praxis já possui o CSS do modo com respiro!** A classe `.pdx-shell.expanded` já está implementada:
       ```css
       .pdx-shell.expanded {
         position: fixed;
         top: 10vh;
         left: 50%;
         width: min(920px, 92vw);
         height: min(640px, 82vh);
         transform: translateX(-50%);
         z-index: var(--praxis-layer-widget-shell-expanded, 1290);
         box-shadow: var(--mat-elevation-level8);
       }
       ```
     - **Onde estava a falha de plataforma?**
       * O contrato `WidgetShellWindowActions` em `widget-shell.model.ts` continha apenas `collapsible?: boolean` e `fullscreen?: boolean`. **A propriedade `expandable?: boolean` havia sido omitida.**
       * O método `buildWindowActions()` em `widget-shell.component.ts` **não construía o botão da ação `expand`** (apenas `collapse` e `fullscreen`).
       * Consequentemente, o usuário era obrigado a clicar no botão `fullscreen`, que o projetava em um `inset: 0` forçado sem respiro.
       * Transformar o `fullscreen` canônico para ter `inset: 24px` seria um erro conceitual de plataforma, pois destruiria o suporte a telões de monitoramento (NOC). A solução correta é expor e governar os dois modos na API!

* **Implementação Realizada na Plataforma (PR #544 / Commit `8b1279d`):**
  1. **Contrato Canônico (`@praxisui/core` / `widget-shell.model.ts`):**
     - Interface `WidgetShellWindowActions` expandida:
       ```typescript
       export interface WidgetShellWindowActions {
         /** Show collapse/expand control in the header. */
         collapsible?: boolean;
         /** Show expand/restore-in-window inspection mode in the header. */
         expandable?: boolean;
         /** Show fullscreen toggle in the header. */
         fullscreen?: boolean;
         /** Preferred maximization mode when activating expand/fullscreen controls ('expand' or 'fullscreen'). Defaults to 'fullscreen'. */
         maximizeMode?: 'expand' | 'fullscreen';
       }
       ```
  2. **Internacionalização (`@praxisui/core` / `widget-shell.i18n.ts`):**
     - Adicionadas chaves para alternância de janela em `pt-BR` e `en-US`:
       * `pt-BR`: `'controls.expandWindow': 'Expandir em janela'`, `'controls.collapseWindow': 'Restaurar janela'`
       * `en-US`: `'controls.expandWindow': 'Expand window'`, `'controls.collapseWindow': 'Restore window'`
  3. **Construção e Renderização da Ação `expand` (`@praxisui/core` / `WidgetShellComponent`):**
     - No método `buildWindowActions()`:
       * Suporte completo à ação `expand` com ícones `ms:open_in_new` (abrir) e `ms:collapse_content` (restaurar janela).
       * Coordenação com `maximizeMode`: quando `maximizeMode: 'expand'`, ativa `expandable` e suprime `fullscreen` a menos que explicitamente `fullscreen: true`.
       * Quando ambos `expandable: true` e `fullscreen: true` estão ativos, ambos os botões aparecem com estados perfeitamente coordenados.
  4. **Superfície 100% Opaca e Respiro Interno no Fullscreen (`widget-shell.component.ts`):**
     - Adicionado estilo canônico para classes sobrepostas:
       ```css
       .pdx-shell.expanded,
       .pdx-shell.fullscreen {
         background: var(--pdx-shell-overlay-bg, var(--md-sys-color-surface, #ffffff));
         color: var(--md-sys-color-on-surface);
       }
       .pdx-shell.fullscreen > .pdx-shell-body {
         padding: var(--pdx-shell-fullscreen-body-padding, 24px);
       }
       ```
     - Garante que mesmo widgets com presets translúcidos (`glass-dark`, `glass-light`), fundos semitransparentes ou `kind="none"` possuam superfície sólida governada ao serem maximizados ou inspecionados em janela, sem vazamento do dashboard subjacente.
     - Respiro interno de 24px em tela cheia garante que eixos e tooltips de gráficos não colidam com as bordas físicas da tela.

* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - O workaround em `src/styles/theme-praxis.scss` que forçava `.pdx-shell.fullscreen { inset: 24px !important; border-radius: 20px !important; }` e `.pdx-shell.fullscreen, .pdx-shell.expanded { background: var(--card) !important; }` pode ser **completamente removido**.
  - No `WidgetPageDefinition` ou nos inputs de `WidgetShell`:
    * Para exibir o modo de inspeção em janela (modal centralizado com respiro):
      ```json
      "windowActions": {
        "expandable": true,
        "fullscreen": false
      }
      ```
    * Ou usando `maximizeMode`:
      ```json
      "windowActions": {
        "maximizeMode": "expand"
      }
      ```
    * Para oferecer ambos os controles ao usuário (inspecionar em janela OU tela cheia NOC):
      ```json
      "windowActions": {
        "expandable": true,
        "fullscreen": true
      }
      ```

---

### ISSUE-016: Ausência de Tokens Canônicos de Superfície Invertida e Tooltip no Theme Bridge (`--mat-sys-inverse-surface` e `--mat-tooltip-*`)
* **Biblioteca:** `@praxisui/core` (`theme-bridge.css`, `@praxisui/core/theming`)
* **Status:** `[DONE]`
* **Gravidade:** Alta (Quebra de visualização de acessibilidade e renderização de tooltips com fundo transparente em toda a plataforma)
* **Diagnóstico Técnico & Evidência Real:**
  Na captura de tela fornecida e na inspeção minuciosa dos estilos compilados em `@angular/material/tooltip` (v21 / M3 tokens), foi constatado que o elemento `.mat-mdc-tooltip-surface` é estilizado estritamente da seguinte forma:
  ```css
  .mat-mdc-tooltip-surface {
    background-color: var(--mat-tooltip-container-color, var(--mat-sys-inverse-surface));
    color: var(--mat-tooltip-supporting-text-color, var(--mat-sys-inverse-on-surface));
    border-radius: var(--mat-tooltip-container-shape, var(--mat-sys-corner-extra-small));
    font-family: var(--mat-tooltip-supporting-text-font, var(--mat-sys-body-small-font));
    font-size: var(--mat-tooltip-supporting-text-size, var(--mat-sys-body-small-size));
    font-weight: var(--mat-tooltip-supporting-text-weight, var(--mat-sys-body-small-weight));
    line-height: var(--mat-tooltip-supporting-text-line-height, var(--mat-sys-body-small-line-height));
    letter-spacing: var(--mat-tooltip-supporting-text-tracking, var(--mat-sys-body-small-tracking));
  }
  ```
  **O Mecanismo da Falha:**
  1. No CSS do Angular Material M3, **não há nenhum fallback de cor hexadecimal estático** (como `#313033` ou `#000000`) nas propriedades `background-color` ou `color` do tooltip.
  2. A regra tenta ler `var(--mat-tooltip-container-color)`. Se não encontrar, tenta `var(--mat-sys-inverse-surface)`.
  3. Se nenhum dos dois estiver definido, o valor da propriedade CSS torna-se inválido e cai no valor padrão do navegador: **`transparent`**.
  4. Da mesma forma, `color` herda a cor do elemento pai (o `body`), que é preto/cinza escuro no tema claro.
  5. O raio de borda cai em 0 e o tamanho da fonte herda do `body` (16px), gerando o efeito visual aberrante de letras pretas soltas flutuando no vácuo sem balão, sem contraste e sem legibilidade.
  
  **Onde estava a omissão da plataforma Praxis:**
  - Os componentes de `@praxisui/core`, `@praxisui/page-builder`, `@praxisui/rich-content` e `@praxisui/dynamic-form` utilizam amplamente a diretiva `matTooltip` (ex: botões de ação do widget shell, controles da barra do Page Builder, botões de ação rápida).
  - O arquivo canônico `theme-bridge.css` em `@praxisui/core`:
    * Mapeava apenas uma ponte unilateral para cores de superfície normal (`--md-sys-color-surface: var(--mat-sys-surface)`).
    * **OMITIA** os tokens de superfícies invertidas (`--md-sys-color-inverse-surface`, `--md-sys-color-inverse-on-surface`, `--mat-sys-inverse-surface`, `--mat-sys-inverse-on-surface`).
    * **OMITIA** os tokens específicos de componentes CDK Overlay (`--mat-tooltip-container-color`, `--mat-tooltip-supporting-text-color`, `--mat-tooltip-container-shape`, etc.).
  - Qualquer aplicação moderna que utilizasse seus próprios tokens de design sem importar o CSS pré-fabricado legado do Angular Material sofria com a quebra de contraste de todos os tooltips.

* **Implementação Realizada na Plataforma (PR #544 / Commit `8b1279d`):**
  1. **Atualização do `theme-bridge.css` em `@praxisui/core`:**
     - Adicionada a ponte canônica e os fallbacks seguros para superfícies invertidas e tooltips:
       ```css
       :root {
         /* Material 3 Inverse Surface System Tokens */
         --md-sys-color-inverse-surface: var(--mat-sys-inverse-surface, #313033);
         --md-sys-color-inverse-on-surface: var(--mat-sys-inverse-on-surface, #f4f0f4);

         /* Bidirectional Bridge to Angular Material M3 Tokens */
         --mat-sys-inverse-surface: var(--md-sys-color-inverse-surface, #313033);
         --mat-sys-inverse-on-surface: var(--md-sys-color-inverse-on-surface, #f4f0f4);
         --mat-sys-corner-extra-small: var(--radius-sm, 6px);
         --mat-sys-body-small-font: var(--md-sys-typescale-body-small-font, inherit);
         --mat-sys-body-small-size: 12px;
         --mat-sys-body-small-weight: 500;
         --mat-sys-body-small-line-height: 16px;

         /* Angular Material Tooltip Component Tokens */
         --mat-tooltip-container-color: var(--mat-sys-inverse-surface);
         --mat-tooltip-supporting-text-color: var(--mat-sys-inverse-on-surface);
         --mat-tooltip-container-shape: var(--mat-sys-corner-extra-small);
         --mat-tooltip-supporting-text-font: var(--mat-sys-body-small-font);
         --mat-tooltip-supporting-text-size: var(--mat-sys-body-small-size);
         --mat-tooltip-supporting-text-weight: var(--mat-sys-body-small-weight);
         --mat-tooltip-supporting-text-line-height: var(--mat-sys-body-small-line-height);
       }
       ```
     - Regras de overlay atualizadas para cobrir tanto o seletor clássico quanto o novo seletor Angular Material M3:
       ```css
       .cdk-overlay-container .mat-mdc-tooltip .mdc-tooltip__surface,
       .cdk-overlay-container .mat-mdc-tooltip-surface {
         background: var(--mat-tooltip-container-color, var(--md-sys-color-inverse-surface, #313033));
         color: var(--mat-tooltip-supporting-text-color, var(--md-sys-color-inverse-on-surface, #f4f0f4));
       }
       ```
  2. **Validação:**
     - Testes unitários em `projects/praxis-core/src/lib/tokens/theme-bridge.spec.ts` validando presença de cores não-transparentes e herança de tokens customizados.

* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - Aplicações que importam `@praxisui/core/theme-bridge.css` recebem imediatamente tooltips opacos, legíveis e com alto contraste, sem necessidade de hacks locais.
  - O workaround em `src/styles/theme-praxis.scss` que forçava classes manuais sobre `.mat-mdc-tooltip-surface` pode ser simplificado, mantendo apenas eventuais customizações estéticas finas de borda/blur se desejado pelo design do app.


---

### ISSUE-017: `RichCardMedia[kind='avatar']` ignora URL de imagem (`src`) e renderiza apenas iniciais com fallback nulo quando `label`/`alt` são omitidos
* **Biblioteca:** `@praxisui/rich-content`
* **Status:** `[DONE]`
* **Gravidade:** Média (Inconsistência visual em cabeçalhos de perfil e cards com avatar)
* **Diagnóstico Técnico:**
  No arquivo `praxis-rich-content.ts` (template `#cardMedia`), o ramo condicional `@else if (media.kind === 'avatar')` continha apenas:
  ```html
  <span
    class="prx-rich-card-media__avatar"
    [attr.aria-label]="resolveCardMediaLabel(media)"
  >
    {{ resolveCardMediaFallback(media) }}
  </span>
  ```
  1. **Omissão da tag `<img>`:** Mesmo que o desenvolvedor passasse `media.src` ou `media.srcExpr` apontando para a foto do colaborador, o componente ignorava a URL e não tentava renderizar a imagem.
  2. **Fallback nulo:** A função `resolveCardMediaFallback(media)` buscava o texto em `media.label` ou `media.alt`. Se o objeto JSON passasse apenas `{ kind: 'avatar', src: '...' }` (comum ao mapear DTOs de usuário), o fallback retornava string vazia `""`, renderizando uma bola redonda vazia sem foto e sem iniciais.
  3. **Contraste com `@praxisui/table`:** Na tabela, a coluna de avatar tenta renderizar a imagem `<img>` e recorre às iniciais apenas se `src` for nulo ou falhar. Em `RichCardMedia`, isso não existia.
* **Implementação Realizada na Plataforma:**
  1. **Renderização de Imagem com Fallback no Template (`#cardMedia`):**
     ```html
     @else if (media.kind === 'avatar') {
       <span
         class="prx-rich-card-media__avatar"
         [attr.aria-label]="resolveCardMediaLabel(media)"
       >
         @if (resolveCardMediaSrc(media); as avatarSrc) {
           @if (!isAvatarImageFailed(media)) {
             <img
               class="prx-rich-card-media__avatar-image"
               [src]="avatarSrc"
               [alt]="resolveCardMediaAlt(media) || resolveCardMediaLabel(media) || (node?.title ?? '')"
               (error)="onAvatarImageError($event, media)"
             />
           } @else {
             {{ resolveCardMediaFallback(media, node) }}
           }
         } @else {
           {{ resolveCardMediaFallback(media, node) }}
         }
       </span>
     }
     ```
  2. **Estilos Canônicos do Avatar:**
     - Adicionado `overflow: hidden;` ao container `.prx-rich-card-media__avatar`.
     - Criada a classe `.prx-rich-card-media__avatar-image` com `width: 100%; height: 100%; object-fit: cover; border-radius: inherit; display: block;`.
  3. **Fallback Multinível em `resolveCardMediaFallback`:**
     - Resolução em cascata: `resolveCardMediaLabel(media) || resolveCardMediaAlt(media) || node.title` garantindo iniciais derivadas do título do card quando `label` e `alt` forem omitidos.
     - Suporte a detecção de erro via evento `(error)` que registra a URL com falha no `avatarImageErrors` e ativa o fallback de iniciais sem quebrar a UI.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - O workaround de trocar `kind: 'avatar'` por `kind: 'image'` pode ser **removido**.
  - Declare diretamente no JSON do card:
    ```json
    {
      "type": "card",
      "title": hero.nomeCompleto,
      "media": {
        "kind": "avatar",
        "src": hero.fotoPerfilUrl
      }
    }
    ```
  - Se a URL da foto for inválida ou não responder, as iniciais (ex: "AS" para Anthony Stark) serão exibidas automaticamente com o tom semântico do card.


---

### ISSUE-018: `RichTabsNode[appearance='pills']` possui `#fff` hardcoded no fundo da aba ativa e força `flex-wrap: wrap` quebrando o layout
* **Biblioteca:** `@praxisui/rich-content` & `@praxisui/core`
* **Status:** `[DONE]`
* **Gravidade:** Alta (Quebra de contraste em Dark Mode e quebra assimétrica de abas em painéis)
* **Diagnóstico Técnico:**
  1. **`#fff` hardcoded:** No CSS interno da biblioteca:
     ```css
     .prx-rich-tabs[data-appearance=pills] .prx-rich-tabs__tab--active {
       background: color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 14%, #fff);
     }
     ```
     Misturar `#fff` com a cor primária gerava um fundo claro pastel que funcionava apenas em Light Mode. Em Dark Mode, onde o fundo da página é escuro, a aba ativa ficava quase 100% branca, gerando contraste ofuscante e ilegível com texto claro.
  2. **Ausência de affordance em abas inativas:** Abas inativas tinham `background: transparent; border: 0; color: var(--md-sys-color-on-surface);`. Não havia contorno, elevação ou indicação de cápsula clicável, parecendo rótulos textuais estáticos.
  3. **`flex-wrap: wrap` involuntário:** O container `.prx-rich-tabs__tablist` declarava `flex-wrap: wrap`. Em superfícies estreitas (drawers de 600px–720px, modais ou split-views), 4 a 6 abas quebravam em 2 linhas desiguais e desalinhadas, prejudicando a escaneabilidade.
* **Implementação Realizada na Plataforma:**
  1. **Contrato Canônico (`@praxisui/core`):**
     - Adicionadas propriedades opcionais `wrap?: boolean;` e `scrollable?: boolean;` em `RichTabsNode`.
     - `RichContentDocumentValidator` atualizado para validar ambas as propriedades.
  2. **Substituição de Cor Hardcoded por Tokens Semânticos:**
     - Aba ativa no modo `pills` adota:
       ```css
       .prx-rich-tabs[data-appearance='pills'] .prx-rich-tabs__tab--active {
         background: var(
           --md-sys-color-primary-container,
           color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 16%, var(--md-sys-color-surface-container-high, #2b2930))
         );
         color: var(--md-sys-color-on-primary-container, var(--md-sys-color-primary, #6750a4));
         border-color: transparent;
         box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
       }
       ```
  3. **Affordance e Hover em Abas Inativas:**
     - Abas inativas de pills receberam contorno suave `border: 1px solid var(--md-sys-color-outline-variant, ...)` e transição suave no `:hover`.
  4. **Prevenção de Quebra e Rolagem Horizontal Nativas:**
     - Classes `.prx-rich-tabs__tablist--nowrap` e `.prx-rich-tabs__tablist--scrollable` com ocultação suave de scrollbar (`scrollbar-width: none;`).
     - Por padrão, o modo `appearance: 'pills'` aplica `nowrap` e `scrollable` automaticamente, a menos que `wrap: true` seja explicitamente declarado.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - O workaround CSS com `::ng-deep .prx-rich-tabs` no host pode ser **removido integralmente**.
  - O componente de abas com `appearance: "pills"` agora tem contraste perfeito em Dark Mode e Light Mode e não quebra linhas em drawers estreitos.


---

### ISSUE-019: Presets Visuais Ricos Nativos para Modo Apresentação em `PraxisDynamicForm` (`presentationPreset: 'corporate-dossier' | 'editorial-card'`)
* **Biblioteca:** `@praxisui/dynamic-form`, `@praxisui/dynamic-fields` & `@praxisui/core`
* **Status:** `[DONE]`
* **Gravidade:** Alta (Design de Plataforma / UX / Eliminação de CSS Ad Hoc)
* **Diagnóstico Técnico:**
  O `PraxisDynamicForm` suporta nativamente modo de apresentação (`mode="view"` com `[presentationModeGlobal]="true"`), gerando blocos semânticos de leitura para cada campo via `DynamicFieldLoaderDirective` e `FieldShellComponent` (`praxis-presentation`).
  No entanto, visualmente:
  1. **Aparência plana e crua:** As seções e campos são renderizados com estilos utilitários minimalistas, parecendo listas brutas ou formulários desabilitados simples.
  2. **Ausência de acabamento de produto:** Faltam containers com acabamento contemporâneo (bordas sutis de alta definição, efeito translúcido/glass com tokens M3, padding e gaps calibrados, divisores refinados, badges de cabeçalho).
  3. **Incentivo involuntário a débitos técnicos:** Como o componente não oferece uma opção "out of the box" para layouts ricos de dossiês ou visualização executiva, desenvolvedores e agentes são empurrados a criar réplicas estáticas de DTOs via `RichContentDocument` e a injetar centenas de linhas de CSS com `::ng-deep` nos apps consumidores, violando frontalmente a premissa de telas governadas por metadados.
* **Implementação Realizada na Plataforma:**
  1. **Contratos Canônicos (`@praxisui/core`):**
     - Declarado o tipo exportado `FormPresentationPreset`:
       ```typescript
       export type FormPresentationPreset =
         | 'default'
         | 'corporate-dossier'
         | 'corporateDossier'
         | 'editorial-card'
         | 'editorialCard'
         | 'compact-presentation'
         | 'compactPresentation';
       ```
     - Estendido `FormPresentationConfig` com `preset?: FormPresentationPreset; presentationPreset?: FormPresentationPreset;`.
     - Estendido `FormSection` com `presentationPreset?: FormPresentationPreset;` (permitindo override por seção).
     - Estendido `FormConfigMetadata` com `presentationPreset?: FormPresentationPreset;`.
  2. **Runtime do `PraxisDynamicForm` (`@praxisui/dynamic-form`):**
     - Adicionado `@Input() presentationPreset?: FormPresentationPreset;`.
     - Resolução hierárquica por precedência:
       `@Input() presentationPreset` > `presentation.presentationPreset` > `config.presentation.presentationPreset` > `config.metadata.presentationPreset` > `'default'`.
     - Suporte a override individual por seção (`section.presentationPreset`).
     - Atributos semânticos `[attr.data-presentation-preset]` e classes CSS correspondentes no form e nas seções:
       `.praxis-dynamic-form--corporate-dossier`, `.praxis-dynamic-form--editorial-card`, `.praxis-dynamic-form--compact-presentation` e variantes de seção (`.form-section--*`).
     - Estilização completa de cards de dossiê (`corporate-dossier`), divisores tracejados sutis, tipografia governada por tokens M3, badges de categoria e suporte pleno a Dark/Light Mode.
     - Metadados, editorial copy e documentação pública atualizados (`praxis-dynamic-form.json-api.md`).
  3. **Validação:**
     - Build de produção completo (`node ./scripts/build-libs.js --prod`) bem-sucedido nas 13 bibliotecas.
     - Suíte focal de 17 testes unitários (`praxis-dynamic-form.presentation-preset.spec.ts`) aprovada com 100% de sucesso em ChromeHeadless.
     - PR #555 integrado na branch `main`.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - O workaround CSS com `::ng-deep` no host `hero-dossier-drawer.component.ts` pode ser **removido integralmente**.
  - No `<praxis-dynamic-form>`, utilize diretamente:
    ```html
    <praxis-dynamic-form
      [config]="dossierConfig"
      [value]="selectedHero"
      [mode]="'view'"
      [presentationModeGlobal]="true"
      presentationPreset="corporate-dossier">
    </praxis-dynamic-form>
    ```
    Ou declare `presentationPreset: 'corporate-dossier'` dentro de `config.presentation` ou em seções específicas de `config.sections`.


---

### ISSUE-020: Suporte Nativo a Layout por Abas (Tabs) e Acordeão no `FormConfig` para Organização Multisseção Governada
* **Biblioteca:** `@praxisui/dynamic-form` & `@praxisui/core`
* **Status:** `[DONE]`
* **Gravidade:** Alta (Arquitetural / Governança de Layout / Redução de Código)
* **Diagnóstico Técnico:**
  Entidades de negócio ricas (como `FuncionarioDTO`, `ContratoDTO`, `PacienteDTO`) possuem dezenas de campos agrupados em múltiplos blocos (`@UISchema(group = "Identificação")`, `group = "Profissional"`, `group = "Remuneração"`, `group = "Contato"`, etc.).
  Anteriormente:
  1. O `PraxisDynamicForm` empilhava todas as seções estritamente de forma linear e vertical uma embaixo da outra.
  2. Não havia capacidade declarativa no `FormConfig` para instruir o formulário a renderizar as seções como **Abas (Tabs)** ou como **Acordeão colapsável integrado**.
  3. Isso forçava as aplicações que precisavam de navegação por abas a abandonar o formulário inteligente em bloco único e ter que criar abas manuais em Angular, instanciando múltiplos formulários separados com configs filtradas manualmente, ou migrando indevidamente para nós de apresentação estáticos.
* **Implementação Realizada na Plataforma (PR #558):**
  1. **Contrato Canônico (`@praxisui/core`):**
     - Novos tipos exportados em `form-config.model.ts`:
       ```typescript
       export type FormLayoutMode = 'vertical' | 'tabs' | 'accordion';
       export type FormLayoutTabsAppearance = 'pills' | 'underline' | 'buttons';

       export interface FormLayoutTabItem {
         id: string;
         label: string;
         icon?: string;
         sectionIds: string[];
         badge?: string | number;
         disabled?: boolean;
         tooltip?: string;
       }

       export interface FormLayoutOptions {
         mode?: FormLayoutMode;
         defaultTabId?: string;
         tabsAppearance?: FormLayoutTabsAppearance;
         tabs?: FormLayoutTabItem[];
         accordionMulti?: boolean;
         hideSectionHeaderInTabs?: boolean;
       }
       ```
     - Interface `FormConfig` estendida com `layout?: FormLayoutOptions;`.
  2. **Runtime e Mecanismo de Layout (`@praxisui/dynamic-form`):**
     - Adicionadas entradas `@Input() layoutMode?: FormLayoutMode;` e `@Input() formLayout?: FormLayoutOptions;`.
     - Adicionadas saídas `@Output() tabChange = new EventEmitter<string>();` e `@Output() tabSelected = new EventEmitter<FormLayoutTabItem>();`.
     - **Auto-Derivação Inteligente:** Quando `mode === 'tabs'` e `tabs` for omitido, o componente deriva automaticamente 1 aba por seção visível (`id: section.id`, `label: title`, `icon: icon`, `sectionIds: [section.id]`).
     - **Preservação de Integridade Reativa:** Seções inativas são ocultadas via `[hidden]` em vez de remoção do DOM, garantindo que todos os `FormControl`s permaneçam ativos, validados e reativos no `FormGroup`, sem perda de estado, sem re-fetching e com submissão integral.
     - **Feedback Visual de Erros:** `getTabErrorCount(tab)` calcula dinamicamente campos com erro dentro das seções da aba para exibição de badge de erro.
     - **Modo Acordeão:** Em `mode === 'accordion'`, todas as seções tornam-se colapsáveis nativamente, com suporte a colapso exclusivo (`accordionMulti: false`) ou múltiplo (`accordionMulti: true`).
     - **Acessibilidade:** Marcação ARIA completa (`role="tablist"`, `role="tab"`, `aria-selected`, `role="tabpanel"`, `aria-labelledby`, `aria-controls`).
  3. **Estilos Canônicos (`praxis-dynamic-form.scss`):**
     - Criada folha de estilos completa para `.prx-form-tabs`, `.prx-form-tabs__tablist` (com rolagem horizontal suave sem scrollbar visível), `.prx-form-tabs__tab` e variantes de aparência (`pills`, `underline`, `buttons`) governadas por tokens M3.
     - Guarda estrita `.section-drop-wrapper[hidden] { display: none !important; }`.
  4. **Validação:**
     - 13 testes unitários focais em `praxis-dynamic-form.layout-tabs.spec.ts` (100% SUCCESS).
     - 17 testes de `presentation-preset.spec.ts` preservados com 100% de sucesso.
     - Build de `@praxisui/core`, `@praxisui/dynamic-form` e downstream do `praxis-hero-hq-ui` concluídos com código 0.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - Para transformar qualquer formulário multisseção em abas nativas, passe diretamente no componente:
    ```html
    <praxis-dynamic-form
      [config]="formConfig"
      layoutMode="tabs"
      [formLayout]="{ tabsAppearance: 'pills' }">
    </praxis-dynamic-form>
    ```
    Ou defina dentro de `config.layout`:
    ```json
    {
      "layout": {
        "mode": "tabs",
        "tabsAppearance": "pills",
        "defaultTabId": "identificacao"
      },
      "sections": [ ... ]
    }
    ```
  - Para modo acordeão corporativo:
    ```html
    <praxis-dynamic-form
      [config]="formConfig"
      layoutMode="accordion"
      [formLayout]="{ accordionMulti: false }">
    </praxis-dynamic-form>
    ```


---

### ISSUE-021: Suporte a `schemaRef`/`resourcePath` Dinâmico em `RichPropertySheetNode` ou Nó Nativo de Formulário Dinâmico em `RichContent`
* **Biblioteca:** `@praxisui/rich-content` & `@praxisui/core`
* **Status:** `[DONE]`
* **Pull Request:** [#559](https://github.com/codexrodrigues/praxis-ui-angular/pull/559)
* **Gravidade:** Alta (Arquitetural / Integração de Metadados / Eliminação de Código Estático)
* **Diagnóstico Técnico:**
  O `RichContent` foi desenhado para orquestrar telas mistas e documentos ricos (banners, KPIs, tabelas, blocos de texto).
  Para exibir fichas de propriedades (pares chave/valor), o `RichContent` anteriormente oferecia o nó `propertySheet` com obrigatoriedade de array estático de itens (`items: RichPropertySheetItem[]`). Isso gerava código estático redundante, falta de interoperabilidade com OpenAPI e `/schemas/filtered`, e ausência de governança de metadados.
* **Solução Canônica Implementada na Plataforma:**
  A plataforma implementou **ambas as abordagens canônicas** de forma integrada no PR [#559](https://github.com/codexrodrigues/praxis-ui-angular/pull/559):
  1. **Suporte Declarativo a Schema em `RichPropertySheetNode`:**
     - Adicionados `resourcePath`, `schemaRef`, `group` e `dataContextPath` opcionais em `RichPropertySheetNode`.
     - `items` agora é 100% opcional quando houver fonte dinâmica declarada.
     - Resolução automática e sob demanda via metadados `/schemas/filtered` ou contexto de avaliação (`_schemas`).
     - Formatação semântica automática para tipos canônicos (booleanos com ícones/tons, moedas BRL, números e objetos).
     - Capacidade de override pontual via `items` quando se deseja customizar rótulo ou tom de propriedades específicas do schema.
  2. **Nó Nativo de Formulário Dinâmico em `RichContent` (`RichDynamicFormNode`):**
     - Adicionado o novo nó nativo `RichDynamicFormNode` em `@praxisui/core` e suportado nativamente pelo validador, editor visual, manifestos de IA e runtime de `@praxisui/rich-content`.
     - Permite embutir fichas orientadas a formulário (`mode: 'view'`, `presentationMode: true`, `groupFilter`, `dataBinding`) diretamente na árvore de blocos do documento Rich Content sem acoplamento circular de bibliotecas.
* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - Em documentos Rich Content com fichas cadastrais, utilize a sintaxe dinâmica declarativa sem repetir campos estáticos:
    ```typescript
    {
      type: 'propertySheet',
      title: 'Identificação do Herói',
      resourcePath: 'human-resources/funcionarios',
      group: 'Identificação',
      dataContextPath: 'selectedHero',
      columns: 2
    }
    ```
  - Ou use o nó nativo `dynamicForm`:
    ```typescript
    {
      type: 'dynamicForm',
      resourcePath: 'human-resources/funcionarios',
      mode: 'view',
      presentationMode: true,
      groupFilter: ['Identificação', 'Profissional'],
      dataBinding: 'selectedHero'
    }
    ```

---

### ISSUE-022: Reatividade Semântica de Ícone, Tom e Estado em Campos Booleanos no Modo Apresentação (`FieldShellComponent`)
* **Biblioteca:** `@praxisui/dynamic-fields` & `@praxisui/core` (com reflexo em `@praxisui/dynamic-form`)
* **Status:** `[DONE]`
* **Gravidade:** Alta (Inconsistência Semântica / Confiabilidade de Apresentação em Dados Corporativos)
* **Diagnóstico Técnico & Evidência Real:**
  No Dossiê do Herói da tela de Recursos Humanos do `praxis-hero-hq-ui`, ao inspecionar colaboradores inativos (ex: *Ayla Hayes*, com `ativo: false`), foi observada uma inconsistência crítica de UI/UX corporativa:
  - O campo **ATIVO** exibe o label `"ATIVO"`.
  - O valor textual é resolvido corretamente para `"Não"` dentro de um chip.
  - **Porém**, o ícone de prefixo renderizado era o toggle ligado verde (`toggle_on`) e o tom aplicado era `tone="success"`, transmitindo visualmente a impressão de que o registro estava ativo!

  **Causa-Raiz no Código da Plataforma:**
  1. No backend (`FuncionarioDTO.java`), o campo `ativo` possui as anotações estáticas:
     ```java
     @ExtensionProperty(name = "presentation.presenter", value = "status"),
     @ExtensionProperty(name = "presentation.icon", value = "toggle_on"),
     @ExtensionProperty(name = "presentation.appearance", value = "soft"),
     @ExtensionProperty(name = "presentation.tone", value = "success")
     private Boolean ativo;
     ```
  2. No componente `FieldShellComponent` (`projects/praxis-dynamic-fields/src/lib/components/field-shell/field-shell.component.ts`), os métodos `getPresentationPrefixIcon()` e `getPresentationTone()` priorizavam a string estática do metadata sem verificar o estado booleano do campo.

* **Implementação Realizada na Plataforma:**
  1. **Contrato Canônico (`@praxisui/core`):**
     - Estendido `FieldPresentationConfig` e `normalizeFieldPresentation` com pares semânticos por estado:
       ```typescript
       iconTrue?: string;
       iconFalse?: string;
       toneTrue?: FieldPresentationTone;
       toneFalse?: FieldPresentationTone;
       labelTrue?: string;
       labelFalse?: string;
       ```
  2. **Runtime Reativo em `FieldShellComponent` (`@praxisui/dynamic-fields`):**
     - **Reatividade Automática de Ícones:** Se o valor for `false`, mapeia automaticamente pares binários clássicos (`toggle_on` $\to$ `toggle_off`, `check_circle` $\to$ `cancel`, `check` $\to$ `close`, `visibility` $\to$ `visibility_off`, etc.), a menos que sobrescrito explicitamente por `iconFalse`.
     - **Reatividade de Tom:** Se o valor for `false` e o tom base configurado for `'success'`, rebaixa automaticamente para `'neutral'`. Suporta também `toneFalse` explícito.
     - **Supressão de Rótulo Positivo Incompatível:** Em estado `false`, evita que um `label` estático positivo (ex: `"Ativo"`) sobreponha o valor formatado `"Não"`, a menos que um `labelFalse` deliberado tenha sido declarado.
     - **Tokens CSS Oficiais:** Adicionadas regras para `--pfx-pres-boolean-false-icon-color` e `--pfx-pres-boolean-true-icon-color`.
  3. **Validação:**
     - 8 testes unitários focais implementados em `field-shell.boolean-presentation.spec.ts` cobrindo valores booleanos, numéricos (0/1), strings ("Sim"/"Não"), reatividade dinâmica em tempo real no `FormControl`, e overrides explícitos de ícone/tom/label.
     - PR #556 integrado e aprovado na `main`.

* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - O workaround CSS com `&::after { content: 'toggle_off' }` e `font-size: 0` em `hero-dossier-drawer.component.ts` foi removido.
  - O componente agora usufrui nativamente da inteligência da plataforma para resolver `toggle_off` e tom `neutral` para colaboradores inativos.

---

### ISSUE-023: Espaçamento Canônico de Cabeçalho e Diagramação Interna Balanceada em Nós de Métricas (`statGroup` / `RichStatGroupNode`)
* **Biblioteca:** `@praxisui/rich-content` & `@praxisui/core`
* **Status:** `[DONE]`
* **Gravidade:** Média (Qualidade Visual, Respiro de Layout e Ergonomia de Dashboards Corporativos)
* **Diagnóstico Técnico & Evidência Real:**
  Na tela do Dossiê do Herói e em painéis executivos com `statGroup`, foram identificadas duas anomalias de espaçamento na biblioteca `@praxisui/rich-content`:
  1. **Ausência de Margem Inferior no Subtítulo:**
     A `<div class="prx-rich-stat-group__subtitle">` possuía `margin: 0`, encostando fisicamente na borda superior dos cartões de métrica e transmitindo sensação de layout colado.
  2. **Assimetria de Layout Interno no Card com Ícone (`.prx-rich-stat-group__item`):**
     O item colocava o ícone na Coluna 1 e todo o restante na Coluna 2, deixando um grande vazio vertical sob o ícone e espremendo anéis de progresso circulares.

* **Implementação Realizada na Plataforma:**
  1. **Contrato Canônico (`@praxisui/core`):**
     - Adicionados os tipos:
       ```typescript
       export type RichStatGroupHeaderSpacing = 'tight' | 'normal' | 'relaxed';
       export type RichStatGroupTileLayout = 'classic' | 'tile' | 'split';
       ```
     - Estendido `RichStatGroupNode` com `headerSpacing?: RichStatGroupHeaderSpacing` e `tileLayout?: RichStatGroupTileLayout`.
     - Estendido `RichStatItem` com `tileLayout?: RichStatGroupTileLayout` para overrides granulares por item.
  2. **Estilos e Renderizador (`@praxisui/rich-content`):**
     - **Espaçamento de Cabeçalho Canônico:**
       * Título: `font-size: 1.05rem`, `font-weight: 700`, `margin: 0 0 4px 0`.
       * Subtítulo: `margin: 0 0 16px 0`, `font-size: 0.8rem`, `line-height: 1.45`.
       * Suporte a `headerSpacing`: `'tight'` (8px), `'normal'` (16px), `'relaxed'` (24px), inclusive quando não houver subtítulo.
     - **Diagramação Moderna de Tile Executivo (`tileLayout: 'tile' | 'split'`):**
       * `.prx-rich-stat-group__item-content` passa a usar `display: contents`, integrando todos os elementos no grid principal do cartão.
       * Grid de 3 colunas e 3 linhas (`auto 1fr auto` / `auto auto 1fr`):
         - Coluna 1 / Linha 1: Ícone centralizado.
         - Coluna 2 / Linha 1: Label semântico.
         - Coluna 3 / Linhas 1-2: Indicador de progresso circular (`ring`), alinhado à direita com respiro elegante.
         - Coluna 1-2 / Linha 2: Valor da métrica (`.prx-rich-stat-group__value`) em tipografia destacada.
         - Linha 3 (largura total): Caption / legenda com divisor pontilhado sutil delimitando o rodapé.
  3. **Validação e Ferramentas:**
     - `RichContentDocumentValidator` atualizado para validar `headerSpacing` e `tileLayout`.
     - AI Capabilities e Editor Visual (`PraxisRichContentConfigEditor`) atualizados com i18n (`en-US`, `pt-BR`).
     - Testes unitários adicionados em `praxis-rich-content.spec.ts` (60/60 passando) e `rich-content-document-validator.spec.ts` (19/19 passando).
     - PR #557 integrado e aprovado na `main`.

* **Instruções de Adoção para o Agente do `praxis-hero-hq-ui`:**
  - O workaround CSS estrutural com `display: contents !important` e grid placement manual em `hero-dossier-drawer.component.ts` foi removido.
  - Para obter a diagramação de KPI moderno em qualquer `statGroup`, declare diretamente no nó:
    ```json
    {
      "type": "statGroup",
      "tileLayout": "tile",
      "headerSpacing": "normal",
      ...
    }
    ```

---

### ISSUE-024: Fallback Automático de Ícone Padrão ('person' / 'account_circle') em `MaterialAvatarComponent` quando Imagem e Iniciais forem Nulas
* **Biblioteca:** `@praxisui/dynamic-fields` & `@praxisui/core`
* **Status:** `[PENDING]`
* **Gravidade:** Média (Qualidade Visual, Acessibilidade e Semântica de Formulários em Modo Apresentação)
* **Diagnóstico Técnico & Evidência Real:**
  Em formulários e fichas cadastrais geradas dinamicamente com base em OpenAPI/x-ui (ex: `FuncionarioDTO` com `avatarUrl` anotado com `controlType = FieldControlType.AVATAR`), quando o registro não possui URL de foto (`null` ou vazia) e o contexto de carregamento não repassa iniciais do colaborador ao componente de campo dinâmico, o componente `MaterialAvatarComponent` (`pdx-material-avatar`) renderiza o container circular `.pfx-avatar__inner` completamente vazio:
  ```html
  <pdx-material-avatar role="img" aria-label="Foto" data-field-type="avatar" data-field-name="avatarUrl" class="fill-solid pfx-avatar rounded-full size-medium theme-primary praxis-readonly presentation-mode">
    <span class="pfx-avatar__label">Foto</span>
    <span class="mat-mdc-tooltip-trigger pfx-avatar__inner mat-mdc-tooltip-disabled" aria-hidden="true">
      <span class="pfx-avatar__custom"></span>
    </span>
  </pdx-material-avatar>
  ```
  Isso gera um círculo sólido preenchido exclusivamente com a cor do tema primário (`var(--primary)`), sem qualquer ícone ou glifo explicativo em seu interior. No tema claro e escuro, o usuário visualiza um disco colorido mudo, transmitindo a impressão de renderização incompleta ou bug de asset ausente.
* **Proposta Canônica de Implementação na Plataforma:**
  1. **Contrato & Configuração (`@praxisui/dynamic-fields`):**
     - Em `MaterialAvatarComponent`, verificar se `imageSrc` e `initials` são vazios/nulos.
     - Quando ambos forem vazios/nulos, adotar automaticamente o ícone de fallback definido no metadado do campo (`metadata?.icon`) ou, na sua ausência, o ícone universal `'person'` (ou `'account_circle'`).
     - Renderizar dentro de `.pfx-avatar__inner`:
       ```html
       <span class="material-symbols-outlined pfx-avatar__fallback-icon">{{ fallbackIcon }}</span>
       ```
  2. **Estilização Canônica Material 3:**
     - Quando operando em modo fallback de ícone, `.pfx-avatar__inner` deve utilizar container tonal suave (`background: color-mix(in oklab, var(--primary) 18%, var(--card))` e borda sutil) em vez de preenchimento 100% opaco sólido, garantindo contraste harmônico com os demais campos da ficha.
* **Workaround Temporário Adotado no `praxis-hero-hq-ui`:**
  - Injetado em `src/styles.scss`:
    ```scss
    .pfx-avatar:not(.has-image):not(.has-icon):not(.has-initials) {
      background: transparent !important;
      border: none !important;

      .pfx-avatar__inner {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: color-mix(in oklab, var(--primary) 18%, var(--card)) !important;
        color: var(--primary) !important;
        border: 1px solid color-mix(in oklab, var(--primary) 30%, transparent) !important;

        &::after {
          content: 'account_circle';
          font-family: 'Material Symbols Outlined';
          font-size: 32px;
          line-height: 1;
          color: currentColor;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      }
    }
    ```

