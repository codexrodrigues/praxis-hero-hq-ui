# P3-C — adoção em incrementos

> Continuidade em outra máquina: leia a
> [passagem de 24/10/2026](handoff-2026-10-24/README.md) e o
> [registro atualizado da jornada](corporate-session-journey.md).
> As seções abaixo preservam o histórico dos primeiros cortes; não representam
> sozinhas o estado final. Conteúdo Native foi publicado; cópia real segue pendente.

Controle: [Quickstart #461](https://github.com/codexrodrigues/praxis-api-quickstart/issues/461).
Este documento descreve o estado atual; evidências anteriores permanecem históricas.

## Entregue no Hero

O laboratório `/laboratorio`, sem login, permite criar/copiar pelo Page Builder,
salvar página com menu, ícone e nova rota e reabri-la após recarregar. Usa os
componentes públicos do SDK rc.38; os dados ficam neste navegador e na persona
escolhida. Isso não equivale a publicação corporativa no servidor.

Em `/workspace-corporativo`, o novo incremento permite entrar, verificar/restaurar
SESSION, consultar escolhas paginadas, selecionar contexto por CAS e sair. O Core
rc.38 continua dono do cliente de contexto: o Hero envia somente choiceRef e
expectedSelectionVersion admitidos e exibe o snapshot relido. Tenant e organização
são distintos. Persona de demonstração não autentica nem altera a identidade corporativa.

Login, bootstrap raw-CSRF e logout são responsabilidade do host. Senha não é
persistida e o token fica somente em memória. Respostas de gerações anteriores não
restauram sessão ou escolhas após sair; auth é serializada inclusive quando uma
resposta tardia invalida o estado. Logout incerto exige verificação, sem fingir que
um cookie HttpOnly foi removido. Erros403/503 do contexto não encerram a sessão.

O transporte corporativo usa correspondência exata de origem/path, credenciais
explícitas e bloqueio efetivo de redirects pelo FetchBackend. Demais chamadas usam
o XHR anterior, preservando upload/progress. Headers de persona e bearer sintético
não entram em runtime/pages/ui-layouts; headers confirmados pelo Core, ETags e
precondições permanecem. O proxy preserva Origin, Referer, TLS e cookies reais.
O serviço de contexto continua limitado à tela, includeGlobalFetchHeaders=false e
errorPolicy=fail, sem transformar o contexto global das telas legadas.

## Fontes e aderência

Classificação: transversal de adoção, sem novo contrato público.

| Necessidade | Aderência / dono | Estado |
| --- | --- | --- |
| Contexto, choices e CAS | ja-suportado-so-ux / Core + Config | Materializados no Hero |
| Headers confirmados e SESSION/CSRF | ja-suportado-mal-nomeado-ou-mal-materializado / Core + Quickstart + transporte host | Costura implementada; consumidor validado com HTTP interceptado |
| Providers de criação/admissão/audience/navegação | suportado-parcialmente na adoção / Config e Quickstart | Quickstart463 integrado com Config público0.1.0-rc.169 |
| Criação/publicação corporativa, catálogo e URL/menu | suportado-parcialmente na adoção / Config + Core | Provas canônicas existentes; próximo corte de UI no Hero |

Não foram criados endpoints, grants, DTOs de autenticação no SDK ou caches de
permissão. Nenhum pacote/lock foi alterado. Landing, corpus HTTP e public-api não
precisam de atualização neste recorte. O guidance reutilizável de transporte foi
atualizado na fonte canônica de praxis-angular-host-project, sem fachada entre libs.

## Aceite e limitação operacional

[Quickstart463](https://github.com/codexrodrigues/praxis-api-quickstart/pull/463)
foi integrado em48c28c0c8f0b25f7c85fdf51cf69b49e69bc40b2 por aceite técnico revisto.
A prova privada completa e as provas canônicas válidas foram reutilizadas. O último
ensaio público encerrou criação com503 em40,579s; publicação e rollback não foram
alcançados nesse ensaio. Isso não foi convertido em PASS. Mantidos orçamento de40s,
autorização e rollback; não há declaração de SLA nem prontidão de produção. Por
decisão expressa do usuário, nenhum novo ensaio Neon é exigido neste ciclo.

O consumidor Hero foi validado com APIs interceptadas. Isso não prova cookies,
CORS, SESSION ou publicação contra o backend real. Uma consulta anônima e somente
leitura a `/auth/session` do Render com Origin http://127.0.0.1:4302 retornou403,
`Invalid CORS request`. Antes do uso corporativo real, a implantação deve admitir
a origem real nas configurações canônicas app.cors.allowed-origins e
app.security.config-origin-restriction.allowed-origins, conferir cookies/session/CSRF e
provisionar identidades/grants pelo processo oficial. Não falsificar origem4003,
reescrever cookies ou enfraquecer TLS/CSRF. Não houve login nem mutação remota.

## Validação deste incremento

[Evidência, hashes e escopo](evidence/corporate-session-2026-10-24/validation.json):
16 testes unitários focais, TypeScript, build, E2E de sessão/contexto, catálogo de
rotas e regressão completa do laboratório aprovados. A prova de navegador cobre
CAS/recarga,401/403/409/503, respostas tardias, logout incerto, isolamento de persona,
307 sem envio de senha/CSRF a outro destino e ausência de persistência de segredos.
Desktop e390px conferidos, com drawer recolhido, bounds internos e foco por teclado
entre Usuário/Senha. Não é uma auditoria completa de acessibilidade.

Build10,940s aprovado com aviso de bundle16,60MB (alerta15MB/erro18MB), sem ampliar
orçamento. Não repetir suites válidas: somente o E2E alterado para QA móvel foi
reexecutado. A alteração preexistente em incidentes.config.ts permaneceu intacta e
fora do commit; seu hash está na evidência, e o build local a incluiu.

Revisão independente: p3c_security_review confrontou produção, concorrência,
segurança, contrato, transporte efetivo, teste móvel e guidance. A revisão identificou
que XHR ignora redirect:error e a captura móvel precisava aguardar o drawer; ambos
corrigidos e provados. Escrita do código/testes: p3c_page_providers. Coordenador:
docs, validações e integração. Sem banco ou implantação.

## Próximo corte

Materializar criação/cópia e workflow editorial pelos serviços canônicos, depois
catálogo autorizado compartilhado por URL/menu. Não enviar JSON arbitrário SaveAs
como POST/pages, simular publicação ou duplicar as regras de admissão no host.
Reusar provas válidas, validar apenas a nova costura e manter revisão independente.
Este incremento não fecha toda a issue P3-C nem autoriza merge/deploy do PR13 em main.

## Corte seguinte: criação e lifecycle de páginas

A rota `/workspace-corporativo/paginas` agora consome criação nativa, reconciliação
por creationKey, draft, revisão, congelamento, submissão, aprovação por outro ator,
publicação explícita e leitura publicada. `/pages/:pageId` relê a publicação do
servidor e renderiza pelo Page Builder/Form público. O primeiro perfil é um Form
vazio, título editável e ícone home, não um editor irrestrito de JSON. O vínculo
organizacional usa o contexto persistido, sem autoridade obtida dos parâmetros URL.

Contexto, lifecycle e transporte partilham um único injector ancestral corporativo.
Troca de SESSION invalida o contexto e descarta respostas tardias de outro ator.
Referências da URL são relidas no servidor; passwords, cookies e grants não são
persistidos no browser. Aprovação mecânica deste piloto não oferece preview
imutável completo do conteúdo: isso permanece uma evolução explícita.

O E2E com API controlada passou: dois atores, resposta perdida/reconciliação sem
POST duplicado,412/releitura,ETag publicado fraco,recarga,401/403/tenant404,resposta
tardia após troca de sessão e viewport390px. O gate nativo lê os documentos Java
reais da revisão2 do Quickstart e valida pelo SDK público rc.38. Build e typecheck
aprovados; bundle16,63MB mantém alerta15MB e erro18MB. Esses resultados ainda não
provam operação no Render; o recibo operacional será acrescentado após ativação.

Cópia aguarda publicação do Config com copySource já integrado na fonte; menu
persistente aguarda a costura de grupos sem sobrescrever uma lista incompleta.
Não foram criados contratos paralelos. Sem repetição da campanha Neon.
