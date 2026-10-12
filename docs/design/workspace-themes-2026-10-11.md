# Essência, Aurora e Órbita no Hero HQ

## Escopo e direção

Pedido: manter a estética dos três temas do Ergon Workflow Designer no host Angular, especialmente Órbita. Classificação `local-pequena`: aparência privada do host, sem alteração de contratos públicos, dependências, configurações de build, metadados ou regras de negócio. Baseline limpo `51b6769`, branch `codex/canonical-dashboard-page`, Praxis instalado `10.0.0-rc.7`, Angular/Material `21.2.14`.

Operador: equipe que consulta pessoas, missões, ativos, suprimentos e risco. Superfície: cockpit denso; preservar as páginas e sua navegação. Direção: Work Sans, fundos minerais nos temas claros e grafite azulado no escuro; ação ciano e nuances azul-violeta conforme a referência. A assinatura é a leitura consistente de indicadores, gráficos e tabelas de operação. Evitar preto quase absoluto, superfícies translúcidas que apagam a elevação e cores próprias de cada controle; usar a mesma hierarquia de superfícies e estados. Distinção 3, movimento 1, densidade 4. Não foram adicionadas animações decorativas.

## Inventário de suporte

| Fonte instalada ou existente | Resultado | Uso |
| --- | --- | --- |
| Ergon `src/styles/theme.css`, `presentation.css`, `themes.css` | Identidade base e três paletas já existentes | Cores copiadas para a folha privada `src/styles/workspace-themes.scss`; sem dependência entre os projetos. |
| Core `theming/_theming.scss` | `ja-suportado-mal-nomeado-ou-mal-materializado`: ponte já aceita mapas; default dark usa outros níveis de superfície | Configurar todos os containers, contraste do conteúdo de containers e tokens de overlay. |
| Angular Material Sass | Base de tema não carregada pelo host; ponte de tokens não substitui base Material | `mat.theme` e `mat.theme-overrides` no stylesheet existente; nenhuma configuração de workspace ou pacote alterada. |
| Table `--p-table-*` | `ja-suportado-so-ux`: defaults declarados no host da tabela | Sobrescrever os mesmos tokens na instância com especificidade adequada; não editar classes internas MDC. |
| CRUD/KPI `--praxis-surface-card`, `--praxis-text-*`, `--praxis-border-subtle`, status | `ja-suportado-mal-nomeado-ou-mal-materializado`: namespace separado, não coberto pela ponte principal | Mapeamento explícito dos tokens públicos; corrige cards brancos no escuro. |
| SettingsPanel `--md-sys-color-*` | Herda a ponte existente | Manter a cadeia de tokens; sem customizar CSS interno. |
| Charts | Observa `data-theme` e herda foreground; definições podem declarar cores de série explícitas | Troca de tema atualiza o contexto; preservar paletas semânticas declaradas nos documentos. |
| AppShell | `suportado-parcialmente`: cores herdam `--card`, mas header/sidebar não têm token próprio de gradiente na versão instalada | Preservar shell oficial; registrar limite abaixo, sem selector privado ou novo contrato local. |

## Implementação

- Catálogo de aparência: Essência (`classic`), Aurora (`light-tech`), Órbita (`dark-tech`). IDs correspondem à referência.
- Menu Material na ação projetada oficial do shell, com opções `menuitemradio`, estado escolhido e amostras. Substitui o toggle binário.
- Preferência privada `praxis_hero_hq_theme`; os valores anteriores `light`/`dark` são normalizados uma vez ao escolher. Sem preferência válida, o host mantém seu default escuro, agora Órbita. O Workflow Designer usa Essência por default; a identidade das paletas é a mesma.
- Bootstrap aplica o tema antes do primeiro paint, inclusive no splash. Storage bloqueado não impede o uso; eventos sincronizam abas e o listener é removido na destruição do serviço. Não há vínculo com persona, layout remoto ou persistência de negócio.
- Work Sans e JetBrains Mono; URLs de Material Icons/Symbols preservadas. Splash simplificado e temático, sem antigo fundo fixo escuro.
- Superfícies opacas, tokens de foco/seleção/erro, tabela e filtros. Banner do host usa o gradiente tonal do Órbita. Os componentes canônicos continuam responsáveis por geometria e comportamento.

## Evidências e validação

`npm run build` aprovado após o último ajuste. Continua o warning de bundle inicial de aproximadamente 14,01 MB, ligeiramente acima de 14 MB; não foi ampliado o budget nem ocultado o warning.

`node scripts/workspace/verify-workspace-themes.mjs` aprovado: três opções, nove casos de normalização/bootstrap, storage bloqueado, links de fontes/ícones e nove pares de contraste. Medição OKLCH convertida a luminância sRGB para foreground/background, muted/card e texto da ação/primary. Mínimos por tema: Essência 5,17:1, Aurora 6,24:1, Órbita 7,23:1. Isso não certifica todas as combinações, gradientes ou customizações arbitrárias.

Chrome/CUA na origem oficial `http://127.0.0.1:4302`: dashboard nos três temas; escolha e persistência após reload; Escape retorna ao botão; menu em desktop, 760×900 e 390×844. Menu mobile ficou entre x≈27 e x280, dentro de 390 px. Tabela de RH e filtro avançado em Órbita, incluindo viewport 760×900. Valores computados: fundo `.215/.019/250`, card `.255/.022/250`, foreground `.945/.009/235`, inclusive cards KPI.

Capturas em [evidence/workspace-themes-2026-10-11/](evidence/workspace-themes-2026-10-11/): `essencia.png`, `aurora.png`, `orbita.png`, menus desktop/estreito/mobile, tabela e filtros desktop/estreito. As últimas capturas substituem estados intermediários de carregamento. Navegação de leitura e abertura/cancelamento de filtros não comprovam regras, gravação ou banco; nenhuma mutação de negócio realizada, nem ensaio dependente de banco. Não foi invocado fallback de PostgreSQL local.

Revisor independente `theme_review` inspecionou o diff e executou o verificador focal. Encontrou e foram corrigidos: contraste incoerente no splash claro, font link de símbolos substituído, precedência de tokens dark do shell e token de texto inválido da tabela. Aceite estático final sem bloqueadores nos arquivos de tema. Capturas foram coletadas e revisadas pelo coordenador.

## Limites e próximos passos

O Core instalado usa `--card` no topbar/sidebar e uma parada violeta fixa no ícone de marca. Não oferece token específico para transportar exatamente o gradiente do Workflow Designer nesses elementos. Lacuna de apresentação parcial com dono Core: avaliar tokens de superfície/brand no proprietário canônico, com prova em consumidores, antes de publicar nova API. Não foi criado override de classes internas no host. Os gráficos mantêm cores explícitas de série presentes nas definições; não foram reinterpretados estados de negócio.

SettingsPanel foi investigado estaticamente, mas não foi capturado aberto nesta rodada; não se alega cobertura completa dos editores. Não houve teste funcional integral, validação de persistência remota, deploy ou envio ao GitHub. Servidor de desenvolvimento iniciado por esta tarefa na porta 4302 foi mantido para avaliação visual do resultado.

Durante o trabalho houve edição concorrente do trecho de release no README por outra sessão. Foi preservada e não integra o aceite dos temas: fonte/instalação usadas aqui continuam rc.7. Separar essa publicação das alterações de aparência ao integrar.

Skills `praxis-angular-host-project` e `praxis-ui-product-design`: `existente-adequada`, comparadas com os arquivos canônicos em `praxis-codex-skills/codex-skills/`; orientam base Material, ponte e namespaces dos componentes. Nenhum guidance novo ou contrato público foi criado. Não há artefato público derivado a sincronizar; este relatório documenta a adoção privada do host.

## Revisão criteriosa de fidelidade — 11/10/2026

Escopo `local-pequena`, sobre a implementação local anterior, com revisão independente. A revisão comparou a cascata completa de `src/styles.css` e `src/themes.css` da referência; a primeira extração tinha omitido o override de input e o verde de sucesso da identidade base. Nenhum contrato público ou fonte de negócio alterado.

### Divergências encontradas e corrigidas

- **Essência:** input corrigido para `oklch(.88 .008 260)` e sucesso para `oklch(.49 .08 150)`.
- **Temas claros:** overlay usa a opacidade de 30% da referência, em vez do scrim escuro de 70%. Busca rápida agora consome esse token.
- **Órbita:** contador de notificações e ações de reset usam `destructive-foreground`. Branco sobre o vermelho claro apresentava aproximadamente 2,36:1; o par correto mede 7,74:1. O indicador de prontidão deixa o fallback emerald e acompanha o sucesso de cada tema.
- **Dashboard:** CSS local não escurece mais toolbar/toggle com card 60%/80% e blur. O botão principal usa o `command-gradient` authored na referência, incluindo os endpoints corretos do Órbita.
- **Micrográficos:** removidas cores hex fixas de barras, usando cores semânticas; info radial corresponde ao mesmo sky dos outros renderizadores. Tokens de estado do Table foram alinhados no host.
- **Material/Praxis:** mapas de primary-container, secondary, tertiary, erro, outline e inverse foram alinhados. A mesma intenção de cor não recebe duas paletas conforme a família do componente.
- **Sombras projetadas do shell:** persona e busca usam a elevação da paleta, em vez de sombras pretas fixas.

### Provas da revisão

```sh
node scripts/workspace/verify-workspace-themes.mjs --reference /caminho/ergon-workflow-designer
npm run build
```

O argumento `--reference` é opcional e aponta ao checkout usado na comparação; não cria dependência runtime entre projetos. O helper usa o PostCSS disponível na toolchain Angular para ler declarações na ordem e escopo root/theme. **104 declarações coincidem**; a prova cobre as declarações comparadas, não certifica pixels de toda a aplicação.

**12 pares de contraste aprovados**, agora incluindo o texto sobre destructive. O menor é 4,55:1 nos temas claros; no Órbita, o menor dos pares auditados é 7,23:1. A contagem anterior de nove pares e mínimo global 5,17:1 continua sendo evidência da primeira rodada, não da matriz ampliada.

Chrome/CUA conferiu **oito papéis de cor em cada um dos três temas**: os valores computados Material e Praxis coincidem. Texto de notificações e prontidão acompanha a paleta; resultado em `role-comparison-revised.json`. Novas capturas `essencia-revised.png`, `aurora-revised.png`, `orbita-revised.png`. SettingsPanel agora foi aberto em Órbita e capturado em desktop e 760×900 (`orbita-settings-revised.png`, `orbita-settings-narrow-revised.png`); cancelar/concluir edição sem aplicar ou salvar. Isso complementa a investigação estática da primeira rodada. Viewport restaurado.

Build final aprovado, mantendo o warning de bundle inicial ≈14,01 MB. Não repetida bateria funcional de backend/persistência: alterações restritas a apresentação, sem ensaio de banco ou gravação de negócio. `theme_review` revisou as correções e executou independentemente o verificador com referência; aceite dos oito achados do host sem novos bloqueadores.

### Fidelidade e limites restantes

Os tokens compartilhados e seus usos corrigidos acompanham a referência. Não se declara equivalência visual total: shell instalado ainda fixa detalhes de marca/header; gráficos têm cores de séries/palettes explícitas em `dashboard-page.definition.json` e `reputacao.config.ts`. O renderer atual reage ao foreground do tema, mas não resolve `var()` de CSS nas cores do Canvas. Não foram substituídas as séries nem criado adapter de persistência paralelo. Uma evolução do theming de gráficos deve ser feita no proprietário canônico, com prova de troca de tema e preservação de cores explicitamente authoradas.

Esses limites são `suportado-parcialmente`, com donos Core/Charts; não representam falha de carregamento das três paletas. Ajustes e evidências permanecem locais, sem publicação/deploy. Skills continuam `existente-adequada`: a correção utiliza as superfícies de tokens existentes, sem nova API ou procedimento canônico a publicar. Nenhum artefato público derivado a atualizar.


## Correção canônica Core/Charts — 11/10/2026

Classificação `transversal`: runtime oficial de Core/Charts, definições privadas do
Hero HQ e documentação derivada. Não foram adicionados inputs, exports, campos
persistidos ou contratos AI. Inventário: papéis de shell `ja-suportado-so-ux`;
strings CSS de cores `ja-suportado-mal-nomeado-ou-mal-materializado`; resolução
Canvas e atualização por atributos `suportado-parcialmente`, corrigidos no adapter.

O Core agora materializa `sidebar`, pares de foreground/accent, `surface-gradient`,
`command-gradient`, overlay e focus do host. Marca e iniciais usam o foreground
correto; badges usam superfícies tintadas e pares coerentes. A métrica do status
herda o foreground do cartão, inclusive em sidebar escura com accent claro.

Charts resolve apenas os campos canônicos de cor no host real. `var()`, fallback
aninhado, OKLCH e color-mix são projetados para sRGB antes de construir opções
ECharts. Literais válidos continuam explícitos; linhas de dados e documento
persistido não são percorridos/modificados. Entradas inválidas/cíclicas usam
fallback limitado, sem reutilizar a cor anterior. Troca de atributos do tema
reagenda o render; o editor preserva vírgulas dentro de funções CSS.

Os exemplos deste host usam os tokens semânticos existentes nas séries/paletas;
foram adicionados orange/amber da referência. O verificador agora confirma **110
declarações idênticas**, nove casos de bootstrap/preferência e 12 pares de contraste.
A semântica dos dados, a ordem das categorias e as regras de severidade não foram
alteradas: uma paleta sequencial não é contrato de associação categoria-cor.

Validação com tarballs locais produzidos de `praxis-ui-theme-fidelity` (baseline
`69e097e8a`, Core/Charts rc.8). A instalação temporária incluiu o conjunto construído
de dependências para preservar o contrato Page Builder usado pelo host; os
manifestos/lockfiles do host não foram alterados. Build aprovado, warning existente
14,02 MB versus budget 14 MB. Esses tarballs contêm código ainda não publicado;
`npm ci` público não reproduz este incremento até sua release/adopção oficial.

Chrome/CUA conferiu os gráficos de linha, barras, rosca e velocímetro nos três temas,
e shell/navegação em 760×900. Capturas `library-dark-desktop.png`,
`library-dark-charts.png`, `library-classic-charts.png`, `library-aurora-charts.png`
e `library-dark-narrow-navigation.png`, em `evidence/workspace-themes-2026-10-11/`.
Viewport restaurado; sem salvar layout ou editar dados de negócio. Servidor de
preview permanece em `127.0.0.1:4302` para inspeção do usuário.

Gate Core final **17/17**, incluindo contraste >=4,5:1 nos badges e sidebar mista.
Gate Charts focal **187 aprovados**, seguido da suíte final do resolver **9/9**
após correções de CSSOM e cores de sistema. Builds canônicos Core/Charts e cadeia
focal de dependências aprovados. Revisor independente `theme_review` aceitou o
código; o coordenador revisou a implementação Charts do autor `charts_theme`.

Registro gerado validado: catálogo PASS, authoring 20/20, teste unitário do snapshot
10/10 sem banco. A sincronização não alterou conteúdo semântico do registro;
churn apenas de timestamp foi removido. README Core derivado sincronizado pelo
script oficial da landing em worktree isolada; outros drifts preexistentes não
foram incorporados. Skill classificada `atualizar-existente`: guidance de resolução
Canvas e adoção de host atualizados na fonte canônica limpa, manifesto/auditorias
validados. Integração GitHub e sincronização das skills instaladas permanecem
pendentes; não há nova release npm, deploy ou merge nesta rodada.

Último refinamento: tooltips ECharts agora materializam popover/foreground/border do
host no mesmo resolver, mantendo formatter/trigger/disabled e base/media. Gate final
helper+adapter+builder59/59, build Charts aprovado; a primeira captura com tooltip
branco registrava a divergência corrigida, não o aceite final.

Validação final do tooltip no Chrome: Órbita bg rgb(34,44,55), texto rgb(231,238,242),
borda rgb(58,69,81); Essência bg branco/texto rgb(2,6,24); Aurora bg branco/texto
rgb(26,43,57). Capturas `library-dark-final.png`, `library-classic-tooltip-final.png`
e `library-aurora-tooltip-final.png`. Build consumidor final aprovado com tarball
Charts atualizado (`/tmp/hero-theme-library-consumer-build-tooltip.log`).
A sessão observou um layout personalizado salvo por interação externa; não o
restaurou nem sobrescreveu. Preview final em Órbita, modo leitura, origem4302.


## Fechamento das quatro pendências — 12/10/2026

As pendências foram corrigidas nos donos canônicos Core/Charts, com atualização do
README deste host, do guia público Charts e das skills. Não foram alterados os
manifestos nem configurações de build. O README agora distingue as dependências
rc.7 fixadas dos tarballs locais rc.8 modificados e da futura release oficial.

A sonda de cores está protegida contra CSS externo com `!important`. A validação
canônica rejeita itens não textuais ou vazios da paleta com erro por índice; o
renderer tem defesa adicional para configuração direta não tipada. Os repros
confirmam cores corretas, limpeza da sonda e preservação de documento/dados.
O fallback da marca mede 5,93:1 e 7,56:1, mantendo a precedência das cores do host.

Documentação pública Charts foi verificada: guide e página docs são materializações
editoriais locais, não leitura automática do README. O guia foi atualizado, e essa
imprecisão no relatório Angular foi corrigida. Skills ensinam os casos novos e
foram validadas na fonte canônica; integração e sincronização instalada são etapas
posteriores.

| Validação atual | Resultado |
| --- | --- |
| Core focal e build | 18/18 e production aprovados |
| Charts focal e build | 131/131 e production aprovados |
| Hero com os novos tarballs | Build aprovado; warning existente de 14,02 MB versus budget de 14 MB |
| Referência Workflow Designer | 110 declarações idênticas e 12 pares de contraste aprovados |
| Registro/authoring | Catálogo PASS e 20/20 contratos |
| Documentação e skills | 145 guias, sitemap, hashes, estrutura e preflight aprovados |

Chrome/CUA conferiu Essência, Aurora e Órbita no mesmo layout salvo, com quatro
Canvas e tooltips coerentes. Pares medidos: Essência branco/rgb(2,6,24), Aurora
branco/rgb(26,43,57), Órbita rgb(34,44,55)/rgb(231,238,242). Em 760×900, a sidebar
Dark ficou inteiramente visível e sem overflow; Escape devolveu foco à Aparência.
Viewport e preferência inicial Essência foram restaurados; não houve gravação de
layout ou de negócio durante a prova.

Capturas em `evidence/workspace-themes-2026-10-11/`:

- `four-fixes-classic-2026-10-12.png`
- `four-fixes-aurora-2026-10-12.png`
- `four-fixes-dark-2026-10-12.png`
- `four-fixes-dark-narrow-2026-10-12.png`

Revisão independente aprovou código, repros, documentação e guidance sem novo
bloqueador. Publicação, integração GitHub, sincronização das skills instaladas e
adoção reproduzível do consumidor continuam pendentes. O preview permanece na
origem oficial `http://127.0.0.1:4302/` para inspeção.
