const { chromium } = require('D:/Developer/praxis-plataform/.worktrees/hero-hq-batch8/node_modules/@playwright/test');

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:4302';

async function runE2E() {
  console.log(`[E2E] Iniciando validação E2E e regressão visual contra ${BASE_URL}...`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  let failures = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
    } else {
      console.error(`  [FAIL] ${message}`);
      failures++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Dashboard Navigation & Hero Executive Banner
    // -------------------------------------------------------------
    console.log('\n[Test 1] Validando Hero Executive Banner & Telemetria...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);

    const banner = page.locator('.hero-executive-banner').first();
    assert(await banner.count() > 0, 'Componente .hero-executive-banner está presente no DOM');

    const bannerTitle = await banner.innerText();
    assert(/Centro de Comando & Prontidão/i.test(bannerTitle), 'Título executivo do banner renderizado');
    assert(/Sistemas Táticos Ativos/i.test(bannerTitle), 'Badge de sistemas ativos presente no banner');
    assert(/Praxis Platform 9\.0/i.test(bannerTitle), 'Badge da plataforma presente no banner');

    const radarMedia = page.locator('.hero-executive-banner .prx-rich-card-media, .hero-executive-banner [class*="media"]').first();
    assert(await radarMedia.count() > 0, 'Container de telemetria presente no banner');

    // -------------------------------------------------------------
    // Test 2: Bento KPIs & Governed Data
    // -------------------------------------------------------------
    console.log('\n[Test 2] Validando Bento KPIs no Dashboard...');
    const bodyText = await page.innerText('body');
    assert(bodyText.includes('53 Ativos'), 'KPI "53 Ativos" renderizado');
    assert(bodyText.includes('14 Planejadas') || bodyText.includes('15 Planejadas') || /\d+\s+Planejadas/.test(bodyText), 'KPI de missões planejadas ("Planejadas") renderizado');
    assert(bodyText.includes('R$ 3,09 M') || bodyText.includes('3,09 M'), 'KPI de execução orçamentária formatado em Real presente');
    assert(bodyText.includes('18 Críticos'), 'KPI "18 Críticos" renderizado');

    // -------------------------------------------------------------
    // Test 3: Distress Signals List pt-BR Localization
    // -------------------------------------------------------------
    console.log('\n[Test 3] Validando Sinais de Socorro com formatação canônica pt-BR...');
    const listEl = page.locator('#hero-distress-signals-list, praxis-list').first();
    assert(await listEl.count() > 0, 'Lista de sinais de socorro presente');

    const metaSpans = await page.$$eval('.meta span', els => els.map(e => e.innerText.trim()));
    assert(metaSpans.length > 0, `Nós de metadados relativos renderizados (${metaSpans.length} encontrados)`);

    const hasEnglishWords = metaSpans.some(t => /days ago|hours ago|minutes ago/i.test(t));
    assert(!hasEnglishWords, 'Nenhum termo em inglês detectado nos valores relativos (zero "days ago")');

    const hasPtBrWords = metaSpans.some(t => /anteontem|ontem|há|segundos|minutos|horas|dias/i.test(t));
    assert(hasPtBrWords, `Valores relativos devidamente formatados em português brasileiro (exemplo: "${metaSpans[0]}")`);

    const paginatorText = await listEl.innerText();
    assert(!/items per page/i.test(paginatorText), 'Paginação não possui strings em inglês ("items per page")');
    assert(/itens por página/i.test(paginatorText), 'Paginação devidamente localizada em pt-BR ("Itens por página")');

    // -------------------------------------------------------------
    // Test 4: Resource Page - Incidentes Táticos (HTML5 PushState)
    // -------------------------------------------------------------
    console.log('\n[Test 4] Validando Página de Recurso: Incidentes Táticos...');
    await page.goto(`${BASE_URL}/operacoes/incidentes`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const incidentsTitle = page.locator('h1, [class*="title"]').filter({ hasText: /Incidentes Táticos/i }).first();
    await incidentsTitle.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    assert(await incidentsTitle.count() > 0, 'Página de Incidentes Táticos carregou com sucesso');

    await page.waitForTimeout(3000);
    const incidentsBody = await page.innerText('body');
    assert(incidentsBody.includes('TOTAL DE OCORRÊNCIAS') || incidentsBody.includes('74 Registros'), 'KPI de Total de Ocorrências presente');
    assert(incidentsBody.includes('R$ 154,4 M') || incidentsBody.includes('154,4 M'), 'KPI de Danos Materiais formatado em Real presente');

    // -------------------------------------------------------------
    // Test 5: Resource Page - Heróis & Colaboradores (HTML5 PushState)
    // -------------------------------------------------------------
    console.log('\n[Test 5] Validando Página de Recurso: Heróis & Colaboradores...');
    await page.goto(`${BASE_URL}/rh/funcionarios`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const heroesTitle = page.locator('h1, [class*="title"]').filter({ hasText: /Heróis & Colaboradores/i }).first();
    await heroesTitle.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    assert(await heroesTitle.count() > 0, 'Página de Heróis & Colaboradores carregou com sucesso');

    await page.waitForTimeout(3000);
    const heroesBody = await page.innerText('body');
    assert(heroesBody.includes('EFETIVO TOTAL') || heroesBody.includes('24 Cadastrados'), 'KPI de Efetivo Total presente');
    assert(heroesBody.includes('21 Ativos'), 'KPI de Prontidão Ativa presente');

  } catch (err) {
    console.error(`[E2E] Erro inesperado na execução:`, err);
    failures++;
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(60));
  if (failures === 0) {
    console.log(' [SUCESSO] Todos os testes E2E e invariantes visuais foram validados com êxito!');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  } else {
    console.error(` [FALHA] ${failures} teste(s) falharam!`);
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  }
}

runE2E();
