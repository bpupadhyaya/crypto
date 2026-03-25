/**
 * Theme — Dark and Light color schemes.
 * Used throughout the app for consistent styling.
 */

export type ThemeMode = 'dark' | 'light' | 'system';

export interface Theme {
  bg: { primary: string; secondary: string; card: string };
  text: { primary: string; secondary: string; muted: string };
  accent: { green: string; orange: string; blue: string; purple: string; red: string; yellow: string };
  border: string;
}

export const DARK_THEME: Theme = {
  bg: { primary: '#0a0a0f', secondary: '#111118', card: '#16161f' },
  text: { primary: '#f0f0f5', secondary: '#a0a0b0', muted: '#606070' },
  accent: { green: '#22c55e', orange: '#f97316', blue: '#3b82f6', purple: '#8b5cf6', red: '#ef4444', yellow: '#eab308' },
  border: 'rgba(255,255,255,0.06)',
};

export const LIGHT_THEME: Theme = {
  bg: { primary: '#f8f9fa', secondary: '#ffffff', card: '#ffffff' },
  text: { primary: '#1a1a2e', secondary: '#4a4a6a', muted: '#8a8aaa' },
  accent: { green: '#16a34a', orange: '#ea580c', blue: '#2563eb', purple: '#7c3aed', red: '#dc2626', yellow: '#ca8a04' },
  border: 'rgba(0,0,0,0.08)',
};

export function getTheme(mode: ThemeMode, systemDark: boolean): Theme {
  if (mode === 'system') return systemDark ? DARK_THEME : LIGHT_THEME;
  return mode === 'dark' ? DARK_THEME : LIGHT_THEME;
}
