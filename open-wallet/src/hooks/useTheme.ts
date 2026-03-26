/**
 * Theme hook — provides current theme colors based on user preference.
 * Supports dark, light, and system (auto-detect) modes.
 */

import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { getTheme, type Theme, type ThemeMode } from '../utils/theme';

export function useTheme(): Theme & { mode: ThemeMode; isDark: boolean } {
  const themeMode = useWalletStore((s) => s.themeMode);
  const systemScheme = useColorScheme();
  const systemDark = systemScheme === 'dark';

  return useMemo(() => {
    const theme = getTheme(themeMode, systemDark);
    const isDark = themeMode === 'dark' || (themeMode === 'system' && systemDark);
    return { ...theme, mode: themeMode, isDark };
  }, [themeMode, systemDark]);
}
