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
