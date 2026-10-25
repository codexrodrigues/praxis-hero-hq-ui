> Materialização local da [política canônica](https://github.com/codexrodrigues/praxis-codex-skills/blob/a2cf40200f4f3e47bb2d94bad713ac046eb28777/docs/platform-governance/agentes-e-modelos.md), sincronizada em 13/09/2026. Alterar a fonte versionada e revisar antes de sincronizar; links do template foram adaptados ao workspace.

# Agentes e modelos no Praxis

Guia operacional de toda a plataforma, vinculado às [diretrizes do workspace](../../AGENTS.md). Consolidado em 13/09/2026 a partir da pesquisa e revisão do planejamento de edição em lote. Escopo `docs-apenas`: registra a política de execução e não altera modelos do aplicativo, contratos de produto ou permissões de publicação.

O `AGENTS.md` estabelece as obrigações; este guia concentra fundamentação, matriz inicial e exemplos. Planos de funcionalidades registram somente sua aplicação específica. Coordenadores e trabalhadores devem consultar também as instruções locais dos arquivos que vão ler ou editar. Ao retomar em outro checkout, confirmar que este guia e as instruções estão presentes; registros locais não se propagam automaticamente entre repositórios ou máquinas.

## Decisão antes de cada delegação

Avaliar primeiro se existe trabalho paralelo útil. Se houver, registrar em uma ou duas frases o resultado esperado, risco/ambiguidade, modelo e esforço escolhidos e por que são suficientes. Não é necessário repetir pesquisa web nem preencher um formulário extenso para cada pacote. No início de uma nova sessão, conferir as opções expostas pelas ferramentas; consultar documentação oficial atual quando a escolha depender de capacidades ou limites ainda não verificados.

A matriz abaixo oferece um ponto de partida. O critério de aceite vem antes da redução de custo: tarefas conhecidas usam a experiência aceita daquela classe; tarefas novas ou críticas precisam primeiro de análise capaz para definir as garantias. Cada agente que receber autorização para delegar repete essa avaliação. O coordenador principal mantém responsabilidade por escopo, conflitos e aceite final.

Respeitar o contrato da ferramenta de criação, que pode variar entre sessões. No mecanismo desta revisão, herdar o histórico completo não aceita sobrescrever modelo/esforço; para escolher outro modelo, usar contexto delimitado e fornecer o pacote explicitamente. Isso é uma restrição observada da ferramenta, não uma propriedade universal do Codex. Se a ferramenta aceitar apenas herança, decidir se ainda há benefício em delegar e registrar a limitação. Se não houver delegação, executar localmente mantendo os critérios de aceite.

Registrar modelo/esforço solicitados e, quando expostos pelo retorno ou estado do agente, os efetivos. Sucesso na criação sem essa informação não é confirmação independente de identidade ou consumo. Ao continuar com um agente existente, reavaliar se seu modelo e contexto continuam adequados ao novo pacote; criar outro somente quando necessário e quando houver trabalho paralelo útil.

## Fundamento e limites

A orientação oficial prioriza atingir a qualidade requerida e depois comparar modelos menores em custo/latência. Para o Praxis, aplicar isso por classe de tarefa, usando os critérios de aceite e retrabalho observado. Não adotar percentuais genéricos de acerto para autorizar falhas de integridade. [Model selection](https://developers.openai.com/api/docs/guides/model-selection).

O Codex permite escolher modelo e esforço por subagente; a documentação distingue trabalho estreito para Luna e exploração para Terra. Também alerta que subagentes consomem mais tokens que execuções comparáveis com um agente. Paralelismo não garante economia. [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents).

Astra é apresentado como o modelo mais capaz; a orientação relata casos em que menos tokens de saída reduzem custo por tarefa apesar do preço unitário maior. Portanto não assumir que o modelo menor sempre seja mais econômico no problema completo. [Model guidance](https://developers.openai.com/api/docs/guides/latest-model).

As atribuições abaixo são hipóteses operacionais para o Praxis, não benchmarks nem uma prescrição oficial por fase. Disponibilidade de um modelo não demonstra adequação à tarefa. Os identificadores foram expostos pelo mecanismo de agentes em 13/09/2026; conferir modelo e esforço aceitos antes de cada nova sessão. Não projetar preços da API como cobrança do plano Codex nem prometer percentual de economia.

## Matriz inicial de escolha

| Trabalho | Modelo inicial | Esforço | Responsabilidade e revisão |
|---|---|---|---|
| Coordenação, fronteiras canônicas, escopo e aceite | Modelo efetivamente selecionado no aplicativo; preferência do usuário por `gpt-6-astra` quando disponível | Alto nas decisões difíceis | Decide tarefas, integra evidências e aprova mudanças críticas; valida diretamente as fontes das decisões canônicas |
| Inventário de arquivos, testes existentes, referências e links | `gpt-5.6-luna` | low/medium | Tarefa estreita, evidência com caminho/linha; não declara garantias arquiteturais |
| Documentação derivada de contrato já aprovado, fixtures repetitivas | `gpt-5.6-luna` | medium | Usa fonte exata; dúvida semântica volta ao coordenador |
| Rastreamento de fluxo, patch delimitado, testes com critério já definido | `gpt-5.6-terra` | medium/high | Padrão inicial para implementação delegada de complexidade moderada; calibrar com resultado real |
| Implementação complexa, diagnóstico de integração ou refatoração transversal | `gpt-5.6-sol` | high | Só quando o pacote pede profundidade maior; revisão do coordenador |
| Autorização, tenant, transações, idempotência, recuperação e revisão crítica de contrato | Coordenador capaz, com preferência por Astra; Sol/Astra em subagente apenas com subproblema independente justificado | high; xhigh/max quando necessário | Não delegar decisão final ao modelo econômico; testes críticos são derivados de invariantes, não apenas da implementação |
| Executar comando conhecido, extrair resultado, validar JSON/links | Ferramenta/script diretamente, sem novo agente por padrão | — | Agente só agrega valor se houver interpretação ou investigação independente |

Não confundir modelo mais capaz com esforço máximo permanente. Ajustar profundidade à tarefa, preservando a escolha de um coordenador capaz solicitada pelo usuário. O coordenador não pode afirmar que mudou seu próprio modelo sem confirmação do mecanismo do aplicativo. A escolha de modelos dos subagentes é explícita na chamada de criação quando o mecanismo a admite.

O risco prevalece sobre o tamanho e o tipo de arquivo: uma alteração de uma linha em autorização ou um teste que define a semântica pública não é trabalho simples. Planos de fase não substituem essa classificação por pacote. Um teste rotineiro de serialização pode ser delegado; definir quais interleavings demonstram segurança transacional exige raciocínio especializado antes de delegar sua implementação.

Se o modelo escolhido não estiver disponível, reavaliar o pacote com as opções reais e registrar a substituição; não escalar silenciosamente todos os agentes para o mais caro. Não mudar configurações globais para aplicar esta política. Não afirmar que o principal é Astra apenas porque o plano assim recomenda.

## Delegação enxuta e sem conflitos

1. Delegar um resultado independente que permita trabalho útil simultâneo do coordenador. Tarefa curta, sequencial ou diretamente no caminho crítico pode ser feita pelo principal.
2. Começar sem novos agentes até identificar uma divisão útil. Quando houver benefício, usar inicialmente um ou dois trabalhadores, sem ocupar slots por reflexo. Consultar o limite real de concorrência da sessão, incluindo o principal; não assumir um número fixo. Não criar um agente por fase ou por comando.
3. Enviar contexto mínimo suficiente: objetivo, decisão aprovada, arquivos relevantes, caminhos resolvidos das instruções aplicáveis e deste guia, restrições e autorizações relevantes do usuário, critério de aceite, arquivos permitidos e motivo da escolha de modelo. Evitar copiar todo o histórico; solicitar leitura apenas das fontes necessárias. Incluir baseline da árvore e mudanças locais relevantes: commit sozinho não identifica um checkout modificado. O agente consulta as instruções aplicáveis e reporta contexto insuficiente, sem preencher lacunas por adivinhação.
4. Um único escritor por arquivo/pacote durante cada etapa. Trabalho compartilhado não implica isolamento automático. Não permitir builds concorrentes no mesmo target, instalações concorrentes das mesmas coordenadas Maven ou testes que alterem as mesmas fixtures de banco. Serialização ou isolamento pelo mecanismo oficial é obrigatório. O coordenador atribui explicitamente o uso exclusivo desses recursos e os comandos mutáveis admitidos; sem essa atribuição, o trabalhador apenas inspeciona e reporta a necessidade, sem começar a mutação. Essa atribuição coordena a autorização já existente e não exige nova pergunta ao usuário por tarefa.
5. Não permitir delegação recursiva por padrão. Novo subagente exige autorização explícita do coordenador para aquele subproblema concreto, com benefício identificado. Identificar uma possibilidade no plano não equivale a autorizar sua execução.
6. Retorno conciso: resultado, arquivos/linhas, alterações, testes executados com versão/commit e saída resumida, riscos e dúvida pendente. Logs extensos ficam em artefato quando necessários.
7. Toda implementação passa por revisão abrangente de pessoa/agente diferente do autor do trecho, conforme a matriz abaixo; o coordenador responde pelo aceite e pode revisar código que não implementou. Ler o diff, os caminhos afetados e suas fontes; o resumo do trabalhador não substitui essa inspeção. Um revisor pode cobrir um incremento coerente com vários commits, sem criar um agente por arquivo. Não repetir automaticamente toda suite válida.
8. Contratos públicos são estabilizados antes de delegar alterações derivadas. Publicações, migrações em banco compartilhado e adoção no host são coordenadas e serializadas.
9. Antes de aceitar evidências, verificar que os arquivos/dependências usados não mudaram desde a execução. Um contrato alterado invalida tarefas derivadas dependentes: atualizar o contexto e repetir apenas as provas afetadas. Resultados de agentes não são automaticamente integrados ou publicados.
10. Agente que concluiu o pacote não começa outro por iniciativa própria. Reusar contexto apenas em continuação relacionada; liberar a atividade quando não houver trabalho. A política não concede autorização de publicação, deploy ou alterações fora do escopo recebido.

Na descoberta de uma funcionalidade, o inventário delegado localiza fontes, mas não encerra a classificação de lacuna. O coordenador inspeciona diretamente os contratos e caminhos que fundamentam cada decisão de ADR/escopo. Na validação e no aceite, um revisor diferente do implementador — podendo ser o coordenador — avalia fonte, testes e evidência bruta das garantias críticas. Consolidar resultados com Luna não satisfaz essa revisão. Leitura independente do banco é propriedade do teste transacional; não significa obrigatoriamente criar outro agente ou executar a mesma suite duas vezes. Reexecutar quando a evidência não for reproduzível, houver mudança relevante ou existir risco concreto não coberto.

## Revisão abrangente obrigatória de implementação

Diretriz reforçada pelo usuário em 13/09/2026. Abrangente significa examinar a cadeia afetada pela mudança, inclusive lógica anterior e consumidores relevantes, e não somente ler as linhas adicionadas ou confirmar testes verdes. A profundidade acompanha risco e impacto; não significa auditar toda a plataforma a cada patch.

O coordenador atribui revisor e critério de aceite ao preparar o incremento. Toda implementação recebe uma revisão por pessoa/agente diferente de quem escreveu o trecho: se o coordenador implementou, atribuir a revisão a outro revisor; se corrigir materialmente código já revisado, devolver os trechos e efeitos afetados à revisão. Autorrevisão não satisfaz independência. Se não houver revisor disponível, o código pode continuar em desenvolvimento com evidências preservadas, mas o aceite/merge que depende dessa revisão permanece pendente e essa limitação deve ser explícita.

Por padrão, o revisor inspeciona e relata achados sem editar. Se receber atribuição para corrigir, passa a ser autor dos trechos alterados: outro revisor verifica essas correções e seus efeitos no fluxo. A mudança de papel deve ficar registrada; não é necessário um novo agente quando outro participante independente já puder realizar essa revisão. Rever um parecer não exige revisar recursivamente o próprio ato de revisão; a nova verificação incide sobre mudanças materiais no código/contrato/guidance e suas provas.

Escolher o modelo do revisor pelo risco da decisão que precisa verificar, não pelo preço do implementador. A matriz geral continua valendo: revisão delimitada pode começar em Terra; contratos críticos, integridade, segurança, concorrência e fronteiras transversais pedem coordenador capaz ou Sol/Astra com escopo independente justificado. Luna pode localizar fontes e consolidar documentação, mas essa extração não substitui o juízo de suficiência das garantias críticas. Não há dispensa de revisão por o autor usar um modelo mais capaz.

| Dimensão | O revisor confronta | Evidência ou resultado esperado |
|---|---|---|
| Planejado versus executado | Requisitos/ADRs, critérios de aceite, limitações anunciadas, diff e comportamento real | Cobertura por requisito; desvios explicados e decididos, sem alterar o plano apenas para legitimar a implementação |
| Integridade do código e arquitetura | Dono canônico, contratos, fluxo de dados/erros, duplicações, dependências, auto-configuração e consumidores | Solução de plataforma consistente; ausência de atalhos que criem autoridade paralela ou quebrem incorporação no host |
| Integridade do negócio e dos dados | Invariantes, estados/transições, permissões, tenant, validação do estado final, efeitos de domínio e fronteiras transacionais | Caminhos felizes e adversos que preservem as garantias; sem escrita cadastral que contorne ação governada |
| Uso corporativo e operação | Volume/limites, concorrência, retries, idempotência, falha parcial, indisponibilidade, cancelamento, recuperação, auditoria e diagnósticos seguros | Garantias aplicáveis demonstradas; limites explícitos, resultados reconciliáveis e informação suficiente para suporte/operador |
| Testes e regressões | Casos ausentes, qualidade das asserções, fixtures, integrações reais, consumidores existentes e validade do baseline | Testes que podem detectar violação da regra, não apenas repetir a implementação; comando/resultado rastreáveis |
| Documentação e experiência de adoção | Contratos públicos, exemplos/corpus, pré-requisitos, erros, versões, maturidade, extensão pelo host e operação | Corrigir omissões e inconsistências; instruções reproduzíveis para desenvolvedor e operador, sem anunciar recurso ainda indisponível |
| UX quando afetada | Clareza da ação, parâmetros, revisão, resultados, acessibilidade, foco, responsividade e consistência visual | Evidência apropriada à fase e superfície; revisão backend verifica viabilidade contratual sem declarar testes visuais executados |
| Skills | Catálogo canônico, gatilhos, procedimentos, fontes e provas ensinados pelas skills relacionadas | Decisão explícita sobre adequação, atualização ou criação; evidência canônica e estado de sincronização |

Examinar todas as dimensões; registrar `não aplicável` com motivo breve quando uma não tocar o incremento. Não exigir, por exemplo, teste de concorrência de uma correção de texto nem pesquisa completa de UX para um ajuste interno sem efeito na jornada. Cenário corporativo não é sinônimo de checklist genérico: selecionar casos concretos derivados do domínio e das garantias anunciadas.

O parecer integra o registro de execução/PR existente: revisor, escopo e baseline; achados com evidência, cenário/impacto e requisito afetado; correção necessária ou melhoria não bloqueante; validações e lacunas; decisão sobre docs/skills; conclusão `apto`, `correções necessárias` ou `evidência insuficiente`. Ausência de achados não comprova áreas não inspecionadas. Não fabricar recomendações apenas para preencher o relatório.

A conclusão identifica o objeto do aceite: código de um PR, skill ou incremento completo. `Apto para merge do código` não significa `incremento concluído` se houver entrega obrigatória de documentação/skill ainda pendente. Não emitir um `apto` global que esconda essa distinção.

Inconsistências de integridade, negócio, governança, contrato ou requisito obrigatório impedem o aceite do incremento afetado. Melhorias opcionais fora do escopo têm responsável e encaminhamento, sem virar refatoração geral obrigatória. O coordenador resolve divergências com base nas fontes e requisitos; o autor não encerra sozinho um achado sobre seu código. Correções materiais recebem nova revisão e apenas as provas afetadas são repetidas. O parecer final identifica o conteúdo corrigido, não somente a primeira versão revisada.

### Avaliação e evolução de skills em cada revisão

A obrigação permanente é decidir se a mudança exige evolução de skill. Usar a skill `praxis-skill-authoring-governance` ao desenhar ou revisar essa evolução e consultar o catálogo do repositório canônico `praxis-codex-skills`, não apenas a lista instalada da sessão.

| Decisão | Quando usar | Ação |
|---|---|---|
| `sem-impacto` | Mudança não altera orientação operacional reutilizável | Registrar motivo sucinto; nenhuma edição artificial |
| `existente-adequada` | Skill relacionada já ensina corretamente o comportamento final e suas provas | Registrar skill/fonte inspecionada e por que continua suficiente |
| `atualizar-existente` | Caminho canônico, contrato, validação, limites ou decisão recorrente mudou, ou a orientação tem lacuna demonstrada | Atualizar/aprimorar a skill e referências no mesmo ciclo; revisar gatilho, exemplos e proibições afetados |
| `criar-nova` | Existe procedimento reutilizável comprovado, com gatilho/escopo próprios, que não cabe coerentemente em skill existente | Inventariar sobreposição, definir dono/provas, criar e validar pelo fluxo canônico; não criar uma skill por commit/fase |

Uma lacuna do produto deve ser corrigida no dono do contrato/runtime; a skill não pode ensinar um contorno local como substituto. Se faltam acesso à fonte ou evidências para escolher a classificação, o parecer registra a avaliação pendente e a investigação específica necessária, sem classificá-la como `sem-impacto` ou `existente-adequada`.

Para atualização/criação, aplicar o fluxo de Melhoria Contínua das Codex Skills do `AGENTS.md`: fonte versionada em `codexrodrigues/praxis-codex-skills`, manifesto e hashes, validadores/auditorias do repositório, revisão/integração canônica e depois sincronização seletiva do ambiente. Distinguir escrita local, validada, integrada/publicada e sincronizada; nenhuma delas é inferida a partir da outra. Não editar o espelho instalado como fonte primária nem sobrescrever drift não relacionado.

Vincular a mudança de skill ao incremento correspondente. Código e guidance podem ter PRs em repositórios distintos, respeitando suas dependências: não exigir que uma skill ensine uma API ainda indefinida para permitir seu desenho. Com o comportamento estabilizado, preparar e validar a atualização/criação no mesmo ciclo. Um merge técnico de código pode preceder a integração da skill se seus próprios critérios estiverem satisfeitos e a sequência entre os PRs estiver explícita; isso não encerra o incremento.

Para concluir o incremento que exige skill, registrar a fonte canônica atualizada/criada, validações e integração/publicação canônica concluídas. Impedimento concreto, responsável e próximo passo mantêm o item pendente: não substituem a entrega. A sincronização do ambiente tem estado próprio; se não executada, declarar o motivo e fazer os consumidores lerem a fonte canônica atualizada, sem apresentar o espelho como atualizado. Orientação incorreta que seria usada na adoção/release precisa ser corrigida antes dessa etapa. Uma avaliação de impacto ainda inconclusiva também impede declarar completo o pacote.

Validadores e hashes provam estrutura e paridade, não que a skill ensina o procedimento correto. O revisor confronta comandos, fontes e exemplos com o comportamento final e suas evidências focais; para nova skill, verifica também um pedido que deve acioná-la e uma tarefa adjacente que não deve. Reaproveitar provas válidas da implementação, sem repetir toda a campanha apenas pela edição da skill. Esta regra não concede autorização adicional de publicação nem exige nova pergunta para operações já autorizadas.

## Escalada e medição

Escalar imediatamente ao coordenador se surgir regra de negócio ambígua, autorização/tenant, alteração de contrato não prevista, risco de perda/duplicação, nova fronteira transacional ou conflito de evidências. Não insistir em tentativas de um modelo menor quando a dificuldade é estrutural. Falha de ambiente não prova insuficiência do modelo: diagnosticar a causa antes de escalar.

Nos primeiros pacotes de cada classe, registrar no artefato de trabalho já existente: tarefa, modelo/esforço, contexto entregue, conclusão aceita ou devolvida, correções necessárias, tempo e consumo quando a ferramenta o expuser. Não criar uma plataforma de telemetria para isso. Consumo global da conta, misturado com outras tarefas, não permite atribuir economia a um agente. Sem medição atribuível, relatar qualidade, retrabalho e tempo, sem calcular economia de tokens ou dinheiro.

Quando houver dados comparáveis, considerar custo total até aceite, incluindo principal, trabalhadores e retrabalho. O inventário executado por Luna não valida Luna para código ou testes. Calibrar por classe com pacotes reais e critérios fixados previamente, sem duplicar sistematicamente toda tarefa em modelos distintos. Se uma abordagem se repetir sem evidência nova ou o contexto estiver inadequado, interromper e redistribuir; não usar um número arbitrário de retries como substituto de diagnóstico. Qualidade continua sendo o requisito para manter o modelo econômico.

Este procedimento não exige construir um roteador LLM, SDK de agentes, fine-tuning ou sistema de avaliação separado. É coordenação de trabalho no Codex. A governança semântica do produto Praxis permanece inalterada.

## Modelo de pacote de trabalho

Usar somente os campos pertinentes ao pacote. Para leitura curta, objetivo, fontes, limites, saída esperada e a justificativa breve de modelo/esforço bastam; não repetir este documento inteiro em cada delegação.

```text
ID / fase ou etapa:
Objetivo e critério de aceite:
Decisões canônicas já fixadas:
Baseline da árvore / alterações locais relevantes:
Modelo e esforço solicitados / justificativa / configuração efetiva se exposta:
Modelo efetivo do coordenador, se observável; não inferir:
Arquivos de leitura e instruções aplicáveis:
Arquivos autorizados para escrita:
Dependências e recursos exclusivos (banco, target, Maven):
Responsável pelo recurso / comandos mutáveis admitidos:
Testes necessários e evidências de saída:
Revisor diferente do autor / escopo da revisão / condições que invalidam a evidência:
Requisitos/ADRs e cenários corporativos aplicáveis / docs e skills a confrontar:
Condição para parar e consultar o coordenador:
Não criar subagentes nem ampliar o escopo sem nova instrução.
```

## Exemplos de escolha por pacote

| Pacote concreto | Escolha inicial e motivo | Limite de responsabilidade |
|---|---|---|
| Localizar anotações e testes de uma capability existente | Luna/medium: extração delimitada de evidências | Entrega caminhos e lacunas de informação; coordenador classifica aderência |
| Atualizar exemplos após aprovação de um contrato | Luna/medium: transformação documental com fonte exata | Não inventar semântica; validar links e payloads no escopo |
| Implementar uma validação Java isolada com invariantes aprovadas | Terra/high: patch delimitado que exige raciocínio e testes | Escalar se descobrir nova regra de domínio ou impacto público não previsto |
| Diagnosticar concorrência entre execução, retry e recuperação | Sol/high, ou Astra para incerteza crítica: interações que exigem análise profunda | Coordenador fixa garantias e revisa interleavings e evidências |
| Alterar uma linha que afeta autorização por tenant | Coordenador capaz; revisor independente com profundidade adequada ao risco | Tamanho pequeno não reduz risco nem exigências de teste/revisão |
| Executar um verificador conhecido de manifesto | Ferramenta diretamente | Sem agente adicional, salvo investigação independente necessária |

Os exemplos não autorizam criar esses pacotes automaticamente. Um teste que define o comportamento público pertence à análise de contrato mesmo que esteja em um arquivo de testes. O esforço máximo é reservado às decisões que o justifiquem.

## Continuidade por semanas e troca de coordenador

Usar o plano, checklist ou registro de execução já existente como ponto de retomada. Atualizar ao concluir um marco, mudar uma decisão, interromper um pacote ou passar a coordenação; evitar transcrever o histórico de conversa. Registrar somente evidência observada, distinguindo proposta, trabalho em andamento e aceite concluído.

```text
Atualizado em / responsável:
Objetivo autorizado / fora do escopo / gate atual:
Plano e tarefas: concluídas, em andamento e próximas (IDs e links):
Decisões aceitas / fonte canônica / alternativas ainda abertas:
Checkout por repositório / branch / commit / alterações locais relevantes:
Pacotes delegados: responsável, ID/host se expostos, status, modelo/esforço solicitados e efetivos se confirmados, justificativa e resultado:
Escrita e recursos exclusivos ainda atribuídos / atividade encerrada:
Atividades abertas, se houver: ID de sessão/processo, comando, diretório, porta/origin oficial quando aplicável e responsável:
Validações: comando, resultado, baseline, artefato e pendências:
Mudanças que tornam evidências anteriores obsoletas:
Bloqueios reais / autorizações existentes ou ainda necessárias:
Próximo passo executável e critério de saída:
```

O sucessor lê o `AGENTS.md`, as instruções locais e esse registro; verifica árvore, agentes/processos e recursos ainda ativos antes de editar. Não presume que um resumo equivale a teste aprovado nem que um agente de outra sessão continua disponível. Revalida somente o que perdeu validade ou segue sem prova. Se o próprio modelo não for observável, registra essa limitação em vez de inferir sua identidade.

O baseline de uma validação identifica o repositório/commit e o conteúdo relevante ainda não commitado no momento da execução, por diff ou snapshot/hash quando necessário. Listar apenas arquivos sujos não distingue duas versões do mesmo arquivo. Registrar dependências resolvidas, lockfiles, artefatos locais e runtime somente quando influenciam a prova; em testes HTTP, incluir a instância/versão efetivamente testada. Se não for possível estabelecer essa correspondência, a evidência não encerra o gate afetado. Não exigir inventário completo da máquina para uma validação focal.

Registrar identificadores de atividades abertas apenas quando realmente expostos e necessários à retomada. Confirmar que ainda pertencem à tarefa antes de agir sobre eles; um ID histórico pode estar inválido ou ter sido reutilizado. Para atividades encerradas, basta registrar o encerramento e o resultado relevante.

### Alcance das instruções e persistência

A descoberta de instruções começa na raiz do projeto, normalmente a raiz Git; sem raiz detectada, verifica apenas o diretório atual. Arquivos acima dela podem não entrar na cadeia. Há também limites de tamanho e precedência de `AGENTS.override.md`. Por isso, não tratar a declaração de escopo deste workspace como prova de carregamento em tarefas iniciadas diretamente nos repositórios filhos. [Descoberta de AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

Ao delegar ou passar contexto, incluir caminhos acessíveis para a política e o registro de execução, e pedir sua leitura; um link no documento não significa que seu conteúdo foi carregado. Para sessões iniciadas de forma independente, conferir as instruções efetivamente disponíveis e fornecer essa referência no contexto inicial. Se o checkout isolado não contiver os arquivos, transportar o conteúdo necessário com sua origem e data, sem presumir um caminho relativo válido.

Este guia e o template de instruções do workspace são versionados em `praxis-codex-skills/docs/platform-governance`. Sua integração não instala automaticamente instruções em outros checkouts. O coordenador deve fornecer a fonte e a revisão aos agentes; a materialização no workspace continua explícita. Não criar cópias divergentes nem mudar configurações globais como efeito implícito de uma revisão documental.

## Manutenção e origem da política

A escolha nominal dos modelos é uma referência datada, mantida neste guia para evitar tabelas divergentes em planos e instruções. Atualizar com disponibilidade real e qualidade observada por classe, preservando o critério de aceite. As fontes oficiais fundamentam os princípios; a matriz e o procedimento são decisões operacionais do Praxis, não recomendações oficiais para sua arquitetura específica.

A primeira aplicação foi um inventário somente de leitura por Luna/medium e uma revisão da política por Terra/high. Isso não constitui benchmark de implementação, prova de economia ou execução de uma fase de backend. A aplicação por funcionalidade permanece no respectivo plano de execução, sem duplicar esta política.
