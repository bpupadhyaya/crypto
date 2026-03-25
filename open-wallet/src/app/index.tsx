/**
 * Root index — redirects to tabs.
 * Auth gating is handled by _layout.tsx (no routing needed).
 */

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)" />;
}
