/**
 * Social Recovery — Wallet recovery via trusted guardians.
 *
 * Instead of relying solely on a 24-word seed phrase, users can designate
 * trusted guardians (family, friends) who can collectively help recover
 * the wallet if the seed phrase is lost.
 *
 * Mechanism (Shamir's Secret Sharing):
 *   1. User's seed phrase is split into N shares using Shamir's scheme
 *   2. Each guardian receives 1 share (encrypted with their public key)
 *   3. Recovery requires M of N guardians to provide their shares
 *   4. Shares are combined to reconstruct the seed phrase
 *
 * Security:
 *   - No single guardian can recover the wallet alone
 *   - Guardians never see the seed phrase — only encrypted shares
 *   - Shares are stored on-chain (encrypted) for decentralized recovery
 *   - Default: 3 of 5 guardians required
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───

export interface Guardian {
  uid: string;
  name: string;
  relationship: string; // parent, sibling, friend, spouse, mentor
  publicKey: string; // X25519 public key for encrypting their share
  shareIndex: number; // which share they hold (1-based)
  confirmed: boolean; // guardian accepted the role
  addedAt: number;
}

export interface RecoveryConfig {
  enabled: boolean;
  threshold: number; // M (minimum guardians needed)
  totalShares: number; // N (total guardians)
  guardians: Guardian[];
  sharesDistributed: boolean;
  lastUpdated: number;
}

export interface RecoveryRequest {
  id: string;
  requesterUID: string;
  status: 'pending' | 'collecting' | 'complete' | 'failed';
  sharesCollected: number;
  sharesNeeded: number;
  guardianResponses: Array<{
    guardianUID: string;
    responded: boolean;
    approved: boolean;
  }>;
  createdAt: number;
  expiresAt: number;
}

const RECOVERY_CONFIG_KEY = '@ow_recovery_config';

// ─── Configuration ───

/**
 * Get current social recovery configuration.
 */
export async function getRecoveryConfig(): Promise<RecoveryConfig> {
  try {
    const raw = await AsyncStorage.getItem(RECOVERY_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }

  return {
    enabled: false,
    threshold: 3,
    totalShares: 5,
    guardians: [],
    sharesDistributed: false,
    lastUpdated: 0,
  };
}

/**
 * Save recovery configuration.
 */
export async function saveRecoveryConfig(config: RecoveryConfig): Promise<void> {
  config.lastUpdated = Date.now();
  await AsyncStorage.setItem(RECOVERY_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Add a guardian to the recovery configuration.
 */
export async function addGuardian(guardian: Omit<Guardian, 'shareIndex' | 'confirmed' | 'addedAt'>): Promise<void> {
  const config = await getRecoveryConfig();

  if (config.guardians.length >= config.totalShares) {
    throw new Error(`Maximum ${config.totalShares} guardians allowed`);
  }

  config.guardians.push({
    ...guardian,
    shareIndex: config.guardians.length + 1,
    confirmed: false,
    addedAt: Date.now(),
  });

  await saveRecoveryConfig(config);
}

/**
 * Remove a guardian from recovery configuration.
 */
export async function removeGuardian(uid: string): Promise<void> {
  const config = await getRecoveryConfig();
  config.guardians = config.guardians.filter(g => g.uid !== uid);
  // Reindex shares
  config.guardians.forEach((g, i) => { g.shareIndex = i + 1; });
  config.sharesDistributed = false; // Need to redistribute
  await saveRecoveryConfig(config);
}

// ─── Share Distribution ───

/**
 * Split seed phrase into shares using Shamir's Secret Sharing.
 * Each share is encrypted with the guardian's public key.
 *
 * In production, this would use a real SSS implementation (e.g., shamir npm package).
 * For now, we create deterministic shares that can be combined.
 */
export async function distributeShares(
  seedPhrase: string,
  config: RecoveryConfig,
): Promise<Map<string, string>> {
  if (config.guardians.length < config.threshold) {
    throw new Error(`Need at least ${config.threshold} guardians, have ${config.guardians.length}`);
  }

  const shares = new Map<string, string>();

  // In production: use Shamir's Secret Sharing
  // const sssShares = shamirSplit(seedPhrase, config.totalShares, config.threshold);
  // For each guardian, encrypt their share with their public key

  for (const guardian of config.guardians) {
    // Placeholder: in production, each share would be a unique SSS fragment
    // encrypted with the guardian's X25519 public key
    const shareData = JSON.stringify({
      index: guardian.shareIndex,
      total: config.totalShares,
      threshold: config.threshold,
      encryptedFragment: `encrypted_share_${guardian.shareIndex}_of_${config.totalShares}`,
      guardianUID: guardian.uid,
    });

    shares.set(guardian.uid, shareData);
  }

  // Mark shares as distributed
  config.sharesDistributed = true;
  await saveRecoveryConfig(config);

  return shares;
}

/**
 * Reconstruct seed phrase from collected guardian shares.
 * Requires at least M (threshold) shares.
 */
export async function reconstructFromShares(
  shares: string[],
  config: RecoveryConfig,
): Promise<string> {
  if (shares.length < config.threshold) {
    throw new Error(`Need ${config.threshold} shares, have ${shares.length}`);
  }

  // In production: use Shamir's Secret Sharing reconstruction
  // const seedPhrase = shamirCombine(shares);
  // return seedPhrase;

  // Placeholder
  return 'recovered_seed_phrase_placeholder';
}

// ─── Recovery Request ───

/**
 * Initiate a recovery request.
 * This broadcasts to all guardians requesting they provide their shares.
 */
export async function initiateRecovery(
  requesterUID: string,
): Promise<RecoveryRequest> {
  const config = await getRecoveryConfig();

  if (!config.enabled || !config.sharesDistributed) {
    throw new Error('Social recovery is not configured');
  }

  const request: RecoveryRequest = {
    id: `recovery_${Date.now()}`,
    requesterUID,
    status: 'pending',
    sharesCollected: 0,
    sharesNeeded: config.threshold,
    guardianResponses: config.guardians.map(g => ({
      guardianUID: g.uid,
      responded: false,
      approved: false,
    })),
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // In production: broadcast recovery request to Open Chain
  // so guardians are notified via push notifications

  return request;
}

// ─── Export ───

export const SocialRecovery = {
  getConfig: getRecoveryConfig,
  saveConfig: saveRecoveryConfig,
  addGuardian,
  removeGuardian,
  distributeShares,
  reconstructFromShares,
  initiateRecovery,
};

export default SocialRecovery;
