export type ThemePref = 'light' | 'dark' | 'system';

const THEME_KEY = 'fainl_theme';

// Legacy values were exactly 'light' | 'dark', so they parse unchanged.
export function getStoredThemePref(): ThemePref {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

export function storeThemePref(pref: ThemePref): void {
  localStorage.setItem(THEME_KEY, pref);
}

export function resolveDark(pref: ThemePref): boolean {
  if (pref === 'system') {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return pref === 'dark';
}
