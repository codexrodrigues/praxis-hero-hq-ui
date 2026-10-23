# Jornada reutilizável — prova Hero

O fluxo do laboratório passou a consumir `PraxisPageCopyActionComponent` e `PraxisPageSaveAsComponent` de `@praxisui/page-builder`. O Hero deixou de implementar os controles e a coordenação de save/retry/resultado. Mantém um adapter de poucas linhas, a política local, o repositório atômico já validado, fontes/seeds, a biblioteca de páginas e a integração do shell/rota parametrizada.

## Limite da adoção

Esta branch é **dependente da publicação/adoção do SDK**. Os manifests públicos deste host ainda fixam rc.37, sem os novos exports. Portanto este PR é draft e não deve ser integrado à branch do laboratório/main com esse lock. A prova local consome os tarballs candidatos oficiais, identificados por hash na evidência; não prova que `npm ci` com o lock público já oferece a API. Nenhum pacote foi publicado e nenhum deploy foi solicitado.

Reprodução do candidato após build/pack no checkout canônico Angular:

```sh
node scripts/build-libs.js --only praxis-page-builder
node scripts/pack-dist-libs.js --only praxis-core,praxis-page-builder
```

No Hero, instalar os dois arquivos `dist/__local-packs__/praxis-core.tgz` e `praxis-page-builder.tgz` do checkout usado na prova por `npm install --no-save --package-lock=false`, sem aliases de source ou alteração do build. npm10.9.7 falhou na resolução de peers com `edgesOut` nulo; a recuperação desta prova usou `--legacy-peer-deps` com o peer `@google/generative-ai@0.24.1` explícito (versão do lock). Todos os221 peer constraints instalados foram auditados separadamente, sem conflito. Esse workaround é de instalação local, não compatibilidade/flag do produto e não muda o lock público.

Reiniciar pelo `npm start` oficial na porta4302; ao reutilizar candidatos com a mesma versão privada de origem, limpar o cache Angular do host antes do restart evita provar bytes otimizados antigos. A comparação byte a byte dos arquivos instalados contra os tarballs está na evidência.

## Responsabilidades

A ação de cópia da biblioteca emite o snapshot integral do documento corrente. O Hero acrescenta somente owner/revisão e encaminha pelo `Router.info` transitório; o destino descarta transferências de outro contexto. Isso não é cópia corporativa com proveniência. Os nomes e ícones vêm do componente; o adapter chama `VisitorWorkspaceService.save` com a `creationKey` da tentativa como ID local. O storage junta página/menu sob o Web Lock existente e devolve sua rota. O componente só confirma o link depois dessa conclusão.

Os limites locais80/60 são fornecidos como inputs de UI, sem virar regra universal da plataforma. A UI compartilhada usa o seletor de ícones nativo; famílias prefixadas não são admitidas pelo perfil de nomes Material deste primeiro incremento. As ações de biblioteca (outro menu, renomear/remover/excluir) continuam sendo da experiência Hero.

A definição mantém Form/Table, dashboard/rich-content e outros campos nativos do laboratório sem conversão para o perfil P0. Esse perfil corporativo é fechado e continua sob Config. O adapter de produção precisará das fontes admitidas, identidade, lifecycle e autorização reais; este incremento não substitui os gates P3-C/P4 HTTP/Neon.

## Validação

18 specs focais do componente, build canônico do Page Builder e suas dependências, pack oficial e build Hero aprovados. A prova no browser usa componentes empacotados e APIs interceptadas: editar formulário → copiar → escolher nome/menu/ícone → salvar → abrir rota → reload; recuperações de quota/corrupção, retry, cópia sem sobrescrita, personas A/B/A, outros menus e exclusões continuam cobertos. Viewports desktop/390px, incluindo seletor de ícone aberto em390px, foram conferidos. Nenhum resultado é apresentado como publicação corporativa.

A revisão independente identificou e acompanhou as correções de preservação do último link, rejeição do picker e bloqueio de save durante escolha de ícone. Alteração preexistente em `incidentes.config.ts` ficou fora do commit; seu hash identifica o baseline de build. Não foram repetidas campanhas Neon ou suites canônicas sem alteração. A falha histórica ampla do dashboard340/380px continua documentada e fora do escopo.

Artefatos derivados: README do owner e seu guia, esta prova, skill canônica `praxis-page-builder-authoring`. Nenhum novo manifest/registro AI, campo persistido ou contrato Config. A documentação pública está no owner; não se anuncia disponibilidade npm no site/playgrounds antes da adoção pública. Status de integração de código, guidance, sincronização local e publicação de pacotes são distintos.
