# Tutorial 2: Gasless Transactions

Learn how to send SOL and USDC without users needing to hold SOL for transaction fees.

## What You'll Build

A token transfer feature that:
- Sends SOL or USDC to any Solana address
- Pays transaction fees via LazorKit's paymaster (gasless!)
- Signs transactions with the user's passkey

## How Gasless Works

Traditional Solana transactions require SOL for fees. LazorKit's paymaster sponsors these fees:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Your App  │────▶│  LazorKit   │────▶│   Solana    │
│  (signs tx) │     │  Paymaster  │     │  Network    │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    Pays fees in
                    USDC on behalf
                    of user
```

**Result**: Users can send tokens even with 0 SOL balance!

## Prerequisites

- Completed [Tutorial 1: Passkey Authentication](./01-passkey-authentication.md)
- Connected wallet with some Devnet SOL or USDC

## Step 1: Install Token Libraries

```bash
npm install @solana/spl-token
```

## Step 2: Create the Transfer Component

```tsx
// src/components/wallet/TransferForm.tsx
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useState } from "react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// Devnet USDC mint (different from mainnet!)
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

type Token = "SOL" | "USDC";

export function TransferForm() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<Token>("SOL");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTransfer = async () => {
    if (!smartWalletPubkey || !recipient || !amount) return;

    setLoading(true);
    setResult(null);

    try {
      const recipientPubkey = new PublicKey(recipient);
      const parsedAmount = parseFloat(amount);

      // Build the appropriate instruction based on token type
      const instruction =
        token === "SOL"
          ? // Native SOL transfer (9 decimals)
            SystemProgram.transfer({
              fromPubkey: smartWalletPubkey,
              toPubkey: recipientPubkey,
              lamports: Math.floor(parsedAmount * LAMPORTS_PER_SOL),
            })
          : // USDC SPL token transfer (6 decimals)
            createTransferInstruction(
              getAssociatedTokenAddressSync(USDC_MINT, smartWalletPubkey, true),
              getAssociatedTokenAddressSync(USDC_MINT, recipientPubkey),
              smartWalletPubkey,
              Math.floor(parsedAmount * 1_000_000),
              [],
              TOKEN_PROGRAM_ID
            );

      // Sign with passkey and send via paymaster (GASLESS!)
      const signature = await signAndSendTransaction({
        instructions: [instruction],
        transactionOptions: { feeToken: "USDC" }, // Paymaster pays fees
      });

      setResult({
        success: true,
        message: `Transaction sent! Signature: ${signature.slice(0, 20)}...`,
      });
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Transfer failed",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return <p>Connect wallet to transfer</p>;
  }

  return (
    <div>
      <h3>Send {token}</h3>

      {/* Token Selector */}
      <div>
        <button onClick={() => setToken("SOL")} disabled={token === "SOL"}>
          SOL
        </button>
        <button onClick={() => setToken("USDC")} disabled={token === "USDC"}>
          USDC
        </button>
      </div>

      {/* Recipient Input */}
      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />

      {/* Amount Input */}
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="0"
        step="any"
      />

      {/* Send Button */}
      <button onClick={handleTransfer} disabled={loading || !recipient || !amount}>
        {loading ? "Signing..." : `Send ${token}`}
      </button>

      {/* Result Display */}
      {result && (
        <p style={{ color: result.success ? "green" : "red" }}>{result.message}</p>
      )}
    </div>
  );
}
```

## Step 3: Understanding the Code

### Token Addresses (ATAs)

For SPL tokens like USDC, we use Associated Token Accounts:

```typescript
// Get the sender's USDC account
const senderATA = getAssociatedTokenAddressSync(
  USDC_MINT,           // Token mint address
  smartWalletPubkey,   // Wallet owner
  true                 // Allow PDA owners (required for smart wallets!)
);

// Get the recipient's USDC account
const recipientATA = getAssociatedTokenAddressSync(
  USDC_MINT,
  recipientPubkey
);
```

### The Paymaster Magic

```typescript
const signature = await signAndSendTransaction({
  instructions: [instruction],
  transactionOptions: {
    feeToken: "USDC",  // This tells LazorKit to use the paymaster
  },
});
```

When `feeToken: "USDC"` is set:
1. LazorKit's paymaster adds a fee payment instruction
2. User only signs the transfer (via passkey)
3. Paymaster submits and pays the network fee
4. User's SOL balance remains untouched!

## Step 4: Input Validation (Security)

Always validate user inputs before creating transactions:

```typescript
// Validate Solana address format
function validateAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// Validate amount is reasonable
function validateAmount(amount: string, max: number): boolean {
  const parsed = parseFloat(amount);
  return !isNaN(parsed) && parsed > 0 && parsed <= max;
}
```

## Step 5: View on Explorer

After a successful transaction, link to Solana Explorer:

```typescript
const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
```

## Token Decimals Reference

| Token | Decimals | 1.0 = |
|-------|----------|-------|
| SOL | 9 | 1,000,000,000 lamports |
| USDC | 6 | 1,000,000 micro-units |

```typescript
// Converting human amounts to on-chain values
const solLamports = amount * LAMPORTS_PER_SOL;  // amount * 10^9
const usdcUnits = amount * 1_000_000;            // amount * 10^6
```

## Common Issues & Solutions

### "Insufficient balance"
User doesn't have enough tokens. Check balance before transfer.

### "Account does not exist"
Recipient's token account doesn't exist. For USDC, you may need to create it first (adds ~0.002 SOL rent).

### "Transaction simulation failed"
Usually means the instruction is malformed. Verify addresses and amounts.

## Get Devnet Tokens

- **SOL**: Visit [faucet.solana.com](https://faucet.solana.com)
- **USDC**: Use a Devnet faucet or swap SOL for USDC on a Devnet DEX

## Next Steps

- [Tutorial 3: Session Persistence](./03-session-persistence.md) - Remember users across visits
- Explore more [LazorKit features](https://docs.lazorkit.com/)

## Full Example

See the complete implementation in our demo:
- [TransferForm.tsx](../src/components/wallet/TransferForm.tsx)
- [validation.ts](../src/lib/validation.ts) - Input validation utilities
