# Tutorial 3: Session Persistence

Learn how to maintain user sessions across page refreshes and browser restarts.

## What You'll Build

A persistent session system that:
- Remembers connected wallets across page refreshes
- Automatically reconnects returning users
- Handles session expiry gracefully
- Works across browser tabs

## How LazorKit Sessions Work

LazorKit automatically manages session state:

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Storage                          │
├─────────────────────────────────────────────────────────────┤
│  IndexedDB: Passkey credential references                   │
│  LocalStorage: Session metadata (wallet pubkey, timestamps) │
│  Secure Enclave: Actual passkey (never exposed to JS)       │
└─────────────────────────────────────────────────────────────┘
```

**Key insight**: The passkey itself never leaves the device's secure hardware. LazorKit only stores references that allow re-authentication.

## Step 1: Understanding Built-in Persistence

LazorKit's `useWallet` hook automatically handles basic persistence:

```tsx
import { useWallet } from "@lazorkit/wallet";

function WalletStatus() {
  const { isConnected, smartWalletPubkey, isLoading } = useWallet();

  // isLoading is true while LazorKit checks for existing session
  if (isLoading) {
    return <p>Checking session...</p>;
  }

  // If a previous session exists, isConnected will be true
  if (isConnected) {
    return <p>Welcome back! {smartWalletPubkey?.toString().slice(0, 8)}...</p>;
  }

  return <p>Please connect your wallet</p>;
}
```

## Step 2: Create a Session Status Hook

Build a custom hook to expose session state:

```tsx
// src/hooks/useSessionStatus.ts
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useEffect, useState } from "react";

export type SessionStatus = "loading" | "connected" | "disconnected" | "expired";

export function useSessionStatus() {
  const { isConnected, smartWalletPubkey } = useWallet();
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [lastActive, setLastActive] = useState<Date | null>(null);

  useEffect(() => {
    // Check localStorage for session metadata
    const stored = localStorage.getItem("lazorkit_session");

    if (isConnected && smartWalletPubkey) {
      // Active session
      setStatus("connected");
      setLastActive(new Date());

      // Update session timestamp
      localStorage.setItem(
        "lazorkit_session",
        JSON.stringify({
          pubkey: smartWalletPubkey.toString(),
          lastActive: new Date().toISOString(),
        })
      );
    } else if (stored) {
      // Had a session but not connected - might be expired
      const session = JSON.parse(stored);
      const lastActiveDate = new Date(session.lastActive);
      const hoursSinceActive = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceActive > 24) {
        setStatus("expired");
        localStorage.removeItem("lazorkit_session");
      } else {
        setStatus("disconnected");
        setLastActive(lastActiveDate);
      }
    } else {
      setStatus("disconnected");
    }
  }, [isConnected, smartWalletPubkey]);

  return { status, lastActive };
}
```

## Step 3: Show Session Status in UI

```tsx
// src/components/wallet/SessionIndicator.tsx
"use client";

import { useSessionStatus } from "@/hooks/useSessionStatus";

export function SessionIndicator() {
  const { status, lastActive } = useSessionStatus();

  const statusConfig = {
    loading: { color: "gray", text: "Checking session..." },
    connected: { color: "green", text: "Connected" },
    disconnected: { color: "yellow", text: "Session available" },
    expired: { color: "red", text: "Session expired" },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <span className="text-sm">{config.text}</span>
      {lastActive && status === "disconnected" && (
        <span className="text-xs text-gray-500">
          Last active: {lastActive.toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
```

## Step 4: Auto-Reconnect Returning Users

Prompt users to reconnect if they have a previous session:

```tsx
// src/components/wallet/AutoReconnect.tsx
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { useState } from "react";

export function AutoReconnect() {
  const { connect } = useWallet();
  const { status } = useSessionStatus();
  const [isReconnecting, setIsReconnecting] = useState(false);

  if (status !== "disconnected") return null;

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await connect({ feeMode: "paymaster" });
    } catch (err) {
      console.error("Reconnect failed:", err);
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <p className="text-sm text-blue-800 mb-2">
        Welcome back! Your previous session is available.
      </p>
      <button
        onClick={handleReconnect}
        disabled={isReconnecting}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {isReconnecting ? "Reconnecting..." : "Reconnect Wallet"}
      </button>
    </div>
  );
}
```

## Step 5: Handle Session Expiry

Clear stale sessions and prompt for fresh authentication:

```tsx
// src/components/wallet/SessionExpired.tsx
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useSessionStatus } from "@/hooks/useSessionStatus";

export function SessionExpired() {
  const { connect } = useWallet();
  const { status } = useSessionStatus();

  if (status !== "expired") return null;

  const handleNewSession = async () => {
    // Clear old session data
    localStorage.removeItem("lazorkit_session");

    // Start fresh authentication
    await connect({ feeMode: "paymaster" });
  };

  return (
    <div className="p-4 bg-yellow-50 rounded-lg">
      <p className="text-sm text-yellow-800 mb-2">
        Your session has expired. Please sign in again.
      </p>
      <button
        onClick={handleNewSession}
        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
      >
        Sign In
      </button>
    </div>
  );
}
```

## Step 6: Cross-Tab Synchronization

Keep session state in sync across browser tabs:

```tsx
// src/hooks/useCrossTabSync.ts
"use client";

import { useEffect } from "react";

export function useCrossTabSync(onSessionChange: () => void) {
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "lazorkit_session") {
        onSessionChange();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [onSessionChange]);
}
```

Usage:

```tsx
function App() {
  const { refetch } = useWallet();

  useCrossTabSync(() => {
    // Another tab changed the session, refresh our state
    refetch();
  });

  return <YourApp />;
}
```

## Session Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Journey                              │
└─────────────────────────────────────────────────────────────────┘

First Visit:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Land on │───▶│  Click   │───▶│ Biometric│───▶│  Wallet  │
│   page   │    │ Connect  │    │  prompt  │    │ created! │
└──────────┘    └──────────┘    └──────────┘    └──────────┘

Return Visit (within 24h):
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Land on │───▶│  See     │───▶│ Biometric│───▶│  Wallet  │
│   page   │    │"Reconnect"│   │  prompt  │    │ restored!│
└──────────┘    └──────────┘    └──────────┘    └──────────┘

Return Visit (after 24h):
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Land on │───▶│   See    │───▶│ Biometric│───▶│  Fresh   │
│   page   │    │"Expired" │    │  prompt  │    │ session! │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

## Security Considerations

### What's Stored Locally

| Data | Storage | Security |
|------|---------|----------|
| Passkey | Secure Enclave | Hardware-protected, never exposed |
| Credential ID | IndexedDB | Reference only, useless without passkey |
| Wallet pubkey | LocalStorage | Public data, no security risk |
| Timestamps | LocalStorage | Metadata only |

### Best Practices

1. **Never store private keys** - LazorKit handles this securely
2. **Use session timeouts** - Expire inactive sessions (24h recommended)
3. **Clear on logout** - Remove all session data when user disconnects
4. **Validate on reconnect** - Always verify the session is still valid

## Complete Session Manager

```tsx
// src/components/wallet/SessionManager.tsx
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useSessionStatus } from "@/hooks/useSessionStatus";

export function SessionManager({ children }: { children: React.ReactNode }) {
  const { isConnected } = useWallet();
  const { status } = useSessionStatus();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
```

## Next Steps

- Explore [LazorKit Advanced Features](https://docs.lazorkit.com/)
- See our [complete demo implementation](https://github.com/simiondolha/lazorkit-passkey-demo)
- Join the [LazorKit Telegram](https://t.me/lazorkit) for support
