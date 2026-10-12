import { DOCUMENT } from '@angular/common';
import { Injectable, computed, DestroyRef, inject, signal } from '@angular/core';
import { resolveTheme, themeStorageKey, workspaceThemes, type ThemeMode } from './theme.model';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = this.document.defaultView;
  readonly themes = workspaceThemes;
  private readonly selected = signal<ThemeMode>('dark-tech');
  readonly theme = this.selected.asReadonly();
  readonly isDark = computed(() => this.theme() === 'dark-tech');
  readonly current = computed(() => this.themes.find(t => t.id === this.theme())!);

  constructor() {
    let stored: unknown;
    try { stored = this.browser?.localStorage.getItem(themeStorageKey); } catch { /* Storage is optional. */ }
    this.apply(resolveTheme(stored));
    const sync = (event: StorageEvent) => {
      if (event.key === themeStorageKey || event.key === null) this.apply(resolveTheme(event.newValue));
    };
    this.browser?.addEventListener('storage', sync);
    inject(DestroyRef).onDestroy(() => this.browser?.removeEventListener('storage', sync));
  }

  choose(value: ThemeMode): void {
    const theme = resolveTheme(value);
    this.apply(theme);
    try { this.browser?.localStorage.setItem(themeStorageKey, theme); } catch { /* Keep the current session usable. */ }
  }

  private apply(theme: ThemeMode): void {
    this.selected.set(theme);
    this.document.documentElement.dataset['theme'] = theme;
    this.document.documentElement.classList.toggle('dark', theme === 'dark-tech');
  }
}
