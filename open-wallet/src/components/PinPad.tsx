/**
 * PIN Pad — 6-digit numeric keypad for quick unlock.
 * Clean, accessible design. Haptic feedback ready.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PinPadProps {
  title: string;
  subtitle?: string;
  onComplete: (pin: string) => void;
  error?: string | null;
  maxLength?: number;
}

export function PinPad({ title, subtitle, onComplete, error, maxLength = 6 }: PinPadProps) {
  const [pin, setPin] = useState('');

  const handlePress = useCallback((digit: string) => {
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === maxLength) {
      onComplete(newPin);
      // Reset after a short delay (in case of error, user sees full dots briefly)
      setTimeout(() => setPin(''), 300);
    }
  }, [pin, maxLength, onComplete]);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const dots = Array.from({ length: maxLength }, (_, i) => (
    <View
      key={i}
      style={[
        styles.dot,
        i < pin.length && styles.dotFilled,
        error && i < pin.length && styles.dotError,
      ]}
    />
  ));

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {/* Dots */}
      <View style={styles.dotsRow}>{dots}</View>

      {/* Error message */}
      {error && <Text style={styles.error}>{error}</Text>}

      {/* Keypad */}
      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyRow}>
            {row.map((key) => {
              if (key === '') return <View key="empty" style={styles.keyEmpty} />;
              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key="del"
                    style={styles.key}
                    onPress={handleDelete}
                    activeOpacity={0.5}
                  >
                    <Text style={styles.keyTextDel}>←</Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.key}
                  onPress={() => handlePress(key)}
                  activeOpacity={0.5}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
    paddingHorizontal: 40,
  },
  title: {
    color: '#f0f0f5',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#a0a0b0',
    fontSize: 14,
    marginBottom: 32,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#606070',
  },
  dotFilled: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  dotError: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 16,
    fontWeight: '600',
  },
  keypad: {
    marginTop: 24,
    width: '100%',
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#16161f',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  keyEmpty: {
    width: 72,
    height: 72,
    marginHorizontal: 12,
  },
  keyText: {
    color: '#f0f0f5',
    fontSize: 28,
    fontWeight: '600',
  },
  keyTextDel: {
    color: '#a0a0b0',
    fontSize: 24,
    fontWeight: '600',
  },
});
