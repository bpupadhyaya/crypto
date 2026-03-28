/**
 * Name Service Resolution — resolve human-readable names to addresses.
 *
 * Supports ENS (.eth), SNS (.sol), Open Chain UID (uid-*),
 * and Unstoppable Domains (.crypto, .x, .wallet, .nft, .blockchain).
 * Each resolution has a 3s timeout; returns null on failure.
 */

import { getNetworkConfig } from '../network';

export interface ResolvedAddress {
  address: string;
  chain: string;
  nameService: 'ENS' | 'SNS' | 'OpenChain UID' | 'Unstoppable';
  avatar?: string;
}

// ─── Timeout helper ───

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

const TIMEOUT_MS = 3000;

// ─── ENS Resolution (.eth) ───

async function resolveENS(name: string): Promise<ResolvedAddress | null> {
  const config = getNetworkConfig();
  // ENS registry on mainnet: 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
  // We use eth_call to the universal resolver for simplicity.
  // namehash is computed off the name.
  const namehash = ensNamehash(name);
  // Call resolver(bytes32 node) on the ENS registry to get the resolver address,
  // then call addr(bytes32 node) on that resolver.
  // For a simpler approach, we use the ENS universal resolver at a known address.
  // Fallback: use a public ENS API endpoint.
  try {
    // Use eth_call to ENS public resolver
    // Step 1: get resolver for this name from ENS registry
    const registryAddr = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
    const resolverSig = '0x0178b8bf'; // resolver(bytes32)
    const resolverCalldata = resolverSig + namehash.slice(2);

    const resolverResult = await ethCall(config.ethereum.rpcUrl, registryAddr, resolverCalldata);
    if (!resolverResult || resolverResult === '0x' || resolverResult === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return null;
    }
    const resolverAddr = '0x' + resolverResult.slice(26, 66);

    // Step 2: call addr(bytes32) on the resolver
    const addrSig = '0x3b3b57de'; // addr(bytes32)
    const addrCalldata = addrSig + namehash.slice(2);
    const addrResult = await ethCall(config.ethereum.rpcUrl, resolverAddr, addrCalldata);
    if (!addrResult || addrResult === '0x' || addrResult === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return null;
    }
    const address = '0x' + addrResult.slice(26, 66);

    // Step 3: try to get avatar (optional, best-effort)
    let avatar: string | undefined;
    try {
      const textSig = '0x59d1d43c'; // text(bytes32,string)
      // ABI encode: namehash + offset(64) + length(6) + "avatar" padded
      const avatarKey = '0000000000000000000000000000000000000000000000000000000000000040' +
        '0000000000000000000000000000000000000000000000000000000000000006' +
        '6176617461720000000000000000000000000000000000000000000000000000';
      const textCalldata = textSig + namehash.slice(2) + avatarKey;
      const textResult = await ethCall(config.ethereum.rpcUrl, resolverAddr, textCalldata);
      if (textResult && textResult.length > 130) {
        const decoded = decodeABIString(textResult);
        if (decoded) avatar = decoded;
      }
    } catch {
      // avatar is optional
    }

    return { address, chain: 'ethereum', nameService: 'ENS', avatar };
  } catch {
    return null;
  }
}

/** Minimal ENS namehash (EIP-137) */
function ensNamehash(name: string): string {
  const labels = name.split('.');
  let node: Uint8Array = new Uint8Array(32); // starts as 0x00...00
  for (let i = labels.length - 1; i >= 0; i--) {
    const encoded = new TextEncoder().encode(labels[i]);
    const labelHash = keccak256Bytes(new Uint8Array(encoded.buffer));
    const combined = new Uint8Array(64);
    combined.set(node, 0);
    combined.set(labelHash, 32);
    node = new Uint8Array(keccak256Bytes(combined));
  }
  return '0x' + bytesToHex(node);
}

/** eth_call helper */
async function ethCall(rpcUrl: string, to: string, data: string): Promise<string> {
  const resp = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to, data }, 'latest'],
    }),
  });
  const json = await resp.json();
  return json.result ?? '';
}

/** Decode ABI-encoded string from eth_call result */
function decodeABIString(hex: string): string | null {
  try {
    const data = hex.startsWith('0x') ? hex.slice(2) : hex;
    // offset at position 0 (32 bytes), length at offset, then string bytes
    const offset = parseInt(data.slice(0, 64), 16) * 2;
    const length = parseInt(data.slice(offset, offset + 64), 16);
    if (length === 0 || length > 1000) return null;
    const strHex = data.slice(offset + 64, offset + 64 + length * 2);
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = parseInt(strHex.slice(i * 2, i * 2 + 2), 16);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

// ─── SNS Resolution (.sol) ───

async function resolveSNS(name: string): Promise<ResolvedAddress | null> {
  const config = getNetworkConfig();
  try {
    // Solana Name Service uses a deterministic PDA from the name hash.
    // The simplest cross-platform approach: query the SNS API.
    const domain = name.replace(/\.sol$/, '');
    const resp = await fetch(
      `https://sns-sdk-proxy.bonfida.workers.dev/resolve/${domain}`,
    );
    if (!resp.ok) return null;
    const json = await resp.json();
    const address = json.result ?? json.s ?? null;
    if (!address || typeof address !== 'string') return null;
    return { address, chain: 'solana', nameService: 'SNS' };
  } catch {
    return null;
  }
}

// ─── Open Chain UID Resolution (uid-*) ───

async function resolveOpenChainUID(uid: string): Promise<ResolvedAddress | null> {
  const config = getNetworkConfig();
  try {
    const restUrl = config.openchain.restUrl;
    const resp = await fetch(`${restUrl}/openchain/identity/resolve/${uid}`);
    if (!resp.ok) return null;
    const json = await resp.json();
    const address = json.address ?? json.result?.address ?? null;
    if (!address || typeof address !== 'string') return null;
    return { address, chain: 'openchain', nameService: 'OpenChain UID' };
  } catch {
    return null;
  }
}

// ─── Unstoppable Domains Resolution (.crypto, .x, .wallet, .nft, .blockchain) ───

const UNSTOPPABLE_TLDS = ['.crypto', '.x', '.wallet', '.nft', '.blockchain', '.dao', '.888', '.zil'];

async function resolveUnstoppable(name: string): Promise<ResolvedAddress | null> {
  try {
    // Unstoppable Domains provides a free resolution API
    const resp = await fetch(
      `https://resolve.unstoppabledomains.com/domains/${name}`,
      { headers: { Authorization: 'Bearer ' } }, // works without key for basic resolution
    );
    if (!resp.ok) return null;
    const json = await resp.json();
    const records = json.records ?? json.meta?.records ?? {};
    // Try to find an ETH address first, then others
    const ethAddr = records['crypto.ETH.address'];
    if (ethAddr) {
      return { address: ethAddr, chain: 'ethereum', nameService: 'Unstoppable' };
    }
    const solAddr = records['crypto.SOL.address'];
    if (solAddr) {
      return { address: solAddr, chain: 'solana', nameService: 'Unstoppable' };
    }
    const btcAddr = records['crypto.BTC.address'];
    if (btcAddr) {
      return { address: btcAddr, chain: 'bitcoin', nameService: 'Unstoppable' };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Public API ───

/**
 * Detect which name service a name belongs to based on its format.
 */
export function detectNameService(name: string): 'ENS' | 'SNS' | 'OpenChain UID' | 'Unstoppable' | null {
  const trimmed = name.trim().toLowerCase();
  if (trimmed.endsWith('.eth')) return 'ENS';
  if (trimmed.endsWith('.sol')) return 'SNS';
  if (trimmed.startsWith('uid-')) return 'OpenChain UID';
  if (UNSTOPPABLE_TLDS.some((tld) => trimmed.endsWith(tld))) return 'Unstoppable';
  return null;
}

/**
 * Returns true if the input looks like a name-service name rather than a raw address.
 */
export function isNameServiceInput(input: string): boolean {
  return detectNameService(input) !== null;
}

/**
 * Resolve a human-readable name to an on-chain address.
 * Returns null if the name cannot be resolved or times out.
 */
export async function resolveName(name: string): Promise<ResolvedAddress | null> {
  const service = detectNameService(name);
  if (!service) return null;

  try {
    switch (service) {
      case 'ENS':
        return await withTimeout(resolveENS(name.trim()), TIMEOUT_MS);
      case 'SNS':
        return await withTimeout(resolveSNS(name.trim()), TIMEOUT_MS);
      case 'OpenChain UID':
        return await withTimeout(resolveOpenChainUID(name.trim()), TIMEOUT_MS);
      case 'Unstoppable':
        return await withTimeout(resolveUnstoppable(name.trim()), TIMEOUT_MS);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Reverse-resolve an address to a human-readable name.
 * Currently supports ENS reverse resolution only.
 * Returns null if no name is found or on timeout.
 */
export async function reverseResolve(address: string, chain: string): Promise<string | null> {
  try {
    if (chain === 'ethereum') {
      return await withTimeout(reverseResolveENS(address), TIMEOUT_MS);
    }
    // Other name services don't have standardized reverse resolution yet
    return null;
  } catch {
    return null;
  }
}

async function reverseResolveENS(address: string): Promise<string | null> {
  const config = getNetworkConfig();
  try {
    // Reverse resolution: <addr>.addr.reverse → name
    const addr = address.toLowerCase().slice(2); // remove 0x
    const reverseName = `${addr}.addr.reverse`;
    const namehash = ensNamehash(reverseName);

    const registryAddr = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
    const resolverSig = '0x0178b8bf';
    const resolverCalldata = resolverSig + namehash.slice(2);
    const resolverResult = await ethCall(config.ethereum.rpcUrl, registryAddr, resolverCalldata);
    if (!resolverResult || resolverResult === '0x' || resolverResult === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return null;
    }
    const resolverAddr = '0x' + resolverResult.slice(26, 66);

    // Call name(bytes32) on the resolver
    const nameSig = '0x691f3431'; // name(bytes32)
    const nameCalldata = nameSig + namehash.slice(2);
    const nameResult = await ethCall(config.ethereum.rpcUrl, resolverAddr, nameCalldata);
    if (!nameResult || nameResult.length < 130) return null;

    return decodeABIString(nameResult);
  } catch {
    return null;
  }
}

// ─── Minimal keccak256 for ENS namehash ───

// This is a pure-JS keccak256 implementation (FIPS 202 / SHA-3 family).
// In production, the app already has crypto libs from ethereum-signer;
// this standalone version avoids importing heavy dependencies at module load.

function keccak256Bytes(data: Uint8Array): Uint8Array {
  return keccakF1600(data, 256);
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// ─── Keccak-256 (standalone, no dependencies) ───

const KECCAK_ROUNDS = 24;
const RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an,
  0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
  0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an,
  0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
  0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
  0x000000000000800an, 0x800000008000000an, 0x8000000080008081n,
  0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

const ROTC = [
  1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44,
];

const PI = [
  10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1,
];

function keccakF1600(input: Uint8Array, bits: number): Uint8Array {
  const rate = (1600 - bits * 2) / 8; // 136 for keccak-256
  const outputLen = bits / 8; // 32

  // Padding
  const padLen = rate - (input.length % rate);
  const padded = new Uint8Array(input.length + padLen);
  padded.set(input);
  padded[input.length] = 0x01;
  padded[padded.length - 1] |= 0x80;

  // State: 25 x 64-bit words
  const state = new BigUint64Array(25);

  // Absorb
  for (let offset = 0; offset < padded.length; offset += rate) {
    for (let i = 0; i < rate / 8; i++) {
      let word = 0n;
      for (let b = 0; b < 8; b++) {
        word |= BigInt(padded[offset + i * 8 + b]) << BigInt(b * 8);
      }
      state[i] ^= word;
    }
    keccakPermute(state);
  }

  // Squeeze
  const out = new Uint8Array(outputLen);
  for (let i = 0; i < outputLen / 8; i++) {
    const word = state[i];
    for (let b = 0; b < 8 && i * 8 + b < outputLen; b++) {
      out[i * 8 + b] = Number((word >> BigInt(b * 8)) & 0xFFn);
    }
  }
  return out;
}

function keccakPermute(state: BigUint64Array): void {
  const mask64 = 0xFFFFFFFFFFFFFFFFn;
  for (let round = 0; round < KECCAK_ROUNDS; round++) {
    // Theta
    const C = new BigUint64Array(5);
    for (let x = 0; x < 5; x++) {
      C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }
    for (let x = 0; x < 5; x++) {
      const d = C[(x + 4) % 5] ^ (((C[(x + 1) % 5] << 1n) | (C[(x + 1) % 5] >> 63n)) & mask64);
      for (let y = 0; y < 25; y += 5) {
        state[y + x] = (state[y + x] ^ d) & mask64;
      }
    }
    // Rho + Pi
    let last = state[1];
    for (let i = 0; i < 24; i++) {
      const j = PI[i];
      const temp = state[j];
      const r = BigInt(ROTC[i]);
      state[j] = (((last << r) | (last >> (64n - r))) & mask64);
      last = temp;
    }
    // Chi
    for (let y = 0; y < 25; y += 5) {
      const t0 = state[y];
      const t1 = state[y + 1];
      const t2 = state[y + 2];
      const t3 = state[y + 3];
      const t4 = state[y + 4];
      state[y] = (t0 ^ ((~t1 & mask64) & t2)) & mask64;
      state[y + 1] = (t1 ^ ((~t2 & mask64) & t3)) & mask64;
      state[y + 2] = (t2 ^ ((~t3 & mask64) & t4)) & mask64;
      state[y + 3] = (t3 ^ ((~t4 & mask64) & t0)) & mask64;
      state[y + 4] = (t4 ^ ((~t0 & mask64) & t1)) & mask64;
    }
    // Iota
    state[0] = (state[0] ^ RC[round]) & mask64;
  }
}
