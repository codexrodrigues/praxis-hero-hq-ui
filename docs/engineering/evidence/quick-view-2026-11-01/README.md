# Quick View — correção de bootstrap do Hero HQ

> Registro histórico dos ensaios de 01/11/2026, anterior à integração em main.
> O estado de integração está no [recibo posterior](../quick-view-main-integration-2026-11-01/README.md).

Data: 01/11/2026. Classe: `local-pequena`. Aderência:
`ja-suportado-mal-nomeado-ou-mal-materializado`.

O host não instalava o apresentador de Quick View. O incremento adiciona somente
o import público e o registro de `providePraxisQuickViewDialogPresenter()` em
`src/app/app.config.ts`. A API e os providers existentes permanecem canônicos;
não há contrato, dependência ou configuração de coluna nova. O renderer de presets
ricos não é necessário para bindings sem `contentRef`.

## Custódia e escopo

- HEAD do Hero: `6460867ed966b5551b7bb7f1548e9d00a67c69aa`.
- A árvore já possuía numerosas alterações locais, inclusive em `app.config.ts`,
  `package.json` e lockfile. O build e o browser usam essa árvore completa;
  esta tarefa não reivindica autoria nem aceite dos demais deltas.
- Pacotes instalados `@praxisui/core` e `@praxisui/dialog`: `10.0.0-rc.42`.
- SHA-256 do `app.config.ts` validado:
  `6b706429325c560f09fcb6538fdd6e6b9e9c15297721181cd8c8213f230e07c3`.
- SHA-256 do lockfile validado:
  `aef2d7fdf2346fc26706e1c8855235d07577060120d5030805e8084704aa5464`.

## Validação

1. `npm run build`: exit 0. Aviso de orçamento inicial: 17,13 MB, acima do
   limite de warning de 15 MB e abaixo do limite de erro de 18 MB.
2. `git diff --check -- src/app/app.config.ts`: exit 0.
3. Browser na origem oficial local `http://127.0.0.1:4302`, rota
   `/operacoes/incidentes`, com pacotes reais e respostas de API interceptadas
   por CDP Fetch para tipos XHR/Fetch. Não há conexão direta a banco nem prova
   operacional de backend neste ensaio. Todas as consultas de API do ensaio são
   respondidas por fixture; tentativas de persistir preferências recebem 404.
4. Campo `descricao` com `resourceReference` materializa o gatilho sem binding
   manual na coluna. Clique abre resumo com identidade e atributos da fixture.
5. `Abrir detalhe` abre o drawer canônico e carrega os mesmos dados em modo de
   leitura; fechar o drawer devolve foco ao gatilho.
6. Enter no gatilho abre o resumo; Escape fecha e devolve foco ao gatilho.
7. Os estados loading, indisponível e falha também foram observados durante
   a preparação da fixture. As primeiras respostas sintéticas estavam incompletas
   (operationId e envelope HATEOAS); foram corrigidas antes do aceite do caso ready.

Artefatos: `quick-view-ready.jpg`, `quick-view-detail.jpg`, `ui-fixture.json` e
`build.log`. A fixture é sintética e limitada a UI; não é schema de produção.

## Revisão e limites

Revisão independente somente de leitura aprovou as duas linhas, sem achados:
API pública instalada, serviço root, token via useExisting e ordem de providers
adequados. Não repetiu o build nem executou banco.

Skills: `existente-adequada`. Fonte inspecionada:
`praxis-codex-skills/codex-skills/praxis-core-providers-bootstrap/SKILL.md`;
o guidance já distingue instalação da capability de registro de metadata.
Não há atualização canônica ou sincronização local de skill necessária.
Não há artefato público derivado a atualizar: a mudança apenas conecta o host
ao contrato já publicado.

Não foram validados presets com contentRef, matriz de recursos, narrow/touch ou
tempo de hover. Não houve deploy, publicação, push ou mutação de recurso de negócio.
O aceite do Firebase continua pendente da operação de publicação e de smoke real
da versão publicada. O servidor local desta tarefa foi encerrado após o ensaio.
