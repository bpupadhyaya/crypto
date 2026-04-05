/**
 * NFT Fetcher — Retrieves real NFTs from Ethereum and Solana.
 *
 * Ethereum: Uses Alchemy NFT API when EXPO_PUBLIC_ALCHEMY_KEY is set,
 *   otherwise falls back to querying ERC-721 Transfer events via RPC
 *   and fetching tokenURI metadata.
 *
 * Solana: Uses RPC getTokenAccountsByOwner to discover NFTs
 *   (amount=1, decimals=0), then reads Metaplex metadata accounts.
 */

import { getNetworkConfig } from '../network';

// ─── Types ───

export interface NFTItem {
  id: string;
  name: string;
  description: string;
  image: string;
  chain: 'ethereum' | 'solana';
  contractAddress: string;
  tokenId: string;
  collection?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

// ─── IPFS Helpers ───

function resolveIpfsUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('ipfs://')) {
    return 'https://ipfs.io/ipfs/' + url.slice(7);
  }
  if (url.startsWith('ar://')) {
    return 'https://arweave.net/' + url.slice(5);
  }
  return url;
}

async function fetchJsonSafe(url: string, timeoutMs = 8000): Promise<any | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(resolveIpfsUrl(url), { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Ethereum: JSON-RPC helpers ───

async function ethRpcCall(rpcUrl: string, method: string, params: any[]): Promise<any> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

// ERC-721 Transfer event topic: Transfer(address,address,uint256)
const ERC721_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// ERC-721 tokenURI(uint256) selector
const TOKEN_URI_SELECTOR = '0xc87b56dd';

// ERC-165 supportsInterface(bytes4) selector
const SUPPORTS_INTERFACE_SELECTOR = '0x01ffc9a7';
// ERC-721 interfaceId
const ERC721_INTERFACE_ID = '0x80ac58cd';

async function isERC721(rpcUrl: string, contractAddress: string): Promise<boolean> {
  try {
    // supportsInterface(0x80ac58cd)
    const data = SUPPORTS_INTERFACE_SELECTOR + ERC721_INTERFACE_ID.slice(2).padStart(64, '0');
    const result = await ethRpcCall(rpcUrl, 'eth_call', [
      { to: contractAddress, data },
      'latest',
    ]);
    // Returns true if last byte is 01
    return result && result.endsWith('1');
  } catch {
    return false;
  }
}

async function fetchTokenURI(rpcUrl: string, contractAddress: string, tokenIdHex: string): Promise<string | null> {
  try {
    const paddedId = tokenIdHex.slice(2).padStart(64, '0');
    const data = TOKEN_URI_SELECTOR + paddedId;
    const result = await ethRpcCall(rpcUrl, 'eth_call', [
      { to: contractAddress, data },
      'latest',
    ]);
    if (!result || result === '0x') return null;
    // ABI-decode the string return value
    return decodeAbiString(result);
  } catch {
    return null;
  }
}

function decodeAbiString(hex: string): string {
  try {
    // Remove 0x prefix
    const raw = hex.slice(2);
    // String offset is first 32 bytes (should be 0x20 = 32)
    // String length is next 32 bytes
    const lengthHex = raw.slice(64, 128);
    const length = parseInt(lengthHex, 16);
    if (length === 0 || length > 10000) return '';
    // String data follows
    const dataHex = raw.slice(128, 128 + length * 2);
    // Convert hex to UTF-8 string
    const bytes = [];
    for (let i = 0; i < dataHex.length; i += 2) {
      bytes.push(parseInt(dataHex.slice(i, i + 2), 16));
    }
    return String.fromCharCode(...bytes);
  } catch {
    return '';
  }
}

// ─── Ethereum: Alchemy NFT API ───

async function fetchEthereumNFTsAlchemy(address: string, alchemyKey: string): Promise<NFTItem[]> {
  const config = getNetworkConfig();
  const isMainnet = config.ethereum.chainId === 1;
  const network = isMainnet ? 'eth-mainnet' : 'eth-sepolia';
  const baseUrl = `https://${network}.g.alchemy.com/nft/v3/${alchemyKey}`;

  try {
    const res = await fetch(
      `${baseUrl}/getNFTsForOwner?owner=${address}&withMetadata=true&pageSize=50`,
      { headers: { accept: 'application/json' } },
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data.ownedNfts || []).map((nft: any, idx: number) => ({
      id: `eth_${nft.contract?.address || 'unknown'}_${nft.tokenId || idx}`,
      name: nft.name || nft.title || `NFT #${nft.tokenId || idx}`,
      description: nft.description || '',
      image: resolveIpfsUrl(
        nft.image?.cachedUrl || nft.image?.originalUrl ||
        nft.raw?.metadata?.image || '',
      ),
      chain: 'ethereum' as const,
      contractAddress: nft.contract?.address || '',
      tokenId: nft.tokenId || String(idx),
      collection: nft.contract?.name || nft.collection?.name,
      attributes: (nft.raw?.metadata?.attributes || []).map((a: any) => ({
        trait_type: String(a.trait_type || ''),
        value: String(a.value || ''),
      })),
    }));
  } catch {
    return [];
  }
}

// ─── Ethereum: RPC fallback (Transfer event scanning) ───

async function fetchEthereumNFTsRpc(address: string): Promise<NFTItem[]> {
  const config = getNetworkConfig();
  const rpcUrl = config.ethereum.rpcUrl;

  try {
    // Get current block number
    const latestBlockHex = await ethRpcCall(rpcUrl, 'eth_blockNumber', []);
    const latestBlock = parseInt(latestBlockHex, 16);
    // Scan last ~10000 blocks for Transfer events to this address
    const fromBlock = Math.max(0, latestBlock - 10000);

    // Pad address to 32 bytes for topic filter (Transfer to this address)
    const paddedAddress = '0x' + address.slice(2).toLowerCase().padStart(64, '0');

    const logs = await ethRpcCall(rpcUrl, 'eth_getLogs', [{
      fromBlock: '0x' + fromBlock.toString(16),
      toBlock: 'latest',
      topics: [
        ERC721_TRANSFER_TOPIC,
        null, // from (any)
        paddedAddress, // to (this address)
      ],
    }]);

    if (!logs || !Array.isArray(logs) || logs.length === 0) return [];

    // Deduplicate by contract+tokenId, keep only NFTs we currently own
    // (we'd need to check outgoing transfers too for accuracy, but this is a best-effort fallback)
    const seen = new Map<string, { contract: string; tokenId: string }>();
    for (const log of logs) {
      if (!log.topics || log.topics.length < 4) continue;
      const contract = log.address;
      const tokenIdHex = log.topics[3];
      const key = `${contract}_${tokenIdHex}`;
      seen.set(key, { contract, tokenId: tokenIdHex });
    }

    // Fetch metadata for each discovered NFT (limit to 20 to avoid overwhelming)
    const entries = Array.from(seen.values()).slice(0, 20);
    const nfts: NFTItem[] = [];

    for (const entry of entries) {
      // Verify it's ERC-721
      const is721 = await isERC721(rpcUrl, entry.contract);
      if (!is721) continue;

      const tokenIdNum = parseInt(entry.tokenId, 16);
      const uri = await fetchTokenURI(rpcUrl, entry.contract, entry.tokenId);

      let name = `NFT #${tokenIdNum}`;
      let description = '';
      let image = '';
      let collection: string | undefined;
      let attributes: Array<{ trait_type: string; value: string }> = [];

      if (uri) {
        const metadata = await fetchJsonSafe(uri);
        if (metadata) {
          name = metadata.name || name;
          description = metadata.description || '';
          image = resolveIpfsUrl(metadata.image || metadata.image_url || '');
          collection = metadata.collection?.name;
          attributes = (metadata.attributes || []).map((a: any) => ({
            trait_type: String(a.trait_type || ''),
            value: String(a.value || ''),
          }));
        }
      }

      nfts.push({
        id: `eth_${entry.contract}_${tokenIdNum}`,
        name,
        description,
        image,
        chain: 'ethereum',
        contractAddress: entry.contract,
        tokenId: String(tokenIdNum),
        collection,
        attributes,
      });
    }

    return nfts;
  } catch {
    return [];
  }
}

// ─── Solana: NFT fetching via RPC ───

// Metaplex Token Metadata Program ID
const METAPLEX_PROGRAM_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
// SPL Token Program ID
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

async function solanaRpcCall(rpcUrl: string, method: string, params: any[]): Promise<any> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

/**
 * Derive the Metaplex metadata PDA for a given mint address.
 * PDA = findProgramAddress(['metadata', METAPLEX_PROGRAM_ID, mintPubkey], METAPLEX_PROGRAM_ID)
 * We use a simplified approach: fetch the account data at the known metadata address.
 */
function base58Decode(str: string): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const base = ALPHABET.length;
  const bytes: number[] = [];

  for (const char of str) {
    const idx = ALPHABET.indexOf(char);
    if (idx < 0) throw new Error(`Invalid base58 char: ${char}`);
    let carry = idx;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * base;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  // Leading zeros
  for (const char of str) {
    if (char !== '1') break;
    bytes.push(0);
  }

  return new Uint8Array(bytes.reverse());
}

function base58Encode(bytes: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const base = ALPHABET.length;
  const digits: number[] = [0];

  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % base;
      carry = (carry / base) | 0;
    }
    while (carry > 0) {
      digits.push(carry % base);
      carry = (carry / base) | 0;
    }
  }

  let str = '';
  // Leading zeros
  for (const byte of bytes) {
    if (byte !== 0) break;
    str += '1';
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    str += ALPHABET[digits[i]];
  }
  return str;
}

/**
 * Derive Metaplex metadata PDA address for a mint.
 * Seeds: ['metadata', metaplexProgramId, mintPubkey]
 */
async function findMetadataAddress(mintAddress: string): Promise<string | null> {
  try {
    // We need to derive PDA. Since we don't have full crypto libs,
    // we use a known formula: sha256(seeds + programId + [255]) and find valid point.
    // Instead, we query the RPC for getProgramAccounts with a memcmp filter on the mint.
    // This is more reliable without native crypto.
    return null; // Will use getProgramAccounts approach instead
  } catch {
    return null;
  }
}

/**
 * Parse Metaplex metadata from raw account data (base64 encoded).
 * Format: https://docs.metaplex.com/programs/token-metadata/accounts
 */
function parseMetaplexMetadata(base64Data: string): {
  name: string;
  symbol: string;
  uri: string;
} | null {
  try {
    // Decode base64 to bytes
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Metaplex metadata v1 layout:
    // [0]: key (1 byte, should be 4 for MetadataV1)
    // [1..33]: update authority (32 bytes)
    // [33..65]: mint (32 bytes)
    // [65..69]: name length (4 bytes LE)
    // [69..69+nameLen]: name string
    // Then: symbol length (4 bytes LE) + symbol
    // Then: uri length (4 bytes LE) + uri

    let offset = 1 + 32 + 32; // skip key + update authority + mint

    // Read name
    const nameLen = bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
    offset += 4;
    const nameBytes = bytes.slice(offset, offset + nameLen);
    const name = String.fromCharCode(...nameBytes).replace(/\0/g, '').trim();
    offset += nameLen;

    // Read symbol
    const symLen = bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
    offset += 4;
    const symBytes = bytes.slice(offset, offset + symLen);
    const symbol = String.fromCharCode(...symBytes).replace(/\0/g, '').trim();
    offset += symLen;

    // Read uri
    const uriLen = bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
    offset += 4;
    const uriBytes = bytes.slice(offset, offset + uriLen);
    const uri = String.fromCharCode(...uriBytes).replace(/\0/g, '').trim();

    return { name, symbol, uri };
  } catch {
    return null;
  }
}

async function fetchSolanaNFTs(address: string): Promise<NFTItem[]> {
  const config = getNetworkConfig();
  const rpcUrl = config.solana.rpcUrl;

  try {
    // Step 1: Get all token accounts owned by this address
    const result = await solanaRpcCall(rpcUrl, 'getTokenAccountsByOwner', [
      address,
      { programId: TOKEN_PROGRAM_ID },
      { encoding: 'jsonParsed' },
    ]);

    if (!result?.value || !Array.isArray(result.value)) return [];

    // Step 2: Filter for NFTs (amount = 1, decimals = 0)
    const nftMints: string[] = [];
    for (const account of result.value) {
      const info = account.account?.data?.parsed?.info;
      if (!info) continue;
      const amount = info.tokenAmount;
      if (
        amount &&
        amount.uiAmount === 1 &&
        amount.decimals === 0
      ) {
        nftMints.push(info.mint);
      }
    }

    if (nftMints.length === 0) return [];

    // Step 3: For each mint, find Metaplex metadata using getProgramAccounts
    // Filter by mint address at offset 33 (after key byte + update authority)
    const nfts: NFTItem[] = [];
    const mintsToProcess = nftMints.slice(0, 30); // Limit to 30

    for (const mint of mintsToProcess) {
      try {
        const mintBytes = base58Decode(mint);
        // Base58 encode as base64 for memcmp filter
        const mintBase64 = btoa(String.fromCharCode(...mintBytes));

        const metadataAccounts = await solanaRpcCall(rpcUrl, 'getProgramAccounts', [
          METAPLEX_PROGRAM_ID,
          {
            encoding: 'base64',
            filters: [
              { memcmp: { offset: 33, bytes: mint, encoding: 'base58' } },
            ],
            dataSlice: { offset: 0, length: 679 }, // Metadata is typically < 679 bytes
          },
        ]);

        if (!metadataAccounts || metadataAccounts.length === 0) {
          // No Metaplex metadata found, add with minimal info
          nfts.push({
            id: `sol_${mint}_0`,
            name: `Solana NFT`,
            description: '',
            image: '',
            chain: 'solana',
            contractAddress: mint,
            tokenId: '0',
            attributes: [],
          });
          continue;
        }

        const accountData = metadataAccounts[0].account?.data;
        const base64Data = Array.isArray(accountData) ? accountData[0] : accountData;
        const parsed = parseMetaplexMetadata(base64Data);

        if (!parsed) {
          nfts.push({
            id: `sol_${mint}_0`,
            name: `Solana NFT`,
            description: '',
            image: '',
            chain: 'solana',
            contractAddress: mint,
            tokenId: '0',
            attributes: [],
          });
          continue;
        }

        // Step 4: Fetch off-chain JSON metadata from URI
        let description = '';
        let image = '';
        let collection: string | undefined;
        let attributes: Array<{ trait_type: string; value: string }> = [];

        if (parsed.uri) {
          const metadata = await fetchJsonSafe(parsed.uri);
          if (metadata) {
            description = metadata.description || '';
            image = resolveIpfsUrl(metadata.image || '');
            collection = metadata.collection?.name || metadata.collection?.family;
            attributes = (metadata.attributes || []).map((a: any) => ({
              trait_type: String(a.trait_type || ''),
              value: String(a.value || ''),
            }));
          }
        }

        nfts.push({
          id: `sol_${mint}_0`,
          name: parsed.name || `Solana NFT`,
          description,
          image,
          chain: 'solana',
          contractAddress: mint,
          tokenId: '0',
          collection,
          attributes,
        });
      } catch {
        // Skip this mint on error
        continue;
      }
    }

    return nfts;
  } catch {
    return [];
  }
}

// ─── Main Export ───

export async function fetchNFTs(addresses: {
  ethereum?: string;
  solana?: string;
}): Promise<NFTItem[]> {
  const promises: Promise<NFTItem[]>[] = [];

  if (addresses.ethereum) {
    const alchemyKey = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ALCHEMY_KEY)
      || (typeof globalThis !== 'undefined' && (globalThis as any).__EXPO_PUBLIC_ALCHEMY_KEY);

    if (alchemyKey) {
      promises.push(fetchEthereumNFTsAlchemy(addresses.ethereum, alchemyKey));
    } else {
      promises.push(fetchEthereumNFTsRpc(addresses.ethereum));
    }
  }

  if (addresses.solana) {
    promises.push(fetchSolanaNFTs(addresses.solana));
  }

  const results = await Promise.allSettled(promises);
  const allNfts: NFTItem[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allNfts.push(...result.value);
    }
  }

  return allNfts;
}
