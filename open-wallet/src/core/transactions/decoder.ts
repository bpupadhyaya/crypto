/**
 * Transaction Decoder — decodes raw transactions into human-readable descriptions.
 *
 * Supports EVM (Ethereum, BSC, Polygon, etc.), Solana, and Bitcoin.
 * Flags risky actions like unlimited approvals or unknown contract calls.
 */

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

export type TransactionType =
  | 'transfer'
  | 'approve'
  | 'swap'
  | 'contract-call'
  | 'account-create'
  | 'unknown';

export type RiskLevel = 'safe' | 'warning' | 'danger';

export interface DecodedTransaction {
  type: TransactionType;
  description: string;
  actions: string[];
  risk: RiskLevel;
  warnings: string[];
}

export interface DecodeParams {
  chain: string;
  to?: string;
  value?: string;
  data?: string;         // EVM calldata hex string
  instructions?: any[];  // Solana instructions
  inputs?: any[];        // BTC inputs
  outputs?: any[];       // BTC outputs
}

// ────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────

/** EVM 4-byte function selectors */
const EVM_SELECTORS: Record<string, { name: string; sig: string }> = {
  // ERC-20
  'a9059cbb': { name: 'transfer',     sig: 'transfer(address,uint256)' },
  '095ea7b3': { name: 'approve',      sig: 'approve(address,uint256)' },
  '23b872dd': { name: 'transferFrom', sig: 'transferFrom(address,address,uint256)' },
  // Uniswap V2 Router
  '38ed1739': { name: 'swapExactTokensForTokens', sig: 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)' },
  '8803dbee': { name: 'swapTokensForExactTokens', sig: 'swapTokensForExactTokens(uint256,uint256,address[],address,uint256)' },
  '7ff36ab5': { name: 'swapExactETHForTokens',    sig: 'swapExactETHForTokens(uint256,address[],address,uint256)' },
  '18cbafe5': { name: 'swapExactTokensForETH',    sig: 'swapExactTokensForETH(uint256,uint256,address[],address,uint256)' },
  // Uniswap V3
  'c04b8d59': { name: 'exactInput',    sig: 'exactInput((bytes,address,uint256,uint256,uint256))' },
  'db3e2198': { name: 'exactOutputSingle', sig: 'exactOutputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))' },
  // THORChain Router
  '44bc937b': { name: 'deposit', sig: 'deposit(address,address,uint256,string)' },
  '1fece7b4': { name: 'transferOut', sig: 'transferOut(address,address,uint256,string)' },
};

/** Maximum uint256 — used to detect "unlimited" approvals */
const MAX_UINT256 = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

/** Known Solana program IDs */
const SOLANA_PROGRAMS: Record<string, string> = {
  '11111111111111111111111111111111':          'System Program',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token Program',
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb':  'Token-2022',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL':  'Associated Token Account',
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4':  'Jupiter Aggregator v6',
  'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB':  'Jupiter Aggregator v4',
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc':  'Orca Whirlpool',
  '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin': 'Serum DEX v3',
};

/** Known scam/phishing addresses (sample — in production this would be a larger set or API) */
const KNOWN_SCAM_ADDRESSES = new Set<string>([
  // Placeholder — real implementation would fetch from a blocklist API
]);

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr ?? '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** Decode a 256-bit hex word into a decimal string */
function decodeUint256(hex: string): string {
  try {
    const val = BigInt('0x' + hex);
    return val.toString();
  } catch {
    return '0';
  }
}

/** Decode a 256-bit word as an address (last 20 bytes) */
function decodeAddress(hex: string): string {
  return '0x' + hex.slice(24).toLowerCase();
}

/** Format wei into a human-readable ETH string */
function formatWei(wei: string): string {
  try {
    const value = BigInt(wei);
    const eth = Number(value) / 1e18;
    if (eth === 0) return '0';
    if (eth < 0.000001) return '<0.000001';
    return eth.toFixed(6).replace(/\.?0+$/, '');
  } catch {
    return wei;
  }
}

/** Format lamports into SOL */
function formatLamports(lamports: number | string): string {
  const sol = Number(lamports) / 1e9;
  if (sol === 0) return '0';
  if (sol < 0.000001) return '<0.000001';
  return sol.toFixed(6).replace(/\.?0+$/, '');
}

/** Format satoshis into BTC */
function formatSatoshis(sats: number | string): string {
  const btc = Number(sats) / 1e8;
  if (btc === 0) return '0';
  if (btc < 0.00000001) return '<0.00000001';
  return btc.toFixed(8).replace(/\.?0+$/, '');
}

/** Check if an approval amount is "unlimited" (max uint256 or very close) */
function isUnlimitedApproval(amountHex: string): boolean {
  // If all 'f's or within last 1000 of max
  const cleaned = amountHex.toLowerCase().replace(/^0+/, '');
  if (cleaned === MAX_UINT256) return true;
  try {
    const val = BigInt('0x' + amountHex);
    const max = BigInt('0x' + MAX_UINT256);
    return max - val < 1000n;
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────
// EVM Decoder
// ────────────────────────────────────────────────────────────────────

function decodeEVM(params: DecodeParams): DecodedTransaction {
  const { to, value, data } = params;
  const warnings: string[] = [];
  const actions: string[] = [];

  // No calldata — plain native transfer
  if (!data || data === '0x' || data.length < 10) {
    const ethAmount = formatWei(value ?? '0');
    const desc = ethAmount === '0'
      ? `Empty call to ${shortenAddress(to ?? '')}`
      : `Transfer ${ethAmount} ETH to ${shortenAddress(to ?? '')}`;

    actions.push(desc);

    if (KNOWN_SCAM_ADDRESSES.has((to ?? '').toLowerCase())) {
      warnings.push('Recipient is a known scam address');
    }

    return {
      type: 'transfer',
      description: desc,
      actions,
      risk: assessSimpleTransferRisk(value ?? '0', to ?? '', warnings),
      warnings,
    };
  }

  // Extract 4-byte selector
  const cleanData = data.startsWith('0x') ? data.slice(2) : data;
  const selector = cleanData.slice(0, 8).toLowerCase();
  const known = EVM_SELECTORS[selector];

  if (!known) {
    const desc = `Unknown contract call to ${shortenAddress(to ?? '')}`;
    actions.push(desc);
    if (value && BigInt(value) > 0n) {
      actions.push(`Sending ${formatWei(value)} ETH with call`);
    }
    warnings.push('Unknown function — review carefully before signing');
    return {
      type: 'contract-call',
      description: desc,
      actions,
      risk: 'warning',
      warnings,
    };
  }

  // Decode known functions
  const calldata = cleanData.slice(8);

  switch (known.name) {
    // ── ERC-20 transfer ──
    case 'transfer': {
      const recipient = decodeAddress(calldata.slice(0, 64));
      const amount = decodeUint256(calldata.slice(64, 128));
      const desc = `Transfer ${amount} tokens to ${shortenAddress(recipient)}`;
      actions.push(desc);
      if (KNOWN_SCAM_ADDRESSES.has(recipient.toLowerCase())) {
        warnings.push('Recipient is a known scam address');
      }
      return {
        type: 'transfer',
        description: desc,
        actions,
        risk: warnings.length > 0 ? 'danger' : 'safe',
        warnings,
      };
    }

    // ── ERC-20 approve ──
    case 'approve': {
      const spender = decodeAddress(calldata.slice(0, 64));
      const amountHex = calldata.slice(64, 128);
      const unlimited = isUnlimitedApproval(amountHex);
      const amount = unlimited ? 'unlimited' : decodeUint256(amountHex);

      const desc = unlimited
        ? `Approve ${shortenAddress(spender)} to spend UNLIMITED tokens`
        : `Approve ${shortenAddress(spender)} to spend ${amount} tokens`;
      actions.push(desc);

      if (unlimited) {
        warnings.push(
          'UNLIMITED APPROVAL — the spender contract can drain all tokens of this type from your wallet at any time. ' +
          'Consider setting a specific amount instead.',
        );
      }

      return {
        type: 'approve',
        description: desc,
        actions,
        risk: unlimited ? 'danger' : 'safe',
        warnings,
      };
    }

    // ── ERC-20 transferFrom ──
    case 'transferFrom': {
      const from = decodeAddress(calldata.slice(0, 64));
      const recipient = decodeAddress(calldata.slice(64, 128));
      const amount = decodeUint256(calldata.slice(128, 192));
      const desc = `TransferFrom: move ${amount} tokens from ${shortenAddress(from)} to ${shortenAddress(recipient)}`;
      actions.push(desc);
      return {
        type: 'transfer',
        description: desc,
        actions,
        risk: 'safe',
        warnings,
      };
    }

    // ── Uniswap / DEX swaps ──
    case 'swapExactTokensForTokens':
    case 'swapTokensForExactTokens':
    case 'swapExactETHForTokens':
    case 'swapExactTokensForETH':
    case 'exactInput':
    case 'exactOutputSingle': {
      const ethValue = value && BigInt(value) > 0n ? ` (sending ${formatWei(value)} ETH)` : '';
      const desc = `DEX Swap via ${known.name} on ${shortenAddress(to ?? '')}${ethValue}`;
      actions.push(desc);
      actions.push('Tokens will be swapped through a decentralized exchange router');
      return {
        type: 'swap',
        description: desc,
        actions,
        risk: 'safe',
        warnings,
      };
    }

    // ── THORChain ──
    case 'deposit':
    case 'transferOut': {
      const ethValue = value && BigInt(value) > 0n ? formatWei(value) + ' ETH' : 'tokens';
      const desc = `THORChain ${known.name}: ${ethValue} via router ${shortenAddress(to ?? '')}`;
      actions.push(desc);
      actions.push('Funds will be sent through the THORChain cross-chain router');
      return {
        type: 'swap',
        description: desc,
        actions,
        risk: 'safe',
        warnings,
      };
    }

    default: {
      const desc = `Contract call: ${known.name} on ${shortenAddress(to ?? '')}`;
      actions.push(desc);
      return {
        type: 'contract-call',
        description: desc,
        actions,
        risk: 'warning',
        warnings: ['Recognized function but no detailed decoding available'],
      };
    }
  }
}

function assessSimpleTransferRisk(
  weiValue: string,
  to: string,
  existingWarnings: string[],
): RiskLevel {
  if (existingWarnings.length > 0) return 'danger';
  try {
    const eth = Number(BigInt(weiValue)) / 1e18;
    if (eth > 10) {
      existingWarnings.push(`High-value transfer: ${eth.toFixed(4)} ETH`);
      return 'warning';
    }
  } catch { /* ignore */ }
  return 'safe';
}

// ────────────────────────────────────────────────────────────────────
// Solana Decoder
// ────────────────────────────────────────────────────────────────────

function decodeSolana(params: DecodeParams): DecodedTransaction {
  const { instructions } = params;
  const warnings: string[] = [];
  const actions: string[] = [];
  let primaryType: TransactionType = 'unknown';
  let description = 'Solana transaction';

  if (!instructions || instructions.length === 0) {
    return {
      type: 'unknown',
      description: 'Empty Solana transaction — no instructions',
      actions: [],
      risk: 'warning',
      warnings: ['Transaction contains no instructions'],
    };
  }

  for (const ix of instructions) {
    const programId: string = ix.programId?.toString?.() ?? ix.programId ?? '';
    const programName = SOLANA_PROGRAMS[programId] ?? `Unknown program (${shortenAddress(programId)})`;

    // ── System Program ──
    if (programId === '11111111111111111111111111111111') {
      // System transfer: instruction type 2, first 4 bytes of data
      const lamports = ix.lamports ?? ix.data?.lamports;
      const toKey = ix.keys?.[1]?.pubkey?.toString?.() ?? ix.toPubkey?.toString?.() ?? 'unknown';

      if (lamports != null) {
        const sol = formatLamports(lamports);
        const action = `Transfer ${sol} SOL to ${shortenAddress(toKey)}`;
        actions.push(action);
        description = action;
        primaryType = 'transfer';
      } else {
        actions.push(`System Program instruction`);
      }
      continue;
    }

    // ── Token Program / Token-2022 ──
    if (
      programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' ||
      programId === 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
    ) {
      const ixType = ix.type ?? ix.parsed?.type ?? '';

      if (ixType === 'transfer' || ixType === 'transferChecked') {
        const amount = ix.amount ?? ix.parsed?.info?.amount ?? ix.parsed?.info?.tokenAmount?.amount ?? '?';
        const dest = ix.parsed?.info?.destination ?? ix.keys?.[1]?.pubkey?.toString?.() ?? 'unknown';
        const action = `SPL Token transfer: ${amount} to ${shortenAddress(dest)}`;
        actions.push(action);
        description = action;
        primaryType = 'transfer';
      } else if (ixType === 'approve') {
        const delegate = ix.parsed?.info?.delegate ?? ix.keys?.[2]?.pubkey?.toString?.() ?? 'unknown';
        const amount = ix.parsed?.info?.amount ?? '?';
        const action = `SPL Token approve: ${shortenAddress(delegate)} to spend ${amount}`;
        actions.push(action);
        primaryType = 'approve';
        description = action;

        // Check for absurdly large approval
        try {
          if (BigInt(amount) > BigInt('1000000000000000')) {
            warnings.push('Very large token approval — verify the delegate address');
          }
        } catch { /* ignore */ }
      } else {
        actions.push(`Token Program: ${ixType || 'instruction'}`);
      }
      continue;
    }

    // ── Associated Token Account ──
    if (programId === 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') {
      actions.push('Create Associated Token Account');
      if (primaryType === 'unknown') primaryType = 'account-create';
      continue;
    }

    // ── Jupiter Aggregator ──
    if (
      programId === 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' ||
      programId === 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB'
    ) {
      actions.push(`Jupiter swap via ${programName}`);
      primaryType = 'swap';
      description = 'Token swap via Jupiter Aggregator';
      continue;
    }

    // ── Orca Whirlpool ──
    if (programId === 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc') {
      actions.push('Orca Whirlpool swap');
      primaryType = 'swap';
      description = 'Token swap via Orca Whirlpool';
      continue;
    }

    // ── Serum DEX ──
    if (programId === '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin') {
      actions.push('Serum DEX order');
      primaryType = 'swap';
      description = 'DEX order via Serum';
      continue;
    }

    // ── Unknown program ──
    actions.push(`Instruction on ${programName}`);
    if (!SOLANA_PROGRAMS[programId]) {
      warnings.push(`Interacting with unknown program ${shortenAddress(programId)} — review carefully`);
    }
  }

  if (actions.length === 0) {
    actions.push('No decodable instructions');
  }
  if (description === 'Solana transaction' && actions.length > 0) {
    description = actions[0];
  }

  return {
    type: primaryType,
    description,
    actions,
    risk: assessRisk({ type: primaryType, description, actions, warnings, risk: 'safe' }),
    warnings,
  };
}

// ────────────────────────────────────────────────────────────────────
// Bitcoin Decoder
// ────────────────────────────────────────────────────────────────────

function decodeBitcoin(params: DecodeParams): DecodedTransaction {
  const { inputs, outputs } = params;
  const warnings: string[] = [];
  const actions: string[] = [];

  const inputCount = inputs?.length ?? 0;
  const outputCount = outputs?.length ?? 0;

  if (inputCount === 0 && outputCount === 0) {
    return {
      type: 'unknown',
      description: 'Empty Bitcoin transaction',
      actions: [],
      risk: 'warning',
      warnings: ['No inputs or outputs'],
    };
  }

  // Sum inputs and outputs
  let totalInputSats = 0;
  let totalOutputSats = 0;

  actions.push(`${inputCount} input${inputCount !== 1 ? 's' : ''}`);

  if (inputs) {
    for (const input of inputs) {
      totalInputSats += Number(input.value ?? input.amount ?? 0);
    }
  }

  // Parse outputs
  let changeOutput: { address: string; value: number } | null = null;
  let hasOpReturn = false;
  let opReturnData = '';

  if (outputs) {
    for (const output of outputs) {
      const addr = output.address ?? output.scriptPubKey?.address ?? '';
      const valueSats = Number(output.value ?? output.amount ?? 0);
      totalOutputSats += valueSats;

      // Detect OP_RETURN
      const script = output.script ?? output.scriptPubKey?.hex ?? '';
      if (script.startsWith('6a') || output.type === 'OP_RETURN' || addr === 'OP_RETURN') {
        hasOpReturn = true;
        // Try to decode OP_RETURN data
        try {
          const hexPayload = script.slice(4); // strip 6a + length byte (approximate)
          opReturnData = Buffer.from(hexPayload, 'hex').toString('utf8');
        } catch { /* ignore */ }
        actions.push(`OP_RETURN data${opReturnData ? `: "${opReturnData.slice(0, 80)}"` : ''}`);
        continue;
      }

      // Check if this is a change output (flagged by caller)
      if (output.isChange) {
        changeOutput = { address: addr, value: valueSats };
        continue;
      }

      actions.push(`Send ${formatSatoshis(valueSats)} BTC to ${shortenAddress(addr)}`);
    }
  }

  // Fee calculation
  const feeSats = totalInputSats - totalOutputSats;
  if (feeSats > 0) {
    actions.push(`Fee: ${formatSatoshis(feeSats)} BTC`);
  }

  if (changeOutput) {
    actions.push(`Change: ${formatSatoshis(changeOutput.value)} BTC back to ${shortenAddress(changeOutput.address)}`);
  }

  // Warnings
  if (hasOpReturn) {
    warnings.push(
      'Transaction contains OP_RETURN data — commonly used by THORChain for cross-chain memos. ' +
      'Verify the memo content is expected.',
    );
  }

  if (feeSats > 100_000) {
    // > 0.001 BTC fee
    warnings.push(`Unusually high fee: ${formatSatoshis(feeSats)} BTC`);
  }

  const totalSendBtc = formatSatoshis(totalOutputSats - (changeOutput?.value ?? 0));
  const description = `Send ${totalSendBtc} BTC across ${outputCount} output${outputCount !== 1 ? 's' : ''}`;

  return {
    type: hasOpReturn ? 'contract-call' : 'transfer',
    description,
    actions,
    risk: assessBtcRisk(feeSats, totalOutputSats, warnings),
    warnings,
  };
}

function assessBtcRisk(
  feeSats: number,
  totalOutputSats: number,
  warnings: string[],
): RiskLevel {
  if (warnings.some(w => w.includes('scam'))) return 'danger';
  // High-value: > 0.5 BTC
  if (totalOutputSats > 50_000_000) {
    warnings.push(`High-value transaction: ${formatSatoshis(totalOutputSats)} BTC total`);
    return 'warning';
  }
  if (feeSats > 100_000) return 'warning';
  return 'safe';
}

// ────────────────────────────────────────────────────────────────────
// Risk Assessment
// ────────────────────────────────────────────────────────────────────

export function assessRisk(decoded: DecodedTransaction): RiskLevel {
  // Danger conditions
  if (decoded.warnings.some(w =>
    w.includes('UNLIMITED') ||
    w.includes('scam') ||
    w.includes('drain'),
  )) {
    return 'danger';
  }

  // Warning conditions
  if (decoded.warnings.length > 0) return 'warning';
  if (decoded.type === 'unknown') return 'warning';
  if (decoded.type === 'contract-call') return 'warning';

  return 'safe';
}

// ────────────────────────────────────────────────────────────────────
// Main Entry Point
// ────────────────────────────────────────────────────────────────────

/**
 * Decode a transaction into a human-readable description with risk assessment.
 *
 * @example
 * ```ts
 * const decoded = decodeTransaction({
 *   chain: 'ethereum',
 *   to: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
 *   data: '0xa9059cbb000000000000000000000000abc...0000000000000000000000000000000005f5e100',
 * });
 * // => { type: 'transfer', description: 'Transfer 100000000 tokens to 0xabc...', ... }
 * ```
 */
export function decodeTransaction(params: DecodeParams): DecodedTransaction {
  const chain = params.chain.toLowerCase();

  // EVM chains
  if (
    chain === 'ethereum' || chain === 'eth' ||
    chain === 'polygon' || chain === 'matic' ||
    chain === 'bsc' || chain === 'binance' ||
    chain === 'avalanche' || chain === 'avax' ||
    chain === 'arbitrum' || chain === 'optimism' ||
    chain === 'base' || chain === 'evm'
  ) {
    return decodeEVM(params);
  }

  // Solana
  if (chain === 'solana' || chain === 'sol') {
    return decodeSolana(params);
  }

  // Bitcoin
  if (chain === 'bitcoin' || chain === 'btc') {
    return decodeBitcoin(params);
  }

  return {
    type: 'unknown',
    description: `Unsupported chain: ${params.chain}`,
    actions: [],
    risk: 'warning',
    warnings: [`No decoder available for chain "${params.chain}"`],
  };
}
