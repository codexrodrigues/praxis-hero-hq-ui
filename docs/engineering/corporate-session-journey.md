# Jornada corporativa — sessão e contexto no Hero

## Plano do primeiro incremento — 24/10/2026

Pré-requisito integrado: Quickstart PR #463, merge
`48c28c0c8f0b25f7c85fdf51cf69b49e69bc40b2`, com aceite técnico documentado e
limitação de disponibilidade preservada. Não repetir o ensaio Neon neste ciclo.

Classificação: transversal de adoção, sem novo contrato público. Quickstart é dono
de login, SESSION, CSRF e grants; Core rc.38 já fornece contexto/choices/CAS. Hero
é dono do transporte e da experiência de entrada. Aderência: suporte existente mal
materializado na entrada; adoção corporativa suportada parcialmente. O laboratório
local já cria/copia/salva páginas, menu, ícone e rota com os componentes públicos.
Não substituir esse fluxo nem apresentar dados locais como publicação corporativa.

Incremento funcional: entrar → confirmar SESSION pelo servidor → listar/escolher
contexto → recarregar e recuperar SESSION → sair. Reusar seletor e CAS do Core.
Credenciais e token CSRF raw somente em memória; nenhum bearer/persona autoriza
runtime, páginas ou lifecycle corporativos. Falha de contexto não equivale a logout;
respostas antigas não podem restaurar uma sessão ou seleção após sair.

Mapa de impacto: serviço/interceptor de sessão do host, configuração HTTP, tela
`/workspace-corporativo`, proxy oficial4302 e testes focais. Sem alteração de SDK,
Config, metadata, payloads canônicos, landing ou corpus HTTP. CSS apenas no escopo
da tela, usando Material/tokens existentes. Não editar incidentes.config.ts,
previamente modificado pelo usuário. Nenhuma release ou implantação Hero autorizada.

Plano: implementar seam de sessão/CSRF e escopo exato de transporte; materializar
entrada/saída/recuperação na tela existente; testar transparência dos headers,
401/403/409/503, logout incerto, concorrência de respostas, escopo de origem/path e
recarregamento; revisar independentemente e mostrar em4302. Proxy deve encaminhar
/auth e preservar origem oficial/TLS/cookies, sem simular concessões ou falsificar
uma origem permitida. O backend precisa permitir a origem real configurada.

Aceite de UI: entrar e selecionar contexto com respostas controladas pelo contrato,
recarregar, sair, impedir callback antigo, mensagens seguras e controles acessíveis
em desktop/390px. Distinguir teste de consumidor interceptado de prova integrada de
SESSION/cookies/CORS/backend real. Não usar credenciais padrão nem mutar backend
remoto para fazer a demonstração passar. Sem backend composto disponível, registrar
a limitação; não criar fallback de sessão, grupos, catálogo ou publicação.

O próximo corte depois desta entrada será a adoção da criação e do workflow
editorial canônico. POST/pages admite origem exata e não recebe simplesmente o
JSON arbitrário do SaveAs: menu e publicação não devem ser simulados pelo host.

Recursos: root exclusivo para npm/servidor4302/E2E; autor dos arquivos do host
p3c_page_providers, revisor p3c_security_review, sem banco e sem delegação recursiva.
Branch codex/corporate-session-journey parte de7d6c82b8, árvore equivalente à do
PR15 integrado na branch de laboratório. Alteração alheia incidentes.config.ts
preservada, SHA2561c54953040fb0c72d00cbe517499aa804bbed0404ac28c1c1542b200ec17e506.
Skills: angular-host-project e security-config existentes; reavaliar guidance
após o comportamento final, sem introduzir contrato de auth genérico no SDK.

## Ajuste de transporte identificado na revisão

Angular21.2.14 instalado usa XHR por padrão; nele a opção redirect:error não impede
um redirecionamento307. Para evitar envio de senha ou CSRF a outro destino, o host
terá um HttpBackend privado: somente rotas corporativas exatas usam FetchBackend
com redirect:error; demais requests continuam no HttpXhrBackend existente, mantendo
upload/progress do legado. A cadeia de interceptors é preservada. Não há novo
contrato SDK ou mudança global para Fetch. Acrescentar teste de dispatch e
redirecionamento no navegador que confirme ausência de request ao destino.

## Impacto no guidance da plataforma

Classificação de skills: atualizar-existente em praxis-angular-host-project. O
gateway já atribui identidade/transporte ao host e remete à segurança Quickstart,
mas não ensina bootstrap raw-CSRF, isolamento entre persona/SESSION, serialização
de auth e a verificação do backend efetivo para bloquear redirects com credenciais.
Atualizar a fonte canônica, manifesto e validar/revisar antes de integrar; não criar
cliente auth genérico no SDK nem editar o espelho instalado como fonte primária.
O guidance não deve apresentar testes interceptados como prova de cookies/CORS reais.


## Resultado e limites do incremento

Implementados e revisados os seams descritos. A evidência focal está em
[evidence/corporate-session-2026-10-24/validation.json](evidence/corporate-session-2026-10-24/validation.json),
com logs e capturas desktop/390px. Todos os testes de consumidor passaram; não houve
novo ensaio Neon. O fluxo local existente de criar/copiar/salvar/menu/rota/recarga
passou na regressão. Publicação corporativa ainda é o próximo corte de UI.

O Render respondeu403 Invalid CORS request ao GET anônimo de /auth/session com
Origin real4302. A configuração oficial de origens no backend e a sessão real
precisam ser compostas antes da operação corporativa; respostas interceptadas não
provam cookies/CORS. Nenhum segredo foi usado ou persistido. Nenhum deploy foi feito.
O build passou com aviso16,60MB, sem alterar budgets. O servidor oficial4302 fica
ativo para validação visual; a página não concede sessão artificial para demonstração.


## Próximo incremento autorizado — CORS e workflow corporativo

Classificação transversal de adoção, sem alteração de contrato público neste corte.
Inventário: Quickstart já tem propriedades aditivas CORS/origin; Core rc.38 oferece
lifecycle completo e contexto/navegação; Config tem pages create/by-key/catalog/published.
Hero ainda não materializa essas operações. Aderência: já suportado só UX para
lifecycle; parcialmente suportado para cliente pages e ativação operacional. Não usar
SaveAs como sucesso de publicação antecipado. Fonte piloto admite apenas Form vazio,
título e ícone home; edição arbitrária e submissão de domínio não estão admitidas.

Plano: serviço privado de consumo HTTP pages e UI de criar/reler/salvar/enviar/revisar/
publicar; providers corporativos compartilhados por entrada/editor/reader; GET publicado
para rota persistente. Teste de consumidor controlado, conflitos/negações/recarga e
revisão independente. Não repetir Neon. Cópia após reload depende da referência exata
de revisão da fonte; published/catalog/head/review atuais não a projetam. Inventariar
fonte existente antes de propor evolução canônica. Grupos/menu exigem ciclo editorial
próprio e navegação autorizada; não simular esses resultados com storage de visitante.

Impacto: Hero core/rotas/contexto/UI/teste/docs. Sem novo SDK/pacote/lock neste corte.
Quickstart guarda ajuste de duas listas de origem, preservando CSRF/TLS/cookies e
origens anteriores. Runtime Render é antigo7229471/15-10, autodeploy desligado, e env
mais recente teve deployments falhos. Salvar configuração não significa ativá-la;
reativação exige custódia do build/composição/migrador. Não acionar latest/deploy_only
sem saber qual artefato e quais pré-requisitos serão ativados. Nenhum novo backend ou
banco é criado. Alteração alheia incidentes.config.ts continua fora do commit.

Recursos: root único npm4302/build/validações/CORS/docs/rotas/provider; p3c_page_providers
escritor pages/service/test; p3c_security_review revisor independente, backend_delivery
inventário somente leitura das dependências canônicas. Followups herdam modelo/esforço,
sem override disponível. Não há escrita concorrente por arquivo nem uso de Neon.


## Grupos, vínculo de menu e navegação corporativa — 24/10/2026

Incremento arquitetural de composição do host, iniciado em
`5584558d4e04365ae58ae21636eca3b211147a00`, com SDK público instalado
`@praxisui/core@10.0.0-rc.38`. Inventário: Config já define o documento fechado de
`praxis.navigation-groups.editor`, os bindings de navegação da página e a projeção
autorizada de menu; Core já oferece lifecycle e `runtime.navigation` paginado.
Classificação de aderência: `ja-suportado-mal-nomeado-ou-mal-materializado` no Hero.
Nenhum contrato público, dependência ou endpoint novo é necessário.

Plano e impacto: materializar o lifecycle existente em `/workspace-corporativo/grupos`,
os bindings no editor de páginas e um layout corporativo que compartilha os providers
já existentes entre entrada, editor, grupos e página publicada. O shell de demonstração
permanece no seu contexto. A mudança alcança somente Hero core/rotas/UI/testes e este
registro; não requer alteração de SDK, landing, corpus HTTP ou outros artefatos derivados.

A tela de grupos suporta o primeiro agregado registrado em `praxis-app-shell`, com
ícone `home`, após `readHead` confirmar ausência. O seed de `createDraft` é vazio e
não clona o head publicado. Por isso, um head existente impede a criação/substituição
nesta tela; os grupos publicados já autorizados continuam selecionáveis nos bindings.
A publicação usa CAS `first-publish`, inclusive diante de concorrência. O editor de
página altera ou acrescenta um binding por vez, preservando os demais bindings e o
conteúdo completo recebido no draft. Menu parcial não reconstrói documentos de grupos.

O menu vem exclusivamente de `runtime.navigation({ parentRef, cursor, pageSize })`,
com páginas de 20 itens e filhos consultados ao abrir o grupo. A projeção local valida
schema, contexto, cursores, duplicatas, UUIDs e rotas canônicas `/pages/:pageId`; não
aceita links externos. Respostas atrasadas após invalidação ou troca de SESSION não
restauram o menu. Cada reabertura consulta novamente o SDK. O limite de memória desta
tela é 200 itens por nível: ao excedê-lo, a projeção inteira é removida com explicação,
sem apresentar truncamento como conjunto completo. O menu não concede acesso nem usa
catálogo de páginas ou armazenamento local como fonte de autoridade.

Validação focal do autor: `node scripts/workspace/test-corporate-navigation.cjs`
passou 10 verificações offline sobre o código real do modelo, serviço e controlador,
com doubles de Angular e transporte SDK. Cobrem preservação de bindings, documento
fechado, paginação e limites, respostas tardias, payloads/cursor inválidos, composição
das rotas e CAS 412 sem replay. Isso não equivale a teste de integração do Router,
navegador ou HTTP real. `tsc -p tsconfig.app.json --noEmit` e build Angular de
desenvolvimento passaram na implementação inicial; o coordenador concluiu o build
final de produção e a prova CUA do fluxo real descritos abaixo. Nenhum ensaio Neon adicional foi feito
pelo autor. Alteração preexistente de `incidentes.config.ts` permaneceu intocada.

Skills: `atualizar-existente` em `praxis-angular-host-project`; o coordenador integrou
o guidance no PR canônico 863 e sincronizou a skill afetada. `praxis-core-runtime-contracts`
permanece adequada: o host consome o SDK publicado e não redefine sua autoridade.
### Resultado operacional do corte

A jornada real conduzida pelo coordenador passou: criar/salvar/atribuir/congelar/enviar
os grupos, trocar para o publicador, aprovar e publicar; salvar a revisão da página
com binding, atribuir/congelar/enviar, aprovar e publicar. A publicação do primeiro
agregado respondeu 200 em 15,926999 s; a publicação da página respondeu 200 em
31,250833 s. A rota aberta pelo menu respondeu 200. Depois de recarregar, a página
publicada e os filhos do menu responderam 200, com o mesmo release ativo e head ETag.
O binding publicado corresponde ao item e à rota devolvidos pelo SDK. Ao concluir,
o logout respondeu 204 e a consulta de sessão respondeu 401; o coordenador limpou
a referência de credenciais e desativou o coletor de rede.

O [recibo sanitizado](evidence/corporate-publication-2026-10-24/validation.json), a
[captura após recarga](evidence/corporate-publication-2026-10-24/page-menu-reloaded.png),
o [log dos checks offline](evidence/corporate-publication-2026-10-24/offline-checks.log)
e o [build final de produção](evidence/corporate-publication-2026-10-24/production-build.log)
estão versionados. O build terminou em 24/10/2026 às 21:55:26 UTC, com aviso de bundle
inicial de 16,63 MB acima do budget de 15 MB; o limite não foi alterado. O recibo mantém
hashes das fontes privadas, sem copiar sessões, usuários, credenciais ou corpos HTTP.
Também registra os 401/503 intermediários observados na navegação; o sucesso final não
significa que todas as consultas intermediárias passaram.

Esta é uma jornada individual do piloto de Form vazio e ícone home, com o primeiro
agregado de grupos. Não prova SLA, cópia publicada, edição arbitrária ou integração
com API de domínio. Não houve campanha Neon adicional. O Hero usou o proxy local
oficial para o Quickstart Render; isso não prova CORS de uma implantação frontend em
produção. Nenhuma implantação Firebase do Hero faz parte desta evidência.

A revisão identificou um acompanhamento de UX preexistente e não bloqueante: o botão
Publicar pode continuar habilitado quando o release consultado já está ativo. O head
publicado continua sendo a confirmação canônica, separado do estado de aprovação da
review; este corte não altera esse comportamento nem usa o botão como prova de estado.


## Plano: conteúdo Form e cópia publicada — 24/10/2026

Classificação transversal de adoção; baseline Hero `a5542ec039f7f61449c2784fa04f1d23220f1add`,
SDK público rc.38, Config rc.174. Aderência: edição nativa e cópia já suportadas,
mas não materializadas no Hero; política do piloto Quickstart parcialmente suportada
pois restringe o Form a campos vazios. Não criar contrato local substituto.

O Hero consumirá o editor nativo e `decodeDynamicFormPageInputs` /
`projectDynamicFormPageEditorChanges`, preservando bytes authorados e aplicando somente
mudanças explícitas, com validação Core + dono Form. O perfil inicial admite um único
Form, ícone home, campos locais de texto/textarea/número/checkbox e layout de campos;
sem recurso de domínio, URL, hooks, opções remotas ou ações. O responsável Quickstart
amplia sua política fechada no mesmo ciclo. Erros locais de documento/envelope ficam
disponíveis para reparo no editor, sem stripping silencioso. O editor nativo oferece
recursos mais amplos que o perfil; não há capability pública para limitar suas abas.
A UI explica o recorte antes da edição. Uma negação HTTP 403 limpa o conteúdo e mantém
o fence de autorização: reler o rascunho pode perder edições não salvas. O host não
duplica a política de admissão nem apresenta essa negação como erro local reparável.
Valores digitados no runtime não
integram o documento publicado. A reprodução Config mantém envelopes/bindings fixos.

A cópia usa `copySource` recebido no GET published, correlacionado com pageId/head,
e POST pages com creationKey/source/title. Config aloca pageId/draft/widget keys e
limpa navigation; o host não envia JSON arbitrário nem fabrica revisão de origem.
A recuperação consulta by-creation-key e conserva o discriminador da origem.
Novo vínculo de menu é explícito, passando pelo mesmo lifecycle e CAS de publicação.

Impacto autorizado: Hero serviço privado de páginas, editor/componentes/rotas existentes,
testes e este registro; Quickstart policy tem escritor separado. Sem mudança de SDK,
Config, corpus ou landing. Testes focais cobrirão round-trip real do dono, ausência de
defaults, falhas de envelope/perfil, origem/head inválidos, cópia/recuperação e respostas
obsoletas; build do host e revisão independente antes de integração. Nenhuma chamada
remota de escrita ou Neon nesta implementação. Branch `feat/corporate-page-content-copy`;
`incidentes.config.ts` continua fora do escopo. Skills de host, round-trip Form e runtime
orientam o corte; impacto no guidance será fechado com a política final revisada.


Implementação candidata: o editor nativo é montado com `SETTINGS_PANEL_DATA` isolado;
o snapshot de comparação vem de `getSettingsValue()` após renderizar. O salvamento
usa somente a projeção do dono e o lifecycle HTTP existente; não chama `onSave()` nem
instala persistência de preferências. O recibo de nova revisão reinicia o editor por
pageId + ETag. Editar um draft aberto é suportado; uma release congelada continua
imutável, e copiar sua publicação inicia outro draft e outra página.

Validação focal: `test-corporate-content-copy.mjs` passou 8 checks com codecs/serializer/
layout reais do SDK rc.38, incluindo no-op sem materializar defaults do documento,
campos/layout com recarga, negação de envelope, origem/head divergente e recuperação
após SESSION obsoleta. `test-corporate-navigation.cjs` passou 12 checks, incluindo dois
novos casos de intenção de cópia/query e incerteza sem replay. Esses testes usam doubles
para montagem Angular/HTTP; não provam DOM nem persistência remota. TypeScript e build
Angular de produção passaram; a montagem real e a operação contra o host com policy
ampliada pertencem à validação CUA do coordenador. Nenhuma operação remota foi executada
pelo autor. O gerador `scripts/workspace/corporate-form-owner-fixture.mjs` reproduz a
fixture de quatro campos do SDK que também orienta a policy Quickstart. Arrays novas
conservam a saída do serializer, incluindo validators vazio e span responsivo; o host
não faz stripping desses valores nem aceita regras por esse motivo.


## Conteúdo real publicado e recuperação por tentativa — 24/10/2026

O coordenador observou via CUA a criação de outro rascunho Native, edição visual no
editor Form do SDK rc.38 e inclusão de um campo local, com label “Nome do
solicitante” e placeholder “Informe o nome” configurados visualmente. A UI confirmou
revisão salva, abrangência organizacional, congelamento, envio para revisão, aprovação pelo publisher e publicação.
Após recarregar a rota publicada, a árvore de acessibilidade confirmou o label,
a UI manteve a identidade da release e o menu mostrou “Solicitação corporativa”.
O placeholder não foi relido diretamente após reload, e o nome canônico do campo
não foi inspecionado. Não foram capturados status HTTP de sucesso nem comparado o
head ETag neste corte.

O [recibo sanitizado](evidence/corporate-content-2026-10-24/receipt.json) separa essas
observações da [captura após recarga](evidence/corporate-content-2026-10-24/page-menu-reloaded.png).
A captura mostra o título publicado e o menu; o campo está abaixo do viewport e sua
confirmação veio da árvore de acessibilidade observada pelo coordenador. O conteúdo
foi editado visualmente, sem JSON. Valores preenchidos no Form publicado continuam
transitórios e não integram sua persistência editorial.

A tentativa anterior de cópia publicada **não funcionou**: POST pages retornou 503
em 40.973 ms e a consulta por chave retornou 404 em 1.361 ms, conforme diagnóstico
privado cujo hash consta do recibo. Não houve repetição do POST. A causa e o rollback
não estão comprovados; o sucesso de conteúdo Native não resolve nem prova cópia.

Essa falha revelou um bloqueio visual global na mesma instância do componente: sair
da tentativa incerta para uma URL limpa mantinha Criar desabilitado. O fence agora
pertence à identidade da tentativa, priorizando creationKey e depois alvo/draft/release.
Navegar seleciona outra identidade sem apagar a incerteza anterior; retornar à chave
falha continua bloqueado. Mudança de sessão/contexto mantém os fences e exige resolver
novamente o runtime. Respostas tardias marcam a tentativa capturada, sem repintar a
rota atual. Somente recibos válidos e atuais de draft/review liberam a identidade
correspondente; catálogo e 404 não liberam. O conjunto dura a instância do componente;
a chave no endereço e a leitura canônica permanecem necessárias após uma recarga.

O teste focal de navegação/controlador passou 17 checks, incluindo troca de query
na mesma instância, resposta tardia, 404, mudança de contexto e liberação somente da
tentativa lida. TypeScript passou. São doubles de Angular/HTTP; não substituem a prova
operacional. A evidência real acima precede essa correção de fence. O
[build final de produção](evidence/corporate-content-2026-10-24/production-build.log)
passou às 22:49:16 UTC, com aviso de bundle de 16,63 MB acima do budget inalterado de
15 MB. O recibo identifica os hashes da fonte e a alteração local preexistente excluída
do commit. Permanecem os limites do
piloto Form/home, sem API de domínio, campanha Neon adicional, prova de CORS frontend
em produção ou implantação Firebase.
