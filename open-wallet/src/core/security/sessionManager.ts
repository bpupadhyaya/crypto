/**
 * Session Manager — auto-lock wallet after inactivity timeout.
 * Checks every 30s if the user has been idle beyond the configured timeout.
 */

export interface Session {
  startedAt: number;
  lastActivity: number;
  autoLockTimeout: number; // ms (default: 5 min)
  isActive: boolean;
}

type AutoLockCallback = () => void;

const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const CHECK_INTERVAL = 30 * 1000; // 30 seconds

let session: Session = {
  startedAt: 0,
  lastActivity: 0,
  autoLockTimeout: DEFAULT_TIMEOUT,
  isActive: false,
};

let checkTimer: ReturnType<typeof setInterval> | null = null;
const listeners: Set<AutoLockCallback> = new Set();

function checkAutoLock(): void {
  if (!session.isActive) return;
  // timeout of 0 means "never"
  if (session.autoLockTimeout === 0) return;

  const now = Date.now();
  const elapsed = now - session.lastActivity;

  if (elapsed >= session.autoLockTimeout) {
    session.isActive = false;
    stopTimer();
    listeners.forEach((cb) => {
      try { cb(); } catch {}
    });
  }
}

function startTimer(): void {
  if (checkTimer) return;
  checkTimer = setInterval(checkAutoLock, CHECK_INTERVAL);
}

function stopTimer(): void {
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
}

/** Start a new session. Optionally override the auto-lock timeout. */
export function startSession(timeout?: number): void {
  const now = Date.now();
  session = {
    startedAt: now,
    lastActivity: now,
    autoLockTimeout: timeout ?? session.autoLockTimeout,
    isActive: true,
  };
  startTimer();
}

/** Record user activity — resets the inactivity timer. */
export function recordActivity(): void {
  if (session.isActive) {
    session.lastActivity = Date.now();
  }
}

/** Get current session state (returns a copy). */
export function getSession(): Session {
  return { ...session };
}

/** Update the auto-lock timeout (in milliseconds). 0 = never auto-lock. */
export function setAutoLockTimeout(ms: number): void {
  session.autoLockTimeout = ms;
}

/** Register a callback for auto-lock events. Returns an unsubscribe function. */
export function onAutoLock(callback: AutoLockCallback): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/** End the current session (e.g., on manual lock or sign-out). */
export function endSession(): void {
  session.isActive = false;
  stopTimer();
}
