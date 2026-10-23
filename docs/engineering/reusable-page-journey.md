# Jornada reutilizável — prova Hero

O fluxo do laboratório passou a consumir `PraxisPageCopyActionComponent` e `PraxisPageSaveAsComponent` de `@praxisui/page-builder`. O Hero deixou de implementar os controles e a coordenação de save/retry/resultado. Mantém um adapter de poucas linhas, a política local, o repositório atômico já validado, fontes/seeds, a biblioteca de páginas e a integração do shell/rota parametrizada.

## Adoção pública do SDK

O Hero fixa os22 pacotes `@praxisui/*` em **10.0.0-rc.38**, com tarballs e integridades do npm público no lock. A publicação oficial passou por build, catálogo, selagem dos tarballs, OIDC e instalação pública no [workflow40017986340](https://github.com/codexrodrigues/praxis-ui-angular/actions/runs/40017986340). Tag: `praxis-ui-v10.0.0-rc.38`, commit `51075de81704596606bb578ab681124df5ae8493`; código integrado pelo PR644. O canal `rc` avançou; `latest` permanece9.0.67.

Reprodução do host, sem pacotes privados ou aliases de source:

```sh
npm ci --registry=https://registry.npmjs.org/
npm run build
npm start
# Em outro terminal, na mesma pasta:
node test-e2e/test-route-catalog.cjs
node test-e2e/test-corporate-context.cjs
node test-e2e/test-visitor-lab.cjs
```

O servidor oficial usa `http://127.0.0.1:4302`. Comece por `/comando-studio`, insira/edite um formulário e use a ação de cópia para abrir `/laboratorio`. Escolha nome, menu e ícone, salve e abra o link confirmado. Recarregar a rota conserva a página no mesmo navegador/persona. Também é possível começar por uma página vazia ou pelo dashboard no laboratório.

A [prova de adoção pública](evidence/sdk-rc38-2026-10-23/validation.json) registra instalação limpa com resolução normal de peers, árvore/lock, build e testes. A prova candidata anterior permanece histórica no [owner](https://github.com/codexrodrigues/praxis-ui-angular/blob/11da15c617d1673ac39308f7747f53a6f2d10fd5/projects/praxis-page-builder/docs/evidence/save-as-2026-10-23/validation.json): seus tarballs privados e workaround de instalação não certificam esta adoção pública e não são necessários para reproduzi-la.

Esta adoção integra o PR15 à branch `codex/visitor-lab-delivery`. Publicação do SDK, integração na branch do laboratório e deploy do Hero são operações distintas; este incremento não publica o Hero no Firebase.

## Responsabilidades

A ação de cópia da biblioteca emite o snapshot integral do documento corrente. O Hero acrescenta somente owner/revisão e encaminha pelo `Router.info` transitório; o destino descarta transferências de outro contexto. Isso não é cópia corporativa com proveniência. Os nomes e ícones vêm do componente; o adapter chama `VisitorWorkspaceService.save` com a `creationKey` da tentativa como ID local. O storage junta página/menu sob o Web Lock existente e devolve sua rota. O componente só confirma o link depois dessa conclusão.

Os limites locais80/60 são fornecidos como inputs de UI, sem virar regra universal da plataforma. A UI compartilhada usa o seletor de ícones nativo; famílias prefixadas não são admitidas pelo perfil de nomes Material deste primeiro incremento. As ações de biblioteca (outro menu, renomear/remover/excluir) continuam sendo da experiência Hero.

A definição mantém Form/Table, dashboard/rich-content e outros campos nativos do laboratório sem conversão para o perfil P0. Esse perfil corporativo é fechado e continua sob Config. O adapter de produção precisará das fontes admitidas, identidade, lifecycle e autorização reais; este incremento não substitui os gates P3-C/P4 HTTP/Neon.

## Validação

18 specs focais do componente, build canônico do Page Builder e suas dependências, pack oficial e build Hero aprovados. A prova no browser usa componentes empacotados e APIs interceptadas: editar formulário → copiar → escolher nome/menu/ícone → salvar → abrir rota → reload; recuperações de quota/corrupção, retry, cópia sem sobrescrita, personas A/B/A, outros menus e exclusões continuam cobertos. Viewports desktop/390px, incluindo seletor de ícone aberto em390px, foram conferidos. Nenhum resultado é apresentado como publicação corporativa.

A revisão independente identificou e acompanhou as correções de preservação do último link, rejeição do picker e bloqueio de save durante escolha de ícone. Alteração preexistente em `incidentes.config.ts` ficou fora do commit; seu hash identifica o baseline de build. Não foram repetidas campanhas Neon ou suites canônicas sem alteração. A falha histórica ampla do dashboard340/380px continua documentada e fora do escopo.

Artefatos derivados: README do owner e seu guia, esta prova, skill canônica `praxis-page-builder-authoring`. Nenhum novo manifest/registro AI, campo persistido ou contrato Config. A documentação pública do recurso está no owner e foi incluída nos pacotes publicados. Este incremento não modifica o site/playgrounds nem amplia os contratos corporativos. Status de integração de código, guidance, sincronização local e publicação de pacotes são distintos.
