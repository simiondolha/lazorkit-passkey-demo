/**
 * useBalance Hook
 *
 * Fetches and auto-refreshes SOL and USDC balances for the connected wallet.
 * Handles missing token accounts gracefully.
 *
 * Usage:
 * ```tsx
 * const { balances, isLoading, refresh } = useBalance();
 * console.log(balances.sol, balances.usdc);
 * ```
 */
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useEffect, useState, useCallback } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

const RPC = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const REFRESH_INTERVAL = 30_000; // 30 seconds

export interface Balances {
  sol: number;
  usdc: number;
}

export function useBalance() {
  const { smartWalletPubkey, isConnected } = useWallet();
  const [balances, setBalances] = useState<Balances>({ sol: 0, usdc: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!smartWalletPubkey) return;

    setIsLoading(true);
    setError(null);

    try {
      const connection = new Connection(RPC);

      // Fetch SOL balance
      const solBalance = await connection.getBalance(smartWalletPubkey);

      // Fetch USDC balance (may not exist)
      let usdcBalance = 0;
      try {
        const ata = getAssociatedTokenAddressSync(USDC_MINT, smartWalletPubkey, true);
        const tokenAccount = await connection.getTokenAccountBalance(ata);
        usdcBalance = parseFloat(tokenAccount.value.uiAmountString || "0");
      } catch {
        // Token account doesn't exist - balance is 0
        usdcBalance = 0;
      }

      setBalances({
        sol: solBalance / LAMPORTS_PER_SOL,
        usdc: usdcBalance,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balances");
    } finally {
      setIsLoading(false);
    }
  }, [smartWalletPubkey]);

  // Auto-refresh when connected
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchBalances();
      const interval = setInterval(fetchBalances, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isConnected, smartWalletPubkey, fetchBalances]);

  return {
    balances,
    isLoading,
    error,
    refresh: fetchBalances,
  };
}
