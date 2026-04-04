/**
 * Feature Tooltip — Reusable tooltip component for feature discovery.
 * Shows a floating tooltip pointing to a wrapped element, dismissed on tap.
 * Each tooltip only shows once per feature ID (tracked in AsyncStorage).
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';

const TOOLTIP_PREFIX = 'tooltip_shown_';

export interface FeatureTooltipProps {
  /** Unique ID to track if this tooltip has been shown */
  id: string;
  /** Tooltip message text */
  text: string;
  /** Position of the tooltip relative to the wrapped element */
  position: 'top' | 'bottom';
  /** The element to highlight */
  children: React.ReactNode;
}

export function FeatureTooltip({ id, text, position, children }: FeatureTooltipProps) {
  const [visible, setVisible] = useState(false);
  const t = useTheme();

  const st = useMemo(() => StyleSheet.create({
    wrapper: { position: 'relative' },
    tooltipContainer: {
      position: 'absolute',
      left: 0, right: 0,
      alignItems: 'center',
      zIndex: 1000,
      ...(position === 'top' ? { bottom: '100%', marginBottom: 8 } : { top: '100%', marginTop: 8 }),
    },
    tooltip: {
      backgroundColor: t.accent.blue,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      maxWidth: 260,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    tooltipText: { color: '#fff', fontSize: fonts.sm, lineHeight: 18, textAlign: 'center' },
    arrow: {
      width: 0, height: 0,
      borderLeftWidth: 8, borderRightWidth: 8,
      borderLeftColor: 'transparent', borderRightColor: 'transparent',
      ...(position === 'top'
        ? { borderTopWidth: 8, borderTopColor: t.accent.blue }
        : { borderBottomWidth: 8, borderBottomColor: t.accent.blue }),
    },
    dismissArea: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    },
  }), [t, position]);

  useEffect(() => {
    const key = `${TOOLTIP_PREFIX}${id}`;
    AsyncStorage.getItem(key).then((val) => {
      if (val !== 'true') {
        setVisible(true);
      }
    });
  }, [id]);

  const dismiss = useCallback(async () => {
    setVisible(false);
    const key = `${TOOLTIP_PREFIX}${id}`;
    await AsyncStorage.setItem(key, 'true');
  }, [id]);

  if (!visible) {
    return <>{children}</>;
  }

  const tooltipContent = (
    <View style={st.tooltipContainer}>
      {position === 'bottom' && <View style={st.arrow} />}
      <TouchableOpacity style={st.tooltip} onPress={dismiss} activeOpacity={0.9}>
        <Text style={st.tooltipText}>{text}</Text>
      </TouchableOpacity>
      {position === 'top' && <View style={st.arrow} />}
    </View>
  );

  return (
    <View style={st.wrapper}>
      {position === 'top' && tooltipContent}
      <TouchableOpacity activeOpacity={1} onPress={dismiss}>
        {children}
      </TouchableOpacity>
      {position === 'bottom' && tooltipContent}
    </View>
  );
}

/** Reset all tooltip dismissals (for testing or re-showing all tooltips) */
export async function resetAllTooltips(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const tooltipKeys = allKeys.filter((k) => k.startsWith(TOOLTIP_PREFIX));
  if (tooltipKeys.length > 0) {
    await AsyncStorage.multiRemove(tooltipKeys);
  }
}
