# Passagem P3-C — páginas corporativas no Hero

Atualizado em 24/10/2026. Entrega documental para outro agente em outra máquina.
O trabalho funcional está **incompleto**. Este registro distingue fonte publicada,
integração, deploy e prova operacional; não transforma aprovação técnica em sucesso funcional.

## Retomada independente da máquina anterior

Foi feita uma segunda revisão usando **quatro clones HTTPS novos do GitHub**, sem
objetos Git, worktrees, arquivos ignorados ou referências dos checkouts de trabalho.
O [recibo da auditoria remota](remote-only-verification.json) fixa os commits
efetivamente recuperados. Foram encontrados os 20 arquivos essenciais conferidos,
os links do roteiro/prompt, os quatro relatórios gzip íntegros e a governança canônica.
O lock do Hero aponta os 22 pacotes rc.38 para o npm público. Um revisor independente
conferiu os clones e não encontrou dependência obrigatória de processo ou arquivo
da máquina anterior. Não houve instalação de dependências, build ou login nessa auditoria.

| Etapa | O que a outra máquina precisa | Depende desta máquina? |
| --- | --- | --- |
| Ler contexto, revisar código e relatórios | Git e acesso aos repositórios GitHub indicados | Não |
| Desenvolver e validar unidades sem banco | Node 22/npm, JDK 21/Maven e acesso aos registros públicos; instalar dependências próprias | Não; não copiar node_modules, Maven local ou caches antigos |
| Abrir o Hero local | Executar seu próprio `npm start`; `angular.json` usa `proxy.conf.js` e porta 4302 | Não; localhost sempre pertence à máquina que o abre |
| Login e prova funcional no backend | Acesso próprio autorizado às identidades autor/publicador existentes no Render e ao backend ativo | Não usa credencial local antiga, mas exige acesso externo que Git não fornece |
| Release/deploy ou diagnóstico protegido | Acesso próprio autorizado às contas/serviços de publicação, GitHub e Render pertinentes | Não usa tokens desta máquina; essas permissões não foram comprovadas para o sucessor |

Portanto, **os repositórios bastam para retomar análise e desenvolvimento; não bastam,
sozinhos, para autenticar ou implantar**. A ausência de segredos no pacote é intencional.
O agente deve conferir seu acesso aos serviços pelo fluxo oficial. Se esse acesso
faltar, continuar o trabalho independente e registrar o gate operacional pendente;
não criar usuários/grants de contorno, pedir senhas no chat ou copiar sessões antigas.
Dados publicados e a tentativa antiga estão no backend remoto, não dentro do Git;
consultá-los exige uma nova sessão autorizada e sua existência atual deve ser relida.

Em uma pasta de trabalho escolhida na outra máquina, os pontos de partida são:

```sh
git clone --single-branch --branch feat/corporate-page-content-copy https://github.com/codexrodrigues/praxis-hero-hq-ui.git
git clone --single-branch --branch fix/published-copy-capture-admission https://github.com/codexrodrigues/praxis-config-starter.git
git clone --single-branch --branch main https://github.com/codexrodrigues/praxis-api-quickstart.git
git clone --single-branch --branch main https://github.com/codexrodrigues/praxis-codex-skills.git
```

Essas são referências de retomada, não uma instrução para sobrescrever clones já
existentes. Conferir os HEADs contra os recibos e o GitHub; depois instalar somente
as dependências necessárias. Se precisar inspecionar o fonte do SDK, obter também
`codexrodrigues/praxis-ui-angular` na tag `praxis-ui-v10.0.0-rc.38` indicada abaixo.
Não usar o `main` mais recente da biblioteca como se fosse o pacote consumido.

## Objetivo e critério de conclusão

O Hero é o laboratório/vitrine de uma jornada reutilizável da plataforma Praxis:
criar uma página, editar conteúdo pelo editor oficial, salvar um draft governado,
submeter/aprovar/publicar com atores distintos e acessar a publicação por menu e rota
persistentes após recarregar. Deve também copiar uma publicação com conteúdo real
para outra identidade/rota, editar a cópia, vincular explicitamente outro menu e
publicá-la sem modificar a origem. A solução pertence aos contratos canônicos;
outros hosts não devem reconstruir regras de autorização ou persistência.

Para encerrar: provar o fluxo de cópia e publicação no Hero/Quickstart reais dentro
do orçamento existente, conferir origem preservada e cópia independente, reler após
recarga, revisar o pacote final por outro agente e integrar respeitando dependências.
Atualizar documentação, exemplos e skills afetados. Não declarar produção/SLA com
base num único caminho feliz ou num teste com transporte simulado.

## Restrições que continuam válidas

- **Não repetir o ensaio/campanha Neon.** O usuário dispensou explicitamente sua
  repetição. Reutilizar provas válidas; testes unitários sem banco são permitidos.
  Novas validações que realmente dependam de banco seguem as instruções de banco
  remoto/branch isolada, sem fallback local silencioso e sem presumir autorização
  para reabrir a campanha dispensada.
- Preservar autorização, tenant/organização/SESSION, CSRF, proveniência, CAS/ETags,
  idempotência, rollback e orçamento total de **40 segundos**. Não aumentar timeout,
  cachear grants ou suprimir checkpoints para obter sucesso aparente.
- Corrigir a fonte canônica; inventariar capacidades existentes antes de criar
  contratos, DTOs, endpoints ou convenções locais.
- Não repetir POST incerto automaticamente. Consultar a mesma `creationKey` pelo
  endpoint canônico; `404` não prova sozinho rollback completo nem autoriza replay.
- As autorizações operacionais anteriores incluíram uso das identidades existentes
  do Render e deploys necessários ao fluxo. Uma janela de republicação foi autorizada
  e usada anteriormente. Isso não significa licença permanente para suspender
  operações sem diagnóstico. O último deploy não exigiu republicação alguma.
- Preservar alterações de outros trabalhos; não importar os checkouts locais sujos
  como se fossem baseline desta tarefa.

## O que funciona e o que não foi concluído

| Parte | Estado observado |
| --- | --- |
| Laboratório visitante `/laboratorio` | Criação/cópia local, menu e rota por navegador/persona; não equivale ao fluxo corporativo |
| SESSION/CSRF/contexto corporativo | Implementados; login/logout e contexto usados com usuários reais no Render |
| Primeiro agregado de grupos | Publicado; grupos selecionáveis nos bindings das páginas |
| Página corporativa inicialmente vazia | Criada, salva, publicada, lida por rota/menu e recarregada no corte anterior |
| Conteúdo Form real | Campo local criado e editado **visualmente**, salvo, aplicado à organização, congelado, submetido, aprovado por outro ator e publicado |
| Conteúdo/menu/rota após recarga | Confirmados por UI/árvore de acessibilidade no corte de conteúdo; mesma release apresentada |
| Cópia de publicação | Implementada no host, mas **falhou no uso real**: POST 503 em 40.973 ms; reconciliação GET 404 em 1.361 ms |
| Otimização Config #533 | Revisada e em PR; reduz uma admissão, sem prova de resolver o timeout |
| Produção frontend/Firebase | Não implantada neste ciclo; proxy local não comprova cookies/CORS no domínio Firebase |

O piloto é um Form com campos locais/transitórios e ícone `home`. Não persiste os
valores digitados pelos usuários como registros de domínio. Não há submissão a API
de negócio, editor irrestrito de qualquer recurso, edição geral do agregado de grupos
ou preview imutável completo para o revisor. Esses limites não foram resolvidos por
chamar o formulário de “conteúdo real”.

## Baselines remotos e dependências

Auditoria por `gh pr view` e `git ls-remote`, registrada em
[remote-audit.json](remote-audit.json). SHA abaixo é de fonte, não merge sintético
`refs/pull/*/merge`. Reconsultar o GitHub antes de trabalhar: os estados podem mudar.
O HEAD do Hero nessa auditoria é o baseline de implementação anterior ao commit
documental desta passagem; o commit de documentação posterior não muda esse código.

| Repositório | Ponto de retomada | Estado na passagem |
| --- | --- | --- |
| [Hero](https://github.com/codexrodrigues/praxis-hero-hq-ui/pull/19) | `feat/corporate-page-content-copy`, `d72442f9a1125e9e0afdc416c5109e146d5c46c9` | PR #19 aberto; fonte e evidências no remoto |
| [Config](https://github.com/codexrodrigues/praxis-config-starter/pull/533) | `fix/published-copy-capture-admission`, `6d6baf7f88cfdf213754d56162d8d42fa81045dc` | PR #533 aberto; não integrado, não lançado, não implantado |
| [Quickstart](https://github.com/codexrodrigues/praxis-api-quickstart/pull/479) | `main`, merge `d6c11592ce885d7f5aeb058314268e2ac5cafa17` | #479 integrado e último deploy observado no Render |
| [Skills](https://github.com/codexrodrigues/praxis-codex-skills/pull/865) | `main`, `9298573bddcfa848512b3f37e87af71c247197c3` | #862–#865 integrados; skills afetadas sincronizadas seletivamente |
| SDK Angular publicado | `@praxisui/*@10.0.0-rc.38` | 22 pacotes do Hero e lock alinhados ao npm público |
| Config publicado | `0.1.0-rc.174` | Usado pelo Quickstart ativo; tag aponta a `49ba906536e9acec7f667842228e5ff25d40c621` |

Hero: #18 foi integrado na base de #17; #17 na base de #16; #16 na branch do #13.
O resultado está em `codex/visitor-lab-delivery` (`b68ea95e722ea5bfd6d4630844e79947cec4011a`).
**#13 → main continua aberto**. #19 tem essa branch como base. Não tentar integrar
apenas #19 diretamente em main, nem tratar #18 como já publicado em produção.

Config #532 levou à publicação rc.174; Quickstart #477 adotou-a, #478 registrou a
criação real e #479 admitiu conteúdo Form local. #533 é posterior à versão ativa.
Não assumir Config rc.175 ou que um merge de #533 já ocorreu.

O último revisor corrigiu uma comparação equivocada: mudanças de RH/missão e a
remoção aparente de um script vinham de comparação *two-dot* com main divergente,
não do delta real do #13. Preservar o commit de main `1ba9062` e usar o merge-base/
delta real. O build válido da branch não substitui build da árvore mesclada final.

## Fonte canônica e arquivos para ler

- **Config**: persistência, admissões, lifecycle, cópia e navegação autorizada.
  `PageCreationService`, `PageCatalogLifecycleBridge`, `PageRuntimeReadService`,
  `PageCopyTransformation`, `PageCreationHost`, `UiLayoutValidationContext` e stores.
  Começar por `docs/ai/contracts/page-publication-p0/`, especialmente
  `P3C-VALIDATION-BUDGET-521.md` e `PageCreationFullPathCostTest`.
- **Quickstart**: host operacional, SESSION/grants e perfil fechado do piloto.
  `docs/CORPORATE-PAGES-PILOT.md`, `QuickstartPageConfiguration`,
  `QuickstartPageFormContentPolicy`, `QuickstartPageHost` e configuração enterprise.
- **SDK/Core/Form**: contratos públicos e editor/materialização oficiais. O contrato
  efetivamente consumido foi o pacote npm rc.38. Não presumir que um checkout local
  antigo da biblioteca equivale ao pacote instalado. Tag
  `praxis-ui-v10.0.0-rc.38` aponta ao commit `51075de81704596606bb578ab681124df5ae8493`.
- **Hero**: `src/app/core/corporate-{session,session.backend,session.interceptor,runtime.providers,page-pilot.service,navigation.service,navigation.model}`
  (conferir nomes/extensões no checkout), `app.routes.ts`,
  `pages/corporate-{context,layout,pages}` e novo editor de Form.
  Ler [corporate-session-journey.md](../corporate-session-journey.md), que contém os
  incrementos e resultados posteriores ao antigo resumo de adoção.
- **Skills**: `praxis-angular-host-project`, `praxis-api-quickstart-security-config`,
  `praxis-config-runtime-persistence`, `praxis-core-runtime-contracts` e
  `praxis-form-editor-document-roundtrip`. Fonte canônica é o repositório de skills.

Inventário já realizado: Config já fornece criação/cópia/lifecycle/menu; o SDK já
fornece editor e projeção. Houve materialização ausente no Hero e política de host
que só admitia Form vazio. Esses dois pontos foram corrigidos sem novo contrato
público. Não criar um segundo SaveAs que envie um documento arbitrário ao POST pages.

## Decisões de implementação que precisam ser preservadas

1. `GET .../pages/{pageId}/published` devolve `copySource` confirmado e correlacionado
   ao head: `{kind:'published-page', pageId, releaseId, revisionId}`. O POST recebe
   `creationKey`, `title`, `source`. O servidor aloca novas identidades e limpa
   `config.navigation`; o host exige novo vínculo. Não clonar IDs ou JSON no browser.
2. O editor usa o componente oficial e sua projeção baseline→candidate; não salva
   preferências paralelas por storage. Preservar documento completo e outros bindings,
   sem persistir defaults derivados do editor por engano.
3. A política Quickstart permite quatro controles canônicos (`input`, `textarea`,
   `number`, `checkbox`), campos `local`/`transient:true`/`submitPolicy:'omit'` e layout
   field-only. Regras, hooks, URLs, opções remotas, recursos e submissão não são admitidos.
   `validators:{}` emitido pelo serializer é permitido; regras não vazias não são.
4. O menu vem de `runtime.navigation` com paginação e filhos sob demanda, dentro do
   mesmo contexto corporativo. Catálogo de páginas e storage local não concedem acesso.
   O corte suporta 200 itens por nível, com erro explícito em vez de truncamento oculto.
5. O agregado de grupos tem identidade própria e primeiro publish por CAS. Navegação
   paginada é projeção parcial; não usá-la para reconstruir/sobrescrever todo o agregado.
6. SESSION/contexto e respostas tardias têm fences. O último patch do Hero vincula o
   bloqueio à tentativa original: trocar query não libera a chave incerta; uma intenção
   independente não herda seu bloqueio. Apenas receipt válido e atual libera sua identidade.
7. O publicador não lê o draft privado do autor. Usar o link de revisão com
   `pageId` + `releaseId`, **sem draftId/creationKey**. Retomar a URL do draft como
   publicador deu 403 corretamente; isso não é prova de falha do CSRF ou de permissão ausente.
8. Rejeições locais podem preservar edição reparável; negação remota pode limpar o
   editor por segurança. Não prometer recuperação de edição não salva após um 403.

## Bloqueio, tentativas e evidência

### Falha real da cópia

Quickstart ativo: commit `d6c11592...`, serviço Render `srv-d3qjqcemcj7s73bpluv0`,
deploy `dep-dbej0hom7kps73e23keg`, LIVE em 24/10/2026 às 22:33:13Z; recovery
`RESTORED` às 22:32:49Z. Health/readiness/liveness deram 200 UP. Ver
[recibo de deploy](receipts/hero-form-render-live-receipt.json).

- Origem: `087773d2-ffa3-4427-8fe3-dc468ebf7bde`, release
  `b6cf7495-0ebe-4fff-90ac-9f585c4c458a` (publicação vazia do corte anterior).
- Tentativa: `creationKey=7abb231a-bac2-4067-983b-45216f85cf59`.
- POST `/api/praxis/config/pages`: **503, 40.973 ms**, 22:36:02.165Z.
- GET `/api/praxis/config/pages/by-creation-key`: **404, 1.361 ms**, 22:36:19.667Z.
- Sem segundo POST. Não houve prova independente de rollback dessa tentativa.
- Logs não trazem custo por admissão/checkpoint/consulta SESSION. Duração próxima
  de 40s é observação; não demonstra a causa exata. O shutdown visto às 22:36:12Z
  era da instância antiga, não da instância que recebeu esse deploy.

[Diagnóstico sanitizado](receipts/hero-copy-failure-diagnostic.json). Não depender
dos logs brutos da máquina anterior, nem publicar IPs, user-agents ou credenciais.

### O que foi tentado no Config

O trabalho anterior rc.174 combinou unidades de autorização atuais e validação de
proveniência nativa sem cachear grants nem aumentar budget. A criação nativa real
funcionou. A trilha published tem custo estrutural maior e não pode simplesmente
herdar o atalho de fonte nativa: há I/O e extensões antes de atravessar os ancestrais.

Uma fixture focal passou pela orquestração real, frozen resolver, stores JDBC e
callbacks Spring/commit, **com transporte SQL/repository simulado**. Foi medido:

| Medição sintética | rc.174 antes de #533 | PR #533 |
| --- | ---: | ---: |
| Unidades de autoridade, Native | 110 | 109 |
| Unidades de autoridade, Published | 132 | 131 |
| Observações modeladas Published (2 por unidade) | 264 | 262 |

Published tem 38 resoluções lifecycle contra 15 no Native; a diferença total é
22 unidades porque falta o callback captureNative. Essas contagens não são SQLs
reais de SESSION nem previsão de latência no Render.

#533 troca READ_SOURCE/COPY_SOURCE adjacentes do capture pela unidade `requireCreation`
já existente, com Principal/contexto originais e verificações de prazo antes/depois.
Preserva as demais fronteiras, I/O, proveniência e commit. **Reduz só uma unidade.**
Não há evidência de que resolverá o 503; não foi lançada nova versão para especular.

Os relatórios completos anteriores/posteriores estão em gzip padrão em
[cost-reports/](cost-reports/index.json), com hashes dos bytes originais. O teste
comprometido no Config permite reproduzi-los. Os 37 unitários passaram; o rollback
nessa fixture não equivale a rollback remoto da tentativa real.

### Conteúdo real já publicado

Página `c5e72c45-3d12-482c-8894-86261c705084`; draft
`103464a2-7f5d-490c-abab-650b594df4bc`; criação nativa
`bc2c82b4-69f7-4f8c-bead-6383302d6c16`; release ativa
`82359bc9-cda2-4382-80d5-27d260fc530b`. Campo “Nome do solicitante” criado pelo
menu visual da coluna → Adicionar campo local → Editar metadados. Placeholder
“Informe o nome” configurado antes de salvar; não foi relido especificamente após reload.

Rota local: `http://127.0.0.1:4302/pages/c5e72c45-3d12-482c-8894-86261c705084`.
Menu: “Solicitação corporativa”, em “Páginas da organização”. A UI/AX confirmou
conteúdo, identidade da release e menu após recarregar. Neste corte não houve coleta
de status HTTP de sucesso, comparação head ETag ou medição de latência de publicação.
Não converter essa observação em prova mais abrangente.

Ver [recibo e captura](../evidence/corporate-content-2026-10-24/receipt.json).
O corte anterior de grupos/menu tem recibo próprio em
`../evidence/corporate-publication-2026-10-24/validation.json`, inclusive comparação
de head e tempos. A prova visual de conteúdo antecede a correção posterior de fence;
esta foi coberta por testes focais e build, não por repetição da jornada real inteira.

## Testes válidos e repetição proporcional

Não executar novamente tudo por estar em outra máquina. Conferir baseline e
dependências; repetir somente o que uma mudança nova invalidar. Em instalação nova,
resolver dependências públicas antes de tentar comandos offline.

| Escopo | Evidência existente |
| --- | --- |
| Hero editor/cópia | 8 checks do SDK público e transporte controlado |
| Hero navegação/controller final | 17 checks, incluindo query na mesma instância, respostas tardias e guard após location em grupos |
| Hero | TypeScript e build produção PASS; bundle 16,63 MB/alerta 15 MB, limite não alterado |
| Quickstart #479 | 40 unitários válidos; 9 afetados repetidos após ajuste do serializer |
| Config #533 | 37 unitários (FullPath5, Checkpoint3, Bridge29); sem banco/HTTP |
| Operacional | Conteúdo Native publicado e relido via CUA; Published copy falhou e continua pendente |

Comandos focais **para quando houver motivo**, nos respectivos repositórios:

```sh
# Hero, Node 22 conforme workflow; usar lock público
npm ci
node scripts/workspace/test-corporate-content-copy.mjs
node scripts/workspace/test-corporate-navigation.cjs
npx tsc -p tsconfig.app.json --noEmit
npm run build
npm start  # origin/porta oficial 127.0.0.1:4302; conferir proxy documentado

# Config, JDK 21, na branch do #533
mvn -q -Dtest=PageCreationFullPathCostTest,PageCreationAdmissionCheckpointTest,PageCatalogLifecycleBridgeTest test

# Quickstart, JDK 21, dependência pública Config rc.174
mvn -q -Dtest=QuickstartPageHostTest,QuickstartPageStructureTest,QuickstartPageFormContentPolicyTest test
```

Guias de sessão e operador estão versionados no Quickstart, incluindo
`scripts/workspace/governed-publication-operator.py` e o README de
`scripts/workspace/governed-publication-native/`. Ler as condições antes de executar.
Nenhum helper de `/tmp` é pré-requisito da retomada.

## Ambiente, segredos e estado local excluído

- Backend observado: `https://praxis-api-quickstart.onrender.com`.
- Credenciais existentes geridas nas variáveis Render:
  `APP_AUTH_GOVERNANCE_AUTHOR_USERNAME/PASSWORD` e
  `APP_AUTH_GOVERNANCE_PUBLISHER_USERNAME/PASSWORD`. Obter pelo acesso autorizado
  na outra máquina, sem solicitar senhas no chat, imprimir valores ou commitá-los.
  Não foram criados novos usuários/grants para superar falhas.
- A sessão usada na prova foi encerrada; referências de credenciais em memória
  foram limpas. Cookies/sessões desta máquina não fazem parte da passagem.
- O dev server local 4302 ficou disponível ao usuário nesta máquina. Outra máquina
  precisa iniciar seu próprio `npm start`; localhost não é uma URL compartilhável.
- Hero tem uma alteração **preexistente, fora da tarefa e não commitada** em
  `src/app/pages/operacoes/incidentes.config.ts` (SHA256
  `1c54953040fb0c72d00cbe517499aa804bbed0404ac28c1c1542b200ec17e506`). Acrescenta
  filtros, não integra esta jornada. Foi preservada e os builds locais a incluíram;
  a evidência registra isso. A outra máquina não terá esse diff automaticamente.
- Os checkouts principais de Config/Quickstart/skills contêm alterações de outros
  trabalhos. A implementação desta tarefa foi isolada em worktrees com fonte limpa
  e remota. Não houve tentativa de commitar esses trabalhos alheios. Caches Python
  descartáveis de auditoria não são código-fonte necessário.
- Esta pasta exporta os recibos essenciais antes restritos a `/tmp` e os relatórios
  de custo ignorados em `target/`. Build outputs, node_modules, Maven local, caches,
  tokens e logs brutos não são artefatos de código a publicar.

## Governança e próximos passos

Ler [snapshot das instruções efetivamente aplicadas](workspace-AGENTS.snapshot.md)
e [guia de coordenação](agent-models.snapshot.md), além de AGENTS locais e versões
canônicas atuais em `praxis-codex-skills/docs/platform-governance/`. A raiz workspace
anterior não é um repositório Git; os snapshots portáteis são deliberados, não uma
nova fonte canônica dessas regras. Na outra máquina eles não serão carregados
automaticamente como AGENTS: o agente deve lê-los explicitamente.
Os snapshots preservam o texto original, inclusive links relativos do workspace
antigo. Não interpretar esses links como caminhos de instalação na outra máquina:
para a fonte atual, abrir `docs/platform-governance/WORKSPACE-AGENTS.md` e
`docs/platform-governance/agentes-e-modelos.md` no clone de `praxis-codex-skills`.

1. Obter os repositórios e branches remotos indicados, confirmar HEADs e PRs e ler
   provas/limites. Nenhum trabalhador da sessão anterior deve ser presumido ativo.
2. Analisar o custo published de ponta a ponta, inclusive implementação dos readers
   de SESSION no host e fronteiras canônicas. Questionar o desenho quando necessário:
   não acumular releases de micro-otimizações sem hipótese e evidência suficientes.
3. Distinguir custo estrutural medido de causa operacional ainda não provada. Usar
   primeiro fixture/contadores focais e instrumentação segura já existente; não
   reabrir a campanha Neon. Um novo contrato só se justifica por lacuna demonstrada.
4. Corrigir preservando as garantias; revisar por outro agente antes de aceitar.
   Publicar pacote compatível/adotar no host somente após gates apropriados. #533
   é uma otimização limitada disponível para revisão, não obrigação de adotá-la como solução.
5. Provar o caminho funcional pendente de cópia com conteúdo real, novo menu/rota,
   independência da origem e persistência após reload. Reconciliar a tentativa antiga
   antes de decidir qualquer retry; novas provas devem declarar claramente sua intenção.
6. Atualizar #19, #533 e issue de controle
   [Quickstart #461](https://github.com/codexrodrigues/praxis-api-quickstart/issues/461).
   Não encerrar a demanda enquanto cópia real estiver pendente.
7. Antes de integrar a cadeia Hero em main, revisar o merge result e construir a
   árvore final preservando mudanças atuais de main. **Push/merge main dispara
   Firebase Hosting live automaticamente**. Branch/PR de docs não dispara esse workflow.
   Não confundir publicação local validada com autorização/prova de implantação frontend.

Impacto desta passagem: `docs-apenas`; nenhum contrato/SDK alterado. Skills existentes
adequadas: atualização de fonte canônica e registros de continuidade já são exigidos
pelas instruções. PRs de skills #862–#865 estão integrados; cinco drifts locais
alheios foram preservados na sincronização seletiva. Não copiar toda a instalação
local de skills da máquina anterior.

Prompt para o sucessor: [PROMPT.md](PROMPT.md).

## Verificação da passagem

Revisão documental independente por `creation_boundary_review`: APTO. Foram
conferidos commits/recibos, paridade dos snapshots de instruções, hashes dos quatro
relatórios gzip e distinção entre resultados reais, simulados e pendentes. O
coordenador verificou JSON, descompactação, hashes, links locais, padrões comuns de
credenciais e `git diff --check`. Nenhum segredo foi encontrado. Não houve novo
build, teste funcional, deploy ou acesso a banco para produzir esta documentação.

A revisão posterior de portabilidade também recebeu APTO independente. Ela usou
somente os clones novos descritos no recibo, sem executar instalação/build/login.
O acesso do sucessor a contas externas e a disponibilidade futura dos registros
não foram testados. Hashes de fontes privadas citados nos recibos históricos são
referências de auditoria, não promessa de que os logs brutos estejam no Git; os
recibos sanitizados e os relatórios de custo necessários à retomada estão versionados.
