# Laboratório do visitante

## Uso

Em `/comando-studio` ou `/workspace-studio`, **Salvar cópia em nova rota** leva o documento atual, incluindo alterações ainda não salvas, para o laboratório. A transferência é transitória e vinculada à persona/revisão atual; confirme o salvamento no laboratório antes de recarregar. A barra de autoria fica disponível nos Studios.

Abra **Meu laboratório** (`/laboratorio`), insira componentes pelo Page Builder e configure-os pelo editor de conteúdo oficial de cada componente. Para formulários, use **Praxis Dynamic Form → Configurar conteúdo**. O formulário continua usando os contratos e os editores da biblioteca; o host não implementa um segundo editor de formulário.

Informe o nome da página e um nome de menu. **Salvar como nova página** grava a composição e a entrada de menu juntas e oferece uma rota `/laboratorio/paginas/<uuid>`. Essa rota pode ser aberta diretamente e recarregada no mesmo navegador, origem e persona. O menu aparece na navegação e na busca do shell.

Escolha também **Ícone no menu**. A entrada conserva o símbolo Material selecionado após recarga. Itens locais anteriores sem ícone continuam usando o símbolo de página. Os presets seguem o formato de nomes simples aceito pelo shell instalado; não são URLs, SVG ou um catálogo de componentes paralelo.

Ao reabrir, o campo de menu usa o primeiro grupo que contém a página. A biblioteca permite abrir uma cópia, adicionar uma página existente a outro menu, renomear/remover menus e excluir páginas. Remover um menu preserva suas páginas; excluir uma página remove suas referências em todos os menus. Abrir uma página salva inicia uma cópia: salvar uma edição cria uma nova rota e preserva o documento original. Uma repetição sem alterações reutiliza o identificador da tentativa para evitar duplicação.

## Escopo e limites

- Sem login. Documentos, menus e preferências dos componentes deste editor ficam no `localStorage`, separados por tenant/persona simulada e, nas preferências, por rota.
- A persona é uma organização da demonstração, sem isolamento de segurança: qualquer pessoa com acesso ao mesmo perfil de navegador pode ler seus dados locais ou alternar a persona. Não inserir dados confidenciais.
- O link não publica um recurso no servidor nem compartilha a página com outro navegador/dispositivo. Limpar os dados do site ou usar outra origem/perfil perde o acesso à cópia. O rascunho ainda não salvo não sobrevive à recarga.
- **Dados, ações e envio dos widgets continuam usando as APIs de demonstração.** A persistência local da composição não transforma a aplicação inteira em um ambiente desconectado.
- O laboratório ativa a autoria agentic de página em modo de aplicação local (`agenticAuthoringLocalApplyOnly=true`), sem acionar `page-apply` remoto nem o ciclo remoto de páginas (`/praxis/config/ui/**`). Seus componentes continuam sujeitos às capacidades nativas dos respectivos runtimes.
- Limites do envelope por persona: 30 páginas, 20 menus e 2 MiB estimados em UTF-16. A quota efetiva do navegador pode ser menor. Exige contexto seguro e Web Locks (HTTPS ou localhost em navegador compatível); não há fallback concorrente inseguro.
- As definições usam a versão de `@praxisui/*` fixada no lockfile. Não há migração automática entre versões incompatíveis. Documento ilegível é preservado e sua carga falha explicitamente, sem sobrescrita silenciosa.

Para uso corporativo compartilhado, ainda seriam necessários identidade autenticada, autorização no backend, armazenamento governado, versionamento/migração, auditoria e políticas de aprovação/publicação. As personas simuladas e o armazenamento do navegador não comprovam essas propriedades.

## Plano, inventário e impacto

Classificação: `transversal` na cadeia de consumo deste host (autoria, persistência privada, rotas, navegação e busca), sem alteração de contrato público das bibliotecas.

| Necessidade | Aderência e fonte existente | Materialização neste host |
| --- | --- | --- |
| Criar e configurar componentes/formulários | `ja-suportado-so-ux`: Page Builder, `ComponentMetadataRegistry`, editores de conteúdo | Nova superfície do laboratório |
| Guardar uma composição | `ja-suportado-mal-nomeado-ou-mal-materializado`: `WidgetPageDefinition` e `pageSaveRequested` | Salvar explícito pelo lifecycle do builder, sem publicar `pageChange` incidental |
| Diagnósticos da composição | `ja-suportado-so-ux`: `WidgetPageCompositionFactory` e `CompositionValidatorService` | Materialização dos links antes da validação, com guardas de estrutura na fronteira de leitura |
| Preferências locais | `ja-suportado-so-ux`: tokens de storage e adapters Core | Providers do editor com namespace e proteção de contexto; facades de filtros, layouts, conexões e painéis resolvidas localmente |
| Catálogo de rotas e menus do visitante | `suportado-parcialmente`: Router, catálogo estático e shell existentes | Envelope privado do produto; URL derivada do ID, sem URLs arbitrárias ou novo endpoint público |

Fonte canônica do documento/runtime: `@praxisui/core` e `@praxisui/page-builder`; fonte dos campos e authoring de formulário: `@praxisui/dynamic-form`; fonte dos menus/rotas e da decisão de armazenamento local: este host. Nenhum novo contrato público de plataforma foi necessário. Os endpoints, headers/ETag e o storage remoto das demais páginas não foram alterados.

Páginas e menus são gravados em um único `setItem` após reler o estado mais recente sob Web Lock por namespace. Falhas de quota/leitura/lock não produzem menu sem documento. A revisão de persona é monotônica: callbacks antigos são rejeitados mesmo após A → B → A; o editor é recriado por rota/revisão e seu adapter é invalidado na destruição. Eventos `storage` atualizam a biblioteca de outras abas. A validação de página combina a estrutura necessária ao runtime com os diagnósticos canônicos; não substitui validação de negócio dos componentes/APIs.

Consumidores afetados: apenas este host. README, catálogo/teste de rotas e esta documentação foram atualizados. Sem alteração de `public-api`, registries/manifests de componentes, corpus HTTP, docs públicas canônicas ou receitas de bibliotecas; não há artefatos derivados dessas superfícies a sincronizar. Risco de breaking change público: nenhum; novo armazenamento privado com versão explícita.

## Validação focal

Com as dependências instaladas:

```sh
node test-e2e/test-visitor-workspace-repository.cjs
node test-e2e/test-visitor-local-storage.cjs
node test-e2e/test-visitor-context.cjs
node test-e2e/test-visitor-page-validation.cjs
node test-e2e/test-route-catalog.cjs
npm run build
```

Com `npm start` na origem oficial `http://127.0.0.1:4302` e Playwright disponível como nos demais ensaios deste repositório:

```sh
node test-e2e/test-visitor-lab.cjs
```

Os testes de repositório executam o código real sem Angular; o teste de storage executa a classe real com DI isolada. O teste de contexto retém a execução do lock e confirma a rejeição de um save após A/B/A; isola signals/effects e não substitui o teste de scheduling Angular no navegador. O ensaio de navegador cobre o editor canônico de formulário (aba JSON → aplicar → salvar e fechar), campo renderizado após recarga, preferências pelo painel direto do formulário, falha de quota preservando o link anterior, recuperação de documento corrompido, personas A/B/A, cópia sem sobrescrever o original, segundo menu sem duplicar a página, renomeação/remoção e exclusão com referências consistentes, em desktop e viewport de 390 px. Ele utiliza os componentes publicados e intercepta `/api/**`. Ele prova o armazenamento do navegador e o round-trip visual, sem acessar backend/banco. Nenhuma prova Neon é necessária para este incremento sem banco; nenhum resultado local é apresentado como autorização corporativa ou persistência remota.

## Revisão e skills

Houve revisão por autor diferente, incluindo leitura de payload malformado, referências órfãs, atomicidade, concorrência entre abas, recuperação de falha, quota e troca de persona. As guardas de estrutura não inventam um segundo schema de componentes: seguem os envelopes públicos e deixam os inputs de cada componente sob seu dono canônico.

Impacto nas skills: `existente-adequada`. Fontes inspecionadas no repositório canônico `praxis-codex-skills`: `codex-skills/praxis-angular-host-project/SKILL.md` (decisão deliberada de persistência local/remota e responsabilidades do host), `praxis-page-builder-authoring/SKILL.md` (round-trip, documento canônico e editores filhos) e `praxis-form-authoring-settings/SKILL.md` (aplicar/salvar/reabrir pelo editor oficial). O fluxo consome essas superfícies sem mudar o procedimento canônico; não foi necessário alterar ou sincronizar skills.

### Resultado deste incremento (22/10/2026)

Build de produção aprovado, com aviso de bundle inicial acima do orçamento de alerta de 15 MB (16,44 MB; limite de erro não excedido). Testes focais aprovados: 11 de repositório, 4 de storage local, 10 de fronteira de documento e 1 de contexto, além do catálogo de rotas e do ensaio no navegador. A bateria `npm test` continua vermelha por uma divergência preexistente do dashboard: contrato exige 340px, mas `distressSignalsList` declara 380px (57/58 asserções passam). O teste isolado `test-dashboard-navigation.cjs` falha pela mesma altura. Os arquivos do dashboard e desses testes estão idênticos ao HEAD de origem; essa falha não foi ocultada nem corrigida fora do escopo. O typecheck de specs foi aprovado.

Os [logs, screenshots e hashes da evidência focal](evidence/visitor-lab-2026-10-22/validation.json) identificam a árvore e as dependências conferidas. Não houve push, deploy, release, alteração de dependências ou configuração global de build.

### Entrega incremental (23/10/2026)

Studio → documento editado → cópia no laboratório → menu/ícone → nova rota → recarga passou no navegador, incluindo controles de quota, corrupção, personas A/B/A, cópia sem sobrescrita e viewport de 390 px. O teste intercepta APIs e comprova o sandbox local; não é prova HTTP corporativa do Config P3-B. Passaram também 12 testes do repositório, 4 de storage, 1 de contexto, 10 de fronteira e o catálogo de rotas. Build de produção aprovado em 6,29 s; aviso de bundle inicial de 16,44 MB para orçamento de alerta de 15 MB. A revisão independente final não encontrou bloqueadores; o wiring do Workspace Studio foi revisado no código, enquanto o navegador exercitou diretamente o Comando Studio. Os recibos e screenshots deste incremento estão em [evidence/visitor-lab-2026-10-23](evidence/visitor-lab-2026-10-23/validation.json). Nenhuma dependência ou contrato público foi alterado.

### Fechamento de P5-A (`#9`) — migração sob lock e renomeação de página preservando rota (25/10/2026)

- **`migrate(owner)` sob Web Lock exclusivo**: migra o envelope de armazenamento local de forma atômica, preenchendo o ícone `'web'` como padrão canônico quando itens legados de menu não possuem ícone e preservando os bytes brutos originais em caso de corrupção ou falha de quota.
- **`renamePage(owner, pageId, name)`**: permite renomear uma página salva e atualizar rótulos correspondentes nos menus locais sem alterar `page.id`, a URL `/laboratorio/paginas/<uuid>`, `page.definition` ou `page.createdAt`.
- **Testes focais**: `node test-e2e/test-visitor-workspace-repository.cjs` ampliado para **13/13 checks** aprovados, além de `test-visitor-local-storage.cjs` (4/4), `test-visitor-context.cjs` (1/1) e `test-visitor-page-validation.cjs` (10/10).
