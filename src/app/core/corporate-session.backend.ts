import { FetchBackend, HttpBackend, HttpXhrBackend, type HttpEvent, type HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { corporateRequestPath } from './corporate-session-target';

/** Keep legacy XHR/progress behavior; only corporate requests need Fetch's redirect rejection. */
@Injectable()
export class CorporateSessionBackend extends HttpBackend {
  private readonly corporate = inject(FetchBackend);
  private readonly legacy = inject(HttpXhrBackend);

  override handle(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    return corporateRequestPath(request.url) !== null
      ? this.corporate.handle(request.clone({ redirect: 'error' }))
      : this.legacy.handle(request);
  }
}
