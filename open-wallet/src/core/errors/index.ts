/**
 * Error Handling — Consistent error types across the entire wallet.
 *
 * Categories:
 *   - NetworkError: connectivity, timeout, API failures
 *   - ChainError: transaction failures, insufficient funds, invalid address
 *   - SwapError: quote failures, slippage, liquidity issues
 *   - AuthError: wrong PIN, biometric failure, session expired
 *   - SyncError: offline sync failures, conflict resolution
 *   - ValidationError: invalid input, missing fields
 */

// ─── Error Types ───

export class WalletError extends Error {
  code: string;
  userMessage: string;
  recoverable: boolean;
  action?: string; // suggested action: 'retry' | 'check_balance' | 'try_later' | 'contact_support'

  constructor(code: string, message: string, userMessage: string, recoverable = true, action?: string) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
    this.userMessage = userMessage;
    this.recoverable = recoverable;
    this.action = action;
  }
}

export class NetworkError extends WalletError {
  constructor(message: string, userMessage?: string) {
    super('NETWORK_ERROR', message, userMessage || 'Unable to connect. Check your internet connection.', true, 'retry');
    this.name = 'NetworkError';
  }
}

export class ChainError extends WalletError {
  txHash?: string;
  constructor(message: string, userMessage?: string, txHash?: string) {
    super('CHAIN_ERROR', message, userMessage || 'Transaction failed. Please try again.', true, 'retry');
    this.name = 'ChainError';
    this.txHash = txHash;
  }
}

export class InsufficientFundsError extends ChainError {
  required: string;
  available: string;
  denom: string;
  constructor(denom: string, required: string, available: string) {
    super(
      `Insufficient ${denom}: need ${required}, have ${available}`,
      `Not enough ${denom}. You need ${required} but only have ${available}.`,
    );
    this.code = 'INSUFFICIENT_FUNDS';
    this.required = required;
    this.available = available;
    this.denom = denom;
    this.action = 'check_balance';
  }
}

export class SwapError extends WalletError {
  provider: string;
  constructor(provider: string, message: string, userMessage?: string) {
    super('SWAP_ERROR', message, userMessage || `Swap via ${provider} failed. Try a different provider.`, true, 'retry');
    this.name = 'SwapError';
    this.provider = provider;
  }
}

export class SlippageError extends SwapError {
  expected: string;
  actual: string;
  constructor(provider: string, expected: string, actual: string) {
    super(provider, `Slippage exceeded: expected ${expected}, got ${actual}`, `Price moved too much during swap. Expected ${expected}, got ${actual}. Try again or increase slippage tolerance.`);
    this.code = 'SLIPPAGE_EXCEEDED';
    this.expected = expected;
    this.actual = actual;
  }
}

export class AuthError extends WalletError {
  constructor(message: string, userMessage?: string) {
    super('AUTH_ERROR', message, userMessage || 'Authentication failed. Please try again.', true);
    this.name = 'AuthError';
  }
}

export class ValidationError extends WalletError {
  field: string;
  constructor(field: string, message: string) {
    super('VALIDATION_ERROR', message, message, true);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// ─── Error Formatting ───

/**
 * Format any error into a user-friendly message.
 * Use this in catch blocks across all screens.
 */
export function formatError(error: unknown): { title: string; message: string; recoverable: boolean; action?: string } {
  if (error instanceof WalletError) {
    return {
      title: error.name.replace('Error', ' Error'),
      message: error.userMessage,
      recoverable: error.recoverable,
      action: error.action,
    };
  }

  if (error instanceof Error) {
    // Common error patterns
    if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('timeout')) {
      return { title: 'Connection Error', message: 'Unable to connect. Check your internet and try again.', recoverable: true, action: 'retry' };
    }
    if (error.message.includes('insufficient') || error.message.includes('not enough')) {
      return { title: 'Insufficient Funds', message: error.message, recoverable: true, action: 'check_balance' };
    }
    if (error.message.includes('rejected') || error.message.includes('denied')) {
      return { title: 'Transaction Rejected', message: 'The transaction was rejected. Check parameters and try again.', recoverable: true, action: 'retry' };
    }
    return { title: 'Error', message: error.message, recoverable: true };
  }

  return { title: 'Unknown Error', message: 'Something went wrong. Please try again.', recoverable: true, action: 'retry' };
}

/**
 * Log an error for debugging (non-sensitive info only).
 */
export function logError(context: string, error: unknown): void {
  const formatted = formatError(error);
  console.error(`[${context}] ${formatted.title}: ${formatted.message}`);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
}
