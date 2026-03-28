/**
 * App Rating Prompt — ask users to rate after positive experiences.
 *
 * Triggers after:
 * - 3rd successful transaction
 * - 1st gratitude sent
 * - 7 days of usage
 *
 * Uses expo-store-review for native App Store / Play Store rating dialog.
 * Only prompts once per version. Never interrupts critical flows.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const RATING_KEY = 'ow-rating-state';

interface RatingState {
  prompted: boolean;
  promptedVersion: string;
  txCount: number;
  gratitudeSent: boolean;
  firstOpenDate: number;
}

async function getState(): Promise<RatingState> {
  try {
    const raw = await AsyncStorage.getItem(RATING_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    prompted: false,
    promptedVersion: '',
    txCount: 0,
    gratitudeSent: false,
    firstOpenDate: Date.now(),
  };
}

async function setState(state: RatingState) {
  await AsyncStorage.setItem(RATING_KEY, JSON.stringify(state));
}

/** Record a successful transaction. */
export async function recordTransaction() {
  const state = await getState();
  state.txCount++;
  await setState(state);
  await maybePrompt(state);
}

/** Record gratitude sent. */
export async function recordGratitude() {
  const state = await getState();
  state.gratitudeSent = true;
  await setState(state);
  await maybePrompt(state);
}

/** Check if we should prompt for rating. */
async function maybePrompt(state: RatingState) {
  if (state.prompted) return;

  const currentVersion = '0.3.0';
  if (state.promptedVersion === currentVersion) return;

  const daysSinceFirst = (Date.now() - state.firstOpenDate) / (1000 * 60 * 60 * 24);

  const shouldPrompt =
    state.txCount >= 3 ||
    state.gratitudeSent ||
    daysSinceFirst >= 7;

  if (shouldPrompt) {
    state.prompted = true;
    state.promptedVersion = currentVersion;
    await setState(state);

    try {
      // Try expo-store-review if available
      try {
        const StoreReview = require('expo-store-review');
        if (await StoreReview.isAvailableAsync()) {
          setTimeout(() => StoreReview.requestReview(), 2000);
        }
      } catch {
        // expo-store-review not installed — skip
      }
    } catch {
      // expo-store-review not available — skip silently
    }
  }
}

/** Initialize on first app open. */
export async function initRating() {
  const state = await getState();
  if (state.firstOpenDate === 0) {
    state.firstOpenDate = Date.now();
    await setState(state);
  }
}
