/**
 * useTransfer Hook
 *
 * Reusable hook for executing gasless token transfers.
 * Handles SOL and USDC transfers with built-in validation.
 *
 * Performance optimizations:
 * - Memoized callback with stable dependencies
 * - Stable return object reference via useMemo
 * - USDC_MINT created once at module level
 *
 * Usage:
 * ```tsx
 * const { transfer, isLoading, error, signature } = useTransfer();
 *
 * await transfer({
 *   recipient: "ABC...XYZ",
 *   amount: 1.5,
 *   token: "SOL"
 * });
 * ```
 */
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useState, useCallback, useMemo } from "react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { validateAddress, validateAmount, sanitizeError } from "@/lib/validation";

// PERF: Create PublicKey once at module level - avoids recreation per render
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

export type TokenType = "SOL" | "USDC";

export interface TransferParams {
  recipient: string;
  amount: number;
  token: TokenType;
}

export interface TransferResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export function useTransfer() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const transfer = useCallback(
    async ({ recipient, amount, token }: TransferParams): Promise<TransferResult> => {
      // Reset state
      setError(null);
      setSignature(null);

      // Pre-flight checks
      if (!isConnected || !smartWalletPubkey) {
        const err = "Wallet not connected";
        setError(err);
        return { success: false, error: err };
      }

      // Validate inputs
      const addrResult = validateAddress(recipient);
      if (!addrResult.valid) {
        setError(addrResult.error);
        return { success: false, error: addrResult.error };
      }

      const amtResult = validateAmount(amount.toString(), token);
      if (!amtResult.valid) {
        setError(amtResult.error);
        return { success: false, error: amtResult.error };
      }

      setIsLoading(true);

      try {
        const recipientPubkey = new PublicKey(recipient.trim());

        // Build instruction based on token type
        const instruction =
          token === "SOL"
            ? SystemProgram.transfer({
                fromPubkey: smartWalletPubkey,
                toPubkey: recipientPubkey,
                lamports: Math.floor(amount * LAMPORTS_PER_SOL),
              })
            : createTransferInstruction(
                getAssociatedTokenAddressSync(USDC_MINT, smartWalletPubkey, true),
                getAssociatedTokenAddressSync(USDC_MINT, recipientPubkey),
                smartWalletPubkey,
                Math.floor(amount * 1_000_000),
                [],
                TOKEN_PROGRAM_ID
              );

        // Execute gasless transaction
        const sig = await signAndSendTransaction({
          instructions: [instruction],
          transactionOptions: { feeToken: "USDC" },
        });

        setSignature(sig);
        return { success: true, signature: sig };
      } catch (err) {
        const errorMsg = sanitizeError(err);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, smartWalletPubkey, signAndSendTransaction]
  );

  const reset = useCallback(() => {
    setError(null);
    setSignature(null);
  }, []);

  // PERF: Memoize return object to prevent consumer re-renders
  const isReady = isConnected && smartWalletPubkey !== null;

  return useMemo(() => ({
    transfer,
    isLoading,
    error,
    signature,
    reset,
    isReady,
  }), [transfer, isLoading, error, signature, reset, isReady]);
}
