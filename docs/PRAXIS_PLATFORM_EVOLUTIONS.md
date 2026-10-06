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

### ISSUE-004: Suporte a Nós Canônicos de Layout em Grid / Colunas (`RichGridNode` / `RichColumnsNode`)
* **Biblioteca:** `@praxisui/rich-content` / `@praxisui/core`
* **Status:** `[PENDING]`
* **Gravidade:** Média (Flexibilidade de composição e alinhamento de blocos ricos)
* **Diagnóstico Técnico:**
  O nó `compose` suporta apenas alinhamento linear unidirecional (`direction: 'row' | 'column'`). Não há no vocabulário canônico de `RichContentNode` suporte a definição de colunas com proporções explícitas (ex.: coluna esquerda 40% com card de perfil, coluna direita 60% com timeline de histórico). Isso obriga os consumidores a recorrerem a `::ng-deep` com regras ad-hoc de grid CSS sobre classes do nó.
* **Proposta Canônica de Evolução:**
  Adicionar nó `columns` ou `grid`:
  ```typescript
  export interface RichColumnsNode extends RichBlockBaseNode {
    type: 'columns';
    columns: Array<{
      span?: number;
      width?: string;
      items: RichContentNode[];
    }>;
    gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    responsive?: boolean;
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
