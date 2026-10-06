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
| **ISSUE-001** | `@praxisui/rich-content` | Design / Visual | "Caixa dentro de Caixas": Renderização duplicada de container em `card` e `actionCard` | `[PENDING]` |
| **ISSUE-002** | `@praxisui/rich-content` | Design / Funcional | Badges/Chips com estilos fixos Material 3 acoplados e `icon` ignorado no template | `[PENDING]` |
| **ISSUE-003** | `@praxisui/rich-content` | Funcional / DX | `RichProgressNode`: `valueExpr` não aceita literais numéricos e falta `value: number` | `[PENDING]` |
| **ISSUE-004** | `@praxisui/rich-content` | Estrutural / Layout | Suporte a nós canônicos de layout em Grid / Colunas (`RichGridNode` / `RichColumnsNode`) | `[PENDING]` |
| **ISSUE-005** | `@praxisui/core` | Arquitetural / Tipos | Harmonização de tokens semânticos de cores entre nós (`statGroup`, `timeline`, `badge`) | `[PENDING]` |
| **ISSUE-006** | `@praxisui/rich-content` | Interatividade / DX | Callbacks de ação e eventos interativos nativos em itens de `statGroup` e `timeline` | `[PENDING]` |
| **ISSUE-007** | `@praxisui/page-builder` | Reatividade / Estado | Binding reativo granular para atualização de widgets sem rerender do canvas | `[PENDING]` |
| **ISSUE-008** | `@praxisui/rich-content` | Consistência / API | Exportação pública padronizada (`PraxisRichContent` vs `PraxisRichContentComponent`) | `[PENDING]` |
| **ISSUE-009** | `@praxisui/rich-content` | Visual / Telemetria | Suporte nativo a kind `'telemetry'` (radar, pulse, wave, signal) e Lottie em `RichCardMedia` | `[DONE]` |
| **ISSUE-010** | `@praxisui/rich-content` | Funcional / KPIs | Indicador de progresso integrado (`variant: 'bar' \| 'ring'`) em `RichStatItem` | `[DONE]` |
| **ISSUE-011** | `@praxisui/core` | Navegação / SPA | Handler nativo e autônomo para navegação de rotas SPA (`praxis:router.navigate`, `navigation.navigate`) | `[DONE]` |
| **ISSUE-012** | `@praxisui/page-builder` | Design / Shell | Presets canônicos Glassmorphism (`glass-dark`, `glass-light`) e `backdropFilter` em `WidgetShell` | `[DONE]` |
| **ISSUE-013** | `@praxisui/rich-content` | Design / Interatividade | Layout Vertical, Espaçamento de Rodapé (`margin-top: auto`) e Microinterações de `:hover`/`:focus-visible` em `RichActionCardNode` | `[PENDING]` |
| **ISSUE-014** | `@praxisui/core` | Arquitetural / DX | Governança Canônica de Temas: Ausência de SCSS Starter/Mixin e Mapeamento Obrigatório de Tokens Material 3 | `[PENDING]` |
| **ISSUE-015** | `@praxisui/core` | Design / UX & Layout | Fundo Translúcido e Ausência de Respiro (*Viewport Inset*) em Widgets no Modo Fullscreen / Maximizado | `[PENDING]` |

---

## Detalhamento Técnico das Demandas

### ISSUE-001: "Caixa dentro de Caixas" — Renderização Duplicada de Container em `RichCardNode` e `RichActionCardNode`
* **Biblioteca:** `@praxisui/rich-content`
* **Status:** `[PENDING]`
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
  Quando o desenvolvedor adiciona classes de estilo ou tokens de superfície via `node.className` (como `.glass-panel`, `.hero-executive-banner`, `.bento-kpi-card`), essas classes são aplicadas na `div.prx-rich-node` externa (com borda, background, padding e raio). Porém, a `<section class="prx-rich-card">` interna possui estilos fixos próprios incondicionais:
  ```css
  .prx-rich-card {
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    border-radius: 16px;
    background: var(--prx-rich-card-tone-bg, #fff);
    padding: 16px;
  }
  ```
  Mesmo com `variant: 'transparent'`, a classe `.prx-rich-card[data-variant='transparent']` ainda mantém borda e fundo ativo. Isso faz com que todo card com classe customizada gere uma "caixa dentro de outra caixa" (dupla borda, duplo padding e caixa branca dentro de caixa estilizada).
* **Proposta Canônica de Evolução:**
  1. Adicionar `'unstyled'` ou `'none'` à união `RichCardVariant` em `@praxisui/core`:
     ```typescript
     export type RichCardVariant = 'plain' | 'outlined' | 'elevated' | 'filled' | 'transparent' | 'unstyled';
     ```
  2. Em `praxis-rich-content.ts`, quando `node.variant === 'unstyled'`, resetar bordas, background, sombras e padding de `.prx-rich-card`.
  3. Alternativamente, aplicar `node.className` diretamente à tag `<section class="prx-rich-card">` quando o nó for um card.
* **Workaround Atual no Consumidor:**
  Resetar explicitamente no host via CSS:
  ```scss
  .hero-executive-banner .prx-rich-card,
  .bento-kpi-card .prx-rich-card,
  .hub-card-action .prx-rich-action-card {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  ```
* **Atualização Pós-Introdução da Governança de Temas (`theme-praxis.scss`):**
  Com o mapeamento de tokens via ponte de tema, o fundo interno `--prx-rich-card-tone-bg` e a borda `--md-sys-color-outline-variant` agora assumem os valores semânticos da aplicação em vez do fallback estático branco `#fff` e cinza `#cac4d0`. 
  No entanto, **o problema estrutural da casca duplicada no DOM (`prx-rich-node` + `prx-rich-card`) permanece inalterado**: os cards continuam com duplo padding e dupla borda concêntrica quando o consumidor adiciona classes de estilo (`.glass-panel`, `.bento-kpi-card`) ao nó. A necessidade da variante `'unstyled'` ou repasse de `node.className` para a `<section>` interna continua 100% prioritária.

---

### ISSUE-002: Badges/Chips com Estilos Fixos Material 3 e `icon` Ignorado no Template
* **Biblioteca:** `@praxisui/rich-content`
* **Status:** `[PENDING]`
* **Gravidade:** Alta (Inconsistência visual e regressão de propriedades de contrato)
* **Diagnóstico Técnico:**
  1. **Aninhamento Indevido de Caixas de Cor:** O nó `badge` renderiza `<div class="prx-rich-node [node.className]"><span class="prx-rich-badge">{{ label }}</span></div>`. O `<span>` interno possui estilos fixos acoplados ao tema roxo Material 3:
     ```css
     .prx-rich-badge {
       background: var(--md-sys-color-primary-container, #e8def8);
       color: var(--md-sys-color-on-primary-container, #21005d);
       padding: 2px 10px;
       border-radius: 999px;
     }
     ```
     Quando o consumidor define uma pílula verde (ex.: `.status-pill.ready-pill`), a cor verde vai para a `div` externa, enquanto o `span` interno renderiza um fundo roxo `#e8def8`. Resultado: "texto roxo dentro de caixa verde".
  2. **Ícone Ignorado:** A interface `RichBadgeNode` define explicitamente:
     ```typescript
     export interface RichBadgeNode extends RichBlockBaseNode {
       type: 'badge';
       label?: string;
       icon?: string; // Definido na interface!
     }
     ```
     Entretanto, o template em `praxis-rich-content.ts` (linhas 123-127) ignora `node.icon`:
     ```html
     @case ('badge') {
       <span class="prx-rich-badge">{{ resolveBadgeLabel(node) }}</span>
     }
     ```
     O ícone nunca é renderizado.
* **Proposta Canônica de Evolução:**
  1. Suportar propriedade `tone` em `RichBadgeNode` (`tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'`).
  2. No template, renderizar o ícone se presente:
     ```html
     @case ('badge') {
       <span class="prx-rich-badge" [attr.data-tone]="node.tone">
         @if (node.icon) {
           <span class="material-symbols-outlined prx-rich-badge__icon">{{ node.icon }}</span>
         }
         <span class="prx-rich-badge__label">{{ resolveBadgeLabel(node) }}</span>
       </span>
     }
     ```
  3. Fazer com que `.prx-rich-badge` respeite herança de background quando encapsulado por classes customizadas.
* **Workaround Atual no Consumidor:**
  - Resetar `.status-pill .prx-rich-badge { background: transparent !important; color: inherit !important; padding: 0 !important; }`.
  - Usar nó `compose` com `direction: 'row'` agrupando `{ type: 'icon' }` e `{ type: 'badge' }`.
* **Atualização Pós-Introdução da Governança de Temas (`theme-praxis.scss`):**
  Com a ponte de tema, o token `--md-sys-color-primary-container` agora é alimentado pela cor primária da aplicação, eliminando a exibição acidental do roxo Material 3 (`#e8def8`) por padrão.
  Contudo, **as três deficiências centrais permanecem abertas**:
  1. `RichBadgeNode` não possui propriedade semântica `tone?: 'ready' | 'operations' | 'success' | 'warning' | ...`, impedindo a coloração declarativa contextual por tipo de status.
  2. A tag interna `<span class="prx-rich-badge">` continua desenhando uma caixa própria com background ativo que conflita e sobrepõe classes customizadas do consumidor aplicadas em `div.prx-rich-node`.
  3. A propriedade `icon?: string` declarada no contrato de TypeScript continua sendo **completamente ignorada** pelo template de `praxis-rich-content.ts`.

---

### ISSUE-003: `RichProgressNode` Não Aceita Literais Numéricos e Falta `value: number`
* **Biblioteca:** `@praxisui/rich-content` / `@praxisui/core`
* **Status:** `[PENDING]`
* **Gravidade:** Média (Dificuldade de configuração e falha silenciosa para valores estáticos)
* **Diagnóstico Técnico:**
  A interface `RichProgressNode` só possui `valueExpr: string`:
  ```typescript
  export interface RichProgressNode extends RichBlockBaseNode {
    type: 'progress';
    valueExpr: string;
    max?: number;
    showPercent?: boolean;
  }
  ```
  Na implementação de `resolveProgressValue`:
  ```typescript
  resolveProgressValue(node): number {
    const value = this.resolveValue(node.valueExpr);
    return typeof value === 'number' ? value : Number(value ?? 0);
  }
  ```
  Por sua vez, `resolveValue(node.valueExpr)` chama `resolveStructuredValue(expression)`, que executa `this.getByPath(this.buildEvaluationContext(), path)`.
  Se o desenvolvedor passar um valor literal como `valueExpr: '98.4'`, o motor busca a chave `'98.4'` dentro do objeto de contexto de dados. Como essa propriedade não existe, retorna `null` -> `Number(null ?? 0) = 0`.
  A barra de progresso renderiza com `<progress value="0" max="100">`, exibindo uma linha cinza inativa e vazia.
* **Proposta Canônica de Evolução:**
  1. Adicionar `value?: number` diretamente na interface `RichProgressNode`:
     ```typescript
     export interface RichProgressNode extends RichBlockBaseNode {
       type: 'progress';
       value?: number;
       valueExpr?: string;
       max?: number;
       showPercent?: boolean;
     }
     ```
  2. Em `resolveProgressValue`, avaliar primeiro `node.value`. Caso utilize `node.valueExpr`, verificar se o valor já é uma constante numérica finita antes de consultar o contexto:
     ```typescript
     if (typeof node.value === 'number') return node.value;
     if (node.valueExpr && !Number.isNaN(Number(node.valueExpr.trim()))) {
       return Number(node.valueExpr.trim());
     }
     ```
* **Workaround Atual no Consumidor:**
  Injetar o valor dentro do objeto `context` do componente (`inputs: { context: { progressVal: 98.4 } }`) e apontar `valueExpr: 'progressVal'`.

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
* **Status:** `[PENDING]`
* **Gravidade:** Baixa / Consistência
* **Diagnóstico Técnico:**
  Enquanto todas as outras bibliotecas da plataforma exportam seus componentes com sufixo `Component` (`PraxisCrudComponent`, `PraxisChartComponent`, `DynamicPageBuilderComponent`), a biblioteca `@praxisui/rich-content` exporta apenas como `PraxisRichContent`.
* **Proposta Canônica de Evolução:**
  Adicionar alias no `public-api.ts`:
  ```typescript
  export { PraxisRichContent, PraxisRichContent as PraxisRichContentComponent };
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

### ISSUE-015: Fundo Translúcido e Ausência de Respiro (*Viewport Inset*) em Widgets no Modo Fullscreen / Maximizado
* **Biblioteca:** `@praxisui/core` (`WidgetShellComponent`)
* **Status:** `[PENDING]`
* **Gravidade:** Alta (Interferência visual grave, vazamento de tela de fundo e falta de respiro perimetral em modo de foco profundo)
* **Diagnóstico Técnico & Evidência Real:**
  No componente `WidgetShellComponent` (`widget-shell.component.ts`), quando a ação `fullscreen` é acionada (`action.id === 'fullscreen'`), o widget recebe a classe `.pdx-shell.fullscreen`.
  A regra CSS na biblioteca é:
  ```css
  .pdx-shell.fullscreen {
    position: fixed;
    inset: 0;
    width: auto;
    height: auto;
    transform: none;
    border-radius: 0;
    z-index: var(--praxis-layer-widget-shell-fullscreen, 1291);
    box-shadow: var(--mat-elevation-level8);
  }
  ```
  Duas falhas graves ocorrem nessa implementação:
  1. **Fundo Translúcido / Ausência de Superfície Opaca no Fullscreen:**
     - `.pdx-shell.fullscreen` **não possui nenhuma declaração de `background` própria**.
     - O container continua herdando a regra de `.pdx-shell.dashboard`:
       ```css
       background: var(--pdx-shell-card-bg, var(--pdx-dashboard-card-bg, var(--md-sys-color-surface-container-low)));
       ```
     - Em aplicações com temas modernos translúcidos (Glassmorphism, Cyber Command ou painéis translúcidos com `color-mix(..., transparent)`), ou quando um widget hospeda componentes com canvas transparente (como `praxis-chart`), o conteúdo inteiro da página de fundo (cards bento, banners hero, sidebars, tabelas) vaza através do gráfico maximizado. O usuário vê as linhas do gráfico sobrepostas a números, textos e botões da página de baixo, gerando poluição cognitiva extrema e aparência de bug de renderização.
  2. **Ausência de Respiro / Inset Flutuante em Termos de UX:**
     - O modo `fullscreen` fixa o elemento em `inset: 0` forçado e remove o raio de borda (`border-radius: 0`), colando os eixos do gráfico, cabeçalho e legendas diretamente nas bordas da janela do navegador.
     - Segundo as diretrizes de UX Enterprise (Material Design 3, Nielsen Norman Group, Carbon Design System), o modo de expansão/inspeção de dashboards corporativos deve operar como uma **Superfície Flutuante com Respiro (Floating Viewport Inset)** (ex.: gap perimetral de 24px com cantos arredondados e backdrop escurecido/desfocado), garantindo contexto espacial, foco e estética refinada.
* **Proposta Canônica de Evolução da Plataforma:**
  1. **Definir Superfície Sólida Nativamente em `widget-shell.component.ts`:**
     ```css
     .pdx-shell.fullscreen,
     .pdx-shell.expanded {
       background: var(--pdx-shell-fullscreen-bg, var(--md-sys-color-surface, #ffffff));
       color: var(--md-sys-color-on-surface);
     }
     ```
  2. **Evolução de Contrato em `WidgetShellConfig` (`@praxisui/core`):**
     Adicionar propriedades no contrato de ações de janela:
     ```typescript
     export interface WidgetShellWindowActionsConfig {
       collapsible?: boolean;
       expandable?: boolean;
       fullscreen?: boolean;
       fullscreenMode?: 'viewport-inset' | 'edge-to-edge'; // Canônico (default: 'viewport-inset')
       fullscreenInset?: string; // Default: '24px'
     }
     ```
  3. **Estilos Canônicos de Respiro e Backdrop:**
     ```css
     .pdx-shell.fullscreen:not(.edge-to-edge) {
       inset: var(--pdx-shell-fullscreen-inset, 24px);
       border-radius: var(--pdx-shell-fullscreen-radius, 16px);
       overflow: hidden;
     }

     .pdx-shell-backdrop {
       position: fixed;
       inset: 0;
       z-index: var(--praxis-layer-widget-shell-backdrop, 1280);
       background: rgba(0, 0, 0, 0.65);
       backdrop-filter: blur(12px);
       -webkit-backdrop-filter: blur(12px);
     }
     ```
* **Workaround Atual no Consumidor:**
  Aplicar regras globais em `src/styles/theme-praxis.scss` forçando:
  - `.pdx-shell.fullscreen, .pdx-shell.expanded { background: var(--card) !important; }`
  - `.pdx-shell.fullscreen { inset: 24px !important; border-radius: 20px !important; }`
  - `.pdx-shell-backdrop { backdrop-filter: blur(14px) saturate(130%) !important; }`
* **Casos de Teste para o Agente de Plataforma:**
  1. *Test Case 1 (Opaque Surface Validation)*: Acionar fullscreen em widget com card translúcido. Aferir via computed style que `.pdx-shell.fullscreen` possui fundo 100% opaco e que nenhum elemento sob ele vaza.
  2. *Test Case 2 (Viewport Inset Breathing Room)*: Em resolução desktop (1920x1080), aferir que o bounding box do widget em fullscreen possui margem perimetral >= 24px em relação às bordas do viewport.
  3. *Test Case 3 (Responsividade Mobile)*: Em resolução mobile (< 768px), o inset deve se ajustar dinamicamente para <= 10px para preservar a área útil de leitura.



