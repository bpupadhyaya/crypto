/**
 * Toast — In-app notification that auto-dismisses.
 * Appears at the top of the screen with a slide animation.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Global toast queue
let toastListeners: ((toast: ToastMessage) => void)[] = [];

export function showToast(type: ToastType, title: string, message?: string, duration?: number) {
  const toast: ToastMessage = { id: Date.now().toString(), type, title, message, duration: duration ?? 3000 };
  toastListeners.forEach((fn) => fn(toast));
}

const COLORS: Record<ToastType, { bg: string; border: string }> = {
  success: { bg: '#22c55e15', border: '#22c55e' },
  error: { bg: '#ef444415', border: '#ef4444' },
  info: { bg: '#3b82f615', border: '#3b82f6' },
  warning: { bg: '#eab30815', border: '#eab308' },
};

const ICONS: Record<ToastType, string> = {
  success: '✓', error: '✕', info: 'ℹ', warning: '⚠',
};

export const ToastContainer = React.memo(() => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration ?? 3000);
    };
    toastListeners.push(listener);
    return () => { toastListeners = toastListeners.filter((fn) => fn !== listener); };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <View style={s.container} pointerEvents="box-none">
      {toasts.map((toast) => {
        const colors = COLORS[toast.type];
        return (
          <TouchableOpacity
            key={toast.id}
            style={[s.toast, { backgroundColor: colors.bg, borderLeftColor: colors.border }]}
            onPress={() => dismiss(toast.id)}
            activeOpacity={0.8}
          >
            <Text style={[s.icon, { color: colors.border }]}>{ICONS[toast.type]}</Text>
            <View style={s.textContainer}>
              <Text style={s.title}>{toast.title}</Text>
              {toast.message && <Text style={s.message}>{toast.message}</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const s = StyleSheet.create({
  container: { position: 'absolute', top: 60, left: 16, right: 16, zIndex: 9999 },
  toast: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 4 },
  icon: { fontSize: 18, fontWeight: '700', marginRight: 12 },
  textContainer: { flex: 1 },
  title: { color: '#f0f0f5', fontSize: 14, fontWeight: '700' },
  message: { color: '#a0a0b0', fontSize: 12, marginTop: 2 },
});
