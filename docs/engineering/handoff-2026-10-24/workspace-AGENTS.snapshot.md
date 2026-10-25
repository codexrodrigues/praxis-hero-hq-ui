> Materialização do [template versionado](https://github.com/codexrodrigues/praxis-codex-skills/blob/a2cf40200f4f3e47bb2d94bad713ac046eb28777/docs/platform-governance/WORKSPACE-AGENTS.md), sincronizada em 13/09/2026. A regra de banco remoto inserida em 11/10/2026 foi integrada no [incremento canônico Neon](https://github.com/codexrodrigues/praxis-codex-skills/commit/0daf098f4a0dcf893ad7872fa20aebc2d0b6841f); as demais seções mantêm a proveniência do template base indicado. Esta cópia resolve o guia no workspace; a fonte de manutenção é o repositório canônico.

AGENTS.md — Praxis Platform Monorepo

Escopo
- Este arquivo vale para a raiz deste checkout de `praxis-plataform` e todas as subpastas, independentemente do caminho local ou sistema operacional, exceto quando um `AGENTS.md` mais específico definir regras adicionais para um subdiretório.
- Arquivos `AGENTS.md` em subpastas complementam este arquivo; não anulam estas regras, salvo quando a regra local tratar explicitamente daquele escopo.

Premissa Arquitetural Central
- Em `praxis-plataform`, assumir como premissa permanente que **Praxis e uma plataforma de decisoes semanticas authoradas por IA**.
- A IA nao deve ser tratada como geradora de JSON, patches arbitrarios ou configuracao incidental de componente. A unidade de modelagem preferencial da plataforma deve ser intencao, contexto semantico, decisao canônica, governanca e materializacao derivada.
- Quando houver duvida entre modelar algo como `config`, `builder`, `form rule`, `patch` ou `decision`, a recomendacao padrao deve ser promover a semantica para o nivel de decisao canonica authorada por IA e publicar apenas projeções/materializacoes nos runtimes consumidores.
- Superficies de UI, formularios, tabelas, option sources, workflows e manifests nao devem virar fonte primaria da regra de negocio; devem consumir, explicar ou materializar decisoes governadas pela plataforma.

Regra Absoluta de Roteamento de Intencao
- A plataforma Praxis nao deve rotear intencao de usuario por palavras-chave, regexes de comando, listas de termos, ou heuristicas textuais locais como mecanismo decisorio primario.
- O roteamento inicial de intencao deve ser semantico e authorado por IA/LLM, usando contexto governado, contratos canonicos, catalogos semanticos e ferramentas declaradas como grounding.
- Palavras, aliases, matching aproximado, normalizacao textual, fuzzy search e catalogos de campos so podem ser usados depois que a intencao semanticamente resolvida indicar o escopo correto, como apoio a grounding, desambiguacao, ranking de candidatos ou confirmacao de alvo.
- Quando uma tool necessaria nao existir, a solucao correta e modelar ou criar a tool/contrato canonico apropriado; nao substituir a ausencia de tool por roteamento de palavras-chave.
- Qualquer uso residual de matching textual deve declarar explicitamente que nao decide a intencao primaria, quais candidatos canonicos ele ranqueia, e como a IA ou o contrato semantico governa a decisao final.

Diretriz de Solução de Plataforma
- Em `praxis-plataform`, devemos sempre sugerir e implementar a solução correta de plataforma, mesmo quando houver uma alternativa mais rápida, local ou apenas compatível.
- Não devemos priorizar remendos táticos, aliases ad hoc, adaptações só de frontend ou soluções “rápidas para agora” quando a necessidade indicar um ajuste de contrato, modelo canônico, infraestrutura compartilhada ou regra estrutural de plataforma.
- Quando houver conflito entre “solução fácil e rápida” e “solução correta de plataforma”, a recomendação padrão deve ser sempre a solução correta de plataforma.
- Se existir uma opção mais rápida apenas como contingência temporária, ela só pode ser considerada depois de explicitar por que ela não é a solução correta e quais débitos arquiteturais ela introduz.
- Em dúvidas de modelagem, preferir sempre centralizar o contrato e a semântica no nível canônico apropriado, como `praxis-metadata-starter`, `ts-core`, bibliotecas compartilhadas ou regras estruturais do monorepo, em vez de espalhar convenções implícitas em apps consumidores.

Inventário de Aderência Antes de Novo Contrato
- Antes de propor, criar ou alterar qualquer contrato canônico novo, o agente deve auditar o fluxo existente e responder: **o que a plataforma já sabe, mas a UX, runtime ou consumidor ainda não está materializando bem?**
- O agente não deve começar criando campos, contratos, DTOs, tipos exportados, endpoints, manifests ou abstrações novas quando a necessidade pode estar coberta por semântica existente mal apresentada, mal nomeada, subutilizada ou localizada na fonte canônica correta.
- O inventário deve mapear dados, estados, eventos, metadados, diagnostics, capabilities, contextos, quick replies, previews, materializações, warnings, actions e artefatos já existentes antes de declarar lacuna de contrato.
- Para cada melhoria relevante, o agente deve classificar a aderência em uma destas categorias:
  - `ja-suportado-so-ux`
  - `ja-suportado-mal-nomeado-ou-mal-materializado`
  - `suportado-parcialmente`
  - `lacuna-real-de-contrato`
- Só uma melhoria classificada como `lacuna-real-de-contrato` pode justificar contrato novo. Nesse caso, o agente deve explicitar qual UX ou comportamento não pode ser implementado corretamente, qual dado falta, quem é a fonte canônica, quais consumidores serão impactados, quais artefatos derivados mudam e qual validação mínima prova o contrato.
- Em fluxos de IA, authoring, Page Builder, assistentes, configuração governada, metadata-driven UI e materializações runtime, a regra padrão é aproveitar e corrigir a fonte canônica existente antes de introduzir nova camada conceitual.
- É proibido criar uma segunda camada paralela de conceitos apenas para satisfazer uma necessidade local de UI quando o contrato, estado ou evidência já existe em outra superfície canônica da plataforma.

Diretriz de Beta e Limpeza de Código
- Enquanto a plataforma e suas libs públicas estiverem em fase beta, o agente deve privilegiar migrações canônicas limpas em vez de preservar trilhas paralelas preventivas.
- Evitar introduzir `feature flags`, modos de compatibilidade, caminhos `v1`/`v2`, aliases duplicados, contratos paralelos ou qualquer outra estrutura de convivência temporária quando a plataforma ainda não precisar sustentar compatibilidade de produção estável.
- Em fase beta, a estratégia padrão deve ser corrigir a fonte canônica, atualizar exemplos/docs/consumidores do monorepo no mesmo ciclo e remover a semântica antiga, em vez de institucionalizar coexistência.
- Exceções só devem existir quando houver necessidade operacional concreta e explícita. Nesses casos, o agente deve registrar por que a convivência temporária é inevitável, qual débito ela cria e qual é o plano de remoção.

Fontes Canônicas da Plataforma
- O agente deve sempre identificar a fonte canônica da semântica antes de implementar mudanças.
- Superfícies derivadas não devem redefinir contratos, semântica ou comportamento canônico.

Hierarquia Canônica Padrão
- `praxis-metadata-starter` define a semântica canônica metadata-driven do backend Praxis: vocabulário `x-ui`, baseline `resource + surfaces + actions + capabilities + HATEOAS`, anotações públicas, auto-configuração e a resolução canônica de operação/schema
- `praxis-metadata-starter` deve sustentar o grounding semantico e regulatorio que permite a IA entender o dominio antes de authorar decisoes
- No `praxis-metadata-starter`, `/schemas/filtered` é a superfície estrutural canônica; `/schemas/catalog` é catálogo documental/de discovery; `/schemas/surfaces` e `/schemas/actions` são discovery semântico; `GET /{resource}/capabilities` e `GET /{resource}/{id}/capabilities` são snapshot agregado e não uma segunda fonte de verdade do schema
- No `praxis-metadata-starter`, o baseline canônico para recursos novos é resource-oriented (`AbstractResourceController`, `AbstractReadOnlyResourceController`, `AbstractBaseResourceService`, `AbstractReadOnlyResourceService`, `ResourceMapper` e `@ApiResource(resourceKey=...)`); `AbstractCrudController`, `AbstractReadOnlyController`, `BaseCrudService` e similares são superfície legada de migração
- `praxis-config-starter` define uma fronteira canônica paralela, não derivada do metadata starter: persistência e semântica de `ui_user_config`, `ai_registry`, `api_metadata`, templates, headers e ETag em `/api/praxis/config/**`
- `praxis-config-starter` e o candidato natural a fronteira canonica de authoring governado de decisoes semanticas, simulacao, aprovacao, publicacao e materializacao
- `praxis-ui-angular` define o runtime oficial e a superfície pública oficial das bibliotecas `@praxisui/*`
- `praxis-ui-angular` deve ser tratado como cockpit e runtime de decisoes materializadas, nao como fonte primaria de regras de negocio
- `praxis-api-quickstart` é o host operacional de referência, mas não a fonte canônica da semântica de contrato
- `praxis-api-quickstart` deve provar, por HTTP real, como decisoes semanticas authoradas por IA sao grounding, simuladas e materializadas nos casos de referencia da plataforma
- `praxis-ui-landing-page` é o site oficial de exemplos, playground e documentação pública da plataforma Praxis; ele publica e projeta a documentação oficial, mas não deve redefinir sozinho contratos canônicos de backend ou runtime
- `praxisui-http-examples` é uma superfície operacional derivada e não deve ser tratada como fonte primária

Regra de Ouro
- Quando houver divergência entre app consumidor, site público, corpus HTTP e módulo canônico, a recomendação padrão é corrigir o módulo canônico ou explicitar a divergência, nunca institucionalizar o desvio como se fosse fonte de verdade.

Classificação Obrigatória da Mudança
- Antes de editar, o agente deve classificar a tarefa em uma das categorias abaixo:
  - `local-pequena`
  - `transversal`
  - `arquitetural`
  - `contrato-publico`
  - `docs-apenas`

Regras por Classe
- `local-pequena`: mudança restrita a um subprojeto, sem alterar contratos públicos nem artefatos derivados relevantes
- `transversal`: mudança com impacto em mais de um subprojeto ou em cadeia de consumo
- `arquitetural`: mudança que altera fronteiras, responsabilidades, semântica central, fluxo de integração ou estrutura de plataforma
- `contrato-publico`: mudança em `x-ui`, `/schemas/filtered`, tipos exportados, endpoints, headers, ETag, contratos AI, `public-api` ou outra superfície pública
- `docs-apenas`: alteração editorial ou documental sem efeito em contratos, código público ou artefatos gerados

Obrigação de Planejamento
- Para mudanças `transversal`, `arquitetural` ou `contrato-publico`, o agente deve produzir um plano curto e um mapa de impacto antes de editar.
- O agente não deve começar por patches locais quando a classificação correta exigir análise de plataforma.

Mapeamento de Impacto Antes de Editar
- O agente deve mapear impacto antes de editar sempre que a mudança tocar áreas de alto risco canônico.

Áreas de Alto Risco Canônico
- `x-ui`
- `/schemas/filtered`
- `/api/praxis/config/**`
- contratos AI
- headers e ETag
- `@praxisui/core`
- `@praxisui/dynamic-form`
- `@praxisui/table`
- `public-api`
- `examples.manifest.json`
- corpus HTTP e superfícies LLM
- documentação pública oficial da plataforma quando ela espelhar ou explicar superfície pública
- examples, playgrounds e recipes oficiais usados como referência operacional

Guardrails para Public APIs entre Libs
- Nenhuma lib pública do monorepo deve atuar como fachada transitiva do barrel raiz de outra lib pública sem revisão arquitetural explícita.
- Em `@praxisui/*`, evitar reexportar no `public-api` raiz tipos, serviços, tokens, componentes ou helpers cujo dono canônico seja outra lib pública do workspace.
- Quando duas libs públicas compartilharem contratos, o agente deve preferir uma das opções canônicas: mover o contrato para a fonte canônica correta, criar uma superfície pública mínima e estável no dono canônico, ou definir contrato próprio estruturalmente compatível na lib consumidora quando a fachada transitiva criar acoplamento indevido.
- `public-api` raiz deve permanecer superfície intencional, estável e empacotável. Não promover exports pesados, infraestruturais ou acoplados a outra lib raiz apenas por conveniência de consumo.
- Se a tarefa introduzir nova dependência entre libs públicas via `public-api`, o agente deve comparar com a `main` quando houver suspeita de regressão estrutural e registrar qual alteração abriu a nova aresta de dependência.

Mapa Mínimo Obrigatório
- subprojeto canônico afetado
- consumidores impactados
- docs públicas potencialmente afetadas
- exemplos, playgrounds ou recipes potencialmente afetados
- testes ou validações mínimas necessárias
- risco de breaking change

Coordenação, Delegação e Escolha de Modelos
- Estas diretrizes valem para coordenadores atuais, futuros e subagentes em toda a plataforma. O guia operacional é [Agentes e modelos no Praxis](docs/engineering/agentes-e-modelos.md); consultá-lo ao planejar delegação ou assumir a coordenação de trabalho prolongado. O escopo pretendido não garante carregamento automático: ao delegar ou transferir trabalho para um subprojeto/worktree, fornecer os caminhos resolvidos das instruções e do guia, pois a descoberta pode começar na raiz Git do subprojeto.
- A preferência do usuário é manter a coordenação e decisões críticas no modelo mais capaz disponível e adequado. O agente deve respeitar o modelo efetivamente selecionado no aplicativo; não afirmar que alterou o próprio modelo, nem mudar configurações globais para aplicar esta política.
- Usar subagentes quando houver resultado delimitado e independente que permita trabalho útil em paralelo. Trabalho pequeno ou sequencial permanece local; não criar agentes apenas para ocupar slots, executar comandos conhecidos ou representar cada fase do plano.
- Antes de cada criação de subagente, inclusive por outro subagente quando autorizado, avaliar risco, ambiguidade, complexidade, contexto necessário e critério de aceite. Escolher modelo e esforço explicitamente quando a ferramenta permitir, registrando uma justificativa curta no pacote de trabalho e distinguindo escolha solicitada de configuração efetiva confirmada. Se houver somente herança ou não houver delegação disponível, registrar a limitação e reorganizar o trabalho localmente sem bloquear por economia. Usar a matriz inicial do guia como hipótese calibrável, nunca como garantia de qualidade ou regra baseada apenas na extensão/tamanho do arquivo.
- O modelo econômico só permanece na classe de tarefa quando satisfaz seus critérios de qualidade. Escalar dúvidas de contrato, autorização, tenant, transação, integridade ou evidência conflitante ao coordenador. Diagnosticar falhas de ambiente antes de atribuí-las ao modelo; não insistir sem evidência nova nem escalar todos os trabalhadores por reflexo.
- Delegar contexto mínimo suficiente, incluindo fontes canônicas, instruções aplicáveis, baseline com alterações locais, limites de escrita, testes e condição de parada. Não copiar todo o histórico por padrão. Delegação recursiva exige autorização explícita do coordenador para um subproblema concreto e segue a mesma avaliação de modelo.
- Atribuir um único escritor por arquivo/pacote e coordenar recursos mutáveis compartilhados: targets de build, coordenadas Maven e fixtures/bancos. Usar serialização ou isolamento oficial; sem atribuição de escrita/recurso, o trabalhador apenas inspeciona e reporta. Essa coordenação não cria uma nova aprovação do usuário para trabalho já autorizado.
- Toda implementação, delegada ou feita pelo coordenador, exige revisão abrangente antes do aceite/merge. O revisor deve ser diferente do autor do trecho revisado; o coordenador pode revisar entregas que não implementou. Autorrevisão e testes do autor são complementares. Confrontar o diff e os fluxos afetados com plano, decisões canônicas, invariantes de negócio, consumidores, testes, documentação e skills; o guia operacional define a matriz de revisão. Verificar cenários corporativos aplicáveis e a correspondência das evidências com a árvore/dependências atuais. Não repetir suites válidas automaticamente nem expandir a revisão para áreas sem relação com a mudança.
- Economia significa custo total até o resultado aceito, incluindo coordenação e retrabalho. Não reduzir testes, governança ou critérios de aceite para economizar tokens; não prometer economia quantitativa sem medição atribuível. Limites de concorrência e modelos devem refletir a sessão real, não números congelados neste arquivo.
- Para trabalho prolongado, manter no artefato existente o estado das tarefas, decisões e suas fontes, baseline, evidências válidas, responsáveis/recursos, bloqueios e próximo passo. O coordenador sucessor deve reler esse registro e confrontá-lo com o checkout antes de continuar. O guia contém um modelo proporcional de passagem de contexto.
- Estas regras organizam a execução do trabalho no Codex; não introduzem roteamento de intenção no produto Praxis e não ampliam autorização para publicação, deploy ou escopo externo à tarefa. Instruções de maior prioridade e restrições reais das ferramentas continuam aplicáveis.

Validação por Escopo Mínimo
- O agente deve preferir sempre a menor validação suficiente para o escopo alterado.
- Não rodar suites integrais por reflexo quando existirem comandos focais confiáveis.
- Quando escolher uma validação parcial, o agente deve deixar explícito o motivo.

Banco Remoto nas Validações Praxis
- Em qualquer subprojeto Praxis, toda validação que dependa de banco deve usar banco remoto Neon em branch isolada e explicitamente atribuída ao trabalhador ou ensaio. Testes unitários sem banco podem rodar localmente. PostgreSQL local/embutido não substitui a prova remota; se a branch ou as credenciais não estiverem disponíveis, registrar a pendência sem fallback silencioso e continuar apenas o trabalho independente.
- Antes de conectar ou mutar, confirmar projeto e branch Neon, endpoint, versão PostgreSQL, TLS e perfis reais de owner, runtime e control plane quando aplicáveis. Provar com as identidades e privilégios exigidos pelo fluxo; não presumir SUPERUSER nem aceitar uma fixture privilegiada como prova do caminho operacional.
- Coordenar a atribuição exclusiva da branch e limitar migrações, dados de teste e limpeza ao recurso designado. Autorização de validação não autoriza mutar a branch pai ou produção, nem publicar, implantar ou lançar release. Preservar segredos e vincular resultado bruto, árvore de fonte, dependências e identidade da branch.
- Evidência histórica de banco local permanece identificada como local e não conta como nova prova remota Neon.

Autonomia de Execução e Uso Econômico de GitHub Actions
- A economia de Actions orienta a escolha dos meios, sem paralisar implementação, testes, integração ou deploy dentro do escopo autorizado. Não exigir nova confirmação apenas porque uma etapa necessária consome minutos.
- Preferir validações focais; as que não dependem de banco podem ser locais. Para validações dependentes de banco, seguir a regra Neon acima. Usar os workflows existentes quando forem gates obrigatórios ou quando a validação remota for indispensável à entrega autorizada e não houver alternativa local equivalente; explicar brevemente a necessidade e prosseguir, inclusive durante desenvolvimento.
- A autorização de integração, deploy ou release abrange os workflows e smokes necessários àquela operação. Respeitar autorizações já dadas na conversa. Um pedido de implementação, teste ou commit, por si só, não autoriza presumir deploy ou criar uma nova release.
- Antes de push, PR, tag ou dispatch, conferir os gatilhos relevantes e seus encadeamentos. Aproveitar a configuração de economia dos repositórios e os resultados válidos do mesmo commit; evitar duplicar execuções automáticas com disparos manuais. Preservar proteções de branch e checks obrigatórios.
- Evitar execuções exploratórias desnecessárias e reruns sem diagnóstico. Em caso de falha, consultar os logs, identificar a causa e corrigir/validar localmente o que for possível antes de repetir apenas o necessário para concluir a operação autorizada.
- Uma pendência remota não deve interromper trabalho independente que possa continuar. Registrar bloqueios reais e gates ainda não aprovados, sem apresentar validação local como aprovação remota. Esta orientação prevalece sobre restrições de economia em instruções locais que imponham zero execuções ou nova autorização para cada Action necessária.

Diretrizes por Área
- Em `praxis-ui-angular`, preferir build ou teste focal por lib afetada antes de considerar validações amplas
- Em `praxis-ui-landing-page`, validar build, exemplos, playground e documentação pública apenas no escopo realmente afetado
- Em `praxis-api-quickstart`, preferir suite focal quando a mudança estiver localizada; usar `verify` mais amplo para alterações gerais
- Em `praxis-config-starter`, preferir suites focais ou `ci-smoke-unit` antes de validações integrais pesadas
- Em `praxisui-http-examples`, validar manifesto e smoke da superfície afetada
- Em `docs/examples/dynamic-page`, após mudanças em `manifest.json`, schema ou exemplos, executar `pwsh -File scripts/validate-dynamic-page-examples.ps1` como validação mínima do corpus
- Em projetos com watchers, dev servers e e2e pesados, evitar inicialização desnecessária
- Mudanças em `public-api` ou em contratos exportados entre libs públicas exigem ao menos: build focal da lib alterada, build focal de um consumidor direto e, quando houver UI/runtime público afetado, uma bateria E2E focal dos consumidores críticos dessa superfície.

Regra de Honestidade
- Se a validação completa não foi executada, o agente deve dizer exatamente o que validou e o que ficou sem validar.

Artefatos Derivados e Sincronizações Obrigatórias
- O agente deve verificar se a mudança exige atualização de artefatos derivados antes de concluir a tarefa.
- Alterações em superfície pública não se encerram apenas no arquivo editado.

Quando Revisar Artefatos Derivados
- mudanças em componentes ou APIs públicas de `praxis-ui-angular`
- mudanças em `public-api`
- mudanças em `*.json-api.md`
- mudanças em contratos metadata-driven
- mudanças em endpoints HTTP públicos
- mudanças em contratos AI
- mudanças em catálogos, templates ou superfícies governadas
- mudanças em documentação pública oficial, playgrounds ou examples oficiais da plataforma

Artefatos Derivados a Considerar
- documentação pública oficial em `praxis-ui-landing-page`
- examples, playgrounds e guias publicados da plataforma
- `docs/ai/*`
- `praxis-ui-angular/examples/ai-recipes/*`
- `praxisui-http-examples/examples.manifest.json`
- `praxisui-http-examples/LLM_SURFACE.md`
- arquivos `http/*`, `payloads/*` e verificadores relacionados

Regra
- O agente deve explicitar quando concluiu que não há artefato derivado a atualizar.

Melhoria Contínua das Codex Skills
- As skills Praxis usadas pelo Codex devem evoluir junto com a plataforma. A fonte canônica versionada é o repositório GitHub `codexrodrigues/praxis-codex-skills`, normalmente clonado como diretório irmão `../praxis-codex-skills/`; cópias em `praxis-plataform/codex-skills/` ou `$CODEX_HOME/skills` são espelhos locais e não substituem a publicação no repositório canônico.
- Toda revisão de implementação deve avaliar e registrar o impacto nas skills: `sem-impacto`, `existente-adequada`, `atualizar-existente` ou `criar-nova`, com justificativa e fonte inspecionada. Mudanças que alterem o caminho ensinado, contrato, validação ou decisão recorrente exigem atualização/aprimoramento da skill existente no mesmo ciclo. Nova skill exige procedimento reutilizável com gatilho, dono e prova próprios, não coberto adequadamente pelo catálogo; avaliar a necessidade é obrigatório, criar uma skill por patch não é.
- Se faltar acesso à fonte ou evidência para essa classificação, registrar avaliação pendente, nunca presumir `sem-impacto` ou `existente-adequada`. Quando atualização/criação for necessária, o incremento só é concluído com a entrega canônica validada e integrada; um impedimento documentado mantém essa parte pendente. Merge técnico do código e conclusão do pacote são estados distintos. Registrar separadamente sincronização local concluída ou pendente, e impedir o uso de guidance conhecido como incorreto na adoção/release.
- Durante implementações normais, se o agente encontrar inconsistência real entre skill e plataforma, lacuna recorrente de instrução, heurística nova que se repetirá em tarefas futuras, drift entre contrato canônico e guidance operacional, ou regra que deixou de refletir o comportamento atual da plataforma, ele deve atualizar a skill correspondente no mesmo ciclo sempre que isso for seguro e claramente escopável.
- Não tratar melhoria de skill como tarefa separada por padrão quando a divergência foi descoberta durante a implementação atual e a correção da instrução for pequena, objetiva e diretamente apoiada pela evidência obtida na tarefa.
- Quando a divergência exigir mudança estrutural de guidance, criação de nova skill ou reorganização relevante de escopo, registrar o gap e desenhar o ajuste antes de editar. Havendo evidência suficiente e escopo autorizado, executar a atualização/criação no mesmo ciclo conforme a governança canônica, sem parar apenas na proposta. Se a evidência estiver incompleta ou houver impedimento real, registrar responsável, próximo passo e limite do aceite; não inventar guidance nem declarar a skill atualizada/publicada sem prova.
- Não usar a skill local instalada como fonte de verdade primária se ela divergir do repositório. Corrigir primeiro a skill no checkout limpo de `praxis-codex-skills`, atualizar o manifesto, validar, publicar por branch/PR e só então sincronizar o ambiente local.
- Sempre que alterar uma skill canônica, usar os scripts de auditoria, validação e sincronização do próprio repositório `praxis-codex-skills`; não assumir que os helpers ou o inventário parcial deste workspace representam toda a família.
- Após integrar a mudança canônica, sincronizar apenas as skills afetadas quando houver outros drifts locais conhecidos, ou declarar explicitamente por que a sincronização não foi executada. Não usar `--force` sobre a família inteira quando isso puder apagar customizações locais fora do escopo.

Integrações Locais e Origens Fixas
- O agente não deve inventar portas, bridges locais, origins ou rotas ad hoc.
- Quando uma validação depender de integração local já normatizada pelo repositório, usar os valores oficiais daquela superfície.

Execução Node/Angular entre WSL e Windows
- Em projetos Angular/Node acessados via WSL em caminhos `/mnt/*`, o agente deve verificar antes se o `node_modules` ativo foi instalado em ambiente Windows quando houver risco de binários nativos.
- O objetivo é evitar mistura de artefatos Linux/WSL e Windows no mesmo `node_modules`, especialmente em toolchains com binários nativos como `esbuild`, `playwright`, `chromium`, `node-gyp` e similares.
- Regra prática:
  - Se o `node_modules` tiver sido instalado em Windows, o agente deve preferir `cmd.exe /c` para comandos sensíveis de Node/Angular.
  - Se o `node_modules` tiver sido instalado no próprio WSL/Linux, o agente pode usar bash normalmente.
  - Não assumir; verificar quando houver dúvida razoável.
- Heurísticas de detecção aceitáveis:
  - presença de pacotes nativos Windows em `node_modules` como `@esbuild/win32-*`, `@rollup/rollup-win32-*`, bins `.cmd` predominantes ou falhas compatíveis com plataforma cruzada;
  - erro explícito indicando pacote/binário Windows sendo executado no Linux/WSL;
  - contexto do usuário mostrando `npm install` e uso normal do projeto pelo `cmd`/PowerShell no Windows.
- Comandos que devem preferir `cmd.exe /c` quando o `node_modules` for Windows:
  - `npm install`, `npm ci`, `npm update`, `npm rebuild`
  - `npx ...`
  - `ng build`, `ng serve`, `ng test`, `ng e2e`
  - comandos `node` que dependam da toolchain local do projeto
  - Playwright, Vite, Webpack, Angular CLI, Jest, Karma e similares
- Comandos de inspeção continuam preferencialmente no bash/WSL:
  - `rg`, `sed`, `cat`, `ls`, `find`, `git status`, `git diff` e equivalentes
- Regra de segurança:
  - não misturar `npm install` em WSL/Linux com `node_modules` previamente instalado em Windows, nem o inverso, salvo quando a intenção for recriar completamente as dependências naquele ambiente
  - se a sessão encontrar esse estado misto, registrar isso explicitamente na resposta e preferir operar no ambiente dono do `node_modules`

Encerramento Obrigatório de Shells Interativos
- Ao final da sessão, encerrar janelas ou processos interativos de `cmd.exe` e `powershell` abertos especificamente para a tarefa atual quando eles não forem mais necessários.
- Não deixar consoles auxiliares abertos apenas por conveniência depois que a validação ou inspeção terminar.
- Se algum `cmd.exe` ou `powershell` precisar permanecer aberto para continuidade operacional, registrar explicitamente:
  - qual shell ficou aberto
  - motivo
  - comando, contexto ou diretório esperado para retomar
- Antes de encerrar a thread principal, preferir ambiente limpo também no nível de shells interativos, sem terminais ociosos deixados pela sessão.

Regras Gerais
- Respeitar portas e origins documentadas nos subprojetos
- Não improvisar aliases ou links locais fora dos fluxos oficiais de integração
- Centralizar helpers operacionais de workspace em `scripts/workspace/`; não deixar scripts soltos na raiz quando puderem viver nesse diretório
- Em validações contra superfícies protegidas de `/api/praxis/config/**`, respeitar os headers e `Origin` exigidos
- Quando houver bridge local oficial entre libs e consumidores, preferi-la em vez de atalhos improvisados

Quando Criar Plano Antes de Editar
- O agente deve parar e propor plano antes de editar quando:
  - a mudança tocar contrato público
  - houver impacto provável em mais de um subprojeto
  - houver risco de breaking change
  - a fonte canônica não estiver clara
  - existir tensão entre solução rápida local e ajuste correto de plataforma
  - a tarefa envolver geração ou sincronização de artefatos derivados
  - a mudança atingir áreas de alto risco canônico

AGENTS Locais Recomendados
- Os subdiretórios abaixo devem preferencialmente ter `AGENTS.md` local complementar:
  - `praxis-config-starter/`
  - `praxis-metadata-starter/`
  - `praxis-ui-landing-page/`
  - `praxisui-http-examples/`
  - `praxis-file-management/`

Foco Esperado dos AGENTS Locais
- comandos e suites focais do subprojeto
- fronteiras canônicas locais
- validações mínimas
- artefatos derivados próprios
- regras de integração local
- áreas de maior risco de patch errado
