const { chromium } = require('D:/Developer/praxis-plataform/.worktrees/hero-hq-batch8/node_modules/@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:4302';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runBulkVisualValidation() {
  console.log(`[E2E-BULK] Iniciando validação visual e de governança contra ${BASE_URL}...`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });

  const page = await context.newPage();
  let failures = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
    } else {
      console.error(`  [FAIL] ${message}`);
      failures++;
    }
  }

  // Interceptar chamadas da API de Folha de Pagamento
  await page.route('**/human-resources/folhas-pagamento**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'fp-001',
              funcionarioId: 'iron-man',
              mes: 3,
              ano: 2026,
              salarioBruto: 45000,
              totalDescontos: 9500,
              salarioLiquido: 35500,
              dataPagamento: '2026-03-28',
              resourceVersion: 'v1.0.0',
            },
            {
              id: 'fp-002',
              funcionarioId: 'captain-america',
              mes: 3,
              ano: 2026,
              salarioBruto: 32000,
              totalDescontos: 6800,
              salarioLiquido: 25200,
              dataPagamento: '2026-03-28',
              resourceVersion: 'v1.0.0',
            },
            {
              id: 'fp-003',
              funcionarioId: 'thor',
              mes: 3,
              ano: 2026,
              salarioBruto: 38000,
              totalDescontos: 8100,
              salarioLiquido: 29900,
              dataPagamento: '2026-03-28',
              resourceVersion: 'v1.0.0',
            },
          ],
          total: 3,
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock evaluate reajuste
  await page.route('**/bulk-operations/reajuste/evaluate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        proposalId: 'prop-reajuste-2026',
        status: 'APPROVED',
        totals: {
          targetCount: 2,
          executable: 2,
          blocked: 0,
        },
        diagnostics: [],
      }),
    });
  });

  // Mock confirm reajuste
  await page.route('**/bulk-operations/reajuste/confirm', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        executionId: 'exec-reajuste-2026',
        proposalId: 'prop-reajuste-2026',
        status: 'COMPLETED',
        totals: {
          targetCount: 2,
          confirmed: 2,
          unchanged: 0,
          denied: 0,
        },
      }),
    });
  });

  // Mock evaluate uniform update
  await page.route('**/bulk-operations/uniform-update/evaluate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        proposalId: 'prop-uniform-2026',
        status: 'APPROVED',
        totals: {
          targetCount: 2,
          executable: 2,
          blocked: 0,
        },
        diagnostics: [],
      }),
    });
  });

  // Mock confirm uniform update
  await page.route('**/bulk-operations/uniform-update/confirm', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        executionId: 'exec-uniform-2026',
        proposalId: 'prop-uniform-2026',
        status: 'COMPLETED',
        totals: {
          targetCount: 2,
          confirmed: 2,
          unchanged: 0,
          denied: 0,
        },
      }),
    });
  });

  try {
    // 1. Configurar persona e tema
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('praxis:auth:current-persona', 'nick.fury');
      localStorage.setItem('praxis_hero_hq_theme', 'dark-tech');
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'dark-tech';
    });

    console.log('\n[Cenário 1] Acessando Folha de Pagamento com DEFCON 1...');
    await page.goto(`${BASE_URL}/rh/folha-pagamento`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const titleEl = page.locator('h1, .praxis-resource-page__title').first();
    assert((await titleEl.count()) > 0, 'Página Folha de Pagamento carregada');

    // 2. Selecionar linhas na tabela
    console.log('\n[Cenário 2] Selecionando registros para operação em lote...');
    const rowCheckboxes = page.locator('praxis-table tbody tr td.mat-column-_select mat-checkbox');
    const checkboxCount = await rowCheckboxes.count();
    console.log(`  Encontrados ${checkboxCount} checkboxes de linha na tabela.`);
    assert(checkboxCount >= 2, 'Ao menos 2 checkboxes de linha disponíveis na tabela');

    // Clicar no primeiro e segundo checkbox de linha
    await rowCheckboxes.nth(0).click();
    await page.waitForTimeout(400);
    await rowCheckboxes.nth(1).click();
    await page.waitForTimeout(800);

    const bulkToolbar = page.locator('.praxis-table__bulk-actions, [data-testid="bulk-actions-toolbar"], [class*="bulk"]').first();
    assert((await bulkToolbar.count()) > 0, 'Barra de ações em lote visível após seleção');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-table-selection.png') });
    console.log('  [SCREENSHOT] 01-table-selection.png capturado.');

    // 3. Testar Operação de Comando de Domínio: Reajuste Coletivo
    console.log('\n[Cenário 3] Disparando comando de domínio (Reajuste Coletivo)...');
    const reajusteBtn = page.locator('button').filter({ hasText: /Reajuste Coletivo/i }).first();
    await reajusteBtn.waitFor({ state: 'visible', timeout: 5000 });
    assert((await reajusteBtn.count()) > 0, 'Botão "Reajuste Coletivo" visível na barra de ações');
    await reajusteBtn.click();
    await page.waitForTimeout(1000);

    // Validar modal aberto
    const dialogPane = page.locator('.cdk-overlay-pane.praxis-bulk-dialog-panel').first();
    assert((await dialogPane.count()) > 0, 'Modal de operação em lote aberto no DOM');

    // Se estiver no passo de parâmetros, avaliar proposta. Caso contrário, já auto-avaliou e está na prévia.
    const evaluateBtn = dialogPane.locator('button').filter({ hasText: /Avaliar/i }).first();
    if (await evaluateBtn.count() > 0) {
      // Screenshot Passo 1: Parâmetros
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-domain-command-step1.png') });
      console.log('  [SCREENSHOT] 02-domain-command-step1.png capturado.');
      await evaluateBtn.click();
      await page.waitForTimeout(1200);
    } else {
      // Já avaliado automaticamente, capturar prévia como Step 2
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-domain-command-step1.png') });
      console.log('  [SCREENSHOT] 02-domain-command-step1.png capturado.');
    }

    // Validar Passo 2: Prévia e Conformidade
    const previewTitle = dialogPane.locator('.praxis-bulk-dialog__section-title').first();
    const previewText = await previewTitle.innerText();
    assert(/Conformidade/i.test(previewText), 'Passo 2 de Conformidade e Prévia renderizado');

    const totalCards = dialogPane.locator('.praxis-bulk-dialog__total-card');
    assert((await totalCards.count()) === 3, 'Grid com 3 cartões de métricas renderizado');

    // Screenshot Passo 2: Prévia com métricas executivas
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-domain-command-step2-preview.png') });
    console.log('  [SCREENSHOT] 03-domain-command-step2-preview.png capturado.');

    // Clicar em Confirmar Execução
    const confirmBtn = dialogPane.locator('button').filter({ hasText: /Confirmar/i }).first();
    assert((await confirmBtn.count()) > 0, 'Botão "Confirmar Execução" ativo');
    await confirmBtn.click();
    await page.waitForTimeout(1200);

    // Validar Passo 3: Resultado Executivo
    const resultAlert = dialogPane.locator('.praxis-bulk-dialog__alert--success').first();
    assert((await resultAlert.count()) > 0, 'Alerta de homologação de sucesso renderizado');
    const resultAlertText = await resultAlert.innerText();
    assert(/Operação concluída com êxito/i.test(resultAlertText), 'Mensagem executiva no alerta de conclusão');

    const efetivadosLabel = dialogPane.locator('.total-label').first();
    assert(/Efetivados/i.test(await efetivadosLabel.innerText()), 'Rótulo executivo "Efetivados" presente');

    // Screenshot Passo 3: Resultado
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-domain-command-step3-result.png') });
    console.log('  [SCREENSHOT] 04-domain-command-step3-result.png capturado.');

    // Concluir e Atualizar
    const closeBtn = dialogPane.locator('button').filter({ hasText: /Concluir/i }).first();
    await closeBtn.click();
    await page.waitForTimeout(1000);
    assert((await dialogPane.count()) === 0, 'Modal fechado com sucesso');

    // 4. Testar Atualização de Registros em Massa (Uniform Update)
    console.log('\n[Cenário 4] Testando Atualização de Registros em Massa (Uniform Update)...');
    await page.waitForTimeout(1500);
    const refreshedCheckboxes = page.locator('praxis-table tbody tr td.mat-column-_select mat-checkbox input');
    await refreshedCheckboxes.first().waitFor({ state: 'attached', timeout: 10000 });
    
    // Garantir que as duas primeiras linhas estejam marcadas
    await refreshedCheckboxes.nth(0).check({ force: true });
    await page.waitForTimeout(300);
    await refreshedCheckboxes.nth(1).check({ force: true });
    await page.waitForTimeout(800);

    const uniformBtn = page.locator('button').filter({ hasText: /Atualização de Registros em Massa/i }).first();
    await uniformBtn.waitFor({ state: 'visible', timeout: 5000 });
    assert((await uniformBtn.count()) > 0, 'Botão de Atualização em Massa presente');
    await uniformBtn.click();
    await page.waitForTimeout(1000);

    const editDialogPane = page.locator('.cdk-overlay-pane.praxis-bulk-dialog-panel').first();
    assert((await editDialogPane.count()) > 0, 'Modal de Edição em Massa aberto no DOM');

    // Validar título executivo
    const editTitle = await editDialogPane.locator('#praxis-bulk-edit-dialog-title').innerText();
    assert(/Atualização de Registros em Massa/i.test(editTitle), 'Título executivo "Atualização de Registros em Massa" verificado');

    // Screenshot Passo 1: Edição em Massa
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-uniform-update-step1-fields.png') });
    console.log('  [SCREENSHOT] 05-uniform-update-step1-fields.png capturado.');

    // Avaliar alterações
    const evaluateEditBtn = editDialogPane.locator('button').filter({ hasText: /Avaliar/i }).first();
    await evaluateEditBtn.click();
    await page.waitForTimeout(1200);

    // Screenshot Passo 2: Prévia da Atualização em Massa
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-uniform-update-step2-preview.png') });
    console.log('  [SCREENSHOT] 06-uniform-update-step2-preview.png capturado.');

    // Confirmar alterações
    const confirmEditBtn = editDialogPane.locator('button').filter({ hasText: /Confirmar/i }).first();
    await confirmEditBtn.click();
    await page.waitForTimeout(1200);

    // Validar Passo 3: Resultado da Atualização em Massa
    const editResultAlert = editDialogPane.locator('.praxis-bulk-edit-dialog__alert--success').first();
    assert((await editResultAlert.count()) > 0, 'Alerta de sucesso na atualização em massa renderizado');
    const editAlertText = await editResultAlert.innerText();
    assert(/Atualização concluída com êxito/i.test(editAlertText), 'Mensagem executiva no alerta de conclusão de edição');

    const editEfetivadosLabel = editDialogPane.locator('.total-label').first();
    assert(/Efetivados/i.test(await editEfetivadosLabel.innerText()), 'Rótulo executivo "Efetivados" presente na edição');

    // Screenshot Passo 3: Resultado da Atualização em Massa
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-uniform-update-step3-result.png') });
    console.log('  [SCREENSHOT] 07-uniform-update-step3-result.png capturado.');

    const closeEditBtn = editDialogPane.locator('button').filter({ hasText: /Concluir/i }).first();
    await closeEditBtn.click();
    await page.waitForTimeout(800);
    assert((await editDialogPane.count()) === 0, 'Modal de Atualização em Massa fechado com sucesso');

  } catch (err) {
    console.error(`[E2E-BULK] Erro durante a validação:`, err);
    failures++;
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(60));
  if (failures === 0) {
    console.log(' [SUCESSO] Validação visual e de governança de operações em lote concluída com 100% de êxito!');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  } else {
    console.error(` [FALHA] ${failures} verificação(ões) falharam!`);
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  }
}

runBulkVisualValidation();
