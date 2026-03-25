/**
 * PIN Pad — 6-digit numeric keypad.
 * Uses ref-based pin tracking to avoid React state batching bugs.
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface PinPadProps {
  title: string;
  subtitle?: string;
  onComplete: (pin: string) => void;
  error?: string | null;
  maxLength?: number;
}

export function PinPad({ title, subtitle, onComplete, error, maxLength = 6 }: PinPadProps) {
  const pinRef = useRef('');
  const [displayLength, setDisplayLength] = useState(0);
  const lockedRef = useRef(false);

  const handlePress = useCallback((digit: string) => {
    if (lockedRef.current) return;
    if (pinRef.current.length >= maxLength) return;

    pinRef.current += digit;
    setDisplayLength(pinRef.current.length);

    if (pinRef.current.length === maxLength) {
      lockedRef.current = true;
      const finalPin = pinRef.current;
      // Small delay so user sees the last dot fill
      setTimeout(() => {
        onComplete(finalPin);
        pinRef.current = '';
        setDisplayLength(0);
        lockedRef.current = false;
      }, 150);
    }
  }, [maxLength, onComplete]);

  const handleDelete = useCallback(() => {
    if (lockedRef.current) return;
    if (pinRef.current.length === 0) return;

    pinRef.current = pinRef.current.slice(0, -1);
    setDisplayLength(pinRef.current.length);
  }, []);

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];

  return (
    <View style={s.container}>
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}

      <View style={s.dotsRow}>
        {Array.from({ length: maxLength }, (_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              i < displayLength && s.dotFilled,
              error && i < displayLength && s.dotError,
            ]}
          />
        ))}
      </View>

      {error && <Text style={s.error}>{error}</Text>}

      <View style={s.keypad}>
        {keys.map((row, ri) => (
          <View key={ri} style={s.keyRow}>
            {row.map((key) => {
              if (key === '') return <View key="empty" style={s.keyEmpty} />;
              if (key === 'del') {
                return (
                  <Pressable
                    key="del"
                    style={({ pressed }) => [s.key, pressed && s.keyPressed]}
                    onPress={handleDelete}
                  >
                    <Text style={s.keyTextDel}>←</Text>
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={key}
                  style={({ pressed }) => [s.key, pressed && s.keyPressed]}
                  onPress={() => handlePress(key)}
                >
                  <Text style={s.keyText}>{key}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f', paddingHorizontal: 40 },
  title: { color: '#f0f0f5', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#a0a0b0', fontSize: 14, marginBottom: 32 },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#606070' },
  dotFilled: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  dotError: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 16, fontWeight: '600' },
  keypad: { marginTop: 24, width: '100%' },
  keyRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  key: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#16161f', justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
  keyPressed: { backgroundColor: '#22c55e30', transform: [{ scale: 0.95 }] },
  keyEmpty: { width: 72, height: 72, marginHorizontal: 12 },
  keyText: { color: '#f0f0f5', fontSize: 28, fontWeight: '600' },
  keyTextDel: { color: '#a0a0b0', fontSize: 24, fontWeight: '600' },
});
