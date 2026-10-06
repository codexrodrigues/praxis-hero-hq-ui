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

            <!-- Commander Profile -->
            <div class="commander-profile">
              <div class="avatar-ring primary-gradient">
                <div class="avatar-inner">NF</div>
              </div>
              <div class="commander-details">
                <p class="commander-name">Nick Fury</p>
                <p class="commander-role">Diretor Geral de RH & Operações</p>
              </div>
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
  styles: [`
    .shell-container {
      min-height: 100vh;
      display: flex;
      background-color: var(--background);
      color: var(--foreground);
    }

    .mobile-backdrop {
      position: fixed;
      inset: 0;
      z-index: 40;
      background-color: var(--overlay);
    }

    /* Sidebar */
    .tactical-sidebar {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 50;
      width: 280px;
      display: flex;
      flex-direction: column;
      background-color: var(--sidebar);
      border-right: 1px solid var(--sidebar-border);
      backdrop-filter: blur(20px);
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease;
    }

    .tactical-sidebar.collapsed {
      width: 76px;
    }

    .sidebar-header {
      height: 80px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 18px;
      border-bottom: 1px solid var(--sidebar-border);
    }

    .brand-badge {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--primary-foreground);
    }

    .brand-text {
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      white-space: nowrap;
    }

    .version-tag {
      margin-top: 2px;
      display: inline-flex;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--primary);
      background-color: color-mix(in oklab, var(--primary) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--primary) 30%, transparent);
      padding: 2px 6px;
      border-radius: 9999px;
      width: max-content;
    }

    .mobile-close-btn {
      margin-left: auto;
      background: transparent;
      border: none;
      color: var(--sidebar-foreground);
      cursor: pointer;
      display: none;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 18px 12px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .group-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: color-mix(in oklab, var(--sidebar-foreground) 45%, transparent);
      margin: 0 0 8px 8px;
    }

    .group-items {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-link {
      height: 42px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 10px;
      border-radius: 12px;
      font-size: 0.82rem;
      font-weight: 500;
      color: color-mix(in oklab, var(--sidebar-foreground) 75%, transparent);
      text-decoration: none;
      transition: all 0.2s ease;
      border-left: 2px solid transparent;
    }

    .nav-link:hover {
      background-color: var(--sidebar-accent);
      color: var(--sidebar-accent-foreground);
    }

    .nav-link.active {
      border-left-color: var(--primary);
      background: linear-gradient(90deg, color-mix(in oklab, var(--primary) 15%, transparent), transparent);
      color: var(--primary);
      font-weight: 600;
    }

    .nav-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      span { font-size: 18px; }
    }

    .nav-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Domain Colors */
    .tone-rh { color: var(--rh); background-color: color-mix(in oklab, var(--rh) 12%, transparent); }
    .tone-operations { color: var(--operations); background-color: color-mix(in oklab, var(--operations) 12%, transparent); }
    .tone-assets { color: var(--assets); background-color: color-mix(in oklab, var(--assets) 12%, transparent); }
    .tone-supplies { color: var(--supplies); background-color: color-mix(in oklab, var(--supplies) 12%, transparent); }
    .tone-risk { color: var(--risk); background-color: color-mix(in oklab, var(--risk) 12%, transparent); }
    .tone-primary { color: var(--primary); background-color: color-mix(in oklab, var(--primary) 12%, transparent); }

    /* Sidebar Footer */
    .sidebar-footer {
      border-top: 1px solid var(--sidebar-border);
      padding: 14px;
    }

    .defcon-card {
      padding: 12px;
      border-radius: 12px;
      margin-bottom: 10px;
    }

    .defcon-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--ready);
    }

    .pulse-indicator {
      position: relative;
      width: 8px;
      height: 8px;
      display: flex;
    }

    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: var(--ready);
      opacity: 0.75;
      animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--ready);
    }

    .defcon-metric {
      margin: 4px 0 0;
      font-family: var(--font-mono);
      font-size: 0.6rem;
      color: var(--muted-foreground);
    }

    .collapse-btn {
      width: 100%;
      height: 38px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: none;
      color: var(--muted-foreground);
      font-size: 0.75rem;
      cursor: pointer;
      border-radius: 8px;
      padding: 0 8px;
      transition: background 0.2s;
    }

    .collapse-btn:hover {
      background: var(--sidebar-accent);
      color: var(--sidebar-accent-foreground);
    }

    /* Main Area */
    .main-wrapper {
      flex: 1;
      margin-left: 280px;
      display: flex;
      flex-direction: column;
      min-width: 0;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .main-wrapper.collapsed {
      margin-left: 76px;
    }

    /* Header HUD */
    .hud-header {
      position: sticky;
      top: 0;
      z-index: 30;
      height: 80px;
      background: color-mix(in oklab, var(--background) 75%, transparent);
      backdrop-filter: blur(18px);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 16px;
    }

    .mobile-menu-btn {
      display: none;
      background: transparent;
      border: none;
      color: var(--foreground);
      cursor: pointer;
    }

    .current-section {
      display: flex;
      flex-direction: column;
    }

    .section-group {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted-foreground);
    }

    .section-title {
      font-size: 0.95rem;
      font-weight: 700;
      font-family: var(--font-display);
    }

    .hud-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .command-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 240px;
      height: 42px;
      padding: 0 12px;
      background-color: color-mix(in oklab, var(--muted) 40%, transparent);
      border: 1px solid var(--input);
      border-radius: 12px;
      cursor: pointer;
      color: var(--muted-foreground);
      font-size: 0.78rem;
      transition: border-color 0.2s;
    }

    .command-trigger:hover {
      border-color: var(--primary);
    }

    .search-icon {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-foreground);
      span { font-size: 15px; }
    }

    .shortcut-tag {
      margin-left: auto;
      font-size: 0.65rem;
      padding: 2px 6px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--background);
    }

    .readiness-meter {
      width: 140px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .readiness-header {
      display: flex;
      justify-content: space-between;
      font-family: var(--font-mono);
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--muted-foreground);
    }

    .readiness-val {
      color: var(--ready);
    }

    .readiness-bar {
      height: 5px;
      background: var(--muted);
      border-radius: 9999px;
      overflow: hidden;
    }

    .readiness-progress {
      height: 100%;
      background-color: var(--ready);
    }

    .hud-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: background 0.2s;
    }

    .hud-btn:hover {
      background: var(--accent);
    }

    .notification-count {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--alert);
      color: #fff;
      font-size: 0.6rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .commander-profile {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-left: 14px;
      border-left: 1px solid var(--border);
    }

    .avatar-ring {
      padding: 2px;
      border-radius: 50%;
      display: flex;
    }

    .avatar-inner {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--background);
      color: var(--foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .commander-details {
      display: flex;
      flex-direction: column;
    }

    .commander-name {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .commander-role {
      margin: 0;
      font-size: 0.65rem;
      color: var(--muted-foreground);
    }

    .content-body {
      flex: 1;
      padding: 28px;
      min-width: 0;
    }

    /* Command Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 80;
      background: var(--overlay);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 12vh;
    }

    .modal-card {
      width: 100%;
      max-width: 580px;
      background: var(--popover);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: var(--shadow-command);
      overflow: hidden;
    }

    .search-input-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);

      input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: var(--foreground);
        font-size: 1rem;
      }
    }

    .modal-close-btn {
      background: transparent;
      border: none;
      color: var(--muted-foreground);
      cursor: pointer;
    }

    .quick-links {
      padding: 16px;
    }

    .quick-title {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted-foreground);
      margin: 0 0 10px 8px;
    }

    .links-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .quick-link-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      color: var(--foreground);
      text-decoration: none;
      font-size: 0.85rem;
      transition: background 0.2s;

      &:hover {
        background: var(--accent);
        color: var(--primary);
      }

      span {
        color: var(--primary);
      }
    }

    @keyframes ping {
      75%, 100% {
        transform: scale(2);
        opacity: 0;
      }
    }

    /* Tactical Top-Bar Laser Loading */
    .hud-top-progress {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      z-index: 99999;
      background: color-mix(in oklab, var(--primary) 12%, transparent);
      overflow: hidden;
      pointer-events: none;
    }

    .hud-progress-laser {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 45%;
      background: linear-gradient(
        90deg,
        transparent,
        var(--primary),
        color-mix(in oklab, var(--primary) 85%, white),
        var(--cobalt),
        transparent
      );
      box-shadow: 0 0 12px var(--primary);
      animation: laserBeam 1.3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    @keyframes laserBeam {
      0% {
        transform: translateX(-100%);
      }
      50% {
        transform: translateX(100%);
      }
      100% {
        transform: translateX(300%);
      }
    }

    .title-with-sync {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .hud-sync-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      background: color-mix(in oklab, var(--primary) 15%, transparent);
      border: 1px solid color-mix(in oklab, var(--primary) 35%, transparent);
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      color: var(--primary);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      animation: fadeIn 0.2s ease-out;
    }

    .sync-pulse {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--primary);
      box-shadow: 0 0 8px var(--primary);
      animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    .sync-text {
      line-height: 1;
    }

    .content-body.route-transitioning {
      opacity: 0.65;
      transition: opacity 0.15s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-2px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 1024px) {
      .tactical-sidebar {
        transform: translateX(-100%);
      }
      .tactical-sidebar.mobile-open {
        transform: translateX(0);
      }
      .main-wrapper, .main-wrapper.collapsed {
        margin-left: 0;
      }
      .mobile-menu-btn, .mobile-close-btn {
        display: block;
      }
      .command-trigger, .readiness-meter, .commander-details {
        display: none;
      }
    }
  `],
})
export class HeroAppShellComponent {
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly loadingOrchestrator = inject(LoadingOrchestrator);

  protected readonly navigation = HERO_NAVIGATION;
  protected readonly quickLinks = ALL_NAV_ITEMS.slice(0, 8);

  protected readonly collapsed = signal<boolean>(false);
  protected readonly mobileOpen = signal<boolean>(false);
  protected readonly searchOpen = signal<boolean>(false);
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
