# LazorKit Passkey Demo

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://lazorkit-passkey-demo-nine.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Solana](https://img.shields.io/badge/Solana-Devnet-purple)](https://solana.com/)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

> **[Try the Live Demo](https://lazorkit-passkey-demo-nine.vercel.app)** - Connect with Face ID, Touch ID, or Windows Hello

A production-ready starter template demonstrating **passkey authentication** and **gasless transactions** on Solana using [LazorKit SDK](https://lazorkit.com).

![Demo Screenshot](https://via.placeholder.com/800x400/030303/00F5D4?text=LazorKit+Passkey+Demo)

---

## What This Demo Shows

- **Passkey Login** - Authenticate with biometrics, no seed phrases
- **Smart Wallet** - Auto-deployed on-chain wallet (PDA)
- **Gasless Transfers** - Send SOL/USDC without holding SOL for fees
- **Session Persistence** - "Welcome back" for returning users
- **Production-Ready** - Security validation, error handling, TypeScript

---

## Why Passkeys > Seed Phrases

| Seed Phrases | Passkeys |
|--------------|----------|
| 24 words to remember | Face ID / Touch ID |
| Phishing vulnerable | Hardware-bound, unfishable |
| Requires wallet extension | Works in any browser |
| Complex onboarding | One-tap signup |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your App                                 │
├─────────────────────────────────────────────────────────────────┤
│  WalletConnect     WalletBalance      TransferForm              │
│       │                  │                  │                   │
│       └──────────────────┼──────────────────┘                   │
│                          ▼                                       │
│                    useWallet() Hook                              │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LazorKit SDK                                  │
├─────────────────────────────────────────────────────────────────┤
│  WebAuthn API ◄──► Secure Enclave (passkey storage)             │
│  Paymaster   ◄──► Sponsors transaction fees                     │
│  Portal      ◄──► Smart wallet deployment                       │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Solana Network                                │
│  Smart Wallet (PDA) ◄──► SOL/USDC Transfers                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# Clone
git clone https://github.com/simiondolha/lazorkit-passkey-demo.git
cd lazorkit-passkey-demo

# Install
npm install

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with LazorKit provider
│   ├── page.tsx            # Main page
│   └── globals.css         # Void Terminal theme
├── components/
│   ├── providers/
│   │   └── LazorkitProvider.tsx   # SDK configuration
│   └── wallet/
│       ├── WalletConnect.tsx      # Passkey auth UI
│       ├── WalletBalance.tsx      # SOL/USDC display
│       └── TransferForm.tsx       # Gasless transfers
├── hooks/
│   ├── useSessionStatus.ts        # Session persistence
│   ├── useTransfer.ts             # Reusable transfer logic
│   └── useBalance.ts              # Balance fetching
└── lib/
    └── validation.ts              # Security utilities
docs/
├── 01-passkey-authentication.md   # Tutorial: Passkey setup
├── 02-gasless-transactions.md     # Tutorial: Send tokens
└── 03-session-persistence.md      # Tutorial: Remember users
```

---

## Tutorials

### 1. [Passkey Authentication](./docs/01-passkey-authentication.md)
Set up WebAuthn login with Face ID, Touch ID, or Windows Hello.

### 2. [Gasless Transactions](./docs/02-gasless-transactions.md)
Send SOL and USDC without users needing SOL for fees.

### 3. [Session Persistence](./docs/03-session-persistence.md)
Remember users across browser sessions with "Welcome back" flow.

---

## Configuration

Create `.env.local` for custom settings:

```env
# Solana RPC (default: Devnet)
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com

# LazorKit Portal
NEXT_PUBLIC_PORTAL_URL=https://portal.lazor.sh

# Paymaster for gasless transactions
NEXT_PUBLIC_PAYMASTER_URL=https://kora.devnet.lazorkit.com
```

---

## API Reference

### LazorkitProvider

```tsx
<LazorkitProvider
  rpcUrl="https://api.devnet.solana.com"
  portalUrl="https://portal.lazor.sh"
  paymasterConfig={{ paymasterUrl: "..." }}
>
  {children}
</LazorkitProvider>
```

### useWallet Hook

| Method | Description |
|--------|-------------|
| `connect({ feeMode })` | Initiate passkey authentication |
| `disconnect()` | Sign out and clear session |
| `signAndSendTransaction({ instructions })` | Sign with passkey, send gasless |
| `smartWalletPubkey` | Connected wallet address |
| `isConnected` | Connection status |

---

## Reusable Hooks

```tsx
import { useTransfer, useBalance, useSessionStatus } from "@/hooks";

// Transfer tokens
const { transfer, isLoading } = useTransfer();
await transfer({ recipient: "...", amount: 1.0, token: "SOL" });

// Get balances
const { balances } = useBalance();
console.log(balances.sol, balances.usdc);

// Check session status
const { isReturningUser } = useSessionStatus();
```

---

## Get Test Tokens

- **SOL**: [faucet.solana.com](https://faucet.solana.com)
- **USDC**: [faucet.circle.com](https://faucet.circle.com)

---

## Deploy

### Vercel (One Click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/simiondolha/lazorkit-passkey-demo)

### Manual

```bash
npm run build
npx vercel --prod
```

---

## Resources

- [LazorKit Docs](https://docs.lazorkit.com)
- [LazorKit GitHub](https://github.com/lazor-kit)
- [LazorKit Telegram](https://t.me/lazorkit)
- [WebAuthn Guide](https://webauthn.guide)

---

## License

MIT

---

*Built for [Superteam Vietnam Bounty](https://earn.superteam.fun/listing/integrate-passkey-technology-with-lazorkit-to-10x-solana-ux)*
