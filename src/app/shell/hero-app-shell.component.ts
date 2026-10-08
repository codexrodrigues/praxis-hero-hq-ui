import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { LoadingContext, LoadingOrchestrator } from '@praxisui/core';
import { map } from 'rxjs';
import { ALL_NAV_ITEMS, HERO_NAVIGATION, NavGroup, NavItem } from '../core/navigation.model';
import { ThemeService } from '../core/theme.service';
import { AuthSimulationService } from '../core/auth-simulation.service';

@Component({
  selector: 'app-hero-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell-container" [class.dark]="isDark()">
      <!-- Tactical Top-Bar Neon Shimmer Loading -->
      @if (isAnyLoading()) {
        <div
          class="hud-top-progress"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Sincronizando sistemas táticos com barramento Praxis"
        >
          <div class="hud-progress-laser"></div>
        </div>
      }

      <!-- Mobile Backdrop -->
      @if (mobileOpen()) {
        <div class="mobile-backdrop" (click)="mobileOpen.set(false)"></div>
      }

      <!-- Tactical Sidebar -->
      <aside class="tactical-sidebar" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">
        <!-- Brand Header -->
        <div class="sidebar-header">
          <div class="brand-badge primary-gradient">
            <span class="material-symbols-outlined">shield</span>
          </div>
          @if (!collapsed()) {
            <div class="brand-text">
              <span class="brand-title title-gradient">Praxis Hero HQ</span>
              <span class="version-tag">v1.0 · AI Ready</span>
            </div>
          }
          <button class="mobile-close-btn" (click)="mobileOpen.set(false)" aria-label="Fechar menu">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Navigation Groups -->
        <nav class="sidebar-nav">
          @for (group of navigation; track group.label) {
            <div class="nav-group">
              @if (!collapsed()) {
                <p class="group-label">{{ group.label }}</p>
              }
              <div class="group-items">
                @for (item of group.items; track item.path) {
                  <a
                    [routerLink]="item.path"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{ exact: item.path === '/' }"
                    (click)="mobileOpen.set(false)"
                    class="nav-link"
                    [attr.title]="collapsed() ? item.label : null"
                  >
                    <span class="nav-icon" [ngClass]="getDomainTone(group.domainKey)">
                      <span class="material-symbols-outlined">{{ item.icon }}</span>
                    </span>
                    @if (!collapsed()) {
                      <span class="nav-label">{{ item.label }}</span>
                    }
                  </a>
                }
              </div>
            </div>
          }
        </nav>

        <!-- Sidebar Footer Status -->
        <div class="sidebar-footer">
          @if (!collapsed()) {
            <div class="glass-panel defcon-card">
              <div class="defcon-status">
                <span class="pulse-indicator">
                  <span class="pulse-ring"></span>
                  <span class="pulse-dot"></span>
                </span>
                Defcon 5 · Sistema Operacional
              </div>
              <p class="defcon-metric">Host Render: 32ms</p>
            </div>
          }
          <button class="collapse-btn" (click)="collapsed.set(!collapsed())">
            <span class="material-symbols-outlined">
              {{ collapsed() ? 'chevron_right' : 'chevron_left' }}
            </span>
            @if (!collapsed()) {
              <span>Recolher navegação</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main Shell Area -->
      <div class="main-wrapper" [class.collapsed]="collapsed()">
        <!-- Header HUD -->
        <header class="hud-header">
          <button class="mobile-menu-btn" (click)="mobileOpen.set(true)" aria-label="Abrir menu">
            <span class="material-symbols-outlined">menu</span>
          </button>

          <div class="current-section">
            <span class="section-group">{{ activeGroup().label }}</span>
            <div class="title-with-sync">
              <span class="section-title">{{ activeItem().label }}</span>
              @if (isAnyLoading()) {
                <div
                  class="hud-sync-badge"
                  role="status"
                  aria-live="polite"
                  title="Sincronizando com barramento de metadados da Plataforma Praxis"
                >
                  <span class="sync-pulse" aria-hidden="true"></span>
                  <span class="sync-text">Sincronizando</span>
                </div>
              }
            </div>
          </div>

          <div class="hud-actions">
            <!-- Command Palette Trigger -->
            <button class="command-trigger" (click)="searchOpen.set(true)">
              <span class="search-icon primary-gradient">
                <span class="material-symbols-outlined">search</span>
              </span>
              <span class="command-text">Buscar no comando</span>
              <span class="shortcut-tag">Ctrl K</span>
            </button>

            <!-- Tactical Readiness -->
            <div class="readiness-meter">
              <div class="readiness-header">
                <span>Prontidão</span>
                <span class="readiness-val">98,4%</span>
              </div>
              <div class="readiness-bar">
                <div class="readiness-progress" style="width: 98.4%"></div>
              </div>
            </div>

            <!-- Theme Switcher -->
            <button class="hud-btn" (click)="themeService.toggleTheme()" aria-label="Alternar tema">
              <span class="material-symbols-outlined">
                {{ isDark() ? 'light_mode' : 'dark_mode' }}
              </span>
            </button>

            <!-- Notifications -->
            <button class="hud-btn notification-btn" aria-label="Notificações">
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
        </header>

        <!-- Dynamic Content Routed from Modules -->
        <main class="content-body" [class.route-transitioning]="isRouteLoading()">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Quick Command Modal -->
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
              <button class="modal-close-btn" (click)="searchOpen.set(false)">
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
    </div>
  `,
  styleUrl: './hero-app-shell.component.scss',
})
export class HeroAppShellComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly authService = inject(AuthSimulationService);
  private readonly router = inject(Router);
  private readonly loadingOrchestrator = inject(LoadingOrchestrator);

  protected readonly navigation = HERO_NAVIGATION;
  protected readonly quickLinks = ALL_NAV_ITEMS.slice(0, 8);

  protected readonly collapsed = signal<boolean>(false);
  protected readonly mobileOpen = signal<boolean>(false);
  protected readonly searchOpen = signal<boolean>(false);
  protected readonly personaMenuOpen = signal<boolean>(false);
  protected readonly currentUrl = signal<string>(this.router.url);

  protected readonly isDark = this.themeService.isDark;

  // Reatividade de Carregamento & Orquestração da Plataforma Praxis
  protected readonly isRouteLoading = signal<boolean>(false);
  private readonly praxisLoadingCount = toSignal(
    this.loadingOrchestrator.watch().pipe(map((items) => items.length)),
    { initialValue: 0 },
  );
  protected readonly isAnyLoading = computed(
    () => this.isRouteLoading() || (this.praxisLoadingCount() ?? 0) > 0,
  );
  private currentRouteCtx: LoadingContext | null = null;

  protected readonly activeItem = computed(() => {
    const url = this.currentUrl();
    return ALL_NAV_ITEMS.find((item) => item.path === url) ?? ALL_NAV_ITEMS[0];
  });

  protected readonly activeGroup = computed(() => {
    const url = this.currentUrl();
    return HERO_NAVIGATION.find((group) => group.items.some((item) => item.path === url)) ?? HERO_NAVIGATION[0];
  });

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isRouteLoading.set(true);
        this.currentRouteCtx = {
          scope: {
            componentType: 'Router',
            componentId: 'hero-app-shell',
            routeKey: event.url,
          },
          phase: 'mount',
          label: 'Sincronizando Módulo Tático...',
          blocking: false,
        };
        this.loadingOrchestrator.begin(this.currentRouteCtx);
        return;
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isRouteLoading.set(false);
        if (this.currentRouteCtx) {
          this.loadingOrchestrator.end(this.currentRouteCtx);
          this.currentRouteCtx = null;
        }
        if (event instanceof NavigationEnd) {
          this.currentUrl.set(event.urlAfterRedirects || event.url);
        }
      }
    });
  }

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

  protected selectPersona(personaId: string): void {
    this.authService.switchPersona(personaId);
    this.personaMenuOpen.set(false);
  }

  protected getDomainTone(domainKey: NavGroup['domainKey']): string {
    switch (domainKey) {
      case 'rh': return 'tone-rh';
      case 'operations': return 'tone-operations';
      case 'assets': return 'tone-assets';
      case 'supplies': return 'tone-supplies';
      case 'risk': return 'tone-risk';
      default: return 'tone-primary';
    }
  }
}
