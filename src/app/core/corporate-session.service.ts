import { HttpBackend, HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EnterpriseRuntimeContextService } from '@praxisui/core';
import { PRAXIS_API_ORIGIN } from './platform.config';
import { corporateRequestPath } from './corporate-session-target';

export type CorporateSessionState = 'unknown' | 'authenticated' | 'anonymous' | 'unavailable' | 'logout-uncertain';

class SessionTransportNotReady extends Error {}

/** Host-owned cookie transport. No persona, password, cookie or grant is persisted here. */
@Injectable({ providedIn: 'root' })
export class CorporateSessionService {
  // Auth requests deliberately bypass interceptors: the interceptor consumes this service.
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly runtime = inject(EnterpriseRuntimeContextService);
  private readonly stateValue = signal<CorporateSessionState>('unknown');
  private readonly generationValue = signal(0);
  private readonly busyValue = signal(false);
  private readonly messageValue = signal('');
  private csrf: string | null = null;
  private unresolvedLogout = false;
  readonly state = this.stateValue.asReadonly();
  readonly generation = this.generationValue.asReadonly();
  readonly busy = this.busyValue.asReadonly();
  readonly message = this.messageValue.asReadonly();
  readonly authenticated = computed(() => this.state() === 'authenticated');

  /** The token is raw, memory-only and usable only by the current authenticated generation. */
  csrfToken(generation: number): string | null {
    return generation === this.generation() && this.authenticated() ? this.csrf : null;
  }

  async restore(): Promise<boolean> {
    if (this.busy()) return false;
    const generation = this.begin();
    try { return await this.verify(generation); }
    catch (error) { this.failed(generation, error, false); return false; }
    finally { this.finish(generation); }
  }

  async login(username: string, password: string): Promise<boolean> {
    if (this.busy() || this.unresolvedLogout) return false;
    const generation = this.begin();
    try {
      const response = await firstValueFrom(this.http.post<void>(`${PRAXIS_API_ORIGIN}/auth/login`,
        { username, password }, { withCredentials: true, redirect: 'error', observe: 'response' }));
      if (generation !== this.generation()) return false;
      if (response.status !== 204) throw new Error('Unexpected authentication status');
      // Only this independent request proves that the browser returned the SESSION cookie.
      return await this.verify(generation);
    } catch (error) { this.failed(generation, error, true); return false; }
    finally { this.finish(generation); }
  }

  async logout(): Promise<boolean> {
    if (this.busy()) return false;
    const previousToken = this.csrf;
    this.unresolvedLogout = true;
    const generation = this.begin();
    try {
      const headers = previousToken ? new HttpHeaders({ 'X-XSRF-TOKEN': previousToken }) : new HttpHeaders();
      const response = await firstValueFrom(this.http.post<void>(`${PRAXIS_API_ORIGIN}/auth/logout`, null,
        { headers, withCredentials: true, redirect: 'error', observe: 'response' }));
      if (generation !== this.generation()) return false;
      if (response.status !== 204) throw new Error('Unexpected logout status');
      try {
        await firstValueFrom(this.http.get<void>(`${PRAXIS_API_ORIGIN}/auth/session`,
          { withCredentials: true, redirect: 'error', observe: 'response' }));
      } catch (error) {
        if (generation !== this.generation()) return false;
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.unresolvedLogout = false;
          this.stateValue.set('anonymous');
          this.messageValue.set('Sessão encerrada neste navegador.');
          return true;
        }
        throw error;
      }
      throw new Error('Session remains available');
    } catch {
      if (generation === this.generation()) {
        this.stateValue.set('logout-uncertain');
        this.messageValue.set('Não foi possível confirmar a saída no servidor. O contexto foi limpo neste navegador. Verifique a sessão antes de continuar.');
      }
      return false;
    } finally { this.finish(generation); }
  }

  /** A late response from an earlier session cannot clear a newly confirmed session. */
  unauthorized(generation: number): void {
    if (generation !== this.generation()) return;
    this.generationValue.update(value => value + 1);
    // Invalidate all consumers synchronously, including active voice capture outside context pages.
    this.runtime.invalidate();
    this.csrf = null;
    this.stateValue.set(this.unresolvedLogout ? 'logout-uncertain' : 'anonymous');
    this.messageValue.set(this.unresolvedLogout
      ? 'A saída ainda não foi confirmada. Verifique a sessão ou tente sair novamente antes de entrar.'
      : 'A sessão terminou ou não está disponível. Entre novamente.');
  }

  private begin(): number {
    this.generationValue.update(value => value + 1);
    // Invalidate all consumers synchronously, including active voice capture outside context pages.
    this.runtime.invalidate();
    this.csrf = null;
    this.stateValue.set('unknown');
    this.messageValue.set('');
    this.busyValue.set(true);
    return this.generation();
  }
  private finish(_generation: number): void {
    // Auth exchanges are serialized even if another request invalidates their UI generation.
    // A late browser Set-Cookie cannot be cancelled by discarding a JavaScript callback.
    this.busyValue.set(false);
  }
  private async verify(generation: number): Promise<boolean> {
    const response = await firstValueFrom(this.http.get<void>(`${PRAXIS_API_ORIGIN}/auth/session`,
      { withCredentials: true, redirect: 'error', observe: 'response' }));
    if (generation !== this.generation()) return false;
    const token = response.headers.get('X-XSRF-TOKEN');
    if (response.status !== 204 || !response.url || corporateRequestPath(response.url) !== '/auth/session'
      || !token || !token.trim() || token.length > 512 || /[\r\n]/.test(token)) {
      throw new SessionTransportNotReady();
    }
    this.csrf = token;
    this.unresolvedLogout = false;
    this.stateValue.set('authenticated');
    return true;
  }
  private failed(generation: number, error: unknown, login: boolean): void {
    if (generation !== this.generation()) return;
    this.csrf = null;
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 401) this.unresolvedLogout = false;
    if (this.unresolvedLogout) {
      this.stateValue.set('logout-uncertain');
      this.messageValue.set('A saída ainda não foi confirmada. Verifique a sessão ou tente sair novamente antes de entrar.');
      return;
    }
    this.stateValue.set(status === 401 ? 'anonymous' : 'unavailable');
    this.messageValue.set(error instanceof SessionTransportNotReady
      ? 'A API não confirmou o transporte seguro desta sessão. A integração precisa ser verificada antes de continuar.'
      : status === 401
      ? login ? 'Não foi possível confirmar a entrada. Verifique suas credenciais e se o navegador aceita os cookies da API.' : 'Entre para consultar seu contexto de trabalho. As personas da demonstração não iniciam essa sessão.'
      : status === 403 ? 'A entrada foi recusada pelo servidor. Nenhuma permissão foi concedida.'
      : 'Não foi possível confirmar a sessão e seu transporte seguro. Tente novamente.');
  }
}
