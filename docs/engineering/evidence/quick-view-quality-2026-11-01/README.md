# Quick View: latência, metadados e exemplos

> Registro histórico dos ensaios de 01/11/2026, anterior à integração em main.
> O estado de integração está no [recibo posterior](../quick-view-main-integration-2026-11-01/README.md).

Investigação de 01/11/2026. Estado: exemplos Hero implementados; correções de
biblioteca em worktrees isolados, ainda sem publicação/adopção remota.

## Inventário e plano de impacto

Classe global: transversal; a correção da identidade no backend toca publicação
de `x-ui.resource.identity` e é tratada como contrato público existente.

| Necessidade | Aderência | Owner e decisão |
| --- | --- | --- |
| `danosCivis` aparecendo como label | já suportado, mal materializado na evidência | A fixture anterior usava `x-ui.label = nome técnico`. Preservar o schema real; não humanizar nomes no Hero. |
| Valores numéricos ignorando moeda/precisão explícitas | já suportado, mal materializado | Corrigir Core com resolver/formatter compartilhados; preservar masking/options. |
| Identidade ausente em GET herdado de contrato | já suportado, mal materializado | Corrigir resolução de generic no Metadata Starter, sem duplicar identidade no consumidor. |
| Missão/fornecedor/contrato não avaliáveis na tabela | já suportado, só UX | Acrescentar colunas já declaradas no schema, preservando sourceIdentityField das FKs. |
| Demora na abertura | suportado parcialmente | Medir metadados e rastrear cadeia; não adicionar cache de permissão no Hero. |

Consumidores: Quick View em Table/Fields/List/Charts/AI e demais clientes do Core;
Quickstart e schemas de detalhe do Metadata Starter. Nenhuma API nova, anotação
duplicada, manifesto AI ou shape de binding novo. Docs canônicas do Core revisadas.
Risco: mudança de apresentação numérica explícita e correção da identidade publicada;
requer publicação e adoção antes de aceite remoto. Corpus HTTP, manifests e landing
não precisam de novo contrato/exemplo de payload; a prova operacional do release
continua distinta da evidência de fonte.

## Latência comprovada e limites

O fluxo atual tem atraso intencional de hover de 280 ms (clique/teclado iniciam
imediatamente), seguido por catálogo → item → surfaces contextuais → schema.
Schema e leitura de projeção distinta podem ocorrer em paralelo na etapa final.
Quando a surface é o próprio item, o primeiro GET do item é reaproveitado: quatro
GETs; uma projeção distinta exige cinco. O CTA revalida autorização separadamente.

Medições curl de metadados públicos, sem consultas de registros ou SQL:

| Consulta | HTTP | TTFB 1 | Total 1 | TTFB 2 | Total 2 |
| --- | --- | --- | --- | --- | --- |
| `/schemas/surfaces?resource=operations.incidentes` | 200 | 1,885948 s | 1,886657 s | 2,009586 s | 2,009792 s |
| schema exato de detalhe de incidentes, publicado na surface | 200 | 1,319475 s | 1,319809 s | 1,314096 s | 1,314253 s |

São duas amostras por endpoint, de processos curl independentes, não uma medição
distribuída do tempo total do browser. Não provam cold start, SQL lento ou percentis.
Só essas leituras já somam cerca de 3,2 s no caminho serial, além de item/contexto.

Não há LRU de registros prontos no Quick View; o dedupe superior só vale durante
a Promise pendente. Dismiss invalida a geração mas não aborta a cadeia HTTP.
Uma otimização futura de transporte precisa preservar revalidação contextual,
cancelamento por último consumidor e isolamento por identidade/tenant/epoch.
A investigação encontrou chaves de compartilhamento por href no discovery e
uma chave superior que omite a surface de fallback; ampliar esse reuso sem testes
de troca de contexto não é uma otimização segura. Isso é achado de fonte, não
prova de vazamento operacional. Não houve patch de cache/cancelamento nesta rodada.

## Labels e identidade

Os schemas raw em `contracts/` preservam labels e URLs publicados, com hashes e
horário de coleta em `contracts/sources.json`. Os dados de registros são sintéticos.
No browser com pacotes instalados rc.42, incidentes exibiu `Danos Civis`, `Ocorrido
em`, `Feridos` e `Mortos`. Não se reproduziu concatenação visual de labels/valores;
o layout do resumo tem display flex e gap computado de 10 px. Capturas desktop e
390×844 px da missão estão incluídas. Texto de acessibilidade concatenado não é
prova de colisão visual.

O exemplo contrato mostrou problema independente: o schema filter possui identidade
`id/number/supplierName`, mas o schema exato de detail não publica identidade.
Assim o heading cai em `surface.title = Abrir item`. A origem é o retorno genérico
herdado resolvido sem o beanType concreto pelo ApiResourceIdentityResolver.
Não se deve copiar identidade do filtro para a configuração do Hero. Alguns
labels, como `Status (rótulo)`, `Homologacao` e `Valido ate`, já são publicados assim
pelo backend; qualquer revisão editorial desses textos pertence ao dono dos metadados.

## Exemplos habilitados e browser

Origem oficial: `http://127.0.0.1:4302` via `npm start`. Browser CUA, XHR/Fetch
interceptados com schemas raw e registros sintéticos; nenhum banco ou endpoint de
negócio foi mutado. Tentativas de configuração persistente recebem 404 na fixture.

- `/operacoes/incidentes`: `missaoId` agora aparece após descrição. Incidente 253
  abriu missão 99 pela surface `summary`, com identidade e campos próprios da
  projeção, sem usar o id 253 como alvo. Desktop e narrow capturados.
- `/suprimentos/pedidos`: `supplierId` e `contractId` aparecem após id. Pedido 41
  abriu fornecedor 7 e contrato 3. O fornecedor tem identidade correta; a captura
  de contrato registra a deficiência de identidade do schema remoto, sem ocultá-la.
- Relações nulas: supplierId/contractId nulos geraram zero gatilhos de fornecedor
  ou contrato; o gatilho do pedido 41 continuou presente. Sem fallback indevido
  para o id do registro pai.
- Exemplos já servidos pelo mesmo provider: funcionários (nome/cargo/departamento),
  equipes (nome/base), participantes (missão/funcionário) e contratos (número/fornecedor).
  Não foram todos percorridos nesta bateria.

As fixtures e consultas interceptadas estão em `browser-fixture-records-and-requests.json`.
Permissões contextuais são simuladas para a fixture; esta prova não certifica
perfis, dados reais, efeitos ou disponibilidade do backend publicado.

## Fontes e validações

- Hero HEAD `6460867ed966b5551b7bb7f1548e9d00a67c69aa`, árvore já dirty.
  Autor das projeções: subagente qv_examples; revisão do delta e browser: coordenador.
  Só foram adicionadas missaoId/supplierId/contractId à projeção, com header/width;
  nenhum binding manual ou renderer de substituição.
- Core worktree `praxis-angular-quick-view-quality`, branch
  `codex/quick-view-metadata-quality-20261101`, base `53f790984`.
  Autor service/spec: review_quick_view; revisão independente: qv_examples.
  Scope: moeda/número/percentual explícitos; código/precisão zero/locale/frações;
  fallback da moeda e casas decimais do campo preservado. Datas/time/compact e
  formatos avançados continuam fora desta correção.
- `npm run test:core -- --include=projects/praxis-core/src/lib/services/resource-quick-view.service.spec.ts`:
  22 SUCCESS, exit 0, Chrome Headless 144. Saída bruta registrada na sessão de
  ferramenta 18668; não foi reexecutada apenas para produzir log.
- `npm run build:praxis-core`: exit 0. O script disparou a cadeia de libs, incluindo
  Core, Dialog e Table; log em `core-build.log`. Nenhum build adicional de consumidor
  foi repetido depois desse sucesso.
- `npm run build` no Hero: exit 0; warning de orçamento 17,13 MB acima do limiar de
  warning de 15 MB, abaixo do erro de 18 MB; `hero-build.log`.
- Metadata worktree `praxis-metadata-quick-view-identity`, base `0b162f2abc`:
  `mvn -B -Dtest=ApiResourceIdentityResolverTest test`: 13 testes, zero falhas,
  erros ou skips; JDK Temurin 21.0.10 e Maven 3.9.15, target exclusivo, sem banco
  ou `mvn install`. Autor resolver/spec: qv_latency; revisão independente:
  review_quick_view. Precedências e guard response-only preservados.
  Relatórios Surefire em `metadata-unit/` e hashes em `source-receipts.json`.
- `mvn -B -Dtest=ApiDocsControllerTest test`: 31 testes, zero falhas, erros ou
  skips, sem banco. Consumidor unitário do resolver/schema validado separadamente,
  sem repetir os 13 testes anteriores. Log `metadata-controller-unit.log`.

`core.patch` e `metadata.patch` preservam os deltas de fonte revisados. O teste
visual adicional `pedido-contrato-candidate-identity.jpg` usa fixture explicitamente
candidata (`contracts-detail-candidate.schema.json`), com a identidade declarada no
DTO que o resolver corrigido consegue resolver. Confirma o heading CT-003/2026 no
runtime; não é resposta HTTP da versão remota corrigida. O eyebrow genérico `Abrir
item` permanece derivado da surface e ainda não foi revisado editorialmente.

Skills: `existente-adequada`, fontes canônicas inspecionadas em
`praxis-codex-skills/codex-skills/{praxis-core-resource-runtime,praxis-core-i18n-resource-copy,praxis-core-providers-bootstrap,praxis-metadata-schema-contracts,praxis-table-authoring}/SKILL.md`.
O guidance já determina owner canônico, uso de metadados e formatter compartilhado;
nenhum procedimento/contrato novo foi criado. Sem necessidade de sincronização local.

Não houve push, PR, release ou deploy. O Hero não foi repinado para artefatos ainda
não publicados. Correções de fonte e avaliação do runtime publicado são estados
separados. A integração e prova HTTP do backend corrigido continuam pendentes.

Para avaliação do usuário, o dev server oficial do Hero permanece em
`http://127.0.0.1:4302` (`npm start`, checkout `praxis-hero-hq-ui`, PID Node 57945
ao fim do ensaio). A aba temporária com interceptações foi fechada; elas não
alteram a aplicação nem as próximas abas do usuário. O servidor usa os pacotes
declarados rc.42 e as novas colunas locais, não os candidatos de biblioteca.
