import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthSimulationService } from './auth-simulation.service';
import { canAccessTacticalPage } from './tactical-access';

/**
 * Guard de autorização tática baseado na credencial de segurança (Clearance Level)
 * da persona ativa no AuthSimulationService.
 *
 * Exemplo de uso em rotas:
 * ```typescript
 * {
 *   path: 'rh/folha-pagamento',
 *   canActivate: [tacticalClearanceGuard],
 *   data: {
 *     clearance: 'DEFCON 1',
 *     title: 'Folha de Pagamento',
 *   }
 * }
 * ```
 */
export const tacticalClearanceGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthSimulationService);
  const router = inject(Router);

  const requiredClearance = (route.data?.['clearance'] as string | undefined)?.trim();
  if (!requiredClearance) {
    return true;
  }

  const currentPersona = authService.currentPersona();
  const isAuthorized = canAccessTacticalPage(currentPersona.clearance, requiredClearance);

  if (!isAuthorized) {
    console.warn(
      `[TACTICAL-SECURITY] Acesso negado para ${currentPersona.name} (${currentPersona.clearanceLevel}) à rota '${state.url}'. Nível de credencial requerido: ${requiredClearance}.`,
    );
    return router.parseUrl(`/?authDenied=true&resource=${encodeURIComponent(route.data?.['title'] || state.url)}`);
  }

  return true;
};

