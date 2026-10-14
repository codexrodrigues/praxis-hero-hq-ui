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

  // ---------------------------------------------------------------------------
  // 1. Capabilities + 2-Phase Evaluation/Confirmation routes for /rh/eventos-folha
  //    (Collection rows and /schemas/filtered come from the real backend)
  // ---------------------------------------------------------------------------
  await page.route('**/api/human-resources/eventos-folha/capabilities**', async (route) => {
    const body = {
      resourceKey: 'human-resources.eventos-folha',
      resourcePath: '/api/human-resources/eventos-folha',
      group: 'api-human-resources-eventos-folha',
      resourceId: null,
      canonicalOperations: {
        update: true,
        delete: true,
        byId: true,
        cursor: true,
        filter: true,
        create: true,
        options: true,
        all: true,
      },
      operations: {
        'bulk-approve': {
          id: 'bulk-approve',
          supported: true,
          scope: 'COLLECTION',
          preferredMethod: 'POST',
          availability: { allowed: true, reason: null, metadata: {} },
        },
      },
      actions: [
        {
          id: 'bulk-approve',
          title: 'Aprovar eventos de folha em lote',
          scope: 'COLLECTION',
          availability: { allowed: true, reason: null, metadata: {} },
          execution: {
            bulk: {
              mode: 'DOMAIN_COMMAND',
              atomicity: 'PER_ITEM',
              selectionModes: ['EXPLICIT'],
              executionModes: ['SYNC'],
              parametersPointer: '/properties/parameters',
              limits: {
                maxTargets: 25,
                maxRequestBytes: 65536,
                proposalLifetimeMillis: 300000,
                unitDeadlineMillis: 5000,
              },
              evaluationOperation: {
                operation: {
                  operationId: 'evaluateBulkApproval',
                  path: '/api/human-resources/eventos-folha/actions/bulk-approve/evaluation',
                  method: 'POST',
                },
                requestSchema: {
                  schemaId: 'bulk-approve-eval-req',
                  schemaType: 'request',
                  url: '/schemas/filtered?path=%2Fapi%2Fhuman-resources%2Feventos-folha%2Factions%2Fbulk-approve%2Fevaluation&operation=post&schemaType=request&idField=id&readOnly=false',
                },
                responseSchema: {
                  schemaId: 'bulk-approve-eval-res',
                  schemaType: 'response',
                  url: '/schemas/filtered?path=%2Fapi%2Fhuman-resources%2Feventos-folha%2Factions%2Fbulk-approve%2Fevaluation&operation=post&schemaType=response&idField=id&readOnly=false',
                },
              },
              confirmationOperation: {
                operation: {
                  operationId: 'human-resources.eventos-folha.bulk-approve',
                  path: '/api/human-resources/eventos-folha/actions/bulk-approve',
                  method: 'POST',
                },
                responseSchema: {
                  schemaId: 'bulk-approve-confirm-res',
                  schemaType: 'response',
                  url: '/schemas/filtered?path=%2Fapi%2Fhuman-resources%2Feventos-folha%2Factions%2Fbulk-approve&operation=post&schemaType=response&idField=id&readOnly=false',
                },
              },
              proposalOperation: {
                operation: {
                  operationId: 'getBulkProposal',
                  path: '/api/human-resources/eventos-folha/bulk-proposals/{proposalId}',
                  method: 'GET',
                },
                responseSchema: {
                  schemaId: 'bulk-proposal-res',
                  schemaType: 'response',
                  url: '/schemas/filtered?id=bulk-proposal-res',
                },
              },
              proposalResultsOperation: {
                operation: {
                  operationId: 'getBulkProposalResults',
                  path: '/api/human-resources/eventos-folha/bulk-proposals/{proposalId}/results',
                  method: 'GET',
                },
                responseSchema: {
                  schemaId: 'bulk-proposal-results-res',
                  schemaType: 'response',
                  url: '/schemas/filtered?id=bulk-proposal-results-res',
                },
              },
              executionOperation: {
                operation: {
                  operationId: 'getBulkExecution',
                  path: '/api/human-resources/eventos-folha/bulk-executions/{executionId}',
                  method: 'GET',
                },
                responseSchema: {
                  schemaId: 'bulk-execution-res',
                  schemaType: 'response',
                  url: '/schemas/filtered?id=bulk-execution-res',
                },
              },
              resultsOperation: {
                operation: {
                  operationId: 'getBulkExecutionResults',
                  path: '/api/human-resources/eventos-folha/bulk-executions/{executionId}/results',
                  method: 'GET',
                },
                responseSchema: {
                  schemaId: 'bulk-execution-results-res',
                  schemaType: 'response',
                  url: '/schemas/filtered?id=bulk-execution-results-res',
                },
              },
              cancelOperation: {
                operation: {
                  operationId: 'cancelBulkExecution',
                  path: '/api/human-resources/eventos-folha/bulk-executions/{executionId}/cancel',
                  method: 'POST',
                },
                responseSchema: {
                  schemaId: 'bulk-execution-cancel-res',
                  schemaType: 'response',
                  url: '/schemas/filtered?id=bulk-execution-cancel-res',
                },
              },
            },
          },
        },
      ],
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  await page.route('**/api/human-resources/eventos-folha/actions/bulk-approve/evaluation**', async (route) => {
    const reqBody = route.request().postDataJSON();
    const targets = reqBody?.selection?.targets || [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        proposalId: 'prop-eventos-folha-2026',
        operationRef: {
          operationId: 'human-resources.eventos-folha.bulk-approve',
          path: '/api/human-resources/eventos-folha/actions/bulk-approve',
          method: 'POST',
        },
        mode: 'DOMAIN_COMMAND',
        executionMode: 'SYNC',
        atomicity: 'PER_ITEM',
        status: 'READY',
        createdAt: '2026-10-14T02:00:00Z',
        expiresAt: '2026-10-14T02:05:00Z',
        totals: {
          targetCount: targets.length || 2,
          evaluated: targets.length || 2,
          executable: targets.length || 2,
          unchanged: 0,
          blocked: 0,
          denied: 0,
          invalid: 0,
          conflict: 0,
          unknown: 0,
        },
        redactedIntent: reqBody?.parameters || {},
        diagnostics: [],
        evidence: [],
      }),
    });
  });

  await page.route('**/api/human-resources/eventos-folha/bulk-proposals/**/results**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { id: 2, decision: 'EXECUTABLE', diagnostics: [] },
          { id: 3, decision: 'EXECUTABLE', diagnostics: [] },
        ],
        nextCursor: null,
      }),
    });
  });

  await page.route('**/api/human-resources/eventos-folha/actions/bulk-approve', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        executionId: 'exec-eventos-folha-2026',
        proposalId: 'prop-eventos-folha-2026',
        operationRef: {
          operationId: 'human-resources.eventos-folha.bulk-approve',
          path: '/api/human-resources/eventos-folha/actions/bulk-approve',
          method: 'POST',
        },
        mode: 'DOMAIN_COMMAND',
        executionMode: 'SYNC',
        atomicity: 'PER_ITEM',
        status: 'COMPLETED',
        createdAt: '2026-10-14T02:00:00Z',
        updatedAt: '2026-10-14T02:00:02Z',
        terminalAt: '2026-10-14T02:00:02Z',
        totals: {
          targetCount: 2,
          pending: 0,
          confirmed: 2,
          unchanged: 0,
          denied: 0,
          invalid: 0,
          conflict: 0,
          notProcessed: 0,
          unknown: 0,
        },
        diagnostics: [],
      }),
    });
  });

  await page.route('**/api/human-resources/eventos-folha/bulk-executions/**/results**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { id: 2, status: 'CONFIRMED', diagnostics: [] },
          { id: 3, status: 'CONFIRMED', diagnostics: [] },
        ],
        nextCursor: null,
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Capabilities + 2-Phase Evaluation/Confirmation routes for /operacoes/missao-participantes
  //    (Real UNIFORM_UPDATE contract and /schemas/filtered come from the real backend)
  // ---------------------------------------------------------------------------
  await page.route('**/api/operations/missao-participantes/capabilities**', async (route) => {
    const body = {
      resourceKey: 'operations.missao-participantes',
      resourcePath: '/api/operations/missao-participantes',
      group: 'api-operations-missao-participantes',
      resourceId: null,
      canonicalOperations: {
        update: true,
        delete: true,
        byId: true,
        cursor: true,
        filter: true,
        create: true,
        options: true,
        all: true,
      },
      operations: {
        'bulk-update': {
          id: 'bulk-update',
          supported: true,
          scope: 'COLLECTION',
          preferredMethod: 'POST',
          preferredRel: 'bulk-update',
          availability: {
            allowed: true,
            reason: null,
            metadata: {},
          },
          bulk: {
            mode: 'UNIFORM_UPDATE',
            atomicity: 'PER_ITEM',
            selectionModes: ['EXPLICIT'],
            executionModes: ['SYNC', 'ASYNC'],
            limits: {
              maxTargets: 200,
              maxRequestBytes: 8388608,
              proposalLifetimeMillis: 300000,
              unitDeadlineMillis: 5000,
            },
            evaluationOperation: {
              operation: {
                group: 'api-operations-missao-participantes',
                operationId: 'operations.missao-participantes.bulk-update-evaluate',
                path: '/api/operations/missao-participantes/bulk/update/evaluation',
                method: 'POST',
              },
              requestSchema: {
                schemaId: 'bulk-update-eval-req',
                schemaType: 'request',
                url: '/schemas/filtered?path=%2Fapi%2Foperations%2Fmissao-participantes%2Fbulk%2Fupdate%2Fevaluation&operation=post&schemaType=request&idField=proposalId&readOnly=false',
              },
              responseSchema: {
                schemaId: 'bulk-update-eval-res',
                schemaType: 'response',
                url: '/schemas/filtered?path=%2Fapi%2Foperations%2Fmissao-participantes%2Fbulk%2Fupdate%2Fevaluation&operation=post&schemaType=response&idField=proposalId&readOnly=false',
              },
            },
            confirmationOperation: {
              operation: {
                group: 'api-operations-missao-participantes',
                operationId: 'operations.missao-participantes.bulk-update',
                path: '/api/operations/missao-participantes/bulk/update',
                method: 'POST',
              },
              requestSchema: {
                schemaId: 'bulk-update-confirm-req',
                schemaType: 'request',
                url: '/schemas/filtered?path=%2Fapi%2Foperations%2Fmissao-participantes%2Fbulk%2Fupdate&operation=post&schemaType=request&idField=executionId&readOnly=false',
              },
              responseSchema: {
                schemaId: 'bulk-update-confirm-res',
                schemaType: 'response',
                url: '/schemas/filtered?path=%2Fapi%2Foperations%2Fmissao-participantes%2Fbulk%2Fupdate&operation=post&schemaType=response&idField=executionId&readOnly=false',
              },
            },
            proposalOperation: {
              operation: {
                group: 'api-operations-missao-participantes',
                operationId: 'operations.missao-participantes.bulk-proposal-read',
                path: '/api/operations/missao-participantes/bulk/proposals/{proposalId}',
                method: 'GET',
              },
              responseSchema: {
                schemaId: 'bulk-proposal-res',
                schemaType: 'response',
                url: '/schemas/filtered?path=%2Fapi%2Foperations%2Fmissao-participantes%2Fbulk%2Fproposals%2F%7BproposalId%7D&operation=get&schemaType=response&idField=proposalId&readOnly=true',
              },
            },
            proposalResultsOperation: {
              operation: {
                group: 'api-operations-missao-participantes',
                operationId: 'operations.missao-participantes.bulk-proposal-results',
                path: '/api/operations/missao-participantes/bulk/proposals/{proposalId}/results',
                method: 'GET',
              },
              responseSchema: {
                schemaId: 'bulk-proposal-results-res',
                schemaType: 'response',
                url: '/schemas/filtered?path=%2Fapi%2Foperations%2Fmissao-participantes%2Fbulk%2Fproposals%2F%7BproposalId%7D%2Fresults&operation=get&schemaType=response&idField=id&readOnly=true',
              },
            },
            executionOperation: {
              operation: {
                group: 'api-operations-missao-participantes',
                operationId: 'operations.missao-participantes.bulk-execution-read',
                path: '/api/operations/missao-participantes/bulk/executions/{executionId}',
                method: 'GET',
              },
              responseSchema: {
                schemaId: 'bulk-execution-res',
                schemaType: 'response',
                url: '/schemas/filtered?path=%2Fapi%2Foperations%2Fmissao-participantes%2Fbulk%2Fexecutions%2F%7BexecutionId%7D&operation=get&schemaType=response&idField=executionId&readOnly=true',
              },
            },
            resultsOperation: {
              operation: {
                group: 'api-operations-missao-participantes',
                operationId: 'operations.missao-participantes.bulk-execution-results',
                path: '/api/operations/missao-participantes/bulk/executions/{executionId}/results',
                method: 'GET',
              },
              responseSchema: {
                schemaId: 'bulk-execution-results-res',
                schemaType: 'response',
                url: '/schemas/filtered?path=%2Fapi%2Foperations%2Fmissao-participantes%2Fbulk%2Fexecutions%2F%7BexecutionId%7D%2Fresults&operation=get&schemaType=response&idField=id&readOnly=true',
              },
            },
            cancelOperation: {
              operation: {
                group: 'api-operations-missao-participantes',
                operationId: 'operations.missao-participantes.bulk-execution-cancel',
                path: '/api/operations/missao-participantes/bulk/executions/{executionId}/cancel',
                method: 'POST',
              },
              responseSchema: {
                schemaId: 'bulk-execution-cancel-res',
                schemaType: 'response',
                url: '/schemas/filtered?path=%2Fapi%2Foperations%2Fmissao-participantes%2Fbulk%2Fexecutions%2F%7BexecutionId%7D%2Fcancel&operation=post&schemaType=response&idField=executionId&readOnly=true',
              },
            },
            editableFields: {
              sourceOperation: {
                group: 'api-operations-missao-participantes',
                operationId: 'operations.missao-participantes.update',
                path: '/api/operations/missao-participantes/{id}',
                method: 'PUT',
              },
              requestSchema: {
                schemaId: '/api/operations/missao-participantes/{id}|put|request|internal:false|idField:id|readOnly:false',
                schemaType: 'request',
                url: '/schemas/filtered?path=%2Fapi%2Foperations%2Fmissao-participantes%2F%7Bid%7D&operation=put&schemaType=request&idField=id&readOnly=false',
              },
              writableFields: ['papel', 'resultado'],
              clearableFields: ['resultado'],
            },
          },
        },
      },
      actions: [],
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  await page.route('**/api/operations/missao-participantes/bulk/update/evaluation**', async (route) => {
    const reqBody = route.request().postDataJSON();
    const targets = reqBody?.selection?.targets || [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        proposalId: 'prop-missao-participantes-2026',
        operationRef: {
          operationId: 'confirmBulkUpdate',
          path: '/api/operations/missao-participantes/bulk/update',
          method: 'POST',
        },
        mode: 'UNIFORM_UPDATE',
        executionMode: 'SYNC',
        atomicity: 'PER_ITEM',
        status: 'READY',
        createdAt: '2026-10-14T02:00:00Z',
        expiresAt: '2026-10-14T02:05:00Z',
        totals: {
          targetCount: targets.length || 2,
          evaluated: targets.length || 2,
          executable: targets.length || 2,
          unchanged: 0,
          blocked: 0,
          denied: 0,
          invalid: 0,
          conflict: 0,
          unknown: 0,
        },
        redactedIntent: { changes: reqBody?.changes || [] },
        diagnostics: [],
        evidence: [],
      }),
    });
  });

  const fulfillMissaoProposalResults = async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { id: 329, decision: 'EXECUTABLE', diagnostics: [] },
          { id: 330, decision: 'EXECUTABLE', diagnostics: [] },
        ],
        nextCursor: null,
      }),
    });
  };
  await page.route('**/api/operations/missao-participantes/bulk-proposals/**/results**', fulfillMissaoProposalResults);
  await page.route('**/api/operations/missao-participantes/bulk/proposals/**/results**', fulfillMissaoProposalResults);

  await page.route('**/api/operations/missao-participantes/bulk/update', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        executionId: 'exec-missao-participantes-2026',
        proposalId: 'prop-missao-participantes-2026',
        operationRef: {
          operationId: 'confirmBulkUpdate',
          path: '/api/operations/missao-participantes/bulk/update',
          method: 'POST',
        },
        mode: 'UNIFORM_UPDATE',
        executionMode: 'SYNC',
        atomicity: 'PER_ITEM',
        status: 'COMPLETED',
        createdAt: '2026-10-14T02:00:00Z',
        updatedAt: '2026-10-14T02:00:02Z',
        terminalAt: '2026-10-14T02:00:02Z',
        totals: {
          targetCount: 2,
          pending: 0,
          confirmed: 2,
          unchanged: 0,
          denied: 0,
          invalid: 0,
          conflict: 0,
          notProcessed: 0,
          unknown: 0,
        },
        diagnostics: [],
      }),
    });
  });

  const fulfillMissaoExecutionResults = async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { id: 329, status: 'CONFIRMED', diagnostics: [] },
          { id: 330, status: 'CONFIRMED', diagnostics: [] },
        ],
        nextCursor: null,
      }),
    });
  };
  await page.route('**/api/operations/missao-participantes/bulk-executions/**/results**', fulfillMissaoExecutionResults);
  await page.route('**/api/operations/missao-participantes/bulk/executions/**/results**', fulfillMissaoExecutionResults);

  // ---------------------------------------------------------------------------
  // 3. Capabilities + 2-Phase Evaluation/Confirmation routes for /rh/afastamentos
  //    (Collection rows and /schemas/filtered come from the real backend)
  // ---------------------------------------------------------------------------
  await page.route('**/api/human-resources/ferias-afastamentos/capabilities**', async (route) => {
    const body = {
      resourceKey: 'human-resources.ferias-afastamentos',
      resourcePath: '/api/human-resources/ferias-afastamentos',
      group: 'api-human-resources-ferias-afastamentos',
      resourceId: null,
      canonicalOperations: {
        update: true,
        delete: true,
        byId: true,
        cursor: true,
        filter: true,
        create: true,
        options: true,
        all: true,
      },
      operations: {
        'bulk-plan-coverage': {
          id: 'bulk-plan-coverage',
          supported: true,
          scope: 'COLLECTION',
          preferredMethod: 'POST',
          availability: { allowed: true, reason: null, metadata: {} },
        },
      },
      actions: [
        {
          id: 'bulk-plan-coverage',
          title: 'Planejar cobertura de ausências em lote',
          scope: 'COLLECTION',
          availability: { allowed: true, reason: null, metadata: {} },
          execution: {
            bulk: {
              mode: 'DOMAIN_COMMAND',
              atomicity: 'PER_ITEM',
              selectionModes: ['EXPLICIT'],
              executionModes: ['SYNC'],
              parametersPointer: '/properties/parameters',
              limits: {
                maxTargets: 25,
                maxRequestBytes: 65536,
                proposalLifetimeMillis: 300000,
                unitDeadlineMillis: 5000,
              },
              evaluationOperation: {
                operation: {
                  operationId: 'evaluateBulkCoveragePlan',
                  path: '/api/human-resources/ferias-afastamentos/actions/bulk-plan-coverage/evaluation',
                  method: 'POST',
                },
                requestSchema: {
                  schemaId: 'bulk-plan-coverage-eval-req',
                  schemaType: 'request',
                  url: '/schemas/filtered?path=%2Fapi%2Fhuman-resources%2Fferias-afastamentos%2Factions%2Fbulk-plan-coverage%2Fevaluation&operation=post&schemaType=request&idField=id&readOnly=false',
                },
                responseSchema: {
                  schemaId: 'bulk-plan-coverage-eval-res',
                  schemaType: 'response',
                  url: '/schemas/filtered?path=%2Fapi%2Fhuman-resources%2Fferias-afastamentos%2Factions%2Fbulk-plan-coverage%2Fevaluation&operation=post&schemaType=response&idField=id&readOnly=false',
                },
              },
              confirmationOperation: {
                operation: {
                  operationId: 'human-resources.ferias-afastamentos.bulk-plan-coverage',
                  path: '/api/human-resources/ferias-afastamentos/actions/bulk-plan-coverage',
                  method: 'POST',
                },
                responseSchema: {
                  schemaId: 'bulk-plan-coverage-confirm-res',
                  schemaType: 'response',
                  url: '/schemas/filtered?path=%2Fapi%2Fhuman-resources%2Fferias-afastamentos%2Factions%2Fbulk-plan-coverage&operation=post&schemaType=response&idField=id&readOnly=false',
                },
              },
              proposalOperation: {
                operation: {
                  operationId: 'getBulkProposal',
                  path: '/api/human-resources/ferias-afastamentos/bulk-proposals/{proposalId}',
                  method: 'GET',
                },
                responseSchema: {
                  schemaId: 'bulk-proposal-res',
                  schemaType: 'response',
                  url: '/schemas/filtered?id=bulk-proposal-res',
                },
              },
              proposalResultsOperation: {
                operation: {
                  operationId: 'getBulkProposalResults',
                  path: '/api/human-resources/ferias-afastamentos/bulk-proposals/{proposalId}/results',
                  method: 'GET',
                },
                responseSchema: {
                  schemaId: 'bulk-proposal-results-res',
                  schemaType: 'response',
                  url: '/schemas/filtered?id=bulk-proposal-results-res',
                },
              },
              executionOperation: {
                operation: {
                  operationId: 'getBulkExecution',
                  path: '/api/human-resources/ferias-afastamentos/bulk-executions/{executionId}',
                  method: 'GET',
                },
                responseSchema: {
                  schemaId: 'bulk-execution-res',
                  schemaType: 'response',
                  url: '/schemas/filtered?id=bulk-execution-res',
                },
              },
              resultsOperation: {
                operation: {
                  operationId: 'getBulkExecutionResults',
                  path: '/api/human-resources/ferias-afastamentos/bulk-executions/{executionId}/results',
                  method: 'GET',
                },
                responseSchema: {
                  schemaId: 'bulk-execution-results-res',
                  schemaType: 'response',
                  url: '/schemas/filtered?id=bulk-execution-results-res',
                },
              },
              cancelOperation: {
                operation: {
                  operationId: 'cancelBulkExecution',
                  path: '/api/human-resources/ferias-afastamentos/bulk-executions/{executionId}/cancel',
                  method: 'POST',
                },
                responseSchema: {
                  schemaId: 'bulk-execution-cancel-res',
                  schemaType: 'response',
                  url: '/schemas/filtered?id=bulk-execution-cancel-res',
                },
              },
            },
          },
        },
      ],
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  await page.route('**/api/human-resources/ferias-afastamentos/actions/bulk-plan-coverage/evaluation**', async (route) => {
    const reqBody = route.request().postDataJSON();
    const targets = reqBody?.selection?.targets || [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        proposalId: 'prop-ferias-afastamentos-2026',
        operationRef: {
          operationId: 'human-resources.ferias-afastamentos.bulk-plan-coverage',
          path: '/api/human-resources/ferias-afastamentos/actions/bulk-plan-coverage',
          method: 'POST',
        },
        mode: 'DOMAIN_COMMAND',
        executionMode: 'SYNC',
        atomicity: 'PER_ITEM',
        status: 'READY',
        createdAt: '2026-10-14T02:00:00Z',
        expiresAt: '2026-10-14T02:05:00Z',
        totals: {
          targetCount: targets.length || 2,
          evaluated: targets.length || 2,
          executable: targets.length || 2,
          unchanged: 0,
          blocked: 0,
          denied: 0,
          invalid: 0,
          conflict: 0,
          unknown: 0,
        },
        redactedIntent: reqBody?.parameters || {},
        diagnostics: [],
        evidence: [],
      }),
    });
  });

  const fulfillFaProposalResults = async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { id: 109, decision: 'EXECUTABLE', diagnostics: [] },
          { id: 111, decision: 'EXECUTABLE', diagnostics: [] },
        ],
        nextCursor: null,
      }),
    });
  };
  await page.route('**/api/human-resources/ferias-afastamentos/bulk-proposals/**/results**', fulfillFaProposalResults);
  await page.route('**/api/human-resources/ferias-afastamentos/bulk/proposals/**/results**', fulfillFaProposalResults);

  await page.route('**/api/human-resources/ferias-afastamentos/actions/bulk-plan-coverage', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        executionId: 'exec-ferias-afastamentos-2026',
        proposalId: 'prop-ferias-afastamentos-2026',
        operationRef: {
          operationId: 'human-resources.ferias-afastamentos.bulk-plan-coverage',
          path: '/api/human-resources/ferias-afastamentos/actions/bulk-plan-coverage',
          method: 'POST',
        },
        mode: 'DOMAIN_COMMAND',
        executionMode: 'SYNC',
        atomicity: 'PER_ITEM',
        status: 'COMPLETED',
        createdAt: '2026-10-14T02:00:00Z',
        updatedAt: '2026-10-14T02:00:02Z',
        terminalAt: '2026-10-14T02:00:02Z',
        totals: {
          targetCount: 2,
          pending: 0,
          confirmed: 2,
          unchanged: 0,
          denied: 0,
          invalid: 0,
          conflict: 0,
          notProcessed: 0,
          unknown: 0,
        },
        diagnostics: [],
      }),
    });
  });

  const fulfillFaExecutionResults = async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { id: 109, status: 'CONFIRMED', diagnostics: [] },
          { id: 111, status: 'CONFIRMED', diagnostics: [] },
        ],
        nextCursor: null,
      }),
    });
  };
  await page.route('**/api/human-resources/ferias-afastamentos/bulk-executions/**/results**', fulfillFaExecutionResults);
  await page.route('**/api/human-resources/ferias-afastamentos/bulk/executions/**/results**', fulfillFaExecutionResults);

  try {
    // 1. Configurar persona e tema
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('praxis:auth:current-persona', 'nick.fury');
      localStorage.setItem('praxis_hero_hq_theme', 'dark-tech');
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'dark-tech';
    });

    console.log('\n[Cenário 1] Acessando Eventos de Folha (/rh/eventos-folha)...');
    await page.goto(`${BASE_URL}/rh/eventos-folha`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);

    const titleEl = page.locator('h1, .praxis-resource-page__title').first();
    assert((await titleEl.count()) > 0, 'Página Eventos de Folha carregada');

    // 2. Selecionar linhas na tabela
    console.log('\n[Cenário 2] Selecionando registros reais para operação em lote...');
    const rowCheckboxes = page.locator('praxis-table tbody tr td.mat-column-_select mat-checkbox');
    const checkboxCount = await rowCheckboxes.count();
    console.log(`  Encontrados ${checkboxCount} checkboxes de linha na tabela.`);
    assert(checkboxCount >= 2, 'Ao menos 2 checkboxes de linha disponíveis na tabela');

    await rowCheckboxes.nth(0).click();
    await page.waitForTimeout(400);
    await rowCheckboxes.nth(1).click();
    await page.waitForTimeout(800);

    const bulkToolbar = page.locator('.praxis-table__bulk-actions, [data-testid="bulk-actions-toolbar"], [class*="bulk"]').first();
    assert((await bulkToolbar.count()) > 0, 'Barra de ações em lote visível após seleção');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-table-selection.png') });
    console.log('  [SCREENSHOT] 01-table-selection.png capturado.');

    // 3. Testar Comando de Domínio Canônico: Aprovar eventos de folha em lote (bulk-approve)
    console.log('\n[Cenário 3] Disparando comando de domínio real (Aprovar eventos de folha em lote)...');
    const approveBtn = page.locator('button').filter({ hasText: /Aprovar eventos de folha em lote/i }).first();
    await approveBtn.waitFor({ state: 'visible', timeout: 15000 });
    assert((await approveBtn.count()) > 0, 'Botão "Aprovar eventos de folha em lote" visível na barra de ações');
    await approveBtn.click();
    await page.waitForTimeout(2000);

    const dialogPane = page.locator('.cdk-overlay-pane.praxis-bulk-dialog-panel').first();
    assert((await dialogPane.count()) > 0, 'Modal de operação em lote aberto no DOM');

    // Validar Passo 1: Parâmetros reais desempacotados de /properties/parameters (effectiveAt, reasonCode, comment)
    const paramInputs = dialogPane.locator('input, textarea');
    await paramInputs.first().waitFor({ state: 'visible', timeout: 25000 });
    assert((await paramInputs.count()) >= 2, 'Campos de parâmetros reais (effectiveAt, reasonCode, comment) renderizados via /schemas/filtered');
    await paramInputs.nth(0).fill('2026-10-14');
    if ((await paramInputs.count()) >= 2) {
      await paramInputs.nth(1).fill('FECHAMENTO_CONFERIDO');
    }
    const commentTextarea = dialogPane.locator('textarea').first();
    if ((await commentTextarea.count()) > 0) {
      await commentTextarea.fill('Homologação em lote de eventos auditados da folha mensal');
    }
    await page.waitForTimeout(400);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-domain-command-step1.png') });
    console.log('  [SCREENSHOT] 02-domain-command-step1.png capturado.');

    const evaluateBtn = dialogPane.locator('button').filter({ hasText: /Avaliar/i }).first();
    await evaluateBtn.click();
    await page.waitForTimeout(1200);

    // Validar Passo 2: Prévia e Conformidade
    const previewTitle = dialogPane.locator('.praxis-bulk-dialog__section-title').first();
    const previewText = await previewTitle.innerText();
    assert(/Conformidade/i.test(previewText), 'Passo 2 de Conformidade e Prévia renderizado');

    const totalCards = dialogPane.locator('.praxis-bulk-dialog__total-card');
    assert((await totalCards.count()) === 3, 'Grid com 3 cartões de métricas renderizado');

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

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-domain-command-step3-result.png') });
    console.log('  [SCREENSHOT] 04-domain-command-step3-result.png capturado.');

    const closeBtn = dialogPane.locator('button').filter({ hasText: /Concluir/i }).first();
    await closeBtn.click();
    await page.waitForTimeout(1000);
    assert((await dialogPane.count()) === 0, 'Modal fechado com sucesso');

    // 4. Testar Atualização de Registros em Massa (UNIFORM_UPDATE) em /operacoes/missao-participantes
    console.log('\n[Cenário 4] Testando Atualização em Massa (UNIFORM_UPDATE) em /operacoes/missao-participantes...');
    await page.goto(`${BASE_URL}/operacoes/missao-participantes`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);

    const mpCheckboxes = page.locator('praxis-table tbody tr td.mat-column-_select mat-checkbox');
    await mpCheckboxes.first().waitFor({ state: 'visible', timeout: 15000 });
    assert((await mpCheckboxes.count()) >= 2, 'Checkboxes presentes na tabela de Participantes de Missão');

    await mpCheckboxes.nth(0).click();
    await page.waitForTimeout(300);
    await mpCheckboxes.nth(1).click();
    await page.waitForTimeout(800);

    const uniformBtn = page.locator('button').filter({ hasText: /Editar Selecionados/i }).first();
    await uniformBtn.waitFor({ state: 'visible', timeout: 15000 });
    assert((await uniformBtn.count()) > 0, 'Botão "Editar Selecionados" (UNIFORM_UPDATE) presente');
    await uniformBtn.click();
    await page.waitForTimeout(2000);

    const editDialogPane = page.locator('.cdk-overlay-pane.praxis-bulk-dialog-panel').first();
    assert((await editDialogPane.count()) > 0, 'Modal de Edição em Massa aberto no DOM');

    const editTitle = await editDialogPane.locator('#praxis-bulk-edit-dialog-title').innerText();
    assert(/Atualização de Registros em Massa/i.test(editTitle), 'Título executivo "Atualização de Registros em Massa" verificado');

    // Testar validação corporativa de integridade: tentar avaliar com valor em branco
    const evaluateEditBtn = editDialogPane.locator('button').filter({ hasText: /Avaliar/i }).first();
    await evaluateEditBtn.click();
    await page.waitForTimeout(500);
    const validationAlert = editDialogPane.locator('.praxis-bulk-edit-dialog__alert--error').first();
    assert((await validationAlert.count()) > 0, 'Validação de integridade bloqueou submissão com valor em branco');

    // Selecionar valor válido no enum "Papel" hidratado do /schemas/filtered
    const valueSelect = editDialogPane.locator('.value-input mat-select').first();
    if ((await valueSelect.count()) > 0) {
      await valueSelect.click();
      await page.waitForTimeout(300);
      const option = page.locator('mat-option').filter({ hasText: /LIDER/i }).first();
      await option.click();
      await page.waitForTimeout(400);
    } else {
      const valueInput = editDialogPane.locator('.value-input input').first();
      await valueInput.fill('LIDER');
      await page.waitForTimeout(400);
    }

    // Adicionar o segundo campo homologado (resultado) com operador CLEAR
    const addFieldBtn = editDialogPane.locator('button').filter({ hasText: /Adicionar Campo/i }).first();
    if ((await addFieldBtn.count()) > 0 && !(await addFieldBtn.isDisabled())) {
      await addFieldBtn.click();
      await page.waitForTimeout(300);
      const secondOperatorSelect = editDialogPane.locator('.field-row').nth(1).locator('.operator-select mat-select');
      await secondOperatorSelect.click();
      await page.waitForTimeout(300);
      const clearOption = page.locator('mat-option').filter({ hasText: /Limpar \(CLEAR\)/i }).first();
      if ((await clearOption.count()) > 0) {
        await clearOption.click();
        await page.waitForTimeout(400);
      }
    }

    // Screenshot Passo 1: Edição em Massa com campos reais (papel=LIDER, resultado=CLEAR)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-uniform-update-step1-fields.png') });
    console.log('  [SCREENSHOT] 05-uniform-update-step1-fields.png capturado.');

    // Avaliar alterações
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

    // 5. Testar Comando de Domínio Multi-Parâmetro: Férias e Afastamentos (/rh/afastamentos -> bulk-plan-coverage)
    console.log('\n[Cenário 5] Testando Planejamento de Cobertura em Lote em /rh/afastamentos...');
    await page.goto(`${BASE_URL}/rh/afastamentos`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);

    const faCheckboxes = page.locator('praxis-table tbody tr td.mat-column-_select mat-checkbox');
    await faCheckboxes.first().waitFor({ state: 'visible', timeout: 15000 });
    const faCount = await faCheckboxes.count();
    assert(faCount >= 2, `Checkboxes presentes na tabela de Férias e Afastamentos (${faCount} encontrados)`);

    await faCheckboxes.nth(0).click();
    await page.waitForTimeout(300);
    await faCheckboxes.nth(1).click();
    await page.waitForTimeout(800);

    const coverageBtn = page.locator('button').filter({ hasText: /Planejar cobertura de ausências em lote/i }).first();
    await coverageBtn.waitFor({ state: 'visible', timeout: 15000 });
    assert((await coverageBtn.count()) > 0, 'Botão "Planejar cobertura de ausências em lote" presente na barra de ações');
    await coverageBtn.click();
    await page.waitForTimeout(2000);

    const coverageDialogPane = page.locator('.cdk-overlay-pane.praxis-bulk-dialog-panel').first();
    assert((await coverageDialogPane.count()) > 0, 'Modal de Planejamento de Cobertura aberto no DOM');
    const coverageTitle = await coverageDialogPane.locator('#praxis-bulk-dialog-title').innerText();
    assert(/Planejar cobertura de ausências em lote/i.test(coverageTitle), 'Título de planejamento de cobertura verificado');

    // Preencher parâmetros reais do /schemas/filtered (coveragePlan, operationalNotes)
    const coverageInputs = coverageDialogPane.locator('textarea, input');
    await coverageInputs.first().waitFor({ state: 'visible', timeout: 25000 });
    assert((await coverageInputs.count()) >= 1, 'Campos de parâmetros reais de cobertura renderizados via /schemas/filtered');
    const coverageTextareas = coverageDialogPane.locator('textarea');
    if ((await coverageTextareas.count()) > 0) {
      await coverageTextareas.first().fill('Redistribuição tática entre esquadrão reserva');
    } else {
      await coverageInputs.first().fill('Redistribuição tática entre esquadrão reserva');
    }
    await page.waitForTimeout(400);

    const evaluateCoverageBtn = coverageDialogPane.locator('button').filter({ hasText: /Avaliar/i }).first();
    await evaluateCoverageBtn.click();
    await page.waitForTimeout(1200);

    // Confirmar execução
    const confirmCoverageBtn = coverageDialogPane.locator('button').filter({ hasText: /Confirmar/i }).first();
    await confirmCoverageBtn.click();
    await page.waitForTimeout(1200);

    const coverageSuccessAlert = coverageDialogPane.locator('.praxis-bulk-dialog__alert--success').first();
    assert((await coverageSuccessAlert.count()) > 0, 'Planejamento de cobertura de ausências homologado com êxito');

    const closeCoverageBtn = coverageDialogPane.locator('button').filter({ hasText: /Concluir/i }).first();
    await closeCoverageBtn.click();
    await page.waitForTimeout(800);
    assert((await coverageDialogPane.count()) === 0, 'Modal de Planejamento de Cobertura concluído e fechado');

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
