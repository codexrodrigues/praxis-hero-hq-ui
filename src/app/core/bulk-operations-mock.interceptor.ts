import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import type { BulkExecution, BulkProposal, RestApiResponse } from '@praxisui/core';

/**
 * Interceptor mock corporativo para operações em lote governadas no host Praxis Hero HQ.
 *
 * Simula as 2 fases do protocolo de operações em lote da plataforma Praxis:
 * 1. Avaliação prévia com retorno de proposta imutável (BulkProposal).
 * 2. Confirmação atômica com chave de idempotência e snapshot final (BulkExecution).
 */
export const praxisBulkOperationsMockInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const url = req.url;

  // Fase 1 (Avaliação) - Comando de Domínio: Conter Incidentes Selecionados
  if (url.includes('/api/operations/incidentes/bulk/contain/evaluation') && req.method === 'POST') {
    const body = req.body as { selection?: { targets?: Array<{ id: string | number }> } } | null;
    const targetCount = body?.selection?.targets?.length || 1;
    const proposal: BulkProposal = {
      proposalId: `prop-contain-${Date.now()}`,
      operationRef: {
        operationId: 'contain-incidentes',
        path: '/api/operations/incidentes/bulk/contain/evaluation',
        method: 'POST',
      },
      mode: 'DOMAIN_COMMAND',
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
    return of(new HttpResponse({ status: 200, body: response })).pipe(delay(150));
  }

  // Fase 2 (Confirmação) - Comando de Domínio: Conter Incidentes Selecionados
  if (url.includes('/api/operations/incidentes/bulk/contain/confirmation') && req.method === 'POST') {
    const body = req.body as { proposalId?: string } | null;
    const execution: BulkExecution = {
      executionId: `exec-contain-${Date.now()}`,
      proposalId: body?.proposalId || 'prop-default',
      operationRef: {
        operationId: 'confirm-contain-incidentes',
        path: '/api/operations/incidentes/bulk/contain/confirmation',
        method: 'POST',
      },
      mode: 'DOMAIN_COMMAND',
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
    return of(new HttpResponse({ status: 200, body: response })).pipe(delay(200));
  }

  // Fase 1 (Avaliação) - Atualização Uniforme: Ajustar Severidade em Lote
  if (url.includes('/api/operations/incidentes/bulk/update/evaluation') && req.method === 'POST') {
    const body = req.body as { selection?: { targets?: Array<{ id: string | number }> } } | null;
    const targetCount = body?.selection?.targets?.length || 1;
    const proposal: BulkProposal = {
      proposalId: `prop-update-${Date.now()}`,
      operationRef: {
        operationId: 'evaluate-update-incidentes',
        path: '/api/operations/incidentes/bulk/update/evaluation',
        method: 'POST',
      },
      mode: 'UNIFORM_UPDATE',
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
    return of(new HttpResponse({ status: 200, body: response })).pipe(delay(150));
  }

  // Fase 2 (Confirmação) - Atualização Uniforme: Ajustar Severidade em Lote
  if (url.includes('/api/operations/incidentes/bulk/update/confirmation') && req.method === 'POST') {
    const body = req.body as { proposalId?: string } | null;
    const execution: BulkExecution = {
      executionId: `exec-update-${Date.now()}`,
      proposalId: body?.proposalId || 'prop-default',
      operationRef: {
        operationId: 'confirm-update-incidentes',
        path: '/api/operations/incidentes/bulk/update/confirmation',
        method: 'POST',
      },
      mode: 'UNIFORM_UPDATE',
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
    return of(new HttpResponse({ status: 200, body: response })).pipe(delay(200));
  }

  return next(req);
};
