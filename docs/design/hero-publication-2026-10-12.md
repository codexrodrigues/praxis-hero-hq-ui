# Publicação do Hero HQ — 12/10/2026

## Integração e Hosting

PR Hero #2 integrado em `daa7a87f02c054de9d286540c8023544085eccaa`, após autorização
explícita para publicar Firebase live. Os 22 pacotes Praxis permanecem fixados
em 10.0.0-rc.9; instalação limpa, build e revisão independente já aprovados.

Workflow `38310673919`: instalação/build aprovados; deploy ignorado porque o
secret `FIREBASE_SERVICE_ACCOUNT_PRAXIS_HERO_HQ` não está configurado. A sessão
Firebase existente foi verificada; o projeto `praxis-hero-hq` ainda não existia
nessa conta e foi criado sem vincular faturamento ou criar chaves de serviço.
CLI oficial Firebase 15.33.0 publicou somente Hosting, com 92 arquivos e release
concluída em `https://praxis-hero-hq.web.app`. Build corresponde ao código integrado.

## Integração da API

Classificação `transversal`; inventário `ja-suportado-mal-nomeado-ou-mal-materializado`.
A página pública carregava shell/tema, mas recebia 403 e
`PreflightMissingAllowOriginHeader` da API Render. Contratos existentes cobrem o
comportamento; não foram criados endpoints, modelos ou permissões de negócio novas.

Dono canônico: política de exposição do Quickstart. Serviço
`srv-d3qjqcemcj7s73bpluv0`, build implantado `a99343a92de01abc23575efd74345d8ca243c967`.
Somente `https://praxis-hero-hq.web.app` foi acrescentado às listas existentes:
CORS 13→14, restrição de configuração 2→3. Readback confirmou as duas listas
exatas, preservando todas as origens anteriores. Autenticação, CSRF, headers,
banco e regras de negócio não foram reconfigurados.

A opção Save and deploy reutiliza o build existente, conforme
[Render Docs](https://render.com/docs/configure-environment-variables). Uma primeira
seleção do menu iniciou reimplantação antes de preencher os novos valores; ela
terminou sem alteração das origens. A correção foi então preenchida, revisada
independentemente e salva em uma operação serializada, sem upgrade de código.
Deploy da correção: `dep-db6l8ivf3r2c73cqqqkg`.

## Validação e limites

Readback das duas listas aprovado; revisão independente no SHA implantado aprovada.
Deploy da correção ativo no mesmo SHA `a99343a9`. Preflight real de configuração
com headers usados pelo host: origem Hero 200; origem anterior localhost:4003
200; origem não autorizada `.invalid` 403, sem allow-origin. Credenciais, métodos
e headers expostos ETag/X-Schema-Hash/X-Data-Version preservados. Validação
browser público confirmou GET de configuração/layout 200, layout personalizado
salvo e quatro gráficos (linhas, barras, rosca, velocímetro). Não houve bloqueio
CORS na prova final.

Logo após o restart, duas agregações falharam com 500; os logs registraram
JDBCConnectionException/SQLTransientConnectionException, pool de três conexões
ocupadas e timeout de 1000 ms. Uma repetição após aquecimento carregou os quatro
gráficos, sem novos 500 nessa rodada. A publicação OpenAPI governada ainda
responde 503 em schemas de incidentes/sinais de socorro e capabilities de
incidentes. A tabela de incidentes apresenta erro de preparação. Esta pendência
pertence ao backend e limita o aceite funcional: não se declara toda a aplicação
validada, nem se aumenta a capacidade ou altera grants sem estudo e prova.

Evidências operacionais locais: /tmp/praxis-hero-public-browser-proof.json,
/tmp/praxis-hero-cors-change.json e headers dos três preflights. Não são
artefatos publicados no npm nem testes de persistência de negócio.
Não foi executada suíte de banco nem introduzido fallback local. O ciclo operacional
do serviço preservou o predeploy oficial; isso é distinto de um ensaio isolado Neon.

Skill `praxis-api-quickstart-security-config`: `existente-adequada`, porque já ensina
origens explícitas, fronteiras CORS/config e provas positivas/negativas. Nenhuma
semântica canônica mudou; docs públicas/manifestos HTTP não exigem atualização
por uma nova origem operacional deste consumidor. Este registro e o README
documentam a publicação concreta do consumidor.

Pendência operacional independente: configurar autenticação do GitHub para
publicações automáticas futuras. Alertas Angular e responsividade dos KPIs
permanecem registrados no relatório de temas; publicação não certifica ausência
de vulnerabilidades nem gravação de negócio.
