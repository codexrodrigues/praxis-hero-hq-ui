import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import type { BulkExecution, BulkProposal, RestApiResponse } from '@praxisui/core';

/**
 * Interceptor mock corporativo para operações em lote governadas no host Praxis Hero HQ.
 *
 * Simula de forma dinâmica as 2 fases do protocolo canônico de operações em lote da plataforma Praxis:
 * 1. Avaliação prévia com retorno de proposta imutável (BulkProposal).
 * 2. Confirmação atômica com chave de idempotência e snapshot final (BulkExecution).
 */
export const praxisBulkOperationsMockInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const url = req.url;

  // Fase 1: Avaliação de Proposta em Lote (Domain Command ou Uniform Update)
  const isEvaluation =
    (url.includes('/bulk/') && url.includes('/evaluation')) ||
    (url.includes('/bulk-operations/') && url.includes('/evaluate'));

  if (isEvaluation && req.method === 'POST') {
    const body = req.body as { selection?: { targets?: Array<{ id: string | number }> }; changes?: unknown[] } | null;
    const targetCount = body?.selection?.targets?.length || 2;
    const isUniform = url.includes('update') || Boolean(body?.changes);

    const proposal: BulkProposal = {
      proposalId: `prop-${Date.now()}`,
      operationRef: {
        operationId: `evaluate-${Date.now()}`,
        path: url,
        method: 'POST',
      },
      mode: isUniform ? 'UNIFORM_UPDATE' : 'DOMAIN_COMMAND',
      executionMode: 'SYNC',
      atomicity: 'PER_ITEM',
      status: 'READY',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300000).toISOString(),
      totals: {
        targetCount,
        evaluated: targetCount,
        executable: targetCount,
        blocked: 0,
      },
      redactedIntent: {},
      diagnostics: [],
      evidence: [],
    };

    const response: RestApiResponse<BulkProposal> = {
      status: 'success',
      data: proposal,
    };
    return of(new HttpResponse({ status: 200, body: response })).pipe(delay(120));
  }

  // Fase 2: Confirmação e Execução em Lote
  const isConfirmation =
    (url.includes('/bulk/') && url.includes('/confirmation')) ||
    (url.includes('/bulk-operations/') && url.includes('/confirm'));

  if (isConfirmation && req.method === 'POST') {
    const body = req.body as { proposalId?: string } | null;
    const isUniform = url.includes('update');

    const execution: BulkExecution = {
      executionId: `exec-${Date.now()}`,
      proposalId: body?.proposalId || `prop-${Date.now()}`,
      operationRef: {
        operationId: `confirm-${Date.now()}`,
        path: url,
        method: 'POST',
      },
      mode: isUniform ? 'UNIFORM_UPDATE' : 'DOMAIN_COMMAND',
      executionMode: 'SYNC',
      atomicity: 'PER_ITEM',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      terminalAt: new Date().toISOString(),
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
    };

    const response: RestApiResponse<BulkExecution> = {
      status: 'success',
      data: execution,
    };
    return of(new HttpResponse({ status: 200, body: response })).pipe(delay(150));
  }

  return next(req);
};
