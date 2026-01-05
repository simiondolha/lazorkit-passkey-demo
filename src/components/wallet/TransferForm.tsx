/**
 * TransferForm Component
 *
 * Enables gasless SOL and USDC transfers using LazorKit's paymaster service.
 * Transactions are signed with the user's passkey (WebAuthn).
 *
 * Features:
 * - SOL native transfers (SystemProgram)
 * - USDC SPL token transfers (TokenProgram)
 * - Input validation with security bounds checking
 * - Gasless transactions (fees paid by paymaster in USDC)
 * - Transaction status with Solana Explorer links
 *
 * Security:
 * - Address validation (format, length, base58)
 * - Amount bounds checking (prevents overflow)
 * - Input sanitization (strips invalid characters)
 */
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useState } from "react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createTransferInstruction, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { validateAddress, validateAmount, getSolanaExplorerUrl, sanitizeError } from "@/lib/validation";

// Devnet USDC token mint address (different from mainnet!)
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

type Token = "SOL" | "USDC";
type Result = { success: true; signature: string } | { success: false; error: string };

export function TransferForm() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<Token>("SOL");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  /**
   * Executes the transfer transaction
   * 1. Validates recipient address and amount
   * 2. Creates appropriate instruction (SOL or USDC)
   * 3. Signs with passkey and sends via paymaster
   */
  const handleTransfer = async () => {
    if (!smartWalletPubkey) return;

    // Validate inputs using security utilities
    const addrResult = validateAddress(recipient);
    if (!addrResult.valid) {
      setResult({ success: false, error: addrResult.error });
      return;
    }

    const amtResult = validateAmount(amount, token);
    if (!amtResult.valid) {
      setResult({ success: false, error: amtResult.error });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const recipientPubkey = new PublicKey(recipient.trim());
      const parsedAmount = parseFloat(amount);

      // Build the appropriate transfer instruction based on token type
      // SOL: Native SystemProgram transfer (9 decimals)
      // USDC: SPL Token transfer via Associated Token Accounts (6 decimals)
      const instruction =
        token === "SOL"
          ? SystemProgram.transfer({
              fromPubkey: smartWalletPubkey,
              toPubkey: recipientPubkey,
              lamports: Math.floor(parsedAmount * LAMPORTS_PER_SOL),
            })
          : createTransferInstruction(
              getAssociatedTokenAddressSync(USDC_MINT, smartWalletPubkey, true),
              getAssociatedTokenAddressSync(USDC_MINT, recipientPubkey),
              smartWalletPubkey,
              Math.floor(parsedAmount * 1_000_000), // USDC has 6 decimals
              [],
              TOKEN_PROGRAM_ID
            );

      // Sign with passkey (WebAuthn) and send via paymaster for gasless tx
      const signature = await signAndSendTransaction({
        instructions: [instruction],
        transactionOptions: { feeToken: "USDC" }, // Paymaster covers fees
      });

      setResult({ success: true, signature });
      setRecipient("");
      setAmount("");
    } catch (err) {
      setResult({ success: false, error: sanitizeError(err) });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#1a1a1a] p-8 text-center animate-in delay-2">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <p className="text-[var(--text-secondary)] text-sm">Connect wallet to transfer</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#1a1a1a] p-6 animate-in delay-2">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-[var(--electric)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
          Transfer
        </h3>
        <span className="ml-auto px-2 py-1 rounded-full bg-[var(--signal-success)]/10 text-[var(--signal-success)] text-xs font-mono">
          Gasless
        </span>
      </div>

      <div className="space-y-4">
        {/* Token Selector */}
        <div className="grid grid-cols-2 gap-2">
          {(["SOL", "USDC"] as Token[]).map((t) => (
            <button
              key={t}
              onClick={() => setToken(t)}
              className={`py-3 rounded-xl font-mono text-sm font-medium transition-all ${
                token === t
                  ? "bg-[var(--electric)] text-[var(--void)] shadow-[0_0_20px_var(--electric-glow)]"
                  : "bg-[var(--void)] border border-[#1a1a1a] text-[var(--text-secondary)] hover:border-[#2a2a2a]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Recipient */}
        <div>
          <label className="block text-xs text-[var(--text-tertiary)] font-mono mb-2 uppercase tracking-wider">
            Recipient
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value.trim().replace(/[^1-9A-HJ-NP-Za-km-z]/g, ""))}
            placeholder="Solana address..."
            className="w-full px-4 py-3 rounded-xl bg-[var(--void)] border border-[#1a1a1a] text-[var(--text-primary)] font-mono text-sm placeholder:text-[var(--text-tertiary)] focus:border-[var(--electric)] focus:ring-2 focus:ring-[var(--electric-glow)] transition-all outline-none"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs text-[var(--text-tertiary)] font-mono mb-2 uppercase tracking-wider">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="any"
              min="0"
              className="w-full px-4 py-3 pr-16 rounded-xl bg-[var(--void)] border border-[#1a1a1a] text-[var(--text-primary)] font-mono text-sm placeholder:text-[var(--text-tertiary)] focus:border-[var(--electric)] focus:ring-2 focus:ring-[var(--electric-glow)] transition-all outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)] font-mono">
              {token}
            </span>
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={handleTransfer}
          disabled={loading || !recipient || !amount}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--electric)] to-[var(--electric-dim)] text-[var(--void)] font-mono font-semibold text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_40px_var(--electric-glow)] transition-all duration-300 hover:-translate-y-0.5"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing...
            </span>
          ) : (
            `Send ${token}`
          )}
        </button>

        {/* Result */}
        {result && (
          <div
            className={`p-4 rounded-xl border ${
              result.success
                ? "bg-[var(--signal-success)]/10 border-[var(--signal-success)]/20"
                : "bg-[var(--signal-error)]/10 border-[var(--signal-error)]/20"
            }`}
          >
            {result.success ? (
              <div>
                <p className="text-sm font-medium text-[var(--signal-success)] mb-1">
                  Transaction sent!
                </p>
                <a
                  href={getSolanaExplorerUrl(result.signature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--electric)] hover:underline font-mono break-all"
                >
                  View on Explorer →
                </a>
              </div>
            ) : (
              <p className="text-sm text-[var(--signal-error)]">{result.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
