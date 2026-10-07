import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface PersonaProfile {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly initials: string;
  readonly tenant: string;
  readonly token: string;
  readonly clearanceLevel: string;
  readonly badgeColor: string;
}

export const HERO_PERSONAS: readonly PersonaProfile[] = [
  {
    id: 'nick.fury',
    name: 'Nick Fury',
    role: 'Diretor Geral de RH & Operações',
    initials: 'NF',
    tenant: 'shield-hq',
    token: 'tactical-token-nick-fury-alpha',
    clearanceLevel: 'DEFCON 1 · Direção Executiva',
    badgeColor: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
  },
  {
    id: 'tony.stark',
    name: 'Tony Stark',
    role: 'Engenheiro Chefe & Consultor Tático',
    initials: 'TS',
    tenant: 'shield-hq',
    token: 'tactical-token-tony-stark-arc',
    clearanceLevel: 'DEFCON 2 · Engenharia & P&D',
    badgeColor: 'linear-gradient(135deg, #b91c1c, #f59e0b)',
  },
];

const STORAGE_KEYS = {
  USER_ID: 'praxis.demoUserId',
  USER_NAME: 'pax.api.user',
  TENANT: 'pax.api.tenant',
  TOKEN: 'pax.api.token',
} as const;

@Injectable({ providedIn: 'root' })
export class AuthSimulationService {
  private readonly router = inject(Router);

  private readonly activeUserId = signal<string>(this.resolveInitialUserId());

  readonly personas = HERO_PERSONAS;

  readonly currentPersona = computed<PersonaProfile>(() => {
    const id = this.activeUserId();
    return HERO_PERSONAS.find((p) => p.id === id) ?? HERO_PERSONAS[0];
  });

  constructor() {
    this.syncStorage(this.currentPersona());
  }

  private resolveInitialUserId(): string {
    if (typeof localStorage === 'undefined') {
      return HERO_PERSONAS[0].id;
    }
    const stored =
      localStorage.getItem(STORAGE_KEYS.USER_ID) ||
      localStorage.getItem(STORAGE_KEYS.USER_NAME);
    if (stored && HERO_PERSONAS.some((p) => p.id === stored)) {
      return stored;
    }
    return HERO_PERSONAS[0].id;
  }

  switchPersona(personaId: string): void {
    const target = HERO_PERSONAS.find((p) => p.id === personaId);
    if (!target || target.id === this.activeUserId()) {
      return;
    }

    this.activeUserId.set(target.id);
    this.syncStorage(target);

    // Dispara evento de armazenamento para que outros serviços e componentes reajam à troca de identidade
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('praxis:identity-switch', {
          detail: {
            userId: target.id,
            tenant: target.tenant,
            persona: target,
          },
        }),
      );
    }
  }

  private syncStorage(persona: PersonaProfile): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.USER_ID, persona.id);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, persona.id);
      localStorage.setItem(STORAGE_KEYS.TENANT, persona.tenant);
      localStorage.setItem(STORAGE_KEYS.TOKEN, persona.token);
    } catch {
      // Ignora falhas de storage em ambientes restritos
    }
  }
}
