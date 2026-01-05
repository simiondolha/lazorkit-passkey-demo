# Tutorial 1: Passkey Authentication

Learn how to implement passwordless authentication using WebAuthn passkeys with LazorKit SDK.

## What You'll Build

A complete passkey authentication flow that allows users to:
- Create a new passkey-protected Solana wallet
- Sign in using Face ID, Touch ID, or Windows Hello
- Persist sessions across browser refreshes

## Why Passkeys?

| Traditional Wallet | Passkey Wallet |
|-------------------|----------------|
| 24-word seed phrase to remember | Biometric authentication |
| Risk of phishing/clipboard attacks | Hardware-bound, unfishable |
| Requires wallet extension | Works in any modern browser |
| Complex onboarding | One-tap signup |

## Prerequisites

- Node.js 18+
- A browser with WebAuthn support (Chrome 67+, Safari 14+, Firefox 60+)
- Basic React knowledge

## Step 1: Install Dependencies

```bash
npm install @lazorkit/wallet @solana/web3.js
```

## Step 2: Configure the Provider

Wrap your app with `LazorkitProvider` to enable wallet functionality:

```tsx
// src/components/providers/LazorkitProvider.tsx
"use client";

import { LazorkitProvider } from "@lazorkit/wallet";
import { ReactNode } from "react";

const CONFIG = {
  // Solana RPC endpoint (use your own for production)
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com",

  // LazorKit portal handles passkey operations
  portalUrl: process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.lazor.sh",

  // Paymaster enables gasless transactions
  paymasterConfig: {
    paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL || "https://kora.devnet.lazorkit.com",
  },
};

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
```

## Step 3: Create the Connect Component

Use the `useWallet` hook to access authentication functions:

```tsx
// src/components/wallet/WalletConnect.tsx
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useState } from "react";

export function WalletConnect() {
  const { connect, disconnect, isConnected, isConnecting, smartWalletPubkey } = useWallet();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setError(null);
      // This triggers the browser's WebAuthn prompt
      // feeMode: "paymaster" enables gasless transactions
      await connect({ feeMode: "paymaster" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  if (isConnected && smartWalletPubkey) {
    return (
      <div>
        <p>Connected: {smartWalletPubkey.toString().slice(0, 8)}...</p>
        <button onClick={handleDisconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={handleConnect} disabled={isConnecting}>
        {isConnecting ? "Authenticating..." : "Connect with Passkey"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
```

## Step 4: Understanding the Flow

When `connect()` is called:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User clicks   │────▶│  Browser shows  │────▶│  LazorKit SDK   │
│ "Connect" button│     │ WebAuthn prompt │     │ creates wallet  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  App receives   │◀────│  Smart wallet   │◀────│  Passkey stored │
│  wallet pubkey  │     │  deployed onchain│    │  in Secure Enclave│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **WebAuthn Prompt**: Browser asks for biometric (Face ID/Touch ID/Windows Hello)
2. **Passkey Creation**: Credential stored in device's Secure Enclave
3. **Smart Wallet**: LazorKit deploys a program-derived address (PDA) on Solana
4. **Session**: Public key returned to your app for display/transactions

## Step 5: Add to Your App Layout

```tsx
// src/app/layout.tsx
import { LazorkitProviderWrapper } from "@/components/providers/LazorkitProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LazorkitProviderWrapper>
          {children}
        </LazorkitProviderWrapper>
      </body>
    </html>
  );
}
```

## Common Issues & Solutions

### "WebAuthn not supported"
Ensure you're using HTTPS (localhost is exempt) and a supported browser.

### "User cancelled"
User dismissed the biometric prompt. This is expected behavior - catch and show a friendly message.

### "Passkey already exists"
The user has a passkey from a previous session. Use `connect()` to authenticate with the existing passkey.

## Next Steps

- [Tutorial 2: Gasless Transactions](./02-gasless-transactions.md) - Send tokens without paying fees
- [Tutorial 3: Session Persistence](./03-session-persistence.md) - Remember users across visits

## Resources

- [LazorKit Documentation](https://docs.lazorkit.com/)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
