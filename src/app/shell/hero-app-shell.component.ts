import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  EnterpriseRuntimeContextService,
  PraxisAppShellComponent,
  PraxisCustomizationModeService,
  type PraxisBrandConfig,
  type PraxisNavGroup,
  type PraxisShellFooterStatus,
} from '@praxisui/core';
import { HERO_NAVIGATION, type NavItem } from '../core/navigation.model';
import { PRAXIS_API_BASE_URL } from '../core/platform.config';
import { ThemeService } from '../core/theme.service';
import { AuthSimulationService } from '../core/auth-simulation.service';
import { canAccessTacticalPage } from '../core/tactical-access';

export interface CommandPaletteItem extends NavItem {
  readonly groupLabel: string;
}

interface ShellStatsBucket {
  key?: string | number | boolean | null;
  label?: string | null;
  value?: number | null;
  count?: number | null;
  values?: Record<string, number | null> | null;
}

interface ShellStatsEnvelope {
  data?: {
    buckets?: ShellStatsBucket[];
  };
  buckets?: ShellStatsBucket[];
}

@Component({
  selector: 'app-hero-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, PraxisAppShellComponent, MatMenuModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <praxis-app-shell
      [brand]="brand"
      [navigation]="navigation"
      [user]="null"
      [footerStatus]="footerStatus()"
      [isDarkTheme]="isDark()"
      [showThemeToggle]="false"
      [showCustomizationToggle]="true"
      [showSearch]="true"
      [clearSearchOnBlur]="true"
      searchPlaceholder="Buscar no comando... (Ctrl+K)"
      (searchChange)="onTopbarSearchInput($event)"
      (searchSubmit)="openSearchModal($event)"
    >
      <!-- Header Actions projected into PraxisAppShell canonical slot -->
      <div shell-header-actions class="hud-extra-actions">
        <button mat-icon-button [matMenuTriggerFor]="appearanceMenu"
          [attr.aria-label]="'Aparência: ' + themeService.current().name" title="Aparência do workspace">
          <span class="material-symbols-outlined">palette</span>
        </button>
        <mat-menu #appearanceMenu="matMenu">
          @for (theme of themeService.themes; track theme.id) {
            <button mat-menu-item role="menuitemradio" [attr.aria-checked]="themeService.theme() === theme.id"
              (click)="themeService.choose(theme.id)">
              <span class="theme-swatch" [attr.data-preview]="theme.id" aria-hidden="true"></span>
              <span>{{ theme.name }} · {{ theme.description }}</span>
            </button>
          }
        </mat-menu>
        <!-- Tactical Readiness Meter -->
        <div class="readiness-meter" [title]="readinessTooltip()">
          <div class="readiness-header">
            <span>Prontidão</span>
            <span class="readiness-val" data-testid="shell-readiness-val">{{ readinessLabel() }}</span>
          </div>
          <div class="readiness-bar">
            <div class="readiness-progress" [style.width.%]="readinessRate()"></div>
          </div>
        </div>

        <!-- Tactical Notifications Trigger -->
        <button
          type="button"
          class="hud-btn notification-btn"
          [attr.aria-label]="'Notificações: ' + criticalIncidents() + ' incidentes críticos'"
          [title]="criticalIncidents() + ' incidentes críticos em contenção'"
          (click)="openCriticalIncidents()"
        >
          <span class="material-symbols-outlined">notifications</span>
          <span class="notification-count" data-testid="shell-notification-count">{{ criticalIncidents() }}</span>
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
      @if (authDeniedResource(); as deniedRes) {
        <div class="tactical-auth-alert glass-panel" role="alert" data-testid="tactical-auth-alert">
          <div class="alert-content">
            <span class="material-symbols-outlined alert-icon">shield_lock</span>
            <div class="alert-text">
              <strong class="alert-title">Acesso restrito nesta demonstração</strong>
              <p class="alert-desc">
                A credencial de segurança de <strong>{{ authService.currentPersona().name }}</strong> ({{ authService.currentPersona().clearanceLevel }})
                não atende ao requisito de acesso a <em>{{ deniedRes }}</em>.
                Selecione uma persona com a credencial necessária no menu superior.
              </p>
            </div>
          </div>
          <button type="button" class="alert-dismiss-btn" (click)="dismissAuthDenied()" aria-label="Fechar alerta">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      }

      <!-- Persona simulation belongs to this host; rebuild its routed view on selection. -->
      @for (personaId of [authService.currentPersona().id]; track personaId) {
        <router-outlet></router-outlet>
      }
    </praxis-app-shell>

    <!-- Quick Command Modal (Ctrl+K) -->
    @if (searchOpen()) {
      <div class="modal-overlay" (click)="closeSearchModal()" data-testid="command-palette-modal">
        <div
          class="modal-card"
          role="dialog"
          aria-modal="true"
          aria-label="Busca rápida de módulos e centros de comando"
          (click)="$event.stopPropagation()"
        >
          <div class="search-input-header">
            <span class="material-symbols-outlined" aria-hidden="true">search</span>
            <input
              #searchInput
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="command-palette-listbox"
              [attr.aria-expanded]="filteredLinks().length > 0"
              [attr.aria-activedescendant]="
                filteredLinks().length > 0 ? 'command-palette-opt-' + selectedSearchIndex() : null
              "
              data-testid="command-palette-input"
              placeholder="Buscar heróis, missões, módulos, DEFCON..."
              aria-label="Filtrar módulos e centros de comando"
              [value]="searchQuery()"
              (input)="onSearchQueryChange($any($event.target).value)"
              (keydown)="onSearchInputKeydown($event)"
            />
            @if (searchQuery()) {
              <button
                type="button"
                class="modal-close-btn"
                (click)="onSearchQueryChange('')"
                aria-label="Limpar filtro"
                title="Limpar filtro"
              >
                <span class="material-symbols-outlined">backspace</span>
              </button>
            }
            <button
              type="button"
              class="modal-close-btn"
              (click)="closeSearchModal()"
              aria-label="Fechar busca"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="quick-links">
            <div class="quick-header-row">
              <p class="quick-title">
                Acesso Rápido aos Centros de Comando ({{ filteredLinks().length }})
              </p>
              <span class="quick-kbd-hint">↑↓ navegar · Enter abrir · Esc fechar</span>
            </div>
            @if (filteredLinks().length > 0) {
              <div #linksList id="command-palette-listbox" class="links-list" role="listbox" aria-label="Resultados da busca">
                @for (item of filteredLinks(); track item.path; let i = $index) {
                  <a
                    [id]="'command-palette-opt-' + i"
                    [routerLink]="item.path"
                    role="option"
                    [attr.aria-selected]="i === selectedSearchIndex()"
                    [class.active]="i === selectedSearchIndex()"
                    [class.restricted]="isItemRestricted(item)"
                    data-testid="command-palette-item"
                    (mouseenter)="selectedSearchIndex.set(i)"
                    (click)="navigateToCommandItem(item, $event)"
                    class="quick-link-item"
                  >
                    <span class="material-symbols-outlined quick-link-icon">{{ item.icon }}</span>
                    <div class="quick-link-copy">
                      <div class="quick-link-title-row">
                        <span class="quick-link-label">{{ item.label }}</span>
                        @if (item.badge) {
                          <span
                            class="quick-link-badge"
                            [class.quick-link-badge--restricted]="isItemRestricted(item)"
                            [title]="item.clearance
                              ? (isItemRestricted(item)
                                ? 'Requer credencial ' + item.clearance
                                : 'Credencial ' + item.clearance + ' autorizada')
                              : item.description"
                          >
                            @if (isItemRestricted(item)) {
                              <span class="material-symbols-outlined badge-lock-icon" aria-hidden="true">lock</span>
                            }
                            {{ item.badge }}
                          </span>
                        }
                      </div>
                      <span class="quick-link-desc">{{ item.groupLabel }} · {{ item.description }}</span>
                    </div>
                  </a>
                }
              </div>
            } @else {
              <div class="quick-empty-state" data-testid="command-palette-empty" role="status">
                <span class="material-symbols-outlined">travel_explore</span>
                <p>Nenhum módulo encontrado para "{{ searchQuery() }}".</p>
              </div>
            }
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
  private readonly customizationMode = inject(PraxisCustomizationModeService, { optional: true });
  private readonly runtimeContext = inject(EnterpriseRuntimeContextService, { optional: true });
  private readonly http = inject(HttpClient, { optional: true });
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly activeHeroes = signal<number>(53);
  protected readonly totalHeroes = signal<number>(101);
  protected readonly criticalIncidents = signal<number>(18);
  protected readonly totalIncidents = signal<number>(74);

  protected readonly readinessRate = computed<number>(() => {
    const total = this.totalHeroes();
    return total > 0 ? Math.round((this.activeHeroes() / total) * 1000) / 10 : 0;
  });

  protected readonly readinessLabel = computed<string>(() =>
    `${this.readinessRate().toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
  );

  protected readonly readinessTooltip = computed<string>(
    () => `${this.activeHeroes()} de ${this.totalHeroes()} heróis prontos para ação (${this.readinessLabel()})`,
  );

  protected readonly defconScore = computed<number>(() => {
    const total = this.totalIncidents();
    if (total <= 0) {
      return 5;
    }
    const raw = 5 - (this.criticalIncidents() / total) * 3.3;
    return Math.max(1, Math.min(5, Math.round(raw * 10) / 10));
  });

  protected readonly footerStatus = computed<PraxisShellFooterStatus>(() => {
    const score = this.defconScore();
    const level = Math.round(score);
    const statusLabel =
      level <= 2
        ? 'Alerta Máximo'
        : level <= 4
          ? 'Vigilância Tática'
          : 'Sistema Operacional';
    return {
      title: `Defcon ${level} (${score.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}) · ${statusLabel}`,
      metric: `${this.activeHeroes()}/${this.totalHeroes()} Ativos · ${this.criticalIncidents()} Críticos`,
      statusTone: level <= 2 ? 'error' : level <= 4 ? 'warning' : 'success',
      pulse: true,
    };
  });

  protected readonly authDeniedResource = toSignal(
    this.route.queryParams.pipe(
      map((params) => (params['authDenied'] === 'true' ? params['resource'] || 'Recurso Restrito' : null)),
    ),
    { initialValue: null },
  );

  constructor() {
    this.refreshTelemetry();
  }

  protected dismissAuthDenied(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { authDenied: null, resource: null },
      queryParamsHandling: 'merge',
    });
  }

  protected openCriticalIncidents(): void {
    void this.router.navigateByUrl('/operacoes/incidentes');
  }

  protected readonly brand: PraxisBrandConfig = {
    title: 'Praxis Hero HQ',
    subtitle: 'v1.0 · AI Ready',
    icon: 'shield',
    href: '/',
  };

  protected readonly navigation: PraxisNavGroup[] = HERO_NAVIGATION;
  protected readonly allCommandItems: readonly CommandPaletteItem[] = HERO_NAVIGATION.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      groupLabel: group.label,
    })),
  );

  @ViewChild('searchInput') private searchInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('linksList') private linksListRef?: ElementRef<HTMLElement>;

  protected readonly searchOpen = signal<boolean>(false);
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedSearchIndex = signal<number>(0);
  protected readonly personaMenuOpen = signal<boolean>(false);
  protected readonly isDark = this.themeService.isDark;

  protected readonly filteredLinks = computed<readonly CommandPaletteItem[]>(() => {
    const rawQuery = this.searchQuery().trim();
    if (!rawQuery) {
      return this.allCommandItems;
    }
    const normalizedQuery = HeroAppShellComponent.normalizeSearchText(rawQuery);
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return this.allCommandItems.filter((item) => {
      const haystack = HeroAppShellComponent.normalizeSearchText(
        `${item.label} ${item.groupLabel} ${item.description} ${item.path} ${item.badge ?? ''}`,
      );
      return terms.every((term) => haystack.includes(term));
    });
  });

  protected isItemRestricted(item: CommandPaletteItem): boolean {
    return !canAccessTacticalPage(this.authService.currentPersona().clearance, item.clearance);
  }

  private static normalizeSearchText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openSearchModal(this.searchQuery());
    }
    if (event.key === 'Escape') {
      if (this.searchOpen()) {
        this.closeSearchModal();
      }
      if (this.personaMenuOpen()) {
        this.personaMenuOpen.set(false);
      }
    }
  }

  protected onTopbarSearchInput(query: string): void {
    const trimmed = typeof query === 'string' ? query.trim() : '';
    if (!trimmed) {
      return;
    }
    this.openSearchModal(trimmed);
  }

  protected openSearchModal(initialQuery = ''): void {
    this.searchQuery.set(typeof initialQuery === 'string' ? initialQuery : '');
    this.selectedSearchIndex.set(0);
    this.searchOpen.set(true);
    setTimeout(() => {
      const el = this.searchInputRef?.nativeElement;
      if (el) {
        el.focus();
        if (typeof el.setSelectionRange === 'function') {
          const len = el.value.length;
          el.setSelectionRange(len, len);
        }
      }
    }, 0);
  }

  protected closeSearchModal(): void {
    this.searchOpen.set(false);
    this.searchQuery.set('');
    this.selectedSearchIndex.set(0);
  }

  protected onSearchQueryChange(value: string): void {
    this.searchQuery.set(value ?? '');
    this.selectedSearchIndex.set(0);
  }

  protected onSearchInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeSearchModal();
      return;
    }
    const items = this.filteredLinks();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (items.length > 0) {
        this.selectedSearchIndex.update((idx) => (idx + 1) % items.length);
        this.scrollActiveOptionIntoView();
      }
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (items.length > 0) {
        this.selectedSearchIndex.update((idx) => (idx - 1 + items.length) % items.length);
        this.scrollActiveOptionIntoView();
      }
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const idx = Math.max(0, Math.min(this.selectedSearchIndex(), items.length - 1));
      const target = items[idx];
      if (target) {
        this.navigateToCommandItem(target);
      }
    }
  }

  private scrollActiveOptionIntoView(): void {
    setTimeout(() => {
      const idx = this.selectedSearchIndex();
      const activeEl = this.linksListRef?.nativeElement?.querySelector<HTMLElement>(
        `#command-palette-opt-${idx}`,
      );
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }, 0);
  }

  protected navigateToCommandItem(item: CommandPaletteItem, event?: Event): void {
    event?.preventDefault();
    this.closeSearchModal();
    void this.router.navigateByUrl(item.path);
  }

  protected selectPersona(personaId: string): void {
    this.customizationMode?.setCustomizing(false);
    this.authService.switchPersona(personaId);
    this.runtimeContext?.invalidate();
    this.personaMenuOpen.set(false);
    this.refreshTelemetry();
    const currentUrl = this.router.url;
    if (currentUrl && currentUrl !== '/' && !currentUrl.startsWith('/?')) {
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigateByUrl(currentUrl);
      });
    } else if (this.authDeniedResource()) {
      this.dismissAuthDenied();
    }
  }

  private refreshTelemetry(): void {
    if (!this.http) {
      return;
    }

    this.http
      .post<ShellStatsEnvelope>(
        `${PRAXIS_API_BASE_URL}/human-resources/funcionarios/stats/group-by`,
        {
          filter: {},
          field: 'ativo',
          metrics: [{ operation: 'COUNT', alias: 'total' }],
        },
      )
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        const buckets = res?.data?.buckets ?? res?.buckets;
        if (!Array.isArray(buckets) || !buckets.length) {
          return;
        }
        let active = 0;
        let total = 0;
        for (const bucket of buckets) {
          const count = Number(bucket.values?.['total'] ?? bucket.value ?? bucket.count ?? 0);
          if (!Number.isFinite(count) || count < 0) {
            continue;
          }
          total += count;
          const key = String(bucket.key ?? bucket.label ?? '').toLowerCase();
          if (key === 'true' || key === '1' || key === 'ativo') {
            active += count;
          }
        }
        if (total > 0) {
          this.activeHeroes.set(active);
          this.totalHeroes.set(total);
        }
      });

    this.http
      .post<ShellStatsEnvelope>(
        `${PRAXIS_API_BASE_URL}/risk-intelligence/vw-indicadores-incidentes/stats/group-by`,
        {
          filter: {},
          field: 'severidade',
          metrics: [{ operation: 'COUNT', alias: 'total' }],
        },
      )
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        const buckets = res?.data?.buckets ?? res?.buckets;
        if (!Array.isArray(buckets) || !buckets.length) {
          return;
        }
        let critical = 0;
        let total = 0;
        for (const bucket of buckets) {
          const count = Number(bucket.values?.['total'] ?? bucket.value ?? bucket.count ?? 0);
          if (!Number.isFinite(count) || count < 0) {
            continue;
          }
          total += count;
          const key = String(bucket.key ?? bucket.label ?? '').toUpperCase();
          if (key === 'CRITICA' || key === 'CRÍTICA') {
            critical += count;
          }
        }
        if (total > 0) {
          this.criticalIncidents.set(critical);
          this.totalIncidents.set(total);
        }
      });
  }
}


