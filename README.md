# Praxis Hero HQ UI

> **Plataforma Corporativa de Gestão Tática & RH de Super-Heróis** construída sobre a **Plataforma Praxis** (`@praxisui/*`), Angular 21 e arquitetura 100% orientada a metadados (*metadata-driven*).

---

## 🎯 Princípios Fundamentais

1. **Zero Formulários Manuais:** Nenhum campo ou validação é codificado em templates HTML. Todos os fluxos de criação e edição são governados por `<praxis-dynamic-form>` e `/schemas/filtered`.
2. **Zero Tabelas Estáticas:** Todas as listagens analíticas utilizam `<praxis-table>` e `<praxis-crud>` com paginação server-side, ordenação e filtros remotos.
3. **Superfícies Dinâmicas:** As visões de detalhe (Dossiê 360) projetam contratos `@UiSurface` do backend ([`FuncionarioController`](file:///D:/Developer/praxis-plataform/praxis-api-quickstart/src/main/java/com/example/praxis/apiquickstart/hr/controller/FuncionarioController.java)).
4. **Governança de Workflow:** Ações de ciclo de vida utilizam `@WorkflowAction` com controle de concorrência por ETag (`If-Match`).
5. **Design System & HUD Tático:** Tokens OKLCH para temas Claro e Escuro, glassmorphism, indicador de prontidão (98,4%) e Defcon 5.

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js >= 20.x
- npm >= 10.x

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm start
# Aplicação disponível em: http://127.0.0.1:4302
```

### Build de Produção
```bash
npm run build
```

---

## 🛡️ Customização Avançada & Persistência Multi-Usuário

A aplicação implementa um case corporativo de governança com persistência remota no `praxis-config-starter` (`https://praxis-api-quickstart.onrender.com/api/praxis/config/ui`):

1. **Dashboard Executivo (Page Builder):**
   - Gráficos customizados com dados reais de agregação: **Área Volumétrica** (`type: 'area'`) e **Barras Horizontais** (`type: 'horizontal-bar'`).
   - Novo widget governado com **Formulário Dinâmico Tático** (`praxis-dynamic-form`) integrado ao grid.
2. **Tabela de Suprimentos / Pedidos (`praxis-table` & `praxis-crud`):**
   - **Coluna Composta (`compose` renderer):** Unificação de `id` e `currency` na coluna *"Ordem & Moeda"*.
   - **Ocultação Seletiva de Colunas:** Projeção canônica via `columnProjection.include`.
   - **Regras Condicionais de Célula e Linha:** Badges temáticos com ícones, realces para lotes volumosos e opacidade em ordens canceladas via JsonLogic.
   - **Densidade Compacta e Animações:** Layout otimizado para visão executiva.
3. **Isolamento Estrito entre Personas:**
   - **Nick Fury (`nick.fury`):** Visualiza e persiste seus layouts customizados (HTTP 200).
   - **Tony Stark (`tony.stark`):** Recebe o baseline 100% de fábrica / governança limpo (HTTP 404).
   - **Restauração de Fábrica:** Botão que dispara `HTTP DELETE 204` e retorna aos padrões de governança.

### 🧪 Executando a Bateria E2E Automatizada (Playwright)

```powershell
# Execução da bateria automatizada de 8 etapas
$env:NODE_PATH = "D:\Developer\praxis-plataform\.worktrees\praxis-json-upgrade-p31a\praxis-ui-angular\node_modules"
node test-e2e\test-multiuser-persistence.cjs
```

Para mais detalhes sobre as propostas e evoluções canônicas de plataforma, consulte:
- [`docs/PRAXIS_PLATFORM_EVOLUTIONS.md`](file:///d:/Developer/praxis-plataform/praxis-hero-hq-ui/docs/PRAXIS_PLATFORM_EVOLUTIONS.md)
- [`../docs/ENTERPRISE-UI-CUSTOMIZATION-AND-PERSISTENCE-2026-10.md`](file:///d:/Developer/praxis-plataform/docs/ENTERPRISE-UI-CUSTOMIZATION-AND-PERSISTENCE-2026-10.md)

