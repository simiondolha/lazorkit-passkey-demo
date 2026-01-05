/**
 * LazorKit Provider Wrapper
 *
 * Wraps the application with LazorkitProvider to enable:
 * - Passkey authentication (WebAuthn)
 * - Smart wallet management
 * - Gasless transactions via paymaster
 *
 * Configuration can be overridden via environment variables.
 * Defaults to Devnet for development.
 */
"use client";

import { LazorkitProvider } from "@lazorkit/wallet";
import { ReactNode } from "react";

// LazorKit SDK configuration
// Override these with NEXT_PUBLIC_* env vars for production
const CONFIG = {
  // Solana RPC endpoint
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com",
  // LazorKit portal for passkey operations
  portalUrl: process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.lazor.sh",
  // Paymaster service for gasless transactions
  paymasterConfig: {
    paymasterUrl:
      process.env.NEXT_PUBLIC_PAYMASTER_URL || "https://kora.devnet.lazorkit.com",
  },
};

/**
 * Provides LazorKit context to all child components
 * Must wrap any component using the useWallet hook
 */
export function LazorkitProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <LazorkitProvider
      rpcUrl={CONFIG.rpcUrl}
      portalUrl={CONFIG.portalUrl}
      paymasterConfig={CONFIG.paymasterConfig}
    >
      {children}
    </LazorkitProvider>
  );
}
