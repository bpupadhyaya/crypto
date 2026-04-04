/**
 * Theme hook — provides current theme colors based on user preference.
 * Supports dark, light, and system (auto-detect) modes.
 *
 * Also subscribes to displayScales so that any component using useTheme()
 * in a useMemo dependency (e.g., useMemo(() => StyleSheet.create({...}), [t]))
 * will automatically rebuild styles when font scales change.
 */

import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { getTheme, fontVersion, type Theme, type ThemeMode } from '../utils/theme';

export function useTheme(): Theme & { mode: ThemeMode; isDark: boolean; _v: number } {
  const themeMode = useWalletStore((s) => s.themeMode);
  // Subscribe to displayScales so Zustand triggers re-render when they change
  const displayScales = useWalletStore((s) => s.displayScales);
  const systemScheme = useColorScheme();
  const systemDark = systemScheme === 'dark';

  // fontVersion increments on every applyDisplayScales() call.
  // Reading displayScales triggers Zustand re-render; fontVersion ensures
  // the returned object is always new, busting useMemo caches downstream.
  return useMemo(() => {
    const theme = getTheme(themeMode, systemDark);
    const isDark = themeMode === 'dark' || (themeMode === 'system' && systemDark);
    return { ...theme, mode: themeMode, isDark, _v: fontVersion };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeMode, systemDark, displayScales]);
}
