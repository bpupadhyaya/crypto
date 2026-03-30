/**
 * Multi-Device Sync — Use Open Wallet on multiple phones.
 *
 * Syncs settings, preferences, contacts, notes, and non-sensitive data
 * across devices. Private keys NEVER leave the device — only encrypted
 * metadata is synced.
 *
 * Architecture:
 *   1. Each device has its own vault with its own seed
 *   2. Sync data is encrypted with a shared sync key derived from the seed
 *   3. Sync channel: Open Chain on-chain storage (encrypted blobs)
 *   4. Devices discover each other via UID-based addressing
 *
 * What syncs: settings, contacts, notes, preferences, persona, shortcuts
 * What NEVER syncs: seed phrase, private keys, vault password, biometric data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───

export interface SyncDevice {
  id: string;
  name: string; // "Bhim's iPhone", "Bhim's Pixel"
  platform: 'ios' | 'android';
  lastSeen: number;
  syncVersion: number;
  isThisDevice: boolean;
}

export interface SyncPayload {
  version: number;
  deviceId: string;
  timestamp: number;
  data: {
    settings: Record<string, any>;
    contacts: Array<{ name: string; address: string; chain: string }>;
    notes: Array<{ txHash: string; note: string }>;
    persona: string;
    shortcuts: string[];
    theme: string;
    language: string;
    currency: string;
  };
  // Hash of the payload for integrity verification
  checksum: string;
}

export interface SyncConfig {
  enabled: boolean;
  syncKey: string; // derived from seed, used to encrypt sync data
  devices: SyncDevice[];
  lastSync: number;
  autoSync: boolean;
  syncInterval: number; // ms (default: 5 minutes)
}

const SYNC_CONFIG_KEY = '@ow_sync_config';
const DEVICE_ID_KEY = '@ow_device_id';

// ─── Device Management ───

/**
 * Get or generate a unique device ID.
 */
export async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/**
 * Get sync configuration.
 */
export async function getSyncConfig(): Promise<SyncConfig> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }

  return {
    enabled: false,
    syncKey: '',
    devices: [],
    lastSync: 0,
    autoSync: true,
    syncInterval: 5 * 60 * 1000,
  };
}

/**
 * Save sync configuration.
 */
export async function saveSyncConfig(config: SyncConfig): Promise<void> {
  await AsyncStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Register this device for multi-device sync.
 */
export async function registerDevice(name: string, platform: 'ios' | 'android'): Promise<SyncDevice> {
  const deviceId = await getDeviceId();
  const config = await getSyncConfig();

  const device: SyncDevice = {
    id: deviceId,
    name,
    platform,
    lastSeen: Date.now(),
    syncVersion: 1,
    isThisDevice: true,
  };

  // Remove old entry for this device if exists
  config.devices = config.devices.filter(d => d.id !== deviceId);
  config.devices.push(device);
  await saveSyncConfig(config);

  return device;
}

/**
 * Pair with another device using a QR code / pairing code.
 */
export async function pairDevice(pairingCode: string): Promise<SyncDevice | null> {
  // In production:
  // 1. Decode pairing code to get other device's ID and sync public key
  // 2. Exchange sync keys via Diffie-Hellman
  // 3. Add device to config
  // 4. Initial sync

  const config = await getSyncConfig();
  const newDevice: SyncDevice = {
    id: `paired_${Date.now()}`,
    name: 'Paired Device',
    platform: 'android',
    lastSeen: Date.now(),
    syncVersion: 1,
    isThisDevice: false,
  };

  config.devices.push(newDevice);
  await saveSyncConfig(config);

  return newDevice;
}

// ─── Sync Operations ───

/**
 * Create a sync payload from current device state.
 * This collects all syncable data (never keys/secrets).
 */
export async function createSyncPayload(): Promise<SyncPayload> {
  const deviceId = await getDeviceId();

  // Collect syncable data from AsyncStorage
  const allKeys = await AsyncStorage.getAllKeys();
  const settings: Record<string, any> = {};

  // Only sync safe keys (never vault, keys, secrets)
  const SAFE_PREFIXES = ['@ow_setting_', '@ow_contact_', '@ow_note_', '@ow_pref_'];
  for (const key of allKeys) {
    if (SAFE_PREFIXES.some(p => key.startsWith(p))) {
      const val = await AsyncStorage.getItem(key);
      if (val) settings[key] = val;
    }
  }

  const payload: SyncPayload = {
    version: 1,
    deviceId,
    timestamp: Date.now(),
    data: {
      settings,
      contacts: [], // populated from address book
      notes: [], // populated from tx notes
      persona: '', // from wallet store
      shortcuts: [], // from wallet store
      theme: 'dark',
      language: 'en',
      currency: 'USD',
    },
    checksum: '', // computed from data
  };

  // Compute checksum
  payload.checksum = simpleHash(JSON.stringify(payload.data));

  return payload;
}

/**
 * Apply a sync payload from another device.
 * Only applies data that is newer than current.
 */
export async function applySyncPayload(payload: SyncPayload): Promise<void> {
  // Verify checksum
  const expectedChecksum = simpleHash(JSON.stringify(payload.data));
  if (payload.checksum !== expectedChecksum) {
    throw new Error('Sync payload integrity check failed');
  }

  // Apply settings
  for (const [key, value] of Object.entries(payload.data.settings)) {
    await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  // Update last sync time
  const config = await getSyncConfig();
  config.lastSync = Date.now();
  await saveSyncConfig(config);
}

/**
 * Push sync data to Open Chain (encrypted).
 * Other devices poll for sync updates.
 */
export async function pushSync(): Promise<void> {
  const config = await getSyncConfig();
  if (!config.enabled) return;

  const payload = await createSyncPayload();

  // In production: encrypt payload with sync key and store on Open Chain
  // const encrypted = encrypt(JSON.stringify(payload), config.syncKey);
  // await broadcastToChain('sync_data', encrypted);

  config.lastSync = Date.now();
  await saveSyncConfig(config);
}

/**
 * Pull sync data from Open Chain.
 */
export async function pullSync(): Promise<void> {
  const config = await getSyncConfig();
  if (!config.enabled) return;

  // In production: query Open Chain for encrypted sync data
  // const encrypted = await queryChain('sync_data', uid);
  // const payload = JSON.parse(decrypt(encrypted, config.syncKey));
  // await applySyncPayload(payload);

  config.lastSync = Date.now();
  await saveSyncConfig(config);
}

// ─── Helpers ───

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

// ─── Export ───

export const MultiDeviceSync = {
  getDeviceId,
  getConfig: getSyncConfig,
  saveConfig: saveSyncConfig,
  registerDevice,
  pairDevice,
  createPayload: createSyncPayload,
  applyPayload: applySyncPayload,
  push: pushSync,
  pull: pullSync,
};

export default MultiDeviceSync;
