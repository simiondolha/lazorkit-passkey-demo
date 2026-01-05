/**
 * useBalance Hook
 *
 * Fetches and auto-refreshes SOL and USDC balances for the connected wallet.
 * Handles missing token accounts gracefully.
 *
 * Performance optimizations:
 * - Connection object is memoized to prevent recreation on every render
 * - USDC_MINT is created once at module level
 * - useRef for interval cleanup to avoid stale closures
 * - Batched RPC calls where possible
 *
 * Usage:
 * ```tsx
 * const { balances, isLoading, refresh } = useBalance();
 * console.log(balances.sol, balances.usdc);
 * ```
 */
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

const RPC = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
// PERF: Create PublicKey once at module level to avoid recreation
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const REFRESH_INTERVAL = 30_000; // 30 seconds

export interface Balances {
  sol: number;
  usdc: number;
}

// PERF: Default balances object created once to ensure stable reference
const DEFAULT_BALANCES: Balances = { sol: 0, usdc: 0 };

// PERF: Singleton connection to be shared across hook instances
let sharedConnection: Connection | null = null;
function getConnection(): Connection {
  if (!sharedConnection) {
    sharedConnection = new Connection(RPC, {
      commitment: "confirmed",
    });
  }
  return sharedConnection;
}

export function useBalance() {
  const { smartWalletPubkey, isConnected } = useWallet();
  const [balances, setBalances] = useState<Balances>(DEFAULT_BALANCES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PERF: Use singleton connection to prevent recreation
  const connection = useMemo(() => getConnection(), []);

  // PERF: Use ref to track if component is mounted to avoid state updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchBalances = useCallback(async () => {
    if (!smartWalletPubkey) return;

    setIsLoading(true);
    setError(null);

    try {
      // PERF: Compute ATA address synchronously (no async overhead)
      const ata = getAssociatedTokenAddressSync(USDC_MINT, smartWalletPubkey, true);

      // PERF: Batch both RPC calls in parallel instead of sequential
      const [solBalanceResult, tokenAccountResult] = await Promise.allSettled([
        connection.getBalance(smartWalletPubkey),
        connection.getTokenAccountBalance(ata),
      ]);

      // Only update state if still mounted
      if (!isMountedRef.current) return;

      const solBalance = solBalanceResult.status === "fulfilled"
        ? solBalanceResult.value / LAMPORTS_PER_SOL
        : 0;

      const usdcBalance = tokenAccountResult.status === "fulfilled"
        ? parseFloat(tokenAccountResult.value.value.uiAmountString || "0")
        : 0;

      setBalances({ sol: solBalance, usdc: usdcBalance });
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to fetch balances");
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [smartWalletPubkey, connection]);

  // Auto-refresh when connected
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchBalances();
      const interval = setInterval(fetchBalances, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isConnected, smartWalletPubkey, fetchBalances]);

  // PERF: Memoize return object to prevent unnecessary re-renders in consumers
  return useMemo(() => ({
    balances,
    isLoading,
    error,
    refresh: fetchBalances,
  }), [balances, isLoading, error, fetchBalances]);
}
