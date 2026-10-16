# Publicação do Hero no Firebase Hosting

O workflow `.github/workflows/firebase-deploy.yml` publica o canal live do projeto `praxis-hero-hq` a cada push/merge em main. Também aceita workflow_dispatch. A saída Angular é `dist/praxis-hero-hq-ui/browser`, conforme firebase.json, com fallback SPA.

A credencial é o secret de repositório `FIREBASE_SERVICE_ACCOUNT_PRAXIS_HERO_HQ`, contendo o JSON da conta `github-hero-hosting@praxis-hero-hq.iam.gserviceaccount.com`. Ela possui somente Firebase Hosting Admin e API Keys Viewer no projeto Hero; não reutiliza a conta do Admin SDK nem credenciais pessoais. Este fluxo publica Hosting live; não configura previews ou recursos de backend.

O preflight valida tipo, projeto, conta e formato da chave sem exibir o conteúdo. Ausência/erro da credencial falha o job; deploy não pode mais ser silenciosamente pulado com workflow verde. O secret fica disponível somente no preflight e como input da action de Hosting, não no ambiente de npm ci/build.

Para rotacionar: criar nova chave dessa conta, substituir o mesmo secret via canal protegido, validar deploy e somente então revogar a chave anterior. Não commitar o JSON, colocá-lo em frontend ou registrar seu conteúdo em logs. Não excluir chaves antigas sem confirmar outros consumidores.

Validação da entrega: confirmar no run que a etapa Deploy to Firebase Hosting terminou success, conferir release live no Firebase Hosting e carregar a URL pública/rota SPA. Build success com deploy skipped não comprova publicação. Uma falha antes da publicação mantém a versão anterior. Falha durante ou depois do deploy exige conferir a release live antes de concluir o estado. Rollback deve selecionar uma release live anterior no Hosting.

Esta correção é operacional e local ao Hero. Não altera contratos de bibliotecas, não aplica os patches pendentes da integração bulk e não substitui a revisão funcional daquele incremento. Skills: sem-impacto neste ajuste de credencial/workflow; o procedimento fica neste documento do consumidor.
