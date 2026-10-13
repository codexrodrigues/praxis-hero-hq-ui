# Praxis Hero HQ UI

**Demonstração publicada:** [praxis-hero-hq.web.app](https://praxis-hero-hq.web.app).

**Dependências:** 22 pacotes `@praxisui/*` fixados em `10.0.0-rc.12`, obtidos do
npm público após o postflight oficial. A versão corrige a inferência de paginação
remota para metadados parciais, preservando estratégias explicitamente configuradas.
Em 13/10/2026, o Hero foi publicado no Firebase e validado após reinício oficial do
Render com SDK `8.0.0-rc.169`: schemas, filtros, capabilities e actions carregaram,
e a tabela de Heróis & Colaboradores manteve total 101 no percurso
`1–10 → 11–20 → 1–10`. A nova JVM recuperou `RESTORED`, preservando
READY13/PUBLISHED21. O [recibo de aceite e seus limites](https://github.com/codexrodrigues/praxis-api-quickstart/blob/fadf0ca4/docs/engineering/evidence/render-startup-recovery-live-rc169-20261013/acceptance.json)
registra respostas críticas e términos, inclusive a requisição 304 cancelada com
duplicata 200 concluída. Isso prova esse percurso de leitura, sem alegar SLA ou
escrita de negócio. O [registro anterior](docs/design/hero-publication-2026-10-12.md)
permanece como evidência histórica.

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

Com `npm start` ativo na porta oficial 4302 e `@playwright/test` disponível no
ambiente de testes (ou via `NODE_PATH` apontando para o `node_modules` do workspace Angular):

```bash
node test-e2e/test-multiuser-persistence.cjs
```

O ensaio cobre dez cenários de Dashboard pelo DOM público: carga sem gravação,
edição/salvar/reabrir, isolamento de persona, conflito e recuperação, documento vazio,
retry de save sem perder o rascunho, reset confirmado/falho, falha de carga e viewport estreito. Todas as chamadas `/api/**`
são interceptadas; não acessa o backend remoto nem comprova persistência em banco.
Uma prova operacional de banco exige branch Neon isolada, conforme a governança do workspace.

Para mais detalhes sobre as propostas e evoluções canônicas de plataforma, consulte:
- [`docs/PRAXIS_PLATFORM_EVOLUTIONS.md`](file:///d:/Developer/praxis-plataform/praxis-hero-hq-ui/docs/PRAXIS_PLATFORM_EVOLUTIONS.md)
- [`../docs/ENTERPRISE-UI-CUSTOMIZATION-AND-PERSISTENCE-2026-10.md`](file:///d:/Developer/praxis-plataform/docs/ENTERPRISE-UI-CUSTOMIZATION-AND-PERSISTENCE-2026-10.md)



## Dashboard: página canônica e persistência

O dashboard usa `DynamicPageBuilderComponent` (`praxis-dynamic-page-builder`) sobre
`WidgetPageDefinition`. Não depende de `PraxisDashboardPage`. A toolbar e os indicadores
são apresentação do HQ; identidade, carga, gravação, confirmação e reset pertencem ao
runtime Core, via `pageIdentity`, `autoPersist` e `persistenceChange`.
O host registra `providePraxisDialogGlobalActions()` para as confirmações de remoção
e configura o storage com `errorPolicy: 'fail'` para exibir falhas de carga.

A identidade usa app `praxis-hero-hq`, tenant e usuário da persona ativa, e rota `/`.
O adapter remoto continua usando a identidade HTTP do host. Não há cache de layout
paralelo nem hooks globais `PAX_*`. Uma definição salva é reaberta integralmente, inclusive
quando todos os widgets foram removidos; não há merge implícito com novos widgets de fábrica.

A chave antiga `dynamic-page:hq-dashboard` e os caches locais antigos não são lidos pelo
novo fluxo. Nenhum registro antigo é apagado automaticamente. A adoção beta inicia o layout
na nova identidade canônica; importar dados antigos exige uma migração com dono/escopo
verificados, não a cópia de um cache compartilhado. “Restaurar Fábrica” só conclui após o
backend confirmar; erros e conflitos permanecem visíveis. “Descartar alterações e recarregar”
é uma ação explícita para recuperar o documento salvo.

Os 22 pacotes `@praxisui/*` estão fixados em **10.0.0-rc.9**, com lockfile
resolvido no npm público. Esta versão contém as correções canônicas de shell,
cores/tooltip dos gráficos e ciclo de contexto do CRUD.

```sh
npm ci --registry=https://registry.npmjs.org/
npm run build
npm start
```

A release oficial por tag `praxis-ui-v10.0.0-rc.9` passou por build, publicação OIDC
e postflight dos 22 pacotes. A adoção deste host passou por instalação limpa e
build; não depende de tarballs locais, paths para `dist` ou flags de peer legado.
O canal `latest` permanece na linha estável; o host fixa a versão RC exata para
reproduzir a apresentação.

A troca de persona é uma simulação privada: o host recria sua rota ao escolher
outra persona, sem emitir evento global para as bibliotecas. Isso não equivale
a uma sessão corporativa confirmada no Core.

## Aparência do workspace

O menu **Aparência** no cabeçalho oferece **Essência**, **Aurora** e **Órbita**,
com as paletas do Ergon Workflow Designer. Órbita permanece o padrão deste host.
A preferência é local ao navegador e sincronizada entre abas; não altera a persona,
o dashboard salvo ou dados de negócio. Work Sans é a fonte principal.

A folha privada `src/styles/workspace-themes.scss` define as paletas;
`src/styles/theme-praxis.scss` traduz esses valores para Material e os tokens dos
componentes Praxis, incluindo tabela, CRUD/KPI e overlays. Não adicionar cores
isoladas em cada página para ajustar o tema.

Validação focal sem backend/banco:

```bash
node scripts/workspace/verify-workspace-themes.mjs
npm run build
```

Consulte o [estudo e evidências dos temas](docs/design/workspace-themes-2026-10-11.md)
para conhecer os tokens investigados, os estados conferidos e os limites de fidelidade.

## Publicação no Firebase Hosting

O frontend usa o projeto Firebase `praxis-hero-hq`, definido em `.firebaserc`,
e publica `dist/praxis-hero-hq-ui/browser`, conforme `firebase.json`. A primeira
publicação de Praxis rc.9 foi feita com a CLI oficial Firebase 15.33.0, após
instalação limpa e build, usando a sessão já autenticada do operador:

```sh
npm ci --registry=https://registry.npmjs.org/
npm run build
npx --yes --registry=https://registry.npmjs.org/ firebase-tools@15.33.0 deploy --only hosting --project praxis-hero-hq
```

O workflow GitHub `firebase-deploy.yml` executa instalação/build após push em
`main`, mas seu deploy depende do secret
`FIREBASE_SERVICE_ACCOUNT_PRAXIS_HERO_HQ`. No run `38310673919`, instalação e
build passaram e o deploy foi ignorado pela ausência desse secret. Não considere
um workflow verde, por si só, prova de publicação: confira a etapa de deploy.
A automação futura precisa de autenticação própria; nenhuma chave de serviço
foi criada nesta publicação.

A API pública usada pelo host é `https://praxis-api-quickstart.onrender.com`.
Seu proprietário é o Quickstart. A origem exata `https://praxis-hero-hq.web.app`
deve estar em `CORS_ALLOWED_ORIGINS` e
`APP_SECURITY_CONFIG_ORIGIN_RESTRICTION_ALLOWED_ORIGINS`. Não use wildcard nem
desative autenticação, CSRF ou o filtro de origem para contornar bloqueios.
A persona do host continua uma simulação; ela não concede autoridade corporativa.
