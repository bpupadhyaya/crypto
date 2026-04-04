/**
 * Theme — Dark and Light color schemes + user-adjustable display scales.
 *
 * Display scales are stored in walletStore and applied globally via the
 * mutable `fonts` object. Call `applyDisplayScales()` when scales change.
 *
 * Scale categories:
 *   appScale     — master scale for ALL text (0.7–2.0)
 *   contentScale — body/content text multiplier on top of appScale (0.7–2.0)
 *   menuScale    — navigation/menu/button text multiplier (0.7–2.0)
 *   iconScale    — icon and emoji sizes multiplier (0.7–2.5)
 *   weightBoost  — make all text bolder: 0, 100, or 200
 */

export type ThemeMode = 'dark' | 'light' | 'system';

// ─── Display Scale Defaults ───

export interface DisplayScales {
  appScale: number;      // master text scale (default 1.15)
  contentScale: number;  // content/body multiplier (default 1.0)
  menuScale: number;     // menu/nav/button multiplier (default 1.0)
  iconScale: number;     // icon/emoji size multiplier (default 1.0)
  weightBoost: number;   // 0, 100, or 200
}

export const DEFAULT_DISPLAY_SCALES: DisplayScales = {
  appScale: 1.15,
  contentScale: 1.0,
  menuScale: 1.0,
  iconScale: 1.0,
  weightBoost: 100,
};

// ─── Fonts singleton — lives in its own object to avoid Hermes hoisting issues ───

const _state = {
  appScale: 1.15,
  contentScale: 1.0,
  menuScale: 1.0,
  iconScale: 1.0,
  weightBoost: 100,
};

function _sz(base: number) { return Math.round(base * _state.appScale); }
function _csz(base: number) { return Math.round(base * _state.appScale * _state.contentScale); }
function _msz(base: number) { return Math.round(base * _state.appScale * _state.menuScale); }
function _isz(base: number) { return Math.round(base * _state.iconScale); }
function _w(base: number) { return String(Math.min(900, base + _state.weightBoost)); }

// Build a plain object with all font values
function _buildFonts() {
  return {
    xxs: _sz(9), xs: _sz(11), sm: _sz(13), md: _sz(15), lg: _sz(17),
    xl: _sz(20), xxl: _sz(24), xxxl: _sz(28), hero: _sz(34),
    contentSm: _csz(13), contentMd: _csz(15), contentLg: _csz(17),
    menuSm: _msz(12), menuMd: _msz(14), menuLg: _msz(16),
    iconSm: _isz(18), iconMd: _isz(24), iconLg: _isz(32), iconXl: _isz(48),
    normal: _w(400), medium: _w(500), semibold: _w(600), bold: _w(700), heavy: _w(800),
  };
}

/** The global fonts object. All files import this.
 *  Properties are updated in-place by applyDisplayScales(). */
export const fonts = _buildFonts();

/** Call when display scale settings change. */
export function applyDisplayScales(scales: Partial<DisplayScales>) {
  if (scales.appScale != null) _state.appScale = scales.appScale;
  if (scales.contentScale != null) _state.contentScale = scales.contentScale;
  if (scales.menuScale != null) _state.menuScale = scales.menuScale;
  if (scales.iconScale != null) _state.iconScale = scales.iconScale;
  if (scales.weightBoost != null) _state.weightBoost = scales.weightBoost;
  Object.assign(fonts, _buildFonts());
}

/** Get current active scales (for UI display) */
export function getDisplayScales(): DisplayScales {
  return { ..._state };
}

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
