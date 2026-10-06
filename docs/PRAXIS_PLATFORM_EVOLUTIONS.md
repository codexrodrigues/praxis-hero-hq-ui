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
| **ISSUE-004** | `@praxisui/rich-content` | Estrutural / Layout | Suporte a nós canônicos de layout em Grid / Colunas (`RichGridNode` / `RichColumnsNode`) | `[PENDING]` |
| **ISSUE-005** | `@praxisui/core` | Arquitetural / Tipos | Harmonização de tokens semânticos de cores entre nós (`statGroup`, `timeline`, `badge`) | `[PENDING]` |
| **ISSUE-006** | `@praxisui/rich-content` | Interatividade / DX | Callbacks de ação e eventos interativos nativos em itens de `statGroup` e `timeline` | `[PENDING]` |
| **ISSUE-007** | `@praxisui/page-builder` | Reatividade / Estado | Binding reativo granular para atualização de widgets sem rerender do canvas | `[PENDING]` |
| **ISSUE-008** | `@praxisui/rich-content` | Consistência / API | Exportação pública padronizada (`PraxisRichContent` vs `PraxisRichContentComponent`) | `[DONE]` |
| **ISSUE-009** | `@praxisui/rich-content` | Visual / Telemetria | Suporte nativo a kind `'telemetry'` (radar, pulse, wave, signal) e Lottie em `RichCardMedia` | `[DONE]` |
| **ISSUE-010** | `@praxisui/rich-content` | Funcional / KPIs | Indicador de progresso integrado (`variant: 'bar' \| 'ring'`) em `RichStatItem` | `[DONE]` |
| **ISSUE-011** | `@praxisui/core` | Navegação / SPA | Handler nativo e autônomo para navegação de rotas SPA (`praxis:router.navigate`, `navigation.navigate`) | `[DONE]` |
| **ISSUE-012** | `@praxisui/page-builder` | Design / Shell | Presets canônicos Glassmorphism (`glass-dark`, `glass-light`) e `backdropFilter` em `WidgetShell` | `[DONE]` |
| **ISSUE-013** | `@praxisui/rich-content` | Design / Interatividade | Layout Vertical, Espaçamento de Rodapé (`margin-top: auto`) e Microinterações de `:hover`/`:focus-visible` em `RichActionCardNode` | `[PENDING]` |
| **ISSUE-014** | `@praxisui/core` | Arquitetural / DX | Governança Canônica de Temas: Ausência de SCSS Starter/Mixin e Mapeamento Obrigatório de Tokens Material 3 | `[PENDING]` |
| **ISSUE-015** | `@praxisui/core` | Design / UX & Layout | Fundo Translúcido em Widgets Sobrepostos e Omissão do Modo de Inspeção de Janela ('expand') na Toolbar de WidgetShell | `[PENDING]` |
| **ISSUE-016** | `@praxisui/core` | Arquitetural / Temas | Ausência de Tokens Canônicos de Superfície Invertida e Tooltip no Theme Bridge (`--mat-sys-inverse-surface` e `--mat-tooltip-*`) | `[PENDING]` |


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
       }
       ```
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
* **Status:** `[PENDING]`
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

* **Workaround Atual no Consumidor:**
  Sobrescrever via CSS direcionando explicitamente para a `div.prx-rich-compose` interna:
  ```scss
  .hub-action-cards-grid .prx-rich-compose {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)) !important;
    gap: 16px !important;
    width: 100% !important;
    align-items: stretch !important;
  }
  .hub-action-cards-grid .prx-rich-compose > .prx-rich-node {
    width: 100% !important;
    display: flex !important;
  }
  .hub-card-action {
    width: 100% !important;
    height: 100% !important;
  }
  ```

---

### ISSUE-005: Harmonização de Tokens Semânticos de Cores Entre Nós (`statGroup` vs `timeline` vs `badge`)
* **Biblioteca:** `@praxisui/core`
* **Status:** `[PENDING]`
* **Gravidade:** Baixa / DX (Assimetria de tipagem)
* **Diagnóstico Técnico:**
  Há discrepâncias entre as uniões de cores dos diferentes nós:
  - `RichStatItem.tone`: `'neutral' | 'info' | 'success' | 'warning' | 'danger'`
  - `RichTimelineItem.markerColor`: `'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'`
  O termo `'danger'` vs `'error'` e a ausência dos tons institucionais `'primary'`/`'secondary'` no `statGroup` exigem transformações de contrato na borda do frontend.
* **Proposta Canônica de Evolução:**
  Unificar um tipo canônico em `@praxisui/core`:
  ```typescript
  export type RichSemanticTone = 'primary' | 'secondary' | 'tertiary' | 'info' | 'success' | 'warning' | 'danger' | 'error' | 'neutral';
  ```
  Com mapeamento interno tolerante onde `'danger'` e `'error'` sejam sinônimos.
* **Atualização Pós-Introdução da Governança de Temas (`theme-praxis.scss`):**
  Com a consolidação de tokens de tema no projeto (que definem variáveis semânticas como `--ready`, `--operations`, `--warning`, `--alert`, `--risk`), a discrepância de contratos em TypeScript entre `RichStatItem.tone` (que aceita `'danger'` mas não `'error'`) e `RichTimelineItem.markerColor` (que aceita `'error'` mas não `'danger'`) torna o mapeamento de classes e variáveis de CSS mais complexo e frágil. A criação de `RichSemanticTone` em `@praxisui/core` se torna um pré-requisito para que a plataforma forneça classes utilitárias e mixins de cores semânticas unificadas.

---

### ISSUE-006: Interatividade e Callbacks de Ação Nativos em Itens de `statGroup` e `timeline`
* **Biblioteca:** `@praxisui/rich-content`
* **Status:** `[PENDING]`
* **Gravidade:** Média (Permite dashboards dinâmicos orientados a drilldown)
* **Diagnóstico Técnico:**
  Os cartões de estatísticas (`statGroup.items`) e eventos de linha do tempo (`timeline.items`) são somente leitura. Não possuem propriedade `action?: RichActionRef` para disparar eventos ao host quando clicados pelo usuário.
* **Proposta Canônica de Evolução:**
  1. Suportar `action?: RichActionRef` em `RichStatItem` e `RichTimelineItem`.
  2. Adicionar `@Output() nodeAction = new EventEmitter<RichActionRef>();` em `PraxisRichContent`.

---

### ISSUE-007: Binding Reativo Granular para Atualização de Widgets sem Rerender do Canvas
* **Biblioteca:** `@praxisui/page-builder`
* **Status:** `[PENDING]`
* **Gravidade:** Média (Eficiência em dashboards de telemetria em tempo real)
* **Diagnóstico Técnico:**
  No `DynamicPageBuilderComponent`, para atualizar dados de um widget (como dados de websockets ou polling de telemetria), é preciso substituir a árvore inteira do `WidgetPageDefinition`, disparando recálculos no canvas.
* **Proposta Canônica de Evolução:**
  Permitir que `PageBuilderWidget.definition.inputs` aceite `Signal` ou identificador de canal reativo, atualizando o widget em isolamento sem remontar o DOM dos nós adjacentes.

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
* **Status:** `[PENDING]`
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
* **Casos de Teste para o Agente de Plataforma:**
  1. *Test Case 1 (Alinhamento de CTA na Base)*: Renderizar um grid com 3 `actionCard`. O Card 1 possui 1 linha de texto; o Card 2 possui 4 linhas de texto. O teste Playwright deve aferir que `bottom` bounding box de `.prx-rich-action-card__actions` em todos os cards está alinhado à base do container.
  2. *Test Case 2 (Hover Feedback no Botão)*: Fazer hover no elemento `.prx-rich-action-button`. Aferir via computed style que `background-color` e `color` mudam para o token de destaque primário e que `box-shadow` é ativado.
  3. *Test Case 3 (Navegação por Teclado e Foco Acessível)*: Focar o botão via `Tab`. Aferir que `:focus-visible` produz `outline` visível com espessura mínima de 2px.

---

### ISSUE-014: Governança Canônica de Temas — Ausência de Starter/Mixin SCSS e Fallbacks Material 3 Opacos em Ambientes Customizados
* **Biblioteca:** `@praxisui/core` / `@praxisui/*`
* **Status:** `[PENDING]`
* **Gravidade:** Alta (Dificuldade de adoção por aplicações com design system moderno, proliferação de `::ng-deep` e inconsistência visual de componentes da plataforma)
* **Diagnóstico Técnico & Evidência Real:**
  1. A plataforma Praxis utiliza internamente uma combinação de namespaces de tokens CSS:
     - `--md-sys-color-*` (Material Design 3 tokens)
     - `--pdx-material-*` e `--pdx-overlay-*` (Praxis theme bridge)
     - `--pdx-page-*` e `--pdx-shell-*` (Page Builder e Widget Shell)
     - `--praxis-color-*` (Componentes legados como CRUD e Table)
  2. **Ausência de Starter/Mixin SCSS Exportado:**
     - O monorepo possui o arquivo interno `theme-bridge.css` em `@praxisui/core`, mas não exporta um arquivo SCSS estruturado (ex.: `@praxisui/core/theming` com `@mixin praxis-theme($config)`) que permita a uma aplicação consumidora mapear suas variáveis de design de forma declarativa e completa.
  3. **Consequências Práticas Observadas:**
     - Aplicações que adotam tokens modernos em OKLCH ou Tailwind (como Hero HQ) acabam definindo variáveis próprias (`--background`, `--foreground`, `--primary`, `--card`) que não são reconhecidas pelos componentes internos da plataforma.
     - Ao não receberem essas variáveis, os componentes Praxis caem nos seus fallbacks hardcoded:
       * Badges caem em `--md-sys-color-primary-container, #e8def8` (roxo padrão Material 3), gerando o bug visual de "caixa roxa dentro de card verde".
       * Cards caem em `var(--md-sys-color-surface, #fff)` (branco opaco), gerando o bug visual de "caixa branca dentro de painel translúcido".
       * Botões de ação caem em `--md-sys-color-outline-variant, #cac4d0`.
     - Isso força o desenvolvedor do app consumidor a escrever dezenas de seletores com `::ng-deep` e `!important` para sobrescrever os componentes, violando a boa arquitetura de software e desestabilizando o isolamento de escopo.
* **Proposta Canônica de Evolução da Plataforma:**
  1. **Criação de `theming.scss` em `@praxisui/core`:**
     Exportar mixins canônicos:
     ```scss
     // @praxisui/core/theming
     @mixin define-praxis-theme($theme-map) {
       --md-sys-color-primary: map-get($theme-map, primary);
       --md-sys-color-on-primary: map-get($theme-map, on-primary);
       --md-sys-color-surface: map-get($theme-map, surface);
       --md-sys-color-on-surface: map-get($theme-map, text);
       --md-sys-color-outline-variant: map-get($theme-map, border);
       --pdx-page-surface: map-get($theme-map, surface);
       --pdx-shell-card-bg: map-get($theme-map, card-bg);
       // ... todos os tokens da plataforma mapeados
     }
     ```
  2. **Fallbacks Mais Inteligentes nos Componentes Praxis:**
     - Em vez de usar fallbacks opacos como `#fff` ou `#cac4d0`, os componentes canônicos devem adotar `inherit`, `currentColor` ou `transparent` quando apropriado, respeitando o tema herdado do elemento pai.
* **Casos de Teste para o Agente de Plataforma:**
  1. *Test Case 1 (Token Consumption Validation)*: Montar teste unitário em `praxis-rich-content.spec.ts` verificando que a alteração de `--md-sys-color-primary` reflete imediatamente na cor computada de badges e botões primários.
  2. *Test Case 2 (Dark Mode Parity)*: Validar em bateria Playwright que uma aplicação com classe `.dark` e tokens mapeados não renderiza nenhum elemento interno com fundo branco `#ffffff` ou roxo `#e8def8`.
* **Referência Concreta de Implementação Criada no Hero HQ:**
  O arquivo [`src/styles/theme-praxis.scss`](file:///d:/Developer/praxis-plataform/praxis-hero-hq-ui/src/styles/theme-praxis.scss) foi implementado na aplicação hospedeira como especificação técnica funcional do mapeamento completo de todos os tokens exigidos pelos componentes da plataforma (Material 3 System, Praxis Core Bridge, Widget Shell e Rich Content) para Light e Dark mode. Esse arquivo pode ser utilizado diretamente pelo agente da plataforma como base para a criação do starter oficial em `@praxisui/core/theming`.

---

### ISSUE-015: Fundo Translúcido em Widgets Sobrepostos e Omissão do Modo de Inspeção de Janela ('expand') na Toolbar de WidgetShell
* **Biblioteca:** `@praxisui/core` (`WidgetShellComponent`, `widget-shell.model.ts`)
* **Status:** `[PENDING]`
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
     - **Onde está a falha de plataforma?**
       * O contrato `WidgetShellWindowActions` em `widget-shell.model.ts` contém apenas `collapsible?: boolean` e `fullscreen?: boolean`. **A propriedade `expandable?: boolean` foi omitida!**
       * O método `buildWindowActions()` em `widget-shell.component.ts` **não constrói o botão da ação `expand`** (apenas `collapse` e `fullscreen`).
       * Consequentemente, o usuário é obrigado a clicar no botão `fullscreen`, que o projeta em um `inset: 0` forçado sem respiro.
       * Transformar o `fullscreen` canônico para ter `inset: 24px` seria um erro conceitual de plataforma, pois destruiria o suporte a telões de monitoramento (NOC). A solução correta é expor e governar os dois modos na API!

* **Proposta Canônica de Evolução da Plataforma:**
  1. **Superfície Sólida Nativamente em `widget-shell.component.ts`:**
     Eliminar a div auxiliar `.pdx-shell-overlay-surface` e atribuir a superfície sólida diretamente aos seletores sobrepostos:
     ```css
     .pdx-shell.fullscreen,
     .pdx-shell.expanded {
       background: var(--pdx-shell-overlay-bg, var(--md-sys-color-surface, #ffffff));
       color: var(--md-sys-color-on-surface);
     }
     ```
  2. **Padding Interno de Respiro no Fullscreen Edge-to-Edge:**
     Garantir que no modo `fullscreen`, o corpo do widget não cole nos cantos físicos da tela:
     ```css
     .pdx-shell.fullscreen > .pdx-shell-body {
       padding: var(--pdx-shell-fullscreen-body-padding, 24px);
     }
     ```
  3. **Evolução de Contrato em `WidgetShellWindowActions` (`widget-shell.model.ts`):**
     ```typescript
     export interface WidgetShellWindowActions {
       /** Exibe controle de recolher/expandir corpo do widget. */
       collapsible?: boolean;
       /** Exibe botão de expansão em Janela Flutuante com respiro (modal centralizado). */
       expandable?: boolean;
       /** Exibe botão de tela cheia absoluta (edge-to-edge). */
       fullscreen?: boolean;
       /** Define a ação de ampliação quando um único botão for exposto ('expand' | 'fullscreen', padrão: 'expand'). */
       maximizeMode?: 'expand' | 'fullscreen';
     }
     ```
  4. **Construção Automática da Ação `expand` em `buildWindowActions()`:**
     No método `buildWindowActions()`, suportar a criação da ação `expand`:
     ```typescript
     if (allowExpand && !reserved.has('expand')) {
       actions.push({
         id: 'expand',
         placement: 'window',
         icon: this.expanded ? 'ms:collapse_content' : 'ms:open_in_new',
         tooltip: this.expanded
           ? this.t('controls.collapseWindow', 'Restaurar janela')
           : this.t('controls.expandWindow', 'Expandir em janela'),
         variant: 'icon',
       });
     }
     ```

* **Workaround Atual no Host Consumidor (`praxis-hero-hq-ui`):**
  Como a biblioteca `@praxisui/core@9.0.5-rc.10` só expõe o botão `fullscreen`:
  - No [`src/styles/theme-praxis.scss`](file:///d:/Developer/praxis-plataform/praxis-hero-hq-ui/src/styles/theme-praxis.scss), forçamos:
    1. Superfície 100% sólida: `.pdx-shell.fullscreen, .pdx-shell.expanded { background: var(--card) !important; }`
    2. Respiro perimetral no fullscreen: `.pdx-shell.fullscreen { inset: 24px !important; border-radius: 20px !important; }` (adaptando o botão único de tela cheia para se comportar visualmente como a janela modal de inspeção que o usuário espera no dashboard executivo).

* **Casos de Teste para o Agente de Plataforma:**
  1. *Test Case 1 (Opaque Surface on Overlay)*: Renderizar um widget com `shell.preset: 'glass-dark'` ou fundo translúcido sobre elementos com texto e cores vivas. Acionar `expand` e `fullscreen`. Aferir via Playwright/computedStyle que a opacidade efetiva de fundo da `.pdx-shell` é 1.0 e que nenhum texto do elemento pai é visível através da área do gráfico.
  2. *Test Case 2 (Dual Window Action Affordances)*: Configurar widget com `windowActions: { expandable: true, fullscreen: true }`. Aferir que o cabeçalho renderiza ambos os botões (`expand` e `fullscreen`), e que ao clicar em `expand`, o widget recebe a classe `.expanded` (com dimensões `min(920px, 92vw)`), enquanto ao clicar em `fullscreen`, recebe `.fullscreen` com `inset: 0`.
  3. *Test Case 3 (Responsive Fullscreen Body Padding)*: Em tela cheia, aferir que o `.pdx-shell-body` possui padding >= 20px, prevenindo que tooltips ou eixos de `praxis-chart` colidam com as bordas da viewport.

---

### ISSUE-016: Ausência de Tokens Canônicos de Superfície Invertida e Tooltip no Theme Bridge (`--mat-sys-inverse-surface` e `--mat-tooltip-*`)
* **Biblioteca:** `@praxisui/core` (`theme-bridge.css`, `@praxisui/core/theming`)
* **Status:** `[PENDING]`
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
  
  **Onde está a omissão da plataforma Praxis:**
  - Os componentes de `@praxisui/core`, `@praxisui/page-builder`, `@praxisui/rich-content` e `@praxisui/dynamic-form` utilizam amplamente a diretiva `matTooltip` (ex: botões de ação do widget shell, controles da barra do Page Builder, botões de ação rápida).
  - O arquivo canônico `theme-bridge.css` em `@praxisui/core`:
    * Mapeia apenas uma ponte unilateral para cores de superfície normal (`--md-sys-color-surface: var(--mat-sys-surface)`).
    * **OMITE COMPLETAMENTE** os tokens de superfícies invertidas (`--md-sys-color-inverse-surface`, `--md-sys-color-inverse-on-surface`, `--mat-sys-inverse-surface`, `--mat-sys-inverse-on-surface`).
    * **OMITE COMPLETAMENTE** os tokens específicos de componentes CDK Overlay (`--mat-tooltip-container-color`, `--mat-tooltip-supporting-text-color`, `--mat-tooltip-container-shape`, etc.).
  - Como a plataforma ainda não disponibiliza o `@mixin define-praxis-theme` (apontado na `ISSUE-014`), qualquer aplicação moderna que utilize seus próprios tokens de design (como OKLCH, Tailwind ou tokens de marca do cliente) sem importar o CSS pré-fabricado legado do Angular Material sofre com a quebra completa de todos os tooltips.

* **Proposta Canônica de Evolução da Plataforma:**
  1. **Atualizar `theme-bridge.css` em `@praxisui/core`:**
     Incluir a ponte canônica e os fallbacks seguros para superfícies invertidas e tooltips:
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
  2. **Incorporar no Mixin de Temas (`ISSUE-014`):**
     Garantir que a função geradora de temas do `@praxisui/core/theming` derive automaticamente `inverse-surface` e `inverse-on-surface` para temas claros e escuros, garantindo tooltips com alto contraste nativo.

* **Solução Canônica Aplicada no Host Consumidor (`praxis-hero-hq-ui`):**
  No arquivo [`src/styles/theme-praxis.scss`](file:///d:/Developer/praxis-plataform/praxis-hero-hq-ui/src/styles/theme-praxis.scss), foram mapeados:
  - Tokens de sistema M3: `--md-sys-color-inverse-surface` (`oklch(0.24 0.03 260)` no light / `oklch(0.24 0.035 260)` no dark) e `--md-sys-color-inverse-on-surface`.
  - Ponte bidirecional Angular Material M3: `--mat-sys-inverse-surface`, `--mat-tooltip-container-color`, `--mat-tooltip-supporting-text-color`, shape e tipografia de 12px.
  - Refinamento visual empresarial: `.mat-mdc-tooltip-surface` com padding de 6px 12px, border sutil, elevação suave e backdrop-blur de 8px.

* **Casos de Teste para o Agente de Plataforma:**
  1. *Test Case 1 (Tooltip Contrast & Visibility)*: Montar teste Playwright disparando mouseenter sobre um elemento com `matTooltip`. Aferir que `.mat-mdc-tooltip-surface` possui `background-color` computado com canal alfa = 1.0 (ou > 0.9) e que o contraste de cor entre `background-color` e `color` atende aos critérios WCAG AA (>= 4.5:1).
  2. *Test Case 2 (No Prebuilt Material Theme Required)*: Em aplicação de teste sem `@angular/material/prebuilt-themes/*.css` importado, aferir que os tokens `--mat-tooltip-container-color` e `--mat-tooltip-supporting-text-color` são devidamente populados por `@praxisui/core/theme-bridge.css`.



