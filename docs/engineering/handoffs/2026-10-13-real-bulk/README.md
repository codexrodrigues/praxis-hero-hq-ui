# Passagem de trabalho — integração real de operações em lote do Hero

**Encerrado por solicitação explícita do usuário em 13/10/2026 (America/Sao_Paulo). Não retomar automaticamente.**

## Forma de entrega e preservação

Esta pasta contém o estado exato das alterações deste agente em `changes.patch`, incluindo arquivos novos e exclusões, e um manifesto SHA-256. O patch parte da baseline indicada, NÃO da main atual. Ele foi entregue como artefato de revisão na main, sem aplicar alterações de runtime sobre mudanças concorrentes dos outros agentes. NÃO executar `git apply` cegamente, sobrescrever a main ou escolher `ours/theirs` indiscriminadamente. Revisar o diff contra a main atual e integrar manualmente os conflitos. Os checkouts originais, as mudanças do usuário e seus commits remotos foram preservados.

## Objetivo, arquitetura e trabalho feito

Substituir os mocks de operações em lote do Hero por SESSION real, discovery/capabilities/schema atuais, ETags de recurso, avaliação sem efeito, prévia protegida e confirmação humana com idempotência. Sem inventar endpoints, grants, contexto corporativo READY ou efeitos de backend.

- Hero: removidos interceptor de mocks e identidade/clearance simulados; adicionados sessão/login/logout reais, interceptor de origem confiável, rota de participantes e testes. Casos fictícios de reajuste/containment foram retirados; não foi criada operação substituta inexistente. Contexto corporativo é opcional no host BASIC atual, com histórico confirmado preservado para bloquear downgrade.
- Angular Core: unificação em BulkOperationClient/State/Session; remoção das classes BulkSync/PraxisBulkClient antigas, custody técnica em sessionStorage, ETags fortes, chave interna, fases ASYNC e fences de autorização/resposta tardia. Migração beta altera API pública: revisar consumidores.
- Table: atualização uniforme publicada, seleção explícita, preview, confirmação, close/resume, recuperação por leitura fresca e mesma chave; HTTP202 não é sucesso terminal. Contexto obrigatório somente quando realmente configurado ou previamente confirmado.
- CRUD: comandos e edição uniforme pelo runtime Core, descoberta fresca, validação, parâmetros serializados, status/results/cancel e custody. Revisão final dos parâmetros ainda incompleta.
- Landing: READMEs vendorizados e guias de Table/CRUD; sync oficial seletivo com testes.
- Skills: Core, Table, CRUD e Host atualizadas em checkout canônico; NÃO integradas/instaladas como guidance ativo. Há guidance transitório pendente de implementação na DynamicForm.

## Evidência válida e limites

Antes dos últimos ajustes: Hero 11 unitários/build/E2E controlado nos três temas; Core33, Table32, CRUD104 aprovados. Closure de14libs, packs locais oficiais e E2E Table focais passaram. Ingestion20/20 e snapshot Config10/10: nenhuma mudança semântica Config identificada nesse ponto. Os pacotes candidatos têm rótulo rc.12, mas bytes não publicados; NÃO inferir release pelo número.

Último Table: 33 testes focais e build passaram com política authored/command/transient. Novo teste CRUD real encontrou DI incompleta na fixture, depois NG0103 e formulário sem geometria. O autor acrescentou GenericCrudService real, retirou feedback initialValue e começou a usar materializeFormLayoutFromMetadata. **A fonte final desses ajustes não foi validada nem revisada integralmente.** Revisar estabilidade do FormConfig produzido no template (não criar novo objeto a cada detecção), renderização dos parâmetros e payload date-only. Não tratar os104 testes antigos como aprovação do último diff.

Toda prova com banco usou branches Neon exclusivas: API br-twilight-breeze-adq1cqaq (dark-mountain-25788969) e Config br-noisy-mouse-a4vgfjag (ancient-leaf-72055027), PG17/TLS e perfis ordinários verificados. Owner somente para provisionamento/inspeção; não como prova operacional.

12 comandos oficiais de capacidade foram confirmados, identidade de9campos íntegra, duas instalações e dois slots livres. Primeira publicação503: timeout do controle3s, rollback/readback UNCOMPOSED/geração0 e zeroexecuções. Saturação posterior não prova causa. Nova tentativa serial, sem navegador concorrente: HTTP200, controle localREADY/geração1. Readback posterior: publicação globalPUBLISHED/geração2 e digest correspondente. Restart/reconcile oficial posteriorHTTP200 preservou geração local1.

Hero real: SESSION204, filtro200, total195 no paginador/10linhas carregadas. Após aguardar discovery:11checkboxes, bulk-update allowed. O ensaio selecionou37/38 e abriu a operação, mas parou antes de EVAL/CONFIRM aguardando formulário. **Nenhuma prova positiva de mutação de negócio, retomada ou ausência de duplicação foi concluída.**

Participantes37/38: missão2PLANEJADA, versões0; papelINTEL eNEGOCIACAO. Resultado não pode mudar em missão planejada; candidato FERIDO não executado. Prova proposta passou a papelSUPORTE, permitido nessa fase, mantendo principal único/equipe/grants. Não alterar fixtures para forçar um teste verde.

## Onde parou / próximos passos do sucessor

1. Revisar este patch e mudanças concorrentes da main; preservar ambas, comparar baselines e consumidores antes de integrar.
2. Concluir parâmetros CRUD: formulário real renderizado, configuração estável, sem feedbackloop, sem submit implícito, serializer canônico e contrato fresco. Repetir testes focais após correção.
3. DynamicForm: foi apenas PLANEJADO, **não implementado**. A política transient existente já evita layout normal, mas ngOnInit ainda lê form-inputs e outras preferências/fallbacks. Auditar ngOnInit2165/2201, fallback2633, persist/conflict2753/2765, presentation, storedschema metadata e ações de authoring. Corrigir fonte canônica, preservando modos persistentes, schema/ETag governados, mudanças de política/destroy e detach explícito. Nenhum novo flag/DTO/endpoint necessário. Testar ngOnInit real com storage indisponível, schema erro, late callbacks e regressões não transitórias.
4. Atualizar skills de runtime/layout de formulário e guidance Table/CRUD: não instalar instrução de isolamento completo enquanto a implementação continuar parcial. Atualizar manifesto/drafts e validar scripts canônicos. Não sobrescrever drifts locais de List/UI-product-design.
5. Reconstruir dependências e packs oficiais após o diff final; gerar nova proveniência incluindo arquivos novos. Packs anteriores não incluem os últimos ajustes.
6. Repetir E2E focal e Hero com HTTP real/Neon: snapshot BEFORE_PLANNING, avaliação sem alteração de alvos/missão/193não-alvos, confirmação única, resultados, versões+1, mesma chave/replay, recuperação após resposta perdida e autorização delegada vs confirmação de outro criador. Sem mocks como prova operacional.
7. Rever README/roadmap/json-api/publicdocs/ingestion. READMEs vendorizados podem estar anteriores aos últimos ajustes. Config snapshot/release só se houver delta semântico real após regeneração.
8. Somente após revisão independente e gates: integrar fonte, publicar Angular pelo workflow oficial, adotar versão publicada no Hero, sincronizar somente skills afetadas e deploy oficial com smokes. NÃO publicar a partir deste snapshot incompleto.

Pedido intermediário de revisar destaque de conexões (entradas/saídas, Cmd/Ctrl, pulso, persistência e temas) **não foi iniciado**, porque o usuário encerrou a tarefa. Confirmar o repositório do Workflow Designer antes de assumir que isso pertence ao Hero.

## Recursos locais e segurança

Checkouts e registros detalhados: /tmp/praxis-hero-real-bulk-20261013/docs/engineering/real-bulk-integration.md; /tmp/praxis-hero-bulk-runtime-20261013; /tmp/praxis-hero-real-bulk-skills-20261013; /tmp/praxis-hero-real-bulk-landing-20261013.

Evidência privada: /private/tmp/praxis-hero-bulk-neon-20261013 (0700). Contém credenciais/cookies/chaves: NÃO anexar, versionar, imprimir ou copiar para GitHub. Scripts e receipts de main12, witnesses e supervisores estão ali para inspeção local autorizada. Chaves/budgets têm prazo finito: consultar validade atual antes de qualquer retomada; não renovar/resetar budgets antigos nem ativar capacidade copiada de outra branch. Branches isoladas foram preservadas; não excluir sem autorização.

Hosts/backend/frontend e testes da tarefa foram encerrados; agentes interrompidos. Logout do operador foi comprovado na origem correta:204, depois401 e cookie removido; não equivale à revogação de cópias doJWT. Uma tentativa anterior de cleanup usou origem diferente e não comprovou remoção; recibos negativos preservados. Não houve release npm, tag ou deploy deste incremento.
