import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'praxis_hero_hq_theme';
  readonly isDark = signal<boolean>(true);

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.isDark.set(stored === 'dark');
      } else {
        // Default to dark mode for tactical look
        this.isDark.set(true);
      }
    }

    effect(() => {
      const dark = this.isDark();
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', dark);
        localStorage.setItem(this.storageKey, dark ? 'dark' : 'light');
      }
    });
  }

  toggleTheme(): void {
    this.isDark.update((v) => !v);
  }
}
