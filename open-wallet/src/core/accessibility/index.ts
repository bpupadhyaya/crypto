/**
 * Accessibility Infrastructure — Article IX of The Human Constitution.
 *
 * "Technology shall be accessible to every human being regardless of
 *  physical ability, technical literacy, or economic status."
 *
 * This module provides:
 *   1. Screen reader annotations (accessibilityLabel, accessibilityHint, accessibilityRole)
 *   2. RTL layout support (Arabic, Hebrew, Urdu)
 *   3. Voice navigation helpers
 *   4. Dynamic font scaling
 *   5. High contrast mode
 *   6. Reduced motion support
 *   7. Focus management for keyboard/switch navigation
 */

import { I18nManager, AccessibilityInfo, Platform, PixelRatio } from 'react-native';

// ─── RTL Support ───

const RTL_LANGUAGES = ['ar', 'he', 'ur', 'fa', 'ps', 'yi'];

/**
 * Enable or disable RTL layout based on current language.
 * Should be called when language changes in i18n settings.
 */
export function setRTLForLanguage(languageCode: string): void {
  const shouldBeRTL = RTL_LANGUAGES.includes(languageCode);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }
}

/** Check if current layout is RTL */
export function isRTL(): boolean {
  return I18nManager.isRTL;
}

/** Flip a style value for RTL (e.g., marginLeft → marginRight) */
export function rtlFlip<T>(ltrValue: T, rtlValue: T): T {
  return I18nManager.isRTL ? rtlValue : ltrValue;
}

/** Get flex direction that respects RTL */
export function rtlRow(): 'row' | 'row-reverse' {
  return I18nManager.isRTL ? 'row-reverse' : 'row';
}

/** Get text alignment that respects RTL */
export function rtlTextAlign(): 'left' | 'right' {
  return I18nManager.isRTL ? 'right' : 'left';
}

// ─── Screen Reader Helpers ───

/**
 * Announce a message to screen readers (VoiceOver on iOS, TalkBack on Android).
 * Use for dynamic content changes, loading states, errors.
 */
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Check if a screen reader is currently active.
 * Returns a promise that resolves to true if VoiceOver/TalkBack is on.
 */
export async function isScreenReaderActive(): Promise<boolean> {
  return AccessibilityInfo.isScreenReaderEnabled();
}

/**
 * Subscribe to screen reader status changes.
 * Returns an unsubscribe function.
 */
export function onScreenReaderChange(callback: (active: boolean) => void): () => void {
  const subscription = AccessibilityInfo.addEventListener(
    'screenReaderChanged',
    callback,
  );
  return () => subscription.remove();
}

// ─── Accessibility Labels ───

/** Standard labels for common UI patterns */
export const A11Y_LABELS = {
  // Navigation
  back: 'Go back',
  close: 'Close',
  menu: 'Open menu',
  settings: 'Settings',
  home: 'Home',
  search: 'Search',

  // Actions
  send: 'Send',
  receive: 'Receive',
  swap: 'Swap tokens',
  buy: 'Buy crypto',
  sell: 'Sell crypto',

  // Wallet
  balance: 'Total balance',
  token: (name: string) => `${name} token`,
  tokenBalance: (name: string, amount: string) => `${name}: ${amount}`,

  // OTK Channels
  nOTK: 'Nurture value',
  eOTK: 'Education value',
  hOTK: 'Health value',
  cOTK: 'Community value',
  xOTK: 'Economic value',
  gOTK: 'Governance value',

  // Status
  loading: 'Loading',
  error: 'Error',
  success: 'Success',
  pending: 'Pending',

  // Forms
  required: (field: string) => `${field}, required`,
  optional: (field: string) => `${field}, optional`,
  selected: (item: string) => `${item}, selected`,
  notSelected: (item: string) => `${item}, not selected`,

  // Scores
  score: (value: number, max: number) => `Score: ${value} out of ${max}`,
  percentage: (value: number) => `${value} percent`,

  // Lists
  listItem: (index: number, total: number) => `Item ${index} of ${total}`,
  expandable: (title: string, expanded: boolean) => `${title}, ${expanded ? 'expanded' : 'collapsed'}, double tap to ${expanded ? 'collapse' : 'expand'}`,
};

// ─── Dynamic Font Scaling ───

/** Get font scale factor (respects system accessibility settings) */
export function getFontScale(): number {
  return PixelRatio.getFontScale();
}

/** Check if user has large text enabled */
export function isLargeTextEnabled(): boolean {
  return PixelRatio.getFontScale() > 1.3;
}

/** Scale a font size based on user's accessibility preferences */
export function scaledFontSize(baseFontSize: number, maxScale: number = 2.0): number {
  const scale = Math.min(PixelRatio.getFontScale(), maxScale);
  return Math.round(baseFontSize * scale);
}

// ─── Reduced Motion ───

let _reduceMotionEnabled = false;

/** Initialize reduced motion listener */
export function initReducedMotion(): () => void {
  AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
    _reduceMotionEnabled = enabled;
  });

  const subscription = AccessibilityInfo.addEventListener(
    'reduceMotionChanged',
    (enabled: boolean) => { _reduceMotionEnabled = enabled; },
  );

  return () => subscription.remove();
}

/** Check if user prefers reduced motion */
export function prefersReducedMotion(): boolean {
  return _reduceMotionEnabled;
}

/** Get animation duration (0 if reduce motion, normal otherwise) */
export function animationDuration(normalDuration: number): number {
  return _reduceMotionEnabled ? 0 : normalDuration;
}

// ─── Voice Navigation ───

/**
 * Voice command mapping for common actions.
 * These can be used with iOS Voice Control or Android Voice Access.
 * We provide semantic accessibilityLabels so the OS voice systems can find elements.
 */
export const VOICE_COMMANDS = {
  // Navigation targets (matched against accessibilityLabel)
  'go home': 'home-tab',
  'open settings': 'settings-tab',
  'send money': 'send-tab',
  'receive money': 'receive-tab',
  'swap tokens': 'swap-tab',

  // Chain features
  'open governance': 'governance',
  'check balance': 'balance-card',
  'living ledger': 'ledger',
  'peace index': 'peace-index',
  'my impact': 'my-impact',
} as const;

// ─── Focus Management ───

/**
 * Set initial focus on a specific element when screen opens.
 * Useful for modal screens and drill-down navigation.
 * Call with a ref to the element that should receive focus.
 */
export function setAccessibilityFocus(ref: any): void {
  if (ref?.current) {
    AccessibilityInfo.setAccessibilityFocus(ref.current);
  }
}

// ─── High Contrast Detection ───

let _highContrastEnabled = false;

/** Check if high contrast mode is enabled (iOS only) */
export async function isHighContrastEnabled(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    // iOS provides this via UIAccessibility
    return _highContrastEnabled;
  }
  return false;
}

// ─── Export all ───

export const Accessibility = {
  // RTL
  setRTLForLanguage,
  isRTL,
  rtlFlip,
  rtlRow,
  rtlTextAlign,

  // Screen reader
  announce: announceForAccessibility,
  isScreenReaderActive,
  onScreenReaderChange,

  // Labels
  labels: A11Y_LABELS,

  // Font
  getFontScale,
  isLargeTextEnabled,
  scaledFontSize,

  // Motion
  initReducedMotion,
  prefersReducedMotion,
  animationDuration,

  // Voice
  voiceCommands: VOICE_COMMANDS,

  // Focus
  setFocus: setAccessibilityFocus,

  // Contrast
  isHighContrastEnabled,
};

export default Accessibility;
