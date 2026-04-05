/**
 * Secure Clipboard — copies sensitive data and auto-clears after timeout.
 *
 * Prevents seed phrases, private keys, and addresses from lingering
 * in the clipboard where other apps could read them.
 */

import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

const DEFAULT_CLEAR_TIMEOUT_MS = 60_000; // 60 seconds

let clearTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Copy sensitive text to clipboard with auto-clear.
 * Shows an alert confirming the copy and warning about auto-clear.
 *
 * @param text Text to copy
 * @param label Description for the alert (e.g., "Seed phrase", "Address")
 * @param clearAfterMs Milliseconds before clipboard is cleared (default 60s)
 */
export async function secureCopy(
  text: string,
  label: string = 'Text',
  clearAfterMs: number = DEFAULT_CLEAR_TIMEOUT_MS,
): Promise<void> {
  await Clipboard.setStringAsync(text);

  // Cancel any existing clear timer
  if (clearTimer) {
    clearTimeout(clearTimer);
  }

  // Schedule auto-clear
  clearTimer = setTimeout(async () => {
    try {
      await Clipboard.setStringAsync('');
    } catch {
      // Clipboard clear failed — not critical
    }
    clearTimer = null;
  }, clearAfterMs);

  const seconds = Math.round(clearAfterMs / 1000);
  Alert.alert(
    'Copied',
    `${label} copied to clipboard.\n\nFor security, clipboard will be cleared in ${seconds} seconds.`,
  );
}

/**
 * Immediately clear the clipboard.
 */
export async function clearClipboard(): Promise<void> {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
  try {
    await Clipboard.setStringAsync('');
  } catch {
    // Ignore
  }
}
