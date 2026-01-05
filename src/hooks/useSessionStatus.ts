/**
 * useSessionStatus Hook
 *
 * Tracks the current session state and provides metadata about
 * the user's connection history. Useful for showing "welcome back"
 * messages and handling session expiry.
 *
 * States:
 * - loading: Checking for existing session
 * - connected: Active wallet connection
 * - disconnected: No active connection, but may have previous session
 * - expired: Previous session is too old (>24h)
 */
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useEffect, useState } from "react";

export type SessionStatus = "loading" | "connected" | "disconnected" | "expired";

const SESSION_KEY = "lazorkit_session";
const SESSION_EXPIRY_HOURS = 24;

interface SessionData {
  pubkey: string;
  lastActive: string;
}

export function useSessionStatus() {
  const { isConnected, smartWalletPubkey } = useWallet();
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [lastActive, setLastActive] = useState<Date | null>(null);

  useEffect(() => {
    // Small delay to let LazorKit initialize
    const timer = setTimeout(() => {
      const stored = localStorage.getItem(SESSION_KEY);

      if (isConnected && smartWalletPubkey) {
        // Active session - update storage
        setStatus("connected");
        setLastActive(new Date());

        const sessionData: SessionData = {
          pubkey: smartWalletPubkey.toString(),
          lastActive: new Date().toISOString(),
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      } else if (stored) {
        // Check if previous session is still valid
        try {
          const session: SessionData = JSON.parse(stored);
          const lastActiveDate = new Date(session.lastActive);
          const hoursSinceActive =
            (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60);

          if (hoursSinceActive > SESSION_EXPIRY_HOURS) {
            setStatus("expired");
            localStorage.removeItem(SESSION_KEY);
          } else {
            setStatus("disconnected");
            setLastActive(lastActiveDate);
          }
        } catch {
          // Invalid session data
          localStorage.removeItem(SESSION_KEY);
          setStatus("disconnected");
        }
      } else {
        setStatus("disconnected");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isConnected, smartWalletPubkey]);

  /** Clear stored session data */
  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setLastActive(null);
  };

  return {
    status,
    lastActive,
    clearSession,
    isReturningUser: status === "disconnected" && lastActive !== null,
  };
}
