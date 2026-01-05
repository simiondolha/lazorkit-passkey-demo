/**
 * Validation utilities for LazorKit wallet operations
 *
 * These helpers ensure secure input handling for:
 * - Solana address validation
 * - Transfer amount bounds checking
 * - Transaction signature URL generation
 * - User-friendly error messages
 */

import { PublicKey, SystemProgram } from "@solana/web3.js";

// Security: Set reasonable upper limits to prevent overflow attacks
const MAX_SOL_AMOUNT = 1_000_000;
const MAX_USDC_AMOUNT = 10_000_000;

// Solana transaction signatures are base58-encoded, 87-88 characters
const SIGNATURE_REGEX = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;

export type ValidationResult = { valid: true } | { valid: false; error: string };

/**
 * Validates a Solana public key address
 * Checks format, length, and prevents sending to system program
 */
export function validateAddress(address: string): ValidationResult {
  if (!address?.trim()) {
    return { valid: false, error: "Address required" };
  }

  const trimmed = address.trim();
  if (trimmed.length < 32 || trimmed.length > 44) {
    return { valid: false, error: "Invalid address length" };
  }

  try {
    const pubkey = new PublicKey(trimmed);
    if (pubkey.equals(SystemProgram.programId)) {
      return { valid: false, error: "Cannot send to system program" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid Solana address" };
  }
}

/**
 * Validates transfer amount with bounds checking
 * Prevents integer overflow by checking against MAX_SAFE_INTEGER
 * SOL uses 9 decimals (lamports), USDC uses 6 decimals
 */
export function validateAmount(
  amount: string,
  tokenType: "SOL" | "USDC"
): ValidationResult {
  const parsed = parseFloat(amount);

  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, error: "Enter a valid amount" };
  }

  // Check against reasonable upper limits
  const max = tokenType === "SOL" ? MAX_SOL_AMOUNT : MAX_USDC_AMOUNT;
  if (parsed > max) {
    return { valid: false, error: `Max ${max.toLocaleString()} ${tokenType}` };
  }

  // Verify the converted amount fits in a safe integer
  const multiplier = tokenType === "SOL" ? 1e9 : 1e6;
  if (!Number.isSafeInteger(Math.floor(parsed * multiplier))) {
    return { valid: false, error: "Amount too large" };
  }

  return { valid: true };
}

/**
 * Generates a Solana Explorer URL for a transaction
 * Validates signature format to prevent URL injection
 */
export function getSolanaExplorerUrl(signature: string): string {
  if (!SIGNATURE_REGEX.test(signature)) {
    return "#";
  }
  return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`;
}

/**
 * Converts SDK errors to user-friendly messages
 * Hides technical details in production
 */
export function sanitizeError(err: unknown): string {
  if (!(err instanceof Error)) return "Operation failed";

  const msg = err.message.toLowerCase();
  if (msg.includes("insufficient")) return "Insufficient balance";
  if (msg.includes("network")) return "Network error. Try again.";
  if (msg.includes("user rejected")) return "Transaction cancelled";
  if (msg.includes("timeout")) return "Request timed out";

  // Show detailed errors only in development
  return process.env.NODE_ENV === "production"
    ? "Transaction failed"
    : err.message;
}

/** Truncates address for display: "ABC...XYZ" */
export function formatAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
