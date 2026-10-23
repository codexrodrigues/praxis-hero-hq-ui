# P3-C — adoção em incrementos

Fonte e controle: [Quickstart #461](https://github.com/codexrodrigues/praxis-api-quickstart/issues/461). Este documento registra o primeiro incremento no Hero, não o aceite de toda a fase.

## P3-C.1 — entrada de contexto no Hero

Em `/workspace-corporativo`, o usuário consulta a sessão, carrega opções paginadas, escolhe uma opção admitida e recebe o contexto relido do servidor. A seleção envia somente `choiceRef` e `expectedSelectionVersion` retornados pelo servidor. Tenant e organização são conceitos distintos. A UI não oferece criação/publicação corporativa enquanto a adoção correspondente não existir.

O laboratório local continua em `/laboratorio`, sem login. O seletor de personas não autentica o usuário corporativo nem concede permissões. Uma sessão ausente apresenta orientação explícita e mantém o laboratório acessível. Não há credencial artificial ou fallback local para um contexto corporativo.

O interceptor do host deixa de acrescentar headers de persona e seu bearer sintético a `/api/praxis/runtime/**`. O SDK oficial mantém os headers do snapshot confirmado. O host inclui credenciais de sessão explicitamente para a origem de API configurada. Um serviço Core limitado à rota usa `includeGlobalFetchHeaders=false` e `errorPolicy=fail`, evitando que a experiência corporativa transforme o contexto das telas legadas da demonstração. Destruição e mudança de persona invalidam gerações/callbacks; uma resposta antiga não pode restaurar opções descartadas.

**Limite operacional:** em produção, a API Render está em outra origem. Cookies dependem dos atributos adequados e do CORS oficial com credenciais; `withCredentials` sozinho não completa autenticação. O Quickstart produtivo também protege mutações por CSRF. O transporte oficial do token CSRF entre essas origens e a sessão autenticada ainda precisam ser provados antes de aceitar seleção real por HTTP. Não desabilitar CSRF ou conceder grants por headers para fazer a demonstração passar. O teste deste incremento intercepta APIs e não prova esses pontos.

## Inventário e impacto antes do código

Classificação: `transversal` na adoção do host; nenhum contrato público novo. Plano: materializar contexto existente, preservar a identidade server-side, testar a costura do SDK no navegador e submeter a revisão independente antes de integrar. Sem publicação/deploy.

| Necessidade | Aderência / fonte | Ação |
| --- | --- | --- |
| Consultar contexto, choices opacos e seleção CAS | `ja-suportado-so-ux`, Core rc.37 e Config | UI de entrada usa `EnterpriseRuntimeContextService`; sem endpoint ou DTO paralelo |
| Headers do contexto confirmado | `ja-suportado-mal-nomeado-ou-mal-materializado`, Core + interceptor Hero | Não sobrescrever snapshot com persona; não enviar bearer fictício |
| Sessão cross-origin / CSRF | `suportado-parcialmente` na adoção | Credenciais explícitas; prova operacional e transporte CSRF permanecem gate |
| Navegação paginada P3-B | `suportado-parcialmente`, Core integrado PR640 | rc.37 publicado ainda não contém esse incremento; não duplicar o cliente no Hero |
| Criação/publicação/URL governada | `suportado-parcialmente`, Config integrado PR519 | Quickstart ainda precisa registrar os SPIs de fonte, admissão, audience e navegação; defaults falham fechados |

Consumidor alterado: Hero (rota, menu, interceptor, componente e teste). Donos canônicos preservados: Config para contexto/publicação; Core para o cliente; Quickstart para identidade, grants e providers; Hero para shell e materialização visual. README e catálogo de rotas atualizados. Nenhuma alteração de biblioteca, `public-api`, pacote/lock, manifest, corpus HTTP ou documentação pública da plataforma. Nenhum artefato derivado dessas superfícies precisa sincronização neste recorte. O build incluiu uma alteração preexistente em `incidentes.config.ts`, identificada por hash na evidência e preservada fora do commit. Risco: interceptor de runtime passa a usar a sessão real; fluxos que dependiam de identidade simulada nesses endpoints deixam de recebê-la deliberadamente. Requests de negócio e preferências permanecem no fluxo anterior.

## Próximos incrementos, com aceite próprio

1. Quickstart: adotar o artefato candidato em repositório Maven isolado e aplicar a migração explícita da fixture lifecycle 23→24 quando a versão adotada mudar. Não sobrescrever rc.166 público com bytes privados. Reusar a prova de compilação e sete testes de autoridade de PR462 enquanto fonte/dependências relevantes forem idênticas.
2. Fixar namespace, fonte/template nativos e política real de grants do piloto. Registrar `PageCreationHost`, admissão/estrutura/audience e delegate `PageRuntimeReadService.navigation` pelos SPIs existentes. O piloto PurchaseOrder de Table/Form não é um root universal de páginas nem uma política de leitura corporativa.
3. Provar uma jornada HTTP pequena e completa numa branch Neon exclusiva: sessão/contexto admitido → criação/cópia → publicação → URL/menu; incluir negativa de outro ator/tenant e retirada. Reusar as provas canônicas P3-A/P3-B de concorrência/rollback que permaneçam válidas; só executar novamente a costura alterada.
4. Adotar o transporte publicado/empacotado oficial no Hero e materializar página/menu/rota (P4). Não antecipar endpoints, caches ou grants no frontend. Cada entrega passa por revisão independente antes de integração.

## Validação e revisão

Com servidor oficial `npm start` em `http://127.0.0.1:4302`:

```sh
node test-e2e/test-route-catalog.cjs
node test-e2e/test-corporate-context.cjs
node test-e2e/test-visitor-lab.cjs
npm run build
```

O ensaio de contexto usa o SDK npm rc.37 real e intercepta HTTP. Cobre paginação, seleção CAS, contexto relido e recarga, headers server-side, credenciais explícitas no transporte, 401/403/409/503, remoção de estado antigo, descarte de callback A→B→A e retorno ao laboratório. Não expõe detalhes crus de erros. A viewport estreita cobre o estado de erro, com navegação recolhida e limites de textos/ações conferidos; seleção mobile e teclado não são declarados provados. O shell faz navegação transitória ao alternar personas; o teste aguarda a conclusão e exige uma única instância, sem mascarar duplicidade com `first()`.

Não houve conexão a banco nem mutação do Quickstart público. HTTP/Neon operacional não foi executado neste incremento. A issue P3-C permanece aberta. Resultados finais: navegador de contexto, regressão completa do laboratório e catálogo de rotas aprovados; build de produção aprovado em 6,253 s, com aviso de bundle inicial16,44MB (alerta15MB/erro18MB). [Logs, screenshots e hashes](evidence/p3c-context-2026-10-23/validation.json) vinculam a árvore/dependências relevantes. A bateria ampla `npm test` não foi repetida: a divergência histórica do dashboard340/380px está registrada na evidência anterior, sem mudança nesta área.

Revisão independente: `p3c_host_inventory` (Sol/high, pela fronteira de identidade e concorrência), com escrita somente pelo coordenador. A revisão detectou ausência de credenciais explícitas e rótulo Tenant confundido com organização; ambos corrigidos. Os limites CSRF/CORS foram mantidos como gates operacionais, sem alegação de adoção completa.

Skills: `existente-adequada` para este recorte; inspecionadas `praxis-angular-host-project`, `praxis-core-runtime-contracts`, `praxis-java-config-boundary-integration` e matriz canônica de integração. Contratos/decisões ensinados não mudaram. O procedimento definitivo de transporte SESSION/CSRF e providers deverá ser confrontado novamente no incremento operacional; não se ensina aqui um workaround incompleto como referência de produção.
