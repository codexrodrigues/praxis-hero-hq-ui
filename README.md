# Praxis Hero HQ UI

**Demonstração publicada:** [praxis-hero-hq.web.app](https://praxis-hero-hq.web.app).

**Dependências:** 22 pacotes `@praxisui/*` com versões exatas declaradas em
[package.json](package.json); o lockfile registra a resolução reproduzível. Confira os
arquivos juntos antes de instalar ou atualizar. A versão de um checkout não comprova
qual versão está atualmente publicada no Firebase.

O Hero combina schemas remotos, configurações declarativas do produto e componentes
próprios de apresentação. O backend publica os contratos de recursos; as bibliotecas
Praxis interpretam esses contratos. Navegação, personas simuladas e identidade visual
pertencem a este host.

A publicação de 13/10/2026 possui um [recibo histórico de aceite e limites](https://github.com/codexrodrigues/praxis-api-quickstart/blob/fadf0ca4/docs/engineering/evidence/render-startup-recovery-live-rc169-20261013/acceptance.json).
Consulte também o [registro da publicação anterior](docs/design/hero-publication-2026-10-12.md).
Esses registros não representam uma verificação atual do serviço.

---

## 🎯 Princípios Fundamentais

1. **Formulários de negócio por metadados:** Os recursos usam `<praxis-dynamic-form>` e `/schemas/filtered`. Controles do shell e do laboratório (nome de página/menu) pertencem ao host; formulários authorados no laboratório usam os editores canônicos Praxis.
2. **Listagens orientadas a recursos:** As páginas de recursos usam `PraxisResourcePage` e o runtime de CRUD/tabela. Widgets do dashboard também podem usar dados locais e projeções de agregações.
3. **Superfícies Dinâmicas:** As visões de detalhe (Dossiê 360) projetam contratos `@UiSurface` do backend ([`FuncionarioController`](https://github.com/codexrodrigues/praxis-api-quickstart/blob/main/src/main/java/com/example/praxis/apiquickstart/hr/controller/FuncionarioController.java)).
4. **Governança de Workflow:** Ações de ciclo de vida utilizam `@WorkflowAction` com controle de concorrência por ETag (`If-Match`).
5. **Design System & HUD Tático:** Tokens OKLCH para temas Claro e Escuro, glassmorphism, indicadores de prontidão e DEFCON calculados pelo shell.

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js `^20.19.0`, `^22.12.0` ou `>=24.0.0`, conforme o Angular CLI instalado.
- npm >= 10.x

### Instalação
```bash
npm ci
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

## Laboratório do visitante

Em **Meu laboratório** (`/laboratorio`), crie páginas e formulários pelo Page Builder,
salve uma nova rota e acrescente seus próprios menus. Páginas, menus e preferências
deste editor ficam neste navegador, sem login, separados por persona simulada.
A rota continua disponível após recarregar; o link não compartilha o documento com
outro dispositivo. Dados e envio dos widgets seguem as APIs de demonstração.

Consulte [uso, limites e validações do laboratório](docs/engineering/visitor-lab.md).

Nos Studios `/comando-studio` e `/workspace-studio`, use **Salvar cópia em nova rota**
para levar o documento editado ao laboratório. Escolha nome, menu e ícone, salve e
abra a nova URL. O original é preservado; a página salva e seu ícone sobrevivem à recarga.

## 🛡️ Customização Avançada & Persistência Multi-Usuário

As páginas existentes de dashboard e recursos implementam um case corporativo de governança com persistência remota no `praxis-config-starter` (`https://praxis-api-quickstart.onrender.com/api/praxis/config/ui`):

1. **Dashboard Executivo (Page Builder):**
   - Gráficos customizados com dados reais de agregação: **Área Volumétrica** (`type: 'area'`) e **Barras Horizontais** (`type: 'horizontal-bar'`).
   - Novo widget governado com **Formulário Dinâmico Tático** (`praxis-dynamic-form`) integrado ao grid.
2. **Páginas de recursos:**
   - Cada recurso define projeções de colunas, filtros rápidos, KPIs e apresentação específica do domínio.
   - Os padrões transversais de tabela e formulário (densidade, espaçamento, tipografia, filtros inline e expansão) são herdados de [`GLOBAL_CONFIG_SEED`](src/app/core/platform.config.ts).
3. **Personas e persistência:**
   - O host fornece identidade de usuário e tenant ao adapter remoto.
   - Os ensaios com HTTP interceptado validam o contrato de UI; não comprovam isolamento em banco ou autorização corporativa.

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
- [Histórico de evoluções documentado](docs/PRAXIS_PLATFORM_EVOLUTIONS.md)
- [Catálogo de acompanhamento de evoluções](praxis-platform-evolutions.md)



## Dashboard: página canônica e persistência

O dashboard usa `DynamicPageBuilderComponent` (`praxis-dynamic-page-builder`) sobre
`WidgetPageDefinition`. Não depende de `PraxisDashboardPage`. A toolbar e os indicadores
são apresentação do HQ; identidade, carga, gravação, confirmação e reset pertencem ao
runtime Core, via `pageIdentity`, `autoPersist` e `persistenceChange`.
O host registra `providePraxisDialogGlobalActions()` para as confirmações de remoção
e configura o storage com `errorPolicy: 'fail'` para exibir falhas de carga.

A identidade usa app `praxis-hero-hq`, tenant e usuário da persona ativa, e rota `/`.
O adapter remoto continua usando a identidade HTTP do host. Não há cache de layout
paralelo nem hooks globais de teste. O bootstrap fornece `PAX_FETCH_HEADERS` como
bridge de headers para chamadas fetch. O documento salvo é carregado pelo runtime, inclusive quando está vazio. Há uma
exceção local: o interceptor do host reconcilia o widget `heroBanner` legado com a
definição atual do radar, em memória. Essa transformação substitui a definição desse
widget; não constitui gravação automática nem migração geral dos demais widgets.

A chave antiga `dynamic-page:hq-dashboard` e os caches locais antigos não são lidos pelo
novo fluxo. Nenhum registro antigo é apagado automaticamente. A adoção beta inicia o layout
na nova identidade canônica; importar dados antigos exige uma migração com dono/escopo
verificados, não a cópia de um cache compartilhado. “Restaurar Fábrica” só conclui após o
backend confirmar; erros e conflitos permanecem visíveis. “Descartar alterações e recarregar”
é uma ação explícita para recuperar o documento salvo.

Para instalar as versões registradas no lockfile e iniciar o host:

```sh
npm ci --registry=https://registry.npmjs.org/
npm run build
npm start
```

Informações de versões e releases anteriores pertencem aos registros históricos de
publicação. O README não presume o estado atual de dist-tags ou do serviço remoto.

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
e publica `dist/praxis-hero-hq-ui/browser`, conforme `firebase.json`. O fluxo atual está descrito em
[Publicação do Hero no Firebase Hosting](docs/engineering/firebase-hosting-deployment.md).
O workflow valida a credencial antes de instalar e compilar; ausência ou formato
inválido falha o job. Confirme a etapa de deploy e a release live para comprovar
publicação. Incidentes antigos com deploy ignorado são registros históricos.

A API pública usada pelo host é `https://praxis-api-quickstart.onrender.com`.
Seu proprietário é o Quickstart. A origem exata `https://praxis-hero-hq.web.app`
deve estar em `CORS_ALLOWED_ORIGINS` e
`APP_SECURITY_CONFIG_ORIGIN_RESTRICTION_ALLOWED_ORIGINS`. Não use wildcard nem
desative autenticação, CSRF ou o filtro de origem para contornar bloqueios.
A persona do host continua uma simulação; ela não concede autoridade corporativa.

## Definição das páginas e navegação

[page-definitions.ts](src/app/core/page-definitions.ts) declara os destinos do produto,
seus grupos, requisitos de acesso e bindings lazy. [app.routes.ts](src/app/app.routes.ts)
projeta as rotas Angular; [navigation.model.ts](src/app/core/navigation.model.ts) projeta
o menu e os badges. Títulos, descrições e ícones do menu são usados como defaults da
página; diferenças editoriais ficam explícitas na definição da página. O caminho da
API é declarado separadamente do caminho de navegação.

O requisito `clearance` alimenta o guard da rota e o indicador do shell. O badge é
apresentação, não fonte de permissão. As personas e seus tokens são simulações
privadas do host; o guard não substitui autorização no backend. Os loaders de
componentes e metadados continuam sendo `import()` lazy.

Validação local focal: `npm test` verifica tipagem dos specs, invariantes, contratos
de navegação e harnesses isolados. Isso não executa os specs em TestBed nem comprova
integração com o backend. A bateria de browser exige servidor na porta oficial 4302.

A política local de acesso usa `clearance` tipado da persona, separado do texto de
exibição da credencial, e vale para páginas de recurso e de componente. Badges
informativos, como STUDIO, não anunciam autorização. O teste de catálogo mantém
um inventário independente dos destinos e recursos esperados.


### Adoção corporativa — P3-C em incrementos

Em [/workspace-corporativo](http://127.0.0.1:4302/workspace-corporativo), consulte a sessão e selecione um contexto permitido pelo servidor. Personas do Hero não autenticam essa sessão. O laboratório local continua disponível sem login. A seleção real depende da integração SESSION/CSRF/CORS do backend; este recorte de UI tem teste de navegador com APIs interceptadas e não encerra a prova HTTP/Neon. Veja [escopo, provas reutilizadas e próximos incrementos](docs/engineering/p3c-host-adoption.md).

### Jornada de páginas da plataforma — candidato

O laboratório agora consome as ações reutilizáveis Copy/SaveAs do Page Builder, com adapter local de persistência. Esta branch requer os pacotes candidatos da plataforma e permanece dependente da adoção pública do SDK antes de integração. [Contrato de adoção, reprodução e provas](docs/engineering/reusable-page-journey.md).
