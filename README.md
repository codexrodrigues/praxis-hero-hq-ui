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
