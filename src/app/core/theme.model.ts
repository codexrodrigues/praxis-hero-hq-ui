export const workspaceThemes = [
  { id: 'classic', name: 'Essência', description: 'Identidade clara original' },
  { id: 'light-tech', name: 'Aurora', description: 'Claro mineral e azul-petróleo' },
  { id: 'dark-tech', name: 'Órbita', description: 'Grafite com nuances azul-violeta' },
] as const;
export type ThemeMode = typeof workspaceThemes[number]['id'];
export const themeStorageKey = 'praxis_hero_hq_theme';
export function resolveTheme(value: unknown): ThemeMode {
  // Preserve the existing host preference when upgrading the two-mode selector.
  if (value === 'light') return 'classic';
  if (value === 'dark') return 'dark-tech';
  return workspaceThemes.some(t => t.id === value) ? value as ThemeMode : 'dark-tech';
}
