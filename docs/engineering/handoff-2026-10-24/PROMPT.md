# Prompt de retomada — outra máquina/agente

Assuma a conclusão da jornada corporativa de páginas da plataforma Praxis, usando
o Hero como laboratório/vitrine. O trabalho está incompleto; quero resultado
funcional, análise crítica do desenho e entregas pequenas com revisão independente.

Comece pelo repositório `codexrodrigues/praxis-hero-hq-ui`, branch
`feat/corporate-page-content-copy` (PR #19). Leia integralmente:

`docs/engineering/handoff-2026-10-24/README.md`

Leia também os snapshots de AGENTS e coordenação nessa pasta e os AGENTS locais.
O README contém os commits, PRs, dependências, evidências remotas e limitações;
reconfira o GitHub antes de editar. Não dependa de caminhos `/Users/rodrigo`, `/tmp`,
cookies, credenciais ou processos da máquina anterior.

Objetivo: criar/editar uma página com conteúdo real pelo editor oficial, salvar,
aprovar/publicar e acessá-la por menu e rota persistentes após reload. Copiar uma
publicação em nova identidade/rota, editar a cópia e publicar com novo vínculo de
menu explícito, mantendo a origem intacta. Centralize semântica na plataforma;
não transforme cada host numa implementação paralela de autorização/persistência.

Já houve prova real de criação Native, edição visual de campo, salvamento,
publicação por outro ator e recarga com menu/rota/conteúdo. O PR #18 e as dependências
#17/#16 foram integrados na branch do #13; **#13 ainda não está em main**.
O PR #19 contém editor/cópia e correção de fence por tentativa, com revisão e
testes/build válidos. Ele ainda está aberto.

Bloqueio atual: a primeira cópia real respondeu 503 após 40.973 ms; GET de
reconciliação da mesma chave respondeu 404. Não houve segundo POST, diagnóstico de
checkpoint causador ou prova de rollback dessa tentativa. Não chame essa cópia de
funcional. No Config, PR #533 aberto mede e reduz Native 110→109 e Published 132→131
unidades sintéticas de autoridade; só uma unidade a menos **não prova resolver o timeout**.
Analise o custo completo e as fronteiras existentes; questione o desenho e evite
gastar ciclos publicando micro-otimizações sem evidência suficiente.

Restrições: preserve autorização, isolamento, SESSION/CSRF, proveniência, CAS/ETags,
idempotência, rollback e orçamento de **40 segundos**. Não cacheie grants, remova
checkpoints, aumente o timeout ou crie SaveAs local arbitrário. **Não repita o ensaio
Neon**: essa repetição foi expressamente dispensada. Reutilize as provas existentes;
rode apenas testes focais que mudanças novas justifiquem. Não use banco local para
substituir prova remota. Não repita automaticamente POST incerto.

Clone/atualize também `praxis-config-starter`, `praxis-api-quickstart` e
`praxis-codex-skills`. Retomada Config: branch `fix/published-copy-capture-admission`
(#533); Quickstart ativo observado: `d6c11592`, Config público rc.174; SDK público
Angular rc.38. Consuma contratos publicados e leia os fontes canônicos corretos.
As políticas do Quickstart admitem apenas Form local/transitório sem API de domínio;
os valores preenchidos não são persistência de negócio.

O backend de referência é o Render já existente. Utilize as identidades autor e
publicador já geridas lá, sem pedir senhas no chat, criar grants ad hoc, expor
segredos ou assumir sessão da máquina anterior. Preserve o link de revisão sem
draft privado para o publicador. Consulte no README os IDs e recibos operacionais.

Antes de alterar, apresente um plano curto com dono canônico, lacunas reais e impacto.
Investigue, implemente e revise independentemente a solução. Depois valide o
fluxo real pendente de copiar conteúdo, publicar, menu/rota/reload e origem intacta.
Atualize as evidências, exemplos, documentação e skills afetadas; integre na ordem
correta. Merge em main do Hero dispara Firebase live: revise o merge result e
os gates antes dessa promoção. Não anuncie produção com base na prova via proxy local.

Não descarte alterações locais de outros trabalhos. Não presuma que um agente
da sessão anterior continua disponível. Entregue um quadro objetivo do que
funciona, do que falta e da URL validada; não encerre como 100% pronta enquanto
a cópia real continuar pendente.
