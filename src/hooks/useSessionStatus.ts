/**
 * Tracks session for "welcome back" message and session cleanup.
 */
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useEffect, useState } from "react";

const SESSION_KEY = "lazorkit_session";
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useSessionStatus() {
  const { isConnected, smartWalletPubkey } = useWallet();
  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem(SESSION_KEY);

      if (isConnected && smartWalletPubkey) {
        localStorage.setItem(SESSION_KEY, Date.now().toString());
        setIsReturningUser(false);
      } else if (stored) {
        const lastActive = parseInt(stored, 10);
        if (Date.now() - lastActive > SESSION_EXPIRY_MS) {
          localStorage.removeItem(SESSION_KEY);
          setIsReturningUser(false);
        } else {
          setIsReturningUser(true);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isConnected, smartWalletPubkey]);

  const clearSession = () => localStorage.removeItem(SESSION_KEY);

  return { isReturningUser, clearSession };
}
