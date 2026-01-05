# LazorKit Passkey Demo

> **Live Demo**: [lazorkit-passkey-demo-nine.vercel.app](https://lazorkit-passkey-demo-nine.vercel.app)

A production-ready example demonstrating **passkey-based authentication** and **gasless transactions** on Solana using [LazorKit SDK](https://lazorkit.com).

## Features

- **Passkey Authentication** - Sign in with Face ID, Touch ID, or Windows Hello
- **Smart Wallet Creation** - Automatic on-chain wallet deployment
- **Gasless Transactions** - Send SOL and USDC without holding SOL for fees
- **Session Persistence** - Wallet state persists across browser sessions
- **Responsive Design** - Works on desktop and mobile browsers

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- A browser with WebAuthn support (Chrome, Safari, Edge, Firefox)

### Installation

```bash
# Clone the repository
git clone https://github.com/simiondolha/lazorkit-passkey-demo.git
cd lazorkit-passkey-demo

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
lazorkit-passkey-demo/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with LazorKit provider
│   │   ├── page.tsx            # Main application page
│   │   └── globals.css         # Global styles
│   └── components/
│       ├── providers/
│       │   └── LazorkitProviderWrapper.tsx  # LazorKit context provider
│       └── wallet/
│           ├── WalletConnect.tsx   # Passkey connection component
│           ├── WalletBalance.tsx   # Balance display component
│           └── TransferForm.tsx    # Gasless transfer form
├── package.json
└── README.md
```

## Configuration

The demo uses default Devnet configuration:

```typescript
const LAZORKIT_CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
};
```

For production, update these values in `src/components/providers/LazorkitProviderWrapper.tsx`.

---

# Tutorial 1: Creating a Passkey Wallet

This tutorial walks through implementing passkey-based wallet authentication using LazorKit SDK.

## Step 1: Install Dependencies

```bash
npm install @lazorkit/wallet @coral-xyz/anchor @solana/web3.js
```

## Step 2: Set Up the Provider

Create a provider wrapper component that configures LazorKit:

```tsx
// src/components/providers/LazorkitProviderWrapper.tsx
"use client";

import { LazorkitProvider } from "@lazorkit/wallet";
import { ReactNode } from "react";

const CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
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

## Step 3: Wrap Your Application

Add the provider to your root layout:

```tsx
// src/app/layout.tsx
import { LazorkitProviderWrapper } from "@/components/providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LazorkitProviderWrapper>{children}</LazorkitProviderWrapper>
      </body>
    </html>
  );
}
```

## Step 4: Create the Wallet Connect Component

Use the `useWallet` hook to handle passkey authentication:

```tsx
// src/components/wallet/WalletConnect.tsx
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useState } from "react";

export function WalletConnect() {
  const {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    smartWalletPubkey,
  } = useWallet();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setError(null);
      // Initiate passkey authentication
      // This triggers biometric prompt (Face ID/Touch ID/Windows Hello)
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

## How Passkey Authentication Works

1. **User clicks "Connect"** - Triggers the WebAuthn flow
2. **Browser shows biometric prompt** - Face ID, Touch ID, or Windows Hello
3. **Credential created/retrieved** - Passkey stored in device Secure Enclave
4. **Smart wallet deployed** - LazorKit deploys a PDA-based smart wallet on-chain
5. **Session persisted** - Wallet state cached in localStorage for return visits

### Key Concepts

- **No seed phrases**: Private keys never leave the device's Secure Enclave
- **Phishing resistant**: WebAuthn credentials are bound to the origin domain
- **Cross-device support**: Passkeys can sync via iCloud Keychain or Google Password Manager

---

# Tutorial 2: Sending Gasless Transactions

This tutorial demonstrates how to send SOL and SPL tokens without the user needing SOL for gas fees.

## How Gasless Transactions Work

LazorKit uses a **Paymaster** service that sponsors transaction fees. The user signs the transaction with their passkey, and the Paymaster submits it to the network, covering the SOL fee.

## Step 1: Create the Transfer Component

```tsx
// src/components/wallet/TransferForm.tsx
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useState } from "react";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export function TransferForm() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const handleTransfer = async () => {
    if (!smartWalletPubkey || !recipient || !amount) return;

    setIsLoading(true);
    try {
      // Create a standard SOL transfer instruction
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: new PublicKey(recipient),
        lamports: Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL),
      });

      // Sign with passkey and send via paymaster (gasless!)
      const signature = await signAndSendTransaction({
        instructions: [instruction],
        transactionOptions: {
          feeToken: "USDC", // Paymaster handles fees
        },
      });

      setTxSignature(signature);
    } catch (err) {
      console.error("Transfer failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return <p>Connect wallet to send transactions</p>;
  }

  return (
    <div>
      <h3>Send SOL (Gasless)</h3>

      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />

      <input
        type="number"
        placeholder="Amount (SOL)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={handleTransfer} disabled={isLoading}>
        {isLoading ? "Signing..." : "Send SOL"}
      </button>

      {txSignature && (
        <p>
          Success!{" "}
          <a
            href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
            target="_blank"
          >
            View on Explorer
          </a>
        </p>
      )}
    </div>
  );
}
```

## Step 2: Sending SPL Tokens (USDC)

For SPL token transfers, use the `@solana/spl-token` library:

```tsx
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// USDC on Devnet
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

const handleUsdcTransfer = async () => {
  if (!smartWalletPubkey) return;

  const senderAta = getAssociatedTokenAddressSync(
    USDC_MINT,
    smartWalletPubkey,
    true // allowOwnerOffCurve for PDAs
  );

  const recipientAta = getAssociatedTokenAddressSync(
    USDC_MINT,
    new PublicKey(recipient)
  );

  // USDC has 6 decimals
  const tokenAmount = Math.floor(parseFloat(amount) * 1_000_000);

  const instruction = createTransferInstruction(
    senderAta,
    recipientAta,
    smartWalletPubkey,
    tokenAmount,
    [],
    TOKEN_PROGRAM_ID
  );

  const signature = await signAndSendTransaction({
    instructions: [instruction],
    transactionOptions: { feeToken: "USDC" },
  });
};
```

## Transaction Flow

1. **Build instruction** - Create standard Solana instructions
2. **Call signAndSendTransaction** - LazorKit opens passkey prompt
3. **User authenticates** - Biometric scan signs the transaction
4. **Paymaster sponsors** - Transaction submitted with sponsored fees
5. **Confirmation** - Returns transaction signature

### Key Points

- Users don't need SOL for gas fees
- Works with any Solana instruction (transfers, swaps, NFT mints, etc.)
- Transaction is signed locally using the passkey
- Paymaster service handles fee payment

---

## API Reference

### LazorkitProvider Props

| Prop | Type | Description |
|------|------|-------------|
| `rpcUrl` | `string` | Solana RPC endpoint |
| `portalUrl` | `string` | LazorKit portal URL |
| `paymasterConfig` | `object` | Paymaster configuration |

### useWallet Hook

| Property | Type | Description |
|----------|------|-------------|
| `connect` | `(options?) => Promise<WalletInfo>` | Initiate passkey auth |
| `disconnect` | `() => Promise<void>` | Sign out |
| `isConnected` | `boolean` | Connection status |
| `isConnecting` | `boolean` | Loading during connection |
| `smartWalletPubkey` | `PublicKey \| null` | Smart wallet address |
| `signAndSendTransaction` | `(payload) => Promise<string>` | Sign and send tx |
| `signMessage` | `(message) => Promise<object>` | Sign arbitrary message |

---

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Getting Test Tokens

1. **Get Devnet SOL**: Visit [Solana Faucet](https://faucet.solana.com/)
2. **Get Devnet USDC**: Use [Circle's Devnet Faucet](https://faucet.circle.com/)

---

## Resources

- [LazorKit Documentation](https://docs.lazorkit.com)
- [LazorKit GitHub](https://github.com/lazor-kit)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn/)

## License

MIT

---

*Built for the [Superteam Vietnam Bounty](https://earn.superteam.fun/listing/integrate-passkey-technology-with-lazorkit-to-10x-solana-ux)*
