# Auxiliares de revisão visual

Execute os comandos na raiz do Hero HQ. O servidor de desenvolvimento oficial é
`npm start`, em `http://127.0.0.1:4302`.

- `verify-workspace-themes.mjs`: catálogo, bootstrap, fontes e contraste dos tokens.
- `audit-angular-ui.mjs`: adaptação sintática de templates Angular em cópia
  temporária para o auditor externo; não modifica os fontes do projeto.
- `test-audit-angular-ui.mjs`: regressões do adaptador em fixtures descartáveis.
- `verify-brasa-browser.cjs` e `verify-brasa-deep-browser.cjs`: ensaios Brasa.
- `verify-insignia-browser.cjs`: ensaios de tema Insígnia.
- `verify-type-rhythm.cjs`: pesos, famílias e ícones dos cinco temas.
- `brasa-deep-fixtures.cjs`: respostas HTTP simuladas usadas pelos ensaios locais.

Os ensaios de navegador exigem Playwright instalado no projeto ou no checkout
irmão `praxis-ui-angular`. Confira os caminhos de saída antes de executá-los:
eles gravam capturas e relatórios em `docs/design/evidence` e podem substituir
artefatos do mesmo ensaio. Não executá-los contra produção como prova de sessão,
autorização ou persistência: usam fixtures HTTP isoladas. Sua inclusão não
significa que todos foram reexecutados na versão atual do SDK.

O auditor é fornecido separadamente pela skill frontend-design-premium:

```sh
node scripts/workspace/test-audit-angular-ui.mjs --auditor /caminho/audit_project.py
node scripts/workspace/audit-angular-ui.mjs --auditor /caminho/audit_project.py .
```
