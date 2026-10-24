import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { CorporateSessionService } from './corporate-session.service';
import { corporateRequestPath } from './corporate-session-target';

/** Exact API scope; neither demo headers nor a foreign response can acquire session authority. */
export const corporateSessionInterceptor: HttpInterceptorFn = (request, next) => {
  const path = corporateRequestPath(request.url);
  if (!path) return next(request);
  const session = inject(CorporateSessionService);
  const generation = session.generation();
  let headers = request.headers;
  const remove = new Set(['authorization', 'x-tenant', 'x-user', 'x-updated-by', 'x-xsrf-token']);
  if (!headers.get('X-Praxis-Context-Version') || path.startsWith('/auth/')) {
    ['x-tenant-id', 'x-user-id', 'x-env', 'x-praxis-profile-id', 'x-praxis-context-version'].forEach(name => remove.add(name));
  }
  for (const name of headers.keys()) if (remove.has(name.toLowerCase())) headers = headers.delete(name);
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const token = session.csrfToken(generation);
    if (token) headers = headers.set('X-XSRF-TOKEN', token);
    else if (path !== '/auth/login' && path !== '/auth/logout') {
      return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Corporate session required' }));
    }
  }
  return next(request.clone({ headers, withCredentials: true, redirect: 'error' })).pipe(catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse && error.status === 401) session.unauthorized(generation);
    return throwError(() => error);
  }));
};
