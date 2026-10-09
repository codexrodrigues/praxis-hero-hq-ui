import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import {
  PraxisAppShellComponent,
  type PraxisBrandConfig,
  type PraxisNavGroup,
  type PraxisShellFooterStatus,
} from '@praxisui/core';
import { ALL_NAV_ITEMS, HERO_NAVIGATION } from '../core/navigation.model';
import { ThemeService } from '../core/theme.service';
import { AuthSimulationService } from '../core/auth-simulation.service';

@Component({
  selector: 'app-hero-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, PraxisAppShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <praxis-app-shell
      [brand]="brand"
      [navigation]="navigation"
      [user]="null"
      [footerStatus]="footerStatus"
      [isDarkTheme]="isDark()"
      [showThemeToggle]="true"
      [showSearch]="true"
      searchPlaceholder="Buscar no comando... (Ctrl+K)"
      (themeToggle)="themeService.toggleTheme()"
      (searchSubmit)="openSearchModal()"
    >
      <!-- Header Actions projected into PraxisAppShell canonical slot -->
      <div shell-header-actions class="hud-extra-actions">
        <!-- Tactical Readiness Meter -->
        <div class="readiness-meter">
          <div class="readiness-header">
            <span>Prontidão</span>
            <span class="readiness-val">98,4%</span>
          </div>
          <div class="readiness-bar">
            <div class="readiness-progress" style="width: 98.4%"></div>
          </div>
        </div>

        <!-- Tactical Notifications Trigger -->
        <button type="button" class="hud-btn notification-btn" aria-label="Notificações">
          <span class="material-symbols-outlined">notifications</span>
          <span class="notification-count">3</span>
        </button>

        <!-- Tactical Persona / Authentication Simulation Switcher -->
        <div class="commander-profile-wrapper">
          <button
            type="button"
            class="commander-profile-btn"
            data-testid="persona-switcher"
            (click)="personaMenuOpen.set(!personaMenuOpen())"
            [attr.aria-expanded]="personaMenuOpen()"
            aria-label="Alternar persona tática"
          >
            <div class="avatar-ring" [style.background]="authService.currentPersona().badgeColor">
              <div class="avatar-inner">{{ authService.currentPersona().initials }}</div>
            </div>
            <div class="commander-details">
              <div class="commander-name-row">
                <p class="commander-name" data-testid="current-user-display">
                  {{ authService.currentPersona().name }}
                </p>
                <span class="material-symbols-outlined dropdown-icon">
                  {{ personaMenuOpen() ? 'expand_less' : 'expand_more' }}
                </span>
              </div>
              <p class="commander-role">{{ authService.currentPersona().role }}</p>
            </div>
          </button>

          @if (personaMenuOpen()) {
            <div class="persona-dropdown-backdrop" (click)="personaMenuOpen.set(false)"></div>
            <div class="persona-dropdown glass-panel" data-testid="persona-dropdown">
              <div class="persona-dropdown-header">
                <span class="persona-header-title">Alternar Simulação de Usuário</span>
                <span class="persona-header-subtitle">Teste de Persistência & Isolamento Tático</span>
              </div>
              <div class="persona-options">
                @for (persona of authService.personas; track persona.id) {
                  <button
                    type="button"
                    class="persona-option"
                    [class.active]="persona.id === authService.currentPersona().id"
                    [attr.data-testid]="'persona-option-' + persona.id"
                    (click)="selectPersona(persona.id)"
                  >
                    <div class="avatar-ring small" [style.background]="persona.badgeColor">
                      <div class="avatar-inner">{{ persona.initials }}</div>
                    </div>
                    <div class="persona-option-info">
                      <span class="persona-option-name">{{ persona.name }}</span>
                      <span class="persona-option-role">{{ persona.clearanceLevel }}</span>
                    </div>
                    @if (persona.id === authService.currentPersona().id) {
                      <span class="material-symbols-outlined check-icon">check_circle</span>
                    }
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Main Dynamic Content Routed from Modules -->
      <router-outlet></router-outlet>
    </praxis-app-shell>

    <!-- Quick Command Modal (Ctrl+K) -->
    @if (searchOpen()) {
      <div class="modal-overlay" (click)="searchOpen.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="search-input-header">
            <span class="material-symbols-outlined">search</span>
            <input
              #searchInput
              type="text"
              placeholder="Buscar heróis, missões, módulos..."
              (keydown.escape)="searchOpen.set(false)"
            />
            <button
              type="button"
              class="modal-close-btn"
              (click)="searchOpen.set(false)"
              aria-label="Fechar busca"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="quick-links">
            <p class="quick-title">Acesso Rápido aos Centros de Comando</p>
            <div class="links-list">
              @for (item of quickLinks; track item.path) {
                <a [routerLink]="item.path" (click)="searchOpen.set(false)" class="quick-link-item">
                  <span class="material-symbols-outlined">{{ item.icon }}</span>
                  <span>{{ item.label }}</span>
                </a>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './hero-app-shell.component.scss',
})
export class HeroAppShellComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly authService = inject(AuthSimulationService);
  private readonly router = inject(Router);

  protected readonly brand: PraxisBrandConfig = {
    title: 'Praxis Hero HQ',
    subtitle: 'v1.0 · AI Ready',
    icon: 'shield',
    href: '/',
  };

  protected readonly navigation = HERO_NAVIGATION as unknown as PraxisNavGroup[];
  protected readonly quickLinks = ALL_NAV_ITEMS.slice(0, 8);

  protected readonly footerStatus: PraxisShellFooterStatus = {
    title: 'Defcon 5 · Sistema Operacional',
    metric: 'Host Render: 32ms',
    statusTone: 'success',
    pulse: true,
  };

  protected readonly searchOpen = signal<boolean>(false);
  protected readonly personaMenuOpen = signal<boolean>(false);
  protected readonly isDark = this.themeService.isDark;

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchOpen.set(true);
    }
    if (event.key === 'Escape' && this.searchOpen()) {
      this.searchOpen.set(false);
    }
  }

  protected openSearchModal(): void {
    this.searchOpen.set(true);
  }

  protected selectPersona(personaId: string): void {
    this.authService.switchPersona(personaId);
    this.personaMenuOpen.set(false);
  }
}
