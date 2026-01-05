/**
 * WalletConnect Component
 *
 * Handles passkey-based wallet authentication using LazorKit SDK.
 *
 * Features:
 * - Connect wallet with Face ID / Touch ID / Windows Hello
 * - Display connected wallet address with copy functionality
 * - Disconnect wallet and clear session
 * - Session persistence with "Welcome back" for returning users
 *
 * The passkey is stored in the device's Secure Enclave,
 * private keys never leave the device.
 */
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useState } from "react";
import { formatAddress, sanitizeError } from "@/lib/validation";
import { useSessionStatus } from "@/hooks/useSessionStatus";

export function WalletConnect() {
  // Get wallet state and actions from LazorKit hook
  const { connect, disconnect, isConnected, isConnecting, smartWalletPubkey } =
    useWallet();
  const { isReturningUser, clearSession } = useSessionStatus();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /**
   * Initiates passkey authentication flow
   * feeMode: "paymaster" enables gasless transactions
   */
  const handleConnect = async () => {
    try {
      setError(null);
      // This triggers the browser's WebAuthn prompt
      await connect({ feeMode: "paymaster" });
    } catch (err) {
      setError(sanitizeError(err));
    }
  };

  /** Disconnects wallet and clears cached session */
  const handleDisconnect = async () => {
    try {
      await disconnect();
      clearSession(); // Clear session metadata from localStorage
    } catch (err) {
      setError(sanitizeError(err));
    }
  };

  /** Copies wallet address to clipboard with fallback for older browsers */
  const copyAddress = async () => {
    if (!smartWalletPubkey) return;
    try {
      await navigator.clipboard.writeText(smartWalletPubkey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement("textarea");
      ta.value = smartWalletPubkey.toString();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnected && smartWalletPubkey) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#1a1a1a] p-6 animate-in">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--electric)] opacity-5 blur-3xl rounded-full" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--electric)] to-[var(--electric-dim)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--void)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--signal-success)] border-2 border-[var(--void)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)] font-mono uppercase tracking-wider">
                Connected
              </p>
              <button
                onClick={copyAddress}
                className="font-mono text-sm text-[var(--text-primary)] hover:text-[var(--electric)] transition-colors flex items-center gap-2"
              >
                {formatAddress(smartWalletPubkey.toString(), 6)}
                <span className="text-xs text-[var(--text-tertiary)]">
                  {copied ? "Copied!" : "Copy"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleDisconnect}
          className="w-full py-3 rounded-xl border border-[var(--signal-error)]/30 text-[var(--signal-error)] font-mono text-sm font-medium hover:bg-[var(--signal-error)]/10 transition-all"
        >
          Disconnect
        </button>

        {error && (
          <p className="mt-3 text-xs text-[var(--signal-error)] text-center font-mono">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#1a1a1a] p-8 animate-in">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2240%22 height=%2240%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M0 0h1v1H0z%22 fill=%22%23ffffff%22 fill-opacity=%22.02%22/%3E%3C/svg%3E')] opacity-50" />

      <div className="relative text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--electric)] to-[var(--electric-dim)] flex items-center justify-center shadow-[0_0_60px_var(--electric-glow)]">
          <svg className="w-10 h-10 text-[var(--void)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
          </svg>
        </div>

        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          {isReturningUser ? "Welcome Back!" : "Passkey Authentication"}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs mx-auto">
          {isReturningUser
            ? "Your wallet is ready. Sign in to continue."
            : "Sign in with Face ID, Touch ID, or Windows Hello. No seed phrases required."}
        </p>

        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--electric)] to-[var(--electric-dim)] text-[var(--void)] font-mono font-semibold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_40px_var(--electric-glow)] transition-all duration-300 hover:-translate-y-0.5"
        >
          {isConnecting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Authenticating...
            </span>
          ) : isReturningUser ? (
            "Reconnect Wallet"
          ) : (
            "Connect with Passkey"
          )}
        </button>

        {error && (
          <p className="mt-4 text-xs text-[var(--signal-error)] font-mono">
            {error}
          </p>
        )}

        <p className="mt-4 text-xs text-[var(--text-tertiary)] font-mono">
          Powered by WebAuthn
        </p>
      </div>
    </div>
  );
}
