/**
 * Auto-lock hook — locks wallet after inactivity.
 *
 * Guarantees the user is actively present:
 *   - Locks after 5 minutes of no interaction
 *   - Locks when app goes to background
 *   - Re-auth required via biometric or PIN to resume
 *
 * Combined with biometric (Face ID uses IR depth = real face,
 * fingerprint uses capacitive = real finger), this ensures
 * a living, present user is controlling the wallet.
 */

import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useWalletStore } from '../store/walletStore';

const AUTO_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function useAutoLock() {
  const { status, setStatus } = useWalletStore();
  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== 'unlocked') return;

    // Track app state changes (background/foreground)
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // Lock immediately when app goes to background
        setStatus('locked');
      } else if (nextState === 'active') {
        // Check if timed out while in background
        if (Date.now() - lastActivityRef.current > AUTO_LOCK_TIMEOUT_MS) {
          setStatus('locked');
        }
      }
    });

    // Inactivity timer
    timerRef.current = setInterval(() => {
      if (Date.now() - lastActivityRef.current > AUTO_LOCK_TIMEOUT_MS) {
        setStatus('locked');
      }
    }, 30_000); // check every 30s

    return () => {
      subscription.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, setStatus]);

  // Call this on any user interaction to reset the timer
  const resetTimer = () => {
    lastActivityRef.current = Date.now();
  };

  return { resetTimer };
}
