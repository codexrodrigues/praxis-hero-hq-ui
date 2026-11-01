# Integração Quick View em main — 01/11/2026

Este recibo sucede os ensaios históricos `quick-view-2026-11-01` e
`quick-view-quality-2026-11-01`. O usuário autorizou revisar e enviar todas as
alterações desta conversa para os mains remotos. Não houve autorização presumida
para criar uma nova release das bibliotecas, nem publicação por tag nesta operação.

## Deltas integrados

- **Angular/Core:** [e484883b0](https://github.com/codexrodrigues/praxis-ui-angular/commit/e484883b0b1283ce10513b139221255477addd03),
  sobre main `53f790984`: formatação numérica explícita por metadata, specs e README.
  Push fast-forward concluído e SHA de main confirmado por leitura do GitHub.
- **Metadata Starter:** [9cbea01f86](https://github.com/codexrodrigues/praxis-metadata-starter/commit/9cbea01f868d0ca3c952c19499c590b7e50cf799),
  sobre main `53ab770a46`: resolução do retorno genérico contra controller concreto,
  seis regressões novas e changelog. Push fast-forward concluído e SHA confirmado.
- **Hero:** candidato sobre main `5edcab297effd50a730e9069bf44e228e6f2c71d`.
  Esse main já contém o apresentador Quick View, coluna Missão e coluna Fornecedor,
  além da adoção de SDK rc.43 e coluna Produto, integrados por outros commits.
  O delta restante acrescenta Contrato à projeção de Pedidos, preservando Produto
  e as demais mudanças remotas, e publica todas as evidências desta conversa.

Os checkouts originais dirty foram preservados. Não foram incluídos ajustes locais
de temas, voz, páginas corporativas, laboratório, dependências ou filtros de outras
tarefas. As alterações sobre bases antigas foram reaplicadas em worktrees limpos,
sem force-push, tag ou desativação de proteção.

## Revisão e validação

- Revisores independentes diferentes dos autores: Core por qv_examples; Metadata
  por review_quick_view; Hero por qv_latency. Sem achados bloqueantes. O coordenador
  revisou os deltas e preservou a precedência das mudanças já existentes em main.
- Core: fonte produtiva idêntica ao ensaio de 22 specs e build da cadeia de libs
  (Core, Dialog, Table e consumidores). Esses testes válidos não foram repetidos
  apenas por commit. Validador incremental de docs executado novamente, exit 0;
  warnings documentais legados sem novos bloqueios.
- Metadata: main avançou 26 commits desde o ensaio original. Na árvore atual foram
  executados `mvn -B -Dtest=ApiResourceIdentityResolverTest,ApiDocsControllerTest test`:
  **44 testes**, zero falhas/erros/skips; sem banco e sem Maven install.
- Hero: dependências rc.43 isoladas, lockfile byte a byte igual ao checkout de main
  já instalado. `npm run build`: exit 0, 17,24 MB, warning acima de 15 MB e abaixo
  do limite de erro de 18 MB. `npm test`: exit 0, typecheck, 65 asserções de contrato
  e verificações de navegação aprovadas.
- `git diff --check` passou nos três projetos. Artefatos textuais revisados sem
  credenciais; propriedades de máquina dos relatórios Surefire históricos foram
  removidas, preservando casos e resultados. Schemas e patches históricos mantêm
  seus hashes; a sanitização não altera código nem prova de teste.

Logs desta rodada acompanham este recibo. Capturas browser anteriores permanecem
explicitamente históricas: runtime rc.42, schemas HTTP reais e registros/permissões
sintéticos; o schema candidato de identidade não é prova de backend corrigido
publicado. A revisão de main e os builds atuais não reclassificam essas capturas.

## Automação e limites

O push do Hero em main dispara `Deploy to Firebase Hosting`, incluindo npm ci,
build e publicação live em `praxis-hero-hq`. Seu resultado deve ser consultado no
run associado ao commit; este arquivo não antecipa sucesso do deploy.

Angular publica somente por tag `praxis-ui-v*`; Metadata publica por tag `v*` ou
workflow de release intencional. Nenhum deles foi disparado nesta integração.
O Hero conserva os pacotes publicados rc.43. Os novos commits de Core e Metadata
em main ainda exigem release e adoção para produzir efeito no ambiente publicado.

A cadeia de quatro/cinco GETs e a latência não foram alteradas. O incremento não
promete ganho de desempenho, não introduz cache de autorização e não faz mutações
de dados de negócio. Não houve nova validação dependente de banco.

Skills: `existente-adequada`; fontes canônicas de runtime, i18n, bootstrap e schema
já prescrevem os owners e semântica usados. Sem contrato novo, comando novo ou
drift de guidance que exija atualização/sincronização de skill neste incremento.
