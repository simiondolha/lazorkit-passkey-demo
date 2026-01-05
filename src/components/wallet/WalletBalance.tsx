/**
 * WalletBalance Component
 *
 * Displays SOL and USDC balances for the connected smart wallet.
 * Fetches balances directly from Solana RPC.
 *
 * Features:
 * - Auto-refresh every 30 seconds
 * - Manual refresh button
 * - Handles missing token accounts gracefully
 */
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useEffect, useState, useCallback } from "react";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

// Solana RPC endpoint
const RPC = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";

// USDC token mint on Devnet (different from mainnet!)
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

export function WalletBalance() {
  const { smartWalletPubkey, isConnected } = useWallet();
  const [balances, setBalances] = useState({ sol: 0, usdc: 0 });
  const [loading, setLoading] = useState(false);

  /**
   * Fetches SOL and USDC balances from the blockchain
   * Uses Associated Token Account (ATA) for USDC
   */
  const fetchBalances = useCallback(async () => {
    if (!smartWalletPubkey) return;

    setLoading(true);
    try {
      const connection = new Connection(RPC);
      const solBalance = await connection.getBalance(smartWalletPubkey);

      let usdcBalance = 0;
      try {
        const ata = getAssociatedTokenAddressSync(USDC_MINT, smartWalletPubkey, true);
        const tokenAccount = await connection.getTokenAccountBalance(ata);
        usdcBalance = parseFloat(tokenAccount.value.uiAmountString || "0");
      } catch {
        usdcBalance = 0;
      }

      setBalances({
        sol: solBalance / LAMPORTS_PER_SOL,
        usdc: usdcBalance,
      });
    } catch {
      // Silent fail on balance fetch
    } finally {
      setLoading(false);
    }
  }, [smartWalletPubkey]);

  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, smartWalletPubkey, fetchBalances]);

  if (!isConnected) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#1a1a1a] p-6 animate-in delay-1">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
          Balance
        </h3>
        <button
          onClick={fetchBalances}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 text-[var(--text-secondary)] ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[var(--void)] border border-[#1a1a1a]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
              S
            </div>
            <span className="text-xs text-[var(--text-tertiary)] font-mono">SOL</span>
          </div>
          <p className="text-2xl font-semibold text-[var(--text-primary)] font-mono">
            {balances.sol.toFixed(4)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--void)] border border-[#1a1a1a]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
              $
            </div>
            <span className="text-xs text-[var(--text-tertiary)] font-mono">USDC</span>
          </div>
          <p className="text-2xl font-semibold text-[var(--text-primary)] font-mono">
            {balances.usdc.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-[var(--signal-warning)]/10 border border-[var(--signal-warning)]/20">
        <p className="text-xs text-[var(--signal-warning)] font-mono flex items-center gap-2">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Devnet — Get SOL at faucet.solana.com
        </p>
      </div>
    </div>
  );
}
